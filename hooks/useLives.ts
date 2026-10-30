'use client'
import { useEffect, useState, useCallback } from 'react'
import { useAppStore, REFILL_INTERVAL_MS } from '@/store/useAppStore'

export function useLives() {
  const {
    lives,
    maxLives,
    livesRefillAt,
    loseLive,
    refillLives,
    setLivesRefillAt,
    checkLivesRefill,
    premium,
  } = useAppStore()

  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    if (!livesRefillAt || lives >= maxLives) return 0
    return Math.max(0, Math.ceil((livesRefillAt - Date.now()) / 1000))
  })

  // Ticker to check refills and compute countdown
  const tick = useCallback(() => {
    checkLivesRefill()
    const now = Date.now()
    const currentRefill = useAppStore.getState().livesRefillAt
    const currentLives = useAppStore.getState().lives
    const max = useAppStore.getState().maxLives

    if (currentLives < max && currentRefill && currentRefill > now) {
      setSecondsRemaining(Math.max(0, Math.ceil((currentRefill - now) / 1000)))
    } else {
      setSecondsRemaining(0)
    }
  }, [checkLivesRefill])

  useEffect(() => {
    tick()
    const timer = setInterval(tick, 1000)

    const onFocus = () => tick()
    window.addEventListener('focus', onFocus)

    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
  }, [tick])

  const minutesUntil = Math.ceil(secondsRemaining / 60)
  const mins = Math.floor(secondsRemaining / 60)
  const secs = secondsRemaining % 60
  const formattedTime = `${mins}:${secs < 10 ? '0' : ''}${secs}`

  return {
    lives,
    maxLives,
    loseLive,
    refillLives,
    secondsRemaining,
    minutesUntilRefill: minutesUntil,
    formattedTime,
    premium,
  }
}
