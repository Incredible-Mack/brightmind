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
  { label: '0 – 5',   range: '0-5',   icon: '🌱', color: '#4ade80', desc: 'Letters, numbers & shapes' },
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
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-nunito font-semibold transition-all ${
            isSelected(opt.value)
              ? 'border-[#4ade80] bg-[#4ade80]/15 text-[#4ade80]'
              : 'border-white/10 bg-white/3 text-slate-400 hover:border-white/25 hover:text-white'
          }`}
        >
          <span>{opt.emoji}</span>
          <span>{opt.label}</span>
          {multi && isSelected(opt.value) && <Check size={11} />}
        </button>
      ))}
    </div>
  )
}

// ── Section heading inside modal ──────────────────────────────────────────────
function SectionLabel({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon size={13} className="text-slate-500" />
      <span className="text-slate-500 font-nunito text-xs uppercase tracking-wider font-semibold">{label}</span>
    </div>
  )
}

// ── Add Child Modal ────────────────────────────────────────────────────────────
function AddChildModal({ onClose, onCreated }: { onClose: () => void; onCreated: (child: ApiChild) => void }) {
  const STEPS = ['Name', 'Age', 'Character', 'Learning profile']
  const [step,    setStep]    = useState(0)
  const [name,    setName]    = useState('')
  const [ageGroup, setAge]    = useState<AgeGroup | null>(null)
  const [avatar,  setAvatar]  = useState(AVATAR_OPTIONS[0].id)
  const [saving,  setSaving]  = useState(false)

  // Learning profile state
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
    setSaving(true)
    try {
      const age = ageGroup === '0-5' ? 4 : ageGroup === '6-8' ? 7 : ageGroup === '9-11' ? 10 : 13
      const profile: LearningProfile = { reading, math, style, focus, language, interests }
      const child = await api.children.create({
        name: name.trim(), age, age_group: ageGroup!, avatar_seed: avatar,
        learning_profile: profile,
      })
      onCreated(child)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not create profile', 'error')
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
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="relative w-full max-w-lg bg-[#1a1f2e] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/5 flex-shrink-0">
          <div>
            <h2 className="text-white font-extrabold font-nunito text-lg">Add Child Profile</h2>
            <p className="text-slate-500 font-nunito text-xs mt-0.5">{STEPS[step]}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 px-6 py-3 flex-shrink-0">
          {STEPS.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300 ${i < step ? 'bg-[#22c55e]' : i === step ? 'bg-[#4ade80]' : 'bg-white/10'}`} />
          ))}
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}
            >
              {/* Step 0 — Name */}
              {step === 0 && (
                <div className="py-4">
                  <p className="text-slate-400 font-nunito text-sm mb-5">What&apos;s your child&apos;s name?</p>
                  <Input label="Name" placeholder="e.g. Amara" value={name} onChange={e => setName(e.target.value)} autoFocus />
                </div>
              )}

              {/* Step 1 — Age */}
              {step === 1 && (
                <div className="space-y-2.5 py-2">
                  <p className="text-slate-400 font-nunito text-sm mb-4">How old is {name || 'your child'}?</p>
                  {AGE_GROUPS.map(g => (
                    <button key={g.range} onClick={() => setAge(g.range)}
                      className={`w-full flex items-center gap-4 p-3.5 rounded-2xl border-2 text-left transition-all ${ageGroup === g.range ? 'border-[#4ade80] bg-[#4ade80]/10' : 'border-white/10 hover:border-white/25'}`}
                    >
                      <span className="text-2xl">{g.icon}</span>
                      <div className="flex-1">
                        <div className="text-white font-bold font-nunito text-sm">{g.label} years</div>
                        <div className="text-slate-500 text-xs font-nunito">{g.desc}</div>
                      </div>
                      {ageGroup === g.range && <Check size={16} className="text-[#4ade80] flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              )}

              {/* Step 2 — Avatar */}
              {step === 2 && (
                <div className="py-2">
                  <p className="text-slate-400 font-nunito text-sm mb-4">Pick {name ? `${name}'s` : 'their'} character</p>
                  <div className="grid grid-cols-4 gap-2.5">
                    {AVATAR_OPTIONS.map(av => (
                      <button key={av.id} onClick={() => setAvatar(av.id)}
                        className={`relative aspect-square rounded-2xl transition-all duration-200 ${avatar === av.id ? 'scale-110 ring-4 ring-[#4ade80] ring-offset-2 ring-offset-[#1a1f2e]' : 'opacity-60 hover:opacity-90 hover:scale-105'}`}
                      >
                        <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${av.gradient} flex items-center justify-center text-3xl`}>
                          {av.emoji}
                        </div>
                        {avatar === av.id && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#4ade80] rounded-full flex items-center justify-center text-[10px] text-[#0f1117] font-bold">✓</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3 — Learning Profile */}
              {step === 3 && (
                <div className="space-y-5 py-2">
                  <p className="text-slate-400 font-nunito text-sm">
                    Help us personalise {name ? `${name}'s` : 'their'} learning journey.
                    <span className="text-slate-600"> You can update this anytime.</span>
                  </p>

                  {/* Reading */}
                  <div>
                    <SectionLabel icon={BookOpen} label="Reading ability" />
                    <PillRow options={readingOpts} value={reading} onChange={v => setReading(v as ReadingLevel)} />
                  </div>

                  {/* Math */}
                  <div>
                    <SectionLabel icon={Brain} label="Numbers & maths" />
                    <PillRow options={mathOpts} value={math} onChange={v => setMath(v as MathLevel)} />
                  </div>

                  {/* Language background */}
                  <div>
                    <SectionLabel icon={Globe} label="Language background" />
                    <PillRow options={langOpts} value={language} onChange={v => setLanguage(v as LanguageBackground)} />
                    {language === 'learning_english' && (
                      <p className="text-slate-600 font-nunito text-xs mt-1.5">
                        BrightMind will use simpler language and more visual cues.
                      </p>
                    )}
                  </div>

                  {/* Learning style */}
                  <div>
                    <SectionLabel icon={Sparkles} label="How do they learn best?" />
                    <PillRow options={styleOpts} value={style} onChange={v => setStyle(v as LearningStyle)} />
                  </div>

                  {/* Focus time */}
                  <div>
                    <SectionLabel icon={Clock} label="Comfortable session length" />
                    <PillRow options={focusOpts} value={focus} onChange={v => setFocus(v as FocusTime)} />
                  </div>

                  {/* Interests */}
                  <div>
                    <SectionLabel icon={Star} label="What excites them? (pick any)" />
                    <PillRow
                      options={interestOpts}
                      value={interests}
                      onChange={v => setInterests(v as Interest[])}
                      multi
                    />
                    <p className="text-slate-600 font-nunito text-[10px] mt-2">
                      Used to make lessons feel more relevant and fun
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-white/5 flex-shrink-0">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
            >
              <ChevronLeft size={18} className="text-slate-300" />
            </button>
          )}
          <button
            disabled={!canNext[step] || saving}
            onClick={() => step < 3 ? setStep(s => s + 1) : handleCreate()}
            className="flex-1 h-11 rounded-xl bg-[#4ade80] hover:bg-[#22c55e] disabled:opacity-40 disabled:cursor-not-allowed text-[#0f1117] font-extrabold font-nunito text-sm flex items-center justify-center gap-2 transition-colors"
          >
            {saving ? <Spinner size={16} color="#0f1117" /> : step < 3 ? (
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

// ── Profile badge helpers ──────────────────────────────────────────────────────
function profileBadges(profile: NonNullable<ApiChild['learning_profile']>) {
  const badges: Array<{ label: string; emoji: string }> = []
  const readingMap = { none: { label: 'Beginner reader', emoji: '🌱' }, basic: { label: 'Learning to read', emoji: '📖' }, fluent: { label: 'Fluent reader', emoji: '✨' } }
  const mathMap = { none: { label: 'Numbers starter', emoji: '🔢' }, counting: { label: 'Counting & adding', emoji: '➕' }, arithmetic: { label: 'Advanced maths', emoji: '🧮' } }
  const styleMap = { video: { label: 'Video learner', emoji: '🎬' }, activity: { label: 'Hands-on', emoji: '🎯' }, mixed: { label: 'Balanced', emoji: '⚡' } }
  const langMap = { english_first: null, bilingual: { label: 'Bilingual', emoji: '🌍' }, learning_english: { label: 'Learning English', emoji: '📚' } }
  badges.push(readingMap[profile.reading])
  badges.push(mathMap[profile.math])
  badges.push(styleMap[profile.style])
  const lang = langMap[profile.language]
  if (lang) badges.push(lang)
  return badges
}

// ── Child Card ────────────────────────────────────────────────────────────────
function ChildCard({ child, totalLessons, isActive, isSwitching, onSwitch }: {
  child: ChildWithStats; totalLessons: number; isActive: boolean; isSwitching: boolean; onSwitch: () => void
}) {
  const xp   = child.xp ?? 0
  const { level, name: levelName, nextXP, prevXP } = getLevelFromXP(xp)
  const xpPct     = nextXP > prevXP ? Math.round(((xp - prevXP) / (nextXP - prevXP)) * 100) : 100
  const lessonPct = totalLessons > 0 ? Math.round((child.lessonsCompleted / totalLessons) * 100) : 0
  const ageGrp    = ageToGroup(child.age)
  const ageCfg    = AGE_GROUPS.find(g => g.range === ageGrp)!
  const lp        = child.learning_profile

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className={`relative bg-[#1a1f2e] rounded-3xl border transition-all ${isActive ? 'border-[#4ade80]/40 shadow-lg shadow-[#4ade80]/5' : 'border-white/5 hover:border-white/10'}`}
    >
      {isActive && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-[#4ade80]/15 border border-[#4ade80]/30 rounded-full px-2.5 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
          <span className="text-[#4ade80] font-nunito font-bold text-[10px] uppercase tracking-wide">Active</span>
        </div>
      )}

      <div className="p-5">
        {/* Avatar + name */}
        <div className="flex items-center gap-4 mb-4">
          <Avatar seed={child.avatar_seed} name={child.name} size={60} ring={isActive} />
          <div>
            <h3 className="text-white font-extrabold text-lg font-nunito">{child.name}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 font-nunito font-bold text-xs px-2.5 py-0.5 rounded-full" style={{ background: `${ageCfg.color}20`, color: ageCfg.color }}>
                {ageCfg.icon} {ageGrp} yrs
              </span>
              <span className="text-slate-500 font-nunito text-xs">Lvl {level} · {levelName}</span>
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
            <div key={label} className="bg-[#252b3b] rounded-xl p-2.5 text-center">
              <Icon size={13} style={{ color }} className="mx-auto mb-1" fill={color} />
              <div className="text-white font-bold text-sm font-nunito">{val}</div>
              <div className="text-slate-600 text-[10px] font-nunito uppercase tracking-wide">{label}</div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="space-y-2.5 mb-4">
          <div>
            <div className="flex justify-between text-[10px] font-nunito text-slate-500 mb-1">
              <span>XP progress</span><span>{xp} / {nextXP}</span>
            </div>
            <ProgressBar value={xpPct} color="#eab308" height={4} />
          </div>
          <div>
            <div className="flex justify-between text-[10px] font-nunito text-slate-500 mb-1">
              <span>Lessons completed</span><span>{child.lessonsCompleted} / {totalLessons}</span>
            </div>
            <ProgressBar value={lessonPct} color="#3b82f6" height={4} />
          </div>
        </div>

        {/* Learning profile */}
        {lp ? (
          <div className="bg-[#252b3b] rounded-2xl p-3 mb-4">
            <p className="text-slate-500 font-nunito text-[10px] uppercase tracking-wider mb-2 font-semibold">Learning profile</p>
            <div className="flex flex-wrap gap-1.5">
              {profileBadges(lp).map(b => (
                <span key={b.label} className="flex items-center gap-1 bg-white/5 text-slate-300 font-nunito text-[10px] font-semibold px-2 py-1 rounded-lg">
                  {b.emoji} {b.label}
                </span>
              ))}
              {(lp.interests ?? []).length > 0 && (
                <span className="flex items-center gap-1 bg-purple-500/10 text-purple-300 font-nunito text-[10px] font-semibold px-2 py-1 rounded-lg">
                  Likes: {(lp.interests ?? []).map(i => ({ animals:'🐾', space:'🚀', sports:'⚽', arts:'🎨', stories:'📚', puzzles:'🧩' }[i])).join(' ')}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-[#252b3b] rounded-2xl p-3 mb-4 flex items-center gap-3">
            <span className="text-xl">{ageCfg.icon}</span>
            <div>
              <p className="text-white font-nunito font-semibold text-xs">Enrolled curriculum</p>
              <p className="text-slate-500 font-nunito text-xs">{ageCfg.desc}</p>
            </div>
          </div>
        )}

        {/* Switch / Active */}
        {isActive ? (
          <div className="flex items-center justify-center gap-2 h-10 rounded-xl bg-[#4ade80]/10 border border-[#4ade80]/20">
            <Check size={14} className="text-[#4ade80]" />
            <span className="text-[#4ade80] font-nunito font-bold text-sm">Currently learning</span>
          </div>
        ) : (
          <button
            onClick={onSwitch} disabled={isSwitching}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-white/5 hover:bg-[#4ade80]/10 border border-white/10 hover:border-[#4ade80]/30 text-slate-300 hover:text-[#4ade80] font-nunito font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSwitching ? <><Spinner size={14} color="currentColor" /> Switching…</> : <>Switch to {child.name} <ArrowRight size={14} /></>}
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ParentPage() {
  const router = useRouter()
  const { child: activeChild, setChild } = useAppStore()
  const [children,     setChildren]     = useState<ChildWithStats[]>([])
  const [totalLessons, setTotalLessons] = useState(0)
  const [loading,      setLoading]      = useState(true)
  const [switching,    setSwitching]    = useState<number | null>(null)
  const [showAdd,      setShowAdd]      = useState(false)

  const load = useCallback(async () => {
    if (!getToken()) { setLoading(false); return }
    try {
      const [childList, allLessons] = await Promise.all([api.children.list(), api.lessons.list()])
      setTotalLessons(allLessons.length)
      const withStats: ChildWithStats[] = await Promise.all(
        childList.map(async c => {
          try {
            const progress = await api.progress.list(c.id)
            return { ...c, lessonsCompleted: progress.filter(p => p.status === 'completed').length, totalLessons: allLessons.length }
          } catch {
            return { ...c, lessonsCompleted: 0, totalLessons: allLessons.length }
          }
        })
      )
      setChildren(withStats)
    } catch {
      toast('Could not load profiles', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreated = (newChild: ApiChild) => {
    setShowAdd(false)
    toast(`${newChild.name}'s profile created!`, 'success')
    load()
  }

  const handleSwitch = async (child: ApiChild) => {
    setSwitching(Number(child.id))
    setChild({
      id: String(child.id), user_id: String(child.user_id),
      name: child.name, age: child.age, avatar_seed: child.avatar_seed,
      created_at: '', learning_profile: child.learning_profile ?? undefined,
    })
    toast(`Switched to ${child.name}`, 'success')
    router.push('/dashboard')
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size={40} /></div>

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
            <Users size={26} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white font-nunito">Family Hub</h1>
            <p className="text-slate-400 font-nunito text-sm mt-0.5">
              {children.length === 0
                ? 'Add your children to get started'
                : `${children.length} child profile${children.length > 1 ? 's' : ''} — personalised lessons for each`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-[#4ade80] hover:bg-[#22c55e] text-[#0f1117] font-extrabold font-nunito text-sm px-5 py-3 rounded-xl transition-colors shadow-md shadow-green-500/20"
        >
          <Plus size={18} /> Add Child
        </button>
      </div>

      {/* Age group reference */}
      <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-4 mb-6">
        <p className="text-slate-500 font-nunito text-xs uppercase tracking-widest mb-3 font-semibold">Curriculum by age</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {AGE_GROUPS.map(g => (
            <div key={g.range} className="bg-[#252b3b] rounded-xl p-3 flex items-center gap-2.5">
              <span className="text-lg">{g.icon}</span>
              <div>
                <p className="font-nunito font-bold text-xs" style={{ color: g.color }}>{g.label} yrs</p>
                <p className="text-slate-500 font-nunito text-[10px] leading-tight">{g.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Child grid */}
      {children.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
          <div className="w-24 h-24 rounded-full bg-[#252b3b] border border-white/5 flex items-center justify-center text-5xl">
            👨‍👩‍👧‍👦
          </div>
          <div>
            <p className="text-white font-bold text-xl font-nunito mb-2">No child profiles yet</p>
            <p className="text-slate-500 font-nunito text-sm max-w-xs mx-auto">
              Add each of your children — they get personalised lessons based on their learning profile.
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-[#4ade80] hover:bg-[#22c55e] text-[#0f1117] font-extrabold font-nunito px-7 py-3 rounded-xl transition-colors"
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
            className="border-2 border-dashed border-white/10 hover:border-[#4ade80]/30 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 transition-colors group min-h-[200px]"
          >
            <div className="w-14 h-14 rounded-full bg-[#4ade80]/10 group-hover:bg-[#4ade80]/20 flex items-center justify-center transition-colors">
              <Plus size={24} className="text-[#4ade80]" />
            </div>
            <div className="text-center">
              <p className="text-slate-400 group-hover:text-white font-nunito font-semibold text-sm transition-colors">Add another child</p>
              <p className="text-slate-600 font-nunito text-xs mt-0.5">Each child gets their own profile</p>
            </div>
          </button>
        </div>
      )}

      <AnimatePresence>
        {showAdd && <AddChildModal onClose={() => setShowAdd(false)} onCreated={handleCreated} />}
      </AnimatePresence>
    </PageWrapper>
  )
}
