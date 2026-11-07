'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameShell, RoundResult, burstConfetti, playGameSound } from '@/components/games/GameShell'
import { useAppStore } from '@/store/useAppStore'
import { getAgeGroup } from '@/lib/curriculum.data'
import type { AgeGroup } from '@/types/child'

/* ─── Emoji Sets ──────────────────────────────────────────────────────────── */

const EMOJI_EASY = ['🐶', '🐱', '🐸', '🦊', '🐣', '🦋', '🌸', '🍎'] // 8 pairs → 4×4
const EMOJI_HARD = [
  '🐶', '🐱', '🐸', '🦊', '🐣', '🦋', '🌸', '🍎',
  '🚀', '🎸', '🌈', '🦄',
] // 12 pairs → 6×4

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface Card {
  id: number       // unique per card instance
  pairId: number   // shared by the two cards that form a pair
  emoji: string
  isFlipped: boolean
  isMatched: boolean
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildDeck(ageGroup: AgeGroup, startFlipped = true): Card[] {
  const emojis = ageGroup === '0-5' || ageGroup === '6-8' ? EMOJI_EASY : EMOJI_HARD
  const pairs = [...emojis, ...emojis] // duplicate for pairs
  const shuffled = shuffle(pairs)
  return shuffled.map((emoji, idx) => ({
    id: idx,
    pairId: emojis.indexOf(emoji),
    emoji,
    isFlipped: startFlipped,
    isMatched: false,
  }))
}

function getGridCols(ageGroup: AgeGroup): number {
  return ageGroup === '9-11' || ageGroup === '12-14' ? 6 : 4
}

/* ─── Single Card Component ───────────────────────────────────────────────── */

interface CardTileProps {
  card: Card
  onClick: (id: number) => void
  disabled: boolean
}

function CardTile({ card, onClick, disabled }: CardTileProps) {
  const { isFlipped, isMatched } = card

  return (
    <div
      className="relative w-full"
      style={{ perspective: '600px', aspectRatio: '1 / 1' }}
      onClick={() => !disabled && !isFlipped && !isMatched && onClick(card.id)}
    >
      {/* Inner container that rotates */}
      <motion.div
        className="relative w-full h-full cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped || isMatched ? 180 : 0 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
      >
        {/* Back face (star pattern) */}
        <div
          className={[
            'absolute inset-0 rounded-2xl flex items-center justify-center',
            'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md',
            'cursor-pointer select-none border-2 border-white/30',
            disabled || isFlipped || isMatched ? 'cursor-default' : 'hover:scale-[1.03] transition-transform',
          ].join(' ')}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="text-2xl sm:text-3xl opacity-70 select-none">⭐</span>
        </div>

        {/* Front face (emoji) */}
        <div
          className={[
            'absolute inset-0 rounded-2xl flex items-center justify-center select-none border-2',
            isMatched
              ? 'bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-300 shadow-lg shadow-emerald-200'
              : 'bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200 shadow-md',
          ].join(' ')}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <motion.span
            className="text-2xl sm:text-3xl md:text-4xl"
            animate={isMatched ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.4 }}
          >
            {card.emoji}
          </motion.span>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── Main Game Component ─────────────────────────────────────────────────── */

export default function MemoryMatchPage() {
  const { child, addXP, loseLive } = useAppStore()

  const ageGroup: AgeGroup =
    (child as unknown as { age_group?: AgeGroup })?.age_group ||
    (child?.age ? getAgeGroup(child.age) : '0-5')

  const initialDuration = ageGroup === '9-11' || ageGroup === '12-14' ? 5 : 4

  /* ── State ── */
  const [deck, setDeck] = useState<Card[]>(() => buildDeck(ageGroup, true))
  const [isPreview, setIsPreview] = useState(true)
  const [previewSeconds, setPreviewSeconds] = useState(initialDuration)
  const [peeksLeft, setPeeksLeft] = useState(2)
  const [isPeeking, setIsPeeking] = useState(false)
  const [flipped, setFlipped] = useState<number[]>([])    // up to 2 card ids
  const [lockBoard, setLockBoard] = useState(true)       // locked during initial preview
  const [matchCount, setMatchCount] = useState(0)
  const [missStreak, setMissStreak] = useState(0)
  const [flipCount, setFlipCount] = useState(0)
  const [xpEarned, setXpEarned] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [timerActive, setTimerActive] = useState(false)  // starts after preview
  const [round, setRound] = useState(1)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const cols = getGridCols(ageGroup)
  const totalPairs = deck.length / 2

  /* ── Initial Preview Countdown ── */
  const finishPreview = useCallback(() => {
    setIsPreview(false)
    setLockBoard(false)
    setDeck(d => d.map(c => (c.isMatched ? c : { ...c, isFlipped: false })))
    setTimerActive(true)
    playGameSound('flip')
  }, [])

  useEffect(() => {
    if (!isPreview) return
    setLockBoard(true)
    const interval = setInterval(() => {
      setPreviewSeconds(sec => {
        if (sec <= 1) {
          clearInterval(interval)
          finishPreview()
          return 0
        }
        return sec - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isPreview, finishPreview])

  /* ── Peek Feature ── */
  const handlePeek = useCallback(() => {
    if (peeksLeft <= 0 || isPreview || isPeeking || lockBoard) return
    setPeeksLeft(p => p - 1)
    setIsPeeking(true)
    setLockBoard(true)
    playGameSound('flip')
    // Reveal all cards
    setDeck(d => d.map(c => ({ ...c, isFlipped: true })))
    setTimeout(() => {
      // Flip back unmatched cards
      setDeck(d => d.map(c => (c.isMatched ? c : { ...c, isFlipped: false })))
      setIsPeeking(false)
      setLockBoard(false)
      playGameSound('flip')
    }, 2400)
  }, [peeksLeft, isPreview, isPeeking, lockBoard])

  /* ── Timer ── */
  useEffect(() => {
    if (!timerActive) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerActive])

  /* ── Format timer ── */
  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  /* ── Card flip handler ── */
  const handleCardClick = useCallback((id: number) => {
    if (lockBoard || isPreview || isPeeking) return

    setFlipCount(c => c + 1)
    playGameSound('flip')

    setFlipped(prev => {
      const next = [...prev, id]

      if (next.length === 1) {
        // First flip — just track it
        setDeck(d => d.map(c => c.id === id ? { ...c, isFlipped: true } : c))
        return next
      }

      // Second flip
      setDeck(d => d.map(c => c.id === id ? { ...c, isFlipped: true } : c))
      setLockBoard(true)

      const [firstId] = prev
      const firstCard = deck.find(c => c.id === firstId)!
      const secondCard = deck.find(c => c.id === id)!

      if (firstCard.pairId === secondCard.pairId) {
        // ✅ Match!
        playGameSound('correct')
        const newMatchCount = matchCount + 1
        const gained = 5
        addXP(gained)
        setXpEarned(x => x + gained)
        setMatchCount(newMatchCount)
        setMissStreak(0)

        setDeck(d =>
          d.map(c =>
            c.id === firstId || c.id === id
              ? { ...c, isFlipped: true, isMatched: true }
              : c
          )
        )
        setLockBoard(false)

        // Check board complete
        if (newMatchCount === totalPairs) {
          setTimerActive(false)
          addXP(20)
          setXpEarned(x => x + 20)
          setTimeout(() => {
            burstConfetti()
            playGameSound('complete')
            setShowResult(true)
          }, 500)
        }
      } else {
        // ❌ Mismatch
        playGameSound('wrong')
        const newStreak = missStreak + 1
        setMissStreak(newStreak)
        if (newStreak >= 3) {
          loseLive()
          setMissStreak(0)
        }

        setTimeout(() => {
          setDeck(d =>
            d.map(c =>
              c.id === firstId || c.id === id
                ? { ...c, isFlipped: false }
                : c
            )
          )
          setLockBoard(false)
        }, 900)
      }

      return []
    })
  }, [lockBoard, isPreview, isPeeking, deck, matchCount, missStreak, totalPairs, addXP, loseLive])

  /* ── New round / reset ── */
  const startNewRound = useCallback(() => {
    const dur = ageGroup === '9-11' || ageGroup === '12-14' ? 5 : 4
    setDeck(buildDeck(ageGroup, true))
    setFlipped([])
    setIsPreview(true)
    setPreviewSeconds(dur)
    setPeeksLeft(2)
    setIsPeeking(false)
    setLockBoard(true)
    setMatchCount(0)
    setMissStreak(0)
    setFlipCount(0)
    setXpEarned(0)
    setShowResult(false)
    setElapsed(0)
    setTimerActive(false)
    setRound(r => r + 1)
  }, [ageGroup])

  /* ── Grid sizing classes ── */
  const gridColsClass =
    cols === 6
      ? 'grid-cols-6'
      : 'grid-cols-4'

  /* ─────────────────────────────────── JSX ─── */
  return (
    <GameShell
      title="Memory Match"
      emoji="🧠"
      accentColor="#6366f1"
      bgColor="#f5f3ff"
    >
      {/* Stats bar */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mb-4 text-sm font-black">
        {/* Timer */}
        <div className="flex items-center gap-1.5 bg-white border-2 border-indigo-100 rounded-2xl px-3.5 py-1.5 shadow-sm">
          <span className="text-base">⏱️</span>
          <span className="text-indigo-700 tabular-nums">{formatTime(elapsed)}</span>
        </div>

        {/* Flips */}
        <div className="flex items-center gap-1.5 bg-white border-2 border-violet-100 rounded-2xl px-3.5 py-1.5 shadow-sm">
          <span className="text-base">🔄</span>
          <span className="text-violet-700">{flipCount} flips</span>
        </div>

        {/* Matches */}
        <div className="flex items-center gap-1.5 bg-white border-2 border-emerald-100 rounded-2xl px-3.5 py-1.5 shadow-sm">
          <span className="text-base">✅</span>
          <span className="text-emerald-700">{matchCount}/{totalPairs}</span>
        </div>

        {/* Round */}
        <div className="flex items-center gap-1.5 bg-white border-2 border-amber-100 rounded-2xl px-3.5 py-1.5 shadow-sm">
          <span className="text-base">🎯</span>
          <span className="text-amber-700">Round {round}</span>
        </div>

        {/* Peek Button (when game active) */}
        {!isPreview && (
          <button
            type="button"
            onClick={handlePeek}
            disabled={peeksLeft <= 0 || lockBoard || isPeeking}
            className={`px-3 py-1.5 rounded-2xl border-2 border-b-4 font-black text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:translate-y-0.5 ${
              peeksLeft > 0 && !lockBoard && !isPeeking
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 border-b-amber-400'
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
            }`}
            title="Temporarily peek at cards"
          >
            <span>👁️</span>
            <span>Peek ({peeksLeft})</span>
          </button>
        )}
      </div>

      {/* Initial Preview Banner */}
      <AnimatePresence>
        {isPreview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className="mb-4 w-full max-w-md bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-200 text-amber-950 rounded-3xl p-3.5 sm:p-4 shadow-md border-2 border-amber-300 border-b-4 border-b-amber-400 flex items-center justify-between gap-3 font-nunito"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-2xl sm:text-3xl">👀</span>
              <div>
                <h3 className="font-black text-sm sm:text-base leading-tight">
                  Memorize the Cards!
                </h3>
                <p className="text-xs font-extrabold text-amber-800">
                  Flipping face down in{' '}
                  <span className="inline-block bg-white text-amber-900 px-2 py-0.5 rounded-lg font-black shadow-xs">
                    {previewSeconds}s
                  </span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={finishPreview}
              className="px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-black text-xs sm:text-sm border-2 border-amber-300 border-b-4 border-b-amber-400 shadow-sm active:translate-y-0.5 transition-all cursor-pointer whitespace-nowrap"
            >
              I&apos;m Ready! 🚀
            </button>
          </motion.div>
        )}

        {isPeeking && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 flex items-center justify-center gap-2 bg-amber-50 border-2 border-amber-300 rounded-2xl px-4 py-2 text-amber-800 font-black text-xs sm:text-sm"
          >
            <span>👁️</span>
            <span>Quick peek! Memorize their spots now!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Miss streak warning */}
      <AnimatePresence>
        {missStreak > 0 && !isPreview && !isPeeking && (
          <motion.div
            key="streak-warn"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 flex items-center gap-2 bg-rose-50 border-2 border-rose-200 rounded-2xl px-4 py-2 text-rose-700 font-bold text-sm"
          >
            <span>⚠️</span>
            <span>
              {missStreak === 1 && 'One mismatch — keep trying!'}
              {missStreak === 2 && '⚠️ Two mismatches — one more and you lose a heart!'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card grid */}
      <div
        className={`grid ${gridColsClass} gap-2 sm:gap-3 w-full`}
        style={{
          maxWidth: cols === 6 ? '640px' : '420px',
        }}
      >
        {deck.map(card => (
          <CardTile
            key={card.id}
            card={card}
            onClick={handleCardClick}
            disabled={lockBoard || isPreview || isPeeking}
          />
        ))}
      </div>

      {/* Completion result overlay */}
      <RoundResult
        show={showResult}
        xpEarned={xpEarned}
        correct={matchCount}
        total={totalPairs}
        onNext={startNewRound}
        onExit={() => {
          if (typeof window !== 'undefined') window.location.href = '/games'
        }}
      />
    </GameShell>
  )
}
