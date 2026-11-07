'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameShell, RoundResult, burstConfetti, playGameSound, GamePromptCloud, GameMascotHill, GameOptionButton, speakGameText } from '@/components/games/GameShell'
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
        }, 1300)
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
        }, 1500)
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
      progress={questionIndex + 1}
      totalProgress={TOTAL_QUESTIONS}
      onSpeak={() => speakGameText('What is ' + question.question.replace('?', ''))}
    >
      {/* ── Mini Battle Arena Bar ─────────────────────────────────────────── */}
      <div className="w-full max-w-md flex items-center justify-between px-3 py-1 mb-1 z-20">
        {/* Knight Badge */}
        <motion.div
          className="flex items-center gap-2 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-2xl border-2 border-white shadow-sm"
          animate={
            knightHit
              ? { x: [-6, 6, -4, 4, 0], rotate: [-4, 4, 0] }
              : { x: 0, rotate: 0 }
          }
          transition={{ duration: 0.4 }}
        >
          <span className="text-2xl">{KNIGHT}</span>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Knight</span>
            <span className="text-xs font-black text-slate-700">Hero</span>
          </div>
        </motion.div>

        {/* Center Streak / XP Indicator */}
        <div className="flex items-center gap-1.5">
          {comboStreak >= 2 ? (
            <motion.div
              className="bg-amber-400 text-amber-950 font-black text-xs px-3 py-1 rounded-full shadow-sm flex items-center gap-1"
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            >
              <span>🔥</span>
              <span>{comboStreak}× Combo!</span>
            </motion.div>
          ) : (
            <span className="text-xs font-black text-slate-600 bg-white/70 px-3 py-1 rounded-full">
              Round {roundIndex + 1}
            </span>
          )}
        </div>

        {/* Monster Badge */}
        <motion.div
          className="flex items-center gap-2 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-2xl border-2 border-white shadow-sm"
          animate={
            phase === 'correct'
              ? { x: [0, 8, -6, 0], opacity: [1, 0.7, 1] }
              : {}
          }
        >
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">Monster</span>
            <span className="text-xs font-black text-rose-700">Boss</span>
          </div>
          <AnimatePresence mode="wait">
            {!monsterDefeated ? (
              <motion.span
                key="monster-alive"
                className="text-2xl"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0, rotate: 180 }}
              >
                {monster}
              </motion.span>
            ) : (
              <motion.span
                key="monster-defeated"
                className="text-2xl"
                initial={{ scale: 1 }}
                animate={{ scale: 0, opacity: 0 }}
              >
                💥
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── Big Cartoon Cloud Thought Bubble ──────────────────────────────── */}
      <GamePromptCloud>
        <AnimatePresence mode="wait">
          <motion.div
            key={`q-${roundIndex}-${questionIndex}`}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: 'spring', damping: 15 }}
            className="flex flex-col items-center justify-center py-1"
          >
            <p className="text-3xl sm:text-5xl font-black text-slate-800 tracking-tight select-none">
              {question.question}
            </p>
          </motion.div>
        </AnimatePresence>
      </GamePromptCloud>

      {/* ── Mascot Pip Over Grassy Hill ───────────────────────────────────── */}
      <GameMascotHill speech="Choose the right answer!" />

      {/* ── 3D Pill Answer Buttons (Meadow Stage) ─────────────────────────── */}
      <div className="w-full max-w-md grid grid-cols-2 gap-3 sm:gap-4 my-2 z-20">
        {question.options.map((option, i) => {
          const isCorrectChoice = option === question.answer
          const isWrong = wrongOption === option

          let status: 'idle' | 'correct' | 'wrong' = 'idle'
          if (phase !== 'idle') {
            if (isCorrectChoice && phase === 'correct') {
              status = 'correct'
            } else if (isWrong) {
              status = 'wrong'
            }
          }

          return (
            <GameOptionButton
              key={`${roundIndex}-${questionIndex}-${i}`}
              onClick={() => handleAnswer(option)}
              disabled={phase !== 'idle'}
              status={status}
            >
              {option}
            </GameOptionButton>
          )
        })}
      </div>

      {/* ── Feedback Banner ───────────────────────────────────────────────── */}
      <div className="w-full max-w-md h-9 flex items-center justify-center z-20 mt-1">
        <AnimatePresence mode="wait">
          {phase === 'correct' && (
            <motion.div
              key="correct-feedback"
              className="flex items-center gap-2 bg-emerald-500 text-white font-black text-sm px-5 py-1.5 rounded-full shadow-md"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: 'spring', damping: 14 }}
            >
              <span>🎉</span> Awesome job!
            </motion.div>
          )}
          {phase === 'wrong' && (
            <motion.div
              key="wrong-feedback"
              className="flex items-center gap-2 bg-rose-500 text-white font-black text-sm px-5 py-1.5 rounded-full shadow-md"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: 'spring', damping: 14 }}
            >
              <span>💥</span> Almost! Answer was {question.answer}
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
