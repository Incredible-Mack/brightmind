'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameShell, RoundResult, burstConfetti, playGameSound } from '@/components/games/GameShell'
import { useAppStore } from '@/store/useAppStore'
import { getAgeGroup } from '@/lib/curriculum.data'
import type { AgeGroup } from '@/types/child'

/* ─── Constants ─────────────────────────────────────────────────────────── */
const TOTAL_QUESTIONS = 10
const BASE_XP = 10

const MONSTERS = ['👹', '🐉', '👾', '🦂', '🧟'] as const
const KNIGHT = '⚔️'

/* ─── Question Generator ─────────────────────────────────────────────────── */
interface Question {
  question: string
  answer: number
  options: number[]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function uniqueOptions(correct: number, count: number, min: number, max: number): number[] {
  const opts = new Set<number>([correct])
  let attempts = 0
  while (opts.size < count && attempts < 200) {
    attempts++
    const delta = Math.floor(Math.random() * 7) - 3
    const candidate = correct + delta
    if (candidate !== correct && candidate >= min && candidate <= max) {
      opts.add(candidate)
    }
  }
  // Fill if still short
  let fill = min
  while (opts.size < count) {
    if (!opts.has(fill)) opts.add(fill)
    fill++
  }
  return shuffle(Array.from(opts).slice(0, count))
}

function generateQuestion(ageGroup: AgeGroup): Question {
  const r = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a

  if (ageGroup === '0-5') {
    // Simple addition: 1–5 + 1–5
    const a = r(1, 5)
    const b = r(1, 5)
    const answer = a + b
    return {
      question: `${a} + ${b} = ?`,
      answer,
      options: uniqueOptions(answer, 4, 2, 10),
    }
  }

  if (ageGroup === '6-8') {
    // Addition/subtraction up to 20
    const op = Math.random() < 0.5 ? '+' : '-'
    if (op === '+') {
      const a = r(1, 15)
      const b = r(1, 20 - a)
      const answer = a + b
      return {
        question: `${a} + ${b} = ?`,
        answer,
        options: uniqueOptions(answer, 4, 1, 20),
      }
    } else {
      const b = r(1, 15)
      const a = r(b, 20)
      const answer = a - b
      return {
        question: `${a} − ${b} = ?`,
        answer,
        options: uniqueOptions(answer, 4, 0, 19),
      }
    }
  }

  if (ageGroup === '9-11') {
    // Multiplication tables 2–9
    const a = r(2, 9)
    const b = r(2, 9)
    const answer = a * b
    return {
      question: `${a} × ${b} = ?`,
      answer,
      options: uniqueOptions(answer, 4, 4, 81),
    }
  }

  // 12-14: division or decimal fractions
  const useDecimal = Math.random() < 0.4
  if (useDecimal) {
    const halves = [0.5, 0.25, 0.75, 1.5, 2.5]
    const val = halves[r(0, halves.length - 1)]
    const mult = r(2, 8)
    const answer = parseFloat((val * mult).toFixed(2))
    return {
      question: `${val} × ${mult} = ?`,
      answer,
      options: shuffle([
        answer,
        parseFloat((answer + 0.25).toFixed(2)),
        parseFloat((answer - 0.25).toFixed(2)),
        parseFloat((answer + 0.5).toFixed(2)),
      ]),
    }
  } else {
    // Integer division
    const b = r(2, 9)
    const answer = r(2, 9)
    const a = b * answer
    return {
      question: `${a} ÷ ${b} = ?`,
      answer,
      options: uniqueOptions(answer, 4, 1, 81),
    }
  }
}

/* ─── XP Toast ───────────────────────────────────────────────────────────── */
interface XpToastProps {
  id: number
  amount: number
  combo: number
}

function XpToast({ amount, combo }: Omit<XpToastProps, 'id'>) {
  return (
    <motion.div
      className="pointer-events-none absolute -top-14 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center"
      initial={{ opacity: 0, y: 0, scale: 0.6 }}
      animate={{ opacity: 1, y: -20, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.8 }}
      transition={{ type: 'spring', damping: 12, stiffness: 300 }}
    >
      <span className="text-2xl font-black text-amber-500 drop-shadow-lg whitespace-nowrap">
        +{amount} XP ⭐
      </span>
      {combo >= 2 && (
        <span className="text-xs font-black text-orange-500 bg-orange-100 rounded-full px-2 py-0.5 mt-0.5">
          {combo}× Combo! 🔥
        </span>
      )}
    </motion.div>
  )
}

/* ─── Main Game Component ────────────────────────────────────────────────── */
export default function MathQuestPage() {
  const { child, addXP, loseLive } = useAppStore()
  const ageGroup: AgeGroup =
    (child as unknown as { age_group?: AgeGroup })?.age_group ??
    (child?.age ? getAgeGroup(child.age) : '6-8')

  /* ── State ── */
  const [roundIndex, setRoundIndex] = useState(0) // which round (for monster cycling)
  const [questionIndex, setQuestionIndex] = useState(0) // 0–9 within the round
  const [question, setQuestion] = useState<Question>(() => generateQuestion(ageGroup))
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [wrongOption, setWrongOption] = useState<number | null>(null)
  const [phase, setPhase] = useState<'idle' | 'correct' | 'wrong' | 'result'>('idle')
  const [comboStreak, setComboStreak] = useState(0)
  const [roundCorrect, setRoundCorrect] = useState(0)
  const [roundXP, setRoundXP] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [toastQueue, setToastQueue] = useState<XpToastProps[]>([])
  const [monsterDefeated, setMonsterDefeated] = useState(false)
  const [knightHit, setKnightHit] = useState(false)
  const toastIdRef = useRef(0)

  const monster = MONSTERS[roundIndex % MONSTERS.length]

  /* ── New question helper ── */
  const nextQuestion = useCallback(() => {
    setQuestion(generateQuestion(ageGroup))
    setSelectedOption(null)
    setWrongOption(null)
    setMonsterDefeated(false)
    setKnightHit(false)
    setPhase('idle')
  }, [ageGroup])

  /* ── Answer handler ── */
  const handleAnswer = useCallback(
    (option: number) => {
      if (phase !== 'idle') return
      setSelectedOption(option)

      const isCorrect = option === question.answer

      if (isCorrect) {
        const newCombo = comboStreak + 1
        const multiplier = Math.min(3, newCombo)
        const xpEarned = BASE_XP * multiplier
        setComboStreak(newCombo)
        setRoundCorrect((c) => c + 1)
        setRoundXP((x) => x + xpEarned)
        addXP(xpEarned)
        setMonsterDefeated(true)
        setPhase('correct')
        playGameSound('correct')

        // XP toast
        const id = ++toastIdRef.current
        setToastQueue((q) => [...q, { id, amount: xpEarned, combo: newCombo }])
        setTimeout(() => setToastQueue((q) => q.filter((t) => t.id !== id)), 1500)

        // Advance
        setTimeout(() => {
          const nextIdx = questionIndex + 1
          if (nextIdx >= TOTAL_QUESTIONS) {
            setPhase('result')
            setShowResult(true)
            playGameSound('complete')
          } else {
            setQuestionIndex(nextIdx)
            nextQuestion()
          }
        }, 900)
      } else {
        setComboStreak(0)
        setWrongOption(option)
        setKnightHit(true)
        setPhase('wrong')
        loseLive()
        playGameSound('wrong')

        // Briefly flash wrong, then advance
        setTimeout(() => {
          const nextIdx = questionIndex + 1
          if (nextIdx >= TOTAL_QUESTIONS) {
            setPhase('result')
            setShowResult(true)
            playGameSound('complete')
          } else {
            setQuestionIndex(nextIdx)
            nextQuestion()
          }
        }, 1100)
      }
    },
    [phase, question.answer, comboStreak, addXP, loseLive, questionIndex, nextQuestion],
  )

  /* ── Next round / exit ── */
  const handleNextRound = useCallback(() => {
    const newRound = roundIndex + 1
    setRoundIndex(newRound)
    setQuestionIndex(0)
    setRoundCorrect(0)
    setRoundXP(0)
    setComboStreak(0)
    setShowResult(false)
    if (roundCorrect >= Math.ceil(TOTAL_QUESTIONS * 0.6)) {
      burstConfetti()
    }
    nextQuestion()
  }, [roundIndex, roundCorrect, nextQuestion])

  const handleExit = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.href = '/games'
    }
  }, [])

  /* ── Regenerate question when ageGroup changes ── */
  useEffect(() => {
    setQuestion(generateQuestion(ageGroup))
  }, [ageGroup])

  /* ── Progress bar percentage ── */
  const progressPct = (questionIndex / TOTAL_QUESTIONS) * 100

  /* ── Colour helpers ── */
  const ageAccentMap: Record<AgeGroup, { accent: string; bg: string }> = {
    '0-5':   { accent: '#10b981', bg: '#f0fdf4' },
    '6-8':   { accent: '#3b82f6', bg: '#eff6ff' },
    '9-11':  { accent: '#a855f7', bg: '#faf5ff' },
    '12-14': { accent: '#f97316', bg: '#fff7ed' },
  }
  const { accent, bg } = ageAccentMap[ageGroup]

  return (
    <GameShell
      title="Math Quest"
      emoji="⚔️"
      accentColor={accent}
      bgColor={bg}
    >
      {/* ── Progress Bar ─────────────────────────────────────────────────── */}
      <div className="w-full max-w-lg mb-5">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
            Round {roundIndex + 1}
          </span>
          <span className="text-xs font-black text-slate-500">
            {questionIndex}/{TOTAL_QUESTIONS}
          </span>
        </div>
        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: accent }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* ── Battle Arena ─────────────────────────────────────────────────── */}
      <div className="w-full max-w-lg flex items-center justify-center gap-6 mb-6">
        {/* Knight */}
        <motion.div
          className="flex flex-col items-center gap-1"
          animate={
            knightHit
              ? { x: [-8, 8, -6, 6, 0], rotate: [-5, 5, -3, 3, 0] }
              : { x: 0, rotate: 0 }
          }
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-5xl shadow-lg border-4 border-white"
            style={{ background: `${accent}22` }}
            animate={
              phase === 'correct'
                ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }
                : { scale: 1, rotate: 0 }
            }
            transition={{ duration: 0.5 }}
          >
            {KNIGHT}
          </motion.div>
          <span className="text-xs font-black text-slate-600">Knight</span>
        </motion.div>

        {/* VS badge */}
        <motion.div
          className="flex flex-col items-center"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-sm shadow-md"
            style={{ background: accent }}
          >
            VS
          </div>
        </motion.div>

        {/* Monster */}
        <div className="flex flex-col items-center gap-1 relative">
          <AnimatePresence mode="wait">
            {!monsterDefeated ? (
              <motion.div
                key="monster-alive"
                className="w-20 h-20 rounded-3xl flex items-center justify-center text-5xl shadow-lg border-4 border-white bg-rose-50"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.3, opacity: 0, rotate: 180 }}
                transition={{ type: 'spring', damping: 12 }}
              >
                {monster}
              </motion.div>
            ) : (
              <motion.div
                key="monster-defeated"
                className="w-20 h-20 rounded-3xl flex items-center justify-center text-5xl"
                initial={{ scale: 1 }}
                animate={{ scale: 0.3, opacity: 0, rotate: 180 }}
                transition={{ duration: 0.5 }}
              >
                {monster}
              </motion.div>
            )}
          </AnimatePresence>
          <span className="text-xs font-black text-slate-600">Monster</span>

          {/* XP Toast portal */}
          <div className="relative">
            <AnimatePresence>
              {toastQueue.map((t) => (
                <XpToast key={t.id} amount={t.amount} combo={t.combo} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Equation Banner ───────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`q-${roundIndex}-${questionIndex}`}
          className="w-full max-w-lg mb-6"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 18, stiffness: 280 }}
        >
          <div
            className="relative rounded-3xl border-4 border-white shadow-xl px-8 py-6 text-center"
            style={{ background: `${accent}18`, borderColor: `${accent}44` }}
          >
            {/* Scroll decorations */}
            <div
              className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-10 rounded-full border-2"
              style={{ background: `${accent}33`, borderColor: `${accent}55` }}
            />
            <div
              className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-10 rounded-full border-2"
              style={{ background: `${accent}33`, borderColor: `${accent}55` }}
            />

            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: accent }}>
              Solve the equation!
            </p>
            <motion.p
              className="text-4xl sm:text-5xl font-black text-slate-800"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
            >
              {question.question}
            </motion.p>

            {/* Combo indicator */}
            {comboStreak >= 2 && (
              <motion.div
                className="inline-flex items-center gap-1 mt-3 bg-orange-100 text-orange-600 font-black text-xs px-3 py-1 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10 }}
              >
                🔥 {comboStreak}× Combo — {Math.min(3, comboStreak)}× XP!
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Answer Choices ────────────────────────────────────────────────── */}
      <div className="w-full max-w-lg grid grid-cols-2 gap-3 mb-6">
        {question.options.map((option, i) => {
          const isSelected = selectedOption === option
          const isCorrectChoice = option === question.answer
          const isWrong = wrongOption === option

          let btnStyle = 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:scale-[1.02] active:scale-95'

          if (phase !== 'idle') {
            if (isCorrectChoice && phase === 'correct') {
              btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-700 scale-105'
            } else if (isWrong) {
              btnStyle = 'bg-rose-50 border-rose-400 text-rose-700'
            } else {
              btnStyle = 'bg-white border-slate-200 text-slate-400 opacity-50 cursor-not-allowed'
            }
          }

          return (
            <motion.button
              key={`${roundIndex}-${questionIndex}-${i}`}
              type="button"
              onClick={() => handleAnswer(option)}
              disabled={phase !== 'idle'}
              className={`relative flex items-center justify-center rounded-2xl border-2 border-b-4 py-4 px-4 font-black text-2xl sm:text-3xl transition-all cursor-pointer select-none ${btnStyle}`}
              initial={{ opacity: 0, y: 15 }}
              animate={
                isWrong
                  ? { x: [-8, 8, -6, 6, -4, 4, 0], opacity: 1, y: 0 }
                  : { opacity: 1, y: 0, x: 0 }
              }
              transition={
                isWrong
                  ? { duration: 0.5 }
                  : { delay: i * 0.07, type: 'spring', damping: 18 }
              }
              whileTap={phase === 'idle' ? { scale: 0.93 } : {}}
            >
              {option}
              {/* Correct tick overlay */}
              {isCorrectChoice && phase === 'correct' && (
                <motion.span
                  className="absolute top-1 right-2 text-emerald-500 text-sm font-black"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10 }}
                >
                  ✓
                </motion.span>
              )}
              {/* Wrong X overlay */}
              {isWrong && (
                <motion.span
                  className="absolute top-1 right-2 text-rose-500 text-sm font-black"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10 }}
                >
                  ✗
                </motion.span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* ── Feedback Banner ───────────────────────────────────────────────── */}
      <div className="w-full max-w-lg h-10 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {phase === 'correct' && (
            <motion.div
              key="correct-feedback"
              className="flex items-center gap-2 bg-emerald-100 text-emerald-700 font-black text-sm px-5 py-2 rounded-2xl"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: 'spring', damping: 12 }}
            >
              <span className="text-lg">✅</span> Correct! Great job!
            </motion.div>
          )}
          {phase === 'wrong' && (
            <motion.div
              key="wrong-feedback"
              className="flex items-center gap-2 bg-rose-100 text-rose-700 font-black text-sm px-5 py-2 rounded-2xl"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: 'spring', damping: 12 }}
            >
              <span className="text-lg">❌</span> Not quite — the answer was{' '}
              <span className="underline underline-offset-2">{question.answer}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Round Result Overlay ──────────────────────────────────────────── */}
      <RoundResult
        show={showResult}
        xpEarned={roundXP}
        correct={roundCorrect}
        total={TOTAL_QUESTIONS}
        onNext={handleNextRound}
        onExit={handleExit}
      />
    </GameShell>
  )
}
