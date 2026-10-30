'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Star, Heart, X, Gift } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useAppStore } from '@/store/useAppStore'

interface GiftRewardModalProps {
  isOpen: boolean
  onClose: () => void
}

export function GiftRewardModal({ isOpen, onClose }: GiftRewardModalProps) {
  const { child, addXP, refillLives } = useAppStore()
  const [opened, setOpened] = useState(false)
  const [claimed, setClaimed] = useState(false)

  const handleOpenGift = () => {
    if (opened) return
    setOpened(true)
    
    // Trigger festive confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4ade80', '#38bdf8', '#fbbf24', '#f472b6', '#a78bfa'],
      })
    } catch {
      // safe fallback
    }

    // Award bonus
    addXP(50)
    refillLives()
    setClaimed(true)
  }

  const handleClose = () => {
    setOpened(false)
    setClaimed(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            className="relative w-full max-w-sm bg-[#201c4d] border-2 border-amber-400/30 rounded-3xl p-6 shadow-2xl text-center overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>

            <div className="flex flex-col items-center">
              {!opened ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-300 mb-2">
                    <Sparkles size={24} />
                  </div>
                  <h3 className="text-xl font-extrabold text-white font-nunito mb-1">
                    Mystery Reward!
                  </h3>
                  <p className="text-slate-300 text-xs font-nunito mb-6 max-w-[240px]">
                    Tap the gift box to unlock your daily learning treasure!
                  </p>

                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{
                      y: [0, -8, 0],
                      rotate: [-2, 2, -2],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: 'easeInOut',
                    }}
                    onClick={handleOpenGift}
                    className="relative cursor-pointer my-4 group"
                  >
                    <div className="w-28 h-28 rounded-3xl bg-[#facc15] shadow-xl shadow-amber-500/20 flex items-center justify-center border-4 border-yellow-200">
                      <Gift size={56} className="text-white drop-shadow-md" />
                    </div>
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white text-slate-900 font-extrabold text-[11px] font-nunito px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                      TAP TO OPEN
                    </span>
                  </motion.button>
                </>
              ) : (
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className="py-2"
                >
                  <div className="text-5xl mb-3 animate-bounce">🎉</div>
                  <h3 className="text-2xl font-black text-amber-300 font-nunito mb-1">
                    Hooray, {child?.name || 'Explorer'}!
                  </h3>
                  <p className="text-slate-200 text-xs font-nunito mb-5">
                    You unlocked today&apos;s explorer mystery pack!
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-yellow-400/15 border border-yellow-400/30 rounded-2xl p-3 flex flex-col items-center">
                      <Star size={24} className="text-yellow-400 mb-1" fill="#eab308" />
                      <span className="text-yellow-300 font-extrabold text-lg font-nunito">+50 XP</span>
                      <span className="text-slate-400 text-[10px] font-nunito">Brain Power</span>
                    </div>

                    <div className="bg-red-400/15 border border-red-400/30 rounded-2xl p-3 flex flex-col items-center">
                      <Heart size={24} className="text-red-400 mb-1" fill="#ef4444" />
                      <span className="text-red-300 font-extrabold text-lg font-nunito">Full Energy</span>
                      <span className="text-slate-400 text-[10px] font-nunito">Hearts Restored</span>
                    </div>
                  </div>

                  <button
                    onClick={handleClose}
                    className="w-full py-3 bg-[#22c55e] hover:bg-[#16a34a] text-white font-black text-sm font-nunito rounded-2xl shadow-md transition-all hover:scale-105"
                  >
                    Keep Exploring!
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

