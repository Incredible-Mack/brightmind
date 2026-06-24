'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { api } from '@/lib/api'
import { VideoPlayer } from '@/components/video/VideoPlayer'
import type { Video } from '@/types/video'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'

export default function VideoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [video, setVideo] = useState<Video | null>(null as Video | null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.videos.get(Number(id)).then(data => {
      setVideo(data as unknown as Video)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size={40} /></div>
  if (!video) return <div className="text-center py-16 text-slate-400">Video not found.</div>

  return (
    <PageWrapper>
      <Link href="/videos" className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 font-nunito text-sm">
        <ArrowLeft size={16} /> Back to Videos
      </Link>
      <VideoPlayer
        video={video}
        pipComment="Watch carefully — there will be questions!"
      />
      <div className="mt-4 flex flex-wrap gap-2">
        {video.age_groups?.map(ag => (
          <Badge key={ag} color="teal">Ages {ag}</Badge>
        ))}
      </div>
    </PageWrapper>
  )
}
