'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Pip } from '@/components/mascot/Pip'
import { toast } from '@/components/ui/Toast'
import { AnimatedSun, DoodleCloud, DoodleStar } from '@/components/home/KidsDoodles'
import type {
  AgeGroup, LearningProfile,
  ReadingLevel, MathLevel, LearningStyle, FocusTime, LanguageBackground, Interest,
} from '@/types/child'
import { AVATAR_OPTIONS } from '@/lib/avatars'

const AGE_GROUPS: Array<{ label: string; range: AgeGroup; desc: string; icon: string }> = [
  { label: '0 – 5',   range: '0-5',   icon: '🌱', desc: 'Toddlers & Pre-K — letters, numbers, shapes' },
  { label: '6 – 8',   range: '6-8',   icon: '📚', desc: 'Early learners — reading, basic math, science' },
  { label: '9 – 11',  range: '9-11',  icon: '🔭', desc: 'Growing minds — multiplication, grammar, geography' },
  { label: '12 – 14', range: '12-14', icon: '🎓', desc: 'Middle schoolers — algebra, essays, history' },
]

function CardRow<T extends string>({
  label,
  options,
  value,
  onChange,
  multi = false,
}: {
  label: string
  options: Array<{ value: T; label: string; emoji: string; desc: string }>
  value: T | T[]
  onChange: (v: T | T[]) => void
  multi?: boolean
}) {
  const isSelected = (v: T) => multi ? (value as T[]).includes(v) : value === v
  const toggle = (v: T) => {
    if (!multi) { onChange(v); return }
    const arr = value as T[]
    onChange(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v])
  }

  return (
    <div className="mb-5">
      <p className="text-slate-500 font-nunito font-black text-xs uppercase tracking-wider mb-2">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={`relative flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all text-center ${
              isSelected(opt.value)
                ? 'border-[#22c55e] bg-emerald-50 text-emerald-950 font-black shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
            }`}
          >
            <span className="text-2xl">{opt.emoji}</span>
            <span className="text-xs leading-tight">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const setChild = useAppStore(s => s.setChild)
  const hydrateProfile = useAppStore(s => s.hydrateProfile)

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState('')
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('6-8')
  const [avatar, setAvatar] = useState('lion')

  const [reading, setReading] = useState<ReadingLevel>('basic')
  const [math, setMath] = useState<MathLevel>('counting')
  const [language, setLanguage] = useState<LanguageBackground>('english_first')
  const [style, setStyle] = useState<LearningStyle>('activity')
  const [focus, setFocus] = useState<FocusTime>('medium')
  const [interests, setInterests] = useState<Interest[]>(['animals', 'space'])

  const readingOpts: Array<{ value: ReadingLevel; label: string; emoji: string; desc: string }> = [
    { value: 'none',   label: 'Not yet',     emoji: '🔤', desc: 'Learning letter sounds' },
    { value: 'basic',  label: 'Early reader', emoji: '📖', desc: 'Reads simple words' },
    { value: 'fluent', label: 'Fluent',       emoji: '📚', desc: 'Reads sentences easily' },
  ]
  const mathOpts: Array<{ value: MathLevel; label: string; emoji: string; desc: string }> = [
    { value: 'none',       label: 'Starting out', emoji: '🖐️', desc: 'Recognises numbers 1-5' },
    { value: 'counting',   label: 'Counting',     emoji: '🔢', desc: 'Counts to 20+, basic adds' },
    { value: 'arithmetic', label: 'Math whiz',    emoji: '➕', desc: 'Addition & subtraction' },
  ]
  const langOpts: Array<{ value: LanguageBackground; label: string; emoji: string; desc: string }> = [
    { value: 'english_first',    label: 'English First', emoji: '🇬🇧', desc: 'Primary language' },
    { value: 'bilingual',        label: 'Bilingual',     emoji: '🗣️', desc: 'Speaks two languages' },
    { value: 'learning_english', label: 'Learning ESL',   emoji: '🌍', desc: 'English is second language' },
  ]
  const styleOpts: Array<{ value: LearningStyle; label: string; emoji: string; desc: string }> = [
    { value: 'activity', label: 'Hands-on', emoji: '🎮', desc: 'Gains from games & speaking' },
    { value: 'video',    label: 'Visual',   emoji: '🎬', desc: 'Loves video & pictures' },
    { value: 'mixed',    label: 'Mixed',    emoji: '✨', desc: 'Enjoys a blend of both' },
  ]
  const focusOpts: Array<{ value: FocusTime; label: string; emoji: string; desc: string }> = [
    { value: 'short',  label: '5 – 8 mins',  emoji: '⚡', desc: 'Short, punchy bites' },
    { value: 'medium', label: '10 – 15 mins', emoji: '🎯', desc: 'Balanced focus time' },
    { value: 'long',   label: '20+ mins',    emoji: '🧘', desc: 'Deep concentration' },
  ]
  const interestOpts: Array<{ value: Interest; label: string; emoji: string; desc: string }> = [
    { value: 'animals', label: 'Animals',  emoji: '🐾', desc: '' },
    { value: 'space',   label: 'Space',    emoji: '🚀', desc: '' },
    { value: 'sports',  label: 'Sports',   emoji: '⚽', desc: '' },
    { value: 'arts',    label: 'Arts',     emoji: '🎨', desc: '' },
    { value: 'stories', label: 'Stories',  emoji: '📖', desc: '' },
    { value: 'puzzles', label: 'Puzzles',  emoji: '🧩', desc: '' },
  ]

  const ageMap: Record<AgeGroup, number> = { '0-5': 4, '6-8': 7, '9-11': 10, '12-14': 13 }

  const canNext = [
    name.trim().length > 0,
    true,
    true,
    true,
    true,
  ]

  const msgs = [
    "Hi there! What's the name of our new explorer?",
    `Nice to meet ${name || 'them'}! Which age group are we exploring?`,
    "Now pick an avatar companion for the adventures!",
    "Tell us how they learn best — we'll adapt every game!",
    `All set! Let's blast off into learning! 🚀`,
  ]

  const handleCreate = async () => {
    setLoading(true)
    try {
      const learning_profile: LearningProfile = { reading, math, language, style, focus, interests }
      const child = await api.children.create({
        name: name.trim(),
        age: ageMap[ageGroup],
        age_group: ageGroup,
        avatar_seed: avatar,
        learning_profile,
      })
      setChild({
        id: String(child.id),
        user_id: String(child.user_id),
        name: child.name,
        age: child.age,
        avatar_seed: child.avatar_seed ?? 'lion',
        created_at: '',
        learning_profile,
      })
      hydrateProfile(child)
      toast(`Profile created for ${name}!`, 'success')
      router.push('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create child profile'
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const next = () => {
    if (step === 4) { handleCreate(); return }
    setStep(s => s + 1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e0f2fe] via-[#f0f9ff] to-[#fffdf8] flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden font-nunito selection:bg-amber-300 selection:text-slate-900">
      
      {/* Friendly Sun & Floating Clouds in Sunny Daytime Sky */}
      <div className="absolute top-4 left-6 sm:left-12 w-20 h-20 sm:w-28 sm:h-28 pointer-events-none opacity-90 z-0">
        <AnimatedSun />
      </div>
      <DoodleCloud className="absolute top-10 left-20 sm:left-32 w-32 sm:w-44 h-16 sm:h-20 opacity-70 z-0" delay={0} />
      <DoodleCloud className="absolute top-8 right-10 sm:right-24 w-40 sm:w-52 h-20 sm:h-24 opacity-80 z-0" delay={1.5} />
      <DoodleStar className="absolute top-32 left-1/4 w-7 h-7 opacity-60 z-0" />
      <DoodleStar className="absolute top-24 right-1/4 w-8 h-8 opacity-60 z-0" />

      {/* Header with Official Bright Steps Logo & Step Badge */}
      <header className="relative z-20 flex items-center justify-between max-w-xl mx-auto w-full pt-2">
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] border-2 border-white shadow-md flex items-center justify-center text-xl transition-transform group-hover:scale-105">
            📖
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-black text-[#0f4c5c] tracking-tight leading-none group-hover:text-[#0284c7] transition-colors">
              Bright Steps
            </span>
            <span className="text-[9px] sm:text-[10px] font-black text-[#0284c7] tracking-wider uppercase mt-0.5">
              Imagine • Discover • Grow
            </span>
          </div>
        </Link>
        <div className="text-[#0284c7] font-black text-xs bg-white border border-[#bae6fd] px-3.5 py-1.5 rounded-full shadow-xs">
          Step {step + 1} of 5
        </div>
      </header>

      {/* Main Card Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-20">
        <div className="w-full max-w-lg">
          
          {/* Progress dots */}
          <div className="flex gap-2 justify-center mb-6">
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-8 bg-[#0284c7]' : i < step ? 'w-2.5 bg-[#22c55e]' : 'w-2.5 bg-slate-300/70'
                }`}
              />
            ))}
          </div>

          {/* Pip Speaking */}
          <div className="flex items-end gap-3 mb-6 justify-center">
            <Pip size="md" mood={step === 4 ? 'excited' : 'happy'} animate="idle" />
            <div className="bg-white text-slate-800 rounded-2xl px-4 py-2.5 shadow-md border-2 border-[#bae6fd] relative text-xs sm:text-sm font-black max-w-[280px]">
              <span>{msgs[step]}</span>
              <div className="absolute -bottom-1.5 left-4 w-3 h-3 bg-white border-b-2 border-r-2 border-[#bae6fd] rotate-45" />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#bae6fd] border-b-[6px] border-b-[#7dd3fc] shadow-xl shadow-sky-100/50 text-slate-800"
            >
              {/* Step 0 — Name */}
              {step === 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-black text-[#0f4c5c]">What should Pip call your learner?</h2>
                  <Input
                    label="Child's First Name"
                    placeholder="e.g. Amara"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoFocus
                  />
                </div>
              )}

              {/* Step 1 — Age group */}
              {step === 1 && (
                <div className="space-y-3">
                  <h2 className="text-xl font-black text-[#0f4c5c] mb-2">Select their age band:</h2>
                  {AGE_GROUPS.map(g => (
                    <button
                      key={g.range}
                      onClick={() => setAgeGroup(g.range)}
                      className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${
                        ageGroup === g.range
                          ? 'border-[#0284c7] bg-sky-50 text-sky-950 font-black shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <span className="text-3xl">{g.icon}</span>
                      <div className="flex-1">
                        <div className="font-black text-base">{g.label} years</div>
                        <div className="text-slate-500 font-bold text-xs mt-0.5">{g.desc}</div>
                      </div>
                      {ageGroup === g.range && <Check size={20} className="text-[#0284c7]" />}
                    </button>
                  ))}
                </div>
              )}

              {/* Step 2 — Avatar */}
              {step === 2 && (
                <div>
                  <h2 className="text-xl font-black text-[#0f4c5c] text-center mb-1">Pick an Adventure Avatar</h2>
                  <p className="text-slate-500 font-bold text-xs text-center mb-4">Tap to choose their explorer buddy</p>
                  <div className="grid grid-cols-4 gap-3">
                    {AVATAR_OPTIONS.map(av => (
                      <button
                        key={av.id}
                        onClick={() => setAvatar(av.id)}
                        className={`relative aspect-square rounded-2xl transition-all duration-200 ${
                          avatar === av.id
                            ? 'scale-110 ring-4 ring-[#0284c7] ring-offset-2 ring-offset-white'
                            : 'opacity-70 hover:opacity-100 hover:scale-105'
                        }`}
                      >
                        <div className={`w-full h-full rounded-2xl ${av.bgColor} flex items-center justify-center text-4xl shadow-md`}>
                          {av.emoji}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3 — Full learning profile */}
              {step === 3 && (
                <div className="max-h-[50vh] overflow-y-auto pr-1">
                  <h2 className="text-xl font-black text-[#0f4c5c] mb-4">Personalize the Adventure:</h2>
                  <CardRow label="Reading ability"       options={readingOpts}   value={reading}   onChange={v => setReading(v as ReadingLevel)} />
                  <CardRow label="Numbers & maths"       options={mathOpts}      value={math}      onChange={v => setMath(v as MathLevel)} />
                  <CardRow label="Language background"   options={langOpts}      value={language}  onChange={v => setLanguage(v as LanguageBackground)} />
                  <CardRow label="How they learn best"   options={styleOpts}     value={style}     onChange={v => setStyle(v as LearningStyle)} />
                  <CardRow label="Session length"        options={focusOpts}     value={focus}     onChange={v => setFocus(v as FocusTime)} />
                  <CardRow
                    label="Interests (Pick any)"
                    options={interestOpts}
                    value={interests}
                    onChange={v => setInterests(v as Interest[])}
                    multi
                  />
                </div>
              )}

              {/* Step 4 — Confirm */}
              {step === 4 && (() => {
                const av = AVATAR_OPTIONS.find(a => a.id === avatar) ?? AVATAR_OPTIONS[0]
                return (
                  <div className="text-center py-2">
                    <div className={`w-20 h-20 rounded-full ${av.bgColor} flex items-center justify-center text-4xl mx-auto mb-3 ring-4 ring-[#0284c7] shadow-lg`}>
                      {av.emoji}
                    </div>
                    <div className="text-[#0f4c5c] font-black text-2xl font-nunito">{name}</div>
                    <div className="text-slate-500 font-bold text-sm mt-0.5">Ages {ageGroup} Explorer</div>
                    <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-900 text-xs font-bold leading-relaxed">
                      🌟 Learning path ready! All 4 core subjects configured for {name}.
                    </div>
                  </div>
                )
              })()}
            </motion.div>
          </AnimatePresence>

          {/* Action buttons */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="bg-white hover:bg-slate-50 text-slate-700 font-black text-sm px-5 py-3.5 rounded-2xl border-2 border-slate-200 border-b-4 border-slate-300 shadow-sm transition-all active:translate-y-0.5"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <button
              type="button"
              disabled={!canNext[step] || loading}
              onClick={next}
              className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white font-black text-base py-3.5 px-6 rounded-2xl shadow-md border-b-4 border-b-[#047857] transition-all hover:scale-[1.01] active:translate-y-1 active:border-b-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <span>{step === 4 ? (loading ? 'Creating...' : "Let's Learn! 🚀") : 'Continue'}</span>
              {step < 4 && <ChevronRight size={20} />}
            </button>
          </div>

        </div>
      </div>

      {/* Undulating Rolling Green Hills SVG at bottom */}
      <div className="w-full leading-none relative z-10 -mt-6">
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="w-full h-16 sm:h-24 block"
        >
          <path d="M 0 40 Q 400 10 850 35 T 1440 25 L 1440 120 L 0 120 Z" fill="#86efac" opacity="0.6" />
          <path d="M 0 65 Q 420 30 900 55 T 1440 35 L 1440 120 L 0 120 Z" fill="#22c55e" />
          <g transform="translate(240, 68)">
            <circle cx="0" cy="0" r="5" fill="#ffffff" />
            <circle cx="0" cy="0" r="2" fill="#facc15" />
          </g>
          <g transform="translate(1200, 58)">
            <circle cx="0" cy="0" r="5" fill="#ffffff" />
            <circle cx="0" cy="0" r="2" fill="#facc15" />
          </g>
        </svg>
      </div>

    </div>
  )
}
