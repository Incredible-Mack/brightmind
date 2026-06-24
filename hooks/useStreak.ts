'use client'
import { useAppStore } from '@/store/useAppStore'

export function useStreak() {
  const { streak, setStreak } = useAppStore()
  return { streak, setStreak }
}
