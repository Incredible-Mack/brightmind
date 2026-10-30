'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Upload, Trash2, Link2 } from 'lucide-react'
import { adminApi, type AdminMedia } from '@/lib/adminApi'
import { imageSrc } from '@/lib/media'
import { Spinner } from '@/components/ui/Spinner'

const kb = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)

export default function ImagesPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<AdminMedia[] | null>(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unused'>('all')

  const load = useCallback(async () => {
    try { setItems(await adminApi.images.list()) } catch (e) { setError((e as Error).message) }
  }, [])
  useEffect(() => { load() }, [load])

  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true); setError(''); setInfo('')
    let ok = 0
    for (const f of Array.from(files)) {
      try { await adminApi.images.upload(f); ok++ } catch (e) { setError(`${f.name}: ${(e as Error).message}`) }
    }
    if (ok) setInfo(`${ok} image${ok === 1 ? '' : 's'} uploaded.`)
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
    await load()
  }

  const remove = async (m: AdminMedia) => {
    const used = m.used_by.length
    const msg = used
      ? `"${m.original_name}" is used by ${used} activit${used === 1 ? 'y' : 'ies'}. Delete it anyway? It will be taken off those activities.`
      : `Delete "${m.original_name}"?`
    if (!confirm(msg)) return
    try { await adminApi.images.remove(m.id, used > 0); await load() } catch (e) { setError((e as Error).message) }
  }

  const shown = (items ?? []).filter(m => filter === 'all' || m.used_by.length === 0)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-white font-nunito">Images</h1>
          <p className="text-slate-400 font-nunito text-xs">Real pictures for lessons. Upload here, or straight from a lesson&apos;s activity list. An image replaces the emoji on that card or question.</p>
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value as 'all' | 'unused')} className="bg-[#1a1f2e] border border-white/10 rounded-xl px-3 py-2 text-white font-nunito text-sm">
          <option value="all">All images</option><option value="unused">Not used yet</option>
        </select>
        <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={e => upload(e.target.files)} />
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4ade80] text-[#0f1117] font-nunito font-extrabold text-sm disabled:opacity-50">
          {uploading ? <Spinner size={16} /> : <Upload size={16} />} Upload images
        </button>
      </div>
      {error && <p className="text-red-400 font-nunito text-sm mb-3">{error}</p>}
      {info && <p className="text-[#4ade80] font-nunito text-sm mb-3">{info}</p>}

      {!items ? <div className="flex justify-center py-16"><Spinner size={32} /></div> : shown.length === 0 ? (
        <p className="text-slate-500 font-nunito text-sm text-center py-16">{items.length === 0 ? 'No images yet. Upload your first one.' : 'Every image is in use.'}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {shown.map(m => (
            <div key={m.id} className="bg-[#1a1f2e] border border-white/5 rounded-2xl overflow-hidden">
              <div className="aspect-square bg-[#252b3b] flex items-center justify-center"><img src={imageSrc(m.url)} alt={m.alt || m.original_name} className="w-full h-full object-contain" /></div>
              <div className="p-3">
                <p className="text-white font-nunito font-semibold text-xs truncate" title={m.original_name}>{m.original_name}</p>
                <p className="text-slate-500 font-nunito text-[11px]">{m.width}×{m.height} · {kb(m.size)}</p>
                <div className="mt-2 text-[11px] font-nunito">
                  {m.used_by.length === 0 ? <span className="text-slate-600">Not used yet</span> : (
                    <span className="text-[#4ade80] flex items-start gap-1"><Link2 size={11} className="mt-0.5 flex-shrink-0" />
                      <span>{m.used_by.length} activit{m.used_by.length === 1 ? 'y' : 'ies'}: {Array.from(new Set(m.used_by.map(u => u.lesson_id))).slice(0, 3).map((lid, i) => (
                        <span key={lid}>{i > 0 && ', '}<Link href={`/admin/lessons/${lid}/activities`} className="underline hover:text-white">{m.used_by.find(u => u.lesson_id === lid)?.lesson_title}</Link></span>
                      ))}</span>
                    </span>
                  )}
                </div>
                <button onClick={() => remove(m)} className="mt-2 flex items-center gap-1 text-red-300 hover:text-red-200 font-nunito text-xs"><Trash2 size={12} /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
