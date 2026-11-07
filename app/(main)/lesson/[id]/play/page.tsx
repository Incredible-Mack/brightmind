'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, Volume2, RotateCcw, Check, Heart, Sparkles, MessageCircle } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useLesson } from '@/hooks/useLesson'
import { useAppStore } from '@/store/useAppStore'
import { useVoiceTeacher } from '@/hooks/useVoiceTeacher'
import { useLives } from '@/hooks/useLives'
import { useCoach } from '@/hooks/useCoach'
import { adaptQueue, initialAdaptState, type AdaptState, type PlanItem } from '@/lib/adapt'
import { MatchActivity } from '@/components/lesson/MatchActivity'
import { ActivityImage } from '@/components/lesson/ActivityImage'
import { activityImage, optionImages, stripEmoji } from '@/lib/media'
import { api } from '@/lib/api'
import { fallbackHint, fallbackGradeSpeech } from '@/lib/fallbackTeacher'
import { say, praiseCorrect, cardIntro, lessonGreeting, celebration } from '@/lib/encourage'
import { buildSayTarget, buildIdentify } from '@/lib/sayTarget'
import { cleanForSpeech, isLetterContent, letterScript } from '@/lib/phonics'
import { localAsrSupported, preloadLocalAsr, onAsrStatus } from '@/lib/asr/localAsr'
import { MicrophonePanel } from '@/components/lesson/MicrophonePanel'
import { Pip } from '@/components/mascot/Pip'
import { SpeechBubble } from '@/components/mascot/SpeechBubble'
import { AnimatedSun, DoodleCloud } from '@/components/home/KidsDoodles'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import type { Activity, TypeAnswerContent } from '@/types/activity'
import type { AgeGroup } from '@/types/child'

type AnswerState = 'idle' | 'correct' | 'wrong'
type SayState = 'idle' | 'ask' | 'practice' | 'identify' | 'passed' | 'gaveup'
type NewBadge = { slug: string; title: string; icon: string; xp_bonus: number }

function expectedFor(act: Activity | undefined): string {
  if (!act) return ''
  const a = act as unknown as { expected_answer?: unknown; content?: { expected?: unknown; correct?: unknown } }
  return String(a.expected_answer ?? a.content?.expected ?? a.content?.correct ?? '').trim()
}

function getXP(act: Activity) {
  return (act as unknown as { xp_value?: number }).xp_value ?? act.xp_reward ?? 5
}

function normalizeTapOptions(content: Record<string, unknown>) {
  const opts = (content.options ?? []) as unknown[]
  if (opts.length > 0 && typeof opts[0] === 'object' && opts[0] !== null) {
    return opts as Array<{ id: string; text: string; correct: boolean }>
  }
  const correctVal = String(content.correct ?? '')
  return (opts as unknown[]).map((raw, i) => ({
    id: String(i),
    text: String(raw),
    correct: String(raw) === correctVal,
  }))
}

const NUMBER_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12,
}

interface TeachingData {
  intro: string
  reveal: string
  phrase1: string
  definition: string
  example: string
  actionPrompt: string
  phrase2: string
  identifyPrompt: string
  target: string
  options: Array<{ id: string; text: string; correct: boolean }>
  equation?: string
  operation?: 'add' | 'subtract'
  leftNum?: number
  rightNum?: number
  sum?: number
  leftObjects?: string[]
  rightObjects?: string[]
  isStoryCard?: boolean
  hasOptions?: boolean
}

function parseTeachingPhrases(c: Record<string, unknown>): TeachingData {
  const num = c.number !== undefined ? Number(c.number) : null
  const word = String(c.word ?? (num !== null ? String(num) : '')).trim()

  // 1. Math Equation / Addition / Subtraction
  const rawEquation = [c.equation, c.prompt, c.audio_hint, c.text].filter(Boolean).join(' ')
  const eqMatch = rawEquation.match(/(\d+)\s*([\+\-−])\s*(\d+)\s*(?:=\s*(\d+))?/)
  const isMathOperation = Boolean(c.equation || c.operation === 'add' || c.operation === 'subtract' || eqMatch)

  if (isMathOperation) {
    const isSub = c.operation === 'subtract' || Boolean(eqMatch && (eqMatch[2] === '-' || eqMatch[2] === '−'))
    const leftNum = c.leftNum !== undefined ? Number(c.leftNum) : (eqMatch ? Number(eqMatch[1]) : 1)
    const rightNum = c.rightNum !== undefined ? Number(c.rightNum) : (eqMatch ? Number(eqMatch[3]) : 1)
    const sum = c.sum !== undefined
      ? Number(c.sum)
      : (eqMatch && eqMatch[4] ? Number(eqMatch[4]) : (isSub ? leftNum - rightNum : leftNum + rightNum))
    const opSymbol = isSub ? '−' : '+'
    const opWord = isSub ? 'minus' : 'plus'
    const eqStr = `${leftNum} ${opSymbol} ${rightNum} = ${sum}`
    const targetStr = String(sum)

    const definition = String(c.definition ?? (isSub ? 'Taking away to find what is left' : 'Putting groups together to find the total'))
    const example = String(c.example ?? `${leftNum} ${opWord} ${rightNum} equals ${sum}!`)
    const actionPrompt = String(c.actionPrompt ?? (isSub ? `Count down to ${sum}!` : `Hold up your fingers! Count together: ${sum}! ✌️`))

    const intro = isSub
      ? `Subtraction! Subtraction means taking away from a group.`
      : `Addition! Addition means putting groups together to find the total.`
    const reveal = `This is ${sum}!`
    const phrase1 = `${leftNum} ${opWord} ${rightNum} equals ${sum}! ${definition}. This is ${sum}!`
    const phrase2 = `${example} ${actionPrompt}`
    const identifyPrompt = `Now, identify ${sum} from the list below!`

    const defaultOptNums = Array.from(new Set([Math.max(1, sum - 1), sum, sum + 1])).slice(0, 3)
    const options = Array.isArray(c.options)
      ? normalizeTapOptions({ options: c.options, correct: targetStr })
      : defaultOptNums.map(n => ({ id: String(n), text: String(n), correct: n === sum }))

    const leftObjects = Array.isArray(c.leftObjects) ? (c.leftObjects as string[]) : Array(Math.min(leftNum, 6)).fill('⚽')
    const rightObjects = Array.isArray(c.rightObjects) ? (c.rightObjects as string[]) : Array(Math.min(rightNum, 6)).fill('⚽')

    return {
      intro,
      reveal,
      phrase1,
      definition,
      example,
      actionPrompt,
      phrase2,
      identifyPrompt,
      target: targetStr,
      options,
      equation: eqStr,
      operation: isSub ? 'subtract' : 'add',
      leftNum,
      rightNum,
      sum,
      leftObjects,
      rightObjects,
      hasOptions: true,
      isStoryCard: false,
    }
  }

  if (num === 1) {
    return {
      intro: 'One! One means a single unit of an entity.',
      reveal: 'This is one!',
      phrase1: 'One! One means a single unit of an entity. This is one!',
      definition: 'A single unit of an entity',
      example: 'This is one bouncy soccer ball!',
      actionPrompt: 'Hold up one finger! ☝️',
      phrase2: 'This is one bouncy soccer ball! Can you hold up one finger?',
      identifyPrompt: 'Now, identify One from the list below!',
      target: '1',
      options: [
        { id: '1', text: '1', correct: true },
        { id: '2', text: '2', correct: false },
        { id: '3', text: '3', correct: false },
      ],
      hasOptions: true,
      isStoryCard: false,
    }
  }

  if (num === 2) {
    return {
      intro: 'Two! Two means a pair: one and one more.',
      reveal: 'This is two!',
      phrase1: 'Two! Two means a pair: one and one more. This is two!',
      definition: 'A pair: one and one more',
      example: 'These are two shiny stars in the sky!',
      actionPrompt: 'Hold up two fingers! ✌️',
      phrase2: 'These are two shiny stars! Can you hold up two fingers?',
      identifyPrompt: 'Now, identify Two from the list below!',
      target: '2',
      options: [
        { id: '1', text: '1', correct: false },
        { id: '2', text: '2', correct: true },
        { id: '3', text: '3', correct: false },
      ],
      hasOptions: true,
      isStoryCard: false,
    }
  }

  if (num === 3) {
    return {
      intro: 'Three! Three means a group of three items together.',
      reveal: 'This is three!',
      phrase1: 'Three! Three means a group of three items together. This is three!',
      definition: 'A group of three items',
      example: 'These are three delicious red apples!',
      actionPrompt: 'Hold up three fingers! 🤟',
      phrase2: 'These are three delicious red apples! Can you hold up three fingers?',
      identifyPrompt: 'Now, identify Three from the list below!',
      target: '3',
      options: [
        { id: '1', text: '1', correct: false },
        { id: '2', text: '2', correct: false },
        { id: '3', text: '3', correct: true },
      ],
      hasOptions: true,
      isStoryCard: false,
    }
  }

  if (num !== null && !isNaN(num)) {
    const numWord = word || String(num)
    const targetStr = String(num)
    const optTexts = [String(Math.max(1, num - 1)), String(num), String(num + 1)]
    return {
      intro: `${numWord}! ${numWord} means a quantity of ${num}.`,
      reveal: `This is ${numWord}!`,
      phrase1: `${numWord}! ${numWord} means a quantity of ${num}. This is ${numWord}!`,
      definition: `A quantity of ${num}`,
      example: `Count along with ${numWord}!`,
      actionPrompt: `Count out loud: ${num}!`,
      phrase2: `Look at the items! Count out loud: ${num}!`,
      identifyPrompt: `Now, identify ${numWord} from the list below!`,
      target: targetStr,
      options: optTexts.map(t => ({ id: t, text: t, correct: t === targetStr })),
      hasOptions: true,
      isStoryCard: false,
    }
  }

  const letter = c.letter as string | undefined
  if (letter) {
    const letUpper = letter.toUpperCase()
    const w = word || (c.word as string) || letUpper
    const targetStr = letUpper
    const pool = [letUpper, letUpper === 'A' ? 'B' : 'A', letUpper === 'C' ? 'D' : 'C']
    return {
      intro: `${letUpper}! ${letUpper} is for ${w}!`,
      reveal: `This is ${letUpper}!`,
      phrase1: `${letUpper}! ${letUpper} is for ${w}!`,
      definition: `The letter ${letUpper}`,
      example: `${letUpper} makes the sound /${letUpper.toLowerCase()}/!`,
      actionPrompt: `Say the sound: /${letUpper.toLowerCase()}/!`,
      phrase2: `Say the sound: /${letUpper.toLowerCase()}/ like in ${w}!`,
      identifyPrompt: `Identify ${letUpper} from the list below!`,
      target: targetStr,
      options: pool.map(t => ({ id: t, text: t, correct: t === targetStr })),
      hasOptions: true,
      isStoryCard: false,
    }
  }

  // 4. Activity with explicit options array in content
  const rawOpts = Array.isArray(c.options) && c.options.length > 0 ? (c.options as unknown[]) : null
  const targetStr = String(c.correct ?? c.expected ?? c.answer ?? word ?? '').trim()

  if (rawOpts) {
    const hint = String(c.audio_hint ?? c.prompt ?? c.text ?? 'Listen carefully!')
    const def = c.definition ? String(c.definition) : ''
    const ex = c.example ? String(c.example) : hint
    const actP = c.actionPrompt ? String(c.actionPrompt) : ''
    const normalized = normalizeTapOptions({ options: rawOpts, correct: targetStr || String(rawOpts[0]) })
    return {
      intro: hint,
      reveal: targetStr ? `This is ${targetStr}!` : hint,
      phrase1: def ? `${hint} ${def}.` : hint,
      definition: def,
      example: ex,
      actionPrompt: actP,
      phrase2: actP ? `${ex} ${actP}` : ex,
      identifyPrompt: targetStr ? `Find ${targetStr} below!` : 'Tap the correct answer below!',
      target: targetStr,
      options: normalized,
      hasOptions: true,
      isStoryCard: false,
    }
  }

  // 5. Concept / Narrative / Story slide (Colours, Science, Art, Life Skills, etc.)
  const textPrompt = String(c.prompt ?? c.text ?? c.audio_hint ?? 'Listen carefully!')
  const def = c.definition ? String(c.definition) : ''
  const ex = c.example ? String(c.example) : ''
  const actP = c.actionPrompt ? String(c.actionPrompt) : ''
  return {
    intro: textPrompt,
    reveal: targetStr ? `This is ${targetStr}!` : '',
    phrase1: textPrompt,
    definition: def,
    example: ex,
    actionPrompt: actP,
    phrase2: actP ? `${textPrompt} ${actP}` : textPrompt,
    identifyPrompt: '',
    target: targetStr,
    options: [],
    hasOptions: false,
    isStoryCard: true,
  }
}

function extractNumberPairs(text: string) {
  const tokens = text.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/)
  const pairs = tokens
    .filter(t => NUMBER_WORDS.hasOwnProperty(t))
    .map(word => ({ word, numeral: NUMBER_WORDS[word] }))
  return pairs.length >= 2 ? pairs : null
}

function micAvailable(serverStt: boolean): boolean {
  if (typeof window === 'undefined') return false
  const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown; MediaRecorder?: unknown }
  if (w.SpeechRecognition ?? w.webkitSpeechRecognition) return true
  return Boolean(w.MediaRecorder) && (localAsrSupported() || serverStt)
}

export default function LessonPlayPage() {
  const { id } = useParams<{ id: string }>()
  const isDemo = id === 'demo' || id === '0'
  const router = useRouter()
  const { child, loseLive, hydrateProfile, addXP } = useAppStore()
  const childId = child?.id ? Number(child.id) : null
  const { lesson, activities: planned, reserve: plannedReserve, reason, loading, load } = useLesson(id, childId, {
    name: child?.name ?? 'friend',
    interest: child?.learning_profile?.interests?.[0],
  }, true)

  const [queueOverride, setQueueOverride] = useState<PlanItem[] | null>(null)
  const activities = queueOverride ?? (planned as PlanItem[]) ?? []
  const reserveRef = useRef<PlanItem[]>([])
  const adaptRef = useRef<AdaptState>(initialAdaptState)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    setQueueOverride(null)
    reserveRef.current = plannedReserve as PlanItem[]
    adaptRef.current = initialAdaptState
  }, [planned, plannedReserve])

  const lives = useAppStore(s => s.lives)
  const maxLives = useAppStore(s => s.maxLives)
  const premium = useAppStore(s => s.premium)
  const { formattedTime, refillLives } = useLives()
  const coach = useCoach('lesson_note')

  const [actIndex, setActIndex] = useState(0)
  const [answerState, setAnswerState] = useState<AnswerState>('idle')
  const [pipMood, setPipMood] = useState<'happy' | 'thinking' | 'excited' | 'sad' | 'listening'>('happy')
  const [pipAnim, setPipAnim] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [speech, setSpeech] = useState<string | null>(null)
  const [speechLoading, setSpeechLoading] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [xpEarned, setXpEarned] = useState(0)
  const [typedAnswer, setTypedAnswer] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [celebrationMsg, setCelebrationMsg] = useState('')
  const [newBadges, setNewBadges] = useState<NewBadge[]>([])
  const [totalXP, setTotalXP] = useState(0)
  const [videoEnded, setVideoEnded] = useState(false)
  const [micAutoStart, setMicAutoStart] = useState(false)
  const [listenDone, setListenDone] = useState(false)
  const [listenPhase, setListenPhase] = useState<'phrase1' | 'phrase2' | 'identify' | 'completed'>('phrase1')
  const [listenSelection, setListenSelection] = useState<string | null>(null)
  const [listenCorrect, setListenCorrect] = useState(false)
  const [listenTeachData, setListenTeachData] = useState<TeachingData | null>(null)
  const [highlightNumber, setHighlightNumber] = useState(false)
  const [speakTapFallback, setSpeakTapFallback] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [sayState, setSayState] = useState<SayState>('idle')
  const [sayTries, setSayTries] = useState(0)
  const [sayVia, setSayVia] = useState<'voice' | 'tap' | null>(null)
  const [identifyPicked, setIdentifyPicked] = useState<string | null>(null)
  const [practiceKey, setPracticeKey] = useState(0)
  const [feedbackLine, setFeedbackLine] = useState<string | null>(null)
  const [showHeartModal, setShowHeartModal] = useState(false)
  const [showQuitModal, setShowQuitModal] = useState(false)
  const streakRef = useRef(0)
  const indexRef = useRef(0)
  const serverSttRef = useRef(false)
  const [voiceNote, setVoiceNote] = useState(false)

  const { speak: _speak, stop: stopSpeech, blocked, clearBlocked, unlock } = useVoiceTeacher()
  const [started, setStarted] = useState(true)

  const speak = useCallback(async (text: string) => {
    try { await _speak(cleanForSpeech(text)) } catch { /* no-op */ }
  }, [_speak])

  const narrateIdRef = useRef(0)
  const afterListenRef = useRef<() => void>(() => {})
  const totalXPRef = useRef(0)
  const scoresRef = useRef<number[]>([])
  const awardedRef = useRef<Set<string>>(new Set())
  const startedRef = useRef(false)
  const advancingRef = useRef(false)
  const activityStartRef = useRef(Date.now())
  const resultRef = useRef({ passed: false, score: 0, wrongs: 0 })

  const speakWithHighlight = useCallback(async (text: string) => {
    const pairs = extractNumberPairs(text)
    if (pairs && pairs.length >= 2) {
      for (let i = 0; i < pairs.length; i++) {
        setHighlightIndex(i)
        await speak(pairs[i].word)
        await new Promise<void>(r => setTimeout(r, 400))
      }
      setHighlightIndex(-1)
    } else {
      setHighlightIndex(-1)
      await speak(text)
    }
  }, [speak])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    fetch('/api/transcribe').then(r => r.json()).then(j => { serverSttRef.current = !!j.available }).catch(() => {})
  }, [])

  const [asrPercent, setAsrPercent] = useState<number | null>(null)
  useEffect(() => {
    if (!started) return
    const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }
    if (w.SpeechRecognition ?? w.webkitSpeechRecognition) return
    if (!localAsrSupported()) return
    const off = onAsrStatus((st, pct) => setAsrPercent(st === 'loading' ? pct : null))
    preloadLocalAsr().catch(() => {})
    return off
  }, [started])

  useEffect(() => {
    if (!childId || !lesson || startedRef.current) return
    startedRef.current = true
    api.progress.upsert({ child_id: childId, lesson_id: Number(id), status: 'in_progress' }).catch(() => {})
  }, [childId, lesson, id])

  const currentActivity = activities[actIndex]
  indexRef.current = actIndex
  const ageGroup: AgeGroup = (child?.age ?? 7) <= 5 ? '0-5' : (child?.age ?? 7) <= 8 ? '6-8' : (child?.age ?? 7) <= 11 ? '9-11' : '12-14'

  const narrate = useCallback(async (act: Activity, replay = false) => {
    const myId = ++narrateIdRef.current
    const stale = () => myId !== narrateIdRef.current
    setSpeechLoading(false)
    setMicAutoStart(false)
    setListenDone(false)
    setListenPhase('phrase1')
    setListenSelection(null)
    setListenCorrect(false)
    setListenTeachData(null)
    setHighlightNumber(false)
    setSpeakTapFallback(false)
    setHighlightIndex(-1)
    const c = act.content as unknown as Record<string, unknown>

    if (!replay) setSayState('idle')
    const listenText = (() => {
      if (c.number !== undefined) {
        const hint = String(c.audio_hint ?? '').trim()
        const word = String(c.word ?? c.number).trim()
        let base = (hint && hint.toLowerCase().startsWith(word.toLowerCase()))
          ? hint
          : (hint ? `${word}. ${hint}` : word)
        if (!base.toLowerCase().includes('tap') && !base.toLowerCase().includes('continue')) {
          base = `${base}. Tap the green button to continue!`
        }
        return base
      }
      const rawPrompt = String(c.prompt ?? c.text ?? '')
      if (rawPrompt && !rawPrompt.toLowerCase().includes('tap') && !rawPrompt.toLowerCase().includes('continue')) {
        return `${rawPrompt}. Tap the green button to continue!`
      }
      return rawPrompt
    })()

    const contentText = act.type === 'listen'
      ? (isLetterContent(c) ? letterScript(c) : listenText)
      : act.type === 'speak'
      ? String(c.prompt ?? '')
      : act.type === 'tap_answer'
      ? String(c.question ?? '')
      : act.type === 'type_answer'
      ? String(c.question ?? '')
      : ''

    // Clean, direct Duolingo-style instruction
    const promptLine = contentText || (act.type === 'speak' ? 'Say this out loud' : 'Listen carefully')
    setSpeech(promptLine)

    // Teaching Activity (Listen): 3-step natural sequence with breaks & prompt
    if (act.type === 'listen') {
      const teach = parseTeachingPhrases(c)
      setListenTeachData(teach)
      setListenSelection(null)
      setHighlightNumber(false)
      setSayState('idle')
      setPipMood('happy')
      setPipAnim('idle')

      if (teach.isStoryCard) {
        setListenPhase('completed')
        setListenCorrect(true)
        setListenDone(true)
        const line = teach.intro || teach.phrase1 || String(c.prompt ?? c.text ?? '')
        setSpeech(line)
        await speak(line)
        return
      }

      setListenPhase('phrase1')
      setListenCorrect(false)
      setListenDone(false)

      // Step 1a: Voice introduces concept & definition
      setSpeech(teach.intro)
      await speak(teach.intro)
      if (stale()) return

      // Brief pause (400ms) before the big reveal
      await new Promise(r => setTimeout(r, 400))
      if (stale()) return

      // Step 1b: Numeral Reveal: "This is two!" — NUMBER SCALES UP WITH GLOW!
      setHighlightNumber(true)
      setSpeech(teach.reveal)
      await speak(teach.reveal)
      if (stale()) return

      // Break of 3 seconds so the child can absorb & identify the scaled-up numeral
      await new Promise(r => setTimeout(r, 3000))
      if (stale()) return
      setHighlightNumber(false)

      // Step 2: Voice speaks Phrase 2 with proper punctuation
      setListenPhase('phrase2')
      setSpeech(teach.phrase2)
      await speak(teach.phrase2)
      if (stale()) return

      // Break of 3 seconds to let concept sink in
      await new Promise(r => setTimeout(r, 3000))
      if (stale()) return

      // Step 3: Voice prompts Identify challenge
      setListenPhase('identify')
      setSpeech(teach.identifyPrompt)
      await speak(teach.identifyPrompt)
      if (stale()) return

      return
    }

    // Speaking Activity: Pip models first, then listens for child to talk back
    if (act.type === 'speak') {
      const numVal = c.number !== undefined ? Number(c.number) : null
      const expNum = c.expected !== undefined && !isNaN(Number(c.expected))
        ? Number(c.expected)
        : (c.expected ? NUMBER_WORDS[String(c.expected).toLowerCase()] : null)
      const targetNum = numVal !== null ? numVal : (expNum !== undefined ? expNum : null)
      const isQuestion = typeof c.prompt === 'string' && (c.prompt.includes('?') || /^(what|how many|which)\b/i.test(c.prompt))

      let spokenLine: string
      if (isQuestion) {
        spokenLine = `${String(c.prompt).trim()} Say the answer out loud!`
      } else if (targetNum !== null) {
        spokenLine = `Say the number ${targetNum} out loud!`
      } else {
        const targetWord = String(c.word ?? c.expected ?? c.prompt ?? '').replace(/^say:?\s*/i, '').replace(/[!.]/g, '').trim()
        spokenLine = `Say the word ${targetWord} out loud!`
      }

      setSpeech(spokenLine)
      setPipMood('happy')
      setPipAnim('idle')
      await speak(spokenLine)
      if (stale()) return
      await new Promise(r => setTimeout(r, 150))
      if (stale()) return
      setPipMood('listening')
      setMicAutoStart(true)
      return
    }

    if (contentText) {
      await speak(contentText)
      if (stale()) return
    }
  }, [speak, speakWithHighlight])

  const actId = currentActivity?.id
  useEffect(() => {
    if (!currentActivity || !started) return
    setAnswerState('idle')
    setHint(null)
    setAttempts(0)
    setTypedAnswer('')
    setSelected(null)
    setPipMood('happy')
    setPipAnim('idle')
    setVideoEnded(false)
    setMicAutoStart(false)
    setListenDone(false)
    setListenPhase('phrase1')
    setListenSelection(null)
    setListenCorrect(false)
    setListenTeachData(null)
    setHighlightNumber(false)
    setSpeakTapFallback(false)
    setSayState('idle')
    setSayTries(0)
    setSayVia(null)
    setIdentifyPicked(null)
    setFeedbackLine(null)
    advancingRef.current = false
    activityStartRef.current = Date.now()
    resultRef.current = { passed: false, score: 0, wrongs: 0 }
    narrate(currentActivity)
    return () => {
      narrateIdRef.current++
      stopSpeech()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actId, started])

  const award = (act: Activity, xp: number) => {
    const key = String(act.id)
    if (awardedRef.current.has(key)) return false
    awardedRef.current.add(key)
    totalXPRef.current += xp
    setTotalXP(totalXPRef.current)
    return true
  }

  const saveActivityResult = () => {
    const act = currentActivity
    if (!act) return
    const r = resultRef.current
    scoresRef.current.push(r.score)
    if (!childId) return
    api.activityResults.create({
      child_id: childId,
      lesson_id: Number(id),
      activity_id: Number(act.id),
      score: r.score,
      passed: r.passed,
      attempts: r.wrongs + 1,
      time_seconds: Math.min(60000, Math.round((Date.now() - activityStartRef.current) / 1000)),
    }).catch(() => {})
  }

  const handleCorrect = (earnedXP: number) => {
    const xp = attempts === 0 ? earnedXP : Math.floor(earnedXP * 0.5)
    if (currentActivity) award(currentActivity, xp)
    resultRef.current = { passed: true, score: attempts === 0 ? 100 : attempts === 1 ? 70 : 50, wrongs: attempts }
    setXpEarned(xp)
    setAnswerState('correct')
    setPipMood('excited')
    setPipAnim('correct')
    confetti({ particleCount: 70, spread: 75, origin: { y: 0.7 }, colors: ['#58cc02', '#4ade80', '#eab308'] })
    const firstTry = attempts === 0
    streakRef.current = firstTry ? streakRef.current + 1 : 0
    const line = praiseCorrect({ name: child?.name ?? 'friend', ageGroup, firstTry, streak: streakRef.current })
    setFeedbackLine(line)
    speak(line)
  }

  const handleWrong = async (feedback?: string) => {
    if (!isDemo) {
      loseLive()
      if (childId && !useAppStore.getState().premium) api.profile.update(childId, { lives: useAppStore.getState().lives }).catch(() => {})
      if (!isDemo) setShowHeartModal(true)
    }
    resultRef.current = { ...resultRef.current, wrongs: resultRef.current.wrongs + 1 }
    setAnswerState('wrong')
    setPipMood('sad')
    setPipAnim('wrong')
    setAttempts(a => a + 1)
    streakRef.current = 0
    const line = feedback && attempts < 1 ? feedback : say('comfort', child?.name ?? 'friend', ageGroup)
    setFeedbackLine(line)
    if (feedback && attempts < 1) setHint(feedback)
    speak(line)
    if (!isDemo) setShowHeartModal(true)
    if (attempts >= 1) {
      let h: string
      try {
        const res = await fetch('/api/teacher/hint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: speech ?? '',
            childAnswer: selected ?? typedAnswer,
            correctAnswer: expectedFor(currentActivity),
            attempts: attempts + 1,
            activityType: currentActivity?.type,
          }),
        })
        h = (await res.json()).hint
      } catch {
        h = fallbackHint({ activityType: (currentActivity?.type ?? 'tap_answer') as Activity['type'], attempts: attempts + 1 })
      }
      setHint(h)
      speak(h)
    }
  }

  const handleTapAnswer = (opt: { id: string; text: string; correct: boolean }) => {
    if (answerState !== 'idle') return
    setSelected(opt.id)
    if (opt.correct) handleCorrect(getXP(currentActivity))
    else handleWrong()
  }

  const handleSpeechResult = (_transcript: string, _score: number, passed: boolean, feedback?: string) => {
    if (passed) {
      handleCorrect(getXP(currentActivity))
    } else {
      if (attempts < 2) {
        setAttempts(a => a + 1)
        const c = currentActivity?.content as unknown as Record<string, unknown> | undefined
        const numVal = c?.number !== undefined ? Number(c.number) : null
        const targetWord = numVal !== null ? String(numVal) : expectedFor(currentActivity)
        const line = `Let's try that again! Say the number ${targetWord} out loud!`
        setFeedbackLine(line)
        speak(line).then(() => {
          setMicAutoStart(false)
          setTimeout(() => setMicAutoStart(true), 120)
        })
      } else {
        handleWrong(feedback)
      }
    }
  }

  const handleTypeSubmit = () => {
    if (!typedAnswer.trim()) return
    const expected = expectedFor(currentActivity)
    const correct = typedAnswer.trim().toLowerCase() === expected.toLowerCase()
    if (correct) handleCorrect(getXP(currentActivity))
    else handleWrong()
  }

  const sayContent = currentActivity?.type === 'listen' ? (currentActivity.content as unknown as Record<string, unknown>) : null
  const sayTarget = sayContent ? buildSayTarget(sayContent) : null
  const identifyQ = sayContent ? buildIdentify(sayContent) : null
  const childName = child?.name ?? 'friend'

  const sayGrade = useCallback((transcript: string) => {
    const c = currentActivity?.content as unknown as Record<string, unknown> | undefined
    const t = c ? buildSayTarget(c) : null
    return t ? t.grade(transcript) : { passed: false, score: 0 }
  }, [currentActivity])

  const markSayPassed = (via: 'voice' | 'tap', line: string, score: number, wrongs: number) => {
    resultRef.current = { passed: true, score, wrongs }
    setSayVia(via)
    setSayState('passed')
    setFeedbackLine(line)
    setPipMood('excited')
    setPipAnim('correct')
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, colors: ['#58cc02', '#4ade80', '#eab308'] })
    speak(line)
  }

  const markSayGaveUp = (tries: number) => {
    const line = say('sayGaveUp', childName, ageGroup)
    resultRef.current = { passed: false, score: 40, wrongs: tries }
    setSayState('gaveup')
    setFeedbackLine(line)
    speak(line)
  }

  const handleSayResult = (_t: string, _s: number, passed: boolean) => {
    if (passed) { markSayPassed('voice', say('sayPass', childName, ageGroup), sayTries === 0 ? 100 : 85, sayTries); return }
    const tries = sayTries + 1
    setSayTries(tries)
    if (tries >= 3) { markSayGaveUp(tries); return }
    const line = say('sayRetry', childName, ageGroup)
    resultRef.current = { passed: false, score: 0, wrongs: tries }
    setFeedbackLine(line)
    speak(line)
  }

  const modelThenListen = async () => {
    const run = narrateIdRef.current
    setMicAutoStart(false)
    setPracticeKey(k => k + 1)
    if (sayTarget) {
      await speak(sayTarget.model)
      if (run !== narrateIdRef.current) return
      await speak(say('yourTurn', childName, ageGroup))
      if (run !== narrateIdRef.current) return
    }
    setMicAutoStart(true)
  }

  const chooseVoice = async () => {
    setSayState('practice')
    setSayVia('voice')
    if (sayTarget) await speak('Say it with me.')
    await modelThenListen()
  }

  const chooseTap = () => {
    setMicAutoStart(false)
    setSayState('identify')
    setSayVia('tap')
    setIdentifyPicked(null)
    if (identifyQ) speak(identifyQ.spoken)
  }

  const handleIdentify = (option: string) => {
    if (!identifyQ || identifyPicked === identifyQ.correct) return
    setIdentifyPicked(option)
    if (option === identifyQ.correct) {
      markSayPassed('tap', say('identifyOk', childName, ageGroup), sayTries === 0 ? 75 : 55, sayTries)
      return
    }
    const tries = sayTries + 1
    setSayTries(tries)
    if (tries >= 2) {
      setIdentifyPicked(identifyQ.correct)
      markSayGaveUp(tries)
      return
    }
    const line = say('identifyNo', childName, ageGroup)
    resultRef.current = { passed: false, score: 0, wrongs: tries }
    setFeedbackLine(line)
    speak(line)
    setTimeout(() => setIdentifyPicked(null), 700)
  }

  const handleListenPick = async (opt: { id: string; text: string; correct: boolean }) => {
    if (listenCorrect) return
    const c = currentActivity?.content as unknown as Record<string, unknown>
    const teach = listenTeachData ?? parseTeachingPhrases(c ?? {})
    setListenSelection(opt.id)

    if (opt.correct) {
      setListenCorrect(true)
      setListenPhase('completed')
      setListenDone(true)
      setSayState('passed')
      setPipMood('excited')
      setPipAnim('correct')
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.65 }, colors: ['#58cc02', '#4ade80', '#eab308'] })

      const continueInstruction = 'Awesome! Tap the green button to continue 👉'
      setSpeech(continueInstruction)
      await speak('Tap the green button to continue!')
    } else {
      setPipMood('thinking')
      setPipAnim('wrong')
      const retryLine = `Try again! Which one is ${teach.target}?`
      setSpeech(retryLine)
      await speak(retryLine)
      setTimeout(() => {
        setListenSelection(null)
        setPipMood('happy')
        setPipAnim('idle')
      }, 900)
    }
  }

  const handleListenAgain = useCallback(() => {
    if (!currentActivity) return
    const c = currentActivity.content as unknown as Record<string, unknown>
    const teach = listenTeachData ?? parseTeachingPhrases(c ?? {})
    if (teach.isStoryCard) {
      speak(teach.intro || teach.phrase1 || String(c?.prompt ?? c?.text ?? ''))
      return
    }
    setListenSelection(null)
    setListenCorrect(false)
    narrate(currentActivity, true)
  }, [currentActivity, listenTeachData, narrate, speak])

  const handleListenContinue = () => {
    if (!currentActivity || advancingRef.current) return
    const c = currentActivity.content as unknown as Record<string, unknown>
    const teach = listenTeachData ?? parseTeachingPhrases(c ?? {})
    const full = getXP(currentActivity)
    if (teach.isStoryCard) {
      award(currentActivity, full)
      resultRef.current = { passed: true, score: 100, wrongs: 0 }
    } else if (sayState === 'passed') {
      award(currentActivity, sayVia === 'tap' ? Math.max(1, Math.round(full * 0.7)) : full)
    } else {
      award(currentActivity, Math.floor(full * 0.5))
    }
    setListenDone(false)
    setListenPhase('phrase1')
    setListenSelection(null)
    setListenCorrect(false)
    setListenTeachData(null)
    setHighlightNumber(false)
    setSpeakTapFallback(false)
    handleNext()
  }

  const finishLesson = async () => {
    setFinishing(true)
    stopSpeech()
    const scores = scoresRef.current
    const score = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 100
    const xp = totalXPRef.current
    const lessonIdNum = Number(id)

    // Save progress locally (persisted in localStorage)
    useAppStore.getState().completeLesson(lessonIdNum, score, xp)

    // Also sync to server if profile exists
    try {
      if (childId) {
        const res = await api.progress.upsert({
          child_id: childId, lesson_id: lessonIdNum, status: 'completed', score, xp_earned: xp,
        })
        if (res.profile) hydrateProfile(res.profile)
        setNewBadges(res.new_achievements ?? [])
      }
    } catch {
      // Offline fallback: progress already safely saved in local state
    }
    const message = celebration({ name: child?.name ?? 'friend', ageGroup, xp, score })
    setCelebrationMsg(message)
    setCompleted(true)
    setFinishing(false)
    confetti({ particleCount: 180, spread: 100, origin: { y: 0.5 }, colors: ['#58cc02', '#4ade80', '#3b82f6', '#facc15'] })
    speak(message)
    coach.refresh()
  }

  const handleNext = async () => {
    if (advancingRef.current) return
    advancingRef.current = true
    const r = resultRef.current
    saveActivityResult()
    const adapted = adaptQueue(activities, actIndex, reserveRef.current, adaptRef.current, {
      passed: r.passed, firstTry: r.passed && r.wrongs === 0,
    })
    adaptRef.current = adapted.state
    reserveRef.current = adapted.reserve
    setNotice(adapted.notice)
    setQueueOverride(adapted.queue)
    if (actIndex >= adapted.queue.length - 1) await finishLesson()
    else setActIndex(i => i + 1)
  }

  if (loading || !lesson) return (
    <div className="min-h-screen bg-[#f0f9ff] flex items-center justify-center">
      <Spinner size={44} color="#0d9488" />
    </div>
  )

  if (!loading && lesson && activities.length === 0 && (!planned || planned.length === 0)) return (
    <div className="min-h-screen bg-[#f0f9ff] text-[#1d2445] flex flex-col items-center justify-center p-6 text-center font-nunito">
      <Pip size="xl" mood="sad" animate="idle" />
      <h1 className="text-3xl font-black text-[#0f4c5c] mt-6 mb-2">Couldn&apos;t load activities</h1>
      <p className="text-slate-500 font-bold text-sm mb-8">Please check your connection and give it another try.</p>
      <button onClick={() => load()} className="px-8 py-3.5 bg-[#58cc02] hover:bg-[#46a302] text-white font-black rounded-2xl border-2 border-[#58cc02] border-b-4 border-b-[#46a302] shadow-sm uppercase tracking-wider">
        Try Again
      </button>
      <button onClick={() => router.push(isDemo ? '/' : `/lessons/${id}`)} className="mt-4 text-slate-500 hover:text-slate-700 font-bold text-sm">
        Back to Course
      </button>
    </div>
  )

  // Duolingo-style Intro Screen (Clean, Bright Steps Theme)
  if (!started && !completed && (premium || lives > 0 || isDemo)) {
    return (
      <div className="min-h-screen bg-[#f0f9ff] text-slate-800 flex flex-col font-nunito">
        <div className="max-w-4xl mx-auto w-full px-6 py-6 flex items-center justify-between">
          <button onClick={() => router.push(isDemo ? '/' : `/lessons/${id}`)} className="p-2.5 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 shadow-2xs transition-all">
            <X size={24} strokeWidth={2.5} />
          </button>
          <div className="flex items-center gap-1.5 text-rose-500 font-black text-lg bg-white px-3.5 py-1.5 rounded-full border-2 border-rose-100 shadow-xs">
            <Heart size={20} fill="#ef4444" />
            <span className="text-slate-700">{premium || isDemo ? '∞' : lives}</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center max-w-md mx-auto w-full">
          <Pip size="xl" mood="excited" animate="idle" />
          <h1 className="text-3xl sm:text-4xl font-black text-[#0f4c5c] mt-6 mb-3 tracking-tight">
            {isDemo ? 'Numbers 1, 2, 3 Counting Adventure' : lesson.title}
          </h1>
          <p className="text-slate-600 font-bold text-base mb-8 leading-relaxed">
            {isDemo
              ? 'Try out Bright Steps! Pip will speak with you, count objects, and guide your practice — completely free, no sign-in required.'
              : 'Turn your volume up! Pip will speak with you and guide your practice.'}
          </p>

          <div className="w-full space-y-3">
            <button
              onClick={() => { unlock(); setStarted(true) }}
              className="w-full py-4 px-8 bg-[#58cc02] hover:bg-[#46a302] text-white font-black text-lg rounded-2xl border-2 border-[#58cc02] border-b-4 border-b-[#46a302] active:translate-y-1 active:border-b-2 shadow-lg uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <span>{isDemo ? 'Start Free Demo Adventure' : 'Start Lesson'}</span>
              <ChevronRight size={22} strokeWidth={3} />
            </button>
            <p className="text-slate-400 font-extrabold text-xs tracking-wider uppercase">
              {activities.length} interactive exercises • Free trial
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Out of hearts screen
  if (!premium && lives <= 0 && !completed && !finishing) {
    return (
      <div className="min-h-screen bg-white text-[#1d2445] flex flex-col items-center justify-center p-6 text-center font-nunito">
        <div className="w-20 h-20 rounded-3xl bg-rose-100 text-rose-500 flex items-center justify-center text-4xl mb-6 shadow-inner">
          💔
        </div>
        <h1 className="text-3xl font-black text-[#1d2445] mb-2">You ran out of hearts!</h1>
        <p className="text-slate-500 font-bold text-sm max-w-sm mb-6">
          Next heart recharges in <span className="text-amber-600 font-black font-mono">{formattedTime}</span>. Or refill right now to keep playing!
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => refillLives()}
            className="w-full py-3.5 bg-[#58cc02] hover:bg-[#46a302] text-white font-black text-base rounded-2xl border-2 border-[#58cc02] border-b-4 border-b-[#46a302] active:translate-y-0.5 shadow-sm uppercase tracking-wider"
          >
            Refill Full Hearts (5/5 ❤️)
          </button>
          <button
            onClick={() => router.push('/upgrade')}
            className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-black text-base rounded-2xl border-2 border-sky-500 border-b-4 border-b-sky-700 active:translate-y-0.5 shadow-sm uppercase tracking-wider"
          >
            Get Plus (Unlimited ❤️)
          </button>
          <button
            onClick={() => router.push(lesson?.subject_id ? `/lessons?subject=${lesson.subject_id}` : '/lessons')}
            className="text-slate-400 hover:text-slate-600 font-black text-sm pt-2"
          >
            Back to Course Map
          </button>
        </div>
      </div>
    )
  }

  // Completed Screen (Clean Bright Steps Celebration)
  if (completed) {
    return (
      <div className="min-h-screen bg-[#f0f9ff] text-slate-800 flex flex-col font-nunito">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto w-full">
          <Pip size="xl" mood="excited" animate="correct" />
          <h1 className="text-4xl font-black text-[#0f4c5c] mt-6 mb-2">
            {isDemo ? 'Demo Lesson Complete! 🎉' : 'Lesson Complete!'}
          </h1>
          <p className="text-emerald-600 font-black text-lg mb-4">{celebrationMsg}</p>

          <div className="flex items-center gap-3 bg-amber-50 border-2 border-amber-200 rounded-2xl px-6 py-3 my-4 shadow-xs">
            <span className="text-3xl">⭐</span>
            <div className="text-left">
              <p className="text-amber-800 font-black text-xl">+{totalXP} XP</p>
              <p className="text-amber-700 font-bold text-xs">Total experience gained</p>
            </div>
          </div>

          {isDemo ? (
            <div className="w-full bg-white border-2 border-slate-200 rounded-3xl p-5 my-4 text-center shadow-sm">
              <p className="text-emerald-600 font-black text-sm uppercase tracking-wider mb-1">🎉 Fantastic job completing the demo!</p>
              <p className="text-slate-600 font-bold text-xs leading-relaxed mb-4">
                Sign up for a free account now to save your streak, track badges, and unlock all 20+ lessons!
              </p>
              <button
                onClick={() => router.push('/register')}
                className="w-full py-4 bg-[#58cc02] hover:bg-[#46a302] text-white font-black text-base rounded-2xl border-2 border-[#58cc02] border-b-4 border-b-[#46a302] active:translate-y-0.5 shadow-lg uppercase tracking-wider"
              >
                Save Progress &amp; Sign Up Free
              </button>
            </div>
          ) : (
            <>
              {newBadges.length > 0 && (
                <div className="w-full bg-white border-2 border-slate-200 rounded-3xl p-4 my-4 shadow-sm">
                  <p className="text-slate-500 font-black text-xs uppercase tracking-wider mb-2">New Badge Unlocked!</p>
                  {newBadges.map(b => (
                    <div key={b.slug} className="flex items-center gap-3 bg-sky-50 p-3 rounded-2xl border border-sky-100 shadow-xs">
                      <span className="text-3xl">{b.icon}</span>
                      <div className="text-left">
                        <p className="text-slate-800 font-black text-sm">{b.title}</p>
                        {b.xp_bonus > 0 && <p className="text-emerald-600 font-black text-xs">+{b.xp_bonus} XP bonus</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {coach.note && (
                <p className="text-purple-800 font-bold text-sm bg-purple-50 border border-purple-200 rounded-2xl p-4 my-3">
                  💡 {coach.note.child}
                </p>
              )}
            </>
          )}

          <div className="w-full pt-4 space-y-3">
            {isDemo ? (
              <>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-black text-sm rounded-2xl border-2 border-slate-200 border-b-4 border-b-slate-300 uppercase tracking-wider shadow-xs"
                >
                  Play Demo Again
                </button>
                <button
                  onClick={() => router.push('/lessons')}
                  className="w-full py-3 text-slate-500 hover:text-slate-700 font-black text-xs uppercase tracking-wider"
                >
                  Explore All Courses
                </button>
              </>
            ) : (
              <>
                {coach.rec?.recommended.find(r => r.lesson_id !== Number(id)) && (() => {
                  const nextPick = coach.rec!.recommended.find(r => r.lesson_id !== Number(id))!
                  return (
                    <button
                      onClick={() => router.push(nextPick.reason === 'checkpoint' && nextPick.skill_slug ? `/checkpoint/${encodeURIComponent(nextPick.skill_slug)}` : `/lessons/${nextPick.lesson_id}`)}
                      className="w-full py-4 bg-[#58cc02] hover:bg-[#46a302] text-white font-black text-base rounded-2xl border-2 border-[#58cc02] border-b-4 border-b-[#46a302] uppercase tracking-wider shadow-lg"
                    >
                      {nextPick.reason === 'checkpoint' ? 'Show What You Know' : `Next: ${nextPick.title}`}
                    </button>
                  )
                })()}
                <button
                  onClick={() => router.push(lesson?.subject_id ? `/lessons?subject=${lesson.subject_id}` : '/lessons')}
                  className="w-full py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-black text-sm rounded-2xl border-2 border-slate-200 border-b-4 border-b-slate-300 uppercase tracking-wider shadow-xs"
                >
                  Back to Course Map
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  const act = currentActivity
  if (!act) return (
    <div className="min-h-screen bg-[#f0f9ff] flex items-center justify-center">
      <Spinner size={44} color="#0d9488" />
    </div>
  )

  const progress = Math.min(100, Math.max(5, ((actIndex + 1) / activities.length) * 100))
  const sayDone = sayState === 'passed' || sayState === 'gaveup'
  const isCorrect = answerState === 'correct'
  const isWrong = answerState === 'wrong'

  // Determine if primary action is enabled in footer
  const canCheck = (() => {
    if (act.type === 'listen') return listenCorrect
    if (act.type === 'tap_answer') return selected !== null && answerState === 'idle'
    if (act.type === 'type_answer') return typedAnswer.trim().length > 0 && answerState === 'idle'
    if (act.type === 'speak') return true
    return false
  })()

  return (
    <div className="min-h-screen bg-[#f0f9ff] text-slate-800 flex flex-col font-nunito select-none relative overflow-x-hidden">
      
      {/* Background Whimsical Accents (Matches Home Theme) */}
      <AnimatedSun className="absolute top-16 right-6 w-20 sm:w-28 pointer-events-none opacity-40 z-0 hidden sm:block" />
      <DoodleCloud className="absolute top-28 left-4 w-28 sm:w-36 pointer-events-none opacity-40 z-0" delay={0.8} />

      {/* ── CLEAN SUNLIT TOP BAR (MATCHING HOME THEME) ─────────── */}
      <header className="max-w-4xl mx-auto w-full px-4 sm:px-8 pt-3 sm:pt-4 pb-2 flex items-center gap-3 sm:gap-6 bg-[#f0f9ff]/90 backdrop-blur-md sticky top-0 z-30 border-b border-sky-100">
        {/* Quit X button */}
        <button
          onClick={() => setShowQuitModal(true)}
          className="p-2 text-slate-400 hover:text-slate-700 rounded-2xl hover:bg-white border border-transparent hover:border-slate-200 shadow-2xs transition-all"
          title="Quit Lesson"
        >
          <X size={20} strokeWidth={2.8} />
        </button>

        {/* Glossy Progress Bar with Sunlit Cyan/Emerald Track */}
        <div className="flex-1 h-3.5 sm:h-4 bg-sky-200/70 rounded-full overflow-hidden relative shadow-inner border border-sky-200/80">
          <motion.div
            className="h-full bg-emerald-500 rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {/* Glossy top streak */}
            <div className="h-1 bg-white/40 rounded-full mx-1.5 mt-0.5" />
          </motion.div>
        </div>

        {/* Heart Lives Pill */}
        <div
          onClick={() => { if (!premium && lives < maxLives) refillLives() }}
          className="flex items-center gap-1.5 text-rose-500 font-black text-sm sm:text-base px-3 py-1.5 rounded-2xl bg-white border-2 border-rose-100 shadow-xs hover:border-rose-300 cursor-pointer transition-all"
          title={premium ? 'Unlimited hearts' : `${lives} hearts left (Click to refill)`}
        >
          <Heart size={18} fill="#f43f5e" className="text-rose-500 animate-pulse" />
          <span className="font-black text-slate-700">{premium ? '∞' : lives}</span>
        </div>
      </header>

      {/* ── MAIN EXERCISE CONTAINER (FITS SCREEN NATURALLY, SCROLLABLE IF SMALL) ── */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-3 sm:px-6 pt-2 sm:pt-4 pb-24 sm:pb-28">
        
        {/* Badge Indicator */}
        <div className="flex items-center gap-2 mb-2 self-start">
          <span className="text-[11px] font-black uppercase tracking-wider text-sky-800 bg-sky-100/90 border border-sky-200 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
            {act.type === 'listen' ? '✨ NEW NUMBER' : act.type === 'speak' ? '🎤 SPEAK OUT LOUD' : act.type === 'tap_answer' ? '✨ CHOOSE ANSWER' : act.type === 'type_answer' ? '⌨️ WRITE ANSWER' : '🧩 MATCH PAIRS'}
          </span>
          {notice && <span className="text-xs font-bold text-emerald-600">{notice}</span>}
        </div>

        {/* Mascot + Speech Prompt Area (Clean Light Speech Bubble) */}
        <div className="flex items-center gap-3 mb-3 sm:mb-4 w-full">
          <div className="flex-shrink-0">
            <Pip size="sm" mood={pipMood} animate={pipAnim} />
          </div>
          <div className="flex-1 min-w-0">
            <SpeechBubble text={hint ?? speech} loading={speechLoading} dark={false} />
          </div>
        </div>

        {/* ── EXERCISE CONTENT BY TYPE ───────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={act.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="w-full flex flex-col items-center"
          >
            {/* 1. LISTEN & TEACHING ACTIVITY (DUOLINGO CLEAN ADVENTURE) */}
            {act.type === 'listen' && (() => {
              const c = act.content as unknown as Record<string, unknown>
              const teach = listenTeachData ?? parseTeachingPhrases(c)
              const num = c.number as number | undefined
              const word = c.word as string | undefined
              const img = activityImage(c)
              const objects = c.objects as string[] | undefined

              if (teach.isStoryCard) {
                return (
                  <div className="w-full flex flex-col items-center gap-3">
                    <motion.div
                      key="story-concept-card"
                      initial={{ scale: 0.95, opacity: 0, y: 12 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={{ type: 'spring', damping: 18, stiffness: 220 }}
                      className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border-2 border-slate-200 border-b-[5px] border-b-slate-300 shadow-sm flex flex-col items-center text-center relative"
                    >
                      {teach.definition && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-[11px] sm:text-xs mb-2 shadow-2xs">
                          <span>💡</span>
                          <span>{teach.definition}</span>
                        </div>
                      )}

                      {img ? (
                        <div className="my-2 p-2 bg-sky-50/70 rounded-2xl border border-sky-100 max-w-[260px]">
                          <ActivityImage path={img} alt={teach.target || 'lesson illustration'} size="md" />
                        </div>
                      ) : objects && objects.length > 0 ? (
                        <div className="flex flex-wrap gap-2.5 justify-center text-3xl sm:text-4xl my-2">
                          {objects.map((o, idx) => (
                            <span key={idx} className="hover:scale-110 transition-transform select-none">
                              {o}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-400 text-white flex items-center justify-center text-3xl shadow-md my-2">
                          🎨
                        </div>
                      )}

                      {teach.target && (
                        <h3 className="text-xl sm:text-2xl font-black text-slate-800 capitalize my-1">
                          {teach.target}
                        </h3>
                      )}

                      <p className="text-base sm:text-lg font-bold text-slate-700 leading-relaxed my-2">
                        {teach.intro}
                      </p>

                      {teach.example && teach.example !== teach.intro && (
                        <div className="mt-2 p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 font-bold text-xs sm:text-sm">
                          {teach.example}
                        </div>
                      )}

                      {teach.actionPrompt && (
                        <div className="mt-2 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl font-black text-xs sm:text-sm">
                          <span>👉</span>
                          <span>{teach.actionPrompt}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => speak(teach.intro)}
                        className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sky-100 hover:bg-sky-200 text-sky-800 font-black text-xs transition-colors cursor-pointer"
                      >
                        <Volume2 size={14} />
                        <span>Hear Again</span>
                      </button>
                    </motion.div>
                  </div>
                )
              }

              return (
                <div className="w-full flex flex-col items-center gap-2 sm:gap-2.5">
                  {/* Section 1: Clean Hero Visual Card (Fits Screen Geometry) */}
                  <motion.div
                    key={String(num ?? word ?? 'hero')}
                    initial={{ scale: 0.95, opacity: 0, y: 12 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 18, stiffness: 220 }}
                    className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border-2 border-slate-200 border-b-[5px] border-b-slate-300 shadow-sm flex flex-col items-center text-center relative"
                  >
                    {/* Teacher Definition Badge */}
                    {teach.definition && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-[11px] sm:text-xs mb-1 shadow-2xs"
                      >
                        <span>💡</span>
                        <span>Meaning: {teach.definition}</span>
                      </motion.div>
                    )}

                    {teach.equation ? (
                      <div className="flex flex-col items-center my-1 select-none">
                        <div className="flex items-center justify-center gap-2 sm:gap-3 text-4xl sm:text-5xl font-black text-slate-800">
                          <span className="text-slate-800">{teach.leftNum}</span>
                          <span className="text-emerald-600">{teach.operation === 'subtract' ? '−' : '+'}</span>
                          <span className="text-slate-800">{teach.rightNum}</span>
                          <span className="text-slate-400">=</span>
                          <motion.span
                            animate={
                              highlightNumber
                                ? {
                                    scale: [1, 1.4, 1.25],
                                    filter: [
                                      'drop-shadow(0 0 0px rgba(88,204,2,0))',
                                      'drop-shadow(0 0 24px rgba(88,204,2,0.95))',
                                      'drop-shadow(0 0 16px rgba(88,204,2,0.75))',
                                    ],
                                  }
                                : { scale: 1, filter: 'drop-shadow(0 0 0px rgba(0,0,0,0))' }
                            }
                            transition={
                              highlightNumber
                                ? { duration: 0.65, ease: 'easeOut' }
                                : { duration: 0.3 }
                            }
                            onClick={() => {
                              setHighlightNumber(true)
                              speak(teach.reveal)
                              setTimeout(() => setHighlightNumber(false), 2500)
                            }}
                            className="text-5xl sm:text-6xl font-black text-emerald-600 cursor-pointer inline-flex items-center relative"
                            title={`Tap to hear: ${teach.reveal}`}
                          >
                            {teach.sum ?? teach.target}
                            {highlightNumber && (
                              <motion.span
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: [0, 1.3, 1], opacity: 1 }}
                                transition={{ duration: 0.35 }}
                                className="absolute -top-3 -right-5 text-2xl sm:text-3xl animate-bounce"
                              >
                                ✨
                              </motion.span>
                            )}
                          </motion.span>
                        </div>
                      </div>
                    ) : num !== undefined ? (
                      <>
                        <motion.div
                          animate={
                            highlightNumber
                              ? {
                                  scale: [1, 1.35, 1.25],
                                  filter: [
                                    'drop-shadow(0 0 0px rgba(88,204,2,0))',
                                    'drop-shadow(0 0 24px rgba(88,204,2,0.95))',
                                    'drop-shadow(0 0 16px rgba(88,204,2,0.75))',
                                  ],
                                }
                              : { scale: 1, filter: 'drop-shadow(0 0 0px rgba(0,0,0,0))' }
                          }
                          transition={
                            highlightNumber
                              ? { duration: 0.65, ease: 'easeOut' }
                              : { duration: 0.3 }
                          }
                          onClick={() => {
                            setHighlightNumber(true)
                            speak(teach.reveal)
                            setTimeout(() => setHighlightNumber(false), 2500)
                          }}
                          className="relative inline-flex items-center justify-center my-1 cursor-pointer select-none"
                          title={`Tap to hear: ${teach.reveal}`}
                        >
                          <span className="text-5xl sm:text-6xl font-black text-emerald-600 leading-none select-none tracking-tight">
                            {num}
                          </span>
                          {highlightNumber && (
                            <motion.span
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: [0, 1.3, 1], opacity: 1 }}
                              transition={{ duration: 0.35 }}
                              className="absolute -top-2 -right-5 text-2xl sm:text-3xl animate-bounce"
                            >
                              ✨
                            </motion.span>
                          )}
                        </motion.div>
                        {word && <h3 className="text-xl sm:text-2xl font-black text-slate-800 capitalize leading-tight mb-1">{word}</h3>}
                      </>
                    ) : (
                      <motion.div
                        animate={
                          highlightNumber
                            ? {
                                scale: [1, 1.3, 1.2],
                                filter: [
                                  'drop-shadow(0 0 0px rgba(88,204,2,0))',
                                  'drop-shadow(0 0 20px rgba(88,204,2,0.9))',
                                ],
                              }
                            : { scale: 1, filter: 'drop-shadow(0 0 0px rgba(0,0,0,0))' }
                        }
                        className="relative inline-flex items-center justify-center my-1 cursor-pointer select-none"
                        onClick={() => {
                          setHighlightNumber(true)
                          speak(teach.reveal)
                          setTimeout(() => setHighlightNumber(false), 2500)
                        }}
                      >
                        <span className="text-4xl sm:text-5xl font-black text-emerald-600 leading-none select-none tracking-tight">
                          {teach.target}
                        </span>
                      </motion.div>
                    )}

                    {/* Section 2: Concrete Object Example — animates in during phrase2, identify, completed */}
                    <AnimatePresence>
                      {(listenPhase === 'phrase2' || listenPhase === 'identify' || listenPhase === 'completed') && (
                        <motion.div
                          key="concrete-objects"
                          initial={{ opacity: 0, scale: 0.3, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{ type: 'spring', damping: 12, stiffness: 240 }}
                          className="w-full flex flex-col items-center gap-1 my-1 p-2.5 bg-sky-50/60 rounded-2xl border border-sky-100 shadow-inner"
                        >
                          {teach.leftObjects && teach.rightObjects ? (
                            <div className="flex items-center justify-center gap-2 sm:gap-3 text-2xl sm:text-3xl my-0.5">
                              <div className="flex gap-1">
                                {teach.leftObjects.map((o, idx) => (
                                  <span key={idx}>{o}</span>
                                ))}
                              </div>
                              <span className="text-lg sm:text-xl font-black text-emerald-600">{teach.operation === 'subtract' ? '−' : '+'}</span>
                              <div className="flex gap-1">
                                {teach.rightObjects.map((o, idx) => (
                                  <span key={idx}>{o}</span>
                                ))}
                              </div>
                              <span className="text-lg sm:text-xl font-black text-slate-400">=</span>
                              <div className="flex gap-1">
                                {(objects ?? [...teach.leftObjects, ...teach.rightObjects]).map((o, idx) => (
                                  <span key={idx}>{o}</span>
                                ))}
                              </div>
                            </div>
                          ) : img ? (
                            <ActivityImage path={img} alt={word ?? ''} size="md" />
                          ) : objects ? (
                            <div className="flex flex-wrap gap-2.5 justify-center text-3xl sm:text-4xl my-0.5">
                              {objects.map((o, idx) => (
                                <motion.span
                                  key={idx}
                                  initial={{ scale: 0, rotate: -25 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  transition={{ delay: idx * 0.12, type: 'spring', damping: 10 }}
                                  className="inline-block hover:scale-110 transition-transform select-none"
                                >
                                  {o}
                                </motion.span>
                              ))}
                            </div>
                          ) : null}
                          {teach.example && (
                            <p className="text-emerald-700 font-black text-xs sm:text-sm">
                              {teach.example}
                            </p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Section 2: Kinesthetic Action Callout during Phrase 2 */}
                  <AnimatePresence>
                    {listenPhase === 'phrase2' && (
                      <motion.div
                        key="phrase2-callout"
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 15 }}
                        className="flex items-center gap-2 bg-amber-100 border border-amber-300 text-amber-900 px-3.5 py-1.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider shadow-xs"
                      >
                        <span className="text-lg animate-bounce">☝️</span>
                        <span>{teach.actionPrompt}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Fast bypass option during narration for convenience */}
                  {listenPhase !== 'identify' && listenPhase !== 'completed' && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      type="button"
                      onClick={() => setListenPhase('identify')}
                      className="text-xs text-slate-400 hover:text-slate-600 font-bold underline transition-colors"
                    >
                      Skip audio to question 👉
                    </motion.button>
                  )}

                  {/* Section 3: 3 Identification Options */}
                  <AnimatePresence>
                    {(listenPhase === 'identify' || listenPhase === 'completed') && teach.options.length > 0 && (
                      <motion.div
                        key="identify-options-list"
                        initial={{ opacity: 0, y: 18, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', damping: 18, stiffness: 200 }}
                        className="w-full max-w-md flex flex-col items-center"
                      >
                        <div className="flex items-center justify-between w-full mb-1.5 px-1">
                          <motion.p
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-xs font-black uppercase tracking-wider text-slate-500"
                          >
                            {listenCorrect ? '✨ You found it!' : '👉 Tap the correct answer:'}
                          </motion.p>
                          {!listenCorrect && (
                            <button
                              onClick={handleListenAgain}
                              className="text-xs text-slate-500 hover:text-slate-800 font-black flex items-center gap-1.5 transition-colors"
                            >
                              <RotateCcw size={13} />
                              <span>Hear again</span>
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full">
                          {teach.options.map((opt, idx) => {
                            const isPicked = listenSelection === opt.id
                            const isTarget = opt.correct
                            const showSuccess = listenCorrect && isTarget
                            const showWrong = !listenCorrect && isPicked && !isTarget

                            return (
                              <motion.button
                                key={opt.id}
                                type="button"
                                initial={{ opacity: 0, y: 16, scale: 0.88 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{
                                  delay: 0.1 + idx * 0.08,
                                  type: 'spring',
                                  damping: 14,
                                  stiffness: 220,
                                }}
                                whileHover={!listenCorrect ? { scale: 1.04 } : {}}
                                whileTap={!listenCorrect ? { scale: 0.95 } : {}}
                                disabled={listenCorrect}
                                onClick={() => handleListenPick(opt)}
                                className={`p-2.5 sm:p-3 rounded-2xl border-2 font-black text-xl sm:text-2xl transition-all flex flex-col items-center justify-center gap-0.5 text-center relative min-h-[64px] sm:min-h-[76px] cursor-pointer shadow-xs ${
                                  showSuccess
                                    ? 'border-emerald-500 bg-emerald-50 border-b-[5px] border-b-emerald-600 text-emerald-800 shadow-md ring-2 ring-emerald-300/40'
                                    : showWrong
                                    ? 'border-rose-400 bg-rose-50 border-b-[5px] border-b-rose-600 text-rose-800'
                                    : isPicked
                                    ? 'border-sky-400 bg-sky-50 border-b-[5px] border-b-sky-600 text-sky-900 shadow-md'
                                    : 'border-slate-200 bg-white hover:bg-sky-50/60 hover:border-sky-300 border-b-[5px] border-b-slate-300 text-slate-800 active:translate-y-1 active:border-b-2'
                                }`}
                              >
                                <div className="flex flex-col items-center justify-center">
                                  <span className="text-2xl sm:text-3xl font-black">{opt.text}</span>
                                  {showSuccess && (
                                    <motion.span
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ type: 'spring', damping: 10 }}
                                      className="mt-0.5 flex items-center gap-1 text-[11px] font-black text-emerald-600"
                                    >
                                      <Check size={14} strokeWidth={3} />
                                      <span>Correct!</span>
                                    </motion.span>
                                  )}
                                </div>
                                <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-md border border-slate-200 bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-500">
                                  {idx + 1}
                                </span>
                              </motion.button>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })()}

            {/* 2. MULTIPLE CHOICE TAP ACTIVITY (CLEAN BRIGHT STEPS STYLE) */}
            {act.type === 'tap_answer' && (() => {
              const tapContent = act.content as unknown as Record<string, unknown>
              const options = normalizeTapOptions(tapContent)
              return (
                <div className="w-full flex flex-col items-center">
                  <motion.h2
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="text-2xl sm:text-3xl font-black text-[#0f4c5c] text-center mb-4 sm:mb-6 tracking-tight"
                  >
                    {activityImage(tapContent) ? stripEmoji(String(tapContent.question ?? '')) : String(tapContent.question ?? '')}
                  </motion.h2>

                  {/* Options List — 2x2 or 3-col Grid with Soft Pastel Claymorphic Cards */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`grid ${options.length === 4 ? 'grid-cols-1 sm:grid-cols-2' : options.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'} gap-3 sm:gap-4 w-full max-w-lg`}
                  >
                    {options.map((opt, idx) => {
                      const isSelected = selected === opt.id
                      const showResult = answerState !== 'idle' && isSelected
                      return (
                        <motion.button
                          key={opt.id}
                          initial={{ opacity: 0, y: 16, scale: 0.92 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: 0.12 + idx * 0.08, type: 'spring', damping: 15, stiffness: 220 }}
                          whileHover={answerState === 'idle' ? { scale: 1.03 } : {}}
                          whileTap={answerState === 'idle' ? { scale: 0.96 } : {}}
                          disabled={answerState !== 'idle'}
                          onClick={() => {
                            if (answerState !== 'idle') return
                            setSelected(opt.id)
                          }}
                          className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border-2 font-black text-base sm:text-lg transition-all flex flex-col items-center justify-between gap-2 text-center relative min-h-[76px] sm:min-h-[92px] shadow-sm cursor-pointer ${
                            showResult && opt.correct
                              ? 'border-emerald-500 bg-emerald-50 border-b-[5px] border-b-emerald-600 text-emerald-900 shadow-md ring-2 ring-emerald-300/40'
                              : showResult && !opt.correct
                              ? 'border-rose-400 bg-rose-50 border-b-[5px] border-b-rose-600 text-rose-900'
                              : isSelected
                              ? 'border-sky-400 bg-sky-100/90 border-b-[5px] border-b-sky-600 text-sky-950 shadow-md ring-2 ring-sky-300/40'
                              : 'border-slate-200 bg-white hover:bg-sky-50/60 hover:border-sky-300 border-b-[5px] border-b-slate-300 text-slate-800 active:translate-y-1 active:border-b-2'
                          }`}
                        >
                          <div className="flex-1 flex flex-col items-center justify-center gap-1.5 w-full">
                            {optionImages(tapContent)[opt.text] && (
                              <ActivityImage path={optionImages(tapContent)[opt.text]} alt={opt.text} size="sm" />
                            )}
                            <span className="text-xl sm:text-2xl font-black">{opt.text}</span>
                          </div>
                          <span className="w-5 h-5 rounded-md border border-slate-200 bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 self-end">
                            {idx + 1}
                          </span>
                        </motion.button>
                      )
                    })}
                  </motion.div>
                </div>
              )
            })()}

            {/* 3. SPEAKING ACTIVITY (DUOLINGO TALK-BACK EXPERIENCE) */}
            {act.type === 'speak' && (() => {
              const c = act.content as unknown as Record<string, unknown>
              const num = c.number !== undefined ? Number(c.number) : null
              const expNum = c.expected !== undefined && !isNaN(Number(c.expected))
                ? Number(c.expected)
                : (c.expected ? NUMBER_WORDS[String(c.expected).toLowerCase()] : null)
              const targetNum = num !== null ? num : (expNum !== undefined ? expNum : null)
              const isQuestion = typeof c.prompt === 'string' && (c.prompt.includes('?') || /^(what|how many|which)\b/i.test(c.prompt))

              const expectedStr = String(c.expected ?? (targetNum !== null ? String(targetNum) : c.word ?? '')).toLowerCase().trim()
              const targetWord = targetNum !== null
                ? String(targetNum)
                : String(c.word ?? c.expected ?? '').replace(/^say:?\s*/i, '').replace(/[!.]/g, '').trim()
              const objects = c.objects as string[] | undefined
              const leftObjects = c.leftObjects as string[] | undefined
              const rightObjects = c.rightObjects as string[] | undefined
              const equation = c.equation as string | undefined
              const img = activityImage(c)

              const gradeSpokenAnswer = (transcript: string) => {
                const normText = transcript.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim()
                const words = normText.split(/\s+/).filter(Boolean)

                if (targetNum !== null) {
                  const NUMBER_ALTS: Record<number, string[]> = {
                    1: ['1', 'one', 'won', 'wan', 'on', 'juan', 'first', 'wun', 'when', 'run', 'un'],
                    2: [
                      '2', 'two', 'to', 'too', 'tu', 'do', 'due', 'dew', 'dou', 'toe', 
                      'true', 'through', 'threw', 'chew', 'choo', 'shoe', 'shoo', 'who', 
                      'you', 'u', 'new', 'no', 'so', 'cool', 'tube', 'tool', 'tooth', 'second',
                      'to to', 'too too', 'two two'
                    ],
                    3: ['3', 'three', 'tree', 'free', 'thee', 'tri', 'third', 'thre', 'threat', 'see', 'tea'],
                    4: ['4', 'four', 'for', 'fore', 'pour', 'ford', 'fourth', 'door', 'floor'],
                    5: ['5', 'five', 'hive', 'fi', 'fiv', 'fifth', 'fine'],
                    6: ['6', 'six', 'sex', 'sick', 'sicks', 'sixth'],
                    7: ['7', 'seven', 'sev', 'sevin', 'seventh'],
                    8: ['8', 'eight', 'ate', 'ait', 'eighth', 'late', 'great'],
                    9: ['9', 'nine', 'nien', 'ninth', 'line', 'mine'],
                    10: ['10', 'ten', 'tin', 'tan', 'tenth'],
                  }
                  const alts = NUMBER_ALTS[targetNum] ?? [String(targetNum)]
                  const matched = words.some(w => alts.includes(w)) || alts.some(a => normText.includes(a)) || words.includes(String(targetNum))
                  if (matched) {
                    return { passed: true, score: 100, feedback: 'Super job! You said it!' }
                  }
                }

                const fallback = fallbackGradeSpeech({ expected: expectedStr, transcript, childName: child?.name ?? 'friend' })
                return { passed: fallback.passed, score: fallback.score, feedback: fallback.feedback }
              }

              // Fallback options if child prefers to tap instead of talking
              const tapOptions = targetNum !== null
                ? Array.from(new Set([String(Math.max(1, targetNum - 1)), String(targetNum), String(targetNum + 1)])).slice(0, 3)
                : (Array.isArray(c.options) ? (c.options as unknown[]).map(String) : [targetWord, '2', '3'])

              return (
                <div className="w-full flex flex-col items-center gap-2 sm:gap-2.5">
                  {/* Question Header */}
                  <div className="text-center max-w-lg">
                    <motion.h2
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="text-2xl sm:text-3xl font-black text-[#0f4c5c] leading-tight mb-2"
                    >
                      {isQuestion ? String(c.prompt) : (targetNum !== null ? `Say the number ${targetNum} out loud` : `Say the word "${targetWord}" out loud`)}
                    </motion.h2>
                  </div>

                  {/* Clean Hero Visual Card */}
                  <motion.div
                    key={String(targetNum ?? targetWord)}
                    initial={{ scale: 0.95, opacity: 0, y: 12 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 18 }}
                    className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border-2 border-slate-200 border-b-[5px] border-b-slate-300 shadow-sm flex flex-col items-center text-center relative"
                  >
                    {/* Hear Pip again pill button */}
                    <button
                      type="button"
                      onClick={() => speak(isQuestion ? `${String(c.prompt)} Say the answer out loud!` : (targetNum !== null ? `Say the number ${targetNum} out loud!` : `Say the word: ${targetWord}!`))}
                      className="mb-2 px-3.5 py-1.5 bg-sky-50 hover:bg-sky-100 border-2 border-sky-200 border-b-4 border-b-sky-300 rounded-xl flex items-center gap-1.5 text-sky-700 font-black text-xs uppercase tracking-wider active:translate-y-0.5 cursor-pointer transition-all shadow-2xs"
                    >
                      <Volume2 size={15} className="text-emerald-600" />
                      <span>Hear Pip Say It</span>
                    </button>

                    {equation ? (
                      <div className="flex flex-col items-center my-1 select-none">
                        <div className="text-3xl sm:text-4xl font-black text-slate-800 tracking-wide">
                          {equation}
                        </div>
                      </div>
                    ) : targetNum !== null && !isQuestion ? (
                      <span className="text-5xl sm:text-6xl font-black text-emerald-600 leading-none mb-1 select-none">
                        {targetNum}
                      </span>
                    ) : null}

                    {leftObjects && rightObjects ? (
                      <div className="flex items-center justify-center gap-2 sm:gap-3 text-2xl sm:text-3xl my-1">
                        <div className="flex gap-1">
                          {leftObjects.map((o, idx) => (
                            <span key={idx}>{o}</span>
                          ))}
                        </div>
                        <span className="text-lg sm:text-xl font-black text-emerald-600">+</span>
                        <div className="flex gap-1">
                          {rightObjects.map((o, idx) => (
                            <span key={idx}>{o}</span>
                          ))}
                        </div>
                        <span className="text-lg sm:text-xl font-black text-slate-400">=</span>
                        <span className="text-2xl sm:text-3xl font-black text-amber-500">?</span>
                      </div>
                    ) : img ? (
                      <ActivityImage path={img} alt={targetWord} size="md" />
                    ) : objects ? (
                      <div className="flex flex-wrap gap-2.5 justify-center text-3xl sm:text-4xl my-1">
                        {objects.map((o, idx) => (
                          <motion.span
                            key={idx}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: idx * 0.12, type: 'spring' }}
                          >
                            {o}
                          </motion.span>
                        ))}
                      </div>
                    ) : null}

                    {!isQuestion && (
                      <div className="text-2xl sm:text-3xl font-black text-slate-800 mt-1">
                        &ldquo;{targetWord}&rdquo;
                      </div>
                    )}
                  </motion.div>

                  {/* Interactive Speaking Panel or Tap Fallback — Animates in Last */}
                  {answerState === 'idle' && (
                    <motion.div
                      initial={{ opacity: 0, y: 16, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.15, type: 'spring', damping: 16 }}
                      className="w-full max-w-md flex flex-col items-center"
                    >
                      {!speakTapFallback ? (
                        <>
                          <MicrophonePanel
                            expected={expectedStr}
                            localGrade={gradeSpokenAnswer}
                            onResult={handleSpeechResult}
                            onSkip={() => setSpeakTapFallback(true)}
                            subject="general"
                            ageGroup={ageGroup}
                            childName={child?.name ?? 'friend'}
                            autoStart={micAutoStart}
                          />
                          <button
                            type="button"
                            onClick={() => setSpeakTapFallback(true)}
                            className="mt-2 text-xs font-black text-slate-500 hover:text-slate-800 underline cursor-pointer"
                          >
                            Can&apos;t talk right now? Tap the answer instead
                          </button>
                        </>
                      ) : (
                        <div className="w-full flex flex-col items-center gap-2">
                          <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                            👉 Tap the matching number:
                          </p>
                          <div className="grid grid-cols-3 gap-2.5 w-full">
                            {tapOptions.map(opt => (
                              <button
                                key={opt}
                                onClick={() => {
                                  const isMatch = (targetNum !== null && (opt === String(targetNum) || NUMBER_WORDS[opt.toLowerCase()] === targetNum)) ||
                                    opt.toLowerCase() === expectedStr ||
                                    opt.toLowerCase() === targetWord.toLowerCase()
                                  if (isMatch) {
                                    handleCorrect(getXP(currentActivity))
                                  } else {
                                    handleWrong()
                                  }
                                }}
                                className="py-3 px-4 rounded-2xl border-2 border-slate-200 border-b-[5px] border-b-slate-300 bg-white hover:bg-sky-50 text-slate-800 font-black text-xl active:translate-y-0.5 shadow-sm"
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              )
            })()}

            {/* 4. TYPE ANSWER ACTIVITY */}
            {act.type === 'type_answer' && (
              <div className="w-full flex flex-col items-center">
                <h2 className="text-2xl sm:text-3xl font-black text-[#0f4c5c] text-center mb-6">
                  {(act.content as TypeAnswerContent).question}
                </h2>
                <input
                  type="text"
                  value={typedAnswer}
                  onChange={e => setTypedAnswer(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTypeSubmit()}
                  disabled={answerState !== 'idle'}
                  placeholder="Type your answer here..."
                  className="w-full max-w-lg bg-white border-2 border-slate-200 border-b-[5px] border-b-slate-300 focus:border-sky-400 focus:border-b-sky-600 rounded-3xl px-6 py-4 text-slate-800 font-black text-2xl outline-none shadow-sm transition-all text-center"
                  autoFocus
                />
              </div>
            )}

            {/* 5. MATCH ACTIVITY */}
            {act.type === 'drag_drop' && (() => {
              const c = act.content as unknown as { prompt?: string; pairs?: Array<{ id: string; item: string; target: string }> }
              return (
                <div className="w-full">
                  <MatchActivity
                    key={`${act.id}-${attempts}`}
                    prompt={c.prompt}
                    pairs={c.pairs ?? []}
                    disabled={answerState !== 'idle'}
                    onComplete={ok => (ok ? handleCorrect(getXP(act)) : handleWrong())}
                  />
                </div>
              )
            })()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── CLEAN SUNLIT BOTTOM ACTION BAR ─────────────────────── */}
      <footer
        className={`fixed bottom-0 left-0 right-0 z-40 py-3 sm:py-3.5 px-4 sm:px-12 border-t-2 backdrop-blur-md transition-colors duration-200 ${
          isCorrect
            ? 'bg-emerald-50/95 border-emerald-200 shadow-[0_-4px_20px_rgba(16,185,129,0.1)]'
            : isWrong
            ? 'bg-rose-50/95 border-rose-200 shadow-[0_-4px_20px_rgba(244,63,94,0.1)]'
            : 'bg-white/95 border-sky-100 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]'
        }`}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left Side: Secondary action or Feedback state */}
          <div className="flex items-center gap-3.5 min-w-0">
            {isCorrect && (
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-emerald-500 flex items-center justify-center text-white text-2xl font-black shadow-sm flex-shrink-0">
                  <Check size={24} strokeWidth={3.5} />
                </div>
                <div>
                  <p className="text-xl font-black text-emerald-800 leading-none mb-0.5">Nicely done!</p>
                  <p className="text-xs sm:text-sm font-extrabold text-emerald-600">+{xpEarned} XP • {feedbackLine}</p>
                </div>
              </div>
            )}

            {isWrong && (
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-rose-500 flex items-center justify-center text-white text-2xl font-black shadow-sm flex-shrink-0">
                  <X size={24} strokeWidth={3.5} />
                </div>
                <div>
                  <p className="text-xs font-black text-rose-600 uppercase tracking-wider leading-none mb-1">Correct solution:</p>
                  <p className="text-base sm:text-lg font-black text-slate-800">
                    {(() => {
                      const c = act.content as unknown as Record<string, unknown>
                      if (act.type === 'tap_answer') {
                        return normalizeTapOptions(c).find(o => o.correct)?.text ?? ''
                      }
                      return String(c.expected ?? c.correct ?? '')
                    })()}
                  </p>
                </div>
              </div>
            )}

            {!isCorrect && !isWrong && (
              <>
                {act.type === 'listen' ? (
                  <button
                    onClick={handleListenAgain}
                    className="px-4 sm:px-6 py-3 rounded-2xl border-2 border-sky-200 border-b-4 border-b-sky-300 bg-white hover:bg-sky-50 text-sky-700 font-black text-xs sm:text-sm uppercase tracking-wider active:translate-y-0.5 shadow-xs flex items-center gap-2"
                  >
                    <RotateCcw size={16} strokeWidth={2.5} />
                    <span>Listen Again</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      // Skip question
                      resultRef.current = { passed: false, score: 30, wrongs: resultRef.current.wrongs + 1 }
                      handleNext()
                    }}
                    className="px-5 sm:px-7 py-3 rounded-2xl border-2 border-slate-200 border-b-4 border-b-slate-300 bg-white hover:bg-slate-50 text-slate-600 font-black text-xs sm:text-sm uppercase tracking-wider active:translate-y-0.5 shadow-xs"
                  >
                    Skip
                  </button>
                )}
              </>
            )}
          </div>

          {/* Right Side: Primary CHECK or CONTINUE Button */}
          <div>
            {isCorrect || isWrong ? (
              <button
                onClick={handleNext}
                className={`px-8 sm:px-12 py-3.5 rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider text-white shadow-sm transition-all active:translate-y-1 active:border-b-2 ${
                  isCorrect
                    ? 'bg-emerald-500 hover:bg-emerald-600 border-2 border-emerald-500 border-b-4 border-b-emerald-700'
                    : 'bg-rose-500 hover:bg-rose-600 border-2 border-rose-500 border-b-4 border-b-rose-700'
                }`}
              >
                Continue
              </button>
            ) : act.type === 'listen' ? (
              <button
                disabled={!listenTeachData?.isStoryCard && !listenCorrect}
                onClick={handleListenContinue}
                className={`px-8 sm:px-12 py-3.5 rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  (listenTeachData?.isStoryCard || listenCorrect)
                    ? 'bg-[#58cc02] hover:bg-[#46a302] text-white border-2 border-[#58cc02] border-b-4 border-b-[#46a302] active:translate-y-1 active:border-b-2 shadow-lg animate-pulse'
                    : 'bg-slate-200 text-slate-400 border-b-4 border-slate-300 cursor-not-allowed'
                }`}
              >
                <span>{(listenTeachData?.isStoryCard || listenCorrect) ? 'Continue 👉' : 'Pick One Above'}</span>
              </button>
            ) : act.type === 'tap_answer' ? (
              <button
                disabled={!canCheck}
                onClick={() => {
                  const opts = normalizeTapOptions(act.content as unknown as Record<string, unknown>)
                  const chosen = opts.find(o => o.id === selected)
                  if (chosen) handleTapAnswer(chosen)
                }}
                className={`px-8 sm:px-12 py-3.5 rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider transition-all ${
                  canCheck
                    ? 'bg-[#58cc02] hover:bg-[#46a302] text-white border-2 border-[#58cc02] border-b-4 border-b-[#46a302] active:translate-y-1 active:border-b-2 shadow-sm'
                    : 'bg-slate-200 text-slate-400 border-b-4 border-slate-300 cursor-not-allowed'
                }`}
              >
                Check
              </button>
            ) : act.type === 'type_answer' ? (
              <button
                disabled={!canCheck}
                onClick={handleTypeSubmit}
                className={`px-8 sm:px-12 py-3.5 rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider transition-all ${
                  canCheck
                    ? 'bg-[#58cc02] hover:bg-[#46a302] text-white border-2 border-[#58cc02] border-b-4 border-b-[#46a302] active:translate-y-1 active:border-b-2 shadow-sm'
                    : 'bg-slate-200 text-slate-400 border-b-4 border-slate-300 cursor-not-allowed'
                }`}
              >
                Check
              </button>
            ) : null}
          </div>

        </div>
      </footer>

      {/* ── HEART MISTAKE MODAL ──────────────────────────────────── */}
      <AnimatePresence>
        {showHeartModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white text-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center border-2 border-slate-200 border-b-[6px] border-b-slate-300 shadow-2xl font-nunito"
            >
              {/* Hearts row: e.g. 4 red hearts, 1 gray heart */}
              <div className="flex items-center justify-center gap-2 mb-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Heart
                    key={i}
                    size={26}
                    fill={i < Math.max(0, lives) ? '#ef4444' : '#e2e8f0'}
                    className={i < Math.max(0, lives) ? 'text-rose-500' : 'text-slate-300'}
                  />
                ))}
              </div>

              <h3 className="text-xl sm:text-2xl font-black mb-2 text-slate-800">Each mistake costs 1 heart!</h3>
              <p className="text-slate-500 font-bold text-xs sm:text-sm mb-6 leading-relaxed">
                Stay sharp and focused to keep your hearts. You got this!
              </p>

              <button
                onClick={() => setShowHeartModal(false)}
                className="w-full py-3.5 bg-sky-500 hover:bg-sky-400 text-white font-black text-sm uppercase tracking-wider rounded-2xl border-2 border-sky-400 border-b-4 border-b-sky-700 active:translate-y-0.5 shadow-sm"
              >
                Keep Going
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── QUIT CONFIRMATION MODAL ──────────────────────────────── */}
      <AnimatePresence>
        {showQuitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white text-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center border-2 border-slate-200 border-b-[6px] border-b-slate-300 shadow-2xl font-nunito"
            >
              <Pip size="lg" mood="sad" animate="idle" className="mb-2" />
              <h3 className="text-2xl font-black mb-2 text-slate-800">Quit this lesson?</h3>
              <p className="text-slate-500 font-bold text-xs sm:text-sm mb-6 leading-relaxed">
                All progress in this lesson will be lost if you leave now.
              </p>
              <div className="space-y-2.5">
                <button
                  onClick={() => setShowQuitModal(false)}
                  className="w-full py-3.5 bg-[#58cc02] hover:bg-[#46a302] text-white font-black text-sm uppercase tracking-wider rounded-2xl border-2 border-[#58cc02] border-b-4 border-b-[#46a302] active:translate-y-0.5 shadow-sm"
                >
                  Keep Learning
                </button>
                <button
                  onClick={() => router.push(`/lessons/${id}`)}
                  className="w-full py-3 text-slate-400 hover:text-rose-600 font-black text-xs uppercase tracking-wider transition-colors"
                >
                  End Session
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
