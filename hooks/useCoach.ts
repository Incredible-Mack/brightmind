'use client'
import { useCallback, useState } from 'react'
import { api, type Recommendation } from '@/lib/api'
import { getToken } from '@/lib/auth'
import { useAppStore } from '@/store/useAppStore'
import { fillName, templateCoach, type CoachNote } from '@/lib/coachTemplates'

export interface Coach {
  rec: Recommendation | null
  note: (CoachNote & { source: string }) | null
  refresh: () => Promise<void>
}

// What should this child learn next + a short coaching note.
// The recommendation is rule-based (free); the note is cached server-side and only
// uses the model when the progress snapshot changed, so calling this is cheap.
export function useCoach(kind: 'lesson_note' | 'weekly_plan'): Coach {
  const child = useAppStore(s => s.child)
  const [rec, setRec] = useState<Recommendation | null>(null)
  const [note, setNote] = useState<Coach['note']>(null)

  const refresh = useCallback(async () => {
    if (!child) return
    const childId = Number(child.id)
    const name = child.name
    const personalise = (n: CoachNote): CoachNote => ({
      child: fillName(n.child, name),
      parent: fillName(n.parent, name),
      tips: n.tips.map(t => fillName(t, name)),
    })
    let r: Recommendation
    try {
      r = await api.recommend.get(childId)
      setRec(r)
    } catch { return }

    try {
      const token = getToken()
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'X-Api-Token': token } : {}) },
        body: JSON.stringify({ childId, kind, summary: r.summary }),
      })
      if (!res.ok) throw new Error('coach')
      const { source, ...n } = await res.json()
      setNote({ ...personalise(n as CoachNote), source })
    } catch {
      setNote({ ...personalise(templateCoach(r.summary)), source: 'template' })
    }
  }, [child, kind])

  return { rec, note, refresh }
}
