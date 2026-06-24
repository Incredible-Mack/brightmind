'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, Plus, Trash2, Pencil, Sparkles,
  ChevronUp, ChevronDown, Check, X, Loader2
} from 'lucide-react'
import { adminApi, AdminActivity, AdminLesson } from '@/lib/adminApi'
import { Spinner } from '@/components/ui/Spinner'

const TYPE_COLORS: Record<string, string> = {
  listen:      'bg-blue-500/20 text-blue-300',
  speak:       'bg-green-500/20 text-green-400',
  tap_answer:  'bg-yellow-500/20 text-yellow-300',
  type_answer: 'bg-orange-500/20 text-orange-300',
  drag_drop:   'bg-purple-500/20 text-purple-300',
  video:       'bg-red-500/20 text-red-400',
}

const ACTIVITY_TYPES = ['listen','speak','tap_answer','type_answer'] as const
type ActivityType = typeof ACTIVITY_TYPES[number]

function contentPreview(act: AdminActivity): string {
  const c = act.content
  if (!c) return '—'
  if (c.letter)  return `Letter ${c.letter} — ${c.word ?? ''} ${c.visual ?? ''}`
  if (c.number !== undefined) return `Number ${c.number} — ${c.word ?? ''}`
  if (c.question) return String(c.question).slice(0, 80)
  if (c.prompt)   return String(c.prompt).slice(0, 80)
  if (c.text)     return String(c.text).slice(0, 80)
  return JSON.stringify(c).slice(0, 80)
}

// ── Content form by type ──────────────────────────────────────────────────────
function ContentEditor({
  type, content, onChange,
}: {
  type: ActivityType
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const f = (key: string) => String(content[key] ?? '')
  const set = (key: string, val: unknown) => onChange({ ...content, [key]: val })

  if (type === 'listen') return (
    <div className="space-y-3">
      <p className="text-slate-500 font-nunito text-xs">Choose ONE format — letter, number, or plain prompt:</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label">Letter (e.g. A)</label>
          <input className="field" placeholder="A" value={f('letter')} onChange={e => set('letter', e.target.value)} />
        </div>
        <div>
          <label className="field-label">Word (e.g. Apple)</label>
          <input className="field" placeholder="Apple" value={f('word')} onChange={e => set('word', e.target.value)} />
        </div>
        <div>
          <label className="field-label">Visual emoji</label>
          <input className="field" placeholder="🍎" value={f('visual')} onChange={e => set('visual', e.target.value)} />
        </div>
        <div>
          <label className="field-label">Number (e.g. 3)</label>
          <input className="field" type="number" placeholder="3" value={f('number')}
            onChange={e => set('number', e.target.value ? Number(e.target.value) : '')} />
        </div>
      </div>
      <div>
        <label className="field-label">Objects (comma-separated emojis, for number cards)</label>
        <input className="field" placeholder="⚽,⚽,⚽" value={(content.objects as string[] ?? []).join(',')}
          onChange={e => set('objects', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
      </div>
      <div>
        <label className="field-label">Prompt text (for plain / sequence listen)</label>
        <textarea rows={2} className="field resize-none" placeholder="one, two, three, four, five"
          value={f('prompt')} onChange={e => set('prompt', e.target.value)} />
      </div>
      <div>
        <label className="field-label">Audio hint</label>
        <input className="field" placeholder="Count along with me!" value={f('audio_hint')} onChange={e => set('audio_hint', e.target.value)} />
      </div>
    </div>
  )

  if (type === 'tap_answer') return (
    <div className="space-y-3">
      <div>
        <label className="field-label">Question *</label>
        <textarea rows={2} className="field resize-none" placeholder="Which number comes after 3?"
          value={f('question')} onChange={e => set('question', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {['A','B','C','D'].map((opt, i) => (
          <div key={opt}>
            <label className="field-label">Option {opt}</label>
            <input className="field" placeholder={`Choice ${opt}`}
              value={(content.options as string[] ?? [])[i] ?? ''}
              onChange={e => {
                const opts = [...((content.options as string[]) ?? ['','','',''])]
                opts[i] = e.target.value
                set('options', opts)
              }} />
          </div>
        ))}
      </div>
      <div>
        <label className="field-label">Correct answer (must match one option exactly) *</label>
        <input className="field" placeholder="e.g. 4" value={f('correct')} onChange={e => set('correct', e.target.value)} />
      </div>
    </div>
  )

  if (type === 'speak') return (
    <div className="space-y-3">
      <div>
        <label className="field-label">Instruction shown to child *</label>
        <input className="field" placeholder="Say the number FIVE out loud!" value={f('prompt')} onChange={e => set('prompt', e.target.value)} />
      </div>
      <div>
        <label className="field-label">Expected answer (what child should say) *</label>
        <input className="field" placeholder="five" value={f('expected')} onChange={e => set('expected', e.target.value)} />
      </div>
      <div>
        <label className="field-label">Hint (shown after 2 wrong attempts)</label>
        <input className="field" placeholder="Hold up five fingers and say FIVE!" value={f('hint')} onChange={e => set('hint', e.target.value)} />
      </div>
    </div>
  )

  if (type === 'type_answer') return (
    <div className="space-y-3">
      <div>
        <label className="field-label">Question / Instruction *</label>
        <textarea rows={2} className="field resize-none" placeholder="Spell the word for 🐶"
          value={f('question')} onChange={e => set('question', e.target.value)} />
      </div>
      <div>
        <label className="field-label">Expected answer (exact spelling) *</label>
        <input className="field" placeholder="dog" value={f('expected')} onChange={e => set('expected', e.target.value)} />
      </div>
    </div>
  )

  return (
    <div>
      <label className="field-label">Raw JSON content</label>
      <textarea rows={5} className="field font-mono text-xs resize-none"
        value={JSON.stringify(content, null, 2)}
        onChange={e => { try { onChange(JSON.parse(e.target.value)) } catch { /* ignore parse errors mid-type */ } }}
      />
    </div>
  )
}

// ── Add / Edit activity row ───────────────────────────────────────────────────
function ActivityForm({
  lessonId, lesson, nextOrder, onSaved, editActivity, onCancelEdit,
}: {
  lessonId: number
  lesson: AdminLesson | null
  nextOrder: number
  onSaved: (a: AdminActivity) => void
  editActivity?: AdminActivity | null
  onCancelEdit?: () => void
}) {
  const [type,     setType]     = useState<ActivityType>((editActivity?.type as ActivityType) ?? 'listen')
  const [order,    setOrder]    = useState(editActivity?.order_index ?? nextOrder)
  const [xp,       setXp]       = useState(editActivity?.xp_value ?? 5)
  const [content,  setContent]  = useState<Record<string, unknown>>(editActivity?.content ?? {})
  const [saving,   setSaving]   = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error,    setError]    = useState('')

  const subject = lesson?.subject_name ?? 'General'
  const ageGroup = (lesson?.age_groups ?? ['6-8'])[0]

  const handleAIGenerate = async () => {
    setAiLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonTitle: lesson?.title ?? 'Lesson',
          subject, ageGroup, activityType: type, count: 1,
        }),
      })
      const { activities, error: aiErr } = await res.json()
      if (aiErr) throw new Error(aiErr)
      if (activities?.[0]) {
        setContent(activities[0].content)
        setXp(activities[0].xp_value ?? 5)
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setAiLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      if (editActivity) {
        await adminApi.activities.update(editActivity.id, { type, order_index: order, xp_value: xp, content })
        onSaved({ ...editActivity, type, order_index: order, xp_value: xp, content })
      } else {
        const { id } = await adminApi.activities.create({ lesson_id: lessonId, type, order_index: order, xp_value: xp, content })
        onSaved({ id, lesson_id: lessonId, type, order_index: order, xp_value: xp, content })
      }
    } catch (e) {
      setError((e as Error).message)
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-[#1e2433] border border-[#4ade80]/20 rounded-2xl p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-white font-nunito font-bold text-sm">{editActivity ? 'Edit Activity' : 'Add New Activity'}</h3>
        <button
          type="button" onClick={handleAIGenerate} disabled={aiLoading}
          className="flex items-center gap-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 font-nunito font-bold text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          Generate with AI
        </button>
      </div>

      {/* Type + Order + XP */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="field-label">Type *</label>
          <select className="field" value={type} onChange={e => { setType(e.target.value as ActivityType); setContent({}) }}>
            {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Order</label>
          <input type="number" className="field" value={order} onChange={e => setOrder(Number(e.target.value))} />
        </div>
        <div>
          <label className="field-label">XP Value</label>
          <input type="number" min={1} max={20} className="field" value={xp} onChange={e => setXp(Number(e.target.value))} />
        </div>
      </div>

      {/* Content form */}
      <ContentEditor type={type} content={content} onChange={setContent} />

      {error && <p className="text-red-400 font-nunito text-xs">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-[#4ade80] hover:bg-[#22c55e] disabled:opacity-50 text-[#0f1117] font-extrabold font-nunito text-xs px-4 py-2 rounded-lg transition-colors"
        >
          {saving ? <Spinner size={13} /> : <Check size={13} />}
          {editActivity ? 'Update' : 'Add Activity'}
        </button>
        {onCancelEdit && (
          <button onClick={onCancelEdit} className="flex items-center gap-1.5 text-slate-500 hover:text-white font-nunito text-xs px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
            <X size={13} /> Cancel
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ── Bulk AI generation ────────────────────────────────────────────────────────
function BulkAIPanel({ lesson, activities, onAdded }: {
  lesson: AdminLesson | null
  activities: AdminActivity[]
  onAdded: (acts: AdminActivity[]) => void
}) {
  const [type,    setType]    = useState<ActivityType>('listen')
  const [count,   setCount]   = useState(3)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const generate = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonTitle: lesson?.title ?? 'Lesson',
          subject: lesson?.subject_name ?? 'General',
          ageGroup: (lesson?.age_groups ?? ['6-8'])[0],
          activityType: type, count,
          existingContent: activities.map(a => ({ type: a.type, content: a.content })),
        }),
      })
      const { activities: aiActs, error: aiErr } = await res.json()
      if (aiErr) throw new Error(aiErr)

      const nextOrder = activities.length + 1
      const created: AdminActivity[] = []
      for (let i = 0; i < aiActs.length; i++) {
        const a = aiActs[i]
        const { id } = await adminApi.activities.create({
          lesson_id:   lesson!.id,
          type:        a.type,
          order_index: nextOrder + i,
          xp_value:    a.xp_value,
          content:     a.content,
        })
        created.push({ id, lesson_id: lesson!.id, type: a.type, order_index: nextOrder + i, xp_value: a.xp_value, content: a.content })
      }
      onAdded(created)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-purple-500/10 border border-purple-500/25 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-purple-400" />
        <h3 className="text-purple-300 font-nunito font-bold text-sm">Bulk Generate Activities with AI</h3>
      </div>
      <p className="text-slate-500 font-nunito text-xs mb-4">
        Claude will generate pedagogically sound activities for this lesson, avoiding duplicates with what you already have.
      </p>
      <div className="flex gap-3 flex-wrap items-end">
        <div>
          <label className="field-label text-purple-400/70">Activity Type</label>
          <select className="field bg-purple-500/10 border-purple-500/30 text-purple-200" value={type} onChange={e => setType(e.target.value as ActivityType)}>
            {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label text-purple-400/70">Count</label>
          <select className="field bg-purple-500/10 border-purple-500/30 text-purple-200" value={count} onChange={e => setCount(Number(e.target.value))}>
            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <button
          onClick={generate} disabled={loading}
          className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-nunito font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          {loading ? 'Generating…' : `Generate ${count} Activities`}
        </button>
      </div>
      {error && <p className="text-red-400 font-nunito text-xs mt-3">{error}</p>}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ActivitiesPage() {
  const { id } = useParams<{ id: string }>()
  const lessonId = Number(id)

  const [lesson,     setLesson]     = useState<AdminLesson | null>(null)
  const [activities, setActivities] = useState<AdminActivity[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [editAct,    setEditAct]    = useState<AdminActivity | null>(null)
  const [deleting,   setDeleting]   = useState<number | null>(null)
  const [loadError,  setLoadError]  = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [l, acts] = await Promise.all([
        adminApi.lessons.get(lessonId),
        adminApi.activities.list(lessonId),
      ])
      setLesson(l)
      setActivities(acts)
    } catch (e) {
      setLoadError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [lessonId])

  useEffect(() => { load() }, [load])

  const handleSaved = (a: AdminActivity) => {
    if (editAct) {
      setActivities(prev => prev.map(p => p.id === a.id ? a : p))
      setEditAct(null)
    } else {
      setActivities(prev => [...prev, a])
      setShowForm(false)
    }
  }

  const handleBulkAdded = (acts: AdminActivity[]) => {
    setActivities(prev => [...prev, ...acts])
  }

  const handleDelete = async (act: AdminActivity) => {
    if (!confirm('Delete this activity?')) return
    setDeleting(act.id)
    await adminApi.activities.delete(act.id)
    setActivities(prev => prev.filter(a => a.id !== act.id))
    setDeleting(null)
  }

  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= activities.length) return
    const updated = [...activities]
    const [a, b]  = [updated[i], updated[j]]
    updated[i] = { ...b, order_index: a.order_index }
    updated[j] = { ...a, order_index: b.order_index }
    setActivities(updated)
    await Promise.all([
      adminApi.activities.update(updated[i].id, { order_index: updated[i].order_index }),
      adminApi.activities.update(updated[j].id, { order_index: updated[j].order_index }),
    ])
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size={36} /></div>
  if (loadError) return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-6 py-8 text-center">
        <p className="text-red-400 font-nunito font-bold text-sm mb-1">Failed to load activities</p>
        <p className="text-slate-500 font-nunito text-xs">{loadError}</p>
        <button onClick={load} className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 font-nunito text-sm transition-colors">Retry</button>
      </div>
    </div>
  )

  const sorted = [...activities].sort((a, b) => a.order_index - b.order_index)

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/lessons" className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-white font-nunito">{lesson?.title}</h1>
          <p className="text-slate-400 font-nunito text-xs">{sorted.length} activities · {lesson?.subject_name} · {(lesson?.age_groups ?? []).join(', ')}</p>
        </div>
        <Link href={`/admin/lessons/${lessonId}/edit`} className="flex items-center gap-2 text-slate-400 hover:text-white font-nunito text-sm px-3 py-2 rounded-xl hover:bg-white/10 transition-colors">
          <Pencil size={14} /> Edit lesson
        </Link>
      </div>

      {/* Bulk AI */}
      <div className="mb-6">
        <BulkAIPanel lesson={lesson} activities={activities} onAdded={handleBulkAdded} />
      </div>

      {/* Activity list */}
      <div className="space-y-3 mb-6">
        <AnimatePresence>
          {sorted.map((act, i) => (
            <motion.div
              key={act.id}
              layout
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            >
              {editAct?.id === act.id ? (
                <ActivityForm
                  lessonId={lessonId} lesson={lesson}
                  nextOrder={sorted.length + 1}
                  onSaved={handleSaved}
                  editActivity={editAct}
                  onCancelEdit={() => setEditAct(null)}
                />
              ) : (
                <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl px-5 py-4 flex items-start gap-4">
                  {/* Order controls */}
                  <div className="flex flex-col gap-1 mt-1">
                    <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 rounded-lg hover:bg-white/10 text-slate-600 hover:text-white disabled:opacity-20 transition-colors">
                      <ChevronUp size={14} />
                    </button>
                    <span className="text-slate-600 font-nunito text-xs text-center w-5">{act.order_index}</span>
                    <button onClick={() => move(i, 1)} disabled={i === sorted.length - 1} className="p-1 rounded-lg hover:bg-white/10 text-slate-600 hover:text-white disabled:opacity-20 transition-colors">
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-nunito font-bold text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[act.type] ?? ''}`}>
                        {act.type.replace('_', ' ')}
                      </span>
                      <span className="text-slate-600 font-nunito text-xs">{act.xp_value} XP</span>
                    </div>
                    <p className="text-slate-300 font-nunito text-sm truncate">{contentPreview(act)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditAct(act)} className="p-2 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(act)} disabled={deleting === act.id} className="p-2 rounded-lg hover:bg-red-500/15 text-slate-500 hover:text-red-400 transition-colors disabled:opacity-40">
                      {deleting === act.id ? <Spinner size={14} /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add form or button */}
      {showForm ? (
        <ActivityForm
          lessonId={lessonId} lesson={lesson}
          nextOrder={sorted.length + 1}
          onSaved={handleSaved}
          onCancelEdit={() => setShowForm(false)}
        />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-white/10 hover:border-[#4ade80]/40 text-slate-500 hover:text-[#4ade80] font-nunito font-semibold text-sm py-4 rounded-2xl transition-all"
        >
          <Plus size={16} /> Add Activity Manually
        </button>
      )}
    </div>
  )
}
