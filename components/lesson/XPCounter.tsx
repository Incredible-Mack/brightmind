'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { Star } from 'lucide-react'

interface XPCounterProps { earned: number; visible: boolean }

export function XPCounter({ earned, visible }: XPCounterProps) {
  return (
    <AnimatePresence>
      {visible && earned > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10 }}
          className="inline-flex items-center gap-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-full px-4 py-2"
        >
          <Star size={16} className="text-yellow-400" fill="#eab308" />
          <span className="text-yellow-400 font-extrabold font-nunito">+{earned} XP</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
