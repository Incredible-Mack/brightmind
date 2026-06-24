'use client'
import { useAppStore } from '@/store/useAppStore'
import { getLevelFromXP } from '@/types/child'

export function useXP() {
  const { xp, level, levelName, addXP } = useAppStore()
  const { nextXP, prevXP } = getLevelFromXP(xp)
  const progressInLevel = xp - prevXP
  const requiredForLevel = nextXP - prevXP
  const progress = requiredForLevel > 0 ? (progressInLevel / requiredForLevel) * 100 : 100
  return { xp, level, levelName, nextXP, prevXP, progress, addXP }
}
