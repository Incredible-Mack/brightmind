'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Check, Pencil, Trash2, X, BookOpen, AlertCircle } from 'lucide-react'
import { adminApi, AdminSubject } from '@/lib/adminApi'
import { Spinner } from '@/components/ui/Spinner'

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<AdminSubject[]>([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')

  // Edit / create form state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [slug,  setSlug]  = useState('')
  const [name,  setName]  = useState('')
  const [desc,  setDesc]  = useState('')
  const [icon,  setIcon]  = useState('📚')
  const [color, setColor] = useState('#6366f1')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.subjects.list()
      setSubjects(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const startEdit = (s: AdminSubject) => {
    setEditingId(s.id)
    setSlug(s.slug)
    setName(s.name)
    setDesc(s.description || '')
    setIcon(s.icon || '📚')
    setColor(s.color || '#6366f1')
    setError('')
    setSuccess('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setSlug('')
    setName('')
    setDesc('')
    setIcon('📚')
    setColor('#6366f1')
    setError('')
    setSuccess('')
  }

  const handleSubmit = async () => {
    if (!slug.trim() || !name.trim()) { setError('Slug and name are required'); return }
    setSaving(true); setError(''); setSuccess('')
    try {
      if (editingId) {
        await adminApi.subjects.update(editingId, { slug, name, description: desc, icon, color })
        setSubjects(prev => prev.map(s => s.id === editingId ? { ...s, slug, name, description: desc, icon, color } : s))
        setSuccess('Subject updated successfully!')
        cancelEdit()
      } else {
        const { id } = await adminApi.subjects.create({ slug, name, description: desc, icon, color })
        setSubjects(prev => [...prev, { id, slug, name, description: desc, icon, color, lesson_count: 0 }])
        setSuccess('Subject created successfully!')
        cancelEdit()
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (s: AdminSubject) => {
    const hasLessons = (s.lesson_count ?? 0) > 0
    const msg = hasLessons
      ? `Subject "${s.name}" currently has ${s.lesson_count} lesson(s). Deleting it will also remove all its lessons! Are you sure you want to proceed?`
      : `Are you sure you want to delete subject "${s.name}"?`
    
    if (!confirm(msg)) return

    setDeletingId(s.id)
    setError('')
    setSuccess('')
    try {
      await adminApi.subjects.remove(s.id, hasLessons)
      setSubjects(prev => prev.filter(item => item.id !== s.id))
      setSuccess(`Subject "${s.name}" was removed.`)
      if (editingId === s.id) cancelEdit()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-nunito">Subjects & Curriculum Tracks</h1>
          <p className="text-slate-400 font-nunito text-xs">Manage all academic categories, visual themes, and lesson tracks</p>
        </div>
        {editingId && (
          <button
            onClick={cancelEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-nunito text-xs font-bold transition-colors"
          >
            <Plus size={14} /> New Subject
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-500/15 border border-red-500/30 text-red-300 px-4 py-3 rounded-2xl flex items-center gap-2 font-nunito text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-2xl flex items-center gap-2 font-nunito text-sm">
          <Check size={16} className="flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Existing subjects list */}
      {loading ? (
        <div className="flex justify-center py-10"><Spinner size={32} /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {subjects.map(s => {
            const isEditing = editingId === s.id
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-[#1a1f2e] border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                  isEditing ? 'border-[#4ade80] ring-1 ring-[#4ade80]' : 'border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm"
                      style={{ background: `${s.color}25`, border: `1.5px solid ${s.color}50` }}
                    >
                      {s.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-nunito font-extrabold text-sm truncate">{s.name}</p>
                      <p className="text-slate-400 font-nunito text-xs font-mono truncate">{s.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(s)}
                      title="Edit subject"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(s)}
                      disabled={deletingId === s.id}
                      title="Delete subject"
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                    >
                      {deletingId === s.id ? <Spinner size={13} /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>

                {s.description && (
                  <p className="text-slate-400 font-nunito text-xs line-clamp-2 mb-3">
                    {s.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] font-nunito text-slate-400">
                  <span className="flex items-center gap-1">
                    <BookOpen size={12} className="text-slate-500" />
                    <span>{s.lesson_count ?? 0} lessons</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="font-mono">{s.color}</span>
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Form */}
      <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-nunito font-extrabold text-base flex items-center gap-2">
            {editingId ? (
              <>
                <Pencil size={16} className="text-[#4ade80]" />
                <span>Edit Subject #{editingId}</span>
              </>
            ) : (
              <>
                <Plus size={16} className="text-[#4ade80]" />
                <span>Create New Subject</span>
              </>
            )}
          </h2>
          {editingId && (
            <button
              onClick={cancelEdit}
              className="text-slate-400 hover:text-white text-xs font-nunito flex items-center gap-1"
            >
              <X size={14} /> Cancel Edit
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label text-slate-300 font-nunito text-xs uppercase tracking-wider mb-1 block">Subject Name *</label>
              <input
                className="w-full bg-[#252b3b] border border-white/10 focus:border-[#4ade80] rounded-xl px-4 py-2.5 text-white font-nunito text-sm outline-none transition-colors"
                placeholder="e.g. Science & Discovery"
                value={name}
                onChange={e => {
                  setName(e.target.value)
                  if (!editingId && !slug) {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
                  }
                }}
              />
            </div>
            <div>
              <label className="field-label text-slate-300 font-nunito text-xs uppercase tracking-wider mb-1 block">URL Slug *</label>
              <input
                className="w-full bg-[#252b3b] border border-white/10 focus:border-[#4ade80] rounded-xl px-4 py-2.5 text-white font-nunito font-mono text-sm outline-none transition-colors"
                placeholder="science"
                value={slug}
                onChange={e => setSlug(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="field-label text-slate-300 font-nunito text-xs uppercase tracking-wider mb-1 block">Description</label>
            <input
              className="w-full bg-[#252b3b] border border-white/10 focus:border-[#4ade80] rounded-xl px-4 py-2.5 text-white font-nunito text-sm outline-none transition-colors"
              placeholder="Explore experiments, nature, space, and living things"
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label text-slate-300 font-nunito text-xs uppercase tracking-wider mb-1 block">Icon Emoji</label>
              <input
                className="w-full bg-[#252b3b] border border-white/10 focus:border-[#4ade80] rounded-xl px-4 py-2 text-white font-nunito text-2xl outline-none transition-colors"
                placeholder="🔬"
                value={icon}
                onChange={e => setIcon(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label text-slate-300 font-nunito text-xs uppercase tracking-wider mb-1 block">Brand Color (Hex)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="w-10 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer p-0.5"
                />
                <input
                  className="flex-1 bg-[#252b3b] border border-white/10 focus:border-[#4ade80] rounded-xl px-4 py-2.5 text-white font-nunito font-mono text-sm outline-none transition-colors"
                  placeholder="#6366f1"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 bg-[#4ade80] hover:bg-[#22c55e] disabled:opacity-50 text-[#0f1117] font-extrabold font-nunito text-sm px-6 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              {saving ? <Spinner size={16} /> : editingId ? <Check size={16} /> : <Plus size={16} />}
              <span>{editingId ? 'Save Changes' : 'Create Subject'}</span>
            </button>
            {editingId && (
              <button
                onClick={cancelEdit}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-nunito font-bold text-sm rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
