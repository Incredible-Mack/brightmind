'use client'
import { CheckCircle, Circle } from 'lucide-react'

interface ProgressTrackerProps {
  total: number
  current: number
  completed: number[]
}

export function ProgressTracker({ total, current, completed }: ProgressTrackerProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-center">
      {Array.from({ length: total }).map((_, i) => {
        const isDone = completed.includes(i)
        const isCurrent = i === current
        return (
          <div
            key={i}
            className={`transition-all rounded-full ${
              isDone ? 'w-5 h-5 bg-[#22c55e] flex items-center justify-center'
              : isCurrent ? 'w-3 h-3 bg-[#4ade80] ring-2 ring-[#4ade80]/30'
              : 'w-2.5 h-2.5 bg-white/20'
            }`}
          >
            {isDone && <CheckCircle size={12} className="text-white" strokeWidth={3} />}
          </div>
        )
      })}
    </div>
  )
}
