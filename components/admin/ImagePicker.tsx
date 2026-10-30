'use client'
import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Trash2, Library, X, Upload } from 'lucide-react'
import { adminApi, type AdminMedia } from '@/lib/adminApi'
import { imageSrc } from '@/lib/media'
import { Spinner } from '@/components/ui/Spinner'

interface Props {
  value?: string | null
  onChange: (url: string | null) => void
  label?: string
  /** compact: a small square (used per answer option and on list rows) */
  compact?: boolean
}

// Upload a picture, pick one from the library, replace it, or remove it.
export function ImagePicker({ value, onChange, label = 'Picture', compact = false }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [libOpen, setLibOpen] = useState(false)

  const upload = async (file: File | undefined) => {
    if (!file) return
    setBusy(true); setError('')
    try { const r = await adminApi.images.upload(file); onChange(r.url) }
    catch (e) { setError((e as Error).message) }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = '' }
  }

  const box = compact ? 'w-14 h-14' : 'w-28 h-28'

  return (
    <div>
      {!compact && <p className="text-slate-400 font-nunito text-xs mb-1.5">{label}</p>}
      <div className="flex items-center gap-3">
        <div className={`${box} rounded-xl bg-[#252b3b] border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0`}>
          {busy ? <Spinner size={18} /> : value ? <img src={imageSrc(value)} alt="" className="w-full h-full object-cover" /> : <ImagePlus size={compact ? 16 : 22} className="text-slate-600" />}
        </div>
        <div className={`flex ${compact ? 'flex-col gap-1' : 'flex-wrap gap-2'}`}>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={e => upload(e.target.files?.[0])} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#4ade80]/15 text-[#4ade80] font-nunito font-bold text-xs hover:bg-[#4ade80]/25 disabled:opacity-40">
            <Upload size={12} /> {value ? 'Replace' : 'Upload'}
          </button>
          {!compact && (
            <button type="button" onClick={() => setLibOpen(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 text-slate-300 font-nunito font-bold text-xs hover:bg-white/10">
              <Library size={12} /> Library
            </button>
          )}
          {value && (
            <button type="button" onClick={() => onChange(null)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-300 font-nunito font-bold text-xs hover:bg-red-500/20">
              <Trash2 size={12} /> {compact ? '' : 'Remove'}
            </button>
          )}
        </div>
      </div>
      {error && <p className="text-red-400 font-nunito text-xs mt-1">{error}</p>}
      {libOpen && <LibraryModal onClose={() => setLibOpen(false)} onPick={url => { onChange(url); setLibOpen(false) }} />}
    </div>
  )
}

function LibraryModal({ onClose, onPick }: { onClose: () => void; onPick: (url: string) => void }) {
  const [items, setItems] = useState<AdminMedia[] | null>(null)
  useEffect(() => { adminApi.images.list().then(setItems).catch(() => setItems([])) }, [])
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-5 w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center mb-4"><h3 className="text-white font-nunito font-bold flex-1">Image library</h3><button onClick={onClose} className="text-slate-400"><X size={18} /></button></div>
        {!items ? <div className="flex justify-center py-10"><Spinner size={28} /></div> : items.length === 0 ? (
          <p className="text-slate-500 font-nunito text-sm text-center py-10">No images yet. Upload one first.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {items.map(m => (
              <button key={m.id} onClick={() => onPick(m.url)} className="group text-left">
                <div className="aspect-square rounded-xl overflow-hidden bg-[#252b3b] border border-white/10 group-hover:border-[#4ade80]"><img src={imageSrc(m.url)} alt={m.alt} className="w-full h-full object-cover" /></div>
                <p className="text-slate-500 font-nunito text-[10px] truncate mt-1">{m.original_name}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
