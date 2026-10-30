import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { MODELS, aiEnabled } from '@/lib/aiConfig'

// Admin only: ask the author model for ONE reworded copy of a lesson and store it as a DRAFT.
// Nothing reaches children until it is approved in /admin/variants.

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost/brightmind-api'

interface Act { order_index: number; type: string; xp_value?: number; content: Record<string, unknown> }

function bad(msg: string): never { throw new Error(msg) }

const UNSAFE = /<[a-z!/][^>]*>|https?:\/\/|www\./i

function optionText(o: unknown): string {
  return typeof o === 'string' ? o : String((o as { text?: unknown })?.text ?? '')
}

// A variant must keep the same slots and the same teaching target as the original
function validate(original: Act[], variant: unknown): Act[] {
  if (!Array.isArray(variant) || variant.length !== original.length) bad('Variant must have the same number of activities')
  const out: Act[] = []
  for (const orig of original) {
    const v = (variant as Act[]).find(x => Number(x?.order_index) === Number(orig.order_index))
    if (!v) bad(`Missing activity ${orig.order_index}`)
    if (v.type !== orig.type) bad(`Activity ${orig.order_index} changed type`)
    const c = v.content
    if (!c || typeof c !== 'object') bad(`Activity ${orig.order_index} has no content`)
    if (UNSAFE.test(JSON.stringify(c))) bad(`Activity ${orig.order_index} contains markup or links`)
    const oc = orig.content

    if (v.type === 'listen') {
      if (oc.letter && String(c.letter ?? '').toUpperCase() !== String(oc.letter).toUpperCase()) bad(`Activity ${orig.order_index}: letter must stay ${oc.letter}`)
      if (oc.number !== undefined && Number(c.number) !== Number(oc.number)) bad(`Activity ${orig.order_index}: number must stay ${oc.number}`)
      if (!oc.letter && oc.number === undefined && !String(c.prompt ?? c.text ?? '').trim()) bad(`Activity ${orig.order_index}: listen needs a prompt`)
    } else if (v.type === 'tap_answer') {
      const opts = Array.isArray(c.options) ? c.options.map(optionText) : []
      if (!String(c.question ?? '').trim() || opts.length !== 4 || new Set(opts).size !== 4) bad(`Activity ${orig.order_index}: needs a question and 4 distinct options`)
      if (!opts.includes(String(c.correct ?? ''))) bad(`Activity ${orig.order_index}: "correct" must match an option exactly`)
    } else if (v.type === 'speak') {
      if (!String(c.prompt ?? '').trim() || !String(c.expected ?? '').trim()) bad(`Activity ${orig.order_index}: speak needs prompt and expected`)
    } else if (v.type === 'type_answer') {
      if (!String(c.question ?? '').trim() || !String(c.expected ?? '').trim()) bad(`Activity ${orig.order_index}: type_answer needs question and expected`)
    }
    out.push({ order_index: orig.order_index, type: orig.type, xp_value: orig.xp_value, content: c })
  }
  return out
}

export async function POST(req: NextRequest) {
  try {
    const { lessonId } = await req.json()
    if (!lessonId) return NextResponse.json({ error: 'lessonId is required' }, { status: 400 })
    if (!aiEnabled()) return NextResponse.json({ error: 'AI is switched off (AI_ENABLED=false or no ANTHROPIC_API_KEY)' }, { status: 503 })

    const token = req.headers.get('x-api-token') ?? req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
    const auth = { 'X-Api-Token': token, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

    // Admin check first, so non-admins cannot spend model credits
    const probe = await fetch(`${API}/admin/variants.php?lesson_id=${Number(lessonId)}&status=draft`, { headers: auth, cache: 'no-store' })
    if (!probe.ok) return NextResponse.json({ error: 'Admin access required' }, { status: probe.status === 401 ? 401 : 403 })

    const [lessonRes, actsRes] = await Promise.all([
      fetch(`${API}/api/lessons.php?id=${Number(lessonId)}`, { cache: 'no-store' }),
      fetch(`${API}/api/activities.php?lesson_id=${Number(lessonId)}`, { cache: 'no-store' }),
    ])
    const lesson = await lessonRes.json()
    const original: Act[] = (await actsRes.json()).map((a: Act) => ({ order_index: a.order_index, type: a.type, xp_value: a.xp_value, content: a.content }))
    if (!original.length) return NextResponse.json({ error: 'Lesson has no activities' }, { status: 400 })

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const msg = await client.messages.create({
      model: MODELS.author,
      max_tokens: 4000,
      temperature: 0.8,
      messages: [{
        role: 'user',
        content: `You are a curriculum designer for Bright Steps, a learning app for children.
Lesson: "${lesson.title}" (age groups: ${JSON.stringify(lesson.age_groups)})

Here are the original activities as JSON:
${JSON.stringify(original)}

Write ONE alternative version of this lesson. Rules:
- Keep EXACTLY the same number of activities, the same order_index and the same type for each.
- Teach the same skill, with different wording, examples and distractors.
- listen activities for a letter must keep the same "letter"; for a number the same "number". You may change the example word, visual and audio_hint (keep audio_hint short and plain, no dashes).
- tap_answer: exactly 4 distinct options; "correct" must equal one option verbatim.
- speak / type_answer: keep "expected" short and easy to say or type.
- You may use the tokens {name} (child's name), {theme} and {theme_emoji} in prompts and questions, but not inside "expected", "correct" or options.
- Age-appropriate, kind, no links, no markup.
Return ONLY a JSON array of objects: [{"order_index":1,"type":"...","xp_value":N,"content":{...}}, ...]`,
      }],
    })
    const block = msg.content[0]
    if (block.type !== 'text') return NextResponse.json({ error: 'Unexpected AI response' }, { status: 502 })
    const m = block.text.match(/\[[\s\S]*\]/)
    if (!m) return NextResponse.json({ error: 'AI did not return JSON' }, { status: 502 })

    const checked = validate(original, JSON.parse(m[0]))

    const save = await fetch(`${API}/admin/variants.php`, {
      method: 'POST', headers: auth,
      body: JSON.stringify({ lesson_id: Number(lessonId), activities: checked, model: MODELS.author }),
    })
    const saved = await save.json()
    if (!save.ok) return NextResponse.json({ error: saved.error ?? 'Could not save draft' }, { status: 502 })
    console.info(`[variants] lesson=${lessonId} draft=${saved.id} tokens=${msg.usage?.input_tokens}+${msg.usage?.output_tokens}`)
    return NextResponse.json({ id: saved.id, status: 'draft' })
  } catch (e) {
    const text = e instanceof Error ? e.message : String(e)
    if (text.includes('credit balance') || text.includes('insufficient_quota')) {
      return NextResponse.json({ error: 'Anthropic account has no credits.' }, { status: 402 })
    }
    return NextResponse.json({ error: text }, { status: 422 })
  }
}
