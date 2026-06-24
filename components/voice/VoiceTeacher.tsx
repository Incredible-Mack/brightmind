'use client'
import { useEffect } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { useVoiceTeacher } from '@/hooks/useVoiceTeacher'
import { motion } from 'framer-motion'

interface VoiceTeacherProps {
  text: string | null
  autoPlay?: boolean
  className?: string
}

export function VoiceTeacher({ text, autoPlay = false, className = '' }: VoiceTeacherProps) {
  const { speak, stop, isSpeaking } = useVoiceTeacher()

  useEffect(() => {
    if (autoPlay && text) speak(text)
    return () => { if (autoPlay) stop() }
  }, [text, autoPlay])

  if (!text) return null
  return (
    <motion.button
      onClick={() => isSpeaking ? stop() : speak(text)}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors ${className}`}
    >
      {isSpeaking ? (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          <Volume2 size={16} className="text-[#4ade80]" />
        </motion.div>
      ) : (
        <VolumeX size={16} className="text-slate-400" />
      )}
      <span className="text-slate-300 text-sm font-nunito">{isSpeaking ? 'Playing...' : 'Listen'}</span>
    </motion.button>
  )
}
