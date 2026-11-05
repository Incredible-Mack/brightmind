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

export const ADDITION_LESSON: Lesson = {
  id: 5,
  subject_id: 1,
  subject_name: 'Maths Adventure',
  title: 'Adding Up: Fun with Addition',
  slug: 'math-addition-1',
  description: 'Join Pip to explore addition! Put groups of soccer balls and shiny stars together, count on your fingers, and say your answers out loud!',
  age_groups: ['0-5', '6-8'],
  difficulty: 'easy',
  xp_reward: 60,
  activities_count: 9,
  order_index: 5,
}

export const ADDITION_ACTIVITIES: Activity[] = [
  {
    id: 'add-1',
    lesson_id: 5,
    type: 'listen',
    order_index: 1,
    xp_reward: 5,
    content: {
      equation: '1 + 1 = 2',
      leftNum: 1,
      rightNum: 1,
      sum: 2,
      operation: 'add',
      prompt: 'Addition means putting groups together to find the total. One plus one equals two!',
      audio_hint: 'Addition means putting things together. One bouncy soccer ball plus one more soccer ball makes two soccer balls!',
      definition: 'Putting groups together to find the total',
      example: '1 bouncy soccer ball and 1 more soccer ball make 2 soccer balls!',
      actionPrompt: 'Hold up 1 finger on each hand! ☝️ ☝️ Count them together: 1... 2!',
      leftObjects: ['⚽'],
      rightObjects: ['⚽'],
      objects: ['⚽', '⚽'],
    } as unknown as import('@/types/activity').ListenContent,
  },
  {
    id: 'add-speak-1',
    lesson_id: 5,
    type: 'speak',
    order_index: 2,
    xp_reward: 10,
    content: {
      equation: '1 + 1 = ?',
      prompt: 'What is one plus one?',
      expected: 'two',
      audio_hint: 'What is one plus one? Say the answer out loud!',
      leftObjects: ['⚽'],
      rightObjects: ['⚽'],
      objects: ['⚽', '⚽'],
    } as unknown as import('@/types/activity').SpeakContent,
  },
  {
    id: 'add-tap-1',
    lesson_id: 5,
    type: 'tap_answer',
    order_index: 3,
    xp_reward: 5,
    content: {
      question: 'How many stars do you see in total? ⭐ + ⭐',
      options: [
        { id: '0', text: '1', correct: false },
        { id: '1', text: '2', correct: true },
        { id: '2', text: '3', correct: false },
      ],
      correct: '2',
    } as unknown as import('@/types/activity').TapAnswerContent,
  },
  {
    id: 'add-2',
    lesson_id: 5,
    type: 'listen',
    order_index: 4,
    xp_reward: 5,
    content: {
      equation: '2 + 1 = 3',
      leftNum: 2,
      rightNum: 1,
      sum: 3,
      operation: 'add',
      prompt: 'Two plus one equals three! Two shiny stars and one more star make three stars.',
      audio_hint: 'Two plus one equals three! Two shiny stars and one more star make three stars together!',
      definition: 'Adding one more makes the number grow',
      example: '2 shiny stars and 1 more star make 3 shiny stars!',
      actionPrompt: 'Count on your fingers: 1, 2... and 1 more makes 3! 🤟',
      leftObjects: ['⭐', '⭐'],
      rightObjects: ['⭐'],
      objects: ['⭐', '⭐', '⭐'],
    } as unknown as import('@/types/activity').ListenContent,
  },
  {
    id: 'add-speak-2',
    lesson_id: 5,
    type: 'speak',
    order_index: 5,
    xp_reward: 10,
    content: {
      equation: '2 + 1 = ?',
      prompt: 'What is two plus one?',
      expected: 'three',
      audio_hint: 'What is two plus one? Say the answer out loud!',
      leftObjects: ['⭐', '⭐'],
      rightObjects: ['⭐'],
      objects: ['⭐', '⭐', '⭐'],
    } as unknown as import('@/types/activity').SpeakContent,
  },
  {
    id: 'add-3',
    lesson_id: 5,
    type: 'listen',
    order_index: 6,
    xp_reward: 5,
    content: {
      equation: '2 + 2 = 4',
      leftNum: 2,
      rightNum: 2,
      sum: 4,
      operation: 'add',
      prompt: 'Two plus two equals four! Two delicious apples and two more apples make four apples.',
      audio_hint: 'Two plus two equals four! Two delicious apples and two more apples make four apples together!',
      definition: 'Two pairs together make four',
      example: '2 red apples and 2 more red apples make 4 red apples!',
      actionPrompt: 'Hold up 2 fingers on each hand! ✌️ ✌️ Count all 4 fingers!',
      leftObjects: ['🍎', '🍎'],
      rightObjects: ['🍎', '🍎'],
      objects: ['🍎', '🍎', '🍎', '🍎'],
    } as unknown as import('@/types/activity').ListenContent,
  },
  {
    id: 'add-speak-3',
    lesson_id: 5,
    type: 'speak',
    order_index: 7,
    xp_reward: 10,
    content: {
      equation: '2 + 2 = ?',
      prompt: 'What is two plus two?',
      expected: 'four',
      audio_hint: 'What is two plus two? Say the answer out loud!',
      leftObjects: ['🍎', '🍎'],
      rightObjects: ['🍎', '🍎'],
      objects: ['🍎', '🍎', '🍎', '🍎'],
    } as unknown as import('@/types/activity').SpeakContent,
  },
  {
    id: 'add-story-1',
    lesson_id: 5,
    type: 'tap_answer',
    order_index: 8,
    xp_reward: 5,
    content: {
      question: 'Tom has 3 sweets 🍬 and gets 2 more. How many sweets does Tom have in total?',
      options: [
        { id: '0', text: '4', correct: false },
        { id: '1', text: '5', correct: true },
        { id: '2', text: '6', correct: false },
      ],
      correct: '5',
    } as unknown as import('@/types/activity').TapAnswerContent,
  },
  {
    id: 'add-finale-1',
    lesson_id: 5,
    type: 'tap_answer',
    order_index: 9,
    xp_reward: 5,
    content: {
      question: 'What is 3 + 3 = ?',
      options: [
        { id: '0', text: '5', correct: false },
        { id: '1', text: '6', correct: true },
        { id: '2', text: '7', correct: false },
      ],
      correct: '6',
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

    // Instant addition lesson fallback
    if (lessonId === '5' || String(lessonId).toLowerCase().includes('addition')) {
      setLesson(ADDITION_LESSON)
      setActivities(fill(ADDITION_ACTIVITIES))
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
      // Offline fallback: if server is unreachable, serve appropriate lesson so learners are NEVER blocked!
      if (lessonId === '5' || String(lessonId).toLowerCase().includes('addition')) {
        setLesson(ADDITION_LESSON)
        setActivities(fill(ADDITION_ACTIVITIES))
      } else {
        setLesson(DEMO_LESSON)
        setActivities(fill(DEMO_ACTIVITIES))
      }
      setReserve([])
      setReason('new')
    } finally {
      setLoading(false)
    }
  }, [lessonId, childId, ctx?.name, ctx?.interest, usePlan])

  return { lesson, activities, reserve, reason, loading, error, load }
}
