'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, Baby, Activity, CheckCircle2, Film, Sparkles, RefreshCw, UserPlus, HelpCircle } from 'lucide-react'
import { adminApi, type AdminMonitor } from '@/lib/adminApi'
import { Spinner } from '@/components/ui/Spinner'

function Kpi({ icon: Icon, label, value, sub, color }: { icon: typeof Users; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}><Icon size={16} style={{ color }} /></div>
        <p className="text-slate-400 font-nunito text-xs font-semibold">{label}</p>
      </div>
      <p className="text-white font-extrabold font-nunito text-2xl">{value}</p>
      {sub && <p className="text-slate-500 font-nunito text-[11px] mt-0.5">{sub}</p>}
    </div>
  )
}

function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#1a1f2e] border border-white/5 rounded-2xl p-5 ${className}`}>
      <h2 className="text-white font-nunito font-bold text-sm mb-4">{title}</h2>
      {children}
    </div>
  )
}

const ago = (iso: string) => {
  const t = new Date(iso.replace(' ', 'T')).getTime()
  const m = Math.max(0, Math.round((Date.now() - t) / 60000))
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  if (m < 1440) return `${Math.round(m / 60)}h ago`
  return `${Math.round(m / 1440)}d ago`
}

export default function MonitorPage() {
  const [data, setData] = useState<AdminMonitor | null>(null)
  const [days, setDays] = useState(14)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setData(await adminApi.monitor.get(days)) }
    catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [days])

  useEffect(() => { load() }, [load])
  // Keep the page live without a manual reload
  useEffect(() => { const t = setInterval(load, 60000); return () => clearInterval(t) }, [load])

  if (!data) return <div className="flex justify-center py-24">{error ? <p className="text-red-400 font-nunito text-sm">{error}</p> : <Spinner size={36} />}</div>

  const k = data.kpis
  const maxAnswers = Math.max(1, ...data.daily.map(d => d.answers))

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-white font-nunito">Activity & Monitor</h1>
          <p className="text-slate-400 font-nunito text-xs">Who is learning, what is working, and where children get stuck. Refreshes every minute.</p>
        </div>
        <select value={days} onChange={e => setDays(Number(e.target.value))}
          className="bg-[#1a1f2e] border border-white/10 rounded-xl px-3 py-2 text-white font-nunito text-sm">
          {[7, 14, 30, 60].map(d => <option key={d} value={d}>Last {d} days</option>)}
        </select>
        <button onClick={load} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300" title="Refresh">
          {loading ? <Spinner size={16} /> : <RefreshCw size={16} />}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Kpi icon={Baby} label="Active today" value={k.active_today} sub={`${k.active_7d} this week · ${k.active_30d} this month`} color="#4ade80" />
        <Kpi icon={Activity} label="Answers (7 days)" value={k.answers_7d} sub={`${k.answers_today} today`} color="#3b82f6" />
        <Kpi icon={CheckCircle2} label="Lessons finished (7 days)" value={k.lessons_completed_7d} sub={`${k.lessons_completed_total} all time`} color="#a855f7" />
        <Kpi icon={HelpCircle} label="Pass rate (7 days)" value={k.pass_rate_7d == null ? '—' : `${k.pass_rate_7d}%`} sub={k.avg_score_7d == null ? '' : `Average score ${k.avg_score_7d}`} color="#eab308" />
        <Kpi icon={Users} label="Parents" value={k.parents} sub={`${k.admins} admin${k.admins === 1 ? '' : 's'}`} color="#14b8a6" />
        <Kpi icon={Baby} label="Children" value={k.children} color="#f97316" />
        <Kpi icon={UserPlus} label="New accounts (7 days)" value={k.signups_7d} color="#ec4899" />
        <Kpi icon={Film} label="Video views (7 days)" value={k.video_views_7d} sub={`${k.videos} videos`} color="#ef4444" />
      </div>

      <Card title={`Answers per day (last ${days} days)`} className="mb-6">
        <div className="flex items-end gap-1.5 h-40">
          {data.daily.map(d => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0 group">
              <div className="w-full flex-1 flex items-end">
                <div className="w-full rounded-t-md bg-[#4ade80]/70 group-hover:bg-[#4ade80] transition-colors"
                  style={{ height: `${Math.max(2, (d.answers / maxAnswers) * 100)}%` }}
                  title={`${d.date}: ${d.answers} answers, ${d.active_children} children, ${d.lessons_completed} lessons finished`} />
              </div>
              <span className="text-[9px] text-slate-600 font-nunito truncate">{d.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="By age group">
          <table className="w-full text-sm font-nunito">
            <thead><tr className="text-slate-500 text-xs text-left"><th className="pb-2">Age</th><th>Children</th><th>Active 7d</th><th>Avg score</th></tr></thead>
            <tbody>
              {data.by_age.map(a => (
                <tr key={a.age_group} className="border-t border-white/5 text-slate-200">
                  <td className="py-2 font-bold">{a.age_group}</td><td>{a.children}</td><td>{a.active_7d}</td><td>{a.avg_score ?? '—'}</td>
                </tr>
              ))}
              {data.by_age.length === 0 && <tr><td colSpan={4} className="text-slate-500 py-3">No children yet.</td></tr>}
            </tbody>
          </table>
        </Card>
        <Card title="By subject (30 days)">
          <div className="space-y-3">
            {data.by_subject.map(s => (
              <div key={s.slug}>
                <div className="flex justify-between text-xs font-nunito mb-1"><span className="text-slate-200 font-semibold">{s.name}</span><span className="text-slate-500">{s.answers} answers · {s.pass_rate ?? 0}% correct</span></div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-[#3b82f6]" style={{ width: `${s.pass_rate ?? 0}%` }} /></div>
              </div>
            ))}
            {data.by_subject.length === 0 && <p className="text-slate-500 font-nunito text-sm">No answers yet.</p>}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Questions children find hardest">
          <div className="space-y-3">
            {data.hardest.map(h => (
              <div key={h.id} className="text-sm font-nunito">
                <p className="text-slate-200 leading-snug">{h.question || `(${h.type} activity)`}</p>
                <p className="text-slate-500 text-xs"><Link href={`/admin/lessons/${h.lesson_id}/activities`} className="hover:text-[#4ade80]">{h.lesson_title}</Link> · tier {h.tier} · <span className="text-red-400">{h.pass_rate}% correct</span> over {h.attempts} tries</p>
              </div>
            ))}
            {data.hardest.length === 0 && <p className="text-slate-500 font-nunito text-sm">Needs at least 8 tries per question to show up.</p>}
          </div>
        </Card>
        <Card title="Weakest skills across children">
          <div className="space-y-3">
            {data.weak_skills.map(w => (
              <div key={w.skill_slug}>
                <div className="flex justify-between text-xs font-nunito mb-1"><span className="text-slate-200 font-semibold">{w.name}</span><span className="text-slate-500">{w.children} children · {w.avg_mastery}% mastery</span></div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-yellow-400" style={{ width: `${w.avg_mastery}%` }} /></div>
              </div>
            ))}
            {data.weak_skills.length === 0 && <p className="text-slate-500 font-nunito text-sm">Shown once 2+ children have practised a skill.</p>}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Live feed" className="lg:col-span-2">
          <div className="space-y-2 max-h-96 overflow-auto pr-1">
            {data.events.map((e, i) => (
              <div key={i} className="flex items-start gap-3 text-sm font-nunito">
                <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${e.kind === 'lesson' ? 'bg-purple-400' : e.kind === 'signup' ? 'bg-pink-400' : 'bg-[#4ade80]'}`} />
                <p className="flex-1 text-slate-300">{e.child && <strong className="text-white">{e.child} </strong>}{e.text}{e.score != null && e.kind !== 'signup' ? <span className="text-slate-500"> ({e.score}%)</span> : null}</p>
                <span className="text-slate-600 text-xs whitespace-nowrap">{ago(e.at)}</span>
              </div>
            ))}
            {data.events.length === 0 && <p className="text-slate-500 text-sm">Nothing yet. Activity shows up here as children learn.</p>}
          </div>
        </Card>
        <div className="space-y-6">
          <Card title="AI usage">
            <div className="flex items-center gap-2 mb-3"><Sparkles size={16} className="text-purple-400" /><span className="text-white font-extrabold font-nunito text-xl">{data.ai.calls_today}</span><span className="text-slate-500 text-xs font-nunito">calls today · {data.ai.calls_7d} this week</span></div>
            <p className="text-slate-500 font-nunito text-xs mb-2">{data.ai.tokens_7d.toLocaleString()} tokens in 7 days</p>
            {data.ai.by_kind.map(b => <p key={b.kind} className="text-slate-300 font-nunito text-xs">{b.kind}: {b.calls}</p>)}
            {data.ai.drafts_waiting > 0 && (
              <Link href="/admin/variants" className="block mt-3 text-[#4ade80] font-nunito text-xs font-bold hover:underline">{data.ai.drafts_waiting} AI draft{data.ai.drafts_waiting === 1 ? '' : 's'} waiting for review</Link>
            )}
          </Card>
          <Card title="Recent admin changes">
            <div className="space-y-2">
              {data.audit.map((a, i) => (
                <p key={i} className="text-xs font-nunito text-slate-400"><span className="text-slate-200 font-semibold">{a.action}</span> {a.target}<span className="text-slate-600"> · {a.admin ?? 'admin'} · {ago(a.created_at)}</span></p>
              ))}
              {data.audit.length === 0 && <p className="text-slate-500 text-xs font-nunito">No changes logged yet.</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
