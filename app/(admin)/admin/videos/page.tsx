'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Film, Trash2, Play, Plus, Check } from 'lucide-react'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/Spinner'
import type { Video } from '@/types/video'
import type { AgeGroup } from '@/types/child'

const AGE_OPTIONS: AgeGroup[] = ['0-5', '6-8', '9-11', '12-14']

const AGE_COLOR: Record<string, string> = {
  '0-5':   'bg-green-500/20 text-green-400',
  '6-8':   'bg-blue-500/20 text-blue-300',
  '9-11':  'bg-yellow-500/20 text-yellow-300',
  '12-14': 'bg-purple-500/20 text-purple-300',
}

export default function AdminVideosPage() {
  const videoRef  = useRef<HTMLInputElement>(null)
  const [videos,    setVideos]    = useState<Video[]>([])
  const [loading,   setLoading]   = useState(true)
  const [title,     setTitle]     = useState('')
  const [desc,      setDesc]      = useState('')
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>(['6-8'])
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [success,   setSuccess]   = useState('')
  const [error,     setError]     = useState('')

  useEffect(() => {
    api.videos.list()
      .then(data => setVideos(data as unknown as Video[]))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggleAge = (ag: AgeGroup) =>
    setAgeGroups(prev => prev.includes(ag) ? prev.filter(a => a !== ag) : [...prev, ag])

  const handleUpload = async () => {
    if (!videoFile || !title.trim()) { setError('Title and video file are required'); return }
    if (ageGroups.length === 0)      { setError('Select at least one age group'); return }
    setUploading(true); setError(''); setSuccess(''); setProgress(10)

    const fd = new FormData()
    fd.append('video',      videoFile)
    fd.append('title',      title.trim())
    fd.append('description', desc.trim())
    fd.append('age_groups', JSON.stringify(ageGroups))

    setProgress(40)
    try {
      await api.videos.upload(fd)
      setProgress(100)
      setSuccess('Video uploaded successfully!')
      setTitle(''); setDesc(''); setVideoFile(null); setAgeGroups(['6-8'])
      // Refresh list
      const data = await api.videos.list()
      setVideos(data as unknown as Video[])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setUploading(false); setTimeout(() => setProgress(0), 800)
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white font-nunito">Videos</h1>
        <p className="text-slate-400 font-nunito text-xs">Upload educational videos for children — they are automatically shown to the matching age group</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload form */}
        <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-6">
          <h2 className="text-white font-nunito font-bold text-base mb-5 flex items-center gap-2">
            <Plus size={16} className="text-[#4ade80]" /> Upload New Video
          </h2>

          <div className="space-y-4">
            <div>
              <label className="field-label">Video Title *</label>
              <input className="field" placeholder="e.g. Introduction to Animals" value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            <div>
              <label className="field-label">Description</label>
              <textarea rows={2} className="field resize-none" placeholder="What will children learn?" value={desc} onChange={e => setDesc(e.target.value)} />
            </div>

            <div>
              <label className="field-label">Age Groups *</label>
              <div className="flex gap-2 flex-wrap">
                {AGE_OPTIONS.map(ag => (
                  <button key={ag} type="button" onClick={() => toggleAge(ag)}
                    className={`px-4 py-2 rounded-xl font-nunito font-bold text-sm transition-all border ${
                      ageGroups.includes(ag)
                        ? 'border-[#14b8a6] bg-[#14b8a6]/15 text-[#14b8a6]'
                        : 'border-white/10 text-slate-400 hover:border-white/30'
                    }`}
                  >
                    {ag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="field-label">Video File *</label>
              <button
                onClick={() => videoRef.current?.click()}
                className="w-full border-2 border-dashed border-white/10 hover:border-[#4ade80]/30 rounded-2xl p-6 flex flex-col items-center gap-2 transition-colors"
              >
                <Film size={28} className={videoFile ? 'text-[#4ade80]' : 'text-slate-600'} />
                <span className="font-nunito text-sm text-slate-400">
                  {videoFile ? videoFile.name : 'Click to select .mp4 / .webm / .mov'}
                </span>
                {videoFile && (
                  <span className="font-nunito text-xs text-slate-600">
                    {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                )}
              </button>
              <input ref={videoRef} type="file" accept=".mp4,.webm,.mov,video/*" className="hidden"
                onChange={e => setVideoFile(e.target.files?.[0] ?? null)} />
            </div>

            {uploading && progress > 0 && (
              <div>
                <div className="flex justify-between text-xs text-slate-500 font-nunito mb-1">
                  <span>Uploading…</span><span>{progress}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div className="h-2 bg-[#4ade80] rounded-full" animate={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {error   && <p className="text-red-400 font-nunito text-sm">{error}</p>}
            {success && (
              <p className="text-green-400 font-nunito text-sm flex items-center gap-1.5">
                <Check size={14} /> {success}
              </p>
            )}

            <button
              onClick={handleUpload} disabled={uploading}
              className="w-full flex items-center justify-center gap-2 bg-[#4ade80] hover:bg-[#22c55e] disabled:opacity-50 text-[#0f1117] font-extrabold font-nunito text-sm py-3 rounded-xl transition-colors"
            >
              {uploading ? <Spinner size={16} /> : <Upload size={16} />}
              {uploading ? 'Uploading…' : 'Upload Video'}
            </button>
          </div>
        </div>

        {/* Video list */}
        <div>
          <h2 className="text-white font-nunito font-bold text-base mb-4">
            Uploaded Videos <span className="text-slate-500 font-normal">({videos.length})</span>
          </h2>

          {loading ? (
            <div className="flex justify-center py-10"><Spinner size={28} /></div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12 text-slate-600 font-nunito text-sm">
              No videos uploaded yet.
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              <AnimatePresence>
                {videos.map(v => (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-4 flex items-start gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#252b3b] flex items-center justify-center flex-shrink-0">
                      <Play size={16} className="text-[#14b8a6]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-nunito font-semibold text-sm truncate">{v.title}</p>
                      {v.description && (
                        <p className="text-slate-500 font-nunito text-xs mt-0.5 truncate">{v.description}</p>
                      )}
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {(v.age_groups ?? []).map(ag => (
                          <span key={ag} className={`font-nunito font-bold text-xs px-2 py-0.5 rounded-full ${AGE_COLOR[ag] ?? ''}`}>{ag}</span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
