'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { adminApi, type AdminSkillCoverage } from '@/lib/adminApi'
import { Spinner } from '@/components/ui/Spinner'

const AGES = ['0-5', '6-8', '9-11', '12-14']

export default function CoveragePage() {
  const [data, setData] = useState<AdminSkillCoverage | null>(null)
  const [error, setError] = useState('')
  const [onlyProblems, setOnlyProblems] = useState(false)
  const [age, setAge] = useState('')

  useEffect(() => { adminApi.skills.coverage().then(setData).catch(e => setError((e as Error).message)) }, [])

  if (!data) return <div className="flex justify-center py-24">{error ? <p className="text-red-400 font-nunito text-sm">{error}</p> : <Spinner size={36} />}</div>

  const subjects = Array.from(new Map(data.matrix.map(m => [m.subject_slug, m.subject_name])).entries())
  const cell = (slug: string, a: string) => data.matrix.find(m => m.subject_slug === slug && m.age_group === a)
  const skills = data.skills.filter(s => (!onlyProblems || s.issues.length) && (!age || s.age_group === age))

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white font-nunito">Curriculum Coverage</h1>
        <p className="text-slate-400 font-nunito text-xs">Where the learning path is rich and where it is thin. Add content to any red cell so the adaptive engine has enough to choose from.</p>
      </div>

      <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-5 mb-6 overflow-x-auto">
        <table className="w-full text-sm font-nunito">
          <thead><tr className="text-slate-500 text-xs text-left"><th className="pb-3">Subject</th>{AGES.map(a => <th key={a} className="pb-3 text-center">Ages {a}</th>)}</tr></thead>
          <tbody>
            {subjects.map(([slug, name]) => (
              <tr key={slug} className="border-t border-white/5">
                <td className="py-3 text-white font-semibold">{name}</td>
                {AGES.map(a => {
                  const c = cell(slug, a)
                  const thin = !c || c.lessons < 2 || c.practice < 20
                  return (
                    <td key={a} className="py-3 text-center">
                      {c ? <div className={`inline-block rounded-lg px-3 py-1.5 text-xs ${thin ? 'bg-red-500/15 text-red-300' : 'bg-[#4ade80]/10 text-[#4ade80]'}`}>{c.skills} skills · {c.lessons} lessons<br /><span className="opacity-70">{c.practice} questions</span></div>
                        : <span className="inline-block rounded-lg px-3 py-1.5 text-xs bg-red-500/15 text-red-300">Nothing yet</span>}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.untagged_lessons.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 mb-6">
          <p className="text-yellow-300 font-nunito font-bold text-sm flex items-center gap-2"><AlertTriangle size={15} /> Lessons not linked to a skill</p>
          <p className="text-slate-400 font-nunito text-xs mb-2">These still work, but the engine cannot learn from them or recommend them. Open the lesson to set its skill.</p>
          <div className="flex flex-wrap gap-2">{data.untagged_lessons.map(l => <Link key={l.id} href={`/admin/lessons/${l.id}/edit`} className="text-xs font-nunito text-slate-200 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg">{l.title}</Link>)}</div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h2 className="text-white font-nunito font-bold flex-1">Skills ({skills.length})</h2>
        <select value={age} onChange={e => setAge(e.target.value)} className="bg-[#1a1f2e] border border-white/10 rounded-xl px-3 py-2 text-white font-nunito text-sm">
          <option value="">All ages</option>{AGES.map(a => <option key={a} value={a}>Ages {a}</option>)}
        </select>
        <label className="flex items-center gap-2 text-slate-300 font-nunito text-sm"><input type="checkbox" checked={onlyProblems} onChange={e => setOnlyProblems(e.target.checked)} /> Only skills with problems ({data.problems.length})</label>
      </div>

      <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl overflow-x-auto">
        <table className="w-full text-xs font-nunito">
          <thead><tr className="text-slate-500 text-left border-b border-white/5">
            <th className="px-4 py-3">Skill</th><th>Age</th><th>Lessons</th><th>Teach</th><th>Practice (T1/T2/T3)</th><th>Learners</th><th>Mastered</th><th></th>
          </tr></thead>
          <tbody>
            {skills.map(s => (
              <tr key={s.slug} className="border-t border-white/5 text-slate-300 align-top">
                <td className="px-4 py-2.5"><p className="text-white font-semibold">{s.name}</p><p className="text-slate-600">{s.subject_name} · {s.strand}</p></td>
                <td>{s.age_group}</td><td>{s.lessons}</td><td>{s.teach}</td>
                <td>{s.practice} <span className="text-slate-500">({s.t1}/{s.t2}/{s.t3})</span></td>
                <td>{s.learners}</td><td>{s.mastered}</td>
                <td className="pr-4">{s.issues.length === 0 ? <CheckCircle2 size={15} className="text-[#4ade80]" /> : <div className="text-red-300 space-y-0.5">{s.issues.map((i, k) => <p key={k}>{i}</p>)}</div>}</td>
              </tr>
            ))}
            {skills.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-slate-500">Nothing to show.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
