'use client'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Pip } from '@/components/mascot/Pip'
import confetti from 'canvas-confetti'

interface LevelUpModalProps {
  open: boolean
  onClose: () => void
  level: number
  levelName: string
}

export function LevelUpModal({ open, onClose, level, levelName }: LevelUpModalProps) {
  useEffect(() => {
    if (open) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ['#4ade80','#eab308','#3b82f6','#a855f7'] })
    }
  }, [open])

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <Pip size="lg" mood="excited" animate="correct" />
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12 }}
        >
          <div className="w-24 h-24 rounded-full bg-yellow-500/20 border-4 border-yellow-500/40 flex items-center justify-center mx-auto mb-2">
            <span className="text-yellow-400 font-extrabold text-3xl font-nunito">{level}</span>
          </div>
        </motion.div>
        <div>
          <div className="text-white font-extrabold text-2xl font-nunito">Level Up!</div>
          <div className="text-[#4ade80] font-bold text-lg font-nunito">{levelName}</div>
        </div>
        <div className="flex items-center gap-2 text-yellow-400">
          <Star size={16} fill="#eab308" />
          <span className="font-nunito text-sm font-semibold">New level unlocked!</span>
          <Star size={16} fill="#eab308" />
        </div>
        <Button onClick={onClose} size="lg" fullWidth className="mt-2">Keep Learning!</Button>
      </div>
    </Modal>
  )
}
