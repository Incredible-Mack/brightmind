'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, Volume2, RotateCcw } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useLesson } from '@/hooks/useLesson'
import { useAppStore } from '@/store/useAppStore'
import { useVoiceTeacher } from '@/hooks/useVoiceTeacher'
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
  const correctVal = String(content.correct ?? '')
  return (opts as string[]).map((text, i) => ({
    id: String(i),
    text,
    correct: text === correctVal,
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

export default function LessonPlayPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { lesson, activities, loading, load } = useLesson(id)
  const { child, addXP, loseLive } = useAppStore()

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
  const [celebrationMsg, setCelebrationMsg] = useState('')
  const [totalXP, setTotalXP] = useState(0)
  const [videoEnded, setVideoEnded] = useState(false)
  const [micAutoStart, setMicAutoStart] = useState(false)
  const [listenDone, setListenDone] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)

  const { speak: _speak } = useVoiceTeacher()
  // Safe wrapper — speak may throw if no TTS API key and SpeechSynthesis unavailable
  const speak = useCallback(async (text: string) => {
    try { await _speak(text) } catch { /* no-op */ }
  }, [_speak])

  // For number-sequence listen cards: speak each word and highlight its card
  const speakWithHighlight = useCallback(async (text: string) => {
    const pairs = extractNumberPairs(text)
    if (pairs && pairs.length >= 2) {
      for (let i = 0; i < pairs.length; i++) {
        setHighlightIndex(i)
        await speak(pairs[i].word)
        await new Promise<void>(r => setTimeout(r, 200))
      }
      setHighlightIndex(-1)
    } else {
      setHighlightIndex(-1)
      await speak(text)
    }
  }, [speak])

  useEffect(() => { load() }, [load])

  const currentActivity = activities[actIndex]
  const ageGroup: AgeGroup = (child?.age ?? 7) <= 5 ? '0-5' : (child?.age ?? 7) <= 8 ? '6-8' : (child?.age ?? 7) <= 11 ? '9-11' : '12-14'

  const narrate = useCallback(async (act: Activity) => {
    setSpeechLoading(true)
    setMicAutoStart(false)
    setListenDone(false)
    setHighlightIndex(-1)
    const c = act.content as unknown as Record<string, unknown>
    // For letter/number intro activities, build a richer TTS text
    const listenText = (() => {
      if (c.letter) return `${c.letter}. ${c.letter} is for ${c.word ?? ''}. ${c.audio_hint ?? ''}`
      if (c.number !== undefined) return `${c.word ?? String(c.number)}. ${c.audio_hint ?? ''}`
      return String(c.prompt ?? c.text ?? '')
    })()
    const contentText = act.type === 'listen'
      ? listenText
      : act.type === 'speak'
      ? String(c.prompt ?? '')
      : act.type === 'tap_answer'
      ? String(c.question ?? '')
      : 'Let us try this activity!'
    try {
      const res = await fetch('/api/teacher/narrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: id,
          activityType: act.type,
          content: contentText,
          childName: child?.name ?? 'friend',
          ageGroup,
        }),
      })
      const { speech: s } = await res.json()
      setSpeech(s)
      setSpeechLoading(false)
      await speak(s)
      if (act.type === 'listen') {
        await speakWithHighlight(contentText)
        setListenDone(true)   // triggers auto-advance countdown
      }
      if (act.type === 'speak') setMicAutoStart(true)
    } catch {
      setSpeechLoading(false)
      setSpeech("Let's try this together!")
      if (act.type === 'listen') setListenDone(true)
      if (act.type === 'speak') setMicAutoStart(true)
    }
  }, [id, child, ageGroup, speak, speakWithHighlight])

  useEffect(() => {
    if (currentActivity) {
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
      narrate(currentActivity)
    }
  }, [currentActivity])

  const handleCorrect = (earnedXP: number) => {
    const xp = attempts === 0 ? earnedXP : Math.floor(earnedXP * 0.5)
    setXpEarned(xp)
    setTotalXP(t => t + xp)
    addXP(xp)
    setAnswerState('correct')
    setPipMood('excited')
    setPipAnim('correct')
    setShowXP(true)
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 }, colors: ['#4ade80', '#eab308'] })
    speak(attempts === 0 ? "Correct! Well done!" : "You got it! Great persistence!")
    setTimeout(() => setShowXP(false), 2000)
  }

  const handleWrong = async () => {
    loseLive()
    setAnswerState('wrong')
    setPipMood('sad')
    setPipAnim('wrong')
    setAttempts(a => a + 1)
    if (attempts >= 1) {
      const res = await fetch('/api/teacher/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: speech ?? '',
          childAnswer: selected ?? typedAnswer,
          correctAnswer: (currentActivity as unknown as { expected_answer?: string })?.expected_answer ?? '',
          attempts: attempts + 1,
          activityType: currentActivity?.type,
        }),
      })
      const { hint: h } = await res.json()
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

  const handleSpeechResult = (_transcript: string, _score: number, passed: boolean) => {
    if (passed) handleCorrect(getXP(currentActivity))
    else handleWrong()
  }

  const handleTypeSubmit = () => {
    if (!typedAnswer.trim()) return
    const expected = (currentActivity as unknown as { expected_answer?: string }).expected_answer ?? ''
    const correct = typedAnswer.trim().toLowerCase() === expected.toLowerCase()
    if (correct) handleCorrect(getXP(currentActivity))
    else handleWrong()
  }

  // Re-play the content text for listen activities
  const handleListenAgain = useCallback(async () => {
    if (!currentActivity) return
    const c = currentActivity.content as unknown as Record<string, unknown>
    const text = c.letter
      ? `${c.letter}. ${c.letter} is for ${c.word ?? ''}. ${c.audio_hint ?? ''}`
      : c.number !== undefined
      ? `${c.word ?? String(c.number)}. ${c.audio_hint ?? ''}`
      : String(c.prompt ?? c.text ?? '')
    await speakWithHighlight(text)
  }, [currentActivity, speakWithHighlight])

  // Award XP and advance immediately (no correct/wrong panel for listen)
  const handleListenContinue = useCallback(() => {
    if (!currentActivity) return
    const xp = getXP(currentActivity)
    setTotalXP(t => t + xp)
    addXP(xp)
    setListenDone(false)
    handleNext()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentActivity, addXP])

  // Auto-advance listen activities 3 s after content finishes playing
  useEffect(() => {
    if (!listenDone || answerState !== 'idle') return
    const timer = setTimeout(() => handleListenContinue(), 3000)
    return () => clearTimeout(timer)
  }, [listenDone, answerState, handleListenContinue])

  const handleNext = async () => {
    const isLast = actIndex >= activities.length - 1
    if (isLast) {
      const res = await fetch('/api/teacher/celebrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonTitle: lesson?.title ?? '', xpEarned: totalXP, childName: child?.name ?? 'friend' }),
      })
      const { message } = await res.json()
      setCelebrationMsg(message)
      setCompleted(true)
      confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 }, colors: ['#4ade80','#eab308','#3b82f6','#a855f7'] })
      speak(message)
    } else {
      setActIndex(i => i + 1)
    }
  }

  if (loading || !lesson) return (
    <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center">
      <Spinner size={40} />
    </div>
  )

  if (completed) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex flex-col items-center justify-center p-6 text-center">
        <Pip size="xl" mood="excited" animate="correct" />
        <h1 className="text-4xl font-extrabold text-white font-nunito mt-6 mb-2">Lesson Complete!</h1>
        <p className="text-[#4ade80] font-bold font-nunito text-lg mb-4">{celebrationMsg}</p>
        <div className="flex items-center gap-2 text-yellow-400 text-2xl font-extrabold font-nunito mb-8">
          +{totalXP} XP earned!
        </div>
        <div className="flex gap-3 flex-wrap justify-center">
          <Button size="lg" onClick={() => router.push('/lessons')}>Continue Learning</Button>
          <Button variant="secondary" size="lg" onClick={() => router.push('/dashboard')}>Go Home</Button>
        </div>
      </div>
    )
  }

  const act = currentActivity
  if (!act) return null
  const progress = ((actIndex) / activities.length) * 100

  return (
    <div className="min-h-screen bg-[#1a1f2e] flex flex-col">
      <div className="flex items-center gap-4 px-4 py-3 border-b border-white/5 bg-[#1e2433]">
        <button onClick={() => router.push(`/lessons/${id}`)} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
        <div className="flex-1">
          <ProgressBar value={progress} max={100} color="#4ade80" height={8} />
        </div>
        <LivesBar />
      </div>

      <div className="flex-1 flex flex-col items-center px-4 py-8 max-w-xl mx-auto w-full">
        <div className="flex items-end gap-4 mb-8 w-full justify-center">
          <Pip size="lg" mood={pipMood} animate={pipAnim} />
          <SpeechBubble text={hint ?? speech} loading={speechLoading} />
        </div>

        <div className="flex gap-2 mb-8 justify-center flex-wrap">
          {activities.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all ${
              i < actIndex ? 'w-4 bg-[#22c55e]'
              : i === actIndex ? 'w-6 bg-[#4ade80]'
              : 'w-2 bg-white/20'
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
              const num     = c.number  as number | undefined
              const objects = c.objects as string[] | undefined
              const fullPrompt = String(c.prompt ?? c.text ?? '')
              const colonIdx = fullPrompt.indexOf(':')
              const contentPart = colonIdx >= 0 ? fullPrompt.slice(colonIdx + 1).trim() : fullPrompt
              const numberPairs = extractNumberPairs(contentPart)

              const listenControls = (
                <div className="flex gap-3 w-full mt-1">
                  <Button variant="secondary" size="md" onClick={handleListenAgain} className="gap-2 flex-shrink-0">
                    <RotateCcw size={16} /> Listen Again
                  </Button>
                  <Button fullWidth size="md" onClick={handleListenContinue} className="gap-2">
                    Continue <ChevronRight size={18} />
                  </Button>
                </div>
              )

              // ── Single letter card (e.g. "A is for Apple 🍎") ──────────
              if (letter) return (
                <div className="w-full flex flex-col items-center gap-5">
                  <div className="flex items-center gap-2 bg-blue-500/15 border border-blue-500/25 rounded-full px-4 py-2">
                    <Volume2 size={15} className="text-blue-400" />
                    <span className="text-blue-300 font-bold font-nunito text-xs uppercase tracking-widest">Listen and learn</span>
                  </div>
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                    className="bg-[#252b3b] rounded-3xl p-8 w-full border border-white/5 flex flex-col items-center gap-4"
                  >
                    <span className="text-[120px] sm:text-[160px] font-extrabold text-[#4ade80] font-nunito leading-none">{letter.toUpperCase()}</span>
                    {visual && <span className="text-6xl">{visual}</span>}
                    {word && (
                      <p className="text-white font-bold font-nunito text-2xl">
                        <span className="text-[#4ade80]">{letter.toUpperCase()}</span> is for <span className="text-[#4ade80]">{word}</span>
                      </p>
                    )}
                    {!!c.audio_hint && <p className="text-slate-400 font-nunito text-sm italic">"{String(c.audio_hint)}"</p>}
                  </motion.div>
                  {listenControls}
                  {listenDone && <p className="text-slate-500 text-xs font-nunito">Auto-advancing in 3 seconds…</p>}
                </div>
              )

              // ── Single number card (e.g. "3 — Three 🍎🍎🍎") ────────────
              if (num !== undefined) return (
                <div className="w-full flex flex-col items-center gap-5">
                  <div className="flex items-center gap-2 bg-blue-500/15 border border-blue-500/25 rounded-full px-4 py-2">
                    <Volume2 size={15} className="text-blue-400" />
                    <span className="text-blue-300 font-bold font-nunito text-xs uppercase tracking-widest">Listen and count</span>
                  </div>
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                    className="bg-[#252b3b] rounded-3xl p-8 w-full border border-white/5 flex flex-col items-center gap-4"
                  >
                    <span className="text-[120px] sm:text-[160px] font-extrabold text-[#4ade80] font-nunito leading-none">{num}</span>
                    {word && <p className="text-white font-bold font-nunito text-3xl capitalize">{word}</p>}
                    {objects && (
                      <div className="flex flex-wrap gap-2 justify-center text-4xl mt-2">
                        {objects.map((o, i) => <motion.span key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }}>{o}</motion.span>)}
                      </div>
                    )}
                    {!!c.audio_hint && <p className="text-slate-400 font-nunito text-sm italic mt-2">"{String(c.audio_hint)}"</p>}
                  </motion.div>
                  {listenControls}
                  {listenDone && <p className="text-slate-500 text-xs font-nunito">Auto-advancing in 3 seconds…</p>}
                </div>
              )

              // ── Number sequence row (e.g. 1 2 3 4 5) ────────────────────
              if (numberPairs) return (
                <div className="w-full flex flex-col items-center gap-5">
                  <div className="flex items-center gap-2 bg-blue-500/15 border border-blue-500/25 rounded-full px-4 py-2">
                    <Volume2 size={15} className="text-blue-400" />
                    <span className="text-blue-300 font-bold font-nunito text-xs uppercase tracking-widest">Count along</span>
                  </div>
                  <div className="bg-[#252b3b] rounded-3xl p-6 w-full border border-white/5">
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
                              : 'bg-[#1a1f2e] border-transparent'
                          }`}
                        >
                          <span className={`text-4xl sm:text-5xl font-extrabold font-nunito leading-none ${active ? 'text-white' : 'text-[#4ade80]'}`}>{numeral}</span>
                          <span className={`font-bold font-nunito text-xs capitalize ${active ? 'text-[#4ade80]' : 'text-slate-300'}`}>{w}</span>
                        </motion.div>
                        )
                      })}
                    </div>
                  </div>
                  {!!c.audio_hint && <p className="text-slate-400 font-nunito text-sm italic">"{String(c.audio_hint)}"</p>}
                  {listenControls}
                  {listenDone && <p className="text-slate-500 text-xs font-nunito">Auto-advancing in 3 seconds…</p>}
                </div>
              )

              // ── Plain text / concept explanation ─────────────────────────
              const badge = colonIdx >= 0 ? fullPrompt.slice(0, colonIdx).trim() : 'Listen'
              return (
                <div className="w-full flex flex-col items-center gap-5">
                  <div className="flex items-center gap-2 bg-blue-500/15 border border-blue-500/25 rounded-full px-4 py-2">
                    <Volume2 size={15} className="text-blue-400" />
                    <span className="text-blue-300 font-bold font-nunito text-xs uppercase tracking-widest">{badge}</span>
                  </div>
                  <div className="bg-[#252b3b] rounded-3xl p-8 text-center w-full border border-white/5">
                    <p className="text-2xl sm:text-3xl font-bold text-white font-nunito leading-snug">{contentPart}</p>
                    {!!c.audio_hint && <p className="text-slate-400 font-nunito text-sm mt-4 italic">"{String(c.audio_hint)}"</p>}
                  </div>
                  {listenControls}
                  {listenDone && <p className="text-slate-500 text-xs font-nunito">Auto-advancing in 3 seconds…</p>}
                </div>
              )
            })()}

            {act.type === 'speak' && (() => {
              const c = act.content as unknown as Record<string, unknown>
              return (
                <>
                <div className="bg-[#252b3b] rounded-3xl p-8 text-center w-full border border-white/5">
                  <div className="text-4xl sm:text-6xl font-extrabold text-white font-nunito">
                    {String(c.prompt ?? '')}
                  </div>
                </div>
                {answerState === 'idle' && (
                  <MicrophonePanel
                    expected={String((act.content as unknown as Record<string, unknown>).expected ?? '')}
                    onResult={handleSpeechResult}
                    onSkip={() => {
                      // Award half XP and continue when voice isn't available
                      const xp = Math.floor(getXP(currentActivity) * 0.5)
                      setTotalXP(t => t + xp)
                      addXP(xp)
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
                  <div className="text-white font-bold text-xl font-nunito text-center w-full">
                    {String(tapContent.question ?? '')}
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
                          className={`p-5 rounded-2xl border-2 text-white font-bold font-nunito text-lg transition-all min-h-[80px] ${
                            showResult && opt.correct ? 'border-[#4ade80] bg-[#4ade80]/20'
                            : showResult && !opt.correct ? 'border-red-500 bg-red-500/20'
                            : 'border-white/20 bg-[#252b3b] hover:border-white/40'
                          }`}
                        >
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
                <div className="text-white font-bold text-xl font-nunito text-center w-full">
                  {(act.content as TypeAnswerContent).question}
                </div>
                <input
                  type="text"
                  value={typedAnswer}
                  onChange={e => setTypedAnswer(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTypeSubmit()}
                  disabled={answerState !== 'idle'}
                  placeholder="Type your answer..."
                  className="w-full bg-[#252b3b] border-2 border-white/20 focus:border-[#4ade80] rounded-2xl px-5 py-4 text-white font-nunito text-xl outline-none transition-all"
                  autoFocus
                />
                {answerState === 'idle' && (
                  <Button fullWidth size="lg" onClick={handleTypeSubmit} disabled={!typedAnswer.trim()}>
                    Check Answer
                  </Button>
                )}
              </>
            )}

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
                    <div className={`font-extrabold font-nunito text-lg ${answerState === 'correct' ? 'text-[#4ade80]' : 'text-red-400'}`}>
                      {answerState === 'correct' ? 'Correct!' : 'Not quite!'}
                    </div>
                    {answerState === 'wrong' && (
                      <div className="text-slate-300 text-sm font-nunito mt-1">
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
