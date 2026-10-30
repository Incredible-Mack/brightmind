// In-lesson adaptation. Pure rules, no randomness and no network: the same answers always change the
// queue the same way. The server picks the starting run (api/lesson_plan.php); these rules then react
// to how the child is doing right now.
import type { Activity } from '@/types/activity'

export type PlanItem = Activity & { role?: string; tier?: number; skill_slug?: string }

export interface AdaptState {
  wrongStreak: number       // answers in a row that were not right first time
  firstTryStreak: number    // answers in a row that were right first time
  speakFails: number        // speaking items failed in a row
  checksSeen: number
  checksFirstTry: number
  eased: number             // how many easier items were slipped in (capped)
  stretched: number         // how many harder items were swapped in (capped)
}

export const initialAdaptState: AdaptState = {
  wrongStreak: 0, firstTryStreak: 0, speakFails: 0, checksSeen: 0, checksFirstTry: 0, eased: 0, stretched: 0,
}

export interface Outcome { passed: boolean; firstTry: boolean }

export interface AdaptResult {
  queue: PlanItem[]
  reserve: PlanItem[]
  state: AdaptState
  notice: string | null
}

const MAX_EASED = 2
const MAX_STRETCHED = 2

const tierOf = (a: PlanItem) => a.tier ?? 2
const isQuestion = (a: PlanItem) => a.role !== 'teach'

/**
 * @param queue    the run, including items already done
 * @param index    position of the item just finished
 * @param reserve  spare items from the same lesson, any tier
 */
export function adaptQueue(queue: PlanItem[], index: number, reserve: PlanItem[], state: AdaptState, outcome: Outcome): AdaptResult {
  const done = queue[index]
  let q = queue.slice()
  let r = reserve.slice()
  const s: AdaptState = { ...state }
  let notice: string | null = null

  s.wrongStreak = outcome.firstTry ? 0 : s.wrongStreak + 1
  s.firstTryStreak = outcome.firstTry ? s.firstTryStreak + 1 : 0
  if (done?.type === 'speak') s.speakFails = outcome.passed ? 0 : s.speakFails + 1

  // 1. Placement checks: two first-try passes in a row means the teaching cards are not needed
  if (done?.role === 'check') {
    s.checksSeen++
    if (outcome.firstTry) s.checksFirstTry++
    const checksLeft = q.slice(index + 1).some(a => a.role === 'check')
    if (!checksLeft && s.checksSeen >= 2 && s.checksFirstTry === s.checksSeen) {
      const before = q.length
      q = q.filter((a, i) => i <= index || a.role !== 'teach')
      if (q.length < before) notice = 'You already know this. Skipping ahead!'
    }
  }

  // 2. Two stumbles in a row: slip in an easier item of the same lesson
  if (s.wrongStreak >= 2 && s.eased < MAX_EASED) {
    const cur = tierOf(done ?? ({} as PlanItem))
    const pickIdx = r.findIndex(a => isQuestion(a) && a.type !== 'speak' && tierOf(a) < cur)
    const pick = pickIdx >= 0 ? pickIdx : r.findIndex(a => isQuestion(a) && a.type !== 'speak' && tierOf(a) <= cur)
    if (pick >= 0) {
      const [item] = r.splice(pick, 1)
      q.splice(index + 1, 0, item)
      s.eased++
      s.wrongStreak = 0
      notice = "Let's try an easier one first."
    }
  }

  // 3. Three right first time in a row: swap the next question for a harder one
  if (s.firstTryStreak >= 3 && s.stretched < MAX_STRETCHED) {
    const nextIdx = q.findIndex((a, i) => i > index && isQuestion(a) && a.role !== 'review')
    if (nextIdx >= 0) {
      const nextTier = tierOf(q[nextIdx])
      const harderIdx = r.findIndex(a => isQuestion(a) && tierOf(a) > nextTier)
      if (harderIdx >= 0) {
        const [harder] = r.splice(harderIdx, 1)
        const [removed] = q.splice(nextIdx, 1, harder)
        r.push(removed)
        s.stretched++
        s.firstTryStreak = 0
        notice = "You're flying! Here's a bigger challenge."
      }
    }
  }

  // 4. Speaking failed twice: drop the remaining speaking items rather than frustrate
  if (s.speakFails >= 2) {
    const before = q.length
    q = q.filter((a, i) => i <= index || a.type !== 'speak')
    if (q.length < before) { notice = "No problem, let's do something else."; s.speakFails = 0 }
  }

  return { queue: q, reserve: r, state: s, notice }
}
