'use client'
import { motion } from 'framer-motion'
import { Star, Trophy } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'

interface LeaderboardEntry {
  id: string
  name: string
  avatar_seed: string
  xp: number
  level: number
  levelName: string
}

interface LeaderboardProps { entries: LeaderboardEntry[]; currentChildId?: string }

const medals = ['#eab308', '#94a3b8', '#cd7f32']

export function Leaderboard({ entries, currentChildId }: LeaderboardProps) {
  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry, i) => {
        const isSelf = entry.id === currentChildId
        const medal = medals[i]
        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex items-center gap-3 p-3 rounded-xl border ${isSelf ? 'bg-[#4ade80]/10 border-[#4ade80]/30' : 'bg-[#252b3b] border-white/5'}`}
          >
            <div className="w-7 text-center">
              {medal
                ? <Trophy size={16} style={{ color: medal }} />
                : <span className="text-slate-500 text-sm font-nunito font-bold">{i + 1}</span>
              }
            </div>
            <Avatar seed={entry.avatar_seed} name={entry.name} size={36} />
            <div className="flex-1">
              <div className={`font-bold text-sm font-nunito ${isSelf ? 'text-[#4ade80]' : 'text-white'}`}>{entry.name}</div>
              <div className="text-slate-400 text-xs font-nunito">Level {entry.level} · {entry.levelName}</div>
            </div>
            <div className="flex items-center gap-1 text-yellow-400">
              <Star size={14} fill="#eab308" />
              <span className="font-bold text-sm font-nunito">{entry.xp.toLocaleString()}</span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
