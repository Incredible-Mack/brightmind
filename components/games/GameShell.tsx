'use client'
import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Star, Heart, Volume2, RotateCcw, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Pip } from '@/components/mascot/Pip'
import { AnimatedSun, DoodleCloud, DoodleStar } from '@/components/home/KidsDoodles'
import confetti from 'canvas-confetti'

export function speakGameText(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    window.speechSynthesis.cancel()
    const clean = text.replace(/[\?\=\.\_]/g, ' ').trim()
    const u = new SpeechSynthesisUtterance(clean)
    u.rate = 0.95
    u.pitch = 1.15
    window.speechSynthesis.speak(u)
  } catch {}
}

export function GamePromptCloud({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`relative mx-auto w-full max-w-md my-1 z-20 ${className}`}>
      {/* Cartoon Cloud Shape with smooth puffy circles */}
      <div className="relative bg-white rounded-[32px] sm:rounded-[40px] px-6 py-5 sm:py-6 shadow-xl shadow-sky-950/10 border-4 border-white text-center flex flex-col items-center justify-center">
        {/* Cloud bumps */}
        <div className="absolute -top-3 left-10 w-12 h-8 bg-white rounded-full pointer-events-none" />
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-10 bg-white rounded-full pointer-events-none" />
        <div className="absolute -top-3 right-10 w-14 h-8 bg-white rounded-full pointer-events-none" />
        <div className="relative z-10 w-full">
          {children}
        </div>
      </div>
    </div>
  )
}

export function GameMascotHill({
  speech = 'Choose the right answer!',
  className = '',
}: {
  speech?: string
  className?: string
}) {
  return (
    <div className={`relative w-full max-w-md mx-auto flex items-end justify-between px-3 sm:px-4 z-20 my-1 ${className}`}>
      {/* Pip Waving */}
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        className="flex items-end gap-1.5"
      >
        <div className="transform -scale-x-100">
          <Pip size="md" mood="excited" animate="idle" />
        </div>
        <motion.span
          animate={{ scale: [1, 1.25, 1], rotate: [0, 15, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-xl sm:text-2xl select-none"
        >
          ✨
        </motion.span>
      </motion.div>

      {/* Wooden Signpost */}
      <motion.div
        initial={{ rotate: -2 }}
        animate={{ rotate: [-2, 1, -2] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="relative bg-[#fef3c7] border-2 border-[#b45309] border-b-4 border-b-[#78350f] rounded-2xl px-4 py-2 shadow-md flex items-center gap-1.5 mb-1"
      >
        <span className="text-xs sm:text-sm font-black text-[#78350f] tracking-wide font-nunito leading-tight">
          {speech}
        </span>
        {/* Wooden nails */}
        <span className="w-1.5 h-1.5 rounded-full bg-[#78350f] absolute top-1 left-1.5 opacity-40" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#78350f] absolute top-1 right-1.5 opacity-40" />
      </motion.div>
    </div>
  )
}

export function GameOptionButton({
  children,
  onClick,
  disabled = false,
  status = 'idle',
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  status?: 'idle' | 'correct' | 'wrong'
  className?: string
}) {
  const isCorrect = status === 'correct'
  const isWrong = status === 'wrong'

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled && status === 'idle' ? { scale: 1.04 } : {}}
      whileTap={!disabled && status === 'idle' ? { scale: 0.95 } : {}}
      className={`relative w-full rounded-3xl py-4 sm:py-5 px-4 font-black text-3xl sm:text-4xl text-center select-none transition-all flex items-center justify-center cursor-pointer shadow-lg active:translate-y-1 active:border-b-2 ${
        isCorrect
          ? 'bg-[#22c55e] border-2 border-emerald-400 border-b-[6px] border-b-[#15803d] text-white shadow-emerald-500/30 scale-105'
          : isWrong
          ? 'bg-rose-100 border-2 border-rose-300 border-b-[6px] border-b-rose-400 text-rose-800'
          : 'bg-white border-2 border-white/90 border-b-[6px] border-b-slate-200 text-slate-800 hover:bg-sky-50/50'
      } ${className}`}
    >
      {children}
      {isCorrect && (
        <span className="absolute top-2 right-3 text-white text-base font-black">✓</span>
      )}
      {isWrong && (
        <span className="absolute top-2 right-3 text-rose-600 text-base font-black">✗</span>
      )}
    </motion.button>
  )
}

interface GameShellProps {
  title: string
  emoji: string
  children: ReactNode
  accentColor?: string
  bgColor?: string
  progress?: number
  totalProgress?: number
  onSpeak?: () => void
  promptText?: string
  mascotSpeech?: string
  hideHill?: boolean
  showMascot?: boolean
}

export function GameShell({
  title,
  emoji,
  children,
  accentColor = '#0284c7',
  progress,
  totalProgress,
  onSpeak,
  promptText,
  mascotSpeech,
  hideHill = false,
  showMascot = false,
}: GameShellProps) {
  const router = useRouter()
  const { xp, lives, maxLives } = useAppStore()

  const handleSpeak = () => {
    if (onSpeak) {
      onSpeak()
    } else if (promptText) {
      speakGameText(promptText)
    }
  }

  const hasProgress = progress !== undefined && totalProgress !== undefined
  const progressPct = hasProgress ? Math.min(100, Math.round((progress / totalProgress) * 100)) : 0

  return (
    <div className="min-h-screen font-nunito flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-[#38bdf8] via-[#7dd3fc] to-[#a7f3d0] selection:bg-amber-300">
      
      {/* Animated Sun in top-left */}
      <div className="absolute top-2 left-3 sm:left-6 w-16 h-16 sm:w-20 sm:h-20 pointer-events-none opacity-85 z-0">
        <AnimatedSun />
      </div>

      {/* Floating clouds in sky */}
      <DoodleCloud className="absolute top-5 left-20 sm:left-32 w-28 sm:w-40 h-14 sm:h-18 opacity-75 z-0" delay={0} />
      <DoodleCloud className="absolute top-4 right-6 sm:right-16 w-32 sm:w-44 h-16 sm:h-20 opacity-80 z-0" delay={1.8} />

      {/* Top Header Bar matching reference image */}
      <header className="sticky top-0 z-30 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between max-w-2xl mx-auto w-full">
        {/* Left: Circular Back Button */}
        <button
          type="button"
          onClick={() => router.push('/games')}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white shadow-md border-2 border-white flex items-center justify-center text-[#0284c7] hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          title="Back to Games"
        >
          <ArrowLeft size={20} strokeWidth={3} />
        </button>

        {/* Center: Progress Bar Pill or Game Title */}
        {hasProgress ? (
          <div className="flex items-center gap-2 bg-white/95 backdrop-blur-xs px-3 sm:px-4 py-1.5 rounded-full border-2 border-white shadow-md">
            <div className="w-24 sm:w-36 h-3 bg-slate-200/80 rounded-full overflow-hidden p-0.5">
              <motion.div
                className="h-full rounded-full bg-[#22c55e]"
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-700 font-nunito whitespace-nowrap">
              {progress} / {totalProgress}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-white/95 px-4 py-1.5 rounded-full border-2 border-white shadow-md">
            <span className="text-lg">{emoji}</span>
            <span className="text-slate-800 font-black text-xs sm:text-sm">{title}</span>
          </div>
        )}

        {/* Right: Speaker Button + XP Pill */}
        <div className="flex items-center gap-2">
          {(onSpeak || promptText) && (
            <button
              type="button"
              onClick={handleSpeak}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white shadow-md border-2 border-white flex items-center justify-center text-[#0284c7] hover:scale-105 active:scale-95 transition-transform cursor-pointer"
              title="Hear Question"
            >
              <Volume2 size={19} strokeWidth={2.5} />
            </button>
          )}

          {/* XP pill */}
          <div className="flex items-center gap-1 bg-amber-50 border-2 border-amber-200 rounded-full px-2.5 sm:px-3 py-1 shadow-xs">
            <Star size={13} className="text-amber-500 fill-amber-400" />
            <span className="text-xs font-black text-amber-800">{xp}</span>
          </div>
        </div>
      </header>

      {/* Main Game Stage */}
      <main className="flex-1 flex flex-col items-center justify-start py-2 px-3 sm:px-4 relative z-10 max-w-xl mx-auto w-full">
        {promptText && (
          <GamePromptCloud>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">
              {promptText}
            </h2>
          </GamePromptCloud>
        )}

        {showMascot && (
          <GameMascotHill speech={mascotSpeech} />
        )}

        {children}
      </main>

      {/* Rolling Green Hills & Daisies at Bottom */}
      {!hideHill && (
        <div className="w-full leading-none relative z-0 -mt-16 pointer-events-none">
          <svg viewBox="0 0 1440 180" preserveAspectRatio="none" className="w-full h-24 sm:h-36 block">
            <path d="M 0 60 Q 400 10 850 50 T 1440 30 L 1440 180 L 0 180 Z" fill="#86efac" opacity="0.6" />
            <path d="M 0 95 Q 420 40 900 80 T 1440 60 L 1440 180 L 0 180 Z" fill="#22c55e" />
            <g transform="translate(180, 110)">
              <circle cx="0" cy="0" r="5" fill="#ffffff" />
              <circle cx="0" cy="0" r="2" fill="#facc15" />
            </g>
            <g transform="translate(480, 130)">
              <circle cx="0" cy="0" r="4.5" fill="#ffffff" />
              <circle cx="0" cy="0" r="1.8" fill="#facc15" />
            </g>
            <g transform="translate(980, 105)">
              <circle cx="0" cy="0" r="5" fill="#ffffff" />
              <circle cx="0" cy="0" r="2" fill="#facc15" />
            </g>
            <g transform="translate(1280, 120)">
              <circle cx="0" cy="0" r="4" fill="#ffffff" />
              <circle cx="0" cy="0" r="1.6" fill="#facc15" />
            </g>
            {/* Cute ladybug on stone */}
            <g transform="translate(1360, 145)">
              <ellipse cx="0" cy="5" rx="14" ry="7" fill="#94a3b8" />
              <circle cx="-1" cy="0" r="6" fill="#ef4444" />
              <circle cx="3" cy="-1" r="2.5" fill="#1e293b" />
              <circle cx="-2" cy="-2" r="1" fill="#1e293b" />
              <circle cx="-3" cy="2" r="1" fill="#1e293b" />
            </g>
          </svg>
        </div>
      )}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-sm w-full text-center border-4 border-white"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <div className="text-5xl mb-2 animate-bounce">{isWin ? '🏆' : '💪'}</div>
            <h2 className="text-2xl font-black text-[#0f4c5c] mb-1">
              {isWin ? 'Round Complete!' : 'Keep Going!'}
            </h2>
            <p className="text-slate-500 font-bold text-sm mb-4">
              {correct}/{total} correct answers
            </p>
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl px-4 py-2 inline-flex items-center gap-2 mb-6 shadow-xs">
              <Star size={16} className="text-amber-500 fill-amber-400" />
              <span className="font-black text-amber-900 text-sm">+{xpEarned} XP earned!</span>
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
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-white font-black text-sm border-2 border-b-4 transition-all cursor-pointer bg-emerald-500 hover:bg-emerald-600 border-emerald-600 border-b-emerald-700 active:translate-y-0.5"
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
export function playGameSound(type: 'correct' | 'wrong' | 'complete' | 'flip' | 'pop') {
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
    } else if (type === 'flip' || type === 'pop') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(540, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(920, ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    }

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.6)
  } catch {}
}
