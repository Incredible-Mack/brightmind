'use client'
import { motion } from 'framer-motion'

interface ProgressBarProps {
  value: number
  max?: number
  color?: string
  height?: number
  showLabel?: boolean
  className?: string
}

export function ProgressBar({ value, max = 100, color = '#4ade80', height = 8, showLabel = false, className = '' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={`relative w-full ${className}`}>
      <div
        className="w-full rounded-full bg-white/10 overflow-hidden"
        style={{ height }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-slate-400 mt-1 block text-right">
          {value} / {max}
        </span>
      )}
    </div>
  )
}
