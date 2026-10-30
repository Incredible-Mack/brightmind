'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Heart, RotateCcw, Trash2, Eraser } from 'lucide-react'
import { adminApi, type AdminChildDetail } from '@/lib/adminApi'
import { Spinner } from '@/components/ui/Spinner'

const STATUS_COLOR: Record<string, string> = {
  new: 'text-slate-400', learning: 'text-blue-300', practicing: 'text-yellow-300', mastered: 'text-purple-300',
}

export default function ChildDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [child, setChild] = useState<AdminChildDetail | null>(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => adminApi.users.child(Number(id)).then(setChild).catch(e => setError((e as Error).message))
  useEffect(() => { load() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!child) return <div className="flex justify-center py-24">{error ? <p className="text-red-400 font-nunito text-sm">{error}</p> : <Spinner size={36} />}</div>

  const act = async (action: 'reset_progress' | 'reset_skills' | 'refill_lives', warning?: string) => {
    if (warning && !confirm(warning)) return
    setBusy(true); setError(''); setInfo('')
    try { await adminApi.users.childAction(child.id, action); setInfo('Done.'); await load() }
    catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }
  const remove = async () => {
    if (!confirm(`Delete ${child.name} and all of their progress? This cannot be undone.`)) return
    setBusy(true)
    try { await adminApi.users.removeChild(child.id); router.push(`/admin/users/${child.user_id}`) } catch (e) { setError((e as Error).message); setBusy(false) }
  }

  const minutes = Math.round(child.totals.seconds / 60)

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link href={`/admin/users/${child.user_id}`} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-nunito mb-5"><ArrowLeft size={15} /> {child.parent_email}</Link>

      <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-6 mb-6">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-extrabold text-white font-nunito">{child.name} <span className="text-slate-500 font-normal text-base">· age {child.age} · group {child.age_group ?? '—'}</span></h1>
            <p className="text-slate-500 font-nunito text-xs">Joined {child.created_at.slice(0, 10)} · last active {child.last_active ? child.last_active.slice(0, 16) : 'never'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button disabled={busy} onClick={() => act('refill_lives')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 text-red-300 font-nunito font-bold text-xs disabled:opacity-40"><Heart size={13} /> Refill lives</button>
            <button disabled={busy} onClick={() => act('reset_skills', 'Clear this child\'s skill mastery? The learning path starts again, but lessons and XP stay.')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-yellow-500/10 text-yellow-300 font-nunito font-bold text-xs disabled:opacity-40"><RotateCcw size={13} /> Reset skills</button>
            <button disabled={busy} onClick={() => act('reset_progress', 'Reset ALL progress for this child (XP, lessons, results, skills, badges)? This cannot be undone.')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500/10 text-orange-300 font-nunito font-bold text-xs disabled:opacity-40"><Eraser size={13} /> Reset everything</button>
            <button disabled={busy} onClick={remove} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/15 text-red-300 font-nunito font-bold text-xs disabled:opacity-40"><Trash2 size={13} /> Delete child</button>
          </div>
        </div>
        {error && <p className="text-red-400 font-nunito text-sm mt-3">{error}</p>}
        {info && <p className="text-[#4ade80] font-nunito text-sm mt-3">{info}</p>}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-5">
          {[
            ['XP', child.xp ?? 0], ['Level', child.level ?? 1], ['Streak', `${child.streak ?? 0} d`], ['Lives', `${child.lives ?? 0}/${child.max_lives ?? 5}`],
            ['Answers', child.totals.answers], ['Avg score', child.totals.avg_score], ['Days active', child.totals.days_active],
          ].map(([l, v]) => (
            <div key={String(l)} className="bg-[#252b3b] rounded-xl p-3"><p className="text-slate-500 font-nunito text-[10px] uppercase tracking-widest">{l}</p><p className="text-white font-extrabold font-nunito text-lg">{v}</p></div>
          ))}
        </div>
        <p className="text-slate-600 font-nunito text-xs mt-3">About {minutes} minute{minutes === 1 ? '' : 's'} of learning time recorded.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-5">
          <h2 className="text-white font-nunito font-bold text-sm mb-3">Skills ({child.skills.length})</h2>
          <div className="space-y-2.5 max-h-96 overflow-auto pr-1">
            {child.skills.map(s => (
              <div key={s.skill_slug}>
                <div className="flex justify-between text-xs font-nunito mb-1"><span className="text-slate-200 font-semibold">{s.name ?? s.skill_slug}</span><span className={STATUS_COLOR[s.status]}>{s.status} · {Math.round(s.mastery)}%{s.checkpoint_passed_at ? ' · verified' : ''}</span></div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-[#4ade80]" style={{ width: `${Math.round(s.mastery)}%` }} /></div>
              </div>
            ))}
            {child.skills.length === 0 && <p className="text-slate-500 text-sm font-nunito">No skills practised yet.</p>}
          </div>
        </div>
        <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-5">
          <h2 className="text-white font-nunito font-bold text-sm mb-3">Lessons ({child.lessons.length})</h2>
          <div className="space-y-2 max-h-96 overflow-auto pr-1">
            {child.lessons.map(l => (
              <div key={l.lesson_id} className="flex justify-between text-xs font-nunito"><span className="text-slate-200">{l.title}</span><span className={l.status === 'completed' ? 'text-[#4ade80]' : 'text-slate-500'}>{l.status === 'completed' ? `${l.score}%` : l.status.replace('_', ' ')}</span></div>
            ))}
            {child.lessons.length === 0 && <p className="text-slate-500 text-sm font-nunito">No lessons started.</p>}
          </div>
        </div>
      </div>

      <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-5 mt-6">
        <h2 className="text-white font-nunito font-bold text-sm mb-3">Checkpoints (proof the skill is known)</h2>
        <div className="space-y-1.5">
          {child.checkpoints.map((c, i) => (
            <div key={i} className="flex justify-between text-xs font-nunito">
              <span className="text-slate-200">{c.name ?? c.skill_slug}</span>
              <span className={c.passed ? 'text-[#4ade80]' : 'text-yellow-300'}>{c.correct}/{c.total} · {c.passed ? 'passed' : 'try again'} · {c.created_at.slice(0, 10)}</span>
            </div>
          ))}
          {child.checkpoints.length === 0 && <p className="text-slate-500 text-sm font-nunito">No checkpoints taken yet.</p>}
        </div>
      </div>

      <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-5 mt-6">
        <h2 className="text-white font-nunito font-bold text-sm mb-3">Latest answers</h2>
        <table className="w-full text-xs font-nunito">
          <thead><tr className="text-slate-500 text-left"><th className="pb-2">When</th><th>Lesson</th><th>Type</th><th>Result</th><th>Tries</th><th>Time</th></tr></thead>
          <tbody>
            {child.recent.map((r, i) => (
              <tr key={i} className="border-t border-white/5 text-slate-300">
                <td className="py-1.5 text-slate-500">{r.created_at.slice(5, 16)}</td><td>{r.lesson}</td><td>{r.type.replace('_', ' ')}</td>
                <td className={r.passed ? 'text-[#4ade80]' : 'text-red-400'}>{r.passed ? 'Correct' : 'Wrong'}</td><td>{r.attempts}</td><td>{r.time_seconds}s</td>
              </tr>
            ))}
            {child.recent.length === 0 && <tr><td colSpan={6} className="py-3 text-slate-500">No answers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
