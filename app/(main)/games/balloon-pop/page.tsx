'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2 } from 'lucide-react'
import { GameShell, RoundResult, burstConfetti, playGameSound, GamePromptCloud, GameMascotHill, speakGameText } from '@/components/games/GameShell'
import { useAppStore } from '@/store/useAppStore'
import { getAgeGroup } from '@/lib/curriculum.data'
import type { AgeGroup } from '@/types/child'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Balloon {
  id: string
  label: string
  color: BalloonColor
  x: number          // % from left
  duration: number   // float animation seconds
  delay: number      // start delay seconds
  isCorrect: boolean
  popped: boolean
}

type BalloonColor = 'red' | 'blue' | 'green' | 'orange' | 'purple' | 'pink'

interface Question {
  prompt: string        // e.g. "Pop the balloon with the letter B"
  target: string        // the phoneme / letter / blend being tested
  correctLabel: string  // what the correct balloon shows
}

// ─── Phonics Data ────────────────────────────────────────────────────────────

const LETTERS = 'ABCDEFGHIJKLMNOPRSTW'.split('')

const CVC_WORDS: Record<string, string[]> = {
  B: ['big', 'bat', 'bed', 'bug', 'bin'],
  C: ['cat', 'cup', 'cut', 'can', 'cot'],
  D: ['dog', 'dig', 'dot', 'dip', 'den'],
  F: ['fig', 'fat', 'fit', 'fun', 'fog'],
  G: ['got', 'get', 'gap', 'gig', 'gun'],
  H: ['hat', 'hit', 'hot', 'hen', 'hub'],
  J: ['jug', 'jet', 'jot', 'jam', 'jig'],
  L: ['log', 'lip', 'let', 'lag', 'lug'],
  M: ['map', 'mud', 'met', 'mob', 'mug'],
  N: ['nap', 'net', 'nod', 'nut', 'nib'],
  P: ['pat', 'pet', 'pit', 'pot', 'pun'],
  R: ['rat', 'rod', 'rug', 'rip', 'rem'],
  S: ['sat', 'set', 'sob', 'sun', 'sip'],
  T: ['tap', 'tip', 'tot', 'tug', 'ten'],
  W: ['wet', 'win', 'wag', 'web', 'wig'],
}

const BLENDS: Record<string, string[]> = {
  sh: ['ship', 'shop', 'shed', 'shell', 'shift', 'sharp'],
  ch: ['chip', 'chop', 'chin', 'chat', 'chest', 'chunk'],
  th: ['that', 'this', 'them', 'thin', 'thick', 'third'],
  bl: ['blue', 'black', 'blade', 'blank', 'blast', 'blend'],
  br: ['brag', 'brim', 'brick', 'brown', 'bring', 'brave'],
  cl: ['clap', 'clip', 'clam', 'club', 'clown', 'clear'],
  cr: ['crab', 'crop', 'crow', 'cram', 'crisp', 'cross'],
  dr: ['drag', 'drip', 'drop', 'drum', 'drew', 'draft'],
  fl: ['flat', 'flip', 'flock', 'flap', 'flew', 'flesh'],
  fr: ['frog', 'from', 'frill', 'fresh', 'frost', 'free'],
  gr: ['grab', 'grid', 'grip', 'grin', 'grub', 'green'],
  pl: ['plan', 'plop', 'plug', 'plus', 'play', 'plant'],
  pr: ['prod', 'prop', 'prim', 'press', 'prey', 'print'],
  sl: ['slap', 'slim', 'slip', 'slop', 'slug', 'sleep'],
  sm: ['smug', 'smog', 'smash', 'smell', 'smile', 'smoke'],
  sn: ['snag', 'snap', 'snip', 'snob', 'snug', 'snow'],
  sp: ['span', 'spin', 'spot', 'spun', 'spit', 'spend'],
  st: ['stab', 'stem', 'step', 'stop', 'stub', 'stand'],
  sw: ['swam', 'swim', 'swig', 'swop', 'swan', 'swept'],
  tr: ['trap', 'trim', 'trip', 'trot', 'truck', 'track'],
}

const PHONEME_WORDS: Record<string, string[]> = {
  '-tion': ['nation', 'station', 'motion', 'action', 'fiction', 'section'],
  '-ight': ['night', 'light', 'right', 'might', 'fight', 'bright'],
  '-ough': ['rough', 'tough', 'through', 'though', 'cough', 'enough'],
  '-ture': ['nature', 'future', 'picture', 'feature', 'capture', 'fixture'],
  'ph/f': ['phone', 'photo', 'phrase', 'sphere', 'graph', 'phobia'],
  'silent k': ['knee', 'knot', 'know', 'knife', 'knock', 'knight'],
  'silent w': ['wrap', 'wrist', 'write', 'wrong', 'wreck', 'wren'],
  'soft g': ['gem', 'germ', 'giant', 'gentle', 'giraffe', 'genius'],
}

// ─── Balloon visuals ─────────────────────────────────────────────────────────

const BALLOON_COLORS: BalloonColor[] = ['red', 'blue', 'green', 'orange', 'purple', 'pink']

const COLOR_STYLES: Record<BalloonColor, { body: string; shine: string; string: string; shadow: string }> = {
  red:    { body: '#ef4444', shine: '#fca5a5', string: '#b91c1c', shadow: '#dc2626' },
  blue:   { body: '#3b82f6', shine: '#93c5fd', string: '#1d4ed8', shadow: '#2563eb' },
  green:  { body: '#22c55e', shine: '#86efac', string: '#15803d', shadow: '#16a34a' },
  orange: { body: '#f97316', shine: '#fdba74', string: '#c2410c', shadow: '#ea580c' },
  purple: { body: '#a855f7', shine: '#d8b4fe', string: '#7e22ce', shadow: '#9333ea' },
  pink:   { body: '#ec4899', shine: '#f9a8d4', string: '#be185d', shadow: '#db2777' },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function uid() {
  return Math.random().toString(36).slice(2)
}

/** Build a question for the given age group */
function buildQuestion(ageGroup: AgeGroup): Question {
  switch (ageGroup) {
    case '0-5': {
      const letter = pick(LETTERS)
      return {
        prompt: `Pop the balloon with the letter`,
        target: letter,
        correctLabel: letter,
      }
    }
    case '6-8': {
      const letters = Object.keys(CVC_WORDS)
      const letter = pick(letters)
      const word = pick(CVC_WORDS[letter])
      return {
        prompt: `Pop the word that starts with`,
        target: letter,
        correctLabel: word,
      }
    }
    case '9-11': {
      const blends = Object.keys(BLENDS)
      const blend = pick(blends)
      const word = pick(BLENDS[blend])
      return {
        prompt: `Pop the word with the blend`,
        target: blend,
        correctLabel: word,
      }
    }
    case '12-14': {
      const phonemes = Object.keys(PHONEME_WORDS)
      const phoneme = pick(phonemes)
      const word = pick(PHONEME_WORDS[phoneme])
      return {
        prompt: `Pop the word with the phoneme`,
        target: phoneme,
        correctLabel: word,
      }
    }
  }
}

/** Build distractor labels (wrong balloons) for a given age group */
function buildDistractors(ageGroup: AgeGroup, correct: string, count: number): string[] {
  const pool: string[] = []

  switch (ageGroup) {
    case '0-5':
      pool.push(...LETTERS.filter(l => l !== correct))
      break
    case '6-8': {
      const startLetter = correct[0].toUpperCase()
      Object.entries(CVC_WORDS).forEach(([letter, words]) => {
        if (letter !== startLetter) pool.push(...words)
      })
      break
    }
    case '9-11': {
      Object.entries(BLENDS).forEach(([blend, words]) => {
        if (!words.includes(correct)) pool.push(...words)
      })
      break
    }
    case '12-14': {
      Object.entries(PHONEME_WORDS).forEach(([, words]) => {
        if (!words.includes(correct)) pool.push(...words)
      })
      break
    }
  }

  return shuffle(pool).slice(0, count)
}

/** Build the full balloon set for one question */
function buildBalloons(question: Question, ageGroup: AgeGroup, count: number): Balloon[] {
  const distractors = buildDistractors(ageGroup, question.correctLabel, count - 1)
  const labels = shuffle([question.correctLabel, ...distractors.slice(0, count - 1)])
  const colors = shuffle([...BALLOON_COLORS]).slice(0, count)

  return labels.map((label, i) => ({
    id: uid(),
    label,
    color: colors[i % colors.length],
    x: 10 + (i / (labels.length - 1 || 1)) * 80,
    duration: 14 + Math.random() * 4,
    delay: Math.random() * 1.5,
    isCorrect: label === question.correctLabel,
    popped: false,
  }))
}

// ─── TTS helper ──────────────────────────────────────────────────────────────

async function speak(text: string) {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audio.play()
  } catch {
    // TTS failure is non-blocking
  }
}

// ─── Balloon SVG ─────────────────────────────────────────────────────────────

function BalloonSVG({ color, label }: { color: BalloonColor; label: string }) {
  const c = COLOR_STYLES[color]
  const isLong = label.length > 5
  const fontSize = isLong ? 11 : label.length > 3 ? 13 : 16

  return (
    <svg viewBox="0 0 80 120" className="w-full h-full drop-shadow-md" aria-hidden>
      {/* balloon body */}
      <ellipse cx="40" cy="48" rx="32" ry="36" fill={c.body} />
      {/* shine highlight */}
      <ellipse cx="30" cy="30" rx="10" ry="12" fill={c.shine} opacity="0.45" />
      {/* knot */}
      <ellipse cx="40" cy="84" rx="4" ry="4" fill={c.shadow} />
      {/* string */}
      <path d="M40 88 Q44 100 40 112" stroke={c.string} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* label */}
      <text
        x="40"
        y="52"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fontSize}
        fontWeight="800"
        fontFamily="Nunito, sans-serif"
        fill="white"
        style={{ textShadow: `0 1px 2px ${c.shadow}` }}
      >
        {label}
      </text>
    </svg>
  )
}

// ─── Main Game Component ──────────────────────────────────────────────────────

const QUESTIONS_PER_ROUND = 8
const BALLOON_COUNT = 5

export default function BalloonPopPage() {
  const { child, addXP, loseLive } = useAppStore()
  const ageGroup: AgeGroup = (child as any)?.age_group || (child?.age ? getAgeGroup(child.age) : '0-5')

  // ── Game State ──
  const [phase, setPhase] = useState<'playing' | 'result'>('playing')
  const [currentQ, setCurrentQ] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [xpEarned, setXpEarned] = useState(0)
  const [wrongFlash, setWrongFlash] = useState(false)

  // ── Question / Balloons State ──
  const [question, setQuestion] = useState<Question>(() => buildQuestion(ageGroup))
  const [balloons, setBalloons] = useState<Balloon[]>([])
  const [poppedId, setPoppedId] = useState<string | null>(null)
  const [lockedOut, setLockedOut] = useState(false)

  // ── XP toast ──
  const [showXPToast, setShowXPToast] = useState(false)
  const xpToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Init balloons for first question ──
  useEffect(() => {
    setBalloons(buildBalloons(question, ageGroup, BALLOON_COUNT))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Speak prompt on new question ──
  useEffect(() => {
    if (phase === 'playing') {
      speak(`${question.prompt} ${question.target}`)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, phase])

  const advanceQuestion = useCallback(() => {
    const nextQ = currentQ + 1
    if (nextQ >= QUESTIONS_PER_ROUND) {
      setPhase('result')
      return
    }
    setCurrentQ(nextQ)
    const newQ = buildQuestion(ageGroup)
    setQuestion(newQ)
    setBalloons(buildBalloons(newQ, ageGroup, BALLOON_COUNT))
    setPoppedId(null)
    setLockedOut(false)
  }, [currentQ, ageGroup])

  const handlePop = useCallback(
    (balloon: Balloon, event: React.MouseEvent<HTMLDivElement>) => {
      if (lockedOut || balloon.popped) return

      setPoppedId(balloon.id)
      setLockedOut(true)

      setBalloons(prev =>
        prev.map(b => (b.id === balloon.id ? { ...b, popped: true } : b))
      )

      if (balloon.isCorrect) {
        // ── Correct ──
        playGameSound('correct')

        // Confetti at balloon position
        const rect = event.currentTarget.getBoundingClientRect()
        const x = (rect.left + rect.width / 2) / window.innerWidth
        const y = (rect.top + rect.height / 2) / window.innerHeight
        burstConfetti({ origin: { x, y }, particleCount: 60, spread: 60 })

        addXP(8)
        setCorrect(c => c + 1)
        setXpEarned(xp => xp + 8)

        // Show XP toast
        setShowXPToast(true)
        if (xpToastTimer.current) clearTimeout(xpToastTimer.current)
        xpToastTimer.current = setTimeout(() => setShowXPToast(false), 1200)

        setTimeout(advanceQuestion, 1400)
      } else {
        // ── Wrong ──
        playGameSound('wrong')
        loseLive()
        setWrongFlash(true)
        setTimeout(() => setWrongFlash(false), 800)
        // Unlock so child can try again with the other balloons
        setTimeout(() => setLockedOut(false), 600)
      }
    },
    [lockedOut, addXP, loseLive]
  )

  const handleHearAgain = useCallback(() => {
    speak(`${question.prompt} ${question.target}`)
  }, [question])

  const handleNextRound = useCallback(() => {
    setPhase('playing')
    setCurrentQ(0)
    setCorrect(0)
    setXpEarned(0)
    setPoppedId(null)
    setLockedOut(false)
    const newQ = buildQuestion(ageGroup)
    setQuestion(newQ)
    setBalloons(buildBalloons(newQ, ageGroup, BALLOON_COUNT))
  }, [ageGroup])

  const handleExit = useCallback(() => {
    if (typeof window !== 'undefined') window.location.href = '/games'
  }, [])

  // ── Difficulty label ──
  const difficultyLabel: Record<AgeGroup, string> = {
    '0-5': 'Letters',
    '6-8': 'CVC Words',
    '9-11': 'Blends',
    '12-14': 'Phonemes',
  }

  return (
    <GameShell
      title="Balloon Pop"
      emoji="🎈"
      accentColor="#0284c7"
      progress={currentQ + 1}
      totalProgress={QUESTIONS_PER_ROUND}
      onSpeak={() => speak(`${question.prompt} ${question.target}`)}
    >
      {/* ── Wrong-answer flash overlay ── */}
      <AnimatePresence>
        {wrongFlash && (
          <motion.div
            className="fixed inset-0 z-40 pointer-events-none"
            style={{ background: 'rgba(239,68,68,0.25)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
        )}
      </AnimatePresence>

      {/* ── XP Toast ── */}
      <AnimatePresence>
        {showXPToast && (
          <motion.div
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-amber-400 text-amber-950 font-black text-lg px-6 py-2 rounded-full shadow-lg pointer-events-none border-2 border-white"
            initial={{ opacity: 0, y: -10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
          >
            +8 XP ⭐
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cartoon Cloud Thought Bubble ─────────────────────────────────── */}
      <GamePromptCloud>
        <motion.div
          key={question.target}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 16 }}
          className="flex flex-col items-center justify-center py-1"
        >
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest mb-1">
            {difficultyLabel[ageGroup]} · Question {currentQ + 1} of {QUESTIONS_PER_ROUND}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xl sm:text-2xl font-black text-slate-800">
              {question.prompt}
            </span>
            <span className="inline-block bg-[#fef08a] border-2 border-amber-300 text-amber-900 rounded-2xl px-4 py-0.5 text-2xl sm:text-3xl font-black shadow-sm">
              {question.target}
            </span>
          </div>
        </motion.div>
      </GamePromptCloud>

      {/* ── Mascot Pip Over Grassy Hill ───────────────────────────────────── */}
      <GameMascotHill
        speech={
          wrongFlash
            ? 'Almost! Try another balloon! 🎈'
            : 'Pop the right balloon! 🎈'
        }
      />

      {/* ── Balloon Floating Meadow Sky Stage ─────────────────────────────── */}
      <div
        className="relative w-full max-w-md mx-auto overflow-hidden rounded-3xl bg-gradient-to-b from-sky-300/30 via-white/40 to-emerald-200/40 border-2 border-white/80 shadow-md my-2 z-20"
        style={{ height: 350 }}
      >
        {/* Soft background cloud doodles */}
        <div className="absolute top-4 left-6 w-16 h-7 rounded-full bg-white/60 blur-xs pointer-events-none" />
        <div className="absolute top-10 right-8 w-20 h-8 rounded-full bg-white/50 blur-xs pointer-events-none" />

        <AnimatePresence>
          {balloons.map(balloon => (
            <motion.div
              key={balloon.id}
              className="absolute cursor-pointer select-none"
              style={{
                left: `${balloon.x}%`,
                transform: 'translateX(-50%)',
                width: 78,
                height: 118,
                bottom: 0,
              }}
              initial={{ y: '100%', opacity: 1 }}
              animate={
                balloon.popped
                  ? { scale: [1, 1.4, 0], opacity: [1, 1, 0] }
                  : { y: '-120%', opacity: 1 }
              }
              exit={{ opacity: 0 }}
              transition={
                balloon.popped
                  ? { duration: 0.35, ease: 'easeOut' }
                  : {
                      y: {
                        duration: balloon.duration,
                        delay: balloon.delay,
                        ease: 'linear',
                        repeat: Infinity,
                        repeatType: 'loop',
                        repeatDelay: 0.4,
                      },
                      opacity: { duration: 0.3 },
                    }
              }
              onClick={e => handlePop(balloon, e)}
              whileHover={balloon.popped ? {} : { scale: 1.1 }}
              whileTap={balloon.popped ? {} : { scale: 0.92 }}
              role="button"
              aria-label={`Balloon with ${balloon.label}`}
            >
              <BalloonSVG color={balloon.color} label={balloon.label} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Tactile 3D Hear Again Button ──────────────────────────────────── */}
      <div className="mt-2 flex justify-center z-20">
        <motion.button
          type="button"
          onClick={handleHearAgain}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border-2 border-white border-b-4 border-b-slate-200 text-[#0284c7] font-black text-sm shadow-md hover:bg-sky-50 transition-colors cursor-pointer active:translate-y-0.5"
        >
          <Volume2 size={18} className="text-[#0284c7]" />
          <span>Hear question again 🔊</span>
        </motion.button>
      </div>

      {/* ── Round Result Overlay ── */}
      <RoundResult
        show={phase === 'result'}
        xpEarned={xpEarned}
        correct={correct}
        total={QUESTIONS_PER_ROUND}
        onNext={handleNextRound}
        onExit={handleExit}
      />
    </GameShell>
  )
}
