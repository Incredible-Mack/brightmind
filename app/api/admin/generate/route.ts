import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CONTENT_SCHEMAS: Record<string, string> = {
  listen: `{"prompt":"<sentence to read aloud>","audio_hint":"<short tip for child>"}
  OR for a letter: {"letter":"A","word":"Apple","visual":"🍎","audio_hint":"A says AY!"}
  OR for a number: {"number":3,"word":"three","objects":["⚽","⚽","⚽"],"audio_hint":"Count the balls!"}`,
  tap_answer: `{"question":"<question text>","options":["<A>","<B>","<C>","<D>"],"correct":"<one of the options verbatim>"}`,
  speak: `{"prompt":"<instruction shown to child>","expected":"<word or short phrase child must say>","hint":"<hint if they fail>"}`,
  type_answer: `{"question":"<instruction>","expected":"<exact word to type>"}`,
}

export async function POST(req: NextRequest) {
  try {
    const { lessonTitle, subject, ageGroup, activityType, count = 3, existingContent } = await req.json()

    if (!lessonTitle || !activityType) {
      return NextResponse.json({ error: 'lessonTitle and activityType are required' }, { status: 400 })
    }

    const schema = CONTENT_SCHEMAS[activityType] ?? CONTENT_SCHEMAS.listen
    const existing = existingContent ? `\nExisting activities already in this lesson:\n${JSON.stringify(existingContent, null, 2)}` : ''

    const prompt = `You are a curriculum designer for BrightMind, an AI-powered educational platform for children.

Lesson: "${lessonTitle}"
Subject: ${subject}
Age Group: ${ageGroup}
Activity Type: ${activityType}
Generate ${count} activities of this type.${existing}

Each activity's content must follow this JSON schema:
${schema}

Rules:
- Age group 0-5: very simple, single concepts, emoji-rich, 1–2 word answers
- Age group 6-8: simple sentences, phonics, basic math
- Age group 9-11: sentences, multi-step reasoning, complete answers
- Age group 12-14: complex concepts, paragraphs, analytical thinking
- For listen activities: teach ONE concept per activity
- For tap_answer: exactly 4 options, one clearly correct
- Make content engaging and child-friendly
- Do NOT repeat content from existing activities

Return ONLY a valid JSON array of ${count} objects, each with fields:
- type: "${activityType}"
- order_index: (sequential from 1)
- xp_value: (3-10 based on difficulty)
- content: (matching the schema above)

Example output format:
[
  {"type":"${activityType}","order_index":1,"xp_value":5,"content":{...}},
  ...
]`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (message.content[0] as { type: string; text: string }).text.trim()
    // Extract JSON array from response
    const match = raw.match(/\[[\s\S]*\]/)
    if (!match) return NextResponse.json({ error: 'AI did not return valid JSON' }, { status: 500 })
    const activities = JSON.parse(match[0])
    return NextResponse.json({ activities })
  } catch (err) {
    const msg = String(err)
    if (msg.includes('credit balance') || msg.includes('insufficient_quota')) {
      return NextResponse.json({ error: 'AI generation unavailable — Anthropic account has no credits. Add activities manually.' }, { status: 402 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
