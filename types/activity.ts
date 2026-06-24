export type ActivityType =
  | 'listen'
  | 'speak'
  | 'tap_answer'
  | 'type_answer'
  | 'video'
  | 'drag_drop'

export interface TapAnswerContent {
  question: string
  options: { id: string; text: string; correct: boolean }[]
  visual?: string
}

export interface ListenContent {
  text: string
  visual?: string
  pronunciation?: string
}

export interface SpeakContent {
  prompt: string
  expected: string
  visual?: string
}

export interface TypeAnswerContent {
  question: string
  visual?: string
}

export interface VideoWatchContent {
  video_id: string
  title: string
}

export interface DragDropContent {
  pairs: { id: string; item: string; target: string }[]
}

export type ActivityContent =
  | TapAnswerContent
  | ListenContent
  | SpeakContent
  | TypeAnswerContent
  | VideoWatchContent
  | DragDropContent

export interface Activity {
  id: string | number
  lesson_id: string | number
  type: ActivityType
  order_index: number
  content: ActivityContent
  expected_answer?: string | null
  xp_reward?: number
  xp_value?: number
}

export interface ActivityResult {
  id: string
  child_id: string
  activity_id: string
  passed: boolean
  transcript: string | null
  score: number
  attempts: number
  created_at: string
}
