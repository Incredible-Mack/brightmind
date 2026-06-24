import type { ActivityType } from '@/types/activity'
import type { AgeGroup } from '@/types/child'
import {
  NARRATION_TEMPLATES,
  HINTS_BY_ACTIVITY,
  CELEBRATE_MESSAGES,
  CORRECT_FEEDBACKS,
  WRONG_FEEDBACKS,
} from './fallbackTeacher.data'

function interpolate(template: string, childName: string): string {
  return template.replace(/{name}/g, childName)
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

const DIGIT_WORDS: Record<string, string> = {
  '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
  '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
  '10': 'ten', '11': 'eleven', '12': 'twelve',
}

function normalizeNumbers(text: string): string {
  return text.replace(/\b\d+\b/g, n => DIGIT_WORDS[n] ?? n)
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
  return dp[m][n]
}

export function fallbackNarrate(params: {
  activityType: ActivityType
  ageGroup: AgeGroup
  childName: string
}): string {
  const templates = NARRATION_TEMPLATES[params.activityType]?.[params.ageGroup]
  if (!templates?.length) return `Let's try this together, ${params.childName}!`
  return interpolate(pick(templates), params.childName)
}

export function fallbackGradeSpeech(params: {
  expected: string
  transcript: string
  childName: string
}): { score: number; passed: boolean; feedback: string } {
  // Normalize both sides: lowercase, trim, convert digits to words ("1" → "one")
  const expected = normalizeNumbers(params.expected.toLowerCase().trim())
  const transcript = normalizeNumbers(params.transcript.toLowerCase().trim())
  const distance = levenshtein(expected, transcript)
  const raw = 100 - (distance / Math.max(expected.length, 1)) * 100
  const score = Math.max(0, Math.min(100, Math.round(raw)))
  // For short answers (≤ 8 chars), 60% threshold; longer counting sequences use 55%
  const threshold = expected.length <= 8 ? 60 : 55
  const passed = score >= threshold
  const feedback = passed
    ? interpolate(pick(CORRECT_FEEDBACKS), params.childName)
    : interpolate(pick(WRONG_FEEDBACKS), params.childName)
  return { score, passed, feedback }
}

export function fallbackHint(params: {
  activityType: ActivityType
  attempts: number
}): string {
  const hints = HINTS_BY_ACTIVITY[params.activityType]?.[0] ?? [
    'Look carefully and try once more.',
    'Take your time — you can do it!',
    'Almost there! Try one more time.',
  ]
  const idx = Math.min(params.attempts, hints.length - 1)
  return hints[idx]
}

export function fallbackCelebrate(params: {
  childName: string
  lessonTitle: string
  xpEarned: number
}): string {
  const msg = pick(CELEBRATE_MESSAGES)
  return `${msg} You earned ${params.xpEarned} XP!`
}
