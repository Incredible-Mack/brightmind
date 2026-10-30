// Free, rule-based coaching text built from the mastery summary (see api/recommend.php).
// Used on its own when AI is off / capped, and as the fallback if the model call fails.
// "{name}" is replaced on the client, so no personal data ever has to reach the model.

export interface CoachSummary {
  age_group: string
  streak: number
  lessons_completed: number
  avg_score: number | null
  subjects: Array<{ slug: string; level: 'new' | 'weak' | 'ok' | 'strong'; avg: number | null; done: number; of: number }>
  next: Array<{ title: string; reason: 'resume' | 'review' | 'next' }>
  // Skill-level facts from the adaptive engine (present once the curriculum is loaded)
  engine?: {
    skills_started: number; skills_mastered: number; skills_total: number
    weak_skills: string[]; due_reviews: string[]; active_days_14: number
    ready_for_checkpoint?: string[]
  }
}

export interface CoachNote {
  child: string
  parent: string
  tips: string[]
}

const label = (slug: string) => slug.replace(/-/g, ' ')

export function templateCoach(s: CoachSummary): CoachNote {
  const weak = s.subjects.filter(x => x.level === 'weak').map(x => label(x.slug))
  const strong = s.subjects.filter(x => x.level === 'strong').map(x => label(x.slug))
  const next = s.next[0]

  let child: string
  if (s.lessons_completed === 0) {
    child = "Welcome, {name}! Let's take your first step together."
  } else if (next?.reason === 'resume') {
    child = `Great start, {name}! Let's finish "${next.title}".`
  } else if (next?.reason === 'review') {
    child = `You're getting better, {name}! Let's practise "${next.title}" once more.`
  } else if (s.streak >= 3) {
    child = `${s.streak} days in a row, {name}! Keep your streak going${next ? ` with "${next.title}"` : ''}!`
  } else {
    child = `Nice work, {name}! ${next ? `Ready for "${next.title}"?` : 'Pick any lesson you like.'}`
  }

  const parentBits: string[] = []
  if (s.lessons_completed === 0) {
    parentBits.push('{name} has not finished a lesson yet. Start with a short one to build confidence.')
  } else {
    parentBits.push(`{name} has completed ${s.lessons_completed} lesson${s.lessons_completed === 1 ? '' : 's'}${s.avg_score != null ? ` with an average score of ${s.avg_score}%` : ''}.`)
    if (strong.length) parentBits.push(`Strongest area: ${strong.join(', ')}.`)
    if (weak.length) parentBits.push(`Needs a little more practice: ${weak.join(', ')}.`)
  }
  const eng = s.engine
  if (eng) {
    if (eng.skills_mastered > 0) parentBits.push(`${eng.skills_mastered} skill${eng.skills_mastered === 1 ? '' : 's'} verified through checkpoints so far.`)
    if (eng.weak_skills.length) parentBits.push(`Skills to revisit: ${eng.weak_skills.slice(0, 3).join(', ')}.`)
    if (eng.active_days_14 > 0) parentBits.push(`Learned on ${eng.active_days_14} of the last 14 days.`)
  }

  const tips: string[] = []
  if (weak.length) tips.push(`Repeat a ${weak[0]} lesson this week; replays use fresh wording.`)
  if (next) tips.push(`Next up: "${next.title}".`)
  if (eng?.ready_for_checkpoint?.length) tips.push(`Ready to prove it: ask {name} to take the checkpoint for "${eng.ready_for_checkpoint[0]}".`)
  if (eng?.due_reviews.length) tips.push(`A quick review of "${eng.due_reviews[0]}" will help it stick.`)
  tips.push(s.streak > 0 ? 'A few minutes every day keeps the streak alive.' : 'Try a short session each day, even five minutes helps.')

  return { child, parent: parentBits.join(' '), tips: tips.slice(0, 3) }
}

export function fillName(text: string, name: string): string {
  return text.replace(/\{name\}/g, name)
}
