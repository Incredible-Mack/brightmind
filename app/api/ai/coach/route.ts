import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createHash } from 'crypto'
import { MODELS, LIMITS, aiEnabled } from '@/lib/aiConfig'
import { templateCoach, type CoachNote, type CoachSummary } from '@/lib/coachTemplates'

// Short, cached coaching note for a child: after a lesson ("lesson_note") or for the week ("weekly_plan").
// Cost controls: rule-based text by default, one cached model call per child + progress snapshot,
// a daily cap per child and globally, a kill switch (AI_ENABLED=false), and a name-free input.

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost/brightmind-api'

const summarySchema = z.object({
  age_group: z.string().max(10),
  streak: z.number(),
  lessons_completed: z.number(),
  avg_score: z.number().nullable(),
  subjects: z.array(z.object({
    slug: z.string().max(40),
    level: z.enum(['new', 'weak', 'ok', 'strong']),
    avg: z.number().nullable(),
    done: z.number(),
    of: z.number(),
  })).max(12),
  next: z.array(z.object({
    title: z.string().max(80),
    reason: z.enum(['resume', 'review', 'next']),
  })).max(3),
  engine: z.object({
    skills_started: z.number(), skills_mastered: z.number(), skills_total: z.number(),
    weak_skills: z.array(z.string().max(80)).max(5), due_reviews: z.array(z.string().max(80)).max(5),
    active_days_14: z.number(),
    ready_for_checkpoint: z.array(z.string().max(80)).max(5).optional(),
  }).optional(),
})

const bodySchema = z.object({
  childId: z.number().int().positive(),
  kind: z.enum(['lesson_note', 'weekly_plan']),
  summary: summarySchema,
})

const noteSchema = z.object({
  child: z.string().min(1).max(220),
  parent: z.string().min(1).max(420),
  tips: z.array(z.string().max(160)).max(3),
})

function isoWeek(d = new Date()): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${t.getUTCFullYear()}-W${week}`
}

function clean(s: string): string {
  return s.replace(/<[^>]*>/g, '').replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim()
}

async function php(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`${API}/${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'X-Api-Token': token, Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`api ${res.status}`)
  return res.json()
}

export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof bodySchema>
  try {
    parsed = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const token = req.headers.get('x-api-token') ?? req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { childId, kind, summary } = parsed
  const fallback = (): CoachNote => templateCoach(summary as CoachSummary)

  // Both views (dashboard + parent) share one entry: same child, same week, same progress snapshot
  const hash = createHash('sha1').update(JSON.stringify(summary)).digest('hex').slice(0, 12)
  const key = `${kind}:${isoWeek()}:${hash}`

  try {
    // 1. Cache (this call also proves the token owns the child)
    const cached = await php(`api/ai.php?child_id=${childId}&key=${encodeURIComponent(key)}`, token)
    if (cached.hit) return NextResponse.json({ ...cached.payload, source: 'cache' })

    // 2. Rules only when AI is off or the caps are reached
    if (!aiEnabled()) return NextResponse.json({ ...fallback(), source: 'template' })
    const usage = await php(`api/ai.php?child_id=${childId}&usage=1`, token)
    if (usage.today >= LIMITS.dailyPerChild || usage.today_global >= LIMITS.dailyGlobal) {
      return NextResponse.json({ ...fallback(), source: 'template' })
    }

    // 3. One small model call
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const msg = await Promise.race([
      client.messages.create({
        model: MODELS.runtime,
        max_tokens: 350,
        temperature: 0.5,
        messages: [{
          role: 'user',
          content: `You write short coaching notes for a children's learning app (ages 3-14).
Use the placeholder {name} for the child's name. Never invent facts beyond the data. No emojis, no links.
Data (JSON): ${JSON.stringify(summary)}
Context: ${kind === 'weekly_plan' ? 'a plan for the coming week' : 'what to do after the lesson just finished'}.
Return JSON only: {"child":"<1-2 warm, simple sentences to the child, reading level for age ${summary.age_group}>","parent":"<2-3 sentences for the parent: strengths, what to practise>","tips":["<up to 3 short, practical tips>"]}`,
        }],
      }),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000)),
    ])
    const block = msg.content[0]
    if (block.type !== 'text') throw new Error('bad response')
    const match = block.text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('no json')
    const raw = noteSchema.parse(JSON.parse(match[0]))
    const note: CoachNote = {
      child: clean(raw.child),
      parent: clean(raw.parent),
      tips: raw.tips.map(clean).filter(Boolean),
    }

    // 4. Log the spend and remember the answer
    await Promise.allSettled([
      php('api/ai.php', token, {
        method: 'POST',
        body: JSON.stringify({ child_id: childId, usage: {
          kind, model: MODELS.runtime,
          input_tokens: msg.usage?.input_tokens ?? 0, output_tokens: msg.usage?.output_tokens ?? 0,
        } }),
      }),
      php('api/ai.php', token, { method: 'POST', body: JSON.stringify({ child_id: childId, key, payload: note }) }),
    ])
    return NextResponse.json({ ...note, source: 'ai' })
  } catch {
    // Any failure (network, bad JSON, timeout, 403 from the API) degrades to the free text
    return NextResponse.json({ ...fallback(), source: 'template' })
  }
}
