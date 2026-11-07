'use client'
import { useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, MicOff as MicOffIcon, SkipForward } from 'lucide-react'
import { useVoiceStudent } from '@/hooks/useVoiceStudent'
import { useSpeechSupport } from '@/hooks/useSpeechSupport'
import { Button } from '@/components/ui/Button'
import { fallbackGradeSpeech } from '@/lib/fallbackTeacher'
import { gradeSingleLetter } from '@/lib/phonics'
import { Spinner } from '@/components/ui/Spinner'

// Map technical errors to child-friendly messages
function friendlyError(raw: string | null): string {
  if (!raw) return ''
  const r = raw.toLowerCase()
  if (r.includes('whisper') || r.includes('configured') || r.includes('openai')) {
    return "Voice isn't available on this device right now."
  }
  if (r.includes('permission') || r.includes('not-allowed') || r.includes('denied')) {
    return "Microphone access was blocked. Please allow mic access and try again."
  }
  if (r.includes('no-speech')) {
    return "I didn't hear anything. Tap the mic and try again."
  }
  if (r.includes('network') || r.includes('service')) {
    return "Voice service is offline. Check your internet connection."
  }
  return "Oops! Something went wrong with the microphone."
}

interface MicrophonePanelProps {
  expected: string
  onResult: (transcript: string, score: number, passed: boolean, feedback?: string) => void
  /** Optional free, local grader (e.g. letter sounds). When set, no network call is made. */
  localGrade?: (transcript: string) => { passed: boolean; score: number; feedback?: string }
  onSkip?: () => void
  subject?: string
  ageGroup?: string
  childName?: string
  disabled?: boolean
  autoStart?: boolean
}

export function MicrophonePanel({
  expected, onResult, onSkip, localGrade,
  subject = 'general', ageGroup = '6-8', childName = 'friend',
  disabled = false, autoStart = false,
}: MicrophonePanelProps) {
  const { state, transcript, interimTranscript, error, startListening: start, stopListening, reset, modelProgress, level, capture } = useVoiceStudent()
  // Sentences need more time and more patience with pauses than single words
  const words = expected.trim().split(/\s+/).filter(Boolean).length
  const listenOpts = words > 5
    ? { long: true, maxMs: Math.min(22000, 4000 + words * 900) }
    : { long: false, maxMs: 9000 }
  // Stable identity: the auto-start effect below must not be reset by every render
  const optsRef = useRef(listenOpts)
  optsRef.current = listenOpts
  const startListening = useCallback(() => start(optsRef.current), [start])
  const autoStartedRef = useRef(false)
  const support = useSpeechSupport()
  const noVoice = !support.sttSupported && !support.sttFallback && support.ttsSupported

  // Reset the auto-start gate when autoStart flips off→on (new activity)
  useEffect(() => {
    if (!autoStart) autoStartedRef.current = false
  }, [autoStart])

  // Auto-start the mic after Pip finishes speaking
  useEffect(() => {
    if (!autoStart || autoStartedRef.current || state !== 'idle') return
    autoStartedRef.current = true
    const timer = setTimeout(() => startListening(), 80)
    return () => clearTimeout(timer)
  }, [autoStart, state, startListening])

  // Keep the latest callback without making the grading effect re-run on every parent render
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult
  const gradedRef = useRef<string | null>(null)

  useEffect(() => {
    if (state === 'listening' || state === 'idle') gradedRef.current = null
  }, [state, expected])
  useEffect(() => {
    gradedRef.current = null
  }, [state])

  useEffect(() => {
    if (state !== 'done' || !transcript || gradedRef.current === transcript) return
    gradedRef.current = transcript
    let cancelled = false

    const grade = async () => {
      // 1. Free local check first
      const local = localGrade
        ? localGrade(transcript)
        : gradeSingleLetter(transcript, expected) ?? (() => {
            const r = fallbackGradeSpeech({ expected, transcript, childName })
            return { passed: r.passed, score: r.score, feedback: r.feedback }
          })()
      const clear = localGrade || local.passed || local.score < 30 || !!gradeSingleLetter(transcript, expected)
      if (clear) { if (!cancelled) onResultRef.current(transcript, local.score, local.passed, (local as { feedback?: string }).feedback); return }

      // 2. Only borderline answers are worth an AI call
      try {
        const res = await fetch('/api/teacher/grade-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expected, transcript, subject, ageGroup, childName }),
        })
        const { score, passed, feedback } = await res.json()
        if (!cancelled) onResultRef.current(transcript, score, passed, feedback)
      } catch {
        if (!cancelled) onResultRef.current(transcript, local.score, local.passed, (local as { feedback?: string }).feedback)
      }
    }
    grade()
    return () => { cancelled = true }
  }, [state, transcript, expected, localGrade, subject, ageGroup, childName])

  const displayText = (transcript || interimTranscript).trim()

  // INSTANT SPEECH EVALUATION: Grade as soon as the child speaks
  // Don't wait for silence timeouts or force repetitions
  useEffect(() => {
    if (state !== 'listening' || !displayText || gradedRef.current) return

    const local = localGrade
      ? localGrade(displayText)
      : gradeSingleLetter(displayText, expected) ?? (() => {
          const r = fallbackGradeSpeech({ expected, transcript: displayText, childName })
          return { passed: r.passed, score: r.score, feedback: r.feedback }
        })()

    if (local.passed) {
      gradedRef.current = displayText
      stopListening()
      onResultRef.current(displayText, local.score, true, (local as { feedback?: string }).feedback)
    }
  }, [state, displayText, expected, localGrade, childName, stopListening])
  const msg = friendlyError(error)

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.94 }}
              disabled={disabled}
              onClick={startListening}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#22c55e] hover:bg-[#16a34a] flex items-center justify-center shadow-lg shadow-green-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mic size={26} className="text-white" />
            </motion.button>
            <p className="text-slate-300 font-bold font-nunito text-xs sm:text-sm">Tap to speak your answer</p>
            {noVoice && <p className="text-yellow-300/80 font-nunito text-xs text-center">Voice listening isn&apos;t supported in this browser. Try Google Chrome, or tap Skip.</p>}
            {noVoice && onSkip && <Button variant="ghost" size="sm" onClick={onSkip}>Skip</Button>}
          </motion.div>
        )}

        {state === 'loading' && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#18252d] border-2 border-[#4ade80]/30 flex items-center justify-center">
              <Spinner size={26} color="#4ade80" />
            </div>
            <p className="text-slate-300 font-bold font-nunito text-xs sm:text-sm">Getting mic ready…</p>
          </motion.div>
        )}

        {state === 'listening' && (
          <motion.div key="listening" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2 sm:gap-2.5 w-full">
            <motion.button
              animate={{ boxShadow: ['0 0 0 0 rgba(239,68,68,0.4)', '0 0 0 14px rgba(239,68,68,0)', '0 0 0 0 rgba(239,68,68,0)'] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              onClick={stopListening}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#ef4444] flex items-center justify-center shadow-lg"
            >
              <MicOff size={26} className="text-white" />
            </motion.button>
            <div className={`w-full bg-white rounded-2xl p-2.5 sm:p-3 border-2 min-h-[44px] flex items-center justify-center transition-colors ${displayText ? 'border-emerald-500 shadow-md shadow-emerald-500/10' : 'border-slate-200 shadow-xs'}`}>
              <p className="text-slate-800 font-nunito font-black text-center text-xs sm:text-sm w-full">
                {displayText ? (
                  <span className="text-emerald-600">&ldquo;{displayText}&rdquo;</span>
                ) : (
                  <span className="text-slate-400 italic flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    Pip is listening… Say it now!
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1.5 h-3.5">
              {[0.4, 0.8, 1.0, 0.6, 0.9, 0.5, 0.7].map((h, i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: displayText ? [4, 14 * h, 4] : [3, 10 * h, 3],
                    backgroundColor: displayText ? '#059669' : '#10b981',
                  }}
                  transition={{ duration: 0.35 + i * 0.07, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-1 rounded-full"
                />
              ))}
            </div>
            <p className="text-slate-500 font-bold font-nunito text-[11px] sm:text-xs text-center">{displayText ? "Checking what you said…" : "Speak clearly into the microphone"}</p>
          </motion.div>
        )}

        {state === 'processing' && (
          <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-sky-50 border-2 border-sky-300 flex items-center justify-center">
              <Spinner size={26} color="#0284c7" />
            </div>
            <p className="text-slate-600 font-bold font-nunito text-xs sm:text-sm">{modelProgress != null ? `Getting my ears ready… ${modelProgress}% (only the first time)` : 'Checking your answer…'}</p>
          </motion.div>
        )}

        {state === 'done' && transcript && (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 w-full">
            <div className="w-full bg-white rounded-2xl p-4 border-2 border-emerald-300 shadow-sm">
              <p className="text-slate-800 font-nunito font-black text-center">&ldquo;{transcript}&rdquo;</p>
            </div>
            <Button variant="ghost" size="sm" onClick={reset}>Try again</Button>
          </motion.div>
        )}

        {state === 'done' && !transcript && !error && (
          <motion.div key="nospeech" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 w-full">
            <p className="text-amber-800 font-nunito font-bold text-center">
              {capture && capture.peak < 0.01
                ? "I can't hear your microphone. Check that it is on, not muted, and the right one."
                : capture?.heardSpeech
                ? "I heard you but couldn't make out the words. Try again a little slower and closer to the mic."
                : "I didn't hear anything. Let's try again!"}
            </p>
            <Button size="md" onClick={() => { reset(); setTimeout(startListening, 50); }}>Tap to Speak</Button>
            {onSkip && <Button variant="ghost" size="sm" onClick={onSkip}>Skip</Button>}
          </motion.div>
        )}

        {/* Voice unavailable — friendly error with skip option */}
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 flex flex-col items-center gap-4"
          >
            <div className="w-14 h-14 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center">
              <MicOffIcon size={26} className="text-amber-600" />
            </div>
            <div className="text-center">
              <p className="text-amber-900 font-nunito font-black text-sm mb-1">Voice not available</p>
              <p className="text-amber-800/90 font-bold font-nunito text-xs leading-relaxed">{msg}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-nunito font-bold text-sm hover:bg-slate-50 transition-colors shadow-2xs"
              >
                Try Again
              </button>
              {onSkip && (
                <button
                  onClick={onSkip}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-200/60 border border-amber-300 text-amber-900 font-nunito font-bold text-sm hover:bg-amber-200 transition-colors"
                >
                  <SkipForward size={14} /> Skip
                </button>
              )}
            </div>
            {!onSkip && (
              <p className="text-slate-500 font-nunito text-xs">Try opening in Google Chrome for voice support.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
