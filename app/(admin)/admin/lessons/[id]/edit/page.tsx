'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronLeft, Save, ListOrdered } from 'lucide-react'
import { adminApi, AdminLesson, AdminSubject } from '@/lib/adminApi'
import { Spinner } from '@/components/ui/Spinner'

const AGE_GROUPS   = ['0-5', '6-8', '9-11', '12-14']
const DIFFICULTIES = ['easy', 'medium', 'hard']

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function EditLessonPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()
  const [lesson,   setLesson]   = useState<AdminLesson | null>(null)
  const [subjects, setSubjects] = useState<AdminSubject[]>([])
  const [saving,   setSaving]   = useState(false)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    Promise.all([adminApi.lessons.get(Number(id)), adminApi.subjects.list()])
      .then(([l, ss]) => { setLesson(l); setSubjects(ss) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const toggleAge = (ag: string) => {
    if (!lesson) return
    const cur = lesson.age_groups ?? []
    setLesson({ ...lesson, age_groups: cur.includes(ag) ? cur.filter(a => a !== ag) : [...cur, ag] })
  }

  const handleSave = async () => {
    if (!lesson) return
    setSaving(true)
    setError('')
    try {
      await adminApi.lessons.update(lesson.id, {
        title:      lesson.title,
        slug:       lesson.slug,
        description: lesson.description,
        subject_id:  lesson.subject_id,
        age_groups:  lesson.age_groups,
        difficulty:  lesson.difficulty,
        xp_reward:   lesson.xp_reward,
        order_index: lesson.order_index,
      })
      router.push('/admin/lessons')
    } catch (e) {
      setError((e as Error).message)
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size={36} /></div>
  if (!lesson) return <div className="p-8 text-red-400 font-nunito">{error || 'Lesson not found'}</div>

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/lessons" className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-white font-nunito">Edit Lesson</h1>
          <p className="text-slate-400 font-nunito text-xs">{lesson.title}</p>
        </div>
        <Link
          href={`/admin/lessons/${id}/activities`}
          className="ml-auto flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-nunito font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
        >
          <ListOrdered size={15} /> Activities
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-[#1a1f2e] rounded-2xl border border-white/5 p-6 space-y-5"
      >
        <div>
          <label className="block text-slate-400 font-nunito text-xs uppercase tracking-wider mb-1.5">Lesson Title *</label>
          <input
            className="w-full bg-[#252b3b] border border-white/10 focus:border-[#4ade80] rounded-xl px-4 py-3 text-white font-nunito outline-none transition-colors text-sm"
            value={lesson.title}
            onChange={e => setLesson({ ...lesson, title: e.target.value, slug: slugify(e.target.value) })}
          />
        </div>

        <div>
          <label className="block text-slate-400 font-nunito text-xs uppercase tracking-wider mb-1.5">Slug</label>
          <input
            className="w-full bg-[#252b3b] border border-white/10 focus:border-[#4ade80] rounded-xl px-4 py-3 text-white font-nunito font-mono text-sm outline-none"
            value={lesson.slug}
            onChange={e => setLesson({ ...lesson, slug: slugify(e.target.value) })}
          />
        </div>

        <div>
          <label className="block text-slate-400 font-nunito text-xs uppercase tracking-wider mb-1.5">Description</label>
          <textarea
            rows={3}
            className="w-full bg-[#252b3b] border border-white/10 focus:border-[#4ade80] rounded-xl px-4 py-3 text-white font-nunito text-sm outline-none resize-none"
            value={lesson.description}
            onChange={e => setLesson({ ...lesson, description: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-slate-400 font-nunito text-xs uppercase tracking-wider mb-1.5">Subject *</label>
          <select
            className="w-full bg-[#252b3b] border border-white/10 rounded-xl px-4 py-3 text-white font-nunito text-sm outline-none"
            value={lesson.subject_id}
            onChange={e => setLesson({ ...lesson, subject_id: Number(e.target.value) })}
          >
            <option value={0}>— select —</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-slate-400 font-nunito text-xs uppercase tracking-wider mb-2">Age Groups</label>
          <div className="flex gap-2 flex-wrap">
            {AGE_GROUPS.map(ag => (
              <button
                key={ag} type="button" onClick={() => toggleAge(ag)}
                className={`px-4 py-2 rounded-xl font-nunito font-bold text-sm transition-all ${
                  (lesson.age_groups ?? []).includes(ag)
                    ? 'bg-blue-500/30 border border-blue-400 text-blue-300'
                    : 'bg-[#252b3b] border border-white/10 text-slate-400 hover:border-white/30'
                }`}
              >
                {ag}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-400 font-nunito text-xs uppercase tracking-wider mb-1.5">Difficulty</label>
            <select
              className="w-full bg-[#252b3b] border border-white/10 rounded-xl px-3 py-3 text-white font-nunito text-sm outline-none"
              value={lesson.difficulty}
              onChange={e => setLesson({ ...lesson, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
            >
              {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 font-nunito text-xs uppercase tracking-wider mb-1.5">XP Reward</label>
            <input type="number" min={5} max={200} step={5}
              className="w-full bg-[#252b3b] border border-white/10 rounded-xl px-3 py-3 text-white font-nunito text-sm outline-none"
              value={lesson.xp_reward}
              onChange={e => setLesson({ ...lesson, xp_reward: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-slate-400 font-nunito text-xs uppercase tracking-wider mb-1.5">Order</label>
            <input type="number" min={0}
              className="w-full bg-[#252b3b] border border-white/10 rounded-xl px-3 py-3 text-white font-nunito text-sm outline-none"
              value={lesson.order_index}
              onChange={e => setLesson({ ...lesson, order_index: Number(e.target.value) })}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 font-nunito text-sm">{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-[#4ade80] hover:bg-[#22c55e] disabled:opacity-50 text-[#0f1117] font-extrabold font-nunito text-sm px-6 py-3 rounded-xl transition-colors"
          >
            {saving ? <Spinner size={16} /> : <Save size={16} />}
            Save Changes
          </button>
          <Link href="/admin/lessons" className="flex items-center px-5 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white font-nunito text-sm font-semibold transition-all">
            Cancel
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
