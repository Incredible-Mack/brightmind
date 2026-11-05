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
}

function parseTeachingPhrases(c: Record<string, unknown>): TeachingData {
  const num = c.number !== undefined ? Number(c.number) : null
  const word = String(c.word ?? (num !== null ? String(num) : '')).trim()

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
    }
  }

  if (num !== null) {
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
    }
  }

  const hint = String(c.audio_hint ?? c.prompt ?? c.text ?? 'Listen carefully!')
  const targetStr = word || '1'
  return {
    intro: hint,
    reveal: `This is ${targetStr}!`,
    phrase1: hint,
    definition: 'Concept',
    example: hint,
    actionPrompt: 'Listen carefully!',
    phrase2: hint,
    identifyPrompt: `Identify ${targetStr} from the list below!`,
    target: targetStr,
    options: [targetStr, '2', '3'].map(t => ({ id: t, text: t, correct: t === targetStr })),
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
      setListenPhase('phrase1')
      setListenSelection(null)
      setListenCorrect(false)
      setListenDone(false)
      setHighlightNumber(false)
      setSayState('idle')
      setPipMood('happy')
      setPipAnim('idle')

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
      const targetWord = String(c.word ?? c.prompt ?? c.expected ?? '').replace(/^say:?\s*/i, '').replace(/[!.]/g, '').trim()
      const spokenLine = numVal !== null
        ? `Say the number ${numVal} out loud!`
        : `Say the word ${targetWord} out loud!`
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
    setListenSelection(null)
    setListenCorrect(false)
    narrate(currentActivity, true)
  }, [currentActivity, narrate])

  const handleListenContinue = () => {
    if (!currentActivity || advancingRef.current) return
    const full = getXP(currentActivity)
    if (sayState === 'passed') award(currentActivity, sayVia === 'tap' ? Math.max(1, Math.round(full * 0.7)) : full)
    else award(currentActivity, Math.floor(full * 0.5))
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
    <div className="min-h-screen bg-[#131f24] flex items-center justify-center">
      <Spinner size={44} color="#58cc02" />
    </div>
  )

  if (!loading && lesson && activities.length === 0 && (!planned || planned.length === 0)) return (
    <div className="min-h-screen bg-white text-[#1d2445] flex flex-col items-center justify-center p-6 text-center font-nunito">
      <Pip size="xl" mood="sad" animate="idle" />
      <h1 className="text-3xl font-black text-[#1d2445] mt-6 mb-2">Couldn&apos;t load activities</h1>
      <p className="text-slate-500 font-bold text-sm mb-8">Please check your connection and give it another try.</p>
      <button onClick={() => load()} className="px-8 py-3.5 bg-[#58cc02] hover:bg-[#46a302] text-white font-black rounded-2xl border-2 border-[#58cc02] border-b-4 border-b-[#46a302] shadow-sm uppercase tracking-wider">
        Try Again
      </button>
      <button onClick={() => router.push(isDemo ? '/' : `/lessons/${id}`)} className="mt-4 text-slate-400 hover:text-slate-600 font-bold text-sm">
        Back to Course
      </button>
    </div>
  )

  // Duolingo-style Intro Screen (Guest / Demo friendly)
  if (!started && !completed && (premium || lives > 0 || isDemo)) {
    return (
      <div className="min-h-screen bg-[#131f24] text-white flex flex-col font-nunito">
        <div className="max-w-4xl mx-auto w-full px-6 py-6 flex items-center justify-between">
          <button onClick={() => router.push(isDemo ? '/' : `/lessons/${id}`)} className="p-2.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X size={26} strokeWidth={2.5} />
          </button>
          <div className="flex items-center gap-1.5 text-rose-500 font-black text-lg bg-rose-500/10 px-3.5 py-1.5 rounded-full border border-rose-500/30">
            <Heart size={20} fill="#ef4444" />
            <span className="text-white">{premium || isDemo ? '∞' : lives}</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center max-w-md mx-auto w-full">
          <Pip size="xl" mood="excited" animate="idle" />
          <h1 className="text-3xl sm:text-4xl font-black text-white mt-6 mb-3 tracking-tight">
            {isDemo ? 'Numbers 1, 2, 3 Counting Adventure' : lesson.title}
          </h1>
          <p className="text-slate-300 font-bold text-base mb-8 leading-relaxed">
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
            onClick={() => router.push('/lessons')}
            className="text-slate-400 hover:text-slate-600 font-black text-sm pt-2"
          >
            Back to Course Map
          </button>
        </div>
      </div>
    )
  }

  // Completed Screen (Duolingo Dark + Demo celebration)
  if (completed) {
    return (
      <div className="min-h-screen bg-[#131f24] text-white flex flex-col font-nunito">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto w-full">
          <Pip size="xl" mood="excited" animate="correct" />
          <h1 className="text-4xl font-black text-white mt-6 mb-2">
            {isDemo ? 'Demo Lesson Complete! 🎉' : 'Lesson Complete!'}
          </h1>
          <p className="text-[#4ade80] font-black text-lg mb-4">{celebrationMsg}</p>

          <div className="flex items-center gap-3 bg-amber-500/10 border-2 border-amber-400/30 rounded-2xl px-6 py-3 my-4">
            <span className="text-3xl">⭐</span>
            <div className="text-left">
              <p className="text-amber-300 font-black text-xl">+{totalXP} XP</p>
              <p className="text-amber-200/80 font-bold text-xs">Total experience gained</p>
            </div>
          </div>

          {isDemo ? (
            <div className="w-full bg-[#18252d] border-2 border-[#2e3e48] rounded-3xl p-5 my-4 text-center">
              <p className="text-[#58cc02] font-black text-sm uppercase tracking-wider mb-1">🎉 Fantastic job completing the demo!</p>
              <p className="text-slate-300 font-bold text-xs leading-relaxed mb-4">
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
                <div className="w-full bg-[#18252d] border-2 border-[#2e3e48] rounded-3xl p-4 my-4">
                  <p className="text-slate-400 font-black text-xs uppercase tracking-wider mb-2">New Badge Unlocked!</p>
                  {newBadges.map(b => (
                    <div key={b.slug} className="flex items-center gap-3 bg-[#24333b] p-3 rounded-2xl border border-slate-700 shadow-xs">
                      <span className="text-3xl">{b.icon}</span>
                      <div className="text-left">
                        <p className="text-white font-black text-sm">{b.title}</p>
                        {b.xp_bonus > 0 && <p className="text-emerald-400 font-black text-xs">+{b.xp_bonus} XP bonus</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {coach.note && (
                <p className="text-slate-300 font-bold text-sm bg-purple-950/40 border border-purple-500/30 rounded-2xl p-4 my-3 text-purple-200">
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
                  className="w-full py-3.5 bg-[#24333b] hover:bg-[#2c3d47] text-white font-black text-sm rounded-2xl border-2 border-[#324550] border-b-4 border-b-[#1c2930] uppercase tracking-wider"
                >
                  Play Demo Again
                </button>
                <button
                  onClick={() => router.push('/lessons')}
                  className="w-full py-3 text-slate-400 hover:text-white font-black text-xs uppercase tracking-wider"
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
                  onClick={() => router.push('/lessons')}
                  className="w-full py-3.5 bg-[#24333b] hover:bg-[#2c3d47] text-slate-200 font-black text-sm rounded-2xl border-2 border-[#324550] border-b-4 border-b-[#1c2930] uppercase tracking-wider"
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
    <div className="min-h-screen bg-[#131f24] flex items-center justify-center">
      <Spinner size={44} color="#58cc02" />
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
    <div className="min-h-screen bg-[#131f24] text-white flex flex-col font-nunito select-none">
      
      {/* ── DUOLINGO TOP BAR ─────────────────────────────────────── */}
      <header className="max-w-4xl mx-auto w-full px-4 sm:px-8 pt-3 sm:pt-4 pb-1.5 flex items-center gap-3 sm:gap-6 bg-[#131f24] sticky top-0 z-30">
        {/* Quit X button */}
        <button
          onClick={() => setShowQuitModal(true)}
          className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          title="Quit Lesson"
        >
          <X size={22} strokeWidth={2.8} />
        </button>

        {/* Duolingo Signature Glossy Progress Bar */}
        <div className="flex-1 h-3 sm:h-3.5 bg-[#37464f] rounded-full overflow-hidden relative shadow-inner">
          <motion.div
            className="h-full bg-[#58cc02] rounded-full relative"
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
          className="flex items-center gap-1.5 text-rose-500 font-black text-sm sm:text-base px-2.5 py-1 rounded-2xl hover:bg-rose-50/10 cursor-pointer transition-colors"
          title={premium ? 'Unlimited hearts' : `${lives} hearts left (Click to refill)`}
        >
          <Heart size={20} fill="#f43f5e" className="text-rose-500 animate-pulse" />
          <span className="font-extrabold text-white">{premium ? '∞' : lives}</span>
        </div>
      </header>

      {/* ── MAIN EXERCISE CONTAINER (FITS SCREEN NATURALLY, SCROLLABLE IF SMALL) ── */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-3 sm:px-6 pt-1 sm:pt-2 pb-24 sm:pb-28">
        
        {/* Badge Indicator */}
        <div className="flex items-center gap-2 mb-1.5 self-start">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#c084fc] bg-[#7c3aed]/20 border border-[#a855f7]/30 px-3 py-1 rounded-full flex items-center gap-1.5">
            {act.type === 'listen' ? '✨ NEW NUMBER' : act.type === 'speak' ? '🎤 SPEAK OUT LOUD' : act.type === 'tap_answer' ? '✨ CHOOSE ANSWER' : act.type === 'type_answer' ? '⌨️ WRITE ANSWER' : '🧩 MATCH PAIRS'}
          </span>
          {notice && <span className="text-xs font-bold text-emerald-400">{notice}</span>}
        </div>

        {/* Mascot + Speech Prompt Area (Duolingo Style - Compact Single Voice) */}
        <div className="flex items-center gap-3 mb-2 sm:mb-2.5 w-full">
          <div className="flex-shrink-0">
            <Pip size="sm" mood={pipMood} animate={pipAnim} />
          </div>
          <div className="flex-1 min-w-0">
            <SpeechBubble text={hint ?? speech} loading={speechLoading} dark={true} />
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

              return (
                <div className="w-full flex flex-col items-center gap-2 sm:gap-2.5">
                  {/* Section 1: Clean Hero Visual Card (Fits Screen Geometry) */}
                  <motion.div
                    key={String(num ?? word ?? 'hero')}
                    initial={{ scale: 0.95, opacity: 0, y: 12 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 18, stiffness: 220 }}
                    className="w-full max-w-md bg-[#18252d] rounded-2xl sm:rounded-3xl p-3 sm:p-4 border-2 border-[#2e3e48] border-b-4 border-b-[#233139] shadow-lg flex flex-col items-center text-center relative"
                  >
                    {/* Teacher Definition Badge */}
                    {teach.definition && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-extrabold text-[11px] sm:text-xs mb-1 shadow-xs"
                      >
                        <span>💡</span>
                        <span>Meaning: {teach.definition}</span>
                      </motion.div>
                    )}

                    {num !== undefined && (
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
                          <span className="text-5xl sm:text-6xl font-black text-[#58cc02] leading-none select-none tracking-tight">
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
                        {word && <h3 className="text-xl sm:text-2xl font-black text-white capitalize leading-tight mb-1">{word}</h3>}
                      </>
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
                          className="w-full flex flex-col items-center gap-1 my-1 p-2 bg-white/5 rounded-2xl border border-white/10 shadow-inner"
                        >
                          {img ? (
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
                            <p className="text-emerald-300 font-black text-xs sm:text-sm">
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
                        className="flex items-center gap-2 bg-amber-500/15 border border-amber-400/30 text-amber-300 px-3.5 py-1.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider shadow-xs"
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
                      className="text-xs text-slate-500 hover:text-slate-300 font-bold underline transition-colors"
                    >
                      Skip audio to question 👉
                    </motion.button>
                  )}

                  {/* Section 3: 3 Duolingo-style Identification Options — SHOWS LAST WITH STAGGERED ANIMATION */}
                  <AnimatePresence>
                    {(listenPhase === 'identify' || listenPhase === 'completed') && (
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
                            className="text-xs font-black uppercase tracking-wider text-slate-400"
                          >
                            {listenCorrect ? '✨ You found it!' : '👉 Tap the correct answer:'}
                          </motion.p>
                          {!listenCorrect && (
                            <button
                              onClick={handleListenAgain}
                              className="text-xs text-slate-400 hover:text-white font-black flex items-center gap-1.5 transition-colors"
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
                                className={`p-2.5 sm:p-3 rounded-2xl border-2 font-black text-xl sm:text-2xl transition-colors flex flex-col items-center justify-center gap-0.5 text-center relative min-h-[64px] sm:min-h-[76px] cursor-pointer ${
                                  showSuccess
                                    ? 'border-[#58cc02] bg-[#1a3328] border-b-4 border-b-[#46a302] text-[#4ade80] shadow-md ring-2 ring-[#58cc02]/30'
                                    : showWrong
                                    ? 'border-[#ef4444] bg-[#37161b] border-b-4 border-b-[#b91c1c] text-[#fca5a5]'
                                    : isPicked
                                    ? 'border-[#58cc02] bg-[#1a3328] border-b-4 border-b-[#46a302] text-[#4ade80]'
                                    : 'border-[#2e3e48] bg-[#18252d] hover:bg-[#202f37] hover:border-[#384c58] border-b-4 border-b-[#233139] text-white active:translate-y-1 active:border-b-2'
                                }`}
                              >
                                <div className="flex flex-col items-center justify-center">
                                  <span className="text-2xl sm:text-3xl font-black">{opt.text}</span>
                                  {showSuccess && (
                                    <motion.span
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ type: 'spring', damping: 10 }}
                                      className="mt-0.5 flex items-center gap-1 text-[11px] font-black text-[#58cc02]"
                                    >
                                      <Check size={14} strokeWidth={3} />
                                      <span>Correct!</span>
                                    </motion.span>
                                  )}
                                </div>
                                <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-md border border-slate-700 bg-black/20 flex items-center justify-center text-[9px] font-black text-slate-400">
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

            {/* 2. MULTIPLE CHOICE TAP ACTIVITY (DUOLINGO STYLE) */}
            {act.type === 'tap_answer' && (() => {
              const tapContent = act.content as unknown as Record<string, unknown>
              const options = normalizeTapOptions(tapContent)
              return (
                <div className="w-full flex flex-col items-center">
                  <motion.h2
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="text-xl sm:text-2xl font-black text-white text-center mb-3 sm:mb-4"
                  >
                    {activityImage(tapContent) ? stripEmoji(String(tapContent.question ?? '')) : String(tapContent.question ?? '')}
                  </motion.h2>

                  {/* Options List — Animates in Last with Staggered Pop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5 w-full max-w-lg"
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
                          className={`p-3 sm:p-4 rounded-2xl border-2 font-black text-base sm:text-lg transition-colors flex flex-col items-center justify-between gap-2 text-center relative min-h-[72px] sm:min-h-[88px] ${
                            showResult && opt.correct
                              ? 'border-[#58cc02] bg-[#1a3328] border-b-4 border-b-[#46a302] text-[#4ade80]'
                              : showResult && !opt.correct
                              ? 'border-[#ef4444] bg-[#37161b] border-b-4 border-b-[#b91c1c] text-[#fca5a5]'
                              : isSelected
                              ? 'border-[#58cc02] bg-[#1a3328] border-b-4 border-b-[#46a302] text-[#4ade80] shadow-md'
                              : 'border-[#2e3e48] bg-[#18252d] hover:bg-[#202f37] hover:border-[#384c58] border-b-4 border-b-[#233139] text-white active:translate-y-1 active:border-b-2'
                          }`}
                        >
                          <div className="flex-1 flex flex-col items-center justify-center gap-1.5 w-full">
                            {optionImages(tapContent)[opt.text] && (
                              <ActivityImage path={optionImages(tapContent)[opt.text]} alt={opt.text} size="sm" />
                            )}
                            <span className="text-xl sm:text-2xl font-black">{opt.text}</span>
                          </div>
                          <span className="w-5 h-5 rounded-md border border-slate-700 bg-black/20 flex items-center justify-center text-[10px] font-black text-slate-400 self-end">
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
              const word = String(c.word ?? (num !== null ? String(num) : c.prompt ?? '')).trim()
              const targetWord = word.replace(/^say:?\s*/i, '').replace(/[!.]/g, '')
              const objects = c.objects as string[] | undefined
              const img = activityImage(c)
              const expectedStr = String(c.expected ?? targetWord).toLowerCase().trim()

              const gradeSpokenAnswer = (transcript: string) => {
                const normText = transcript.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim()
                const words = normText.split(/\s+/).filter(Boolean)

                if (num !== null) {
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
                  }
                  const alts = NUMBER_ALTS[num] ?? [String(num)]
                  const matched = words.some(w => alts.includes(w)) || alts.some(a => normText.includes(a)) || words.includes(String(num))
                  if (matched) {
                    return { passed: true, score: 100, feedback: 'Super job! You said it!' }
                  }
                }

                const fallback = fallbackGradeSpeech({ expected: expectedStr, transcript, childName: child?.name ?? 'friend' })
                return { passed: fallback.passed, score: fallback.score, feedback: fallback.feedback }
              }

              // Fallback options if child prefers to tap instead of talking
              const tapOptions = num !== null
                ? ['1', '2', '3']
                : [targetWord, '2', '3']

              return (
                <div className="w-full flex flex-col items-center gap-2 sm:gap-2.5">
                  {/* Duolingo Question Header */}
                  <div className="text-center max-w-lg">
                    <motion.h2
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="text-xl sm:text-2xl font-black text-white leading-tight mb-1"
                    >
                      {num !== null ? `Say the number ${num} out loud` : `Say the word "${targetWord}" out loud`}
                    </motion.h2>
                  </div>

                  {/* Clean Hero Visual Card */}
                  <motion.div
                    key={String(num ?? targetWord)}
                    initial={{ scale: 0.95, opacity: 0, y: 12 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 18 }}
                    className="w-full max-w-md bg-[#18252d] rounded-2xl sm:rounded-3xl p-3 sm:p-4 border-2 border-[#2e3e48] border-b-4 border-b-[#233139] shadow-lg flex flex-col items-center text-center relative"
                  >
                    {/* Hear Pip again pill button */}
                    <button
                      type="button"
                      onClick={() => speak(num !== null ? `Say the number ${num} out loud!` : `Say the word: ${targetWord}!`)}
                      className="mb-1.5 px-3 py-1 bg-[#24333b] hover:bg-[#2c3d47] border-2 border-[#324550] border-b-4 border-b-[#1c2930] rounded-xl flex items-center gap-1.5 text-slate-200 font-black text-xs uppercase tracking-wider active:translate-y-0.5 cursor-pointer transition-all"
                    >
                      <Volume2 size={15} className="text-[#58cc02]" />
                      <span>Hear Pip Say It</span>
                    </button>

                    {num !== null && (
                      <span className="text-5xl sm:text-6xl font-black text-[#58cc02] leading-none mb-1 select-none">
                        {num}
                      </span>
                    )}

                    {img ? (
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

                    <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                      &ldquo;{targetWord}&rdquo;
                    </div>
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
                            className="mt-2 text-xs font-black text-slate-400 hover:text-slate-200 underline cursor-pointer"
                          >
                            Can&apos;t talk right now? Tap the answer instead
                          </button>
                        </>
                      ) : (
                        <div className="w-full flex flex-col items-center gap-2">
                          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                            👉 Tap the matching number:
                          </p>
                          <div className="grid grid-cols-3 gap-2.5 w-full">
                            {tapOptions.map(opt => (
                              <button
                                key={opt}
                                onClick={() => {
                                  if (opt === String(num ?? targetWord) || opt.toLowerCase() === targetWord.toLowerCase()) {
                                    handleCorrect(getXP(currentActivity))
                                  } else {
                                    handleWrong()
                                  }
                                }}
                                className="py-3 px-4 rounded-2xl border-2 border-[#2e3e48] border-b-4 border-b-[#233139] bg-[#18252d] hover:bg-[#202f37] text-white font-black text-xl active:translate-y-0.5"
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
                <h2 className="text-2xl sm:text-3xl font-black text-white text-center mb-6">
                  {(act.content as TypeAnswerContent).question}
                </h2>
                <input
                  type="text"
                  value={typedAnswer}
                  onChange={e => setTypedAnswer(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTypeSubmit()}
                  disabled={answerState !== 'idle'}
                  placeholder="Type your answer here..."
                  className="w-full max-w-lg bg-[#18252d] border-2 border-[#2e3e48] border-b-[5px] border-b-[#233139] focus:border-[#58cc02] focus:border-b-[#46a302] rounded-3xl px-6 py-4 text-white font-black text-2xl outline-none shadow-inner transition-all text-center"
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

      {/* ── DUOLINGO FIXED BOTTOM ACTION BAR ─────────────────────── */}
      <footer
        className={`fixed bottom-0 left-0 right-0 z-40 py-2.5 sm:py-3 px-4 sm:px-12 border-t-2 transition-colors duration-200 ${
          isCorrect
            ? 'bg-[#132d20] border-[#235035]'
            : isWrong
            ? 'bg-[#38161b] border-[#68232c]'
            : 'bg-[#131f24] border-[#233139]'
        }`}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left Side: Secondary action or Feedback state */}
          <div className="flex items-center gap-3.5 min-w-0">
            {isCorrect && (
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#1e462b] flex items-center justify-center text-[#4ade80] text-2xl font-black shadow-xs flex-shrink-0 border border-[#2d6a42]">
                  <Check size={26} strokeWidth={3.5} />
                </div>
                <div>
                  <p className="text-xl font-black text-[#4ade80] leading-none mb-0.5">Nicely done!</p>
                  <p className="text-xs sm:text-sm font-extrabold text-emerald-300">+{xpEarned} XP • {feedbackLine}</p>
                </div>
              </div>
            )}

            {isWrong && (
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#4a1d24] flex items-center justify-center text-[#f87171] text-2xl font-black shadow-xs flex-shrink-0 border border-[#6b2933]">
                  <X size={26} strokeWidth={3.5} />
                </div>
                <div>
                  <p className="text-sm font-black text-[#fca5a5] uppercase tracking-wider leading-none mb-1">Correct solution:</p>
                  <p className="text-base sm:text-lg font-black text-white">
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
                    className="px-4 sm:px-6 py-3 rounded-2xl border-2 border-[#324550] border-b-4 border-b-[#1c2930] bg-[#24333b] hover:bg-[#2c3d47] text-slate-200 font-black text-xs sm:text-sm uppercase tracking-wider active:translate-y-0.5 flex items-center gap-2"
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
                    className="px-4 sm:px-6 py-3 rounded-2xl border-2 border-[#324550] border-b-4 border-b-[#1c2930] bg-[#24333b] hover:bg-[#2c3d47] text-slate-300 font-black text-xs sm:text-sm uppercase tracking-wider active:translate-y-0.5"
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
                    ? 'bg-[#58cc02] hover:bg-[#46a302] border-2 border-[#58cc02] border-b-4 border-b-[#46a302]'
                    : 'bg-[#ef4444] hover:bg-[#dc2626] border-2 border-[#ef4444] border-b-4 border-b-[#b91c1c]'
                }`}
              >
                Continue
              </button>
            ) : act.type === 'listen' ? (
              <button
                disabled={!listenCorrect}
                onClick={handleListenContinue}
                className={`px-8 sm:px-12 py-3.5 rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider transition-all flex items-center gap-2 ${
                  listenCorrect
                    ? 'bg-[#58cc02] hover:bg-[#46a302] text-white border-2 border-[#58cc02] border-b-4 border-b-[#46a302] active:translate-y-1 active:border-b-2 shadow-lg animate-pulse'
                    : 'bg-[#2b3a42] text-[#556973] border-b-4 border-[#202d33] cursor-not-allowed'
                }`}
              >
                <span>{listenCorrect ? 'Continue 👉' : 'Pick One Above'}</span>
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
                    : 'bg-[#2b3a42] text-[#556973] border-b-4 border-[#202d33] cursor-not-allowed'
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
                    : 'bg-[#2b3a42] text-[#556973] border-b-4 border-[#202d33] cursor-not-allowed'
                }`}
              >
                Check
              </button>
            ) : null}
          </div>

        </div>
      </footer>

      {/* ── DUOLINGO HEART MISTAKE MODAL (IMAGE 4) ───────────────── */}
      <AnimatePresence>
        {showHeartModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a232a] text-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center border-2 border-slate-700 shadow-2xl font-nunito"
            >
              {/* Hearts row: e.g. 4 red hearts, 1 gray heart */}
              <div className="flex items-center justify-center gap-2 mb-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Heart
                    key={i}
                    size={26}
                    fill={i < Math.max(0, lives) ? '#ef4444' : '#475569'}
                    className={i < Math.max(0, lives) ? 'text-red-500' : 'text-slate-600'}
                  />
                ))}
              </div>

              <h3 className="text-xl sm:text-2xl font-black mb-2 text-white">Each mistake costs 1 heart!</h3>
              <p className="text-slate-300 font-bold text-xs sm:text-sm mb-6 leading-relaxed">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#18252d] text-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center border-2 border-[#2e3e48] border-b-[6px] border-b-[#233139] shadow-2xl font-nunito"
            >
              <Pip size="lg" mood="sad" animate="idle" className="mb-2" />
              <h3 className="text-2xl font-black mb-2 text-white">Quit this lesson?</h3>
              <p className="text-slate-300 font-bold text-xs sm:text-sm mb-6">
                All progress in this lesson will be lost if you leave now.
              </p>
              <div className="space-y-2.5">
                <button
                  onClick={() => setShowQuitModal(false)}
                  className="w-full py-3.5 bg-[#58cc02] hover:bg-[#46a302] text-white font-black text-sm uppercase tracking-wider rounded-2xl border-2 border-[#58cc02] border-b-4 border-b-[#46a302] active:translate-y-0.5"
                >
                  Keep Learning
                </button>
                <button
                  onClick={() => router.push(`/lessons/${id}`)}
                  className="w-full py-3 text-slate-400 hover:text-rose-600 font-black text-xs uppercase tracking-wider"
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
