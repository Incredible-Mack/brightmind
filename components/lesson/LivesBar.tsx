'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useLives } from '@/hooks/useLives'

export function LivesBar() {
  const { lives, maxLives, minutesUntilRefill } = useLives()
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: maxLives }).map((_, i) => (
        <motion.div
          key={i}
          animate={i === lives ? { x: [0, -4, 4, -3, 3, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <Heart
            size={20}
            className={i < lives ? 'text-red-500' : 'text-slate-700'}
            fill={i < lives ? '#ef4444' : 'transparent'}
            strokeWidth={i < lives ? 1.5 : 1}
          />
        </motion.div>
      ))}
      {lives < maxLives && minutesUntilRefill > 0 && (
        <span className="text-slate-400 text-xs ml-1 font-nunito">{minutesUntilRefill}m</span>
      )}
    </div>
  )
}
