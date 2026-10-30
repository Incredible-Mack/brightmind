'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Star, Flame, Heart,
  Plus, ChevronRight, ChevronLeft, X, Check, ArrowRight,
  BookOpen, Brain, Clock, Globe, Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { api } from '@/lib/api'
import { getToken } from '@/lib/auth'
import type { Child as ApiChild } from '@/lib/api'
import { Avatar } from '@/components/ui/Avatar'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Spinner } from '@/components/ui/Spinner'
import { toast } from '@/components/ui/Toast'
import { useAppStore } from '@/store/useAppStore'
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus'
import { useCoach } from '@/hooks/useCoach'
import { getLevelFromXP } from '@/types/child'
import type {
  AgeGroup, LearningProfile, ReadingLevel, MathLevel,
  LearningStyle, FocusTime, LanguageBackground, Interest,
} from '@/types/child'
import { AVATAR_OPTIONS } from '@/lib/avatars'
import { Input } from '@/components/ui/Input'

interface ChildWithStats extends ApiChild {
  lessonsCompleted: number
  totalLessons: number
  age_group?: string
}

const AGE_GROUPS: Array<{ label: string; range: AgeGroup; icon: string; desc: string; color: string }> = [
  { label: '0 – 5',   range: '0-5',   icon: '🌱', color: '#10b981', desc: 'Letters, numbers & shapes' },
  { label: '6 – 8',   range: '6-8',   icon: '📚', color: '#3b82f6', desc: 'Reading, basic math & science' },
  { label: '9 – 11',  range: '9-11',  icon: '🔭', color: '#a855f7', desc: 'Multiplication, grammar & geography' },
  { label: '12 – 14', range: '12-14', icon: '🎓', color: '#f97316', desc: 'Algebra, essays & history' },
]

function ageToGroup(age: number): AgeGroup {
  if (age <= 5)  return '0-5'
  if (age <= 8)  return '6-8'
  if (age <= 11) return '9-11'
  return '12-14'
}

// ── Pill selector ─────────────────────────────────────────────────────────────
function PillRow<T extends string>({
  options, value, onChange, multi = false,
}: {
  options: Array<{ value: T; label: string; emoji: string }>
  value: T | T[]
  onChange: (v: T | T[]) => void
  multi?: boolean
}) {
  const isSelected = (v: T) =>
    multi ? (value as T[]).includes(v) : value === v

  const toggle = (v: T) => {
    if (!multi) { onChange(v); return }
    const arr = value as T[]
    onChange(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v])
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => toggle(opt.value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-nunito font-bold transition-all ${
            isSelected(opt.value)
              ? 'border-[#10b981] bg-emerald-50 text-[#047857]'
              : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-900'
          }`}
        >
          <span>{opt.emoji}</span>
          <span>{opt.label}</span>
          {multi && isSelected(opt.value) && <Check size={12} />}
        </button>
      ))}
    </div>
  )
}

function SectionLabel({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon size={14} className="text-slate-500" />
      <span className="text-slate-600 font-nunito text-xs uppercase tracking-wider font-extrabold">{label}</span>
    </div>
  )
}

function AddChildModal({ onClose, onCreated }: { onClose: () => void; onCreated: (child: ApiChild) => void }) {
  const STEPS = ['Name', 'Age', 'Character', 'Learning profile']
  const [step,    setStep]    = useState(0)
  const [name,    setName]    = useState('')
  const [ageGroup, setAge]    = useState<AgeGroup | null>(null)
  const [avatar,  setAvatar]  = useState(AVATAR_OPTIONS[0].id)
  const [saving,  setSaving]  = useState(false)

  const [reading,   setReading]   = useState<ReadingLevel>('basic')
  const [math,      setMath]      = useState<MathLevel>('counting')
  const [style,     setStyle]     = useState<LearningStyle>('mixed')
  const [focus,     setFocus]     = useState<FocusTime>('medium')
  const [language,  setLanguage]  = useState<LanguageBackground>('english_first')
  const [interests, setInterests] = useState<Interest[]>([])

  const canNext = [
    name.trim().length >= 2,
    ageGroup !== null,
    true,
    true,
  ]

  const handleCreate = async () => {
    if (!name.trim() || !ageGroup) return
    setSaving(true)
    const midAges: Record<AgeGroup, number> = { '0-5': 4, '6-8': 7, '9-11': 10, '12-14': 13 }
    const lp: LearningProfile = {
      reading, math, style, focus, language, interests,
    }
    try {
      const created = await api.children.create({
        name: name.trim(),
        age: midAges[ageGroup],
        age_group: ageGroup,
        avatar_seed: avatar,
        learning_profile: lp,
      })
      onCreated(created)
      toast(`${created.name} added!`, 'success')
      onClose()
    } catch {
      toast('Failed to create profile. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const readingOpts: Array<{ value: ReadingLevel; label: string; emoji: string }> = [
    { value: 'none',   label: 'Not yet',    emoji: '🌱' },
    { value: 'basic',  label: 'Learning',   emoji: '📖' },
    { value: 'fluent', label: 'Reads well', emoji: '✨' },
  ]
  const mathOpts: Array<{ value: MathLevel; label: string; emoji: string }> = [
    { value: 'none',       label: 'Starting',  emoji: '🔢' },
    { value: 'counting',   label: 'Counting',  emoji: '➕' },
    { value: 'arithmetic', label: 'Advanced',  emoji: '🧮' },
  ]
  const styleOpts: Array<{ value: LearningStyle; label: string; emoji: string }> = [
    { value: 'video',    label: 'Videos',     emoji: '🎬' },
    { value: 'activity', label: 'Activities', emoji: '🎯' },
    { value: 'mixed',    label: 'Both',       emoji: '⚡' },
  ]
  const focusOpts: Array<{ value: FocusTime; label: string; emoji: string }> = [
    { value: 'short',  label: '~15 min',  emoji: '⏱️' },
    { value: 'medium', label: '~30 min',  emoji: '🕐' },
    { value: 'long',   label: '30+ min',  emoji: '🎯' },
  ]
  const langOpts: Array<{ value: LanguageBackground; label: string; emoji: string }> = [
    { value: 'english_first',    label: 'English 1st',  emoji: '🏡' },
    { value: 'bilingual',        label: 'Bilingual',    emoji: '🌍' },
    { value: 'learning_english', label: 'Learning Eng', emoji: '📚' },
  ]
  const interestOpts: Array<{ value: Interest; label: string; emoji: string }> = [
    { value: 'animals',  label: 'Animals',  emoji: '🐾' },
    { value: 'space',    label: 'Space',    emoji: '🚀' },
    { value: 'sports',   label: 'Sports',   emoji: '⚽' },
    { value: 'arts',     label: 'Arts',     emoji: '🎨' },
    { value: 'stories',  label: 'Stories',  emoji: '📚' },
    { value: 'puzzles',  label: 'Puzzles',  emoji: '🧩' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="relative w-full max-w-lg bg-white rounded-3xl border-4 border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-[#1d2445] font-black font-nunito text-lg">Add Child Profile</h2>
            <p className="text-slate-500 font-bold font-nunito text-xs mt-0.5">{STEPS[step]}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <X size={16} className="text-slate-600" />
          </button>
        </div>

        <div className="flex gap-1.5 px-6 py-3 flex-shrink-0">
          {STEPS.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-[#10b981]' : 'bg-slate-100'}`} />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}
            >
              {step === 0 && (
                <div className="py-4">
                  <p className="text-slate-600 font-bold font-nunito text-sm mb-5">What&apos;s your child&apos;s name?</p>
                  <Input label="Name" placeholder="e.g. Amara" value={name} onChange={e => setName(e.target.value)} autoFocus />
                </div>
              )}

              {step === 1 && (
                <div className="space-y-2.5 py-2">
                  <p className="text-slate-600 font-bold font-nunito text-sm mb-4">How old is {name || 'your child'}?</p>
                  {AGE_GROUPS.map(g => (
                    <button key={g.range} onClick={() => setAge(g.range)}
                      className={`w-full flex items-center gap-4 p-3.5 rounded-2xl border-2 text-left transition-all ${
                        ageGroup === g.range
                          ? 'border-[#10b981] bg-emerald-50 text-[#1d2445]'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <span className="text-2xl">{g.icon}</span>
                      <div className="flex-1">
                        <div className="font-black font-nunito text-sm">{g.label} years</div>
                        <div className="text-slate-500 font-bold text-xs font-nunito">{g.desc}</div>
                      </div>
                      {ageGroup === g.range && <Check size={18} className="text-[#10b981] flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              )}

              {step === 2 && (
                <div className="py-2">
                  <p className="text-slate-600 font-bold font-nunito text-sm mb-4">Pick {name ? `${name}'s` : 'their'} character</p>
                  <div className="grid grid-cols-4 gap-3">
                    {AVATAR_OPTIONS.map(av => (
                      <button key={av.id} onClick={() => setAvatar(av.id)}
                        className={`relative aspect-square rounded-2xl transition-all duration-200 ${avatar === av.id ? 'scale-105 ring-4 ring-[#10b981] ring-offset-2' : 'opacity-70 hover:opacity-100 hover:scale-102'}`}
                      >
                        <div className={`w-full h-full rounded-2xl ${av.bgColor} flex items-center justify-center text-3xl shadow-sm`}>
                          {av.emoji}
                        </div>
                        {avatar === av.id && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#10b981] border-2 border-white rounded-full flex items-center justify-center text-[10px] text-white font-bold">✓</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5 py-2">
                  <p className="text-slate-600 font-bold font-nunito text-sm">
                    Help us personalise {name ? `${name}'s` : 'their'} learning journey.
                  </p>

                  <div>
                    <SectionLabel icon={BookOpen} label="Reading ability" />
                    <PillRow options={readingOpts} value={reading} onChange={v => setReading(v as ReadingLevel)} />
                  </div>

                  <div>
                    <SectionLabel icon={Brain} label="Numbers & maths" />
                    <PillRow options={mathOpts} value={math} onChange={v => setMath(v as MathLevel)} />
                  </div>

                  <div>
                    <SectionLabel icon={Globe} label="Language background" />
                    <PillRow options={langOpts} value={language} onChange={v => setLanguage(v as LanguageBackground)} />
                  </div>

                  <div>
                    <SectionLabel icon={Sparkles} label="How do they learn best?" />
                    <PillRow options={styleOpts} value={style} onChange={v => setStyle(v as LearningStyle)} />
                  </div>

                  <div>
                    <SectionLabel icon={Clock} label="Comfortable session length" />
                    <PillRow options={focusOpts} value={focus} onChange={v => setFocus(v as FocusTime)} />
                  </div>

                  <div>
                    <SectionLabel icon={Star} label="What excites them? (pick any)" />
                    <PillRow
                      options={interestOpts}
                      value={interests}
                      onChange={v => setInterests(v as Interest[])}
                      multi
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center transition-colors"
            >
              <ChevronLeft size={18} className="text-slate-700" />
            </button>
          )}
          <button
            disabled={!canNext[step] || saving}
            onClick={() => step < 3 ? setStep(s => s + 1) : handleCreate()}
            className="flex-1 h-11 rounded-2xl bg-[#10b981] hover:bg-[#059669] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black font-nunito text-sm flex items-center justify-center gap-2 border-b-4 border-[#047857] shadow-sm transition-all"
          >
            {saving ? <Spinner size={16} color="#ffffff" /> : step < 3 ? (
              <>Continue <ChevronRight size={16} /></>
            ) : (
              <>Create Profile <Check size={16} /></>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function profileBadges(profile: NonNullable<ApiChild['learning_profile']>) {
  const badges: Array<{ label: string; emoji: string }> = []
  const readingMap: Record<ReadingLevel, { label: string; emoji: string }> = {
    none:   { label: 'Pre-reader', emoji: '🌱' },
    basic:  { label: 'Early reader', emoji: '📖' },
    fluent: { label: 'Fluent reader', emoji: '✨' },
  }
  const mathMap: Record<MathLevel, { label: string; emoji: string }> = {
    none:       { label: 'Counting basics', emoji: '🔢' },
    counting:   { label: 'Addition & subtraction', emoji: '➕' },
    arithmetic: { label: 'Advanced math', emoji: '🧮' },
  }
  const styleMap: Record<LearningStyle, { label: string; emoji: string }> = {
    video:    { label: 'Video learner', emoji: '🎬' },
    activity: { label: 'Hands-on', emoji: '🎯' },
    mixed:    { label: 'Balanced', emoji: '⚡' },
  }
  const langMap: Record<LanguageBackground, { label: string; emoji: string }> = {
    english_first:    { label: 'English first', emoji: '🏡' },
    bilingual:        { label: 'Bilingual', emoji: '🌍' },
    learning_english: { label: 'Learning English', emoji: '📚' },
  }

  const r = readingMap[profile.reading]
  if (r) badges.push(r)
  const m = mathMap[profile.math]
  if (m) badges.push(m)
  const s = styleMap[profile.style]
  if (s) badges.push(s)
  const lang = langMap[profile.language]
  if (lang) badges.push(lang)
  return badges
}

function ChildCard({ child, totalLessons, isActive, isSwitching, onSwitch }: {
  child: ChildWithStats; totalLessons: number; isActive: boolean; isSwitching: boolean; onSwitch: () => void
}) {
  const xp = child.xp ?? 0
  const { level, name: levelName, nextXP, prevXP } = getLevelFromXP(xp)
  const xpPct = nextXP > prevXP ? Math.round(((xp - prevXP) / (nextXP - prevXP)) * 100) : 100
  const lessonPct = totalLessons > 0 ? Math.round((child.lessonsCompleted / totalLessons) * 100) : 0
  const ageGrp = ageToGroup(child.age)
  const ageCfg = AGE_GROUPS.find(g => g.range === ageGrp)!
  const lp = child.learning_profile

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className={`relative bg-white rounded-3xl border-2 transition-all p-5 shadow-sm ${
        isActive
          ? 'border-[#10b981] border-b-4 border-b-[#059669] shadow-md'
          : 'border-slate-200 border-b-4 border-b-slate-300'
      }`}
    >
      {isActive && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 rounded-full px-3 py-1">
          <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
          <span className="text-[#047857] font-nunito font-black text-[10px] uppercase tracking-wide">Active</span>
        </div>
      )}

      {/* Avatar + name */}
      <div className="flex items-center gap-4 mb-4">
        <Avatar seed={child.avatar_seed} name={child.name} size={60} ring={isActive} />
        <div>
          <h3 className="text-[#1d2445] font-black text-xl font-nunito">{child.name}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="inline-flex items-center gap-1 font-nunito font-bold text-xs px-2.5 py-0.5 rounded-full" style={{ background: `${ageCfg.color}20`, color: ageCfg.color }}>
              {ageCfg.icon} {ageGrp} yrs
            </span>
            <span className="text-slate-500 font-bold font-nunito text-xs">Lvl {level} · {levelName}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { icon: Star,  val: xp.toLocaleString(), label: 'XP',     color: '#eab308' },
          { icon: Flame, val: `${child.streak ?? 0}d`, label: 'Streak', color: '#f97316' },
          { icon: Heart, val: `${child.lives ?? 5}/5`,  label: 'Lives',  color: '#ef4444' },
        ].map(({ icon: Icon, val, label, color }) => (
          <div key={label} className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-center">
            <Icon size={14} style={{ color }} className="mx-auto mb-1" fill={color} />
            <div className="text-[#1d2445] font-black text-sm font-nunito">{val}</div>
            <div className="text-slate-500 text-[10px] font-bold font-nunito uppercase tracking-wide">{label}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="space-y-2.5 mb-4">
        <div>
          <div className="flex justify-between text-[11px] font-bold font-nunito text-slate-500 mb-1">
            <span>XP progress</span><span>{xp} / {nextXP}</span>
          </div>
          <ProgressBar value={xpPct} color="#eab308" height={6} />
        </div>
        <div>
          <div className="flex justify-between text-[11px] font-bold font-nunito text-slate-500 mb-1">
            <span>Lessons completed</span><span>{child.lessonsCompleted} / {totalLessons}</span>
          </div>
          <ProgressBar value={lessonPct} color="#3b82f6" height={6} />
        </div>
      </div>

      {/* Learning profile */}
      {lp ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-4">
          <p className="text-slate-500 font-nunito text-[10px] uppercase tracking-wider mb-2 font-black">Learning profile</p>
          <div className="flex flex-wrap gap-1.5">
            {profileBadges(lp).map(b => (
              <span key={b.label} className="flex items-center gap-1 bg-white border border-slate-200 text-slate-700 font-nunito text-[11px] font-bold px-2 py-1 rounded-lg">
                {b.emoji} {b.label}
              </span>
            ))}
            {(lp.interests ?? []).length > 0 && (
              <span className="flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-800 font-nunito text-[11px] font-bold px-2 py-1 rounded-lg">
                Likes: {(lp.interests ?? []).map(i => ({ animals:'🐾', space:'🚀', sports:'⚽', arts:'🎨', stories:'📚', puzzles:'🧩' }[i])).join(' ')}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-4 flex items-center gap-3">
          <span className="text-xl">{ageCfg.icon}</span>
          <div>
            <p className="text-[#1d2445] font-nunito font-bold text-xs">Enrolled curriculum</p>
            <p className="text-slate-500 font-nunito text-xs font-bold">{ageCfg.desc}</p>
          </div>
        </div>
      )}

      {/* Switch / Active */}
      {isActive ? (
        <div className="flex items-center justify-center gap-2 h-11 rounded-2xl bg-emerald-50 border border-emerald-300">
          <Check size={16} className="text-[#047857]" />
          <span className="text-[#047857] font-nunito font-black text-sm">Currently learning</span>
        </div>
      ) : (
        <button
          onClick={onSwitch} disabled={isSwitching}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl bg-[#facc15] hover:bg-[#eab308] border-b-4 border-amber-500 text-[#1d2445] font-nunito font-black text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          {isSwitching ? <><Spinner size={14} color="#1d2445" /> Switching…</> : <>Switch to {child.name} <ArrowRight size={14} /></>}
        </button>
      )}
    </motion.div>
  )
}

export default function ParentHubPage() {
  const router = useRouter()
  const { child: activeChild, setChild } = useAppStore()
  const [children, setChildren] = useState<ChildWithStats[]>([])
  const [totalLessons, setTotalLessons] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [switching, setSwitching] = useState<number | null>(null)

  const coach = useCoach('weekly_plan')

  const load = useCallback(async () => {
    try {
      const token = getToken()
      if (!token) { router.push('/login'); return }

      const [kids, lessons] = await Promise.all([
        api.children.list(),
        api.lessons.list(),
      ])
      setTotalLessons(lessons.length)

      const withStats: ChildWithStats[] = await Promise.all(
        kids.map(async k => {
          try {
            const prog = await api.progress.list(Number(k.id))
            const completed = prog.filter(p => p.status === 'completed').length
            return { ...k, lessonsCompleted: completed, totalLessons: lessons.length }
          } catch {
            return { ...k, lessonsCompleted: 0, totalLessons: lessons.length }
          }
        })
      )
      setChildren(withStats)
      if (!activeChild && withStats[0]) {
        setChild({
          id: String(withStats[0].id),
          user_id: String(withStats[0].user_id),
          name: withStats[0].name,
          age: withStats[0].age,
          avatar_seed: withStats[0].avatar_seed,
          created_at: (withStats[0] as any).created_at || new Date().toISOString(),
          learning_profile: withStats[0].learning_profile,
        })
      }
    } catch {
      toast('Could not load family profiles', 'error')
    } finally {
      setLoading(false)
    }
  }, [activeChild, router, setChild])

  useEffect(() => { load() }, [load])
  useRefetchOnFocus(load)

  const handleSwitch = async (child: ChildWithStats) => {
    setSwitching(Number(child.id))
    setChild({
      id: String(child.id),
      user_id: String(child.user_id),
      name: child.name,
      age: child.age,
      avatar_seed: child.avatar_seed,
      created_at: (child as any).created_at || new Date().toISOString(),
      learning_profile: child.learning_profile,
    })
    toast(`Switched to ${child.name}!`, 'success')
    setSwitching(null)
  }

  const handleCreated = (newChild: ApiChild) => {
    const withStats: ChildWithStats = { ...newChild, lessonsCompleted: 0, totalLessons }
    setChildren(prev => [...prev, withStats])
    setChild({
      id: String(newChild.id),
      user_id: String(newChild.user_id),
      name: newChild.name,
      age: newChild.age,
      avatar_seed: newChild.avatar_seed,
      created_at: (newChild as any).created_at || new Date().toISOString(),
      learning_profile: newChild.learning_profile,
    })
    setShowAdd(false)
    toast(`${newChild.name}'s profile created!`, 'success')
    load()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size={36} color="#10b981" />
      </div>
    )
  }

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center shadow-sm">
            <Users size={24} className="text-purple-700" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#1d2445] font-nunito tracking-tight">Family Hub</h1>
            <p className="text-slate-500 font-bold font-nunito text-sm mt-0.5">
              {children.length === 0
                ? 'Add your children to get started'
                : `${children.length} child profile${children.length > 1 ? 's' : ''} — personalised lessons for each`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-[#10b981] hover:bg-[#059669] text-white font-black font-nunito text-sm px-6 py-3.5 rounded-2xl border-b-4 border-[#047857] shadow-sm transition-all active:translate-y-0.5"
        >
          <Plus size={18} /> Add Child
        </button>
      </div>

      {/* Weekly plan for the active child */}
      {activeChild && coach.note && coach.rec && (
        <div className="bg-white border-2 border-purple-200 border-b-4 border-purple-300 rounded-3xl p-6 mb-6 shadow-sm">
          <p className="text-purple-900 font-nunito text-xs uppercase tracking-widest mb-2 font-black">
            This week with {activeChild.name}
          </p>
          <p className="text-slate-700 font-nunito font-bold text-sm leading-relaxed mb-3">{coach.note.parent}</p>
          {coach.rec.engine && (
            <p className="text-slate-500 font-nunito text-xs mb-3 font-bold">
              <strong className="text-purple-800">{coach.rec.engine.skills_mastered}</strong> skill{coach.rec.engine.skills_mastered === 1 ? '' : 's'} verified by checkpoint · {coach.rec.engine.skills_started} started
              {coach.rec.engine.ready_for_checkpoint.length > 0 && <> · ready for a checkpoint: {coach.rec.engine.ready_for_checkpoint.join(', ')}</>}
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
            {coach.rec.mastery.map(m => (
              <div key={m.subject_id} className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                <p className="text-[#1d2445] font-nunito font-black text-xs">{m.subject_name}</p>
                <p className="font-nunito font-bold text-[11px] mt-0.5" style={{ color: m.level === 'strong' ? '#10b981' : m.level === 'weak' ? '#f59e0b' : '#64748b' }}>
                  {m.level === 'new' ? 'Not started' : m.level === 'weak' ? 'Needs practice' : m.level === 'strong' ? 'Strong' : 'Going well'}
                  {m.avg_score != null ? ` · ${m.avg_score}%` : ''}
                </p>
                <p className="text-slate-400 font-nunito font-bold text-[10px]">{m.completed}/{m.total} lessons</p>
              </div>
            ))}
          </div>
          {coach.note.tips.length > 0 && (
            <ul className="list-disc pl-5 space-y-1">
              {coach.note.tips.map((t, i) => <li key={i} className="text-slate-600 font-nunito font-bold text-xs">{t}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* Age group reference */}
      <div className="bg-white border-2 border-slate-200 border-b-4 border-slate-300 rounded-3xl p-5 mb-6 shadow-sm">
        <p className="text-slate-500 font-nunito text-xs uppercase tracking-widest mb-3 font-black">Curriculum by age</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {AGE_GROUPS.map(g => (
            <div key={g.range} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3">
              <span className="text-2xl">{g.icon}</span>
              <div>
                <p className="font-nunito font-black text-xs" style={{ color: g.color }}>{g.label} yrs</p>
                <p className="text-slate-500 font-bold font-nunito text-[11px] leading-tight">{g.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Child grid */}
      {children.length === 0 ? (
        <div className="bg-white border-2 border-slate-200 border-b-4 border-slate-300 rounded-3xl p-12 text-center shadow-sm flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center text-4xl shadow-sm">
            👨‍👩‍👧‍👦
          </div>
          <div>
            <p className="text-[#1d2445] font-black text-xl font-nunito mb-1">No child profiles yet</p>
            <p className="text-slate-500 font-bold font-nunito text-sm max-w-sm mx-auto">
              Add each of your children — they get personalised lessons based on their learning profile.
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-[#10b981] hover:bg-[#059669] text-white font-black font-nunito px-7 py-3.5 rounded-2xl border-b-4 border-[#047857] shadow-sm transition-all"
          >
            <Plus size={18} /> Add First Child
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {children.map(child => (
            <ChildCard
              key={child.id}
              child={child}
              totalLessons={totalLessons}
              isActive={String(activeChild?.id) === String(child.id)}
              isSwitching={switching === Number(child.id)}
              onSwitch={() => handleSwitch(child)}
            />
          ))}
          <button
            onClick={() => setShowAdd(true)}
            className="bg-white/60 hover:bg-white border-2 border-dashed border-slate-300 hover:border-[#10b981] rounded-3xl p-8 flex flex-col items-center justify-center gap-3 transition-all group min-h-[200px] shadow-sm"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-50 group-hover:bg-emerald-100 border border-emerald-200 flex items-center justify-center transition-colors">
              <Plus size={24} className="text-[#10b981]" />
            </div>
            <span className="text-[#1d2445] font-black font-nunito text-sm">Add another child</span>
          </button>
        </div>
      )}

      {showAdd && (
        <AddChildModal
          onClose={() => setShowAdd(false)}
          onCreated={handleCreated}
        />
      )}
    </PageWrapper>
  )
}
