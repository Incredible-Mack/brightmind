'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameShell, RoundResult, burstConfetti, playGameSound } from '@/components/games/GameShell'
import { useAppStore } from '@/store/useAppStore'
import { getAgeGroup } from '@/lib/curriculum.data'
import type { AgeGroup } from '@/types/child'

// ─── Experiment Raw Data ───────────────────────────────────────────────────

interface RawExperiment {
  a: string
  b: string
  result: string
  options: string[]
  fact: string
  colorA: string
  colorB: string
  colorResult: string
}

const RAW_EXPERIMENTS: RawExperiment[] = [
  {
    a: 'Red 🔴', b: 'Blue 🔵', result: 'Purple 🟣',
    options: ['Purple 🟣', 'Green 🟢', 'Orange 🟠', 'Brown 🟤'],
    fact: 'Mixing red and blue light makes magenta. Mixing red and blue paint makes purple!',
    colorA: '#ef4444', colorB: '#3b82f6', colorResult: '#a855f7',
  },
  {
    a: 'Red 🔴', b: 'Yellow 🟡', result: 'Orange 🟠',
    options: ['Orange 🟠', 'Purple 🟣', 'Brown 🟤', 'Pink 🩷'],
    fact: 'Oranges get their colour from mixing red and yellow pigments!',
    colorA: '#ef4444', colorB: '#eab308', colorResult: '#f97316',
  },
  {
    a: 'Blue 🔵', b: 'Yellow 🟡', result: 'Green 🟢',
    options: ['Green 🟢', 'Purple 🟣', 'Orange 🟠', 'Teal 🩵'],
    fact: 'Plants are green because their chlorophyll absorbs red and blue light!',
    colorA: '#3b82f6', colorB: '#eab308', colorResult: '#22c55e',
  },
  {
    a: 'Red 🔴', b: 'White ⚪', result: 'Pink 🩷',
    options: ['Pink 🩷', 'Orange 🟠', 'Light Red 🎈', 'Salmon 🍣'],
    fact: 'Adding white to any colour makes it lighter — this is called a tint!',
    colorA: '#ef4444', colorB: '#f8fafc', colorResult: '#f472b6',
  },
  {
    a: 'Orange 🟠', b: 'Red 🔴', result: 'Red-Orange 🔥',
    options: ['Red-Orange 🔥', 'Purple 🟣', 'Brown 🟤', 'Pink 🩷'],
    fact: 'The hottest flames burn blue or white, not red-orange!',
    colorA: '#f97316', colorB: '#ef4444', colorResult: '#ea580c',
  },
  {
    a: 'Purple 🟣', b: 'Red 🔴', result: 'Magenta 💜',
    options: ['Magenta 💜', 'Brown 🟤', 'Orange 🟠', 'Blue 🔵'],
    fact: "Magenta is the colour you see when red and blue light combine — it's not in the rainbow!",
    colorA: '#a855f7', colorB: '#ef4444', colorResult: '#d946ef',
  },
  {
    a: 'Green 🟢', b: 'Blue 🔵', result: 'Teal 🩵',
    options: ['Teal 🩵', 'Purple 🟣', 'Brown 🟤', 'Orange 🟠'],
    fact: 'Teal got its name from a small river duck called a teal, which has blue-green feathers!',
    colorA: '#22c55e', colorB: '#3b82f6', colorResult: '#0d9488',
  },
  {
    a: 'Yellow 🟡', b: 'White ⚪', result: 'Cream 🌕',
    options: ['Cream 🌕', 'Green 🟢', 'Orange 🟠', 'Pink 🩷'],
    fact: 'Adding white to yellow makes cream — the same colour as milk and many flowers!',
    colorA: '#eab308', colorB: '#f8fafc', colorResult: '#fef08a',
  },
  {
    a: 'Black ⚫', b: 'White ⚪', result: 'Grey 🩶',
    options: ['Grey 🩶', 'Blue 🔵', 'Purple 🟣', 'Brown 🟤'],
    fact: 'All colours of light mixed together make white. No light at all gives black!',
    colorA: '#1e293b', colorB: '#f8fafc', colorResult: '#94a3b8',
  },
  {
    a: 'Red 🔴', b: 'Green 🟢', result: 'Brown 🟤',
    options: ['Brown 🟤', 'Orange 🟠', 'Purple 🟣', 'Grey 🩶'],
    fact: 'Mixing complementary colours (opposites on the colour wheel) always makes brown or grey!',
    colorA: '#ef4444', colorB: '#22c55e', colorResult: '#78350f',
  },
]

interface Experiment extends RawExperiment {
  shuffledOptions: string[]
  correctIndex: number
}

function prepareExperiment(raw: RawExperiment): Experiment {
  // Shuffle options so correct answer isn't always at index 0
  const shuffled = [...raw.options].sort(() => Math.random() - 0.5)
  return {
    ...raw,
    shuffledOptions: shuffled,
    correctIndex: shuffled.indexOf(raw.result),
  }
}

const QUESTIONS_PER_ROUND = 8
const TIMER_SECONDS = 15

// ─── Swatch Color Map ──────────────────────────────────────────────────────

const LABEL_TO_HEX: Record<string, string> = {
  'Purple 🟣': '#a855f7',
  'Green 🟢': '#22c55e',
  'Orange 🟠': '#f97316',
  'Brown 🟤': '#92400e',
  'Pink 🩷': '#f9a8d4',
  'Teal 🩵': '#14b8a6',
  'Red-Orange 🔥': '#f43f5e',
  'Magenta 💜': '#d946ef',
  'Cream 🌕': '#fef08a',
  'Grey 🩶': '#94a3b8',
  'Blue 🔵': '#3b82f6',
  'Red 🔴': '#ef4444',
  'Yellow 🟡': '#eab308',
  'White ⚪': '#f1f5f9',
  'Black ⚫': '#1e293b',
  'Light Red 🎈': '#fca5a5',
  'Salmon 🍣': '#fda4af',
}

// ─── Flask SVG Component ───────────────────────────────────────────────────

interface FlaskProps {
  color: string
  size?: number
  label?: string
  fillAmount?: number // 0 to 1
  bubbling?: boolean
  tilt?: number
  isMystery?: boolean
}

function Flask({
  color,
  size = 90,
  label,
  fillAmount = 1,
  bubbling = false,
  tilt = 0,
  isMystery = false,
}: FlaskProps) {
  return (
    <motion.div
      className="flex flex-col items-center gap-1.5"
      animate={{ rotate: tilt }}
      transition={{ duration: 0.45, ease: 'easeInOut' }}
    >
      <div className="relative" style={{ width: size, height: size * 1.15 }}>
        <svg viewBox="0 0 100 120" width={size} height={size * 1.15} className="drop-shadow-md">
          {/* Beaker / Flask rim */}
          <rect x="34" y="2" width="32" height="6" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
          {/* Flask neck */}
          <rect x="40" y="8" width="20" height="24" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" opacity="0.9" />

          {/* Flask outline glass body */}
          <path
            d="M40 32 L16 92 Q12 108 28 114 L72 114 Q88 108 84 92 L60 32 Z"
            fill="#f1f5f9"
            stroke="#94a3b8"
            strokeWidth="3"
            opacity="0.35"
          />

          {/* Liquid inside */}
          {fillAmount > 0 && (
            <path
              d={
                fillAmount >= 0.8
                  ? "M42 45 L18 92 Q14 107 28 112 L72 112 Q86 107 82 92 L58 45 Z"
                  : "M32 75 L20 95 Q16 107 28 112 L72 112 Q84 107 80 95 L68 75 Z"
              }
              fill={isMystery ? 'url(#mystery-grad)' : color}
              opacity={isMystery ? 0.85 : 0.9}
            />
          )}

          {/* Mystery Gradient */}
          <defs>
            <linearGradient id="mystery-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="50%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>

          {/* Glass shine highlights */}
          <path
            d="M44 36 L30 84 Q28 94 34 100"
            fill="none"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>

        {/* Mystery question mark */}
        {isMystery && (
          <div className="absolute inset-0 flex items-center justify-center pt-5">
            <span className="text-2xl font-black text-white drop-shadow anim-bounce">❓</span>
          </div>
        )}

        {/* Bubbles overlay */}
        {bubbling && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ top: '25%' }}>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white/80"
                style={{
                  width: `${5 + (i % 3) * 3}px`,
                  height: `${5 + (i % 3) * 3}px`,
                  left: `${25 + (i * 12) % 50}%`,
                  bottom: '15%',
                  animation: `bubble-rise ${1.1 + i * 0.25}s ease-in ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {label && (
        <span className="text-xs sm:text-sm font-black text-slate-800 text-center leading-tight max-w-[95px] px-1.5 py-0.5 rounded-lg bg-white/80 border border-slate-200 shadow-xs">
          {label}
        </span>
      )}
    </motion.div>
  )
}

// ─── Option Chip Component ─────────────────────────────────────────────────

interface OptionChipProps {
  label: string
  selected: boolean
  isCorrect: boolean | null
  revealed: boolean
  disabled: boolean
  onClick: () => void
}

function OptionChip({ label, selected, isCorrect, revealed, disabled, onClick }: OptionChipProps) {
  const swatch = LABEL_TO_HEX[label] ?? '#94a3b8'

  let borderClass = 'border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/70 text-slate-800'

  if (revealed) {
    if (isCorrect === true) {
      borderClass = 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-400 shadow-sm'
    } else if (selected && isCorrect === false) {
      borderClass = 'border-rose-400 bg-rose-50 text-rose-900 line-through opacity-80'
    } else {
      borderClass = 'border-slate-200 bg-slate-50/80 text-slate-400'
    }
  } else if (selected) {
    borderClass = 'border-indigo-500 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-400 shadow-md scale-[1.02]'
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl border-2 border-b-4 font-black text-sm text-left transition-all ${borderClass} cursor-pointer disabled:cursor-not-allowed`}
    >
      <span
        className="w-6 h-6 rounded-full flex-shrink-0 border-2 border-white shadow-xs"
        style={{ background: swatch }}
      />
      <span className="flex-1 font-nunito">{label}</span>
      {selected && !revealed && (
        <span className="text-xs font-black uppercase text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
          Chosen
        </span>
      )}
      {revealed && isCorrect === true && (
        <span className="text-emerald-600 text-lg font-black">✓ Correct</span>
      )}
      {revealed && selected && isCorrect === false && (
        <span className="text-rose-500 text-base font-black">✗</span>
      )}
    </motion.button>
  )
}

// ─── Main Science Lab Page ─────────────────────────────────────────────────

type Step = 'predict' | 'mixing' | 'revealed'

export default function ScienceLabPage() {
  const { child, addXP, loseLive } = useAppStore()

  const ageGroup: AgeGroup =
    (child as unknown as { age_group?: AgeGroup })?.age_group ||
    (child?.age ? getAgeGroup(child.age) : '0-5')

  const isAdvanced = ageGroup === '9-11' || ageGroup === '12-14'

  // Pool of experiments based on age
  const pool = isAdvanced ? RAW_EXPERIMENTS : RAW_EXPERIMENTS.slice(0, 6)

  // ── Round State ──
  const [queue, setQueue] = useState<Experiment[]>([])
  const [qIndex, setQIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [xpEarned, setXpEarned] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [roundKey, setRoundKey] = useState(0)

  // ── Question State ──
  const [step, setStep] = useState<Step>('predict')
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [selectionWarning, setSelectionWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Build shuffled queue on round start
  const buildQueue = useCallback(() => {
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, QUESTIONS_PER_ROUND).map(prepareExperiment)
  }, [pool])

  useEffect(() => {
    setQueue(buildQueue())
  }, [buildQueue, roundKey])

  const experiment = queue[qIndex] ?? null

  // ── Timer for Advanced Ages ──
  useEffect(() => {
    if (!isAdvanced || step !== 'predict' || !experiment) return
    setTimeLeft(TIMER_SECONDS)

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          // Timeout: auto-mix without answer
          handleExecuteMix(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current!)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, qIndex, roundKey, isAdvanced, experiment])

  // ── Handle Option Selection ──
  function handleSelectOption(idx: number) {
    if (step !== 'predict') return
    setSelectedOption(idx)
    setSelectionWarning(false)
    playGameSound('flip')
  }

  // ── Execute Mix ──
  function handleExecuteMix(forcedTimeout = false) {
    if (step !== 'predict') return

    if (selectedOption === null && !forcedTimeout) {
      setSelectionWarning(true)
      playGameSound('wrong')
      return
    }

    if (timerRef.current) clearInterval(timerRef.current)

    setStep('mixing')
    playGameSound('flip')

    // Animate liquids pouring and reacting
    setTimeout(() => {
      setStep('revealed')

      const isCorrect = selectedOption === experiment?.correctIndex

      if (isCorrect) {
        playGameSound('correct')
        burstConfetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } })
        addXP(10)
        setCorrectCount(c => c + 1)
        setXpEarned(x => x + 10)
      } else {
        playGameSound('wrong')
        loseLive()
      }
    }, 1400)
  }

  // ── Next Question ──
  function handleNextQuestion() {
    const nextIdx = qIndex + 1
    if (nextIdx >= QUESTIONS_PER_ROUND) {
      playGameSound('complete')
      setShowResult(true)
    } else {
      setQIndex(nextIdx)
      setStep('predict')
      setSelectedOption(null)
      setSelectionWarning(false)
    }
  }

  // ── Reset Game / New Round ──
  function handleNewRound() {
    setShowResult(false)
    setQIndex(0)
    setCorrectCount(0)
    setXpEarned(0)
    setSelectedOption(null)
    setSelectionWarning(false)
    setStep('predict')
    setRoundKey(k => k + 1)
  }

  if (!experiment) return null

  const isGuessedCorrect = selectedOption === experiment.correctIndex

  return (
    <GameShell
      title="Science Lab"
      emoji="🧪"
      accentColor="#6366f1"
      bgColor="#eef2ff"
    >
      {/* CSS bubble animation */}
      <style>{`
        @keyframes bubble-rise {
          0%   { transform: translateY(0) scale(0.9); opacity: 0.7; }
          80%  { transform: translateY(-45px) scale(1.1); opacity: 0.5; }
          100% { transform: translateY(-60px) scale(0);   opacity: 0; }
        }
      `}</style>

      <div className="w-full max-w-lg flex flex-col gap-4 font-nunito">
        {/* ── Round Progress Indicator ── */}
        <div className="flex items-center justify-between px-1">
          <div className="flex gap-1.5 items-center">
            {Array.from({ length: QUESTIONS_PER_ROUND }).map((_, i) => (
              <div
                key={i}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  i < qIndex
                    ? 'bg-indigo-500 w-5'
                    : i === qIndex
                    ? 'bg-indigo-400 w-6 ring-2 ring-indigo-300'
                    : 'bg-slate-200 w-3'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {isAdvanced && step === 'predict' && (
              <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                ⏱️ {timeLeft}s
              </span>
            )}
            <span className="text-xs font-black text-slate-500">
              Experiment {qIndex + 1} of {QUESTIONS_PER_ROUND}
            </span>
          </div>
        </div>

        {/* ── Main Experiment Table Panel ── */}
        <div className="bg-white rounded-3xl border-2 border-indigo-100 shadow-sm p-5 sm:p-6 relative overflow-hidden">
          <div className="text-center mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
              ⚗️ Color Chemistry Lab
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-800 mt-2">
              What colour do we get when we mix{' '}
              <span className="text-indigo-600 underline decoration-indigo-200">{experiment.a}</span> and{' '}
              <span className="text-indigo-600 underline decoration-indigo-200">{experiment.b}</span>?
            </h3>
          </div>

          {/* ── Flasks Bench ── */}
          <div className="flex items-end justify-center gap-3 sm:gap-6 my-4 min-h-[140px] relative">
            {/* Left Flask A */}
            <Flask
              color={experiment.colorA}
              size={78}
              label={experiment.a}
              fillAmount={step === 'mixing' ? 0.3 : 1}
              tilt={step === 'mixing' ? 38 : 0}
            />

            {/* Center Reaction Chamber / Beaker */}
            <div className="flex flex-col items-center justify-end relative">
              {/* Mixing Flow Particles */}
              {step === 'mixing' && (
                <div className="absolute -top-3 inset-x-0 flex justify-between pointer-events-none px-2 z-10">
                  <motion.div
                    animate={{ y: [0, 45], opacity: [0.9, 0] }}
                    transition={{ repeat: Infinity, duration: 0.35 }}
                    className="w-2.5 h-6 rounded-full"
                    style={{ background: experiment.colorA }}
                  />
                  <motion.div
                    animate={{ y: [0, 45], opacity: [0.9, 0] }}
                    transition={{ repeat: Infinity, duration: 0.35, delay: 0.1 }}
                    className="w-2.5 h-6 rounded-full"
                    style={{ background: experiment.colorB }}
                  />
                </div>
              )}

              {/* The Resulting Beaker */}
              <Flask
                color={
                  step === 'revealed'
                    ? experiment.colorResult
                    : '#cbd5e1'
                }
                size={98}
                label={
                  step === 'revealed'
                    ? experiment.result
                    : step === 'mixing'
                    ? 'Reacting! 💥'
                    : 'Reaction Flask'
                }
                fillAmount={step === 'predict' ? 0 : 1}
                bubbling={step === 'mixing' || step === 'revealed'}
                isMystery={step === 'predict'}
              />
            </div>

            {/* Right Flask B */}
            <Flask
              color={experiment.colorB}
              size={78}
              label={experiment.b}
              fillAmount={step === 'mixing' ? 0.3 : 1}
              tilt={step === 'mixing' ? -38 : 0}
            />
          </div>

          {/* ── Mix Action Button (in predict stage) ── */}
          {step === 'predict' && (
            <div className="flex flex-col items-center gap-2 mt-4">
              <motion.button
                type="button"
                onClick={() => handleExecuteMix(false)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white font-black text-sm sm:text-base border-2 border-indigo-400 border-b-4 border-b-indigo-800 shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>POUR &amp; MIX! ⚗️</span>
              </motion.button>
              {selectionWarning && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200"
                >
                  👇 Pick your prediction below first!
                </motion.p>
              )}
            </div>
          )}

          {/* ── Mixing Status Banner ── */}
          {step === 'mixing' && (
            <div className="text-center py-2 flex items-center justify-center gap-2 text-indigo-700 font-black text-sm">
              <span className="text-2xl anim-spin-slow">🧪</span>
              <span>Mixing liquids in the beaker... Watch the reaction!</span>
            </div>
          )}

          {/* ── Result Feedback Banner (in revealed stage) ── */}
          {step === 'revealed' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-3 p-3.5 rounded-2xl border-2 text-center ${
                isGuessedCorrect
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}
            >
              <div className="flex items-center justify-center gap-2 font-black text-sm sm:text-base mb-1">
                <span className="text-xl">{isGuessedCorrect ? '🎉' : '🧪'}</span>
                <span>
                  {isGuessedCorrect
                    ? `Brilliant! ${experiment.a} + ${experiment.b} = ${experiment.result}!`
                    : `Reaction complete! ${experiment.a} + ${experiment.b} makes ${experiment.result}!`}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-700 mt-1">
                💡 <span className="font-extrabold text-slate-900">Fun Fact:</span> {experiment.fact}
              </p>
            </motion.div>
          )}
        </div>

        {/* ── Option Chips (Prediction Choices) ── */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-black uppercase text-slate-500 tracking-wider px-1">
            {step === 'revealed' ? 'Options & Results:' : 'Choose your prediction:'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {experiment.shuffledOptions.map((opt, i) => (
              <OptionChip
                key={opt}
                label={opt}
                selected={selectedOption === i}
                isCorrect={
                  step === 'revealed'
                    ? i === experiment.correctIndex
                    : null
                }
                revealed={step === 'revealed'}
                disabled={step !== 'predict'}
                onClick={() => handleSelectOption(i)}
              />
            ))}
          </div>
        </div>

        {/* ── Next Button (After Reveal) ── */}
        {step === 'revealed' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-end pt-1"
          >
            <button
              type="button"
              onClick={handleNextQuestion}
              className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm border-2 border-emerald-400 border-b-4 border-b-emerald-700 shadow-md cursor-pointer flex items-center justify-center gap-2 active:translate-y-0.5 transition-all"
            >
              <span>{qIndex + 1 === QUESTIONS_PER_ROUND ? 'Finish Lab 🏆' : 'Next Experiment ➡️'}</span>
            </button>
          </motion.div>
        )}
      </div>

      {/* ── Round Result Modal ── */}
      <RoundResult
        show={showResult}
        xpEarned={xpEarned}
        correct={correctCount}
        total={QUESTIONS_PER_ROUND}
        onNext={handleNewRound}
        onExit={() => {
          if (typeof window !== 'undefined') window.location.href = '/games'
        }}
      />
    </GameShell>
  )
}
