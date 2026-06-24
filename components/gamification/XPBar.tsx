'use client'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { useXP } from '@/hooks/useXP'
import { ProgressBar } from '@/components/ui/ProgressBar'

export function XPBar() {
  const { xp, level, levelName, progress, nextXP, prevXP } = useXP()
  return (
    <div className="bg-[#252b3b] rounded-2xl p-4 border border-white/5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <span className="text-yellow-400 font-bold text-xs font-nunito">{level}</span>
          </div>
          <div>
            <div className="text-white font-bold text-sm font-nunito">{levelName}</div>
            <div className="text-slate-400 text-xs font-nunito">Level {level}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Star size={14} className="text-yellow-400" fill="#eab308" />
          <motion.span
            key={xp}
            initial={{ scale: 1.3, color: '#eab308' }}
            animate={{ scale: 1, color: '#ffffff' }}
            className="text-white font-bold text-sm font-nunito"
          >
            {xp.toLocaleString()} XP
          </motion.span>
        </div>
      </div>
      <ProgressBar value={progress} max={100} color="#eab308" height={6} />
      <div className="flex justify-between mt-1">
        <span className="text-slate-500 text-xs font-nunito">{prevXP} XP</span>
        <span className="text-slate-500 text-xs font-nunito">{nextXP} XP</span>
      </div>
    </div>
  )
}
