'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { Spinner } from '@/components/ui/Spinner'

interface SpeechBubbleProps {
  text: string | null
  loading?: boolean
  position?: 'right' | 'left' | 'top'
  className?: string
}

export function SpeechBubble({ text, loading = false, position = 'right', className = '' }: SpeechBubbleProps) {
  return (
    <AnimatePresence>
      {(text || loading) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: position === 'right' ? -10 : 10 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className={`relative bg-white rounded-3xl px-5 py-3 shadow-xl max-w-[280px] sm:max-w-sm ${className}`}
        >
          {/* Tail */}
          <div
            className={`absolute bottom-3 ${position === 'right' ? '-left-3' : '-right-3'} w-4 h-4`}
          >
            <svg viewBox="0 0 16 16" className={`w-4 h-4 ${position === 'right' ? '' : 'scale-x-[-1]'}`}>
              <path d="M16 0 L0 8 L16 16 Z" fill="white" />
            </svg>
          </div>
          {loading ? (
            <div className="flex items-center gap-2">
              <Spinner size={16} color="#22c55e" />
              <span className="text-slate-500 text-sm font-nunito">Thinking...</span>
            </div>
          ) : (
            <p className="text-[#1a1f2e] text-sm font-nunito font-semibold leading-snug">{text}</p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
