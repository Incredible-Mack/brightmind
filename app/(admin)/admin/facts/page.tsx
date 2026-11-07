'use client'
import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lightbulb,
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Sparkles,
  X,
  Volume2,
  ChevronRight,
  Palette,
  Power
} from 'lucide-react'
import { adminApi } from '@/lib/adminApi'
import type { WonderFact } from '@/lib/api'
import { Spinner } from '@/components/ui/Spinner'

const SUBJECT_OPTIONS = [
  { slug: 'all', label: 'All Subjects (Universal)' },
  { slug: 'english', label: 'English & Phonics' },
  { slug: 'math', label: 'Mathematics' },
  { slug: 'science', label: 'Science & Discovery' },
  { slug: 'social-studies', label: 'Social Studies & Geography' },
  { slug: 'creative-arts', label: 'Creative Arts' },
  { slug: 'life-skills', label: 'Life Skills & Habits' },
]

const ILLUSTRATION_OPTIONS = [
  { id: 'heart', label: 'Heart (Anatomy & Love)' },
  { id: 'brain', label: 'Brain (Mind & Genius)' },
  { id: 'bones', label: 'Bones (Body & Health)' },
  { id: 'stardust', label: 'Stardust (Space & Math)' },
  { id: 'books', label: 'Books (Stories & Language)' },
]

const COLOR_PRESETS = [
  { label: 'Purple Dream', accent: '#8b5cf6', bg: 'from-[#f5f3ff] via-[#ede9fe] to-[#fae8ff]', border: 'border-[#c4b5fd]' },
  { label: 'Rose Warmth', accent: '#ec4899', bg: 'from-[#fdf2f8] via-[#fce7f3] to-[#ffe4e6]', border: 'border-[#f9a8d4]' },
  { label: 'Sky Blue', accent: '#0284c7', bg: 'from-[#f0f9ff] via-[#e0f2fe] to-[#eff6ff]', border: 'border-[#bae6fd]' },
  { label: 'Amber Gold', accent: '#d97706', bg: 'from-[#fffbeb] via-[#fef3c7] to-[#fef9c3]', border: 'border-[#fde68a]' },
  { label: 'Emerald Fresh', accent: '#059669', bg: 'from-[#ecfdf5] via-[#d1fae5] to-[#e6fffa]', border: 'border-[#6ee7b7]' },
  { label: 'Cosmic Violet', accent: '#7c3aed', bg: 'from-[#faf5ff] via-[#f3e8ff] to-[#e0e7ff]', border: 'border-[#d8b4fe]' },
]

const DEFAULT_NEW: Partial<WonderFact> = {
  subject_slug: 'all',
  badge: 'Illustrated Wonder Fact',
  title: '',
  fact: '',
  detail: '',
  illustration: 'brain',
  accent_color: '#8b5cf6',
  bg_gradient: 'from-[#f5f3ff] via-[#ede9fe] to-[#fae8ff]',
  border_color: 'border-[#c4b5fd]',
  order_index: 0,
  is_active: true,
}

export default function AdminFactsPage() {
  const [loading, setLoading] = useState(true)
  const [sectionVisible, setSectionVisible] = useState(true)
  const [items, setItems] = useState<WonderFact[]>([])
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all')
  const [togglingVisibility, setTogglingVisibility] = useState(false)
  const [savingItem, setSavingItem] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Partial<WonderFact> | null>(null)

  const loadData = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await adminApi.facts.get()
      setSectionVisible(res.visible)
      setItems(res.items || [])
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredItems = useMemo(() => {
    if (selectedSubjectFilter === 'all') return items
    return items.filter(i => i.subject_slug === selectedSubjectFilter || i.subject_slug === 'all')
  }, [items, selectedSubjectFilter])

  const handleToggleSectionVisibility = async () => {
    setTogglingVisibility(true)
    setMessage(null)
    try {
      const nextVal = !sectionVisible
      const res = await adminApi.facts.toggleVisibility(nextVal)
      setSectionVisible(res.visible)
      setMessage({
        type: 'success',
        text: res.visible
          ? 'Wonder Facts banner is now TURNED ON and visible across lesson pages!'
          : 'Wonder Facts banner is now TURNED OFF and completely hidden from lessons.',
      })
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message })
    } finally {
      setTogglingVisibility(false)
    }
  }

  const handleToggleItemActive = async (item: WonderFact) => {
    setTogglingId(item.id)
    setMessage(null)
    try {
      const nextActive = !item.is_active
      await adminApi.facts.update(item.id, { is_active: nextActive })
      setItems(prev => prev.map(i => (i.id === item.id ? { ...i, is_active: nextActive } : i)))
      setMessage({
        type: 'success',
        text: nextActive
          ? `Fact "${item.title}" turned ON.`
          : `Fact "${item.title}" paused (turned OFF).`,
      })
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message })
    } finally {
      setTogglingId(null)
    }
  }

  const handleOpenAdd = () => {
    setEditingItem({
      ...DEFAULT_NEW,
      subject_slug: selectedSubjectFilter === 'all' ? 'english' : selectedSubjectFilter,
      order_index: items.length,
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item: WonderFact) => {
    setEditingItem({ ...item })
    setIsModalOpen(true)
  }

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem?.title || !editingItem?.fact) {
      setMessage({ type: 'error', text: 'Fact headline title and fact statement are required.' })
      return
    }

    setSavingItem(true)
    setMessage(null)
    try {
      if (editingItem.id) {
        await adminApi.facts.update(editingItem.id, editingItem)
        setMessage({ type: 'success', text: `Fact "${editingItem.title}" updated successfully.` })
      } else {
        await adminApi.facts.create(editingItem)
        setMessage({ type: 'success', text: `New fact "${editingItem.title}" created successfully.` })
      }
      setIsModalOpen(false)
      setEditingItem(null)
      await loadData()
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message })
    } finally {
      setSavingItem(false)
    }
  }

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete the fact "${title}"?`)) return

    setDeletingId(id)
    setMessage(null)
    try {
      await adminApi.facts.delete(id)
      setMessage({ type: 'success', text: `Fact "${title}" deleted successfully.` })
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message })
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size={36} />
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-10 max-w-6xl mx-auto space-y-8 font-nunito">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Lightbulb size={22} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Wonder Facts Manager
            </h1>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1.5">
            Turn wonder facts on or off, edit scientific trivia and human stories, or delete facts from the lessons banner.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/lessons"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs flex items-center gap-2 transition-colors"
          >
            <ExternalLink size={15} />
            <span>View on Lessons</span>
          </a>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-[#4ade80] hover:bg-[#3ec972] text-[#0f1117] font-black text-xs flex items-center gap-2 shadow-lg shadow-[#4ade80]/20 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Wonder Fact</span>
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          }`}
        >
          {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span className="flex-1">{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Master Visibility Switch */}
      <div className={`p-6 sm:p-7 rounded-3xl border-2 transition-all duration-300 ${
        sectionVisible
          ? 'bg-slate-900/60 border-[#4ade80]/30 shadow-lg shadow-[#4ade80]/5'
          : 'bg-slate-900/40 border-rose-500/30'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                sectionVisible ? 'bg-emerald-400/15 text-emerald-400' : 'bg-rose-400/15 text-rose-400'
              }`}>
                {sectionVisible ? '● Turned ON' : '○ Turned OFF'}
              </span>
              <h2 className="text-lg font-black text-white">
                Global Wonder Facts Banner Control
              </h2>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {sectionVisible
                ? 'The Wonder Fact banner is currently active and rotating on /lessons and subject overview pages.'
                : 'The Wonder Fact banner is turned off. It will not appear on any lesson or courses page.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleSectionVisibility}
            disabled={togglingVisibility}
            className={`px-5 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer whitespace-nowrap shadow-md ${
              sectionVisible
                ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30'
                : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {togglingVisibility ? (
              <Spinner size={16} />
            ) : sectionVisible ? (
              <>
                <EyeOff size={16} />
                <span>Turn OFF Wonder Facts</span>
              </>
            ) : (
              <>
                <Eye size={16} />
                <span>Turn ON Wonder Facts</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Subject Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedSubjectFilter('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            selectedSubjectFilter === 'all'
              ? 'bg-[#4ade80] text-[#0f1117]'
              : 'bg-white/5 hover:bg-white/10 text-slate-300'
          }`}
        >
          All Subjects ({items.length})
        </button>
        {SUBJECT_OPTIONS.filter(s => s.slug !== 'all').map((s) => {
          const count = items.filter(i => i.subject_slug === s.slug).length
          return (
            <button
              key={s.slug}
              type="button"
              onClick={() => setSelectedSubjectFilter(s.slug)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedSubjectFilter === s.slug
                  ? 'bg-[#4ade80] text-[#0f1117]'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              {s.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Facts List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <span>Facts in Circulation ({filteredItems.length})</span>
          </h3>
          <span className="text-xs text-slate-400">
            Click &ldquo;Turn Off / On&rdquo; on any individual fact or delete it
          </span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/30 border border-white/5 space-y-3">
            <Lightbulb size={36} className="mx-auto text-slate-600" />
            <h4 className="text-white font-bold">No facts found for this category</h4>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">
              Add your first wonder fact to spark curiosity for kids exploring this subject.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-2 px-4 py-2 rounded-xl bg-[#4ade80] text-[#0f1117] font-bold text-xs"
            >
              Create Wonder Fact
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`w-full rounded-3xl bg-gradient-to-r ${item.bg_gradient || 'from-[#fdf2f8] to-[#ffe4e6]'} p-5 sm:p-6 border-2 ${
                  item.border_color || 'border-[#f9a8d4]'
                } border-b-[5px] shadow-md relative overflow-hidden transition-all duration-200 ${
                  !item.is_active ? 'opacity-60 grayscale-[40%]' : ''
                }`}
              >
                {/* Admin controls top-right */}
                <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                  <button
                    type="button"
                    onClick={() => handleToggleItemActive(item)}
                    disabled={togglingId === item.id}
                    title={item.is_active ? 'Turn Off / Pause' : 'Turn On / Activate'}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                      item.is_active
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-slate-700 hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <Power size={13} />
                    <span>{item.is_active ? 'Turned ON' : 'Turned OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    title="Edit Fact"
                    className="p-2 rounded-xl bg-white/90 hover:bg-white text-slate-700 transition-colors cursor-pointer shadow-xs"
                  >
                    <Edit2 size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id, item.title)}
                    disabled={deletingId === item.id}
                    title="Delete Fact"
                    className="p-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 transition-colors cursor-pointer shadow-xs"
                  >
                    {deletingId === item.id ? <Spinner size={14} /> : <Trash2 size={14} />}
                  </button>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 pr-0 md:pr-44">
                  {/* Subject & Badge */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/90 border border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-600">
                        {item.subject_slug.toUpperCase()}
                      </span>
                      <span
                        className="px-2.5 py-0.5 rounded-full bg-white/90 border border-slate-200 text-[11px] font-black"
                        style={{ color: item.accent_color || '#8b5cf6' }}
                      >
                        ✨ {item.badge}
                      </span>
                      {!item.is_active && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-900/80 text-amber-300 text-[10px] font-black uppercase">
                          Paused
                        </span>
                      )}
                    </div>

                    <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
                      {item.title}
                    </h4>

                    <p className="text-sm font-black text-slate-800 leading-relaxed">
                      {item.fact}
                    </p>

                    {item.detail && (
                      <p className="text-xs font-bold text-slate-600 leading-normal">
                        💡 {item.detail}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Add / Edit Wonder Fact */}
      <AnimatePresence>
        {isModalOpen && editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-2xl bg-[#141824] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <Lightbulb size={20} className="text-amber-400" />
                  <h3 className="text-lg font-black text-white">
                    {editingItem.id ? 'Edit Wonder Fact' : 'Add New Wonder Fact'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveModal} className="space-y-5">
                {/* Subject and Illustration Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Subject Category *
                    </label>
                    <select
                      value={editingItem.subject_slug || 'all'}
                      onChange={(e) => setEditingItem({ ...editingItem, subject_slug: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm focus:border-[#4ade80] focus:outline-none"
                    >
                      {SUBJECT_OPTIONS.map((opt) => (
                        <option key={opt.slug} value={opt.slug} className="bg-slate-900 text-white">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      3D Mascot Illustration *
                    </label>
                    <select
                      value={editingItem.illustration || 'brain'}
                      onChange={(e) => setEditingItem({ ...editingItem, illustration: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm focus:border-[#4ade80] focus:outline-none"
                    >
                      {ILLUSTRATION_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id} className="bg-slate-900 text-white">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Badge and Title */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Badge Pill Tag *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingItem.badge || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, badge: e.target.value })}
                      placeholder="e.g. Human Connection, Space Wonder"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 font-bold text-sm focus:border-[#4ade80] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Headline Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingItem.title || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                      placeholder="e.g. The Global Word for 'Mama' 👶🌍"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 font-bold text-sm focus:border-[#4ade80] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Main Fact Text */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Fact Statement (Spoken out loud by voice) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={editingItem.fact || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, fact: e.target.value })}
                    placeholder="Almost every human language on Earth uses the 'M' and 'B' sounds..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 font-bold text-sm focus:border-[#4ade80] focus:outline-none leading-relaxed"
                  />
                </div>

                {/* Detail Text */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Detail / &ldquo;Did you know?&rdquo; Extra Context
                  </label>
                  <textarea
                    rows={2}
                    value={editingItem.detail || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, detail: e.target.value })}
                    placeholder="Whether you say 'Mama', 'Mère', 'Madre', or 'Maa'..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 font-bold text-sm focus:border-[#4ade80] focus:outline-none leading-relaxed"
                  />
                </div>

                {/* Color Styling Preset */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Palette size={14} className="text-[#4ade80]" />
                    <span>Card Background &amp; Border Color Theme</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c.label}
                        type="button"
                        onClick={() =>
                          setEditingItem({
                            ...editingItem,
                            accent_color: c.accent,
                            bg_gradient: c.bg,
                            border_color: c.border,
                          })
                        }
                        className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                          editingItem.bg_gradient === c.bg
                            ? 'border-[#4ade80] bg-white/15 text-white'
                            : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: c.accent }}
                        />
                        <span>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-3 pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingItem.is_active !== false}
                      onChange={(e) => setEditingItem({ ...editingItem, is_active: e.target.checked })}
                      className="w-4 h-4 rounded text-[#4ade80] focus:ring-0"
                    />
                    <span className="text-sm font-bold text-white">Active in rotation (Turned ON)</span>
                  </label>
                </div>

                {/* Footer buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingItem}
                    className="px-5 py-2.5 rounded-xl bg-[#4ade80] hover:bg-[#3ec972] text-[#0f1117] font-black text-xs flex items-center gap-2 shadow-lg shadow-[#4ade80]/20"
                  >
                    {savingItem ? <Spinner size={14} /> : <Check size={14} />}
                    <span>{editingItem.id ? 'Save Changes' : 'Create Wonder Fact'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

