'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Child } from '@/types/child'
import { getLevelFromXP } from '@/types/child'

export interface AppUser {
  id: number
  email: string
  role: 'parent' | 'admin'
}

interface AppState {
  user: AppUser | null
  child: Child | null
  xp: number
  level: number
  levelName: string
  lives: number
  maxLives: number
  streak: number
  aiTierUsed: 1 | 2 | 3 | null
  livesRefillAt: number | null

  setUser: (user: AppUser | null) => void
  setChild: (child: Child | null) => void
  addXP: (amount: number) => void
  loseLive: () => void
  refillLives: () => void
  setLives: (lives: number) => void
  setStreak: (streak: number) => void
  setAiTier: (tier: 1 | 2 | 3) => void
  setLivesRefillAt: (ts: number) => void
  resetSession: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      child: null,
      xp: 0,
      level: 0,
      levelName: 'Seedling',
      lives: 5,
      maxLives: 5,
      streak: 0,
      aiTierUsed: null,
      livesRefillAt: null,

      setUser: (user) => set({ user }),
      setChild: (child) => set({ child }),

      addXP: (amount) => {
        const newXP = get().xp + amount
        const { level, name } = getLevelFromXP(newXP)
        set({ xp: newXP, level, levelName: name })
      },

      loseLive: () => {
        const lives = Math.max(0, get().lives - 1)
        const livesRefillAt = lives < get().maxLives
          ? Date.now() + 4 * 60 * 60 * 1000
          : null
        set({ lives, livesRefillAt })
      },

      refillLives: () => set({ lives: get().maxLives, livesRefillAt: null }),

      setLives: (lives) => set({ lives }),

      setStreak: (streak) => set({ streak }),

      setAiTier: (tier) => set({ aiTierUsed: tier }),

      setLivesRefillAt: (ts) => set({ livesRefillAt: ts }),

      resetSession: () => set({ aiTierUsed: null }),
    }),
    {
      name: 'brightmind-store',
      partialize: (state) => ({
        user: state.user,
        child: state.child,
        xp: state.xp,
        level: state.level,
        levelName: state.levelName,
        lives: state.lives,
        maxLives: state.maxLives,
        streak: state.streak,
        livesRefillAt: state.livesRefillAt,
      }),
    }
  )
)
