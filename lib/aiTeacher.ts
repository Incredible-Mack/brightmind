import type { ActivityType } from '@/types/activity'
import type { AgeGroup } from '@/types/child'
import { MODELS, aiEnabled, takeAiBudget } from './aiConfig'
import {
  fallbackNarrate,
  fallbackGradeSpeech,
  fallbackHint,
  fallbackCelebrate,
} from './fallbackTeacher'

const STATIC = {
  narrate:      "Let's try this together!",
  gradePass:    "Great job! You got it right.",
  gradeFail:    "Good try! Let's try again.",
  hint:         "Look carefully and try once more.",
  celebrate:    "Amazing work today!",
}

async function callClaude(prompt: string, maxTokens: number, temperature: number): Promise<string> {
  if (!takeAiBudget()) throw new Error('AI hourly budget used up')
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const msg = await client.messages.create({
    model: MODELS.runtime,
    max_tokens: maxTokens,
    temperature,
    messages: [{ role: 'user', content: prompt }],
  })
  const block = msg.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type')
  return block.text.trim()
}

function tier1Available(): boolean {
  return aiEnabled()
}

// Narration is the most frequent call (once per card), so it never hits the model:
// the template pool is free, instant and varied enough.
export async function aiNarrate(params: {
  lessonId: string
  activityType: ActivityType
  content: string
  childName: string
  ageGroup: AgeGroup
}): Promise<{ speech: string; tier: 1 | 2 | 3 }> {
  try {
    const speech = fallbackNarrate({
      activityType: params.activityType,
      ageGroup: params.ageGroup,
      childName: params.childName,
    })
    return { speech, tier: 2 }
  } catch {
    return { speech: STATIC.narrate, tier: 3 }
  }
}

export async function aiGradeSpeech(params: {
  expected: string
  transcript: string
  subject: string
  ageGroup: AgeGroup
  childName: string
}): Promise<{ score: number; passed: boolean; feedback: string; tier: 1 | 2 | 3 }> {
  if (tier1Available()) {
    try {
      const prompt = `You are grading a child's spoken answer.
Child name: ${params.childName}, Age group: ${params.ageGroup}, Subject: ${params.subject}
Expected answer: "${params.expected}"
Child said: "${params.transcript}"
Return JSON only: {"score": 0-100, "passed": true/false, "feedback": "one short encouraging sentence"}
Score 70+ = passed. Be generous with similar-sounding words.`
      const raw = await Promise.race([
        callClaude(prompt, 200, 0.3),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000)),
      ])
      const json = JSON.parse(raw.replace(/```json\n?|\n?```/g, ''))
      console.info('[AITeacher] tier=1 route=grade-speech')
      return { ...json, tier: 1 }
    } catch (e) {
      console.info('[AITeacher] tier=1 failed, falling back to tier=2', e)
    }
  }
  try {
    const result = fallbackGradeSpeech({
      expected: params.expected,
      transcript: params.transcript,
      childName: params.childName,
    })
    console.info('[AITeacher] tier=2 route=grade-speech')
    return { ...result, tier: 2 }
  } catch (e) {
    console.info('[AITeacher] tier=2 failed, falling back to tier=3', e)
    return { score: 0, passed: false, feedback: STATIC.gradeFail, tier: 3 }
  }
}

export async function aiHint(params: {
  question: string
  childAnswer: string
  correctAnswer: string
  attempts: number
  activityType: ActivityType
}): Promise<{ hint: string; tier: 1 | 2 | 3 }> {
  if (tier1Available()) {
    try {
      const prompt = `Give a child a helpful hint. Attempts so far: ${params.attempts}.
Question: "${params.question}"
Child's answer: "${params.childAnswer}"
Correct answer: "${params.correctAnswer}"
Give ONE short hint (max 15 words) that guides without giving away the answer. No emojis.`
      const hint = await Promise.race([
        callClaude(prompt, 150, 0.7),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000)),
      ])
      console.info('[AITeacher] tier=1 route=hint')
      return { hint, tier: 1 }
    } catch (e) {
      console.info('[AITeacher] tier=1 failed, falling back to tier=2', e)
    }
  }
  try {
    const hint = fallbackHint({ activityType: params.activityType, attempts: params.attempts })
    console.info('[AITeacher] tier=2 route=hint')
    return { hint, tier: 2 }
  } catch (e) {
    console.info('[AITeacher] tier=2 failed, falling back to tier=3', e)
    return { hint: STATIC.hint, tier: 3 }
  }
}

// Lesson-complete messages are templates too; the personal touch comes from /api/ai/coach (cached).
export async function aiCelebrate(params: {
  lessonTitle: string
  xpEarned: number
  childName: string
}): Promise<{ message: string; tier: 1 | 2 | 3 }> {
  try {
    const message = fallbackCelebrate({
      childName: params.childName,
      lessonTitle: params.lessonTitle,
      xpEarned: params.xpEarned,
    })
    return { message, tier: 2 }
  } catch {
    return { message: STATIC.celebrate, tier: 3 }
  }
}
