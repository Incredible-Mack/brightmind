'use client'
import { motion } from 'framer-motion'
import { Lock, Trophy, Star, Flame, Zap, BookOpen, Mic, CheckCircle } from 'lucide-react'

export interface Achievement {
  id: string
  slug: string
  title: string
  description: string
  icon: string
  xp_bonus: number
  unlocked?: boolean
  unlocked_at?: string
}

const iconMap: Record<string, React.ReactNode> = {
  trophy: <Trophy size={28} />, star: <Star size={28} />, flame: <Flame size={28} />,
  zap: <Zap size={28} />, book: <BookOpen size={28} />, mic: <Mic size={28} />,
  check: <CheckCircle size={28} />,
}

export function BadgeCard({ achievement }: { achievement: Achievement }) {
  const { title, description, icon, xp_bonus, unlocked } = achievement
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className={`bg-[#252b3b] rounded-2xl p-5 border flex flex-col items-center text-center gap-2 transition-all ${
        unlocked ? 'border-yellow-500/30' : 'border-white/5 opacity-60 grayscale'
      }`}
    >
      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${unlocked ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-slate-600'}`}>
        {unlocked ? (iconMap[icon] ?? <Trophy size={28} />) : <Lock size={28} />}
      </div>
      <div className="text-white font-bold text-sm font-nunito">{title}</div>
      <div className="text-slate-400 text-xs font-nunito">{description}</div>
      {unlocked && (
        <div className="text-yellow-400 text-xs font-bold font-nunito">+{xp_bonus} XP</div>
      )}
    </motion.div>
  )
}
