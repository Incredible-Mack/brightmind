'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquareHeart,
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Star,
  ExternalLink,
  Sparkles,
  X,
  Smile,
  Palette
} from 'lucide-react'
import { adminApi } from '@/lib/adminApi'
import type { Testimonial } from '@/lib/api'
import { Spinner } from '@/components/ui/Spinner'

const AVATAR_PRESETS = ['👩‍🦰', '👨‍🦱', '👩', '👨', '🧑‍🦳', '👵', '👴', '🧕', '🦁', '🌟']

const COLOR_PRESETS = [
  { label: 'Rose Soft', value: 'bg-rose-100 border-rose-300' },
  { label: 'Blue Sky', value: 'bg-blue-100 border-blue-300' },
  { label: 'Amber Sunny', value: 'bg-amber-100 border-amber-300' },
  { label: 'Emerald Fresh', value: 'bg-emerald-100 border-emerald-300' },
  { label: 'Purple Dream', value: 'bg-purple-100 border-purple-300' },
  { label: 'Indigo Night', value: 'bg-indigo-100 border-indigo-300' },
]

const DEFAULT_NEW: Partial<Testimonial> = {
  name: '',
  role: '',
  quote: '',
  avatar: '👩‍🦰',
  avatar_bg: 'bg-rose-100 border-rose-300',
  rating: 5,
  order_index: 0,
  is_active: true,
}

export default function AdminTestimonialsPage() {
  const [loading, setLoading] = useState(true)
  const [sectionVisible, setSectionVisible] = useState(true)
  const [items, setItems] = useState<Testimonial[]>([])
  const [togglingVisibility, setTogglingVisibility] = useState(false)
  const [savingItem, setSavingItem] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Partial<Testimonial> | null>(null)

  const loadData = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await adminApi.testimonials.get()
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

  const handleToggleVisibility = async () => {
    setTogglingVisibility(true)
    setMessage(null)
    try {
      const nextVal = !sectionVisible
      const res = await adminApi.testimonials.toggleVisibility(nextVal)
      setSectionVisible(res.visible)
      setMessage({
        type: 'success',
        text: res.visible
          ? '✦ Loved by Parents ✦ section is now VISIBLE on the homepage!'
          : '✦ Loved by Parents ✦ section is now HIDDEN from the homepage.',
      })
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message })
    } finally {
      setTogglingVisibility(false)
    }
  }

  const handleOpenAdd = () => {
    setEditingItem({
      ...DEFAULT_NEW,
      order_index: items.length,
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item: Testimonial) => {
    setEditingItem({ ...item })
    setIsModalOpen(true)
  }

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem?.name || !editingItem?.quote) {
      setMessage({ type: 'error', text: 'Parent name and testimonial quote are required.' })
      return
    }

    setSavingItem(true)
    setMessage(null)
    try {
      if (editingItem.id) {
        await adminApi.testimonials.update(editingItem.id, editingItem)
        setMessage({ type: 'success', text: `Testimonial from "${editingItem.name}" updated successfully.` })
      } else {
        await adminApi.testimonials.create(editingItem)
        setMessage({ type: 'success', text: `New testimonial from "${editingItem.name}" added successfully.` })
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

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete the testimonial from "${name}"?`)) return

    setDeletingId(id)
    setMessage(null)
    try {
      await adminApi.testimonials.delete(id)
      setMessage({ type: 'success', text: `Testimonial from "${name}" deleted.` })
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
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <MessageSquareHeart size={22} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Parent Testimonials
            </h1>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1.5">
            Manage the &ldquo;✦ Loved by Parents ✦&rdquo; reviews section, toggle visibility, and create real customer stories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs flex items-center gap-2 transition-colors"
          >
            <ExternalLink size={15} />
            <span>View Homepage</span>
          </a>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-[#4ade80] hover:bg-[#3ec972] text-[#0f1117] font-black text-xs flex items-center gap-2 shadow-lg shadow-[#4ade80]/20 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Testimonial</span>
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

      {/* Section Master Visibility Toggle Card */}
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
                {sectionVisible ? '● Live on Site' : '○ Section Hidden'}
              </span>
              <h2 className="text-lg font-black text-white">
                Homepage &ldquo;Loved by Parents&rdquo; Section Control
              </h2>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {sectionVisible
                ? 'The Loved by Parents reviews section is currently visible to all visitors on the landing page.'
                : 'The section is completely hidden from the landing page. No parent quotes or reviews will appear.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleVisibility}
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
                <span>Hide Full Section</span>
              </>
            ) : (
              <>
                <Eye size={16} />
                <span>Make Section Visible</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Testimonials List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <span>Parent Stories ({items.length})</span>
          </h3>
          <span className="text-xs text-slate-400">
            Previewing cards exactly as they look on the homepage
          </span>
        </div>

        {items.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/30 border border-white/5 space-y-3">
            <MessageSquareHeart size={36} className="mx-auto text-slate-600" />
            <h4 className="text-white font-bold">No parent testimonials yet</h4>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">
              Add your first parent review to build trust with families visiting Bright Steps.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-2 px-4 py-2 rounded-xl bg-[#4ade80] text-[#0f1117] font-bold text-xs"
            >
              Add First Testimonial
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-6 border-2 border-slate-200 border-b-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative group"
              >
                {/* Admin Overlay Actions */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    title="Edit Testimonial"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id, item.name)}
                    disabled={deletingId === item.id}
                    title="Delete Testimonial"
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                  >
                    {deletingId === item.id ? <Spinner size={14} /> : <Trash2 size={14} />}
                  </button>
                </div>

                <div>
                  {/* Star Rating */}
                  <div className="flex items-center gap-1 mb-3 text-amber-400">
                    {[...Array(item.rating || 5)].map((_, i) => (
                      <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </div>

                {/* Parent Profile */}
                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
                  <div className={`w-11 h-11 rounded-2xl ${item.avatar_bg || 'bg-rose-100 border-rose-300'} border-2 flex items-center justify-center text-xl shadow-xs`}>
                    {item.avatar}
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-800 leading-tight">
                      {item.name}
                    </h4>
                    <p className="text-xs font-bold text-slate-400 mt-0.5">
                      {item.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Add / Edit Testimonial */}
      <AnimatePresence>
        {isModalOpen && editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-xl bg-[#141824] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={20} className="text-[#4ade80]" />
                  <h3 className="text-lg font-black text-white">
                    {editingItem.id ? 'Edit Testimonial' : 'Add New Parent Testimonial'}
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
                {/* Name & Role in a 2-column grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Parent Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingItem.name || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      placeholder="e.g. Sarah M."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 font-bold text-sm focus:border-[#4ade80] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Relationship / Child *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingItem.role || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, role: e.target.value })}
                      placeholder="e.g. Mother of 5-year-old Leo"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 font-bold text-sm focus:border-[#4ade80] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Star Rating (1-5)
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((stars) => (
                      <button
                        key={stars}
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, rating: stars })}
                        className={`p-2 rounded-xl border flex items-center gap-1 transition-all ${
                          (editingItem.rating || 5) >= stars
                            ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                            : 'bg-white/5 border-white/10 text-slate-500'
                        }`}
                      >
                        <Star size={16} className={(editingItem.rating || 5) >= stars ? 'fill-amber-400' : ''} />
                        <span className="text-xs font-bold">{stars}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quote Text */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Parent Quote / Review *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={editingItem.quote || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, quote: e.target.value })}
                    placeholder="Write the quote or parent testimonial here..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 font-bold text-sm focus:border-[#4ade80] focus:outline-none leading-relaxed"
                  />
                </div>

                {/* Avatar Emoji Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Smile size={14} className="text-[#4ade80]" />
                    <span>Avatar Emoji</span>
                  </label>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {AVATAR_PRESETS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, avatar: emoji })}
                        className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border transition-all ${
                          editingItem.avatar === emoji
                            ? 'border-[#4ade80] bg-[#4ade80]/20 scale-105'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                    <input
                      type="text"
                      maxLength={4}
                      value={editingItem.avatar || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, avatar: e.target.value })}
                      placeholder="Custom"
                      className="w-16 h-10 px-2 rounded-xl bg-white/5 border border-white/10 text-white text-center text-lg font-bold"
                      title="Type any custom emoji"
                    />
                  </div>
                </div>

                {/* Avatar Background Bubble Color */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Palette size={14} className="text-[#4ade80]" />
                    <span>Avatar Bubble Color Style</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, avatar_bg: c.value })}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                          editingItem.avatar_bg === c.value
                            ? 'border-[#4ade80] bg-white/15 text-white'
                            : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full ${c.value} border`} />
                        <span>{c.label}</span>
                      </button>
                    ))}
                  </div>
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
                    <span>{editingItem.id ? 'Save Changes' : 'Create Testimonial'}</span>
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

