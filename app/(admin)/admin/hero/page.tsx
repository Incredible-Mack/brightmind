'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Save, RotateCcw, Check, AlertCircle, Eye, ShieldCheck, Zap, Star, ArrowRight } from 'lucide-react'
import { adminApi } from '@/lib/adminApi'
import type { HeroSettings } from '@/lib/api'
import { ImagePicker } from '@/components/admin/ImagePicker'
import { Spinner } from '@/components/ui/Spinner'
import { imageSrc } from '@/lib/media'

const DEFAULT_SETTINGS: HeroSettings = {
  hero_badge: 'Bright Beginnings, Joyful Learning ✨',
  hero_title: 'Big Smiles, Little Adventures! 🌟',
  hero_subtitle: 'Safe, fun & voice-guided educational lessons tailored for every little dreamer aged 0–14. Discover phonics, count numbers, and unlock magical trophies!',
  hero_image: '/images/lessons-hero-learning.jpg',
  hero_video: 'https://cdn1.kingschat.online/uploads/media/65c4daa40928703efdfd3e12/ZjYyeVBiNHlkMGFXMlJpQWpZOUNzZz09/Robot_teaching_children_learning_b6137159.mp4',
  hero_cta_text: 'Explore Courses Now',
  hero_trust_1: '100% Safe & Ad-Free',
  hero_trust_2: 'Voice & Listen Interactive',
  hero_trust_3: 'Loved by Parents',
  hero_sticker_title: 'Joyful Play',
  hero_sticker_sub: 'Bright Minds & Big Smiles',
  hero_bg_color: '#fffdf7',
}

export default function AdminHeroPage() {
  const [form, setForm] = useState<HeroSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminApi.hero.get()
      setForm({ ...DEFAULT_SETTINGS, ...data })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleChange = (key: keyof HeroSettings, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await adminApi.hero.update(form)
      setSuccess('Courses Hero settings updated and published live!')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm('Reset hero settings back to recommended defaults?')) {
      setForm(DEFAULT_SETTINGS)
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
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-nunito flex items-center gap-2.5">
            <Sparkles size={24} className="text-[#4ade80]" />
            <span>Courses Hero Customizer</span>
          </h1>
          <p className="text-slate-400 font-nunito text-xs sm:text-sm mt-1">
            Customize the prominent hero banner shown at the top of <code>/lessons</code> (headlines, artwork, trust badges &amp; colors).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-nunito font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-[#4ade80] hover:bg-[#22c55e] disabled:opacity-50 text-[#0f1117] font-nunito font-extrabold text-sm flex items-center gap-2 transition-all shadow-md active:translate-y-0.5 cursor-pointer"
          >
            {saving ? <Spinner size={16} /> : <Save size={16} />}
            <span>Save &amp; Publish</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/15 border border-red-500/30 text-red-300 px-4 py-3 rounded-2xl flex items-center gap-2 font-nunito text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-2xl flex items-center gap-2 font-nunito text-sm">
          <Check size={16} className="flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Live Preview Card */}
      <div className="bg-[#1a1f2e] border border-white/5 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4 text-xs font-black uppercase tracking-wider text-slate-400">
          <Eye size={14} className="text-[#4ade80]" />
          <span>Live Hero Preview (How it appears to learners &amp; parents)</span>
        </div>

        <div
          className="rounded-3xl p-6 sm:p-8 border-2 border-amber-200/80 shadow-md relative overflow-hidden"
          style={{ backgroundColor: form.hero_bg_color || '#fffdf7' }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-3">
              <span className="inline-flex items-center gap-1.5 bg-white/95 border border-amber-300 rounded-full px-3 py-1 text-xs font-black text-amber-800 shadow-2xs">
                <Sparkles size={13} className="text-amber-500" />
                <span>{form.hero_badge}</span>
              </span>

              <h2 className="text-2xl sm:text-4xl font-black text-[#1d2445] font-nunito leading-tight">
                {form.hero_title}
              </h2>

              <p className="text-slate-600 font-bold text-xs sm:text-sm font-nunito leading-relaxed">
                {form.hero_subtitle}
              </p>

              <div className="pt-1">
                <span className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-black text-xs sm:text-sm text-slate-900 bg-[#facc15] shadow-xs border-b-3 border-[#ca8a04]">
                  <span>{form.hero_cta_text}</span>
                  <ArrowRight size={15} />
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-black">
                <span className="bg-white border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-xl flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-600" />
                  <span>{form.hero_trust_1}</span>
                </span>
                <span className="bg-white border border-sky-200 text-sky-800 px-2.5 py-1 rounded-xl flex items-center gap-1">
                  <Zap size={12} className="text-sky-600" />
                  <span>{form.hero_trust_2}</span>
                </span>
                <span className="bg-white border border-rose-200 text-rose-800 px-2.5 py-1 rounded-xl flex items-center gap-1">
                  <Star size={12} fill="#f43f5e" className="text-rose-500" />
                  <span>{form.hero_trust_3}</span>
                </span>
              </div>
            </div>

            {/* Right Artwork */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-white shadow-lg bg-slate-900">
                {form.hero_video ? (
                  <video
                    key={form.hero_video}
                    src={form.hero_video}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageSrc(form.hero_image || '/images/lessons-hero-learning.jpg')}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Heart Badge */}
              <div className="absolute -top-3 -right-2 bg-gradient-to-br from-[#ff5a7e] to-[#ff3b65] text-white px-3 py-2 rounded-2xl shadow-md border border-white text-xs font-black font-nunito flex items-center gap-1.5">
                <span>💖</span>
                <div>
                  <p className="text-[10px] leading-tight">{form.hero_sticker_title}</p>
                  <p className="text-[9px] text-rose-100 font-bold">{form.hero_sticker_sub}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Headlines & Copy */}
        <div className="bg-[#1a1f2e] border border-white/5 rounded-3xl p-6 space-y-4">
          <h2 className="text-white font-nunito font-extrabold text-base border-b border-white/5 pb-2">
            Headlines &amp; Descriptions
          </h2>

          <div>
            <label className="text-slate-300 font-nunito text-xs uppercase tracking-wider mb-1 block">Hero Pill Badge</label>
            <input
              className="w-full bg-[#252b3b] border border-white/10 focus:border-[#4ade80] rounded-xl px-4 py-2.5 text-white font-nunito text-sm outline-none transition-colors"
              value={form.hero_badge || ''}
              onChange={e => handleChange('hero_badge', e.target.value)}
              placeholder="e.g. Bright Beginnings, Joyful Learning ✨"
            />
          </div>

          <div>
            <label className="text-slate-300 font-nunito text-xs uppercase tracking-wider mb-1 block">Hero Main Headline</label>
            <input
              className="w-full bg-[#252b3b] border border-white/10 focus:border-[#4ade80] rounded-xl px-4 py-2.5 text-white font-nunito text-sm outline-none transition-colors"
              value={form.hero_title || ''}
              onChange={e => handleChange('hero_title', e.target.value)}
              placeholder="e.g. Big Smiles, Little Adventures! 🌟"
            />
          </div>

          <div>
            <label className="text-slate-300 font-nunito text-xs uppercase tracking-wider mb-1 block">Hero Subtitle / Description</label>
            <textarea
              rows={3}
              className="w-full bg-[#252b3b] border border-white/10 focus:border-[#4ade80] rounded-xl px-4 py-2.5 text-white font-nunito text-sm outline-none transition-colors resize-none"
              value={form.hero_subtitle || ''}
              onChange={e => handleChange('hero_subtitle', e.target.value)}
              placeholder="Safe, fun & voice-guided educational lessons tailored for every little dreamer..."
            />
          </div>

          <div>
            <label className="text-slate-300 font-nunito text-xs uppercase tracking-wider mb-1 block">CTA Button Label</label>
            <input
              className="w-full bg-[#252b3b] border border-white/10 focus:border-[#4ade80] rounded-xl px-4 py-2.5 text-white font-nunito text-sm outline-none transition-colors"
              value={form.hero_cta_text || ''}
              onChange={e => handleChange('hero_cta_text', e.target.value)}
              placeholder="Explore Courses Now"
            />
          </div>
        </div>

        {/* Right Column: Hero Artwork & Badges */}
        <div className="bg-[#1a1f2e] border border-white/5 rounded-3xl p-6 space-y-4">
          <h2 className="text-white font-nunito font-extrabold text-base border-b border-white/5 pb-2">
            Illustration, Badges &amp; Background
          </h2>

          <div>
            <label className="text-slate-300 font-nunito text-xs uppercase tracking-wider mb-2 block">Hero Video URL (MP4 Autoplay)</label>
            <input
              className="w-full bg-[#252b3b] border border-white/10 focus:border-[#4ade80] rounded-xl px-4 py-2.5 text-white font-nunito text-sm outline-none transition-colors"
              value={form.hero_video || ''}
              onChange={e => handleChange('hero_video', e.target.value)}
              placeholder="https://.../video.mp4"
            />
            <p className="text-slate-400 font-nunito text-[11px] mt-1">If provided, this video autoplays on a loop in the courses hero visual card.</p>
          </div>

          <div>
            <label className="text-slate-300 font-nunito text-xs uppercase tracking-wider mb-2 block">Hero Image Artwork (Fallback)</label>
            <ImagePicker
              label="Upload or choose hero image from library"
              value={form.hero_image || null}
              onChange={url => handleChange('hero_image', url || '/images/lessons-hero-learning.jpg')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-slate-300 font-nunito text-xs uppercase tracking-wider mb-1 block">Sticker Title</label>
              <input
                className="w-full bg-[#252b3b] border border-white/10 focus:border-[#4ade80] rounded-xl px-3 py-2 text-white font-nunito text-xs outline-none"
                value={form.hero_sticker_title || ''}
                onChange={e => handleChange('hero_sticker_title', e.target.value)}
                placeholder="Joyful Play"
              />
            </div>
            <div>
              <label className="text-slate-300 font-nunito text-xs uppercase tracking-wider mb-1 block">Sticker Tagline</label>
              <input
                className="w-full bg-[#252b3b] border border-white/10 focus:border-[#4ade80] rounded-xl px-3 py-2 text-white font-nunito text-xs outline-none"
                value={form.hero_sticker_sub || ''}
                onChange={e => handleChange('hero_sticker_sub', e.target.value)}
                placeholder="Bright Minds & Big Smiles"
              />
            </div>
          </div>

          {/* 3 Trust Badges */}
          <div className="space-y-2 pt-2">
            <label className="text-slate-300 font-nunito text-xs uppercase tracking-wider block">3 Trust Badges</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                className="w-full bg-[#252b3b] border border-white/10 focus:border-[#4ade80] rounded-xl px-3 py-2 text-white font-nunito text-xs outline-none"
                value={form.hero_trust_1 || ''}
                onChange={e => handleChange('hero_trust_1', e.target.value)}
                placeholder="100% Safe & Ad-Free"
              />
              <input
                className="w-full bg-[#252b3b] border border-white/10 focus:border-[#4ade80] rounded-xl px-3 py-2 text-white font-nunito text-xs outline-none"
                value={form.hero_trust_2 || ''}
                onChange={e => handleChange('hero_trust_2', e.target.value)}
                placeholder="Voice & Listen Interactive"
              />
              <input
                className="w-full bg-[#252b3b] border border-white/10 focus:border-[#4ade80] rounded-xl px-3 py-2 text-white font-nunito text-xs outline-none"
                value={form.hero_trust_3 || ''}
                onChange={e => handleChange('hero_trust_3', e.target.value)}
                placeholder="Loved by Parents"
              />
            </div>
          </div>

          {/* Background Tint */}
          <div className="pt-2">
            <label className="text-slate-300 font-nunito text-xs uppercase tracking-wider mb-1 block">Background Tint (Hex)</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.hero_bg_color || '#fffdf7'}
                onChange={e => handleChange('hero_bg_color', e.target.value)}
                className="w-10 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer p-0.5"
              />
              <input
                className="flex-1 bg-[#252b3b] border border-white/10 focus:border-[#4ade80] rounded-xl px-4 py-2 text-white font-nunito font-mono text-xs outline-none"
                value={form.hero_bg_color || '#fffdf7'}
                onChange={e => handleChange('hero_bg_color', e.target.value)}
                placeholder="#fffdf7"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

