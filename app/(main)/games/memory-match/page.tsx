'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameShell, RoundResult, burstConfetti, playGameSound, GamePromptCloud, GameMascotHill, speakGameText } from '@/components/games/GameShell'
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
        className="relative w-full h-full cursor-pointer select-none"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped || isMatched ? 180 : 0 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        whileHover={!disabled && !isFlipped && !isMatched ? { scale: 1.05 } : {}}
        whileTap={!disabled && !isFlipped && !isMatched ? { scale: 0.95 } : {}}
      >
        {/* Back face (Glossy Blue / Indigo with golden star & 3D bevel) */}
        <div
          className={[
            'absolute inset-0 rounded-2xl sm:rounded-3xl flex items-center justify-center',
            'bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1]',
            'border-2 border-white/80 border-b-[5px] border-b-[#075985]',
            'shadow-lg shadow-sky-950/15',
            disabled || isFlipped || isMatched ? 'cursor-default' : 'cursor-pointer',
          ].join(' ')}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 flex items-center justify-center shadow-inner">
            <span className="text-2xl sm:text-3xl select-none filter drop-shadow">⭐</span>
          </div>
        </div>

        {/* Front face (3D White card or Emerald when matched) */}
        <div
          className={[
            'absolute inset-0 rounded-2xl sm:rounded-3xl flex items-center justify-center select-none',
            isMatched
              ? 'bg-[#22c55e] border-2 border-emerald-300 border-b-[5px] border-b-[#15803d] shadow-lg shadow-emerald-500/30'
              : 'bg-white border-2 border-white border-b-[5px] border-b-slate-200 shadow-md',
          ].join(' ')}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <motion.span
            className="text-3xl sm:text-4xl md:text-5xl"
            animate={isMatched ? { scale: [1, 1.25, 1] } : {}}
            transition={{ duration: 0.35 }}
          >
            {card.emoji}
          </motion.span>
          {isMatched && (
            <span className="absolute top-1.5 right-2 text-white text-xs font-black">✓</span>
          )}
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
      accentColor="#0284c7"
      progress={matchCount}
      totalProgress={totalPairs}
      onSpeak={() =>
        speakGameText(
          isPreview
            ? 'Memorize the cards! Flipping soon!'
            : 'Find the matching pairs!'
        )
      }
    >
      {/* ── Cartoon Cloud Thought Bubble ─────────────────────────────────── */}
      <GamePromptCloud>
        {isPreview ? (
          <div className="flex flex-col items-center gap-1.5 py-0.5">
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-pulse">👀</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Memorize the Cards!
              </h2>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full text-xs font-black">
                ⏳ {previewSeconds}s left
              </span>
              <button
                type="button"
                onClick={finishPreview}
                className="px-3.5 py-1 rounded-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-black text-xs border border-emerald-400 border-b-2 border-b-[#15803d] shadow-sm cursor-pointer active:translate-y-0.5"
              >
                I&apos;m Ready! 🚀
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-1">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight select-none">
              Find Matching Pairs! ⭐
            </h2>
          </div>
        )}
      </GamePromptCloud>

      {/* ── Mascot Pip Over Grassy Hill ───────────────────────────────────── */}
      <GameMascotHill
        speech={
          isPreview
            ? `${previewSeconds}s to memorize!`
            : missStreak > 0
            ? 'Keep looking, you got this!'
            : 'Tap cards to find twins!'
        }
      />

      {/* ── Mini Control / Stats Bar ──────────────────────────────────────── */}
      <div className="w-full max-w-md flex items-center justify-between px-2 mb-2 z-20">
        <div className="flex items-center gap-2">
          {/* Flips */}
          <span className="bg-white/90 backdrop-blur-xs border-2 border-white rounded-full px-3 py-1 text-xs font-black text-slate-700 shadow-sm flex items-center gap-1">
            <span>🔄</span> {flipCount} flips
          </span>
          {/* Timer */}
          <span className="bg-white/90 backdrop-blur-xs border-2 border-white rounded-full px-3 py-1 text-xs font-black text-slate-700 shadow-sm flex items-center gap-1 tabular-nums">
            <span>⏱️</span> {formatTime(elapsed)}
          </span>
        </div>

        {/* Peek Button (when game active) */}
        {!isPreview && (
          <button
            type="button"
            onClick={handlePeek}
            disabled={peeksLeft <= 0 || lockBoard || isPeeking}
            className={`px-3.5 py-1 rounded-full border-2 border-b-[3px] font-black text-xs transition-all shadow-sm flex items-center gap-1 cursor-pointer active:translate-y-0.5 ${
              peeksLeft > 0 && !lockBoard && !isPeeking
                ? 'bg-amber-300 hover:bg-amber-400 text-amber-950 border-amber-300 border-b-amber-500'
                : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed opacity-60'
            }`}
            title="Temporarily peek at cards"
          >
            <span>👁️</span>
            <span>Peek ({peeksLeft})</span>
          </button>
        )}
      </div>

      {/* ── Peeking alert / Streak warn ── */}
      <AnimatePresence>
        {isPeeking && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-2 flex items-center justify-center gap-1.5 bg-amber-100 border-2 border-amber-300 rounded-full px-4 py-1 text-amber-900 font-black text-xs z-20"
          >
            <span>👁️</span>
            <span>Quick peek! Memorize their spots now!</span>
          </motion.div>
        )}
        {missStreak > 0 && !isPreview && !isPeeking && (
          <motion.div
            key="streak-warn"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-2 flex items-center gap-1.5 bg-rose-50 border-2 border-rose-200 rounded-full px-4 py-1 text-rose-700 font-black text-xs z-20"
          >
            <span>⚠️</span>
            <span>
              {missStreak === 1 && 'One mismatch — keep trying!'}
              {missStreak === 2 && 'Two mismatches — careful with your hearts!'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Card grid (Meadow Stage) ──────────────────────────────────────── */}
      <div
        className={`grid ${gridColsClass} gap-2.5 sm:gap-3 w-full my-1 z-20`}
        style={{
          maxWidth: cols === 6 ? '600px' : '420px',
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

      {/* ── Completion result overlay ── */}
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
