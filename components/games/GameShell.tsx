'use client'
import { ReactNode, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Star, Heart, Trophy, RotateCcw, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import confetti from 'canvas-confetti'

interface GameShellProps {
  title: string
  emoji: string
  children: ReactNode
  accentColor?: string
  bgColor?: string
}

export function GameShell({
  title,
  emoji,
  children,
  accentColor = '#10b981',
  bgColor = '#f0fdf4',
}: GameShellProps) {
  const router = useRouter()
  const { xp, lives, maxLives } = useAppStore()

  return (
    <div
      className="min-h-screen font-nunito flex flex-col"
      style={{ background: bgColor }}
    >
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b-2 border-slate-100 px-4 py-2.5 flex items-center justify-between shadow-xs">
        <button
          type="button"
          onClick={() => router.push('/games')}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs transition-all border border-slate-200 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Games</span>
        </button>

        <div className="flex items-center gap-1.5 font-black text-sm">
          <span className="text-xl">{emoji}</span>
          <span className="text-slate-800">{title}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* XP */}
          <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
            <Star size={13} className="text-amber-500 fill-amber-400" />
            <span className="text-xs font-black text-amber-700">{xp} XP</span>
          </div>
          {/* Hearts */}
          <div className="flex items-center gap-0.5">
            {Array.from({ length: maxLives }).map((_, i) => (
              <Heart
                key={i}
                size={16}
                className={i < lives ? 'text-rose-500 fill-rose-400' : 'text-slate-200 fill-slate-200'}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Game Content */}
      <main className="flex-1 flex flex-col items-center justify-start py-6 px-4">
        {children}
      </main>
    </div>
  )
}

/* ─── Round-Complete Overlay ────────────────────────────────────────────── */
interface RoundResultProps {
  show: boolean
  xpEarned: number
  correct: number
  total: number
  onNext: () => void
  onExit: () => void
}

export function RoundResult({ show, xpEarned, correct, total, onNext, onExit }: RoundResultProps) {
  const isWin = correct >= Math.ceil(total * 0.6)

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-3xl shadow-2xl p-8 mx-4 max-w-sm w-full text-center border-4"
            style={{ borderColor: isWin ? '#10b981' : '#f59e0b' }}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <div className="text-5xl mb-3">{isWin ? '🏆' : '💪'}</div>
            <h2 className="text-2xl font-black text-slate-800 mb-1">
              {isWin ? 'Round Complete!' : 'Keep Going!'}
            </h2>
            <p className="text-slate-500 font-bold text-sm mb-4">
              {correct}/{total} correct
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2 inline-flex items-center gap-2 mb-6">
              <Star size={16} className="text-amber-500 fill-amber-400" />
              <span className="font-black text-amber-700 text-sm">+{xpEarned} XP earned!</span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onExit}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm border-2 border-slate-200 border-b-4 transition-all cursor-pointer"
              >
                <RotateCcw size={14} />
                Exit
              </button>
              <button
                type="button"
                onClick={onNext}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-white font-black text-sm border-2 border-b-4 transition-all cursor-pointer bg-emerald-500 hover:bg-emerald-600 border-emerald-600 border-b-emerald-700"
              >
                Next Round
                <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ─── Shared confetti burst helper ──────────────────────────────────────── */
export function burstConfetti(opts?: confetti.Options) {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.5 },
    colors: ['#facc15', '#10b981', '#6366f1', '#f472b6', '#38bdf8'],
    ...opts,
  })
}

/* ─── Shared Web Audio helper ───────────────────────────────────────────── */
export function playGameSound(type: 'correct' | 'wrong' | 'complete' | 'flip') {
  if (typeof window === 'undefined') return
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    if (ctx.state === 'suspended') ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === 'correct') {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(523.25, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.2)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    } else if (type === 'wrong') {
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(220, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.2)
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
    } else if (type === 'complete') {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(523.25, ctx.currentTime)
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1)
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2)
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.3)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    } else if (type === 'flip') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(400, ctx.currentTime)
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    }

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.6)
  } catch {}
}

