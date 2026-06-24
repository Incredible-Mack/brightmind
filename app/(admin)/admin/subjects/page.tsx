'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Check } from 'lucide-react'
import { adminApi, AdminSubject } from '@/lib/adminApi'
import { Spinner } from '@/components/ui/Spinner'

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<AdminSubject[]>([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')

  const [slug,  setSlug]  = useState('')
  const [name,  setName]  = useState('')
  const [desc,  setDesc]  = useState('')
  const [icon,  setIcon]  = useState('📚')
  const [color, setColor] = useState('#6366f1')

  useEffect(() => {
    adminApi.subjects.list().then(setSubjects).finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!slug || !name) { setError('Slug and name are required'); return }
    setSaving(true); setError(''); setSuccess('')
    try {
      const { id } = await adminApi.subjects.create({ slug, name, description: desc, icon, color })
      setSubjects(prev => [...prev, { id, slug, name, description: desc, icon, color }])
      setSlug(''); setName(''); setDesc(''); setIcon('📚'); setColor('#6366f1')
      setSuccess('Subject created!')
    } catch (e) { setError((e as Error).message) }
    finally { setSaving(false) }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white font-nunito">Subjects</h1>
        <p className="text-slate-400 font-nunito text-xs">Manage the top-level subjects for lessons</p>
      </div>

      {/* Existing subjects */}
      {loading ? <div className="flex justify-center py-10"><Spinner size={32} /></div> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {subjects.map(s => (
            <motion.div key={s.id}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${s.color}20` }}>
                {s.icon}
              </div>
              <div>
                <p className="text-white font-nunito font-bold text-sm">{s.name}</p>
                <p className="text-slate-500 font-nunito text-xs">{s.slug}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create new */}
      <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-6">
        <h2 className="text-white font-nunito font-bold text-base mb-4">Create New Subject</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Name *</label>
              <input className="field" placeholder="Mathematics" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Slug *</label>
              <input className="field font-mono" placeholder="math" value={slug} onChange={e => setSlug(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="field-label">Description</label>
            <input className="field" placeholder="Numbers, shapes, and problem solving" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Icon (emoji)</label>
              <input className="field text-2xl" placeholder="🔢" value={icon} onChange={e => setIcon(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Color (hex)</label>
              <div className="flex items-center gap-2">
                <input type="color" value={color} onChange={e => setColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer p-0.5" />
                <input className="field flex-1" placeholder="#6366f1" value={color} onChange={e => setColor(e.target.value)} />
              </div>
            </div>
          </div>

          {error   && <p className="text-red-400 font-nunito text-sm">{error}</p>}
          {success && <p className="text-green-400 font-nunito text-sm flex items-center gap-1"><Check size={14} /> {success}</p>}

          <button
            onClick={handleCreate} disabled={saving}
            className="flex items-center gap-2 bg-[#4ade80] hover:bg-[#22c55e] disabled:opacity-50 text-[#0f1117] font-extrabold font-nunito text-sm px-6 py-3 rounded-xl transition-colors"
          >
            {saving ? <Spinner size={16} /> : <Plus size={16} />}
            Create Subject
          </button>
        </div>
      </div>
    </div>
  )
}
