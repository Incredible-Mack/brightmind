'use client'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { PlayCircle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { Video } from '@/types/video'

interface VideoCardProps { video: Video; index?: number }

function formatDuration(secs: number | null) {
  if (!secs) return null
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function VideoCard({ video, index = 0 }: VideoCardProps) {
  const duration = formatDuration(video.duration)
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link href={`/videos/${video.id}`}>
        <div className="bg-[#252b3b] rounded-2xl border border-white/5 hover:border-white/20 overflow-hidden group transition-all hover:-translate-y-0.5">
          <div className="relative aspect-video bg-[#1a1f2e]">
            {video.thumbnail_url ? (
              <Image
                src={video.thumbnail_url}
                alt={video.title}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <PlayCircle size={48} className="text-slate-600" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-[#4ade80]/90 flex items-center justify-center">
                <PlayCircle size={32} className="text-[#1a1f2e]" />
              </div>
            </div>
            {duration && (
              <div className="absolute bottom-2 right-2 bg-black/70 rounded-lg px-2 py-0.5 flex items-center gap-1">
                <Clock size={10} className="text-white" />
                <span className="text-white text-xs font-nunito">{duration}</span>
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="text-white font-bold text-sm font-nunito line-clamp-2 group-hover:text-[#4ade80] transition-colors">
              {video.title}
            </h3>
            {video.age_groups?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {video.age_groups.map(ag => (
                  <Badge key={ag} color="teal" size="sm">Ages {ag}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
