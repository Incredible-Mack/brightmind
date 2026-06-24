'use client'
import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, MicOff as MicOffIcon, SkipForward } from 'lucide-react'
import { useVoiceStudent } from '@/hooks/useVoiceStudent'
import { Button } from '@/components/ui/Button'
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
  if (r.includes('network') || r.includes('service')) {
    return "Voice service is offline. Check your internet connection."
  }
  return "Oops! Something went wrong with the microphone."
}

interface MicrophonePanelProps {
  expected: string
  onResult: (transcript: string, score: number, passed: boolean) => void
  onSkip?: () => void
  subject?: string
  ageGroup?: string
  childName?: string
  disabled?: boolean
  autoStart?: boolean
}

export function MicrophonePanel({
  expected, onResult, onSkip,
  subject = 'general', ageGroup = '6-8', childName = 'friend',
  disabled = false, autoStart = false,
}: MicrophonePanelProps) {
  const { state, transcript, interimTranscript, error, startListening, stopListening, reset } = useVoiceStudent()
  const autoStartedRef = useRef(false)

  // Reset the auto-start gate when autoStart flips off→on (new activity)
  useEffect(() => {
    if (!autoStart) autoStartedRef.current = false
  }, [autoStart])

  // Auto-start the mic after Pip finishes speaking
  useEffect(() => {
    if (!autoStart || autoStartedRef.current || state !== 'idle') return
    autoStartedRef.current = true
    const timer = setTimeout(() => startListening(), 600)
    return () => clearTimeout(timer)
  }, [autoStart, state, startListening])

  useEffect(() => {
    if (state !== 'done' || !transcript) return
    const grade = async () => {
      const res = await fetch('/api/teacher/grade-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expected, transcript, subject, ageGroup, childName }),
      })
      const { score, passed } = await res.json()
      onResult(transcript, score, passed)
    }
    grade()
  }, [state, transcript, expected, onResult, subject, ageGroup, childName])

  const displayText = transcript || interimTranscript
  const msg = friendlyError(error)

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.94 }}
              disabled={disabled}
              onClick={startListening}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#22c55e] hover:bg-[#16a34a] flex items-center justify-center shadow-lg shadow-green-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mic size={36} className="text-white" />
            </motion.button>
            <p className="text-slate-400 font-nunito text-sm">Tap to speak your answer</p>
          </motion.div>
        )}

        {state === 'loading' && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#252b3b] border-2 border-[#4ade80]/30 flex items-center justify-center">
              <Spinner size={32} color="#4ade80" />
            </div>
            <p className="text-slate-400 font-nunito text-sm">Getting mic ready…</p>
          </motion.div>
        )}

        {state === 'listening' && (
          <motion.div key="listening" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 w-full">
            <motion.button
              animate={{ boxShadow: ['0 0 0 0 rgba(239,68,68,0.4)', '0 0 0 18px rgba(239,68,68,0)', '0 0 0 0 rgba(239,68,68,0)'] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              onClick={stopListening}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#ef4444] flex items-center justify-center shadow-lg"
            >
              <MicOff size={36} className="text-white" />
            </motion.button>
            <div className="w-full bg-[#252b3b] rounded-2xl p-4 border border-white/10 min-h-[60px] flex items-center">
              <p className="text-white font-nunito font-semibold text-center w-full">
                {displayText || <span className="text-slate-500 italic">Listening…</span>}
              </p>
            </div>
            <p className="text-slate-400 font-nunito text-sm">Tap the mic when you're done</p>
          </motion.div>
        )}

        {state === 'processing' && (
          <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#252b3b] border-2 border-blue-500/30 flex items-center justify-center">
              <Spinner size={32} color="#3b82f6" />
            </div>
            <p className="text-slate-400 font-nunito text-sm">Checking your answer…</p>
          </motion.div>
        )}

        {state === 'done' && transcript && (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 w-full">
            <div className="w-full bg-[#252b3b] rounded-2xl p-4 border border-[#4ade80]/30">
              <p className="text-white font-nunito font-semibold text-center">&ldquo;{transcript}&rdquo;</p>
            </div>
            <Button variant="ghost" size="sm" onClick={reset}>Try again</Button>
          </motion.div>
        )}

        {/* Voice unavailable — friendly error with skip option */}
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-[#252b3b] border border-yellow-500/20 rounded-2xl p-5 flex flex-col items-center gap-4"
          >
            <div className="w-14 h-14 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <MicOffIcon size={26} className="text-yellow-400" />
            </div>
            <div className="text-center">
              <p className="text-yellow-300 font-nunito font-bold text-sm mb-1">Voice not available</p>
              <p className="text-slate-400 font-nunito text-xs leading-relaxed">{msg}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="px-4 py-2 rounded-xl border border-white/15 text-slate-300 font-nunito font-semibold text-sm hover:bg-white/5 transition-colors"
              >
                Try Again
              </button>
              {onSkip && (
                <button
                  onClick={onSkip}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/15 border border-yellow-500/25 text-yellow-300 font-nunito font-semibold text-sm hover:bg-yellow-500/25 transition-colors"
                >
                  <SkipForward size={14} /> Skip
                </button>
              )}
            </div>
            {!onSkip && (
              <p className="text-slate-600 font-nunito text-xs">Try opening in Google Chrome for voice support.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
