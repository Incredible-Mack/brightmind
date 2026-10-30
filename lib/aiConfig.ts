// Central switches for every Claude call. Defaults keep spend low:
//  - runtime calls use the small/cheap model, authoring (admin, batch) the larger one
//  - AI_ENABLED=false turns every runtime AI call off; the app falls back to rules and templates
export const MODELS = {
  runtime: process.env.AI_RUNTIME_MODEL ?? 'claude-haiku-5-5',
  author:  process.env.AI_AUTHOR_MODEL  ?? 'claude-sonnet-5-5',
}

export const LIMITS = {
  dailyPerChild:  Number(process.env.AI_DAILY_CAP_PER_CHILD ?? 6),
  dailyGlobal:    Number(process.env.AI_DAILY_CAP_GLOBAL ?? 500),
  // Safety net for the per-card routes (hints, borderline speech grading) on one server instance
  hourlyInstance: Number(process.env.AI_MAX_CALLS_PER_HOUR ?? 120),
}

export function aiEnabled(): boolean {
  return process.env.AI_ENABLED !== 'false' && Boolean(process.env.ANTHROPIC_API_KEY)
}

let windowStart = Date.now()
let used = 0

/** Returns false once this instance has used its hourly allowance. */
export function takeAiBudget(): boolean {
  const now = Date.now()
  if (now - windowStart > 60 * 60 * 1000) { windowStart = now; used = 0 }
  if (used >= LIMITS.hourlyInstance) return false
  used++
  return true
}
