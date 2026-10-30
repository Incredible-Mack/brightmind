'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Upload, Film, Trash2, Eye, EyeOff, Pencil, X, Check, Search, Image as ImageIcon } from 'lucide-react'
import { adminApi, type AdminVideo, type AdminSubject } from '@/lib/adminApi'
import { Spinner } from '@/components/ui/Spinner'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost/brightmind-api'
const AGES = ['0-5', '6-8', '9-11', '12-14']
const AGE_COLOR: Record<string, string> = {
  '0-5': 'bg-green-500/20 text-green-400', '6-8': 'bg-blue-500/20 text-blue-300',
  '9-11': 'bg-yellow-500/20 text-yellow-300', '12-14': 'bg-purple-500/20 text-purple-300',
}
const url = (p: string | null) => (p ? (p.startsWith('/') ? `${API_BASE}${p}` : p) : '')
const fmtDur = (s: number | null) => (s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '')

function AgePicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {AGES.map(a => {
        const on = value.includes(a)
        return (
          <button key={a} type="button" onClick={() => onChange(on ? value.filter(x => x !== a) : [...value, a])}
            className={`px-3 py-1.5 rounded-lg text-xs font-nunito font-bold border transition-colors ${on ? AGE_COLOR[a] + ' border-transparent' : 'border-white/15 text-slate-400 hover:border-white/30'}`}>
            Ages {a}
          </button>
        )
      })}
    </div>
  )
}

export default function AdminVideosPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const thumbRef = useRef<HTMLInputElement>(null)

  const [subjects, setSubjects] = useState<AdminSubject[]>([])
  const [videos, setVideos] = useState<AdminVideo[]>([])
  const [loading, setLoading] = useState(true)

  // filters
  const [fSubject, setFSubject] = useState('')
  const [fAge, setFAge] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [fSearch, setFSearch] = useState('')

  // upload form
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [ages, setAges] = useState<string[]>(['6-8'])
  const [file, setFile] = useState<File | null>(null)
  const [thumb, setThumb] = useState<File | null>(null)
  const [thumbPreview, setThumbPreview] = useState('')
  const [duration, setDuration] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [pct, setPct] = useState(0)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  // edit
  const [editing, setEditing] = useState<AdminVideo | null>(null)
  const [eTitle, setETitle] = useState(''); const [eDesc, setEDesc] = useState('')
  const [eSubject, setESubject] = useState(''); const [eAges, setEAges] = useState<string[]>([])

  useEffect(() => { adminApi.subjects.list().then(setSubjects).catch(() => {}) }, [])

  const load = useCallback(async () => {
    try {
      setVideos(await adminApi.videos.list({
        subject_id: fSubject ? Number(fSubject) : undefined, age_group: fAge || undefined,
        status: fStatus || undefined, search: fSearch || undefined,
      }))
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [fSubject, fAge, fStatus, fSearch])
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t) }, [load])

  // Read the length from the file itself so the library can show it
  const pickVideo = (f: File | null) => {
    setFile(f); setDuration(0)
    if (!f) return
    if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '))
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => { setDuration(Math.round(v.duration) || 0); URL.revokeObjectURL(v.src) }
    v.src = URL.createObjectURL(f)
  }
  const pickThumb = (f: File | null) => {
    setThumb(f)
    setThumbPreview(f ? URL.createObjectURL(f) : '')
  }

  const upload = async () => {
    setError(''); setOk('')
    if (!file) { setError('Choose a video file'); return }
    if (!title.trim()) { setError('Give the video a title'); return }
    if (!subjectId) { setError('Choose a category'); return }
    if (!ages.length) { setError('Pick at least one age group'); return }
    const fd = new FormData()
    fd.append('video', file); fd.append('title', title.trim()); fd.append('description', desc.trim())
    fd.append('subject_id', subjectId); fd.append('age_groups', JSON.stringify(ages)); fd.append('duration', String(duration))
    if (thumb) fd.append('thumbnail', thumb)
    setUploading(true); setPct(0)
    try {
      await adminApi.videos.upload(fd, setPct)
      setOk('Uploaded. It is live for the chosen age groups.')
      setTitle(''); setDesc(''); setFile(null); setThumb(null); setThumbPreview(''); setDuration(0)
      if (fileRef.current) fileRef.current.value = ''
      if (thumbRef.current) thumbRef.current.value = ''
      await load()
    } catch (e) { setError((e as Error).message) }
    finally { setUploading(false) }
  }

  const startEdit = (v: AdminVideo) => {
    setEditing(v); setETitle(v.title); setEDesc(v.description ?? ''); setESubject(v.subject_id ? String(v.subject_id) : ''); setEAges(v.age_groups)
  }
  const saveEdit = async () => {
    if (!editing) return
    setError('')
    try {
      await adminApi.videos.update(editing.id, { title: eTitle, description: eDesc, subject_id: eSubject ? Number(eSubject) : null, age_groups: eAges })
      setEditing(null); await load()
    } catch (e) { setError((e as Error).message) }
  }
  const toggle = async (v: AdminVideo) => {
    try { await adminApi.videos.update(v.id, { published: !v.published }); await load() } catch (e) { setError((e as Error).message) }
  }
  const remove = async (v: AdminVideo) => {
    if (!confirm(`Delete "${v.title}"? The video file is removed too.`)) return
    try { await adminApi.videos.remove(v.id); await load() } catch (e) { setError((e as Error).message) }
  }

  const field = 'w-full bg-[#252b3b] border border-white/10 focus:border-[#4ade80] rounded-xl px-3 py-2.5 text-white font-nunito text-sm outline-none'

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white font-nunito">Videos</h1>
        <p className="text-slate-400 font-nunito text-xs">Upload videos by category and age group. Hidden videos stay in the library but children cannot see them.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        {/* Upload */}
        <div className="lg:col-span-2 bg-[#1a1f2e] border border-white/5 rounded-2xl p-5 space-y-4 self-start">
          <h2 className="text-white font-nunito font-bold text-sm flex items-center gap-2"><Upload size={15} className="text-[#4ade80]" /> Upload a video</h2>

          <label className="block border-2 border-dashed border-white/15 hover:border-[#4ade80]/50 rounded-xl p-4 text-center cursor-pointer transition-colors">
            <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" className="hidden" onChange={e => pickVideo(e.target.files?.[0] ?? null)} />
            <Film size={22} className="mx-auto text-slate-500 mb-1" />
            <p className="text-slate-300 font-nunito text-sm">{file ? file.name : 'Choose a video (MP4, WebM, MOV)'}</p>
            {file && <p className="text-slate-500 text-xs font-nunito">{(file.size / 1048576).toFixed(1)} MB{duration ? ` · ${fmtDur(duration)}` : ''}</p>}
            {!file && <p className="text-slate-600 text-xs font-nunito">Up to 500 MB</p>}
          </label>

          <input className={field} placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
          <textarea className={field + ' resize-none'} rows={2} placeholder="Short description (optional)" value={desc} onChange={e => setDesc(e.target.value)} />

          <div>
            <p className="text-slate-400 font-nunito text-xs mb-1.5">Category</p>
            <select className={field} value={subjectId} onChange={e => setSubjectId(e.target.value)}>
              <option value="">Choose a category…</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
            </select>
          </div>
          <div>
            <p className="text-slate-400 font-nunito text-xs mb-1.5">Who is it for?</p>
            <AgePicker value={ages} onChange={setAges} />
          </div>
          <div>
            <p className="text-slate-400 font-nunito text-xs mb-1.5">Thumbnail (optional, JPG/PNG/WebP under 5 MB)</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input ref={thumbRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => pickThumb(e.target.files?.[0] ?? null)} />
              <span className="w-20 h-12 rounded-lg bg-[#252b3b] border border-white/10 flex items-center justify-center overflow-hidden">
                {thumbPreview ? <img src={thumbPreview} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={18} className="text-slate-600" />}
              </span>
              <span className="text-slate-400 font-nunito text-xs">{thumb ? thumb.name : 'Choose an image'}</span>
            </label>
          </div>

          {uploading && (
            <div><div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-[#4ade80] transition-all" style={{ width: `${pct}%` }} /></div><p className="text-slate-500 text-xs font-nunito mt-1">Uploading… {pct}%</p></div>
          )}
          {error && <p className="text-red-400 font-nunito text-sm">{error}</p>}
          {ok && <p className="text-[#4ade80] font-nunito text-sm">{ok}</p>}
          <button onClick={upload} disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#4ade80] text-[#0f1117] font-nunito font-extrabold disabled:opacity-50">
            {uploading ? <Spinner size={18} /> : <Upload size={16} />} {uploading ? 'Uploading' : 'Upload video'}
          </button>
        </div>

        {/* Library */}
        <div className="lg:col-span-3">
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[160px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input className={field + ' pl-8'} placeholder="Search videos" value={fSearch} onChange={e => setFSearch(e.target.value)} />
            </div>
            <select className={field + ' !w-auto'} value={fSubject} onChange={e => setFSubject(e.target.value)}>
              <option value="">All categories</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className={field + ' !w-auto'} value={fAge} onChange={e => setFAge(e.target.value)}>
              <option value="">All ages</option>{AGES.map(a => <option key={a} value={a}>Ages {a}</option>)}
            </select>
            <select className={field + ' !w-auto'} value={fStatus} onChange={e => setFStatus(e.target.value)}>
              <option value="">Any status</option><option value="published">Published</option><option value="hidden">Hidden</option>
            </select>
          </div>

          {loading ? <div className="flex justify-center py-12"><Spinner size={30} /></div> : (
            <div className="space-y-3">
              {videos.map(v => (
                <div key={v.id} className={`bg-[#1a1f2e] border rounded-2xl p-4 flex gap-4 ${v.published ? 'border-white/5' : 'border-yellow-500/20 opacity-80'}`}>
                  <div className="w-32 h-20 rounded-xl bg-[#252b3b] overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {v.thumbnail_url ? <img src={url(v.thumbnail_url)} alt="" className="w-full h-full object-cover" /> : <Film size={24} className="text-slate-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <p className="text-white font-nunito font-bold text-sm flex-1 truncate">{v.title}</p>
                      {!v.published && <span className="text-[10px] font-bold text-yellow-300 bg-yellow-500/15 px-2 py-0.5 rounded-full">Hidden</span>}
                    </div>
                    <p className="text-slate-500 font-nunito text-xs mt-0.5 truncate">{v.subject_name ?? 'No category'}{v.duration ? ` · ${fmtDur(v.duration)}` : ''} · {v.views} view{v.views === 1 ? '' : 's'} ({v.views_7d} this week)</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">{v.age_groups.map(a => <span key={a} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${AGE_COLOR[a] ?? 'bg-white/10 text-slate-300'}`}>{a}</span>)}</div>
                    <p className="text-slate-600 font-nunito text-[11px] mt-1 truncate">Uploaded {v.created_at.slice(0, 10)}{v.uploader_email ? ` by ${v.uploader_email}` : ''}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => startEdit(v)} className="p-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white" title="Edit"><Pencil size={15} /></button>
                    <button onClick={() => toggle(v)} className="p-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white" title={v.published ? 'Hide from children' : 'Show to children'}>{v.published ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                    <button onClick={() => remove(v)} className="p-2 rounded-lg text-red-400 hover:bg-red-500/10" title="Delete"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
              {videos.length === 0 && <p className="text-slate-500 font-nunito text-sm text-center py-10">No videos match.</p>}
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center"><h3 className="text-white font-nunito font-bold flex-1">Edit video</h3><button onClick={() => setEditing(null)} className="text-slate-400"><X size={18} /></button></div>
            <input className={field} value={eTitle} onChange={e => setETitle(e.target.value)} />
            <textarea className={field + ' resize-none'} rows={3} value={eDesc} onChange={e => setEDesc(e.target.value)} />
            <select className={field} value={eSubject} onChange={e => setESubject(e.target.value)}>
              <option value="">No category</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
            </select>
            <AgePicker value={eAges} onChange={setEAges} />
            <button onClick={saveEdit} disabled={!eTitle.trim() || !eAges.length} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#4ade80] text-[#0f1117] font-nunito font-extrabold disabled:opacity-40"><Check size={16} /> Save</button>
          </div>
        </div>
      )}
    </div>
  )
}
