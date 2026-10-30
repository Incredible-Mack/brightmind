'use client'
import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { adminApi, type AdminBadge } from '@/lib/adminApi'
import { Spinner } from '@/components/ui/Spinner'

const CONDITIONS = [
  { type: 'lessons_completed', label: 'Lessons completed', field: 'count', unit: 'lessons' },
  { type: 'streak', label: 'Day streak', field: 'days', unit: 'days' },
  { type: 'xp', label: 'Total XP', field: 'amount', unit: 'XP' },
  { type: 'subjects_completed', label: 'Subjects with a finished lesson', field: 'count', unit: 'subjects' },
  { type: 'perfect_score', label: 'A perfect lesson score', field: null, unit: '' },
] as const

const describe = (b: AdminBadge) => {
  const c = b.unlock_condition
  const def = CONDITIONS.find(x => x.type === c.type)
  if (!def) return c.type
  const n = def.field ? (c as unknown as Record<string, number>)[def.field] : null
  return n != null ? `${def.label}: ${n} ${def.unit}` : def.label
}

export default function BadgesPage() {
  const [badges, setBadges] = useState<AdminBadge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Partial<AdminBadge> | null>(null)
  const [condType, setCondType] = useState<string>('lessons_completed')
  const [condValue, setCondValue] = useState(1)

  const load = useCallback(async () => {
    try { setBadges(await adminApi.badges.list()) } catch (e) { setError((e as Error).message) } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const open = (b?: AdminBadge) => {
    setError('')
    if (b) {
      setEditing(b); setCondType(b.unlock_condition.type)
      setCondValue(b.unlock_condition.count ?? b.unlock_condition.days ?? b.unlock_condition.amount ?? 1)
    } else { setEditing({ icon: '⭐', xp_bonus: 10 }); setCondType('lessons_completed'); setCondValue(1) }
  }

  const save = async () => {
    if (!editing) return
    setError('')
    const def = CONDITIONS.find(c => c.type === condType)!
    const unlock_condition = { type: condType, ...(def.field ? { [def.field]: condValue } : {}) }
    try {
      if (editing.id) {
        await adminApi.badges.update(editing.id, { title: editing.title, description: editing.description ?? '', icon: editing.icon ?? '⭐', xp_bonus: editing.xp_bonus ?? 0, unlock_condition })
      } else {
        const slug = (editing.slug || editing.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        await adminApi.badges.create({ slug, title: editing.title ?? '', description: editing.description ?? '', icon: editing.icon ?? '⭐', xp_bonus: editing.xp_bonus ?? 0, unlock_condition })
      }
      setEditing(null); await load()
    } catch (e) { setError((e as Error).message) }
  }

  const remove = async (b: AdminBadge) => {
    if (!confirm(`Delete the "${b.title}" badge? Children who earned it lose it.`)) return
    try { await adminApi.badges.remove(b.id); await load() } catch (e) { setError((e as Error).message) }
  }

  const field = 'w-full bg-[#252b3b] border border-white/10 focus:border-[#4ade80] rounded-xl px-3 py-2.5 text-white font-nunito text-sm outline-none'
  const def = CONDITIONS.find(c => c.type === condType)!

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-white font-nunito">Badges</h1>
          <p className="text-slate-400 font-nunito text-xs">Rewards children unlock automatically when they finish a lesson.</p>
        </div>
        <button onClick={() => open()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4ade80] text-[#0f1117] font-nunito font-extrabold text-sm"><Plus size={16} /> New badge</button>
      </div>
      {error && !editing && <p className="text-red-400 font-nunito text-sm mb-3">{error}</p>}

      {loading ? <div className="flex justify-center py-12"><Spinner size={30} /></div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {badges.map(b => (
            <div key={b.id} className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-5 flex gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#252b3b] flex items-center justify-center text-3xl flex-shrink-0">{b.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-nunito font-bold">{b.title}</p>
                <p className="text-slate-500 font-nunito text-xs">{b.description}</p>
                <p className="text-slate-400 font-nunito text-xs mt-1.5">{describe(b)}</p>
                <p className="text-slate-600 font-nunito text-[11px]">+{b.xp_bonus} XP · earned by {b.earned} child{b.earned === 1 ? '' : 'ren'}</p>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => open(b)} className="p-2 rounded-lg text-slate-400 hover:bg-white/5"><Pencil size={14} /></button>
                <button onClick={() => remove(b)} className="p-2 rounded-lg text-red-400 hover:bg-red-500/10"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center"><h3 className="text-white font-nunito font-bold flex-1">{editing.id ? 'Edit badge' : 'New badge'}</h3><button onClick={() => setEditing(null)} className="text-slate-400"><X size={18} /></button></div>
            <div className="flex gap-3">
              <input className={field + ' !w-20 text-center text-xl'} value={editing.icon ?? ''} maxLength={4} onChange={e => setEditing({ ...editing, icon: e.target.value })} />
              <input className={field} placeholder="Title" value={editing.title ?? ''} onChange={e => setEditing({ ...editing, title: e.target.value })} />
            </div>
            <input className={field} placeholder="Description" value={editing.description ?? ''} onChange={e => setEditing({ ...editing, description: e.target.value })} />
            <div>
              <p className="text-slate-400 font-nunito text-xs mb-1.5">Unlocked when a child reaches…</p>
              <select className={field} value={condType} onChange={e => setCondType(e.target.value)}>{CONDITIONS.map(c => <option key={c.type} value={c.type}>{c.label}</option>)}</select>
              {def.field && <input type="number" min={1} className={field + ' mt-2'} value={condValue} onChange={e => setCondValue(Math.max(1, Number(e.target.value)))} />}
            </div>
            <div>
              <p className="text-slate-400 font-nunito text-xs mb-1.5">Bonus XP</p>
              <input type="number" min={0} max={500} className={field} value={editing.xp_bonus ?? 0} onChange={e => setEditing({ ...editing, xp_bonus: Number(e.target.value) })} />
            </div>
            {error && <p className="text-red-400 font-nunito text-sm">{error}</p>}
            <button onClick={save} disabled={!editing.title?.trim()} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#4ade80] text-[#0f1117] font-nunito font-extrabold disabled:opacity-40"><Check size={16} /> Save</button>
          </div>
        </div>
      )}
    </div>
  )
}
