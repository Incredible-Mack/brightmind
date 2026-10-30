import type { AgeGroup } from './child'

export type SubjectSlug = 'math' | 'english' | 'science' | 'social-studies' | 'life-skills' | 'creative-arts'

export interface Subject {
  id: string | number
  name: string
  slug: SubjectSlug
  icon: string
  color: string
  description: string
}

export interface Lesson {
  id: string | number
  subject_id: string | number
  title: string
  slug: string
  description: string
  age_groups: AgeGroup[]
  difficulty: 'easy' | 'medium' | 'hard'
  xp_reward: number
  concepts_count?: number
  activities_count?: number
  order_index: number
  thumbnail_url?: string | null
  subject_name?: string
  subject_icon?: string
  subject?: Subject
}

export interface LessonProgress {
  id: string
  child_id: string
  lesson_id: string
  status: 'not_started' | 'in_progress' | 'completed'
  score: number
  completed_at: string | null
  xp_earned: number
}
