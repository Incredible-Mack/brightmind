'use client'
import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { useStreak } from '@/hooks/useStreak'

export function StreakCounter({ className = '' }: { className?: string }) {
  const { streak } = useStreak()
  return (
    <div className={`flex items-center gap-3 bg-white border border-orange-100 shadow-sm rounded-3xl px-4 py-3 ${className}`}>
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center flex-shrink-0"
      >
        <Flame size={22} className="text-orange-500" fill="#f97316" />
      </motion.div>
      <div>
        <div className="text-slate-900 font-black text-xl font-nunito leading-none">{streak}</div>
        <div className="text-orange-600 font-extrabold text-xs font-nunito mt-0.5">day streak</div>
      </div>
    </div>
  )
}
