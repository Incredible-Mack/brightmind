export type AgeGroup = '0-5' | '6-8' | '9-11' | '12-14'
export type ReadingLevel      = 'none' | 'basic' | 'fluent'
export type MathLevel         = 'none' | 'counting' | 'arithmetic'
export type LearningStyle     = 'video' | 'activity' | 'mixed'
export type FocusTime         = 'short' | 'medium' | 'long'
export type LanguageBackground = 'english_first' | 'bilingual' | 'learning_english'
export type Interest =
  | 'animals' | 'space' | 'sports' | 'arts' | 'stories' | 'puzzles'

export interface LearningProfile {
  reading: ReadingLevel
  math: MathLevel
  style: LearningStyle
  focus: FocusTime
  language: LanguageBackground
  interests: Interest[]
}

export interface Child {
  id: string | number
  user_id: string | number
  name: string
  age: number
  avatar_seed: string
  created_at: string
  learning_profile?: LearningProfile | null
}

export interface ChildProfile {
  child_id: string
  age_group: AgeGroup
  xp: number
  level: number
  streak: number
  last_active: string
  lives: number
  max_lives: number
}

export interface ChildWithProfile extends Child {
  profile: ChildProfile
}

export const LEVEL_THRESHOLDS: { xp: number; name: string }[] = [
  { xp: 0,    name: 'Seedling' },
  { xp: 100,  name: 'Sprout' },
  { xp: 250,  name: 'Bud' },
  { xp: 500,  name: 'Bloom' },
  { xp: 900,  name: 'Explorer' },
  { xp: 1400, name: 'Adventurer' },
  { xp: 2000, name: 'Scholar' },
  { xp: 2700, name: 'Expert' },
  { xp: 3500, name: 'Master' },
  { xp: 4500, name: 'Champion' },
]

export function getLevelFromXP(xp: number): { level: number; name: string; nextXP: number; prevXP: number } {
  let level = 0
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].xp) { level = i; break }
  }
  const name = LEVEL_THRESHOLDS[level].name
  const prevXP = LEVEL_THRESHOLDS[level].xp
  const nextXP = LEVEL_THRESHOLDS[level + 1]?.xp ?? prevXP
  return { level, name, nextXP, prevXP }
}
