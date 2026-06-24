'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { VideoCard } from '@/components/video/VideoCard'
import type { Video } from '@/types/video'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Spinner } from '@/components/ui/Spinner'
import { useAppStore } from '@/store/useAppStore'
import type { AgeGroup } from '@/types/child'
import { PlayCircle } from 'lucide-react'

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

  const ageGroup = getAgeGroup(child?.age ?? 7)

  useEffect(() => {
    api.videos.list()
      .then(data => setVideos(data as unknown as Video[]))
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false))
  }, [])

  // Always show videos for the child's age group (set during onboarding / changeable in profile)
  const filtered = videos.filter(v =>
    !v.age_groups?.length || v.age_groups.includes(ageGroup)
  )

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size={40} />
    </div>
  )

  return (
    <PageWrapper>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white font-nunito">Videos</h1>
          <p className="text-slate-400 font-nunito text-sm mt-0.5">
            Showing videos for ages <span className="text-[#14b8a6] font-bold">{ageGroup}</span>
          </p>
        </div>
      </div>

      {fetchError ? (
        <div className="flex flex-col items-center justify-center py-20 gap-5">
          <div className="w-20 h-20 rounded-full bg-[#252b3b] border border-white/5 flex items-center justify-center">
            <PlayCircle size={36} className="text-slate-600" />
          </div>
          <div className="text-center">
            <p className="text-white font-nunito font-bold text-lg mb-1">Couldn&apos;t load videos</p>
            <p className="text-slate-500 font-nunito text-sm">
              Check your connection and try refreshing the page.
            </p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-5">
          <div className="w-20 h-20 rounded-full bg-[#252b3b] border border-white/5 flex items-center justify-center">
            <PlayCircle size={36} className="text-slate-600" />
          </div>
          <div className="text-center">
            <p className="text-white font-nunito font-bold text-lg mb-1">No videos yet</p>
            <p className="text-slate-500 font-nunito text-sm">
              New videos for your age group will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v, i) => <VideoCard key={v.id} video={v} index={i} />)}
        </div>
      )}
    </PageWrapper>
  )
}
