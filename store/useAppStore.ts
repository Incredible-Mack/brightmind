'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Child } from '@/types/child'
import { getLevelFromXP } from '@/types/child'
import { api } from '@/lib/api'

// Heart cooldown: exactly 10 minutes per heart (600,000 ms)
export const REFILL_INTERVAL_MS = 10 * 60 * 1000

export interface CompletedLessonData {
  lessonId: number
  score: number
  xpEarned: number
  completedAt: string
}

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
  /** Paid account: hearts are unlimited. Set from the server on login and whenever the profile loads. */
  premium: boolean
  premiumUntil: string | null
  completedLessons: Record<number, CompletedLessonData>
  completeLesson: (lessonId: number, score: number, xp: number) => void

  setPremium: (premium: boolean, until?: string | null) => void
  setUser: (user: AppUser | null) => void
  setChild: (child: Child | null) => void
  addXP: (amount: number) => void
  loseLive: () => void
  refillLives: () => void
  checkLivesRefill: () => void
  setLives: (lives: number) => void
  setStreak: (streak: number) => void
  setAiTier: (tier: 1 | 2 | 3) => void
  setLivesRefillAt: (ts: number | null) => void
  hydrateProfile: (p: { xp?: number | string | null; streak?: number | string | null; lives?: number | string | null; max_lives?: number | string | null; premium?: boolean; premium_until?: string | null }) => void
  resetSession: () => void
  /** Forget everything about the signed-in family on this device (used when logging out) */
  clearAll: () => void
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
      premium: false,
      premiumUntil: null,
      completedLessons: {},
      completeLesson: (lessonId, score, xp) => {
        const current = get().completedLessons || {}
        const now = new Date().toISOString()
        const updated = {
          ...current,
          [lessonId]: {
            lessonId,
            score,
            xpEarned: xp,
            completedAt: now,
          },
        }
        get().addXP(xp)
        const newStreak = Math.max(1, (get().streak || 0) + 1)
        set({
          completedLessons: updated,
          streak: newStreak,
        })
      },

      setPremium: (premium, until = null) => set(premium ? { premium: true, premiumUntil: until, lives: get().maxLives, livesRefillAt: null } : { premium: false, premiumUntil: null }),
      setUser: (user) => set({ user }),
      setChild: (child) => set({ child }),

      addXP: (amount) => {
        const newXP = get().xp + amount
        const { level, name } = getLevelFromXP(newXP)
        set({ xp: newXP, level, levelName: name })
      },

      loseLive: () => {
        if (get().premium) return // paid accounts never lose hearts
        const max = get().maxLives
        const current = get().lives
        const newLives = Math.max(0, current - 1)
        
        let refillAt = get().livesRefillAt
        // If we just dropped below max lives, start the 10-minute timer for this heart
        if (newLives < max) {
          if (!refillAt || refillAt <= Date.now() || (refillAt - Date.now() > REFILL_INTERVAL_MS)) {
            refillAt = Date.now() + REFILL_INTERVAL_MS
          }
        } else {
          refillAt = null
        }

        set({ lives: newLives, livesRefillAt: refillAt })

        // Sync to server profile
        const childId = get().child?.id ? Number(get().child!.id) : null
        if (childId) {
          api.profile.update(childId, { lives: newLives }).catch(() => {})
        }
      },

      refillLives: () => {
        const max = get().maxLives
        set({ lives: max, livesRefillAt: null })
        const childId = get().child?.id ? Number(get().child!.id) : null
        if (childId) {
          api.profile.update(childId, { lives: max }).catch(() => {})
        }
      },

      checkLivesRefill: () => {
        if (get().premium) return
        const current = get().lives
        const max = get().maxLives

        if (current >= max) {
          if (get().livesRefillAt !== null) set({ livesRefillAt: null })
          return
        }

        const now = Date.now()
        let refillAt = get().livesRefillAt

        // Clamp any stale timers (e.g. from previous 4-hour bug)
        if (!refillAt || refillAt - now > REFILL_INTERVAL_MS) {
          refillAt = now + REFILL_INTERVAL_MS
          set({ livesRefillAt: refillAt })
        }

        // Check if 10-minute interval(s) have passed
        if (now >= refillAt) {
          const overtime = now - refillAt
          const restoredHearts = 1 + Math.floor(overtime / REFILL_INTERVAL_MS)
          const newLives = Math.min(max, current + restoredHearts)

          let nextRefill: number | null = null
          if (newLives < max) {
            const remainder = overtime % REFILL_INTERVAL_MS
            nextRefill = now + (REFILL_INTERVAL_MS - remainder)
          }

          set({ lives: newLives, livesRefillAt: nextRefill })

          const childId = get().child?.id ? Number(get().child!.id) : null
          if (childId) {
            api.profile.update(childId, { lives: newLives }).catch(() => {})
          }
        }
      },

      setLives: (lives) => {
        set({ lives })
        const childId = get().child?.id ? Number(get().child!.id) : null
        if (childId) {
          api.profile.update(childId, { lives }).catch(() => {})
        }
      },

      setStreak: (streak) => set({ streak }),

      setAiTier: (tier) => set({ aiTierUsed: tier }),

      setLivesRefillAt: (ts) => set({ livesRefillAt: ts }),

      // Load the server's numbers into the store (login, child switch, lesson completion)
      hydrateProfile: (p) => {
        if (p.premium !== undefined) get().setPremium(!!p.premium, p.premium_until ?? null)
        const xp = Number(p.xp ?? 0)
        const maxLives = Number(p.max_lives ?? get().maxLives) || 5
        const { level, name } = getLevelFromXP(xp)
        
        // Calculate any elapsed heart regeneration
        get().checkLivesRefill()
        const localLives = get().lives
        const serverLives = Math.min(maxLives, Number(p.lives ?? maxLives))

        // Take the higher between server and local regenerated lives
        const resolvedLives = Math.max(serverLives, localLives)
        let keepRefill = get().livesRefillAt
        if (resolvedLives < maxLives) {
          if (!keepRefill || keepRefill - Date.now() > REFILL_INTERVAL_MS) {
            keepRefill = Date.now() + REFILL_INTERVAL_MS
          }
        } else {
          keepRefill = null
        }

        set({ xp, level, levelName: name, streak: Number(p.streak ?? 0), lives: resolvedLives, maxLives, livesRefillAt: keepRefill })
      },

      resetSession: () => set({ aiTierUsed: null }),

      clearAll: () => set({
        user: null, child: null, xp: 0, level: 0, levelName: 'Seedling', lives: 5, streak: 0,
        aiTierUsed: null, livesRefillAt: null, premium: false, premiumUntil: null, completedLessons: {},
      }),
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
        premium: state.premium,
        premiumUntil: state.premiumUntil,
        completedLessons: state.completedLessons,
      }),
    }
  )
)
