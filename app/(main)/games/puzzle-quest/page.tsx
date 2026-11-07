'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameShell, RoundResult, burstConfetti, playGameSound } from '@/components/games/GameShell'
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
  '0-5':  { shapeCount: 4, distractors: 0, hasTimer: false, timerSeconds: 0,  label: '4 shapes' },
  '6-8':  { shapeCount: 5, distractors: 0, hasTimer: false, timerSeconds: 0,  label: '5 shapes' },
  '9-11': { shapeCount: 6, distractors: 0, hasTimer: true,  timerSeconds: 20, label: '6 shapes · 20s' },
  '12-14':{ shapeCount: 6, distractors: 2, hasTimer: true,  timerSeconds: 15, label: '6 shapes + distractors · 15s' },
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
      setTimeout(() => {
        setShowAnswer(false)
        // reset tiles so player can retry
        initRound(roundIdx)
      }, 2500)
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
      accentColor="#8b5cf6"
      bgColor="#f5f3ff"
    >
      {/* ── Progress bar ── */}
      <div className="w-full max-w-lg mb-4">
        <div className="flex justify-between text-xs font-black text-purple-600 mb-1">
          <span>Round {Math.min(roundIdx + 1, 10)} / 10</span>
          <span className="text-slate-500">{cfg.label}</span>
        </div>
        <div className="w-full h-3 bg-purple-100 rounded-full overflow-hidden border border-purple-200">
          <motion.div
            className="h-full bg-purple-500 rounded-full"
            animate={{ width: `${((roundIdx) / 10) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* ── Timer bar (age 9+) ── */}
      {cfg.hasTimer && phase === 'playing' && (
        <div className="w-full max-w-lg mb-3">
          <div className="flex items-center gap-2 mb-1">
            <Timer size={14} className="text-slate-500" />
            <span
              className={`text-xs font-black ${
                timeLeft <= 5 ? 'text-rose-600' : timeLeft <= 10 ? 'text-amber-600' : 'text-slate-600'
              }`}
            >
              {timeLeft}s
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full transition-colors duration-500 ${timerColor}`}
              animate={{ width: `${timerPct}%` }}
              transition={{ duration: 0.95, ease: 'linear' }}
            />
          </div>
        </div>
      )}

      {/* ── Main card ── */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border-2 border-purple-100 p-6 flex flex-col gap-6">

        {/* ── Target display ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-black text-purple-700 uppercase tracking-widest bg-purple-100 px-3 py-1 rounded-full">
              🎯 Target Order
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {round.target.map((shape, i) => (
              <motion.div
                key={`target-${i}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 20 }}
                className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl border-2 text-3xl
                  shadow-sm ${SHAPE_BG[shape] ?? 'bg-slate-100 border-slate-300'}`}
              >
                <span>{shape}</span>
                <span className="text-[9px] font-black text-slate-500 leading-tight mt-0.5">
                  {i + 1}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="border-t border-dashed border-purple-100" />

        {/* ── Answer slots ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-black text-indigo-700 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">
              📥 Your Answer
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {slots.map((shape, i) => (
              <motion.button
                key={`slot-${i}`}
                type="button"
                onClick={() => handleSlotClick(i)}
                whileTap={{ scale: 0.92 }}
                className={`w-14 h-14 rounded-2xl border-2 border-dashed flex items-center justify-center text-3xl
                  transition-all duration-150 cursor-pointer
                  ${shape
                    ? `${SHAPE_BG[shape] ?? 'bg-slate-100 border-slate-300'} border-solid shadow-sm`
                    : 'border-indigo-300 bg-indigo-50 hover:bg-indigo-100'
                  }
                  ${phase === 'reveal' && showAnswer
                    ? shape === round.target[i]
                      ? 'ring-2 ring-emerald-400'
                      : 'ring-2 ring-rose-400'
                    : ''
                  }
                `}
                aria-label={shape ? `Slot ${i + 1}: ${SHAPE_NAMES[shape]}` : `Empty slot ${i + 1}`}
              >
                <AnimatePresence mode="wait">
                  {shape ? (
                    <motion.span
                      key={shape + i}
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 20 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    >
                      {shape}
                    </motion.span>
                  ) : (
                    <motion.span
                      key={`empty-${i}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-indigo-200 font-black text-lg"
                    >
                      {i + 1}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>

          {/* Slot hint */}
          <p className="text-center text-xs text-slate-400 font-semibold mt-2">
            Tap a slot to remove a shape · Tap a tile then a slot to place
          </p>
        </div>

        <div className="border-t border-dashed border-purple-100" />

        {/* ── Tile bank ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-slate-600 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
              🃏 Tiles
            </span>
            {round.distractorCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                <Info size={10} />
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
                whileHover={!tile.used ? { scale: 1.08, y: -3 } : {}}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: tile.used ? 0.25 : 1,
                  y: tile.used ? 4 : 0,
                  scale: tile.used ? 0.9 : 1,
                }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className={`w-14 h-14 rounded-2xl border-2 text-3xl flex flex-col items-center justify-center
                  transition-all duration-150
                  ${tile.used
                    ? 'opacity-25 cursor-not-allowed bg-slate-100 border-slate-200'
                    : selectedTile?.id === tile.id
                      ? `${SHAPE_SELECTED[tile.emoji] ?? 'bg-slate-200 border-slate-500 ring-4 ring-slate-400'} cursor-pointer shadow-lg`
                      : `${SHAPE_BG[tile.emoji] ?? 'bg-slate-100 border-slate-300'} cursor-pointer shadow-sm hover:shadow-md`
                  }
                `}
                aria-label={`${SHAPE_NAMES[tile.emoji]} tile${tile.used ? ' (placed)' : ''}`}
                aria-pressed={selectedTile?.id === tile.id}
              >
                {tile.emoji}
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Check button ── */}
        <motion.button
          type="button"
          onClick={handleCheck}
          disabled={!allFilled || phase !== 'playing'}
          whileTap={allFilled ? { scale: 0.95 } : {}}
          className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2
            border-2 border-b-4 transition-all duration-200
            ${allFilled && phase === 'playing'
              ? 'bg-purple-500 hover:bg-purple-600 border-purple-600 border-b-purple-700 text-white cursor-pointer shadow-lg shadow-purple-200'
              : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
            }
          `}
        >
          <CheckCircle2 size={20} />
          {allFilled ? 'Check My Answer!' : `Fill all ${round.target.length} slots`}
        </motion.button>
      </div>

      {/* ── Correct / Wrong feedback flash ── */}
      <AnimatePresence>
        {phase === 'checking' && (
          <motion.div
            className="mt-4 flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black text-lg shadow-lg"
            initial={{ scale: 0.7, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 22 }}
          >
            <CheckCircle2 size={22} />
            {firstTry ? '🎉 Perfect! +15 XP' : '✅ Correct! +5 XP'}
          </motion.div>
        )}
        {phase === 'reveal' && showAnswer && (
          <motion.div
            className="mt-4 w-full max-w-lg"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-rose-700 font-black">
                <XCircle size={18} />
                Correct order was:
              </div>
              <div className="flex gap-2">
                {round.target.map((shape, i) => (
                  <motion.div
                    key={`reveal-${i}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.08, type: 'spring', stiffness: 400, damping: 20 }}
                    className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-2xl
                      ${SHAPE_BG[shape] ?? 'bg-slate-100 border-slate-300'}`}
                  >
                    {shape}
                  </motion.div>
                ))}
              </div>
            </div>
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
