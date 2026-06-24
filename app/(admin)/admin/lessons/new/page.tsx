'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronLeft, Save, Sparkles, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { adminApi, AdminSubject } from '@/lib/adminApi'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

const AGE_GROUPS = ['0-5', '6-8', '9-11', '12-14']
const DIFFICULTIES = ['easy', 'medium', 'hard']

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function NewLessonPage() {
  const router = useRouter()
  const [subjects, setSubjects] = useState<AdminSubject[]>([])
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  const [title,      setTitle]      = useState('')
  const [slug,       setSlug]       = useState('')
  const [desc,       setDesc]       = useState('')
  const [subjectId,  setSubjectId]  = useState(0)
  const [ageGroups,  setAgeGroups]  = useState<string[]>(['6-8'])
  const [difficulty, setDifficulty] = useState('easy')
  const [xpReward,   setXpReward]   = useState(25)
  const [orderIndex, setOrderIndex] = useState(0)

  useEffect(() => {
    adminApi.subjects.list().then(setSubjects)
  }, [])

  const toggleAge = (ag: string) =>
    setAgeGroups(prev => prev.includes(ag) ? prev.filter(a => a !== ag) : [...prev, ag])

  const handleSave = async () => {
    if (!title.trim() || !slug.trim() || !subjectId) {
      setError('Title, slug and subject are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const { id } = await adminApi.lessons.create({
        title, slug, description: desc, subject_id: subjectId,
        age_groups: ageGroups, difficulty: difficulty as 'easy' | 'medium' | 'hard',
        xp_reward: xpReward, order_index: orderIndex,
      })
      router.push(`/admin/lessons/${id}/activities`)
    } catch (e) {
      setError((e as Error).message)
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/lessons" className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-white font-nunito">New Lesson</h1>
          <p className="text-slate-400 font-nunito text-xs">After saving you can add activities with AI generation</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-[#1a1f2e] rounded-2xl border border-white/5 p-6 space-y-5"
      >
        {/* Title */}
        <div>
          <label className="block text-slate-400 font-nunito text-xs uppercase tracking-wider mb-1.5">Lesson Title *</label>
          <input
            className="w-full bg-[#252b3b] border border-white/10 focus:border-[#4ade80] rounded-xl px-4 py-3 text-white font-nunito outline-none transition-colors text-sm"
            placeholder="e.g. Numbers 1 to 5"
            value={title}
            onChange={e => { setTitle(e.target.value); setSlug(slugify(e.target.value)) }}
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-slate-400 font-nunito text-xs uppercase tracking-wider mb-1.5">Slug (URL key) *</label>
          <input
            className="w-full bg-[#252b3b] border border-white/10 focus:border-[#4ade80] rounded-xl px-4 py-3 text-white font-nunito font-mono text-sm outline-none transition-colors"
            placeholder="numbers-1-to-5"
            value={slug}
            onChange={e => setSlug(slugify(e.target.value))}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-slate-400 font-nunito text-xs uppercase tracking-wider mb-1.5">Description</label>
          <textarea
            rows={3}
            className="w-full bg-[#252b3b] border border-white/10 focus:border-[#4ade80] rounded-xl px-4 py-3 text-white font-nunito text-sm outline-none transition-colors resize-none"
            placeholder="What will children learn in this lesson?"
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
        </div>

        {/* Subject */}
        <div>
          <label className="block text-slate-400 font-nunito text-xs uppercase tracking-wider mb-1.5">Subject *</label>
          <select
            className="w-full bg-[#252b3b] border border-white/10 focus:border-[#4ade80] rounded-xl px-4 py-3 text-white font-nunito text-sm outline-none transition-colors"
            value={subjectId}
            onChange={e => setSubjectId(Number(e.target.value))}
          >
            <option value={0}>— select a subject —</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
          </select>
        </div>

        {/* Age Groups */}
        <div>
          <label className="block text-slate-400 font-nunito text-xs uppercase tracking-wider mb-2">Age Groups *</label>
          <div className="flex gap-2 flex-wrap">
            {AGE_GROUPS.map(ag => (
              <button
                key={ag}
                type="button"
                onClick={() => toggleAge(ag)}
                className={`px-4 py-2 rounded-xl font-nunito font-bold text-sm transition-all ${
                  ageGroups.includes(ag)
                    ? 'bg-blue-500/30 border border-blue-400 text-blue-300'
                    : 'bg-[#252b3b] border border-white/10 text-slate-400 hover:border-white/30'
                }`}
              >
                {ag}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty + XP + Order */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-400 font-nunito text-xs uppercase tracking-wider mb-1.5">Difficulty</label>
            <select
              className="w-full bg-[#252b3b] border border-white/10 rounded-xl px-3 py-3 text-white font-nunito text-sm outline-none"
              value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
            >
              {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 font-nunito text-xs uppercase tracking-wider mb-1.5">XP Reward</label>
            <input
              type="number" min={5} max={200} step={5}
              className="w-full bg-[#252b3b] border border-white/10 rounded-xl px-3 py-3 text-white font-nunito text-sm outline-none"
              value={xpReward}
              onChange={e => setXpReward(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-slate-400 font-nunito text-xs uppercase tracking-wider mb-1.5">Order</label>
            <input
              type="number" min={0}
              className="w-full bg-[#252b3b] border border-white/10 rounded-xl px-3 py-3 text-white font-nunito text-sm outline-none"
              value={orderIndex}
              onChange={e => setOrderIndex(Number(e.target.value))}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 font-nunito text-sm">{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-[#4ade80] hover:bg-[#22c55e] disabled:opacity-50 text-[#0f1117] font-extrabold font-nunito text-sm px-6 py-3 rounded-xl transition-colors"
          >
            {saving ? <Spinner size={16} /> : <Save size={16} />}
            Save & Add Activities
          </button>
          <Link href="/admin/lessons" className="flex items-center px-5 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/30 font-nunito text-sm font-semibold transition-all">
            Cancel
          </Link>
        </div>
      </motion.div>

      {/* AI Hint */}
      <div className="mt-5 flex items-start gap-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
        <Sparkles size={16} className="text-purple-400 mt-0.5 flex-shrink-0" />
        <p className="text-purple-300 font-nunito text-xs leading-relaxed">
          <span className="font-bold">AI tip:</span> After creating the lesson, you'll be taken to the Activities page where you can generate complete activities using Claude AI — just pick the type and hit "Generate with AI".
        </p>
      </div>
    </div>
  )
}
