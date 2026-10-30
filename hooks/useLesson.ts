'use client'
import { useState, useCallback } from 'react'
import { api, type PlanReason } from '@/lib/api'
import type { Lesson } from '@/types/lesson'
import type { Activity } from '@/types/activity'
import { personalizeContent, type PersonalizeContext } from '@/lib/personalize'

// childId + usePlan: ask the adaptive engine for this child's run of the lesson (falls back to the
// plain activity list if the plan is unavailable)
// ctx: fills {name} / {theme} tokens in lesson text
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
    try {
      const lessonData = await api.lessons.get(Number(lessonId))
      setLesson(lessonData as unknown as Lesson)

      let items: Activity[] | null = null
      if (usePlan && childId) {
        try {
          const plan = await api.lessonPlan.get(Number(lessonId), childId)
          items = plan.items as unknown as Activity[]
          setReserve(fill(plan.reserve as unknown as Activity[]))
          setReason(plan.reason)
        } catch { /* fall back below */ }
      }
      if (!items) {
        items = (await api.activities.byLesson(Number(lessonId), childId ?? undefined)) as unknown as Activity[]
        setReserve([])
        setReason('new')
      }
      setActivities(fill(items))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load lesson')
    } finally {
      setLoading(false)
    }
  }, [lessonId, childId, ctx?.name, ctx?.interest, usePlan])

  return { lesson, activities, reserve, reason, loading, error, load }
}
