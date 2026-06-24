'use client'
import { motion } from 'framer-motion'
import type { ChapterMarker } from '@/types/video'

interface ChapterListProps {
  chapters: ChapterMarker[]
  currentTime: number
  onSeek: (time: number) => void
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function ChapterList({ chapters, currentTime, onSeek }: ChapterListProps) {
  const activeIndex = chapters.reduce((acc, ch, i) => ch.time <= currentTime ? i : acc, -1)

  return (
    <div className="bg-[#252b3b] rounded-2xl border border-white/5 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5">
        <h3 className="text-white font-bold text-sm font-nunito tracking-wide uppercase">Chapters</h3>
      </div>
      <div className="flex flex-col max-h-80 overflow-y-auto">
        {chapters.map((ch, i) => {
          const isActive = i === activeIndex
          return (
            <motion.button
              key={i}
              onClick={() => onSeek(ch.time)}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
              className={`flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-white/5 last:border-0 ${isActive ? 'bg-[#4ade80]/10' : ''}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-[#4ade80]' : 'bg-slate-600'}`} />
              <span className={`text-sm font-nunito flex-1 ${isActive ? 'text-[#4ade80] font-bold' : 'text-slate-300'}`}>
                {ch.title}
              </span>
              <span className="text-slate-500 text-xs font-nunito">{formatTime(ch.time)}</span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
