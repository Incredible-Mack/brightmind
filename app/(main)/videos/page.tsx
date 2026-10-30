'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { VideoCard } from '@/components/video/VideoCard'
import type { Video } from '@/types/video'
import { Spinner } from '@/components/ui/Spinner'
import { useAppStore } from '@/store/useAppStore'
import type { AgeGroup } from '@/types/child'
import { Play, Sparkles } from 'lucide-react'
import type { Subject } from '@/lib/api'
import { ScallopRibbon } from '@/components/home/ScallopRibbon'

function getAgeGroup(age: number): AgeGroup {
  if (age <= 5)  return '0-5'
  if (age <= 8)  return '6-8'
  if (age <= 11) return '9-11'
  return '12-14'
}

export default function VideosPage() {
  const { child } = useAppStore()
  const [videos,  setVideos]  = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [category, setCategory] = useState<number | null>(null)

  const ageGroup = getAgeGroup(child?.age ?? 7)

  useEffect(() => { api.subjects.list().then(setSubjects).catch(() => {}) }, [])

  useEffect(() => {
    api.videos.list()
      .then(data => setVideos(data as unknown as Video[]))
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false))
  }, [])

  const inAge = videos.filter(v => !v.age_groups?.length || v.age_groups.includes(ageGroup))
  const usedSubjects = subjects.filter(s => inAge.some(v => Number(v.subject_id) === Number(s.id)))
  const filtered = category == null ? inAge : inAge.filter(v => Number(v.subject_id) === category)

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] bg-[#201c4d]">
      <Spinner size={44} />
    </div>
  )

  return (
    <div className="w-full flex flex-col">
      {/* ── Top Hero Header (Matching Landing Page) ───────────────── */}
      <section className="bg-[#201c4d] text-white pt-8 pb-10 px-4 sm:px-6 relative overflow-hidden">
        {/* Soft Purple Cloud Puffs */}
        <div className="absolute top-4 left-10 w-32 h-16 bg-[#2e2968] rounded-full pointer-events-none opacity-80" />
        <div className="absolute top-2 right-14 w-40 h-20 bg-[#2e2968] rounded-full pointer-events-none opacity-75 hidden sm:block" />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-[#171439]/90 border border-white/15 rounded-full px-4 py-1.5 text-xs font-black text-purple-200 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-[#facc15] animate-pulse" />
              <span>Kids Cinema & Story Theater</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Video <span className="text-[#facc15]">Stories</span> & Songs 🎬
            </h1>
            <p className="text-purple-100 font-bold text-sm sm:text-base max-w-xl">
              Engaging, age-appropriate educational videos woven into your child&apos;s learning adventures!
            </p>
          </div>

          <div className="bg-[#171439]/90 border border-white/15 px-4 py-2 rounded-2xl text-xs font-black text-amber-300">
            Ages {ageGroup} Curated
          </div>
        </div>
      </section>

      {/* Scallop Wave Transition into Warm Canvas */}
      <ScallopRibbon topBg="#201c4d" bottomBg="#fffdf8" variant="scallop" />

      {/* Main Videos Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full space-y-6">
        
        {/* Subject Filter Pills */}
        {usedSubjects.length > 1 && (
          <div className="flex flex-wrap gap-2.5">
            {[{ id: null as number | null, name: 'All Videos' }, ...usedSubjects.map(s => ({ id: Number(s.id) as number | null, name: s.name }))].map(c => {
              const active = category === c.id
              return (
                <button
                  key={String(c.id)}
                  onClick={() => setCategory(c.id)}
                  className={`px-5 py-2 rounded-2xl font-black text-xs sm:text-sm font-nunito transition-all shadow-sm ${
                    active
                      ? 'bg-[#facc15] text-[#201c4d] shadow-md scale-105'
                      : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {c.name}
                </button>
              )
            })}
          </div>
        )}

        {fetchError ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-3xl border-2 border-slate-200 p-8">
            <div className="w-16 h-16 rounded-3xl bg-rose-100 flex items-center justify-center text-rose-500">
              <Play size={32} />
            </div>
            <div className="text-center">
              <p className="text-slate-900 font-black text-xl mb-1">Couldn&apos;t load videos</p>
              <p className="text-slate-500 font-bold text-sm">Please check your connection and refresh.</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-3xl border-2 border-slate-200 p-8">
            <Sparkles size={40} className="text-amber-400" />
            <div className="text-center">
              <p className="text-slate-900 font-black text-xl mb-1">No videos found</p>
              <p className="text-slate-500 font-bold text-sm">Check back soon for new animated stories!</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((video, i) => (
              <VideoCard key={video.id} video={video} index={i} />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
