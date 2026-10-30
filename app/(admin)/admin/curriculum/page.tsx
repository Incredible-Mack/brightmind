'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, CircleDashed, Download, Eye, Pencil, Search } from 'lucide-react'
import { adminApi, type CourseTree, type CourseLesson, type CourseLessonDetail, type CourseActivity, type ReviewState } from '@/lib/adminApi'
import { normalizeTapOptions } from '@/lib/lessonContent'
import { Spinner } from '@/components/ui/Spinner'
import { activityImage, imageSrc } from '@/lib/media'

const AGES = ['0-5', '6-8', '9-11', '12-14']
const REVIEW: Record<ReviewState, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  reviewed:   { label: 'Reviewed',             cls: 'text-[#4ade80] bg-[#4ade80]/10', Icon: CheckCircle2 },
  changed:    { label: 'Changed since review', cls: 'text-yellow-300 bg-yellow-500/10', Icon: AlertTriangle },
  unreviewed: { label: 'Not reviewed',         cls: 'text-slate-400 bg-white/5', Icon: CircleDashed },
}
const TIER = ['', 'Easy', 'Core', 'Challenge']

// ── One activity, shown the way a reviewer needs it: question, the right answer, and how children do ──
function ActivityView({ a }: { a: CourseActivity }) {
  const c = a.content
  const stat = a.attempts > 0
    ? <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${(a.pass_rate ?? 0) < 50 ? 'bg-red-500/15 text-red-300' : 'bg-white/5 text-slate-400'}`}>{a.pass_rate}% right · {a.attempts} tries</span>
    : <span className="text-[10px] text-slate-600">not tried yet</span>

  let body: React.ReactNode
  if (a.type === 'tap_answer') {
    body = (
      <>
        <p className="text-slate-100">{String(c.question)}</p>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {normalizeTapOptions(c).map(o => (
            <span key={o.id} className={`px-2.5 py-1 rounded-lg text-xs ${o.correct ? 'bg-[#4ade80]/15 text-[#4ade80] font-bold' : 'bg-white/5 text-slate-400'}`}>{o.correct ? '✓ ' : ''}{o.text}</span>
          ))}
        </div>
      </>
    )
  } else if (a.type === 'speak') {
    body = <><p className="text-slate-100">{String(c.prompt)}</p><p className="text-xs text-slate-500 mt-1">Child says: <span className="text-[#4ade80] font-semibold">{String(c.expected)}</span></p></>
  } else if (a.type === 'type_answer') {
    body = <><p className="text-slate-100">{String(c.question)}</p><p className="text-xs text-slate-500 mt-1">Child types: <span className="text-[#4ade80] font-semibold">{String(c.expected)}</span></p></>
  } else if (a.type === 'drag_drop') {
    const pairs = (c.pairs ?? []) as Array<{ item: string; target: string }>
    body = <><p className="text-slate-100">{String(c.prompt ?? 'Match these')}</p><div className="flex flex-wrap gap-1.5 mt-1.5">{pairs.map((p, i) => <span key={i} className="px-2.5 py-1 rounded-lg text-xs bg-[#4ade80]/10 text-[#4ade80]">{p.item} → {p.target}</span>)}</div></>
  } else if (c.letter) {
    body = <p className="text-slate-100"><span className="text-2xl font-extrabold text-[#4ade80] mr-2">{String(c.letter)}</span>{String(c.visual ?? '')} {String(c.word ?? '')} <span className="text-slate-500 text-xs">· {String(c.audio_hint ?? '')}</span></p>
  } else if (c.number !== undefined) {
    body = <p className="text-slate-100"><span className="text-2xl font-extrabold text-[#4ade80] mr-2">{String(c.number)}</span>{String(c.word ?? '')} <span className="text-slate-500 text-xs">{Array.isArray(c.objects) ? (c.objects as string[]).join('') : ''}</span></p>
  } else {
    body = <><p className="text-slate-100">{String(c.prompt ?? c.text ?? '')}</p>{!!c.audio_hint && <p className="text-xs text-slate-500 italic mt-0.5">&ldquo;{String(c.audio_hint)}&rdquo;</p>}</>
  }

  return (
    <div className="bg-[#252b3b] rounded-xl px-4 py-3 text-sm font-nunito">
      <div className="flex items-center gap-2 mb-1.5 text-[10px] uppercase tracking-wider">
        <span className="text-slate-600">#{a.order_index}</span>
        <span className="text-blue-300">{a.type.replace('_', ' ')}</span>
        {a.role !== 'teach' && <span className="text-slate-500">· {TIER[a.tier]}</span>}
        <span className="ml-auto normal-case">{stat}</span>
      </div>
      {activityImage(c) && <img src={imageSrc(activityImage(c)!)} alt="" className="h-16 w-auto rounded-lg mb-2 bg-white/5" />}
      {body}
    </div>
  )
}

function Section({ title, items }: { title: string; items: CourseActivity[] }) {
  if (!items.length) return null
  return (
    <div>
      <p className="text-slate-500 font-nunito text-[11px] uppercase tracking-widest font-semibold mb-2">{title} ({items.length})</p>
      <div className="space-y-2">{items.map(a => <ActivityView key={a.id} a={a} />)}</div>
    </div>
  )
}

function LessonDetail({ detail }: { detail: CourseLessonDetail }) {
  const acts = detail.activities
  const teach = acts.filter(a => a.role === 'teach')
  const checks = acts.filter(a => a.role === 'check')
  const rest = acts.filter(a => a.role !== 'teach' && a.role !== 'check')
  return (
    <div className="space-y-5 mt-3">
      {detail.lesson.description && <p className="text-slate-400 font-nunito text-sm">{detail.lesson.description}</p>}
      <Section title="Teaching cards: the child reads and hears these first" items={teach} />
      <Section title="Quick checks: asked first the very first time, so a child who already knows it can skip ahead" items={checks} />
      {[1, 2, 3].map(t => <Section key={t} title={`Questions, ${TIER[t].toLowerCase()} (tier ${t})`} items={rest.filter(a => a.tier === t)} />)}
    </div>
  )
}

function mdFor(detail: CourseLessonDetail): string {
  const out: string[] = [`### ${detail.lesson.title} (level ${detail.lesson.level}, ${detail.lesson.difficulty})`, '']
  const line = (a: CourseActivity) => {
    const c = a.content
    if (a.type === 'tap_answer') return `- Q: ${c.question}  \n  Options: ${normalizeTapOptions(c).map(o => (o.correct ? `**${o.text}** ✓` : o.text)).join(' | ')}`
    if (a.type === 'speak') return `- SAY: ${c.prompt}  → expected: ${c.expected}`
    if (a.type === 'type_answer') return `- TYPE: ${c.question}  → expected: ${c.expected}`
    if (a.type === 'drag_drop') return `- MATCH: ${c.prompt ?? ''} ${((c.pairs ?? []) as Array<{ item: string; target: string }>).map(p => `${p.item}→${p.target}`).join(', ')}`
    if (c.letter) return `- LETTER ${c.letter}: ${c.word ?? ''} ${c.visual ?? ''}`
    if (c.number !== undefined) return `- NUMBER ${c.number}: ${c.word ?? ''}`
    return `- ${c.prompt ?? c.text ?? ''}`
  }
  const teach = detail.activities.filter(a => a.role === 'teach')
  if (teach.length) out.push('**Teaching**', ...teach.map(line), '')
  const checks = detail.activities.filter(a => a.role === 'check')
  if (checks.length) out.push('**Quick checks**', ...checks.map(line), '')
  for (const t of [1, 2, 3]) {
    const items = detail.activities.filter(a => a.role !== 'teach' && a.role !== 'check' && a.tier === t)
    if (items.length) out.push(`**Tier ${t} (${TIER[t]})**`, ...items.map(line), '')
  }
  return out.join('\n')
}

export default function CourseReviewPage() {
  const [tree, setTree] = useState<CourseTree | null>(null)
  const [error, setError] = useState('')
  const [subject, setSubject] = useState('')
  const [age, setAge] = useState('')
  const [search, setSearch] = useState('')
  const [needsReview, setNeedsReview] = useState(false)
  const [open, setOpen] = useState<number | null>(null)
  const [detail, setDetail] = useState<CourseLessonDetail | null>(null)
  const [loadingLesson, setLoadingLesson] = useState(false)
  const [busy, setBusy] = useState(false)
  const [exporting, setExporting] = useState(false)

  const load = useCallback(async () => {
    try { setTree(await adminApi.curriculum.tree()) } catch (e) { setError((e as Error).message) }
  }, [])
  useEffect(() => { load() }, [load])

  const subjects = useMemo(() => Array.from(new Map((tree?.skills ?? []).map(s => [s.subject_slug, s.subject_name])).entries()), [tree])

  const visible = useMemo(() => (tree?.skills ?? []).filter(s =>
    (!subject || s.subject_slug === subject) && (!age || s.age_group === age) &&
    (!search || s.name.toLowerCase().includes(search.toLowerCase()) || s.lessons.some(l => l.title.toLowerCase().includes(search.toLowerCase()))) &&
    (!needsReview || s.lessons.some(l => l.review_state !== 'reviewed'))
  ), [tree, subject, age, search, needsReview])

  const openLesson = async (l: CourseLesson) => {
    if (open === l.id) { setOpen(null); setDetail(null); return }
    setOpen(l.id); setDetail(null); setLoadingLesson(true)
    try { setDetail(await adminApi.curriculum.lesson(l.id)) } catch (e) { setError((e as Error).message) }
    finally { setLoadingLesson(false) }
  }

  const review = async (target: { lessonId?: number; skill?: string }, value: boolean) => {
    setBusy(true); setError('')
    try {
      await adminApi.curriculum.review(target, value)
      await load()
      if (target.lessonId && open === target.lessonId) setDetail(await adminApi.curriculum.lesson(target.lessonId))
    } catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }

  // The whole visible course as one readable document, for reviewing offline or sharing with a teacher
  const exportCourse = async () => {
    setExporting(true); setError('')
    try {
      const out: string[] = [`# Course outline`, '', `Generated ${new Date().toLocaleString()}`, '']
      for (const sk of visible) {
        out.push(`## ${sk.subject_name} · ${sk.name} (ages ${sk.age_group})`, sk.prerequisites.length ? `Builds on: ${sk.prerequisites.join(', ')}` : '', '')
        for (const l of sk.lessons) out.push(mdFor(await adminApi.curriculum.lesson(l.id)))
      }
      const blob = new Blob([out.join('\n')], { type: 'text/markdown' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `course-${subject || 'all'}-${age || 'all-ages'}.md`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e) { setError((e as Error).message) }
    finally { setExporting(false) }
  }

  if (!tree) return <div className="flex justify-center py-24">{error ? <p className="text-red-400 font-nunito text-sm">{error}</p> : <Spinner size={36} />}</div>

  const t = tree.totals
  const pct = t.lessons ? Math.round((t.reviewed / t.lessons) * 100) : 0

  // group visible skills by subject, keeping learning order
  const groups: Array<[string, typeof visible]> = []
  visible.forEach(sk => {
    const g = groups.find(x => x[0] === sk.subject_name)
    if (g) g[1].push(sk); else groups.push([sk.subject_name, [sk]])
  })

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-white font-nunito">Course Review</h1>
        <p className="text-slate-400 font-nunito text-xs">Read exactly what children are taught and asked, in learning order, with the correct answers and how children actually do. Sign each lesson off once you are happy with it.</p>
      </div>

      <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-4 mb-5">
        <div className="flex flex-wrap items-center gap-4 mb-2">
          <p className="text-white font-nunito font-bold text-sm flex-1">{t.reviewed} of {t.lessons} lessons reviewed ({pct}%)</p>
          {t.changed > 0 && <span className="text-yellow-300 font-nunito text-xs flex items-center gap-1"><AlertTriangle size={13} /> {t.changed} changed since review</span>}
          <span className="text-slate-500 font-nunito text-xs">{t.unreviewed} not reviewed</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-[#4ade80]" style={{ width: `${pct}%` }} /></div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <button onClick={() => setSubject('')} className={`px-3 py-2 rounded-xl text-sm font-nunito font-bold border ${!subject ? 'bg-[#4ade80] text-[#1a1f2e] border-[#4ade80]' : 'border-white/20 text-slate-300'}`}>All subjects</button>
        {subjects.map(([slug, name]) => (
          <button key={slug} onClick={() => setSubject(slug === subject ? '' : slug)} className={`px-3 py-2 rounded-xl text-sm font-nunito font-bold border ${subject === slug ? 'bg-[#4ade80] text-[#1a1f2e] border-[#4ade80]' : 'border-white/20 text-slate-300 hover:border-white/40'}`}>{name}</button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <select value={age} onChange={e => setAge(e.target.value)} className="bg-[#1a1f2e] border border-white/10 rounded-xl px-3 py-2 text-white font-nunito text-sm">
          <option value="">All ages</option>{AGES.map(a => <option key={a} value={a}>Ages {a}</option>)}
        </select>
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find a skill or lesson" className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-white font-nunito text-sm" />
        </div>
        <label className="flex items-center gap-2 text-slate-300 font-nunito text-sm"><input type="checkbox" checked={needsReview} onChange={e => setNeedsReview(e.target.checked)} /> Needs review</label>
        <button onClick={exportCourse} disabled={exporting || visible.length === 0} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 font-nunito font-semibold text-sm disabled:opacity-40">
          {exporting ? <Spinner size={14} /> : <Download size={14} />} Export these as a document
        </button>
      </div>
      {error && <p className="text-red-400 font-nunito text-sm mb-3">{error}</p>}

      {groups.map(([subjectName, skills]) => (
        <div key={subjectName} className="mb-8">
          <h2 className="text-white font-nunito font-extrabold text-lg mb-3">{subjectName}</h2>
          <div className="space-y-4">
            {skills.map(sk => (
              <div key={sk.slug} className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-4">
                <div className="flex flex-wrap items-start gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-nunito font-bold">{sk.name} <span className="text-slate-500 font-normal text-xs">· ages {sk.age_group} · {sk.strand}</span></p>
                    {sk.prerequisites.length > 0 && <p className="text-slate-500 font-nunito text-xs">Builds on: {sk.prerequisites.join(', ')}</p>}
                    <p className="text-slate-500 font-nunito text-xs mt-0.5">
                      {sk.learners} learner{sk.learners === 1 ? '' : 's'} · {sk.verified} verified
                      {sk.checkpoint_attempts > 0 && <> · checkpoint passed by {sk.checkpoint_pass_rate}% of {sk.checkpoint_attempts} attempt{sk.checkpoint_attempts === 1 ? '' : 's'}</>}
                    </p>
                  </div>
                  <button disabled={busy} onClick={() => review({ skill: sk.slug }, true)} className="text-xs font-nunito font-bold px-3 py-1.5 rounded-lg bg-[#4ade80]/10 text-[#4ade80] hover:bg-[#4ade80]/20 disabled:opacity-40">Mark all reviewed</button>
                </div>

                <div className="space-y-2">
                  {sk.lessons.map(l => {
                    const r = REVIEW[l.review_state]
                    const isOpen = open === l.id
                    return (
                      <div key={l.id} className="border border-white/5 rounded-xl">
                        <button onClick={() => openLesson(l)} className="w-full flex flex-wrap items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03] rounded-xl">
                          {isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-nunito font-semibold text-sm">{l.title}</p>
                            <p className="text-slate-500 font-nunito text-xs">{l.counts.teach} teaching · {l.counts.check} checks · questions {l.counts.t1}/{l.counts.t2}/{l.counts.t3} (easy/core/challenge){l.answers > 0 ? ` · children get ${l.pass_rate}% right (${l.answers} answers)` : ''}</p>
                          </div>
                          <span className={`flex items-center gap-1 text-[11px] font-nunito font-bold px-2 py-1 rounded-full ${r.cls}`}><r.Icon size={12} /> {r.label}</span>
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4">
                            <div className="flex flex-wrap gap-2 pt-1">
                              {l.review_state === 'reviewed'
                                ? <button disabled={busy} onClick={() => review({ lessonId: l.id }, false)} className="text-xs font-nunito font-bold px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 disabled:opacity-40">Withdraw sign-off</button>
                                : <button disabled={busy} onClick={() => review({ lessonId: l.id }, true)} className="text-xs font-nunito font-bold px-3 py-1.5 rounded-lg bg-[#4ade80] text-[#0f1117] disabled:opacity-40">Mark as reviewed</button>}
                              <Link href={`/lesson/${l.id}/play`} target="_blank" className="flex items-center gap-1 text-xs font-nunito font-bold px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-300"><Eye size={13} /> Play it as a child</Link>
                              <Link href={`/admin/lessons/${l.id}/activities`} className="flex items-center gap-1 text-xs font-nunito font-bold px-3 py-1.5 rounded-lg bg-white/5 text-slate-300"><Pencil size={13} /> Edit content</Link>
                              {l.reviewed_at && <span className="text-slate-500 font-nunito text-xs self-center">Signed off {l.reviewed_at.slice(0, 10)}{l.reviewer ? ` by ${l.reviewer}` : ''}</span>}
                            </div>
                            {loadingLesson && !detail ? <div className="py-6 flex justify-center"><Spinner size={24} /></div> : detail && detail.lesson.id === l.id ? <LessonDetail detail={detail} /> : null}
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
      ))}
      {groups.length === 0 && <p className="text-slate-500 font-nunito text-sm text-center py-12">Nothing matches those filters.</p>}
    </div>
  )
}
