'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Film, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { toast } from '@/components/ui/Toast'
import type { AgeGroup } from '@/types/child'

const AGE_OPTIONS: AgeGroup[] = ['0-5', '6-8', '9-11', '12-14']

export default function VideoUploadPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const toggleAge = (ag: AgeGroup) =>
    setAgeGroups(prev => prev.includes(ag) ? prev.filter(a => a !== ag) : [...prev, ag])

  const handleUpload = async () => {
    if (!videoFile || !title.trim()) { toast('Title and video file are required', 'error'); return }
    if (ageGroups.length === 0) { toast('Select at least one age group', 'error'); return }

    setUploading(true)
    setProgress(10)

    const fd = new FormData()
    fd.append('video', videoFile)
    fd.append('title', title.trim())
    fd.append('age_groups', JSON.stringify(ageGroups))

    setProgress(30)

    try {
      await api.videos.upload(fd)
      setProgress(100)
      toast('Video uploaded successfully!', 'success')
      setTimeout(() => router.push('/videos'), 1000)
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Upload failed', 'error')
      setProgress(0)
    } finally {
      setUploading(false)
    }
  }

  return (
    <PageWrapper>
      <Link href="/parent" className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 font-nunito text-sm">
        <ArrowLeft size={16} /> Back to Parent Dashboard
      </Link>

      <h1 className="text-3xl font-extrabold text-white font-nunito mb-6">Upload Video</h1>

      <Card className="max-w-lg">
        <div className="flex flex-col gap-5">
          <Input
            label="Video Title"
            placeholder="e.g. Introduction to Animals"
            value={title}
            onChange={e => setTitle(e.target.value)}
            leftIcon={<Film size={16} />}
          />

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2 font-nunito tracking-wide uppercase">
              Age Groups
            </label>
            <div className="flex flex-wrap gap-2">
              {AGE_OPTIONS.map(ag => (
                <button
                  key={ag}
                  onClick={() => toggleAge(ag)}
                  className={`px-4 py-2 rounded-xl border-2 font-bold text-sm font-nunito transition-all ${
                    ageGroups.includes(ag)
                      ? 'border-[#14b8a6] bg-[#14b8a6]/20 text-[#14b8a6]'
                      : 'border-white/20 text-slate-300'
                  }`}
                >
                  {ag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2 font-nunito tracking-wide uppercase">
              Video File
            </label>
            <button
              onClick={() => videoRef.current?.click()}
              className="w-full border-2 border-dashed border-white/20 hover:border-[#4ade80]/50 rounded-2xl p-8 flex flex-col items-center gap-3 transition-colors"
            >
              <Upload size={32} className={videoFile ? 'text-[#4ade80]' : 'text-slate-500'} />
              <span className="font-nunito text-sm text-slate-400">
                {videoFile ? videoFile.name : 'Click to select .mp4 / .webm / .mov (max 500MB)'}
              </span>
            </button>
            <input
              ref={videoRef}
              type="file"
              accept=".mp4,.webm,.mov,video/*"
              className="hidden"
              onChange={e => setVideoFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {uploading && (
            <div>
              <div className="flex justify-between text-xs text-slate-400 font-nunito mb-1">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-2 bg-[#4ade80] rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <Button size="lg" fullWidth loading={uploading} onClick={handleUpload}>
            <Upload size={18} /> Upload Video
          </Button>
        </div>
      </Card>
    </PageWrapper>
  )
}
