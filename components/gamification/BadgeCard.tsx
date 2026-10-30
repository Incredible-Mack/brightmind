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
  trophy: <Trophy size={30} />,
  star: <Star size={30} />,
  flame: <Flame size={30} />,
  zap: <Zap size={30} />,
  book: <BookOpen size={30} />,
  mic: <Mic size={30} />,
  check: <CheckCircle size={30} />,
}

export function BadgeCard({ achievement }: { achievement: Achievement }) {
  const { title, description, icon, xp_bonus, unlocked } = achievement
  return (
    <motion.div
      whileHover={unlocked ? { scale: 1.05, y: -4 } : { scale: 1.01 }}
      className={`rounded-3xl p-6 border-2 flex flex-col items-center text-center gap-3 transition-all duration-300 ${
        unlocked
          ? 'bg-[#fef9c3] border-[#eab308] border-b-[6px] border-b-[#ca8a04] shadow-sm hover:shadow-xl'
          : 'bg-white border-slate-200 border-b-[5px] border-b-slate-300 opacity-60 grayscale'
      }`}
    >
      <div
        className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-md transition-transform ${
          unlocked
            ? 'bg-[#eab308] text-white shadow-amber-600/30'
            : 'bg-slate-200 text-slate-500'
        }`}
      >
        {unlocked ? (iconMap[icon] ?? <Trophy size={30} />) : <Lock size={26} />}
      </div>
      
      <div>
        <h3 className={`font-black text-base font-nunito tracking-tight mb-1 ${unlocked ? 'text-[#713f12]' : 'text-slate-700'}`}>
          {title}
        </h3>
        <p className={`font-bold text-xs font-nunito leading-relaxed ${unlocked ? 'text-[#854d0e]' : 'text-slate-500'}`}>
          {description}
        </p>
      </div>

      {unlocked && (
        <span className="bg-[#eab308] text-white font-black text-xs px-3 py-1 rounded-full shadow-sm mt-auto">
          +{xp_bonus} XP
        </span>
      )}
    </motion.div>
  )
}
