'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameShell, RoundResult, burstConfetti, playGameSound, GamePromptCloud, GameMascotHill, speakGameText } from '@/components/games/GameShell'
import { useAppStore } from '@/store/useAppStore'
import { getAgeGroup } from '@/lib/curriculum.data'
import { Timer, CheckCircle2, XCircle, Shuffle, Info } from 'lucide-react'

/* ─── Types ──────────────────────────────────────────────────────────────── */
type AgeGroup = '0-5' | '6-8' | '9-11' | '12-14'

interface PuzzleRound {
  target: string[]       // correct order
  tiles: string[]        // shuffled pool (may include distractors)
  distractorCount: number
}

/* ─── Constants ──────────────────────────────────────────────────────────── */
const ALL_SHAPES = ['🔴', '🟡', '🟢', '🔵', '🟣', '🟠', '⚫', '⚪'] as const

const SHAPE_NAMES: Record<string, string> = {
  '🔴': 'Red',
  '🟡': 'Yellow',
  '🟢': 'Green',
  '🔵': 'Blue',
  '🟣': 'Purple',
  '🟠': 'Orange',
  '⚫': 'Black',
  '⚪': 'White',
}

const SHAPE_BG: Record<string, string> = {
  '🔴': 'bg-red-100 border-red-300',
  '🟡': 'bg-yellow-100 border-yellow-300',
  '🟢': 'bg-green-100 border-green-300',
  '🔵': 'bg-blue-100 border-blue-300',
  '🟣': 'bg-purple-100 border-purple-300',
  '🟠': 'bg-orange-100 border-orange-300',
  '⚫': 'bg-gray-200 border-gray-400',
  '⚪': 'bg-slate-50 border-slate-300',
}

const SHAPE_SELECTED: Record<string, string> = {
  '🔴': 'bg-red-300 border-red-500 ring-4 ring-red-400',
  '🟡': 'bg-yellow-300 border-yellow-500 ring-4 ring-yellow-400',
  '🟢': 'bg-green-300 border-green-500 ring-4 ring-green-400',
  '🔵': 'bg-blue-300 border-blue-500 ring-4 ring-blue-400',
  '🟣': 'bg-purple-300 border-purple-500 ring-4 ring-purple-400',
  '🟠': 'bg-orange-300 border-orange-500 ring-4 ring-orange-400',
  '⚫': 'bg-gray-400 border-gray-600 ring-4 ring-gray-500',
  '⚪': 'bg-slate-200 border-slate-400 ring-4 ring-slate-300',
}

/** Age-based config */
interface AgeConfig {
  shapeCount: number
  distractors: number  // extra wrong shapes in tile bank
  hasTimer: boolean
  timerSeconds: number
  label: string
}

const AGE_CONFIGS: Record<AgeGroup, AgeConfig> = {
  '0-5':  { shapeCount: 4, distractors: 0, hasTimer: false, timerSeconds: 0, label: '4 shapes' },
  '6-8':  { shapeCount: 5, distractors: 0, hasTimer: false, timerSeconds: 0, label: '5 shapes' },
  '9-11': { shapeCount: 6, distractors: 0, hasTimer: false, timerSeconds: 0, label: '6 shapes' },
  '12-14':{ shapeCount: 6, distractors: 2, hasTimer: false, timerSeconds: 0, label: '6 shapes + distractors' },
}

/* ─── Utility helpers ────────────────────────────────────────────────────── */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickDistinct<T>(pool: T[], count: number): T[] {
  return shuffle(pool).slice(0, count)
}

/** Build all 10 rounds given the age config */
function buildRounds(cfg: AgeConfig): PuzzleRound[] {
  return Array.from({ length: 10 }, () => {
    const target = pickDistinct([...ALL_SHAPES], cfg.shapeCount)
    // distractors: extra shapes NOT in target
    const remaining = ALL_SHAPES.filter((s) => !target.includes(s))
    const distractors = pickDistinct(remaining, Math.min(cfg.distractors, remaining.length))
    const tiles = shuffle([...target, ...distractors])
    return { target, tiles, distractorCount: distractors.length }
  })
}

/* ─── Tile key helpers (handle duplicates safely) ───────────────────────── */
// We tag each tile with an index so React keys are stable
interface TaggedTile {
  id: string   // `${emoji}_${index}`
  emoji: string
  used: boolean
}

function tagTiles(tiles: string[]): TaggedTile[] {
  return tiles.map((emoji, i) => ({ id: `${emoji}_${i}`, emoji, used: false }))
}

/* ─── Main Page Component ────────────────────────────────────────────────── */
export default function PuzzleQuestPage() {
  const { child, addXP, loseLive } = useAppStore()

  const ageGroup: AgeGroup = getAgeGroup(child?.age ?? undefined)
  const cfg = AGE_CONFIGS[ageGroup]

  /* rounds */
  const [rounds] = useState<PuzzleRound[]>(() => buildRounds(cfg))
  const [roundIdx, setRoundIdx] = useState(0)
  const [totalXP, setTotalXP] = useState(0)
  const [correct, setCorrect] = useState(0)

  /* per-round state */
  const round = rounds[roundIdx]
  const [slots, setSlots] = useState<(string | null)[]>(Array(round.target.length).fill(null))
  const [tileBag, setTileBag] = useState<TaggedTile[]>(() => tagTiles(round.tiles))
  const [selectedTile, setSelectedTile] = useState<TaggedTile | null>(null)
  const [phase, setPhase] = useState<'playing' | 'checking' | 'reveal' | 'done'>('playing')
  const [firstTry, setFirstTry] = useState(true)
  const [showAnswer, setShowAnswer] = useState(false)

  /* timer */
  const [timeLeft, setTimeLeft] = useState(cfg.timerSeconds)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /* result overlay */
  const [showResult, setShowResult] = useState(false)

  /* ── initialize/reset a round ── */
  const initRound = useCallback((idx: number) => {
    const r = rounds[idx]
    setSlots(Array(r.target.length).fill(null))
    setTileBag(tagTiles(r.tiles))
    setSelectedTile(null)
    setPhase('playing')
    setFirstTry(true)
    setShowAnswer(false)
    setTimeLeft(cfg.timerSeconds)
  }, [rounds, cfg.timerSeconds])

  /* reset when round index changes */
  useEffect(() => { initRound(roundIdx) }, [roundIdx, initRound])

  /* ── timer ── */
  useEffect(() => {
    if (!cfg.hasTimer || phase !== 'playing') return
    if (timeLeft <= 0) {
      handleTimeUp()
      return
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, cfg.hasTimer])

  useEffect(() => {
    if (cfg.hasTimer && timeLeft === 0 && phase === 'playing') {
      handleTimeUp()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft])

  function handleTimeUp() {
    clearInterval(timerRef.current!)
    playGameSound('wrong')
    loseLive()
    setShowAnswer(true)
    setPhase('reveal')
    setTimeout(() => advanceRound(false), 2500)
  }

  /* ── slot & tile interaction ── */
  function handleTileClick(tile: TaggedTile) {
    if (phase !== 'playing') return
    if (tile.used) return

    if (selectedTile?.id === tile.id) {
      // deselect
      setSelectedTile(null)
    } else {
      playGameSound('flip')
      setSelectedTile(tile)
    }
  }

  function handleSlotClick(slotIdx: number) {
    if (phase !== 'playing') return

    const current = slots[slotIdx]

    if (selectedTile) {
      // Place selected tile into this slot
      const prevSlotShape = current // might be null or a shape emoji
      const newSlots = [...slots]
      newSlots[slotIdx] = selectedTile.emoji

      // un-mark old tile if replacing a slot
      const newBag = tileBag.map((t) => {
        if (t.id === selectedTile.id) return { ...t, used: true }
        return t
      })

      // If the slot already had a shape, return it to the bag
      if (prevSlotShape !== null) {
        // find the first used tile with that emoji and un-use it
        let restored = false
        const restored_bag = newBag.map((t) => {
          if (!restored && t.used && t.emoji === prevSlotShape) {
            restored = true
            return { ...t, used: false }
          }
          return t
        })
        setTileBag(restored_bag)
      } else {
        setTileBag(newBag)
      }

      setSlots(newSlots)
      setSelectedTile(null)
    } else if (current !== null) {
      // No selected tile — tap a filled slot to remove and re-select that shape
      const newSlots = [...slots]
      newSlots[slotIdx] = null
      setSlots(newSlots)

      // un-use the tile in bag
      let unUsed = false
      const newBag = tileBag.map((t) => {
        if (!unUsed && t.used && t.emoji === current) {
          unUsed = true
          return { ...t, used: false }
        }
        return t
      })
      setTileBag(newBag)
    }
  }

  /* ── check answer ── */
  function handleCheck() {
    if (phase !== 'playing') return
    if (slots.some((s) => s === null)) return // not all filled
    clearInterval(timerRef.current!)

    const isCorrect = slots.every((s, i) => s === round.target[i])

    if (isCorrect) {
      playGameSound('correct')
      burstConfetti()
      const xp = firstTry ? 15 : 5
      addXP(xp)
      setTotalXP((prev) => prev + xp)
      setCorrect((c) => c + 1)
      setPhase('checking')
      setTimeout(() => advanceRound(true), 1800)
    } else {
      playGameSound('wrong')
      loseLive()
      if (firstTry) setFirstTry(false)
      setShowAnswer(true)
      setPhase('reveal')
    }
  }

  /* ── advance to next round or show results ── */
  function advanceRound(_wasCorrect: boolean) {
    if (roundIdx >= rounds.length - 1) {
      // All 10 done
      setPhase('done')
      setShowResult(true)
      playGameSound('complete')
      burstConfetti({ particleCount: 150, spread: 90 })
    } else {
      setRoundIdx((r) => r + 1)
    }
  }

  /* ── restart whole game ── */
  function handleRestart() {
    setRoundIdx(0)
    setTotalXP(0)
    setCorrect(0)
    setShowResult(false)
    setPhase('playing')
  }

  /* ── derived ── */
  const allFilled = slots.every((s) => s !== null)
  const timerPct = cfg.hasTimer ? (timeLeft / cfg.timerSeconds) * 100 : 100
  const timerColor =
    timeLeft > 10 ? 'bg-emerald-500' : timeLeft > 5 ? 'bg-amber-500' : 'bg-rose-500'

  /* ─── Render ─────────────────────────────────────────────────────────── */
  return (
    <GameShell
      title="Puzzle Quest"
      emoji="🧩"
      accentColor="#0284c7"
      progress={roundIdx + 1}
      totalProgress={10}
      onSpeak={() => speakGameText('Place the shapes in the matching target order')}
    >
      {/* ── Timer bar (age 9+) ── */}
      {cfg.hasTimer && phase === 'playing' && (
        <div className="w-full max-w-md mb-2 z-20">
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-xs font-black text-slate-600 flex items-center gap-1">
              <Timer size={13} className="text-slate-500" />
              <span>Time Left</span>
            </span>
            <span
              className={`text-xs font-black px-2 py-0.5 rounded-full ${
                timeLeft <= 5 ? 'bg-rose-100 text-rose-700' : 'bg-white/80 text-slate-700'
              }`}
            >
              {timeLeft}s
            </span>
          </div>
          <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden shadow-inner">
            <motion.div
              className={`h-full rounded-full transition-colors duration-500 ${timerColor}`}
              animate={{ width: `${timerPct}%` }}
              transition={{ duration: 0.95, ease: 'linear' }}
            />
          </div>
        </div>
      )}

      {/* ── Big Cartoon Cloud Thought Bubble (Target Sequence) ───────────── */}
      <GamePromptCloud>
        <div className="flex flex-col items-center justify-center py-1">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
            Target Order 🎯
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {round.target.map((shape, i) => (
              <motion.div
                key={`target-${i}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05, type: 'spring', damping: 14 }}
                className="flex flex-col items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-50 border-2 border-slate-200 border-b-4 border-b-slate-300 text-2xl sm:text-3xl shadow-xs"
              >
                <span>{shape}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </GamePromptCloud>

      {/* ── Mascot Pip Over Grassy Hill ───────────────────────────────────── */}
      <GameMascotHill
        speech={
          phase === 'checking'
            ? 'Super pattern master! 🎉'
            : phase === 'reveal'
            ? 'Almost! Tap Try Again! 🔄'
            : 'Place shapes in order!'
        }
      />

      {/* ── Meadow Stage: Answer Slots Tray ──────────────────────────────── */}
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xs rounded-3xl border-2 border-white shadow-lg p-4 sm:p-5 flex flex-col gap-4 my-2 z-20">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#0284c7] bg-sky-50 border border-sky-200 px-3 py-0.5 rounded-full">
              📥 Your Answer
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              Tap slot to remove
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 flex-wrap">
            {slots.map((shape, i) => (
              <motion.button
                key={`slot-${i}`}
                type="button"
                onClick={() => handleSlotClick(i)}
                whileTap={{ scale: 0.92 }}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 flex items-center justify-center text-2xl sm:text-3xl transition-all cursor-pointer select-none ${
                  shape
                    ? 'bg-white border-white border-b-4 border-b-slate-300 shadow-sm'
                    : 'border-dashed border-sky-300 bg-sky-50/60 hover:bg-sky-100/70'
                } ${
                  phase === 'reveal' && showAnswer
                    ? shape === round.target[i]
                      ? 'ring-4 ring-emerald-400'
                      : 'ring-4 ring-rose-400'
                    : ''
                }`}
                aria-label={shape ? `Slot ${i + 1}: ${SHAPE_NAMES[shape]}` : `Empty slot ${i + 1}`}
              >
                <AnimatePresence mode="wait">
                  {shape ? (
                    <motion.span
                      key={shape + i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', damping: 15 }}
                    >
                      {shape}
                    </motion.span>
                  ) : (
                    <span className="text-sky-300 font-black text-sm">
                      {i + 1}
                    </span>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Tile Bank ── */}
        <div className="border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              🃏 Available Shapes
            </span>
            {round.distractorCount > 0 && (
              <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                {round.distractorCount} distractor{round.distractorCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {tileBag.map((tile) => (
              <motion.button
                key={tile.id}
                type="button"
                onClick={() => handleTileClick(tile)}
                disabled={tile.used || phase !== 'playing'}
                whileTap={!tile.used ? { scale: 0.9 } : {}}
                whileHover={!tile.used ? { scale: 1.08 } : {}}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 text-2xl sm:text-3xl flex items-center justify-center transition-all select-none ${
                  tile.used
                    ? 'opacity-20 cursor-not-allowed bg-slate-100 border-slate-200'
                    : selectedTile?.id === tile.id
                    ? 'bg-amber-100 border-amber-400 border-b-4 border-b-amber-500 ring-4 ring-amber-300 shadow-md cursor-pointer'
                    : 'bg-white border-white border-b-4 border-b-slate-200 shadow-sm hover:border-b-2 active:translate-y-0.5 cursor-pointer'
                }`}
                aria-label={`${SHAPE_NAMES[tile.emoji]} tile${tile.used ? ' (placed)' : ''}`}
              >
                {tile.emoji}
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Check Button (3D Emerald Pill) ── */}
        {phase !== 'reveal' ? (
          <motion.button
            type="button"
            onClick={handleCheck}
            disabled={!allFilled || phase !== 'playing'}
            whileTap={allFilled ? { scale: 0.96 } : {}}
            className={`w-full py-3.5 sm:py-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-2 border-2 border-b-[5px] transition-all cursor-pointer ${
              allFilled && phase === 'playing'
                ? 'bg-[#22c55e] hover:bg-[#16a34a] border-emerald-400 border-b-[#15803d] text-white shadow-lg shadow-emerald-500/25 active:translate-y-0.5'
                : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed border-b-slate-300'
            }`}
          >
            <CheckCircle2 size={20} />
            <span>{allFilled ? 'Check My Answer!' : `Fill all ${round.target.length} slots`}</span>
          </motion.button>
        ) : (
          <div className="flex items-center gap-2 w-full">
            <button
              type="button"
              onClick={() => {
                setShowAnswer(false)
                initRound(roundIdx)
                playGameSound('flip')
              }}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black text-sm sm:text-base border-2 border-amber-300 border-b-[5px] border-b-amber-700 shadow-lg cursor-pointer flex items-center justify-center gap-2 active:translate-y-0.5 transition-all"
            >
              <span>Try Again! 🔄</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAnswer(false)
                advanceRound(false)
              }}
              className="py-3.5 px-4 rounded-2xl bg-white/95 hover:bg-white text-slate-700 font-black text-sm border-2 border-white border-b-[4px] border-b-slate-300 shadow-md cursor-pointer flex items-center justify-center gap-1 active:translate-y-0.5 transition-all"
            >
              <span>Skip ➡️</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Correct / Wrong feedback banner ── */}
      <AnimatePresence>
        {phase === 'checking' && (
          <motion.div
            className="my-2 flex items-center gap-2 bg-emerald-500 text-white px-6 py-2 rounded-full font-black text-sm shadow-md z-20"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <CheckCircle2 size={18} />
            <span>{firstTry ? '🎉 Perfect! +15 XP' : '✅ Correct! +5 XP'}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Round Result Overlay ── */}
      <RoundResult
        show={showResult}
        xpEarned={totalXP}
        correct={correct}
        total={10}
        onNext={handleRestart}
        onExit={() => window.history.back()}
      />
    </GameShell>
  )
}
