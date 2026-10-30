'use client'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { useXP } from '@/hooks/useXP'
import { ProgressBar } from '@/components/ui/ProgressBar'

export function XPBar() {
  const { xp, level, levelName, progress, nextXP, prevXP } = useXP()
  return (
    <div className="bg-white rounded-3xl p-5 border border-purple-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center shadow-xs">
            <span className="text-amber-800 font-black text-sm font-nunito">{level}</span>
          </div>
          <div>
            <div className="text-slate-900 font-black text-sm font-nunito">{levelName}</div>
            <div className="text-slate-500 font-bold text-xs font-nunito">Level {level}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
          <Star size={14} className="text-amber-500" fill="#f59e0b" />
          <motion.span
            key={xp}
            initial={{ scale: 1.2, color: '#f59e0b' }}
            animate={{ scale: 1, color: '#78350f' }}
            className="text-amber-900 font-black text-xs font-nunito"
          >
            {xp.toLocaleString()} XP
          </motion.span>
        </div>
      </div>
      <ProgressBar value={progress} max={100} color="#f59e0b" height={8} />
      <div className="flex justify-between mt-1.5">
        <span className="text-slate-400 font-bold text-[11px] font-nunito">{prevXP} XP</span>
        <span className="text-slate-400 font-bold text-[11px] font-nunito">{nextXP} XP</span>
      </div>
    </div>
  )
}
