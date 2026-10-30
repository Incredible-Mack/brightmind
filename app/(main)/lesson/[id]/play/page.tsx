'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, Volume2, RotateCcw } from 'lucide-react'
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
import { fallbackHint } from '@/lib/fallbackTeacher'
import { say, praiseCorrect, cardIntro, lessonGreeting, celebration } from '@/lib/encourage'
import { buildSayTarget, buildIdentify } from '@/lib/sayTarget'
import { cleanForSpeech, isLetterContent, letterScript } from '@/lib/phonics'
import { localAsrSupported, preloadLocalAsr, onAsrStatus } from '@/lib/asr/localAsr'
import { LivesBar } from '@/components/lesson/LivesBar'
import { XPCounter } from '@/components/lesson/XPCounter'
import { MicrophonePanel } from '@/components/lesson/MicrophonePanel'
import { Pip } from '@/components/mascot/Pip'
import { SpeechBubble } from '@/components/mascot/SpeechBubble'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Spinner } from '@/components/ui/Spinner'
import type { Activity, TapAnswerContent, ListenContent, SpeakContent, TypeAnswerContent } from '@/types/activity'
import type { AgeGroup } from '@/types/child'

type AnswerState = 'idle' | 'correct' | 'wrong'
// Every teaching card ends with the child DOING something: say it, or (if they cannot talk right now) identify it
type SayState = 'idle' | 'ask' | 'practice' | 'identify' | 'passed' | 'gaveup'
type NewBadge = { slug: string; title: string; icon: string; xp_bonus: number }

// type_answer rows keep the answer in content.expected; numeric answers arrive as numbers
function expectedFor(act: Activity | undefined): string {
  if (!act) return ''
  const a = act as unknown as { expected_answer?: unknown; content?: { expected?: unknown } }
  return String(a.expected_answer ?? a.content?.expected ?? '').trim()
}

function getXP(act: Activity) {
  return (act as unknown as { xp_value?: number }).xp_value ?? act.xp_reward ?? 5
}

// DB stores options as either:
//   [{id, text, correct}]  (old format)
//   ["a","b","c"] + correct:"c"  (seed SQL format)
function normalizeTapOptions(content: Record<string, unknown>) {
  const opts = (content.options ?? []) as unknown[]
  if (opts.length > 0 && typeof opts[0] === 'object' && opts[0] !== null) {
    return opts as Array<{ id: string; text: string; correct: boolean }>
  }
  // The API turns numeric strings into numbers ("3" -> 3), so compare as text
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

// Extracts [{word, numeral}] from text like "one, two, three, four, five!"
// Returns null if fewer than 2 number words found (not a sequence)
function extractNumberPairs(text: string) {
  const tokens = text.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/)
  const pairs = tokens
    .filter(t => NUMBER_WORDS.hasOwnProperty(t))
    .map(word => ({ word, numeral: NUMBER_WORDS[word] }))
  return pairs.length >= 2 ? pairs : null
}

// Can we listen to the child at all? (browser speech recognition, or a recorder for the fallback)
function micAvailable(serverStt: boolean): boolean {
  if (typeof window === 'undefined') return false
  const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown; MediaRecorder?: unknown }
  // Chrome and Edge listen on their own. Other browsers (Firefox) can only record, which needs the server to turn it into text.
  if (w.SpeechRecognition ?? w.webkitSpeechRecognition) return true
  // No built-in recognition (Firefox): record, then the in-browser model (or the server, if set up) reads it
  return Boolean(w.MediaRecorder) && (localAsrSupported() || serverStt)
}

export default function LessonPlayPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { child, loseLive, hydrateProfile, addXP } = useAppStore()
  const childId = child?.id ? Number(child.id) : null
  const { lesson, activities: planned, reserve: plannedReserve, reason, loading, load } = useLesson(id, childId, {
    name: child?.name ?? 'friend',
    interest: child?.learning_profile?.interests?.[0],
  }, true)
  // The run can change while the child plays (an easier or harder item slipped in), so it lives in state
  const [activities, setQueue] = useState<PlanItem[]>([])
  const reserveRef = useRef<PlanItem[]>([])
  const adaptRef = useRef<AdaptState>(initialAdaptState)
  const [notice, setNotice] = useState<string | null>(null)
  useEffect(() => {
    setQueue(planned as PlanItem[])
    reserveRef.current = plannedReserve as PlanItem[]
    adaptRef.current = initialAdaptState
  }, [planned, plannedReserve])
  const lives = useAppStore(s => s.lives)
  const premium = useAppStore(s => s.premium)
  const { minutesUntilRefill, formattedTime, refillLives } = useLives()
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
  const [showXP, setShowXP] = useState(false)
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
  const [highlightIndex, setHighlightIndex] = useState(-1)
  // Teaching cards: listen, then say it back (or identify it when the child cannot talk right now)
  const [sayState, setSayState] = useState<SayState>('idle')
  const [sayTries, setSayTries] = useState(0)
  const [sayVia, setSayVia] = useState<'voice' | 'tap' | null>(null)
  const [identifyPicked, setIdentifyPicked] = useState<string | null>(null)
  const [practiceKey, setPracticeKey] = useState(0)
  const [feedbackLine, setFeedbackLine] = useState<string | null>(null)
  const streakRef = useRef(0)          // right-first-time answers in a row
  const indexRef = useRef(0)
  const serverSttRef = useRef(false)
  const [voiceNote, setVoiceNote] = useState(false)

  const { speak: _speak, stop: stopSpeech, blocked, clearBlocked, unlock } = useVoiceTeacher()
  // Browsers only allow speech after a tap, so every lesson starts with one
  const [started, setStarted] = useState(false)
  // Safe wrapper — speak may throw if no TTS API key and SpeechSynthesis unavailable
  const speak = useCallback(async (text: string) => {
    try { await _speak(cleanForSpeech(text)) } catch { /* no-op */ }
  }, [_speak])

  // Bookkeeping that must not go stale inside async handlers
  const narrateIdRef = useRef(0)
  const totalXPRef = useRef(0)
  const scoresRef = useRef<number[]>([])
  const awardedRef = useRef<Set<string>>(new Set())
  const startedRef = useRef(false)
  const advancingRef = useRef(false)
  const activityStartRef = useRef(Date.now())
  const resultRef = useRef({ passed: false, score: 0, wrongs: 0 })

  // For number-sequence listen cards: speak each word and highlight its card
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

  // Can the server mark recordings (needed outside Chrome/Edge)? Asked once.
  useEffect(() => {
    fetch('/api/transcribe').then(r => r.json()).then(j => { serverSttRef.current = !!j.available }).catch(() => {})
  }, [])

  // Browsers without built-in recognition: start fetching the speech model as soon as the lesson starts,
  // so it is ready by the time the child is asked to speak.
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

  // Mark the lesson as started (a finished lesson is never downgraded by the server)
  useEffect(() => {
    if (!childId || !lesson || startedRef.current) return
    startedRef.current = true
    api.progress.upsert({ child_id: childId, lesson_id: Number(id), status: 'in_progress' }).catch(() => {})
  }, [childId, lesson, id])

  const currentActivity = activities[actIndex]
  indexRef.current = actIndex
  const ageGroup: AgeGroup = (child?.age ?? 7) <= 5 ? '0-5' : (child?.age ?? 7) <= 8 ? '6-8' : (child?.age ?? 7) <= 11 ? '9-11' : '12-14'

  // Each run is tagged; if the child moves on mid-speech, the old run stops instead of
  // marking the new card as "done listening".
  const narrate = useCallback(async (act: Activity, replay = false) => {
    const myId = ++narrateIdRef.current
    const stale = () => myId !== narrateIdRef.current
    setSpeechLoading(false)
    setMicAutoStart(false)
    setListenDone(false)
    setHighlightIndex(-1)
    const c = act.content as unknown as Record<string, unknown>

    const first = indexRef.current === 0 && !replay
    const name = child?.name ?? 'friend'
    const streak = useAppStore.getState().streak

    // After a teaching card is heard the child has to DO something with it
    const afterListen = async () => {
      setListenDone(true)
      const target = buildSayTarget(c)
      if (!target) { setSayState('passed'); return }
      const keep = (st: SayState) => (st === 'passed' || st === 'gaveup' || st === 'practice' || st === 'identify') ? st : null
      if (!micAvailable(serverSttRef.current)) {
        // No way to listen to them: go straight to identifying
        setSayState(st => keep(st) ?? 'identify')
        setSayVia(v => v ?? 'tap')
        setVoiceNote(true)
        const q = buildIdentify(c)
        if (q) await speak(q.spoken)
        return
      }
      setSayState(st => keep(st) ?? 'ask')
      await speak(say('askSay', name, ageGroup))
    }

    // Letter card: "E. E says eh, as in egg. Egg."
    if (act.type === 'listen' && isLetterContent(c)) {
      const script = letterScript(c)
      if (!replay) { setSayState('idle'); setSayTries(0); setSayVia(null); setIdentifyPicked(null); setSpeech(script) }
      if (first) {
        const greet = lessonGreeting({ name, ageGroup, streak })
        await speak(greet)
        if (stale()) return
      }
      await speak(script)
      if (stale()) return
      await afterListen()
      return
    }

    if (!replay) setSayState('idle')
    const listenText = (() => {
      if (c.number !== undefined) return `${c.word ?? String(c.number)}. ${c.audio_hint ?? ''}`
      return String(c.prompt ?? c.text ?? '')
    })()
    const contentText = act.type === 'listen'
      ? listenText
      : act.type === 'speak'
      ? String(c.prompt ?? '')
      : act.type === 'tap_answer'
      ? String(c.question ?? '')
      : act.type === 'type_answer'
      ? String(c.question ?? '')
      : ''

    // A fresh, varied opener each card (the lesson greeting only on the first one)
    if (!replay) {
      const intro = cardIntro({ type: act.type, name, ageGroup, first, streak })
      setSpeech(intro)
      await speak(intro)
      if (stale()) return
    }
    if (act.type === 'listen') {
      if (c.number !== undefined) await speak(contentText)
      else await speakWithHighlight(contentText)
      if (stale()) return
      await afterListen()
      return
    }
    // The question itself must be heard, not just the intro
    if (contentText) {
      await speak(contentText)
      if (stale()) return
    }
    if (act.type === 'speak') setMicAutoStart(true)
  }, [ageGroup, child?.name, speak, speakWithHighlight])

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
  }, [currentActivity, started])

  // XP is awarded once per activity, however many times a button is pressed
  const award = (act: Activity, xp: number) => {
    const key = String(act.id)
    if (awardedRef.current.has(key)) return false
    awardedRef.current.add(key)
    totalXPRef.current += xp
    setTotalXP(totalXPRef.current)
    return true
  }

  // One row per activity so progress and later recommendations have real data
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
    setShowXP(true)
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 }, colors: ['#4ade80', '#eab308'] })
    const firstTry = attempts === 0
    streakRef.current = firstTry ? streakRef.current + 1 : 0
    const line = praiseCorrect({ name: child?.name ?? 'friend', ageGroup, firstTry, streak: streakRef.current })
    setFeedbackLine(line)
    speak(line)
    setTimeout(() => setShowXP(false), 2000)
  }

  const handleWrong = async (feedback?: string) => {
    loseLive()
    if (childId && !useAppStore.getState().premium) api.profile.update(childId, { lives: useAppStore.getState().lives }).catch(() => {})
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
    if (passed) handleCorrect(getXP(currentActivity))
    else handleWrong(feedback)
  }

  const handleTypeSubmit = () => {
    if (!typedAnswer.trim()) return
    const expected = expectedFor(currentActivity)
    const correct = typedAnswer.trim().toLowerCase() === expected.toLowerCase()
    if (correct) handleCorrect(getXP(currentActivity))
    else handleWrong()
  }

  // ── Say it back (or identify it) after every teaching card ────────────────
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
    confetti({ particleCount: 40, spread: 55, origin: { y: 0.7 }, colors: ['#4ade80', '#eab308'] })
    speak(line)
  }

  const markSayGaveUp = (tries: number) => {
    const line = say('sayGaveUp', childName, ageGroup)
    resultRef.current = { passed: false, score: 40, wrongs: tries }
    setSayState('gaveup')
    setFeedbackLine(line)
    speak(line)
  }

  // The child said it (voice)
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

  // "Yes, I can say it now"
  // Pip says the word or sentence herself, then hands over. She finishes BEFORE the mic opens,
  // or it would hear Pip instead of the child.
  const modelThenListen = async () => {
    const run = narrateIdRef.current
    setMicAutoStart(false)
    setPracticeKey(k => k + 1)           // a fresh microphone panel, so any recording in progress is dropped
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

  // "I cannot talk right now": identify instead
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
      // show the answer and move on: they heard it, and this card will come back
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

  // Re-play the content for listen activities (cancels any run still in flight)
  const handleListenAgain = useCallback(() => {
    if (!currentActivity) return
    narrate(currentActivity, true)
  }, [currentActivity, narrate])

  // Award XP and advance (no correct/wrong panel for listen)
  const handleListenContinue = () => {
    if (!currentActivity || advancingRef.current) return
    const full = getXP(currentActivity)
    // Saying it earns the most; identifying it a little less; giving up half
    if (sayState === 'passed') award(currentActivity, sayVia === 'tap' ? Math.max(1, Math.round(full * 0.7)) : full)
    else award(currentActivity, Math.floor(full * 0.5))
    setListenDone(false)
    handleNext()
  }

  const finishLesson = async () => {
    setFinishing(true)
    stopSpeech()
    const scores = scoresRef.current
    const score = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 100
    const xp = totalXPRef.current
    try {
      if (!childId) throw new Error('no child')
      const res = await api.progress.upsert({
        child_id: childId, lesson_id: Number(id), status: 'completed', score, xp_earned: xp,
      })
      if (res.profile) hydrateProfile(res.profile)
      else addXP(xp)
      setNewBadges(res.new_achievements ?? [])
    } catch {
      addXP(xp) // keep the reward visible even if the save failed
    }
    const message = celebration({ name: child?.name ?? 'friend', ageGroup, xp, score })
    setCelebrationMsg(message)
    setCompleted(true)
    setFinishing(false)
    confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 }, colors: ['#4ade80','#eab308','#3b82f6','#a855f7'] })
    speak(message)
    coach.refresh() // personal note + what to do next (cached, rule-based pick)
  }

  const handleNext = async () => {
    if (advancingRef.current) return
    advancingRef.current = true
    const r = resultRef.current
    saveActivityResult()
    // React to how this answer went before showing the next item
    const adapted = adaptQueue(activities, actIndex, reserveRef.current, adaptRef.current, {
      passed: r.passed, firstTry: r.passed && r.wrongs === 0,
    })
    adaptRef.current = adapted.state
    reserveRef.current = adapted.reserve
    setNotice(adapted.notice)
    setQueue(adapted.queue)
    if (actIndex >= adapted.queue.length - 1) await finishLesson()
    else setActIndex(i => i + 1)
  }

  if (loading || !lesson) return (
    <div className="min-h-screen bg-gradient-to-b from-[#e0f2fe] via-[#f0fdf4] to-[#fefce8] flex items-center justify-center">
      <Spinner size={40} />
    </div>
  )

  if (!started && !completed && (premium || lives > 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#e0f2fe] via-[#f0fdf4] to-[#fefce8] text-[#1d2445] flex flex-col items-center justify-center p-6 text-center">
        <Pip size="xl" mood="excited" animate="idle" />
        <h1 className="text-3xl font-extrabold text-[#1d2445] font-nunito mt-6 mb-2">{lesson.title}</h1>
        <p className="text-slate-600 font-bold font-nunito mb-1">Turn your sound on. Pip will talk to you and listen to you.</p>
        <p className="text-slate-500 font-nunito text-sm mb-8">{activities.length} activities</p>
        <Button size="xl" onClick={() => { unlock(); setStarted(true) }}>Let&apos;s start! <ChevronRight size={22} /></Button>
        <button onClick={() => router.push(`/lessons/${id}`)} className="mt-5 text-slate-500 hover:text-[#1d2445] font-nunito text-sm">Back</button>
      </div>
    )
  }

  if (!premium && lives <= 0 && !completed && !finishing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#e0f2fe] via-[#f0fdf4] to-[#fefce8] text-[#1d2445] flex flex-col items-center justify-center p-6 text-center">
        <Pip size="xl" mood="sad" animate="wrong" />
        <h1 className="text-3xl font-extrabold text-[#1d2445] font-nunito mt-6 mb-2">No hearts left</h1>
        <div className="bg-white/10 border border-slate-200 rounded-2xl px-5 py-3 my-3 flex items-center gap-3 max-w-sm mx-auto">
          <span className="text-2xl animate-pulse">❤️</span>
          <div className="text-left">
            <p className="text-white font-black text-sm font-nunito">
              Next heart in: <span className="text-amber-400 font-mono text-base">{formattedTime}</span>
            </p>
            <p className="text-slate-400 text-xs font-nunito">10-minute cooldown per heart</p>
          </div>
        </div>
        <p className="text-slate-600 font-bold font-nunito mb-6 max-w-sm">
          Take a short break while your hearts recharge, or tap below to instantly refill and keep playing!
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <Button
            size="lg"
            onClick={() => refillLives()}
            className="bg-[#10b981] hover:bg-[#059669] text-white font-black font-nunito shadow-lg"
          >
            Refill Hearts (5/5 ❤️)
          </Button>
          <Button size="lg" variant="secondary" onClick={() => router.push('/upgrade')}>Go Unlimited</Button>
          <Button variant="secondary" size="lg" onClick={() => router.push('/dashboard')}>Go Home</Button>
          <Button variant="ghost" size="lg" onClick={() => router.push('/lessons')}>Other Lessons</Button>
        </div>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#e0f2fe] via-[#f0fdf4] to-[#fefce8] text-[#1d2445] flex flex-col items-center justify-center p-6 text-center">
        <Pip size="xl" mood="excited" animate="correct" />
        <h1 className="text-4xl font-extrabold text-[#1d2445] font-nunito mt-6 mb-2">Lesson Complete!</h1>
        <p className="text-[#10b981] font-bold font-nunito text-lg mb-4">{celebrationMsg}</p>
        <div className="flex items-center gap-2 text-yellow-400 text-2xl font-extrabold font-nunito mb-8">
          +{totalXP} XP earned!
        </div>
        {newBadges.length > 0 && (
          <div className="flex flex-col items-center gap-2 mb-8">
            <p className="text-slate-600 font-bold font-nunito text-sm">New badge{newBadges.length > 1 ? 's' : ''} unlocked!</p>
            <div className="flex gap-3 flex-wrap justify-center">
              {newBadges.map(b => (
                <div key={b.slug} className="bg-white border border-yellow-500/30 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <span className="text-3xl">{b.icon}</span>
                  <span className="text-[#1d2445] font-black font-nunito text-sm">{b.title}{b.xp_bonus ? ` · +${b.xp_bonus} XP` : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {coach.note && (
          <p className="text-slate-600 font-bold font-nunito text-sm max-w-sm mb-6">{coach.note.child}</p>
        )}
        <div className="flex gap-3 flex-wrap justify-center">
          {coach.rec?.recommended.find(r => r.lesson_id !== Number(id)) && (() => {
            const nextPick = coach.rec!.recommended.find(r => r.lesson_id !== Number(id))!
            return <Button size="lg" onClick={() => router.push(nextPick.reason === 'checkpoint' && nextPick.skill_slug ? `/checkpoint/${encodeURIComponent(nextPick.skill_slug)}` : `/lessons/${nextPick.lesson_id}`)}>{nextPick.reason === 'checkpoint' ? 'Show what you know' : `Next: ${nextPick.title}`}</Button>
          })()}
          <Button variant="secondary" size="lg" onClick={() => router.push('/lessons')}>All Lessons</Button>
          <Button variant="ghost" size="lg" onClick={() => router.push('/dashboard')}>Go Home</Button>
        </div>
      </div>
    )
  }

  const act = currentActivity
  if (!act) return null
  const progress = ((actIndex) / activities.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e0f2fe] via-[#f0fdf4] to-[#fefce8] text-[#1d2445] flex flex-col">
      <div className="flex items-center gap-4 px-4 py-3 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
        <button onClick={() => router.push(`/lessons/${id}`)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-[#1d2445] transition-colors">
          <X size={20} />
        </button>
        <div className="flex-1">
          <ProgressBar value={progress} max={100} color="#4ade80" height={8} />
        </div>
        <LivesBar />
      </div>

      <div className="flex-1 flex flex-col items-center px-4 py-8 max-w-xl mx-auto w-full">
        {(() => {
          const chip = reason === 'review' ? { text: 'Review time', cls: 'bg-purple-100 text-purple-900 border-purple-300' }
            : reason === 'retry' ? { text: 'Another go', cls: 'bg-amber-100 text-amber-900 border-amber-300' }
            : reason === 'challenge' ? { text: 'Challenge', cls: 'bg-orange-100 text-orange-900 border-orange-300' }
            : reason === 'continue' ? { text: 'Keep going', cls: 'bg-blue-100 text-blue-900 border-blue-300' }
            : { text: 'Something new', cls: 'bg-emerald-100 text-emerald-900 border-emerald-300' }
          return (
            <div className="flex flex-col items-center gap-2 mb-4 w-full">
              <span className={`text-xs font-bold font-nunito uppercase tracking-widest px-3 py-1 rounded-full border ${chip.cls}`}>{chip.text}</span>
              {notice && <p className="text-[#10b981] text-sm font-nunito font-semibold text-center">{notice}</p>}
              {act.role === 'review' && <p className="text-purple-300 text-xs font-nunito">A quick look back at something you learned before</p>}
            </div>
          )
        })()}
        <div className="flex items-end gap-4 mb-8 w-full justify-center">
          <Pip size="lg" mood={pipMood} animate={pipAnim} />
          <SpeechBubble text={hint ?? speech} loading={speechLoading} />
        </div>
        {blocked && (
          <Button variant="secondary" size="md" className="-mt-4 mb-4 gap-2" onClick={() => { unlock(); clearBlocked(); if (currentActivity) narrate(currentActivity, true) }}>
            <Volume2 size={16} /> Tap to hear Pip
          </Button>
        )}

        <div className="flex gap-2 mb-8 justify-center flex-wrap">
          {activities.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all ${
              i < actIndex ? 'w-4 bg-[#22c55e]'
              : i === actIndex ? 'w-6 bg-[#4ade80]'
              : 'w-2.5 bg-slate-300'
            }`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={act.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="w-full flex flex-col items-center gap-6"
          >
            {act.type === 'listen' && (() => {
              const c = act.content as unknown as Record<string, unknown>
              const letter  = c.letter  as string | undefined
              const word    = c.word    as string | undefined
              const visual  = c.visual  as string | undefined
              const img     = activityImage(c)          // a real picture replaces the emoji
              const num     = c.number  as number | undefined
              const objects = c.objects as string[] | undefined
              const fullPrompt = String(c.prompt ?? c.text ?? '')
              const colonIdx = fullPrompt.indexOf(':')
              const contentPart = colonIdx >= 0 ? fullPrompt.slice(colonIdx + 1).trim() : fullPrompt
              const numberPairs = extractNumberPairs(contentPart)

              const sayDone = sayState === 'passed' || sayState === 'gaveup'
              const sayBlock = (
                <>
                  {asrPercent != null && (sayState === 'ask' || sayState === 'practice') && (
                    <p className="text-slate-500 font-bold font-nunito text-xs text-center">Getting my ears ready for your voice… {asrPercent}% (only the first time)</p>
                  )}
                  {sayState === 'ask' && (
                    <div className="w-full bg-white rounded-3xl p-6 border-2 border-purple-200 border-b-4 border-purple-300 shadow-lg text-center">
                      <p className="text-[#1d2445] font-nunito font-black text-xl mb-1">Your turn!</p>
                      {sayTarget && <p className="text-[#10b981] font-nunito font-bold text-xl mb-1">{sayTarget.instruction}</p>}
                      <p className="text-slate-600 font-bold font-nunito text-sm mb-4">
                        {sayTarget?.kind === 'letter' ? 'Say the sound out loud to move on.' : 'Say it out loud to move on.'}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button fullWidth size="md" onClick={chooseVoice}>🎤 I can say it now</Button>
                        <Button fullWidth size="md" variant="secondary" onClick={chooseTap}>🤫 I can&apos;t talk now</Button>
                      </div>
                      <p className="text-slate-500 font-nunito text-xs mt-3">If you can&apos;t talk, you will tap the answer instead.</p>
                    </div>
                  )}

                  {sayState === 'practice' && sayTarget && (
                    <div className="w-full bg-white rounded-3xl p-6 border-2 border-slate-200 border-b-4 border-slate-300 shadow-lg">
                      <p className="text-center text-[#1d2445] font-nunito font-black text-lg mb-1">{sayTarget.instruction}</p>
                      {sayTarget.kind !== 'letter' && sayTarget.kind !== 'number' && (
                        <p className="text-center text-[#10b981] font-nunito text-sm mb-2">&ldquo;{sayTarget.expected}&rdquo;</p>
                      )}
                      <div className="flex justify-center mb-3">
                        <Button variant="secondary" size="sm" className="gap-2" onClick={modelThenListen}><Volume2 size={14} /> Hear it again</Button>
                      </div>
                      <MicrophonePanel
                        key={practiceKey}
                        expected={sayTarget.expected}
                        localGrade={sayGrade}
                        onResult={handleSayResult}
                        onSkip={chooseTap}
                        subject="general"
                        ageGroup={ageGroup}
                        childName={childName}
                        autoStart={micAutoStart}
                      />
                      {sayTries >= 1 && (
                        <button onClick={chooseTap} className="block mx-auto mt-3 text-slate-400 hover:text-[#1d2445] font-nunito text-xs underline">I can&apos;t talk right now, let me tap instead</button>
                      )}
                    </div>
                  )}

                  {voiceNote && sayVia === 'tap' && sayState === 'identify' && (
                    <p className="text-yellow-300/90 font-nunito text-xs text-center">This browser can&apos;t listen to your voice. Use Google Chrome or Edge to say answers out loud. For now, tap the answer.</p>
                  )}
                  {(sayState === 'identify' || (sayVia === 'tap' && sayDone)) && identifyQ && (
                    <div className="w-full bg-white rounded-3xl p-6 border-2 border-slate-200 border-b-4 border-slate-300 shadow-lg">
                      <p className="text-center text-[#1d2445] font-nunito font-black text-xl mb-4">{identifyQ.question}</p>
                      <div className="grid grid-cols-2 gap-3">
                        {identifyQ.options.map(o => {
                          const right = sayDone ? o === identifyQ.correct : false
                          const wrong = !sayDone && identifyPicked === o && o !== identifyQ.correct
                          return (
                            <motion.button key={o} whileTap={{ scale: 0.97 }} disabled={sayDone} onClick={() => handleIdentify(o)}
                              className={`p-4 rounded-2xl border-2 text-[#1d2445] font-black font-nunito text-xl min-h-[64px] transition-all ${
                                right ? 'border-emerald-500 bg-emerald-50 text-emerald-950 border-b-4 border-b-emerald-600' : wrong ? 'border-rose-400 bg-rose-50 text-rose-950 border-b-4 border-b-rose-600' : 'border-slate-200 bg-white hover:bg-slate-50 text-[#1d2445] border-b-4 border-b-slate-300 shadow-sm'}`}>
                              {o}
                            </motion.button>
                          )
                        })}
                      </div>
                      <div className="flex justify-center mt-3">
                        <Button variant="ghost" size="sm" onClick={() => speak(identifyQ.spoken)} className="gap-2"><Volume2 size={14} /> Hear the question</Button>
                      </div>
                    </div>
                  )}

                  {sayDone && feedbackLine && (
                    <p className={`font-extrabold font-nunito text-center ${sayState === 'passed' ? 'text-[#10b981]' : 'text-slate-300'}`}>{feedbackLine}</p>
                  )}
                </>
              )

              const listenControls = (
                <>
                  {sayBlock}
                  <div className="flex gap-3 w-full mt-1">
                    <Button variant="secondary" size="md" onClick={handleListenAgain} className="gap-2 flex-shrink-0">
                      <RotateCcw size={16} /> Listen Again
                    </Button>
                    <Button fullWidth size="md" onClick={handleListenContinue} className="gap-2" disabled={!sayDone}>
                      {!listenDone ? 'Listen first' : sayState === 'ask' ? 'Your turn first' : sayDone ? 'Next' : 'Finish this first'} <ChevronRight size={18} />
                    </Button>
                  </div>
                </>
              )

              // ── Single letter card (e.g. "A is for Apple 🍎") ──────────
              if (letter) return (
                <div className="w-full flex flex-col items-center gap-5">
                  <div className="flex items-center gap-2 bg-blue-100 border-2 border-blue-200 rounded-full px-4 py-1.5 shadow-xs">
                    <Volume2 size={15} className="text-blue-600" />
                    <span className="text-blue-950 font-black font-nunito text-xs uppercase tracking-widest">Listen and learn</span>
                  </div>
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                    className="bg-white rounded-3xl p-8 w-full border-2 border-slate-200 border-b-[6px] border-b-slate-300 shadow-xl flex flex-col items-center gap-4 text-[#1d2445]"
                  >
                    <span className="text-[120px] sm:text-[160px] font-extrabold text-[#10b981] font-nunito leading-none">{letter.toUpperCase()}</span>
                    {img ? <ActivityImage path={img} alt={word ?? ''} /> : visual && <span className="text-6xl">{visual}</span>}
                    {word && (
                      <p className="text-[#1d2445] font-black font-nunito text-2xl">
                        <span className="text-[#10b981]">{letter.toUpperCase()}</span> is for <span className="text-[#10b981]">{word}</span>
                      </p>
                    )}
                    {!!c.audio_hint && <p className="text-slate-500 font-bold font-nunito text-sm italic">"{String(c.audio_hint)}"</p>}
                  </motion.div>
                  {listenControls}
                </div>
              )

              // ── Single number card (e.g. "3 — Three 🍎🍎🍎") ────────────
              if (num !== undefined) return (
                <div className="w-full flex flex-col items-center gap-5">
                  <div className="flex items-center gap-2 bg-blue-100 border-2 border-blue-200 rounded-full px-4 py-1.5 shadow-xs">
                    <Volume2 size={15} className="text-blue-600" />
                    <span className="text-blue-950 font-black font-nunito text-xs uppercase tracking-widest">Listen and count</span>
                  </div>
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                    className="bg-white rounded-3xl p-8 w-full border-2 border-slate-200 border-b-[6px] border-b-slate-300 shadow-xl flex flex-col items-center gap-4 text-[#1d2445]"
                  >
                    <span className="text-[120px] sm:text-[160px] font-extrabold text-[#10b981] font-nunito leading-none">{num}</span>
                    {word && <p className="text-[#1d2445] font-black font-nunito text-4xl capitalize">{word}</p>}
                    {img ? <ActivityImage path={img} alt={word ?? ''} /> : objects && (
                      <div className="flex flex-wrap gap-2 justify-center text-4xl mt-2">
                        {objects.map((o, i) => <motion.span key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }}>{o}</motion.span>)}
                      </div>
                    )}
                    {!!c.audio_hint && <p className="text-slate-500 font-bold font-nunito text-sm italic mt-2">"{String(c.audio_hint)}"</p>}
                  </motion.div>
                  {listenControls}
                </div>
              )

              // ── Number sequence row (e.g. 1 2 3 4 5) ────────────────────
              if (numberPairs) return (
                <div className="w-full flex flex-col items-center gap-5">
                  <div className="flex items-center gap-2 bg-blue-100 border-2 border-blue-200 rounded-full px-4 py-1.5 shadow-xs">
                    <Volume2 size={15} className="text-blue-600" />
                    <span className="text-blue-950 font-black font-nunito text-xs uppercase tracking-widest">Count along</span>
                  </div>
                  {img && <ActivityImage path={img} />}
                  <div className="bg-white rounded-3xl p-6 w-full border-2 border-slate-200 border-b-[6px] border-b-slate-300 shadow-xl text-[#1d2445]">
                    <div className="flex justify-center gap-3 flex-wrap">
                      {numberPairs.map(({ word: w, numeral }, idx) => {
                        const active = highlightIndex === idx
                        return (
                        <motion.div key={numeral}
                          initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: active ? 1.12 : 1 }}
                          transition={{ delay: highlightIndex === -1 ? numeral * 0.1 : 0, type: 'spring', stiffness: 260, damping: 20 }}
                          className={`flex flex-col items-center gap-1.5 rounded-2xl px-4 py-4 min-w-[64px] border-2 transition-colors ${
                            active
                              ? 'bg-[#4ade80]/20 border-[#4ade80] shadow-lg shadow-green-500/20'
                              : 'bg-slate-50 border-transparent'
                          }`}
                        >
                          <span className={`text-4xl sm:text-5xl font-extrabold font-nunito leading-none ${active ? 'text-emerald-950 font-black' : 'text-[#10b981] font-black'}`}>{numeral}</span>
                          <span className={`font-bold font-nunito text-xs capitalize ${active ? 'text-emerald-700 font-black' : 'text-slate-600 font-bold'}`}>{w}</span>
                        </motion.div>
                        )
                      })}
                    </div>
                  </div>
                  {!!c.audio_hint && <p className="text-slate-500 font-bold font-nunito text-sm italic">"{String(c.audio_hint)}"</p>}
                  {listenControls}
                </div>
              )

              // ── Plain text / concept explanation ─────────────────────────
              const badge = colonIdx >= 0 ? fullPrompt.slice(0, colonIdx).trim() : 'Listen'
              return (
                <div className="w-full flex flex-col items-center gap-5">
                  <div className="flex items-center gap-2 bg-blue-100 border-2 border-blue-200 rounded-full px-4 py-1.5 shadow-xs">
                    <Volume2 size={15} className="text-blue-600" />
                    <span className="text-blue-950 font-black font-nunito text-xs uppercase tracking-widest">{badge}</span>
                  </div>
                  <div className="bg-white rounded-3xl p-8 text-center w-full border-2 border-slate-200 border-b-[6px] border-b-slate-300 shadow-xl flex flex-col items-center gap-5 text-[#1d2445]">
                    {img && <ActivityImage path={img} />}
                    <p className="text-2xl sm:text-3xl font-black text-[#1d2445] font-nunito leading-snug">{img ? stripEmoji(contentPart) : contentPart}</p>
                    {!!c.audio_hint && <p className="text-slate-500 font-bold font-nunito text-sm mt-4 italic">"{String(c.audio_hint)}"</p>}
                  </div>
                  {listenControls}
                </div>
              )
            })()}

            {act.type === 'speak' && (() => {
              const c = act.content as unknown as Record<string, unknown>
              return (
                <>
                <div className="bg-white rounded-3xl p-8 text-center w-full border-2 border-slate-200 border-b-[6px] border-b-slate-300 shadow-xl flex flex-col items-center gap-5 text-[#1d2445]">
                  {activityImage(c) && <ActivityImage path={activityImage(c)!} />}
                  <div className="text-4xl sm:text-6xl font-extrabold text-[#1d2445] font-nunito">
                    {activityImage(c) ? stripEmoji(String(c.prompt ?? '')) : String(c.prompt ?? '')}
                  </div>
                </div>
                {answerState === 'idle' && (
                  <MicrophonePanel
                    expected={String((act.content as unknown as Record<string, unknown>).expected ?? '')}
                    onResult={handleSpeechResult}
                    onSkip={() => {
                      // Award half XP and continue when voice isn't available
                      resultRef.current = { passed: false, score: 40, wrongs: resultRef.current.wrongs }
                      award(currentActivity, Math.floor(getXP(currentActivity) * 0.5))
                      handleNext()
                    }}
                    subject={(lesson as unknown as { subject?: { slug: string } }).subject?.slug ?? 'general'}
                    ageGroup={ageGroup}
                    childName={child?.name ?? 'friend'}
                    autoStart={micAutoStart}
                  />
                )}
              </>
            )
            })()}

            {act.type === 'tap_answer' && (() => {
              const tapContent = act.content as unknown as Record<string, unknown>
              const options = normalizeTapOptions(tapContent)
              return (
                <>
                  {activityImage(tapContent) && <ActivityImage path={activityImage(tapContent)!} />}
                  <div className="text-[#1d2445] font-black text-2xl font-nunito text-center w-full">
                    {activityImage(tapContent) ? stripEmoji(String(tapContent.question ?? '')) : String(tapContent.question ?? '')}
                  </div>
                  <div className="grid grid-cols-2 gap-3 w-full">
                    {options.map(opt => {
                      const isSelected = selected === opt.id
                      const showResult = answerState !== 'idle' && isSelected
                      return (
                        <motion.button
                          key={opt.id}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleTapAnswer(opt)}
                          disabled={answerState !== 'idle'}
                          className={`p-5 rounded-2xl border-2 font-black font-nunito text-lg transition-all min-h-[80px] flex flex-col items-center justify-center gap-2 ${
                            showResult && opt.correct ? 'border-[#4ade80] bg-[#4ade80]/20'
                            : showResult && !opt.correct ? 'border-red-500 bg-red-500/20'
                            : 'border-slate-200 bg-white hover:border-white/40'
                          }`}
                        >
                          {optionImages(tapContent)[opt.text] && <ActivityImage path={optionImages(tapContent)[opt.text]} alt={opt.text} size="md" />}
                          {opt.text}
                        </motion.button>
                      )
                    })}
                  </div>
                </>
              )
            })()}

            {act.type === 'type_answer' && (
              <>
                {activityImage(act.content as unknown as Record<string, unknown>) && <ActivityImage path={activityImage(act.content as unknown as Record<string, unknown>)!} />}
                <div className="text-[#1d2445] font-black text-2xl font-nunito text-center w-full">
                  {(act.content as TypeAnswerContent).question}
                </div>
                <input
                  type="text"
                  value={typedAnswer}
                  onChange={e => setTypedAnswer(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTypeSubmit()}
                  disabled={answerState !== 'idle'}
                  placeholder="Type your answer..."
                  className="w-full bg-white border-2 border-slate-300 border-b-4 border-slate-400 focus:border-[#10b981] rounded-2xl px-5 py-4 text-[#1d2445] font-nunito font-black text-2xl outline-none shadow-sm transition-all"
                  autoFocus
                />
                {answerState === 'idle' && (
                  <Button fullWidth size="lg" onClick={handleTypeSubmit} disabled={!typedAnswer.trim()}>
                    Check Answer
                  </Button>
                )}
              </>
            )}

            {act.type === 'drag_drop' && (() => {
              const c = act.content as unknown as { prompt?: string; pairs?: Array<{ id: string; item: string; target: string }> }
              return (
                <MatchActivity
                  key={`${act.id}-${attempts}`}
                  prompt={c.prompt}
                  pairs={c.pairs ?? []}
                  disabled={answerState !== 'idle'}
                  onComplete={ok => (ok ? handleCorrect(getXP(act)) : handleWrong())}
                />
              )
            })()}

            {act.type === 'video' && (
              <div className="w-full">
                <video
                  className="w-full rounded-2xl bg-black"
                  controls
                  onEnded={() => setVideoEnded(true)}
                >
                  <source src="" type="video/mp4" />
                  Video not available.
                </video>
                {!videoEnded && <p className="text-center text-slate-400 text-sm mt-2 font-nunito">Watch the video to continue</p>}
              </div>
            )}

            {answerState !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`w-full rounded-2xl p-5 border ${
                  answerState === 'correct'
                    ? 'bg-[#22c55e]/10 border-[#22c55e]/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`font-extrabold font-nunito text-lg ${answerState === 'correct' ? 'text-[#10b981]' : 'text-red-400'}`}>
                      {feedbackLine ?? (answerState === 'correct' ? 'Correct!' : 'Not quite!')}
                    </div>
                    {answerState === 'wrong' && (
                      <div className="text-rose-900 font-extrabold text-sm font-nunito mt-1">
                        {(() => {
                          if (attempts < 1) return 'Try again!'
                          const c = act.content as unknown as Record<string, unknown>
                          const correctAns = act.type === 'tap_answer'
                            ? normalizeTapOptions(c).find(o => o.correct)?.text ?? ''
                            : String(c.expected ?? c.correct ?? '')
                          return `The answer is: ${correctAns}`
                        })()}
                      </div>
                    )}
                  </div>
                  <XPCounter earned={xpEarned} visible={answerState === 'correct' && showXP} />
                </div>
                {(answerState === 'correct' || attempts >= 2) && (
                  <Button className="mt-4 w-full" size="lg" onClick={handleNext}>
                    Continue <ChevronRight size={20} />
                  </Button>
                )}
                {answerState === 'wrong' && attempts < 2 && (
                  <Button variant="secondary" className="mt-3 w-full" size="md" onClick={() => { setAnswerState('idle'); setSelected(null) }}>
                    Try Again
                  </Button>
                )}
              </motion.div>
            )}

            {act.type === 'video' && videoEnded && answerState === 'idle' && (
              <Button fullWidth size="lg" onClick={() => handleCorrect(getXP(act))}>
                Continue <ChevronRight size={20} />
              </Button>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
