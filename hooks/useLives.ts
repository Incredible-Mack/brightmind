'use client'
import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'

export function useLives() {
  const { lives, maxLives, livesRefillAt, loseLive, refillLives, setLivesRefillAt } = useAppStore()

  useEffect(() => {
    if (lives >= maxLives || !livesRefillAt) return
    const remaining = livesRefillAt - Date.now()
    if (remaining <= 0) { refillLives(); return }
    const timer = setTimeout(() => {
      useAppStore.getState().setLives(Math.min(maxLives, lives + 1))
      if (lives + 1 >= maxLives) setLivesRefillAt(0)
    }, remaining)
    return () => clearTimeout(timer)
  }, [lives, maxLives, livesRefillAt, refillLives, setLivesRefillAt])

  const msUntilRefill = livesRefillAt ? Math.max(0, livesRefillAt - Date.now()) : 0
  const minutesUntil = Math.ceil(msUntilRefill / 60000)

  return { lives, maxLives, loseLive, refillLives, minutesUntilRefill: minutesUntil }
}
