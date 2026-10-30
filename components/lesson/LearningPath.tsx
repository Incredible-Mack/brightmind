'use client'
import { useMemo, useState } from 'react'
import { Lock, Star, RotateCcw, PlayCircle, CheckCircle2, Award } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { LearningPath as Path, SkillState } from '@/lib/api'
import { SubjectIcon, subjectColors } from '@/components/icons/SubjectIcon'
import type { SubjectSlug } from '@/types/lesson'

const STATE: Record<SkillState, { label: string; cls: string }> = {
  locked:     { label: 'Locked',     cls: 'text-slate-500 bg-white/5' },
  available:  { label: 'Ready',      cls: 'text-[#4ade80] bg-[#4ade80]/15' },
  learning:   { label: 'Learning',   cls: 'text-blue-300 bg-blue-500/15' },
  practicing: { label: 'Practising', cls: 'text-yellow-300 bg-yellow-500/15' },
  mastered:   { label: 'Verified',   cls: 'text-purple-300 bg-purple-500/15' },
}

export function LearningPath({ path, onOpenLesson }: { path: Path; onOpenLesson: (lessonId: number) => void }) {
  const router = useRouter()
  const [subject, setSubject] = useState<string>(path.subjects[0]?.slug ?? '')
  const names = useMemo(() => {
    const m = new Map<string, string>()
    path.subjects.forEach(s => s.skills.forEach(k => m.set(k.slug, k.name)))
    return m
  }, [path])

  const current = path.subjects.find(s => s.slug === subject) ?? path.subjects[0]
  if (!current) return <p className="text-slate-500 font-nunito text-sm">No path yet.</p>

  // Group by strand, keeping the authored order
  const strands: Array<{ name: string; skills: typeof current.skills }> = []
  current.skills.forEach(sk => {
    const g = strands.find(x => x.name === sk.strand)
    if (g) g.skills.push(sk)
    else strands.push({ name: sk.strand || 'Skills', skills: [sk] })
  })

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {path.subjects.map(s => {
          const color = subjectColors[s.slug as SubjectSlug] ?? '#4ade80'
          const active = s.slug === current.slug
          const done = s.skills.filter(k => k.state === 'mastered').length
          return (
            <button key={s.slug} onClick={() => setSubject(s.slug)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm font-nunito transition-all border ${active ? 'text-[#1a1f2e] border-transparent' : 'bg-transparent border-white/20 text-slate-300 hover:border-white/40'}`}
              style={active ? { backgroundColor: color, borderColor: color } : {}}>
              <SubjectIcon slug={s.slug as SubjectSlug} size={16} />
              {s.name}
              <span className={`text-[10px] font-normal px-1.5 py-0.5 rounded-full ${active ? 'bg-black/20' : 'bg-white/10 text-slate-500'}`}>{done}/{s.skills.length}</span>
            </button>
          )
        })}
      </div>

      <div className="space-y-7">
        {strands.map(g => (
          <div key={g.name}>
            <p className="text-slate-500 font-nunito text-xs uppercase tracking-widest font-semibold mb-3">{g.name}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {g.skills.map(sk => {
                const st = STATE[sk.state]
                const locked = sk.state === 'locked'
                const needs = sk.prerequisites.map(p => names.get(p)).filter(Boolean) as string[]
                return (
                  <div key={sk.slug} className={`rounded-2xl border p-4 ${locked ? 'bg-slate-50 border-slate-200/60 opacity-60' : 'bg-white border-purple-100 shadow-sm'}`}>
                    <div className="flex items-start gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className={`font-nunito font-bold text-sm leading-tight ${locked ? 'text-slate-500' : 'text-slate-900'}`}>{sk.name}</p>
                        <p className="text-slate-600 font-nunito text-[10px] mt-0.5">Ages {sk.age_group}</p>
                      </div>
                      <span className={`flex items-center gap-1 text-[10px] font-nunito font-bold px-2 py-0.5 rounded-full ${st.cls}`}>
                        {sk.state === 'locked' ? <Lock size={10} /> : sk.state === 'mastered' ? <Star size={10} fill="currentColor" /> : null}
                        {st.label}
                      </span>
                    </div>

                    {sk.mastery != null && (
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                        <div className="h-full rounded-full bg-[#4ade80]" style={{ width: `${sk.mastery}%` }} />
                      </div>
                    )}
                    {sk.review_due && (
                      <p className="flex items-center gap-1 text-purple-300 font-nunito text-[11px] font-semibold mb-2"><RotateCcw size={11} /> Time to review</p>
                    )}
                    {sk.checkpoint === 'ready' && (
                      <button onClick={() => router.push(`/checkpoint/${encodeURIComponent(sk.slug)}`)}
                        className="w-full flex items-center justify-center gap-2 mt-2 mb-1 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-200 font-nunito font-bold text-sm transition-colors">
                        <Award size={15} /> Show what you know
                      </button>
                    )}
                    {sk.checkpoint === 'passed' && (
                      <p className="flex items-center gap-1 text-purple-300 font-nunito text-[11px] font-semibold mb-2">
                        <Award size={11} /> Checkpoint passed{sk.checkpoint_best ? ` (${sk.checkpoint_best}%)` : ''}
                      </p>
                    )}
                    {locked && needs.length > 0 && (
                      <p className="text-slate-600 font-nunito text-[11px]">Finish first: {needs.join(', ')}</p>
                    )}

                    {!locked && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {sk.lessons.map(l => (
                          <button key={l.id} onClick={() => onOpenLesson(l.id)}
                            className="flex items-center gap-1.5 text-xs font-nunito font-semibold px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 transition-colors">
                            {l.status === 'completed' ? <CheckCircle2 size={13} className="text-[#4ade80]" /> : <PlayCircle size={13} className="text-blue-300" />}
                            {l.title}
                            {l.status === 'completed' && l.score != null ? <span className="text-slate-500">{l.score}%</span> : null}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
