'use client'
import { useState, useCallback } from 'react'
import { api, type PlanReason } from '@/lib/api'
import type { Lesson } from '@/types/lesson'
import type { Activity } from '@/types/activity'
import { personalizeContent, type PersonalizeContext } from '@/lib/personalize'

export const DEMO_LESSON: Lesson = {
  id: 0,
  subject_id: 1,
  subject_name: 'Maths Adventure',
  title: 'Numbers 1, 2, 3 Counting Adventure',
  slug: 'numbers-123-demo',
  description: 'Join Pip to explore numbers, count shiny stars, and speak out loud — completely free, no sign-in required!',
  age_groups: ['0-5', '6-8'],
  difficulty: 'easy',
  xp_reward: 55,
  activities_count: 9,
  order_index: 1,
}

export const DEMO_ACTIVITIES: Activity[] = [
  {
    id: 'demo-1',
    lesson_id: 0,
    type: 'listen',
    order_index: 1,
    xp_reward: 5,
    content: {
      number: 1,
      word: 'One',
      prompt: 'One! A single unit of an entity.',
      audio_hint: 'One! One means a single unit all by itself. This is one!',
      objects: ['⚽'],
    } as unknown as import('@/types/activity').ListenContent,
  },
  {
    id: 'demo-speak-1',
    lesson_id: 0,
    type: 'speak',
    order_index: 2,
    xp_reward: 10,
    content: {
      number: 1,
      word: 'One',
      prompt: 'Say the number 1 out loud',
      expected: 'one',
      audio_hint: 'Say the number 1 out loud!',
      objects: ['⚽'],
    } as unknown as import('@/types/activity').SpeakContent,
  },
  {
    id: 'demo-2',
    lesson_id: 0,
    type: 'tap_answer',
    order_index: 3,
    xp_reward: 5,
    content: {
      question: 'Which one is number 1?',
      options: [
        { id: '0', text: '1', correct: true },
        { id: '1', text: '2', correct: false },
        { id: '2', text: '3', correct: false },
      ],
      correct: '1',
    } as unknown as import('@/types/activity').TapAnswerContent,
  },
  {
    id: 'demo-3',
    lesson_id: 0,
    type: 'listen',
    order_index: 4,
    xp_reward: 5,
    content: {
      number: 2,
      word: 'Two',
      prompt: 'Two! A pair: one and one more.',
      audio_hint: 'Two! Two means a pair: one, and one more. This is two!',
      objects: ['⭐', '⭐'],
    } as unknown as import('@/types/activity').ListenContent,
  },
  {
    id: 'demo-speak-2',
    lesson_id: 0,
    type: 'speak',
    order_index: 5,
    xp_reward: 10,
    content: {
      number: 2,
      word: 'Two',
      prompt: 'Say the number 2 out loud',
      expected: 'two',
      audio_hint: 'Say the number 2 out loud!',
      objects: ['⭐', '⭐'],
    } as unknown as import('@/types/activity').SpeakContent,
  },
  {
    id: 'demo-4',
    lesson_id: 0,
    type: 'tap_answer',
    order_index: 6,
    xp_reward: 5,
    content: {
      question: 'How many stars do you see? ⭐ ⭐',
      options: [
        { id: '0', text: '1', correct: false },
        { id: '1', text: '2', correct: true },
        { id: '2', text: '4', correct: false },
      ],
      correct: '2',
    } as unknown as import('@/types/activity').TapAnswerContent,
  },
  {
    id: 'demo-5',
    lesson_id: 0,
    type: 'listen',
    order_index: 7,
    xp_reward: 5,
    content: {
      number: 3,
      word: 'Three',
      prompt: 'Three! A group of three items.',
      audio_hint: 'Three! Three means a group of three items together. This is three!',
      objects: ['🍎', '🍎', '🍎'],
    } as unknown as import('@/types/activity').ListenContent,
  },
  {
    id: 'demo-speak-3',
    lesson_id: 0,
    type: 'speak',
    order_index: 8,
    xp_reward: 10,
    content: {
      number: 3,
      word: 'Three',
      prompt: 'Say the number 3 out loud',
      expected: 'three',
      audio_hint: 'Say the number 3 out loud!',
      objects: ['🍎', '🍎', '🍎'],
    } as unknown as import('@/types/activity').SpeakContent,
  },
  {
    id: 'demo-6',
    lesson_id: 0,
    type: 'tap_answer',
    order_index: 9,
    xp_reward: 5,
    content: {
      question: 'Which number is Three?',
      options: [
        { id: '0', text: '3', correct: true },
        { id: '1', text: '2', correct: false },
        { id: '2', text: '1', correct: false },
      ],
      correct: '3',
    } as unknown as import('@/types/activity').TapAnswerContent,
  },
]

// childId + usePlan: ask the adaptive engine for this child's run of the lesson
export function useLesson(lessonId: string, childId?: number | null, ctx?: PersonalizeContext, usePlan = false) {
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [reserve, setReserve] = useState<Activity[]>([])
  const [reason, setReason] = useState<PlanReason>('new')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const fill = (acts: Activity[]) => ctx ? acts.map(a => ({ ...a, content: personalizeContent(a.content, ctx) })) : acts

    // Instant zero-auth demo lesson
    if (lessonId === 'demo' || lessonId === '0') {
      setLesson(DEMO_LESSON)
      setActivities(fill(DEMO_ACTIVITIES))
      setReserve([])
      setReason('new')
      setLoading(false)
      return
    }

    try {
      const lessonData = await api.lessons.get(Number(lessonId))
      setLesson(lessonData as unknown as Lesson)

      let items: Activity[] | null = null
      if (usePlan && childId) {
        try {
          const plan = await api.lessonPlan.get(Number(lessonId), childId)
          if (plan.items && (plan.items as unknown[]).length > 0) {
            items = plan.items as unknown as Activity[]
            setReserve(fill(plan.reserve as unknown as Activity[]))
            setReason(plan.reason)
          }
        } catch { /* fall back below */ }
      }
      if (!items || items.length === 0) {
        items = (await api.activities.byLesson(Number(lessonId), childId ?? undefined)) as unknown as Activity[]
        setReserve([])
        setReason('new')
      }
      setActivities(fill(items))
    } catch {
      // Offline fallback: if server is unreachable, use DEMO lesson so learners are NEVER blocked!
      setLesson(DEMO_LESSON)
      setActivities(fill(DEMO_ACTIVITIES))
      setReserve([])
      setReason('new')
    } finally {
      setLoading(false)
    }
  }, [lessonId, childId, ctx?.name, ctx?.interest, usePlan])

  return { lesson, activities, reserve, reason, loading, error, load }
}
