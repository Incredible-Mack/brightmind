'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Pencil, Trash2, ListOrdered, ChevronDown } from 'lucide-react'
import { adminApi, AdminLesson, AdminSubject } from '@/lib/adminApi'
import { Spinner } from '@/components/ui/Spinner'

const DIFF_COLOR: Record<string, string> = {
  easy:   'bg-green-500/20 text-green-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  hard:   'bg-red-500/20 text-red-400',
}

export default function LessonsListPage() {
  const [lessons,  setLessons]  = useState<AdminLesson[]>([])
  const [subjects, setSubjects] = useState<AdminSubject[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [subjectId, setSubjectId] = useState(0)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [loadError, setLoadError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [ls, ss] = await Promise.all([
        adminApi.lessons.list({ subject_id: subjectId || undefined, search: search || undefined }),
        adminApi.subjects.list(),
      ])
      setLessons(ls)
      setSubjects(ss)
    } catch (e) {
      setLoadError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [subjectId, search])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}" and all its activities? This cannot be undone.`)) return
    setDeleting(id)
    await adminApi.lessons.delete(id)
    setLessons(ls => ls.filter(l => l.id !== id))
    setDeleting(null)
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-nunito">Lessons</h1>
          <p className="text-slate-400 font-nunito text-sm">{lessons.length} lessons across all subjects</p>
        </div>
        <Link
          href="/admin/lessons/new"
          className="flex items-center gap-2 bg-[#4ade80] hover:bg-[#22c55e] text-[#0f1117] font-extrabold font-nunito text-sm px-5 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} /> New Lesson
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2 bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 flex-1 min-w-[200px]">
          <Search size={16} className="text-slate-500" />
          <input
            className="bg-transparent text-white font-nunito text-sm outline-none flex-1 placeholder:text-slate-600"
            placeholder="Search lessons..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <select
            value={subjectId}
            onChange={e => setSubjectId(Number(e.target.value))}
            className="appearance-none bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 pr-9 text-white font-nunito text-sm outline-none cursor-pointer"
          >
            <option value={0}>All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={36} /></div>
      ) : loadError ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-6 py-8 text-center">
          <p className="text-red-400 font-nunito font-bold text-sm mb-1">Failed to load lessons</p>
          <p className="text-slate-500 font-nunito text-xs">{loadError}</p>
          <button onClick={load} className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 font-nunito text-sm transition-colors">
            Retry
          </button>
        </div>
      ) : (
        <div className="bg-[#1a1f2e] rounded-2xl border border-white/5 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3 text-slate-500 font-nunito text-xs uppercase tracking-wider">Title</th>
                <th className="text-left px-5 py-3 text-slate-500 font-nunito text-xs uppercase tracking-wider hidden md:table-cell">Subject</th>
                <th className="text-left px-5 py-3 text-slate-500 font-nunito text-xs uppercase tracking-wider hidden lg:table-cell">Age Groups</th>
                <th className="text-left px-5 py-3 text-slate-500 font-nunito text-xs uppercase tracking-wider hidden lg:table-cell">Difficulty</th>
                <th className="text-left px-5 py-3 text-slate-500 font-nunito text-xs uppercase tracking-wider hidden md:table-cell">Acts</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {lessons.map((l, i) => (
                  <motion.tr
                    key={l.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${i === lessons.length - 1 ? 'border-0' : ''}`}
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-white font-nunito font-semibold text-sm">{l.title}</p>
                      <p className="text-slate-600 font-nunito text-xs mt-0.5">{l.slug}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      {l.subject_color ? (
                        <span className="font-nunito text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: `${l.subject_color}20`, color: l.subject_color }}>
                          {l.subject_name}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-nunito text-xs">{l.subject_name ?? '—'}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <div className="flex gap-1 flex-wrap">
                        {(l.age_groups ?? []).map(ag => (
                          <span key={ag} className="bg-blue-500/15 text-blue-300 font-nunito text-xs px-2 py-0.5 rounded-full">{ag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className={`font-nunito text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${DIFF_COLOR[l.difficulty] ?? ''}`}>
                        {l.difficulty}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-slate-400 font-nunito text-sm">{l.activity_count ?? 0}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          href={`/admin/lessons/${l.id}/activities`}
                          title="Manage activities"
                          className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        >
                          <ListOrdered size={15} />
                        </Link>
                        <Link
                          href={`/admin/lessons/${l.id}/edit`}
                          title="Edit lesson"
                          className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        >
                          <Pencil size={15} />
                        </Link>
                        <button
                          onClick={() => handleDelete(l.id, l.title)}
                          disabled={deleting === l.id}
                          title="Delete lesson"
                          className="p-2 rounded-lg hover:bg-red-500/15 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-40"
                        >
                          {deleting === l.id ? <Spinner size={15} /> : <Trash2 size={15} />}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {!loading && lessons.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-slate-500 font-nunito">
                    No lessons found. <Link href="/admin/lessons/new" className="text-[#4ade80] hover:underline">Create one →</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
