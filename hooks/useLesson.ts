'use client'
import { useState, useCallback } from 'react'
import { api } from '@/lib/api'
import type { Lesson } from '@/types/lesson'
import type { Activity } from '@/types/activity'

export function useLesson(lessonId: string) {
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [lessonData, actData] = await Promise.all([
        api.lessons.get(Number(lessonId)),
        api.activities.byLesson(Number(lessonId)),
      ])
      setLesson(lessonData as unknown as Lesson)
      setActivities(actData as unknown as Activity[])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load lesson')
    } finally {
      setLoading(false)
    }
  }, [lessonId])

  return { lesson, activities, loading, error, load }
}
