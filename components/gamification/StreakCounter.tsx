'use client'
import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { useStreak } from '@/hooks/useStreak'

export function StreakCounter({ className = '' }: { className?: string }) {
  const { streak } = useStreak()
  return (
    <div className={`flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-2xl px-4 py-3 ${className}`}>
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Flame size={24} className="text-orange-400" fill="#f97316" />
      </motion.div>
      <div>
        <div className="text-white font-extrabold text-xl font-nunito leading-none">{streak}</div>
        <div className="text-orange-300 text-xs font-nunito">day streak</div>
      </div>
    </div>
  )
}
