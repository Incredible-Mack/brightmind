'use client'
import { useCallback, useEffect, useState } from 'react'
import { Check, X, Trash2, Sparkles, RotateCcw } from 'lucide-react'
import { adminApi, type AdminLesson, type AdminVariant, type AdminActivity } from '@/lib/adminApi'
import { Spinner } from '@/components/ui/Spinner'

type Filter = 'draft' | 'approved' | 'rejected'

// One short line per activity so the reviewer can compare at a glance
function summarise(type: string, c: Record<string, unknown>): string {
  if (type === 'tap_answer') {
    const opts = (c.options as unknown[] | undefined ?? []).map(o => typeof o === 'string' ? o : (o as { text?: string }).text).join(' / ')
    return `${c.question}  →  [${opts}]  ✓ ${c.correct}`
  }
  if (type === 'speak' || type === 'type_answer') return `${c.prompt ?? c.question}  →  "${c.expected}"`
  if (c.letter) return `${c.letter} · ${c.word ?? ''} · ${c.audio_hint ?? ''}`
  if (c.number !== undefined) return `${c.number} · ${c.word ?? ''} · ${c.audio_hint ?? ''}`
  return String(c.prompt ?? c.text ?? '')
}

export default function VariantsPage() {
  const [lessons, setLessons] = useState<AdminLesson[]>([])
  const [lessonId, setLessonId] = useState<number | ''>('')
  const [filter, setFilter] = useState<Filter>('draft')
  const [variants, setVariants] = useState<AdminVariant[]>([])
  const [originals, setOriginals] = useState<Record<number, AdminActivity[]>>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => { adminApi.lessons.list().then(setLessons).catch(() => {}) }, [])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const list = await adminApi.variants.list({ status: filter, lesson_id: lessonId || undefined })
      setVariants(list)
      // Originals for side-by-side review
      const ids = Array.from(new Set(list.map(v => v.lesson_id)))
      const fetched = await Promise.all(ids.map(async id => [id, await adminApi.activities.list(id)] as const))
      setOriginals(Object.fromEntries(fetched))
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [filter, lessonId])

  useEffect(() => { load() }, [load])

  const generate = async () => {
    if (!lessonId) { setError('Pick a lesson first'); return }
    setBusy(true); setError(''); setInfo('')
    try {
      await adminApi.variants.generate(Number(lessonId))
      setInfo('Draft created. Review it below before approving.')
      setFilter('draft')
      await load()
    } catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }

  const setStatus = async (id: number, status: AdminVariant['status']) => {
    try { await adminApi.variants.setStatus(id, status); await load() }
    catch (e) { setError((e as Error).message) }
  }

  const remove = async (id: number) => {
    if (!confirm('Delete this variant?')) return
    try { await adminApi.variants.delete(id); await load() }
    catch (e) { setError((e as Error).message) }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white font-nunito">AI Variants</h1>
        <p className="text-slate-400 font-nunito text-xs">
          Reworded copies of a lesson. Children only ever see variants you approve. Generating one costs a single model call.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={lessonId}
          onChange={e => setLessonId(e.target.value ? Number(e.target.value) : '')}
          className="bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-white font-nunito text-sm"
        >
          <option value="">All lessons</option>
          {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
        </select>
        <button
          onClick={generate}
          disabled={busy || !lessonId}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4ade80] text-[#0f1117] font-nunito font-bold text-sm disabled:opacity-40"
        >
          {busy ? <Spinner size={16} /> : <Sparkles size={16} />} Generate draft
        </button>
        <div className="flex gap-1 ml-auto">
          {(['draft', 'approved', 'rejected'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg font-nunito font-semibold text-xs capitalize ${filter === f ? 'bg-[#4ade80]/15 text-[#4ade80]' : 'text-slate-400 hover:bg-white/5'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mb-4 text-red-400 font-nunito text-sm">{error}</p>}
      {info && <p className="mb-4 text-[#4ade80] font-nunito text-sm">{info}</p>}

      {loading ? <div className="flex justify-center py-12"><Spinner size={32} /></div>
        : variants.length === 0 ? <p className="text-slate-500 font-nunito text-sm py-8 text-center">No {filter} variants.</p>
        : (
          <div className="space-y-5">
            {variants.map(v => (
              <div key={v.id} className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-nunito font-bold">{v.lesson_title}</p>
                    <p className="text-slate-500 font-nunito text-xs">Variant #{v.id} · {v.model || 'model unknown'} · {v.created_at}</p>
                  </div>
                  {v.status !== 'approved' && (
                    <button onClick={() => setStatus(v.id, 'approved')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#22c55e]/15 text-[#4ade80] font-nunito font-bold text-xs">
                      <Check size={14} /> Approve
                    </button>
                  )}
                  {v.status !== 'rejected' && (
                    <button onClick={() => setStatus(v.id, 'rejected')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-yellow-500/10 text-yellow-300 font-nunito font-bold text-xs">
                      <X size={14} /> Reject
                    </button>
                  )}
                  {v.status !== 'draft' && (
                    <button onClick={() => setStatus(v.id, 'draft')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-slate-300 font-nunito font-bold text-xs">
                      <RotateCcw size={14} /> Back to draft
                    </button>
                  )}
                  <button onClick={() => remove(v.id)} className="p-2 rounded-lg text-red-400 hover:bg-red-500/10"><Trash2 size={16} /></button>
                </div>

                <div className="space-y-2">
                  {v.activities.map(a => {
                    const orig = (originals[v.lesson_id] ?? []).find(o => Number(o.order_index) === Number(a.order_index))
                    return (
                      <div key={a.order_index} className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-nunito">
                        <div className="rounded-xl bg-white/[0.03] p-3 text-slate-400">
                          <span className="text-slate-600 mr-2">{a.order_index}. original</span>{orig ? summarise(orig.type, orig.content) : '—'}
                        </div>
                        <div className="rounded-xl bg-[#4ade80]/[0.06] p-3 text-slate-200">
                          <span className="text-[#4ade80]/70 mr-2">{a.type}</span>{summarise(a.type, a.content)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
