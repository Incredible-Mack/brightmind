'use client'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, ChevronRight, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { XPCounter } from './XPCounter'

interface ResultScreenProps {
  passed: boolean
  feedback: string
  xpEarned: number
  attempts: number
  hint?: string | null
  onContinue: () => void
  onRetry?: () => void
}

export function ResultScreen({ passed, feedback, xpEarned, attempts, hint, onContinue, onRetry }: ResultScreenProps) {
  const canContinue = passed || attempts >= 2

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full rounded-2xl p-5 border ${
        passed ? 'bg-[#22c55e]/10 border-[#22c55e]/30' : 'bg-red-500/10 border-red-500/30'
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        {passed
          ? <CheckCircle size={24} className="text-[#4ade80] flex-shrink-0 mt-0.5" />
          : <XCircle size={24} className="text-red-400 flex-shrink-0 mt-0.5" />
        }
        <div className="flex-1">
          <p className={`font-bold font-nunito text-base ${passed ? 'text-[#4ade80]' : 'text-red-300'}`}>
            {passed ? 'Correct!' : 'Not quite!'}
          </p>
          <p className="text-slate-300 text-sm font-nunito mt-0.5">{feedback}</p>
          {hint && !passed && (
            <p className="text-yellow-300 text-sm font-nunito mt-2 italic">{hint}</p>
          )}
        </div>
        {passed && <XPCounter earned={xpEarned} visible={passed} />}
      </div>

      <div className="flex gap-2 mt-3">
        {canContinue && (
          <Button onClick={onContinue} size="md" fullWidth>
            Continue <ChevronRight size={18} />
          </Button>
        )}
        {!passed && !canContinue && onRetry && (
          <Button variant="secondary" onClick={onRetry} size="md" fullWidth>
            <RotateCcw size={16} /> Try Again
          </Button>
        )}
      </div>
    </motion.div>
  )
}
