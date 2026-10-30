'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Heart, Infinity as InfinityIcon } from 'lucide-react'
import { useLives } from '@/hooks/useLives'

export function LivesBar() {
  const { lives, maxLives, formattedTime, refillLives, premium } = useLives()
  if (premium) {
    return (
      <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1" title="Premium: unlimited hearts">
        <Heart size={18} className="text-red-500" fill="#ef4444" />
        <InfinityIcon size={16} className="text-red-300" />
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: maxLives }).map((_, i) => (
        <motion.div
          key={i}
          animate={i === lives ? { x: [0, -4, 4, -3, 3, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <Heart
            size={22}
            className={i < lives ? 'text-rose-500' : 'text-slate-300'}
            fill={i < lives ? '#f43f5e' : '#f1f5f9'}
            strokeWidth={i < lives ? 2 : 1.5}
          />
        </motion.div>
      ))}
      {lives < maxLives && (
        <span className="text-amber-700 text-xs ml-1.5 font-mono font-black" title="Next heart in">
          ({formattedTime})
        </span>
      )}
      {lives < maxLives && (
        <button
          onClick={() => refillLives()}
          className="ml-1.5 bg-rose-100 hover:bg-rose-200 border border-rose-300 text-rose-900 rounded-full px-2.5 py-0.5 text-[10px] font-nunito font-black cursor-pointer shadow-xs transition-all active:scale-95"
          title="Instant Refill"
        >
          Refill
        </button>
      )}
      {lives < maxLives && (
        <Link href="/upgrade" className="ml-1.5 text-[10px] font-nunito font-black text-purple-700 hover:underline">Plus</Link>
      )}
    </div>
  )
}
