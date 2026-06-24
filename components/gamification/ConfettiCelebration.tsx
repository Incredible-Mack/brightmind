'use client'
import { useEffect } from 'react'
import confetti from 'canvas-confetti'

interface ConfettiCelebrationProps { trigger: boolean; intensity?: 'low' | 'high' }

export function ConfettiCelebration({ trigger, intensity = 'high' }: ConfettiCelebrationProps) {
  useEffect(() => {
    if (!trigger) return
    const count = intensity === 'high' ? 200 : 60
    confetti({
      particleCount: count,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#4ade80', '#eab308', '#3b82f6', '#a855f7', '#f97316'],
      ticks: 300,
    })
  }, [trigger, intensity])
  return null
}
