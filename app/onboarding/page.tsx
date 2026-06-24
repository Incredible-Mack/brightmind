'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { api } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Pip } from '@/components/mascot/Pip'
import { SpeechBubble } from '@/components/mascot/SpeechBubble'
import { toast } from '@/components/ui/Toast'
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
      <p className="text-slate-400 font-nunito text-xs uppercase tracking-wider mb-2">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={`relative flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all text-center ${
              isSelected(opt.value)
                ? 'border-[#4ade80] bg-[#4ade80]/10'
                : 'border-white/10 hover:border-white/30'
            }`}
          >
            {multi && isSelected(opt.value) && (
              <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#4ade80] rounded-full flex items-center justify-center">
                <Check size={9} className="text-[#0f1117]" />
              </div>
            )}
            <span className="text-2xl">{opt.emoji}</span>
            <span className="text-white font-nunito font-bold text-xs leading-tight">{opt.label}</span>
            <span className="text-slate-500 font-nunito text-[10px] leading-tight hidden sm:block">{opt.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const setChild = useAppStore(s => s.setChild)
  const [step,     setStep]    = useState(0)
  const [name,     setName]    = useState('')
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null)
  const [avatar,   setAvatar]  = useState(AVATAR_OPTIONS[0].id)
  const [loading,  setLoading] = useState(false)

  // Full learning profile
  const [reading,   setReading]   = useState<ReadingLevel>('basic')
  const [math,      setMath]      = useState<MathLevel>('counting')
  const [language,  setLanguage]  = useState<LanguageBackground>('english_first')
  const [style,     setStyle]     = useState<LearningStyle>('mixed')
  const [focus,     setFocus]     = useState<FocusTime>('medium')
  const [interests, setInterests] = useState<Interest[]>([])

  const msgs = [
    "What's your child's name?",
    'How old are they?',
    `Pick a fun character for ${name || 'them'}!`,
    `Tell me about ${name || 'them'} so I can plan the perfect lessons!`,
    `All set, ${name || 'champ'}! Ready to learn? 🎉`,
  ]

  const canNext = [
    name.trim().length >= 2,
    ageGroup !== null,
    true,
    true,
    true,
  ]

  const readingOpts: Array<{ value: ReadingLevel; label: string; emoji: string; desc: string }> = [
    { value: 'none',   label: 'Not yet',    emoji: '🌱', desc: 'Just learning letters & sounds' },
    { value: 'basic',  label: 'Learning',   emoji: '📖', desc: 'Simple words & sentences' },
    { value: 'fluent', label: 'Reads well', emoji: '✨', desc: 'Reads independently' },
  ]
  const mathOpts: Array<{ value: MathLevel; label: string; emoji: string; desc: string }> = [
    { value: 'none',       label: 'Starting',  emoji: '🔢', desc: 'Learning shapes & numbers' },
    { value: 'counting',   label: 'Counting',  emoji: '➕', desc: 'Counting, adding & subtracting' },
    { value: 'arithmetic', label: 'Advanced',  emoji: '🧮', desc: 'Multiplication, fractions & beyond' },
  ]
  const langOpts: Array<{ value: LanguageBackground; label: string; emoji: string; desc: string }> = [
    { value: 'english_first',    label: 'English 1st',  emoji: '🏡', desc: 'English spoken at home' },
    { value: 'bilingual',        label: 'Bilingual',    emoji: '🌍', desc: 'Two or more languages' },
    { value: 'learning_english', label: 'Learning Eng', emoji: '📚', desc: 'English is being learnt' },
  ]
  const styleOpts: Array<{ value: LearningStyle; label: string; emoji: string; desc: string }> = [
    { value: 'video',    label: 'Videos',     emoji: '🎬', desc: 'Watches & listens' },
    { value: 'activity', label: 'Activities', emoji: '🎯', desc: 'Doing & practising' },
    { value: 'mixed',    label: 'Both',       emoji: '⚡', desc: 'Mix of both' },
  ]
  const focusOpts: Array<{ value: FocusTime; label: string; emoji: string; desc: string }> = [
    { value: 'short',  label: '~15 min',  emoji: '⏱️', desc: 'Short, focused bursts' },
    { value: 'medium', label: '~30 min',  emoji: '🕐', desc: 'A comfortable session' },
    { value: 'long',   label: '30+ min',  emoji: '🎯', desc: 'Deep focus, loves it' },
  ]
  const interestOpts: Array<{ value: Interest; label: string; emoji: string; desc: string }> = [
    { value: 'animals',  label: 'Animals',  emoji: '🐾', desc: 'Pets & wildlife' },
    { value: 'space',    label: 'Space',    emoji: '🚀', desc: 'Stars & planets' },
    { value: 'sports',   label: 'Sports',   emoji: '⚽', desc: 'Games & movement' },
    { value: 'arts',     label: 'Arts',     emoji: '🎨', desc: 'Drawing & music' },
    { value: 'stories',  label: 'Stories',  emoji: '📚', desc: 'Books & tales' },
    { value: 'puzzles',  label: 'Puzzles',  emoji: '🧩', desc: 'Logic & challenges' },
  ]

  const handleCreate = async () => {
    setLoading(true)
    try {
      const age = ageGroup === '0-5' ? 4 : ageGroup === '6-8' ? 7 : ageGroup === '9-11' ? 10 : 13
      const learningProfile: LearningProfile = { reading, math, style, focus, language, interests }
      const child = await api.children.create({
        name: name.trim(), age, age_group: ageGroup!, avatar_seed: avatar,
        learning_profile: learningProfile,
      })
      setChild({
        id: String(child.id), user_id: '',
        name: child.name, age: child.age, avatar_seed: child.avatar_seed,
        created_at: '', learning_profile: learningProfile,
      })
      router.push('/dashboard')
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Could not create profile', 'error')
    } finally {
      setLoading(false)
    }
  }

  const next = () => {
    if (step === 4) { handleCreate(); return }
    setStep(s => s + 1)
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Progress dots */}
        <div className="flex gap-2 justify-center mb-8">
          {[0,1,2,3,4].map(i => (
            <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-[#4ade80]' : i < step ? 'w-2 bg-[#22c55e]' : 'w-2 bg-white/20'}`} />
          ))}
        </div>

        <div className="flex items-end gap-4 mb-8 justify-center">
          <Pip size="lg" mood={step === 4 ? 'excited' : 'happy'} animate="idle" />
          <SpeechBubble text={msgs[step]} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="bg-[#252b3b] rounded-3xl p-6 border border-white/5"
          >
            {/* Step 0 — Name */}
            {step === 0 && (
              <Input label="Child's Name" placeholder="e.g. Amara" value={name} onChange={e => setName(e.target.value)} autoFocus />
            )}

            {/* Step 1 — Age group */}
            {step === 1 && (
              <div className="grid grid-cols-1 gap-3">
                {AGE_GROUPS.map(g => (
                  <button
                    key={g.range} onClick={() => setAgeGroup(g.range)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${ageGroup === g.range ? 'border-[#4ade80] bg-[#4ade80]/10' : 'border-white/10 hover:border-white/30'}`}
                  >
                    <span className="text-3xl">{g.icon}</span>
                    <div>
                      <div className="text-white font-bold font-nunito">{g.label} years</div>
                      <div className="text-slate-400 text-sm font-nunito mt-0.5">{g.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2 — Avatar */}
            {step === 2 && (
              <div>
                <p className="text-slate-400 font-nunito text-sm text-center mb-4">
                  Tap to pick {name ? `${name}'s` : 'their'} character
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {AVATAR_OPTIONS.map(av => (
                    <button
                      key={av.id} onClick={() => setAvatar(av.id)}
                      className={`relative aspect-square rounded-2xl transition-all duration-200 ${avatar === av.id ? 'scale-110 ring-4 ring-[#4ade80] ring-offset-2 ring-offset-[#252b3b]' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}
                    >
                      <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${av.gradient} flex items-center justify-center text-4xl`}>
                        {av.emoji}
                      </div>
                      {avatar === av.id && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#4ade80] rounded-full flex items-center justify-center text-xs text-[#0f1117] font-bold">✓</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3 — Full learning profile */}
            {step === 3 && (
              <div className="max-h-[55vh] overflow-y-auto pr-1">
                <CardRow label="Reading ability"       options={readingOpts}   value={reading}   onChange={v => setReading(v as ReadingLevel)} />
                <CardRow label="Numbers & maths"       options={mathOpts}      value={math}      onChange={v => setMath(v as MathLevel)} />
                <CardRow label="Language background"   options={langOpts}      value={language}  onChange={v => setLanguage(v as LanguageBackground)} />
                <CardRow label="How they learn best"   options={styleOpts}     value={style}     onChange={v => setStyle(v as LearningStyle)} />
                <CardRow label="Session length"        options={focusOpts}     value={focus}     onChange={v => setFocus(v as FocusTime)} />
                <CardRow
                  label="What excites them? (pick any)"
                  options={interestOpts}
                  value={interests}
                  onChange={v => setInterests(v as Interest[])}
                  multi
                />
                <p className="text-slate-600 font-nunito text-xs text-center mt-1">
                  BrightMind personalises every lesson based on this. Update it anytime.
                </p>
              </div>
            )}

            {/* Step 4 — Confirm */}
            {step === 4 && (() => {
              const av = AVATAR_OPTIONS.find(a => a.id === avatar) ?? AVATAR_OPTIONS[0]
              const readingLabel   = readingOpts.find(r => r.value === reading)!
              const mathLabel      = mathOpts.find(m => m.value === math)!
              const styleLabel     = styleOpts.find(s => s.value === style)!
              const focusLabel     = focusOpts.find(f => f.value === focus)!
              const langLabel      = langOpts.find(l => l.value === language)!
              const interestEmojis = interests.map(i => interestOpts.find(o => o.value === i)?.emoji).filter(Boolean)
              return (
                <div className="text-center py-4">
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${av.gradient} flex items-center justify-center text-5xl mx-auto mb-4 ring-4 ring-[#4ade80] ring-offset-4 ring-offset-[#252b3b]`}>
                    {av.emoji}
                  </div>
                  <div className="text-white font-extrabold text-2xl font-nunito">{name}</div>
                  <div className="text-slate-400 font-nunito mt-1 text-sm">Age {ageGroup}</div>
                  <div className="flex justify-center gap-2 mt-4 flex-wrap">
                    {[readingLabel, mathLabel, styleLabel, focusLabel, langLabel].map(b => (
                      <span key={b.value} className="bg-[#1a1f2e] rounded-full px-3 py-1 text-xs font-nunito text-slate-300 font-semibold">
                        {b.emoji} {b.label}
                      </span>
                    ))}
                    {interestEmojis.length > 0 && (
                      <span className="bg-purple-500/10 text-purple-300 rounded-full px-3 py-1 text-xs font-nunito font-semibold">
                        {interestEmojis.join(' ')}
                      </span>
                    )}
                  </div>
                </div>
              )
            })()}
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <Button variant="secondary" size="lg" onClick={() => setStep(s => s - 1)}>
              <ChevronLeft size={20} />
            </Button>
          )}
          <Button size="lg" fullWidth disabled={!canNext[step]} loading={loading} onClick={next}>
            {step === 4 ? "Let's Learn! 🚀" : 'Continue'}
            {step < 4 && <ChevronRight size={20} />}
          </Button>
        </div>
      </div>
    </div>
  )
}
