'use client'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Play, Clock } from 'lucide-react'
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
        <div className="bg-white rounded-3xl border-2 border-slate-200 border-b-[6px] border-b-slate-300 shadow-sm hover:shadow-xl hover:border-amber-400 hover:border-b-amber-500 overflow-hidden group transition-all hover:-translate-y-1.5 flex flex-col justify-between">
          <div className="relative aspect-video bg-[#1d2445] overflow-hidden">
            {video.thumbnail_url ? (
              <Image
                src={video.thumbnail_url.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL ?? ''}${video.thumbnail_url}` : video.thumbnail_url}
                alt={video.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-sky-400 to-indigo-500">
                <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center">
                  <Play size={28} className="text-white ml-1" fill="#ffffff" />
                </div>
              </div>
            )}
            
            {/* Hover overlay with playful bouncing play icon */}
            <div className="absolute inset-0 bg-[#0f4c5c]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs">
              <div className="w-16 h-16 rounded-full bg-white text-[#0284c7] shadow-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <Play size={28} fill="#0284c7" className="ml-1 text-[#0284c7]" />
              </div>
            </div>

            {duration && (
              <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-xs rounded-xl px-2.5 py-1 flex items-center gap-1.5 shadow-sm border border-white/20">
                <Clock size={11} className="text-[#facc15]" />
                <span className="text-white text-xs font-black font-nunito">{duration}</span>
              </div>
            )}
          </div>

          <div className="p-5 flex flex-col justify-between flex-1">
            <h3 className="text-slate-900 font-black text-base font-nunito line-clamp-2 group-hover:text-amber-600 transition-colors mb-3">
              {video.title}
            </h3>
            {video.age_groups?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                {video.age_groups.map(ag => (
                  <Badge key={ag} color="purple" size="sm">
                    Ages {ag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
