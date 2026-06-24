import type { AgeGroup } from './child'

export type VideoSourceType = 'local' | 'mux' | 'cloudflare' | 'external_url'

export interface ChapterMarker {
  time: number
  title: string
}

export interface Video {
  id: string | number
  subject_id: string | number | null
  title: string
  description?: string
  source_type: VideoSourceType
  video_url: string
  mux_playback_id?: string | null
  cf_video_id?: string | null
  duration: number | null
  thumbnail_url: string | null
  age_groups: AgeGroup[]
  chapter_markers: ChapterMarker[]
  created_at?: string
}
