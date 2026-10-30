'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, X, Sparkles, Clock, Zap } from 'lucide-react'
import Link from 'next/link'
import { useLives } from '@/hooks/useLives'

interface HeartsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function HeartsModal({ isOpen, onClose }: HeartsModalProps) {
  const { lives, maxLives, formattedTime, refillLives, premium } = useLives()

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            className="w-full max-w-sm bg-white rounded-3xl p-6 border-4 border-white shadow-2xl text-center relative"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Icon */}
            <div className="w-16 h-16 rounded-3xl bg-rose-50 border-2 border-rose-200 mx-auto flex items-center justify-center mb-3">
              <Heart size={36} fill="#f43f5e" className="text-rose-500 animate-pulse" />
            </div>

            <h3 className="text-xl font-black font-nunito text-[#1d2445] mb-1">
              Explorer Hearts
            </h3>
            <p className="text-xs font-bold text-slate-500 font-nunito mb-4">
              Hearts give you energy to play lessons and try again!
            </p>

            {/* 5 Hearts Display */}
            <div className="flex items-center justify-center gap-2 mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              {Array.from({ length: maxLives }).map((_, i) => (
                <Heart
                  key={i}
                  size={26}
                  fill={i < lives ? '#ef4444' : '#e2e8f0'}
                  className={i < lives ? 'text-red-500' : 'text-slate-300'}
                />
              ))}
            </div>

            {/* Cooldown Timer (10 Minutes) */}
            {lives < maxLives && !premium ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-5 flex items-center justify-between text-left">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-amber-600 animate-spin" style={{ animationDuration: '6s' }} />
                  <div>
                    <p className="text-xs font-black text-amber-900 font-nunito">Next heart in:</p>
                    <p className="text-[11px] font-bold text-amber-700">10 minute cooldown</p>
                  </div>
                </div>
                <span className="text-base font-black font-mono text-amber-800 bg-white px-2.5 py-1 rounded-xl border border-amber-300">
                  {formattedTime}
                </span>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 mb-5 text-emerald-800 text-xs font-black flex items-center justify-center gap-1.5">
                <Sparkles size={14} className="text-emerald-600" />
                <span>You have full energy! (5/5)</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5">
              {lives < maxLives && (
                <button
                  onClick={() => {
                    refillLives()
                    onClose()
                  }}
                  className="w-full py-3 bg-[#10b981] hover:bg-[#059669] text-white font-black font-nunito text-sm rounded-2xl border-b-4 border-[#047857] shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:translate-y-0.5 cursor-pointer"
                >
                  <Zap size={16} fill="white" />
                  <span>Instant Heart Refill (5/5 ❤️)</span>
                </button>
              )}

              <Link href="/upgrade" onClick={onClose} className="w-full">
                <button className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black font-nunito text-xs rounded-2xl transition-colors cursor-pointer">
                  Get Unlimited Hearts with Plus ⭐
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

