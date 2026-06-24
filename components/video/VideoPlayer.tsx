'use client'
import { useRef, useState, useEffect } from 'react'
import { ChapterList } from './ChapterList'
import { Pip } from '@/components/mascot/Pip'
import { SpeechBubble } from '@/components/mascot/SpeechBubble'
import { Spinner } from '@/components/ui/Spinner'
import type { Video, ChapterMarker } from '@/types/video'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost/brightmind-api'

interface VideoPlayerProps {
  video: Video
  pipComment?: string | null
  onEnded?: () => void
  autoPlay?: boolean
}

export function VideoPlayer({ video, pipComment, onEnded, autoPlay = false }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [currentTime, setCurrentTime] = useState(0)

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime)
  }

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      videoRef.current.play()
    }
  }

  // Resolve video URL — local PHP uploads are relative paths
  const resolveUrl = (url: string) =>
    url.startsWith('/') ? `${API_BASE}${url}` : url

  const chapters: ChapterMarker[] = video.chapter_markers ?? []
  const activeChapter = chapters.reduce<ChapterMarker | null>((acc, ch) => {
    return ch.time <= currentTime ? ch : acc
  }, null)

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full">
      <div className="flex-1">
        <div className="relative">
          {pipComment && (
            <div className="absolute top-3 left-3 z-10 flex items-end gap-2">
              <Pip size="sm" mood="happy" animate="idle" />
              <SpeechBubble text={pipComment} />
            </div>
          )}

          {video.source_type === 'mux' && (video as any).mux_playback_id && (
            <MuxPlayerWrapper playbackId={(video as any).mux_playback_id} onEnded={onEnded} autoPlay={autoPlay} />
          )}

          {video.source_type === 'cloudflare' && (video as any).cf_video_id && (
            <iframe
              src={`https://iframe.cloudflarestream.com/${(video as any).cf_video_id}`}
              className="w-full aspect-video rounded-2xl bg-black"
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          )}

          {(video.source_type === 'local' || video.source_type === 'external_url') && video.video_url && (
            <video
              ref={videoRef}
              src={resolveUrl(video.video_url)}
              className="w-full aspect-video rounded-2xl bg-black"
              controls
              autoPlay={autoPlay}
              onTimeUpdate={handleTimeUpdate}
              onEnded={onEnded}
            />
          )}

          {!video.video_url && (
            <div className="aspect-video bg-[#252b3b] rounded-2xl flex flex-col items-center justify-center gap-3 border border-white/10">
              <div className="text-slate-500 text-sm font-nunito">Video not available</div>
            </div>
          )}
        </div>

        <h2 className="text-white font-bold text-lg font-nunito mt-4">{video.title}</h2>
        {activeChapter && (
          <p className="text-[#4ade80] text-sm font-nunito mt-1">Now: {activeChapter.title}</p>
        )}
      </div>

      {chapters.length > 0 && (
        <div className="lg:w-64 flex-shrink-0">
          <ChapterList chapters={chapters} currentTime={currentTime} onSeek={seekTo} />
        </div>
      )}
    </div>
  )
}

function MuxPlayerWrapper({ playbackId, onEnded, autoPlay }: { playbackId: string; onEnded?: () => void; autoPlay?: boolean }) {
  const [MuxPlayer, setMuxPlayer] = useState<React.ComponentType<Record<string, unknown>> | null>(null)
  useEffect(() => {
    import('@mux/mux-player-react').then(m => setMuxPlayer(() => m.default as React.ComponentType<Record<string, unknown>>))
  }, [])
  if (!MuxPlayer) return <div className="aspect-video bg-black rounded-2xl"><Spinner size={32} /></div>
  return (
    <MuxPlayer
      playbackId={playbackId}
      className="w-full aspect-video rounded-2xl"
      autoPlay={autoPlay}
      onEnded={onEnded}
    />
  )
}
