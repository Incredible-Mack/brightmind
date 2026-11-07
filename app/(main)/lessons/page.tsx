'use client'
import { useCallback, useEffect, useState, useMemo, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Lock,
  CheckCircle2,
  PlayCircle,
  BookOpen,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Trophy,
  Star,
  Layers,
  ChevronRight,
  Filter,
  ShieldCheck,
  Zap,
  Award,
  Check,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { api } from '@/lib/api'
import type { Subject } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus'
import { Spinner } from '@/components/ui/Spinner'
import { Avatar } from '@/components/ui/Avatar'
import { SubjectIcon, subjectColors } from '@/components/icons/SubjectIcon'
import { IllustratedFactBanner } from '@/components/curriculum/IllustratedFactBanner'
import { imageSrc } from '@/lib/media'
import type { HeroSettings } from '@/lib/api'
import type { Lesson, SubjectSlug } from '@/types/lesson'
import type { LessonProgress } from '@/lib/api'
import type { AgeGroup, LearningProfile } from '@/types/child'
import {
  AGE_GROUPS,
  AGE_GROUP_META,
  getAgeGroup,
  lessonMatchesAge,
  FALLBACK_SUBJECTS,
  FALLBACK_LESSONS,
} from '@/lib/curriculum.data'

type LessonStatus = 'locked' | 'unlocked' | 'in_progress' | 'completed'

function isFitForProfile(lesson: Lesson, subjectSlug: string, lp: LearningProfile): boolean {
  const d = lesson.difficulty
  if (subjectSlug === 'math') {
    if (lp.math === 'none') return d === 'easy'
    if (lp.math === 'counting') return d === 'easy' || d === 'medium'
    return true
  }
  if (subjectSlug === 'english') {
    if (lp.reading === 'none') return d === 'easy'
    if (lp.reading === 'basic') return d === 'easy' || d === 'medium'
    return true
  }
  return true
}

function statusForLesson(
  lesson: Lesson,
  sortedInSubject: Lesson[],
  progressMap: Map<number, LessonProgress>,
): LessonStatus {
  const prog = progressMap.get(Number(lesson.id))
  if (prog?.status === 'completed') return 'completed'
  if (prog?.status === 'in_progress') return 'in_progress'
  const idx = sortedInSubject.findIndex(l => l.id === lesson.id)
  if (idx === 0) return 'unlocked'
  const prev = sortedInSubject[idx - 1]
  if (progressMap.get(Number(prev.id))?.status === 'completed') return 'unlocked'
  return 'locked'
}

function getLessonIcon(lesson: Lesson, subjectSlug: string): string {
  const t = lesson.title.toLowerCase()
  if (t.includes('letter') || t.includes('alphabet')) return '🔤'
  if (t.includes('vowel')) return '🅰️'
  if (t.includes('word') || t.includes('cvc')) return '🐱'
  if (t.includes('noun') || t.includes('verb')) return '📝'
  if (t.includes('story') || t.includes('balloon') || t.includes('luna') || t.includes('sailor') || t.includes('garden')) return '📖'
  if (t.includes('rhym')) return '🎵'
  if (t.includes('number') || t.includes('counting')) return '🔢'
  if (t.includes('shape')) return '🔷'
  if (t.includes('add') || t.includes('plus')) return '➕'
  if (t.includes('subtr') || t.includes('minus')) return '➖'
  if (t.includes('times') || t.includes('multipli')) return '✖️'
  if (t.includes('fraction') || t.includes('half')) return '🍕'
  if (t.includes('algebra')) return '🧮'
  if (t.includes('body') || t.includes('heart')) return '🫀'
  if (t.includes('animal') || t.includes('plant')) return '🌿'
  if (t.includes('weather') || t.includes('cloud')) return '⛅'
  if (t.includes('solar') || t.includes('space')) return '🚀'
  if (t.includes('family')) return '👨‍👩‍👧'
  if (t.includes('continent') || t.includes('ocean')) return '🌍'
  return {
    math: '🔢',
    english: '📚',
    science: '🔬',
    'social-studies': '🌍',
    'life-skills': '🤝',
    'creative-arts': '🎨',
  }[subjectSlug] || '⭐'
}

// Course highlight topics for preview pills
const SUBJECT_TOPICS: Record<string, string[]> = {
  math: ['Numbers 1–20', 'Shapes & Geometry', 'Simple Addition', 'Fun Patterns'],
  english: ['Letters A–Z', 'Phonics & Sounds', 'Rhyming Words', 'Story Reading'],
  science: ['Living Things', 'Solar System', 'Human Body', 'Weather Wonders'],
  'social-studies': ['My Family & Community', 'World Maps', 'Helping Others', 'Traditions'],
  'life-skills': ['Healthy Habits', 'Expressing Feelings', 'Teamwork', 'Safety First'],
  'creative-arts': ['Colors & Mixing', 'Musical Rhythms', 'Drawing Fun', 'Creative Tales'],
}

function LessonsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { child, xp, streak, user } = useAppStore()

  const [lessons, setLessons] = useState<Lesson[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [progress, setProgress] = useState<LessonProgress[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const [heroSettings, setHeroSettings] = useState<HeroSettings>({
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
  })

  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  const toggleMute = () => {
    setIsMuted(prev => !prev)
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
    }
  }

  // Age group filter: strictly derived from the active child profile
  const childDefaultAge: AgeGroup = useMemo(() => {
    const raw = child as unknown as { age?: number | string; age_group?: string }
    if (raw?.age_group && AGE_GROUPS.includes(raw.age_group as AgeGroup)) {
      return raw.age_group as AgeGroup
    }
    const numAge = raw?.age !== undefined ? Number(raw.age) : NaN
    if (!isNaN(numAge) && numAge > 0) {
      return getAgeGroup(numAge)
    }
    return '0-5'
  }, [child])

  const [activeAge, setActiveAge] = useState<AgeGroup>(() => childDefaultAge)

  // Automatically sync activeAge whenever the active child profile changes
  useEffect(() => {
    if (childDefaultAge) {
      setActiveAge(childDefaultAge)
    }
  }, [child?.id, childDefaultAge])

  const lp = child?.learning_profile

  const load = useCallback(() => {
    const childId = child?.id ? Number(child.id) : null
    Promise.all([
      api.subjects.list().catch(() => []),
      api.lessons.list().catch(() => []),
      childId ? api.progress.list(childId).catch(() => []) : Promise.resolve([]),
      api.hero.get().catch(() => null),
    ])
      .then(([subs, less, prog, hero]) => {
        if (hero) {
          setHeroSettings(prev => ({ ...prev, ...hero }))
        }
        const loadedSubjects = Array.isArray(subs) && subs.length > 0 ? subs : FALLBACK_SUBJECTS
        const loadedLessons = Array.isArray(less) && less.length > 0 ? (less as unknown as Lesson[]) : FALLBACK_LESSONS

        setSubjects(loadedSubjects)
        setLessons(loadedLessons)

        // Merge server progress with local completed lessons
        const stored = useAppStore.getState().completedLessons || {}
        const map = new Map<number, LessonProgress>()

        Object.entries(stored).forEach(([lid, p]) => {
          const numId = Number(lid)
          map.set(numId, {
            id: numId,
            child_id: childId ?? 0,
            lesson_id: numId,
            status: 'completed',
            score: p.score ?? 100,
            xp_earned: p.xpEarned ?? 20,
          } as LessonProgress)
        })

        if (Array.isArray(prog)) {
          prog.forEach(p => map.set(Number(p.lesson_id), p))
        }

        setProgress(Array.from(map.values()))
        setLoading(false)
      })
      .catch(() => {
        setSubjects(FALLBACK_SUBJECTS)
        setLessons(FALLBACK_LESSONS)
        setLoading(false)
      })
  }, [child?.id])

  useEffect(() => {
    load()
  }, [load])
  useRefetchOnFocus(load)

  // Handle URL query parameter `?subject=math` or `?subject=1`
  useEffect(() => {
    const subParam = searchParams.get('subject')
    if (subParam && subjects.length > 0) {
      const found = subjects.find(
        s => s.slug.toLowerCase() === subParam.toLowerCase() || String(s.id) === subParam,
      )
      if (found) {
        setSelected(Number(found.id))
      }
    } else if (!subParam) {
      setSelected(null)
    }

    const ageParam = searchParams.get('age') as AgeGroup | null
    if (ageParam && AGE_GROUPS.includes(ageParam)) {
      setActiveAge(ageParam)
    } else if (childDefaultAge) {
      setActiveAge(childDefaultAge)
    }
  }, [searchParams, subjects, childDefaultAge])

  const progressMap = useMemo(
    () => new Map<number, LessonProgress>(progress.map(p => [Number(p.lesson_id), p])),
    [progress],
  )

  const sortedLessons = useMemo(
    () => [...lessons].sort((a, b) => Number(a.order_index) - Number(b.order_index)),
    [lessons],
  )

  const displaySubjectsList = useMemo(() => {
    return subjects.length > 0 ? subjects : FALLBACK_SUBJECTS
  }, [subjects])

  // Current selected subject object
  const currentSubject = useMemo(() => {
    if (selected === null) return null
    return displaySubjectsList.find(s => Number(s.id) === selected) || null
  }, [selected, displaySubjectsList])

  // Filter lessons by subject
  const subjectAllLessons = useMemo(() => {
    if (selected === null) return []
    return sortedLessons.filter(l => Number(l.subject_id) === selected)
  }, [selected, sortedLessons])

  // Filter lessons by subject AND active age group
  const subjectFilteredLessons = useMemo(() => {
    return subjectAllLessons.filter(l => lessonMatchesAge(l, activeAge))
  }, [subjectAllLessons, activeAge])

  // Filter available subjects based on the active age stage (only show subjects with lessons for this age)
  const availableSubjectsForAge = useMemo(() => {
    return displaySubjectsList.filter(sub => {
      const allSub = sortedLessons.filter(l => Number(l.subject_id) === Number(sub.id))
      return allSub.some(l => lessonMatchesAge(l, activeAge))
    })
  }, [displaySubjectsList, sortedLessons, activeAge])

  const completedCountInSubject = useMemo(() => {
    return subjectAllLessons.filter(l => progressMap.get(Number(l.id))?.status === 'completed').length
  }, [subjectAllLessons, progressMap])

  // Total completed lessons count across all courses
  const totalCompletedCount = useMemo(() => {
    return sortedLessons.filter(l => progressMap.get(Number(l.id))?.status === 'completed').length
  }, [sortedLessons, progressMap])

  const handleSelectSubject = (sub: Subject) => {
    setSelected(Number(sub.id))
    router.push(`/lessons?subject=${sub.slug || sub.id}&age=${activeAge}`)
  }

  const handleBackToCourses = () => {
    setSelected(null)
    router.push(`/lessons?age=${activeAge}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size={40} />
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW 1: COURSE CATEGORIES (Math, English, Science, etc.)
  // ══════════════════════════════════════════════════════════════════════════
  if (selected === null) {
    return (
      <div className="w-full flex flex-col bg-[#fbfdfe] min-h-screen">
        
        {/* ── 1. Dedicated Warm Hero Section (TinyJoy & Bright Steps Style) ── */}
        <section
          className="relative overflow-hidden border-b-2 border-amber-200/80 pt-8 pb-16 px-4 sm:px-6 transition-colors"
          style={{
            background: `linear-gradient(to bottom, ${heroSettings.hero_bg_color || '#fffdf7'}, #fff8eb 60%, #fef3db 100%)`,
          }}
        >
          {/* Sunny background glow elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-200/25 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-200/25 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

          {/* Quick Admin Customizer Shortcut */}
          {user?.role === 'admin' && (
            <div className="max-w-7xl mx-auto mb-3 flex justify-end relative z-20">
              <button
                type="button"
                onClick={() => router.push('/admin/hero')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-300 text-xs font-black font-nunito shadow-xs transition-all cursor-pointer"
                title="Edit Hero Headline, Image & Badges"
              >
                <Sparkles size={12} className="text-purple-600" />
                <span>Customize Hero in Admin ⚙️</span>
              </button>
            </div>
          )}

          <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Bold Friendly Headline, CTA & Trust Pillars */}
            <div className="lg:col-span-6 space-y-4 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/95 border-2 border-amber-300 rounded-full px-4 py-1.5 text-xs font-black text-amber-800 shadow-xs">
                <Sparkles size={14} className="text-amber-500 anim-spin-slow" />
                <span>{heroSettings.hero_badge || 'Bright Beginnings, Joyful Learning ✨'}</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-black text-[#1d2445] tracking-tight font-nunito leading-[1.12]">
                {heroSettings.hero_title || 'Big Smiles, Little Adventures! 🌟'}
              </h1>

              {/* Friendly Subtitle */}
              <p className="text-slate-600 font-bold text-sm sm:text-base max-w-xl leading-relaxed mx-auto lg:mx-0 font-nunito">
                {heroSettings.hero_subtitle || 'Safe, fun & voice-guided educational lessons tailored for every little dreamer aged 0–14.'}
              </p>

              {/* Action Button */}
              <div className="pt-1 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('courses-grid')
                    if (el) el.scrollIntoView({ behavior: 'smooth' })
                    else if (displaySubjectsList.length > 0) handleSelectSubject(displaySubjectsList[0])
                  }}
                  className="px-8 py-3.5 rounded-full font-black text-sm sm:text-base text-slate-900 bg-[#facc15] hover:bg-[#eab308] border-b-4 border-[#ca8a04] shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>{heroSettings.hero_cta_text || 'Explore Courses Now'}</span>
                  <ArrowRight size={18} />
                </button>
              </div>

              {/* 3 Trust Pillars */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-2">
                <span className="inline-flex items-center gap-1.5 bg-white/95 border border-emerald-200 text-emerald-800 font-black text-xs px-3.5 py-1.5 rounded-2xl shadow-2xs">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>{heroSettings.hero_trust_1 || '100% Safe & Ad-Free'}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/95 border border-sky-200 text-sky-800 font-black text-xs px-3.5 py-1.5 rounded-2xl shadow-2xs">
                  <Zap size={14} className="text-sky-600" />
                  <span>{heroSettings.hero_trust_2 || 'Voice & Listen Interactive'}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/95 border border-rose-200 text-rose-800 font-black text-xs px-3.5 py-1.5 rounded-2xl shadow-2xs">
                  <Star size={14} fill="#f43f5e" className="text-rose-500" />
                  <span>{heroSettings.hero_trust_3 || 'Loved by Parents'}</span>
                </span>
              </div>
            </div>

            {/* Right Column: Bounded 3D Learning Illustration with Floating Badges */}
            <div className="lg:col-span-6 relative flex items-center justify-center">
              
              {/* Main Video & Animation Container (Autoplay Video Player) */}
              <div className="relative w-full max-w-lg aspect-[4/3] rounded-[36px] overflow-hidden border-4 border-white shadow-2xl shadow-amber-900/10 bg-slate-900 group">
                {heroSettings.hero_video ? (
                  <>
                    <video
                      key={heroSettings.hero_video}
                      ref={videoRef}
                      src={heroSettings.hero_video}
                      autoPlay
                      muted={isMuted}
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Audio Mute/Unmute Overlay Button */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        type="button"
                        onClick={toggleMute}
                        className="p-2.5 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-md transition-all shadow-md cursor-pointer border border-white/20"
                        title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
                      >
                        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      </button>
                    </div>
                  </>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageSrc(heroSettings.hero_image || '/images/lessons-hero-learning.jpg')}
                    alt="Child playing happily with colorful educational blocks and toys"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Floating Heart Sticker (TinyJoy Style) */}
              <div className="hidden sm:flex absolute -top-4 -right-2 bg-gradient-to-br from-[#ff5a7e] to-[#ff3b65] text-white p-3.5 rounded-3xl shadow-lg border-2 border-white items-center gap-2.5 anim-float z-20 max-w-[190px]">
                <span className="text-2xl">💖</span>
                <div className="min-w-0">
                  <p className="font-nunito font-black text-[11px] leading-tight">
                    {heroSettings.hero_sticker_title || 'Joyful Play'}
                  </p>
                  <p className="font-nunito font-bold text-[10px] text-rose-100">
                    {heroSettings.hero_sticker_sub || 'Bright Minds & Big Smiles'}
                  </p>
                </div>
              </div>

              {/* Floating Active Child Explorer Badge */}
              <div className="absolute -bottom-5 left-4 sm:left-6 bg-white/95 backdrop-blur-md border-2 border-amber-300 rounded-2xl p-3 sm:p-3.5 shadow-xl flex items-center gap-3 z-20">
                <Avatar
                  seed={child?.avatar_seed || 'lion'}
                  name={child?.name || 'Explorer'}
                  size={46}
                  className="border-2 border-amber-300 shadow-2xs flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      Active Explorer
                    </span>
                    <span className="text-[9px] font-extrabold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-full">
                      Ages {childDefaultAge}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-[#1d2445] font-nunito truncate mt-0.5">
                    {child?.name || 'Explorer'}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] font-black">
                    <span className="text-emerald-700 flex items-center gap-0.5">
                      <Star size={11} fill="#059669" /> {xp || 0} XP
                    </span>
                    <span className="text-amber-800 flex items-center gap-0.5">
                      <Trophy size={11} /> {totalCompletedCount} Done
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Organic Scalloped Cloud Wave Transition at Bottom */}
          <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10 pointer-events-none">
            <svg
              className="relative block w-full h-8 text-[#fbfdfe]"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
            >
              <path
                d="M0,0 C150,90 350,-40 500,40 C650,120 900,10 1200,40 L1200,120 L0,120 Z"
                fill="currentColor"
              />
            </svg>
          </div>
        </section>

        {/* ── 2. Stat / Fact Strip (Integrated neatly below hero) ──────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6 relative z-20 w-full">
          <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-slate-200 border-b-4 shadow-md grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="flex items-center gap-3 p-2">
              <div className="w-11 h-11 rounded-2xl bg-sky-100 flex items-center justify-center text-xl flex-shrink-0 text-sky-700">
                📚
              </div>
              <div className="min-w-0">
                <p className="text-[#0f172a] font-black text-sm sm:text-base font-nunito leading-tight">6 Tracks</p>
                <p className="text-slate-500 font-bold text-xs font-nunito truncate">Math, English &amp; more</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2">
              <div className="w-11 h-11 rounded-2xl bg-purple-100 flex items-center justify-center text-xl flex-shrink-0 text-purple-700">
                🎯
              </div>
              <div className="min-w-0">
                <p className="text-[#0f172a] font-black text-sm sm:text-base font-nunito leading-tight">4 Stages</p>
                <p className="text-slate-500 font-bold text-xs font-nunito truncate">Ages 0–5 to 12–14</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center text-xl flex-shrink-0 text-emerald-700">
                🎮
              </div>
              <div className="min-w-0">
                <p className="text-[#0f172a] font-black text-sm sm:text-base font-nunito leading-tight">100+ Steps</p>
                <p className="text-slate-500 font-bold text-xs font-nunito truncate">Voice, match &amp; puzzles</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center text-xl flex-shrink-0 text-amber-700">
                🏆
              </div>
              <div className="min-w-0">
                <p className="text-[#0f172a] font-black text-sm sm:text-base font-nunito leading-tight">Gamified</p>
                <p className="text-slate-500 font-bold text-xs font-nunito truncate">Badges, XP &amp; Streaks</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Illustrated Human Wonder Fact Banner ───────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-2 w-full">
          <IllustratedFactBanner subjectSlug="english" />
        </div>

        {/* ── 5. Course Cards Grid (Elevated Tactile Layout Construction) ── */}
        <div id="courses-grid" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full scroll-mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1d2445] font-nunito flex items-center gap-2.5 flex-wrap">
                <span>Course Categories</span>
                <span className="text-xs font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  {availableSubjectsForAge.length} Tracks for Ages {activeAge}
                </span>
                {activeAge === childDefaultAge && child?.name && (
                  <span className="text-xs font-black text-purple-700 bg-purple-100 px-3 py-1 rounded-full border border-purple-200 flex items-center gap-1">
                    🎯 Matched to {child.name} ({activeAge})
                  </span>
                )}
              </h2>
              <p className="text-slate-500 font-bold text-xs sm:text-sm mt-1">
                Showing courses and lessons tailored for {child?.name ? `${child.name}'s active profile (Ages ${activeAge})` : `Ages ${activeAge}`}:
              </p>
            </div>

            {/* Quick button to return to child's recommended age if user toggled away */}
            {activeAge !== childDefaultAge && child?.name && (
              <button
                type="button"
                onClick={() => {
                  setActiveAge(childDefaultAge)
                  router.push(`/lessons?age=${childDefaultAge}`, { scroll: false })
                }}
                className="px-3.5 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-nunito font-black text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
              >
                <span>🎯 Reset to {child.name} (Ages {childDefaultAge})</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableSubjectsForAge.map(sub => {
              const slug = sub.slug as SubjectSlug
              const color = subjectColors[slug] ?? sub.color ?? '#4ade80'

              // Lessons for this subject (filtered strictly by selected age group)
              const allSubLessons = sortedLessons.filter(l => Number(l.subject_id) === Number(sub.id))
              const ageFilteredSubLessons = allSubLessons.filter(l => lessonMatchesAge(l, activeAge))

              const done = ageFilteredSubLessons.filter(l => progressMap.get(Number(l.id))?.status === 'completed').length
              const total = ageFilteredSubLessons.length
              const pct = total > 0 ? Math.round((done / total) * 100) : 0
              const totalXp = ageFilteredSubLessons.reduce((acc, l) => acc + (l.xp_reward || 20), 0)

              const isRecommendedInterest = lp?.interests?.some(i => {
                if (slug === 'creative-arts') return i === 'arts'
                if (slug === 'science') return i === 'space' || i === 'animals'
                if (slug === 'english') return i === 'stories'
                if (slug === 'math') return i === 'puzzles'
                return false
              })

              const emojiIcon =
                {
                  math: '🧮',
                  english: '📚',
                  science: '🔬',
                  'social-studies': '🌍',
                  'life-skills': '🤝',
                  'creative-arts': '🎨',
                }[slug] ?? '⭐'

              const previewTopics = SUBJECT_TOPICS[slug] || ['Interactive Lessons', 'Voice Practice', 'Fun Challenges']

              return (
                <motion.div
                  key={sub.id}
                  whileHover={{ y: -4, scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => handleSelectSubject(sub)}
                  className="cursor-pointer bg-white rounded-3xl border-2 border-slate-200 border-b-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between overflow-hidden group select-none"
                  style={{ borderBottomColor: color }}
                >
                  {/* Subject Theme Header Banner */}
                  <div
                    className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-3 relative"
                    style={{ backgroundColor: `${color}12` }}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-md border-2 border-white flex-shrink-0 transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${color}25` }}
                      >
                        <span>{sub.icon && sub.icon.length <= 4 ? sub.icon : emojiIcon}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span
                            className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block"
                            style={{ backgroundColor: `${color}25`, color }}
                          >
                            {total} Lessons for Ages {activeAge}
                          </span>
                          {isRecommendedInterest && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 inline-block">
                              ✨ {child?.name ? `${child.name}'s Pick` : 'Recommended'}
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-[#1d2445] font-nunito leading-tight truncate group-hover:text-[#0284c7] transition-colors">
                          {sub.name}
                        </h3>
                      </div>
                    </div>

                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-extrabold text-[11px] shadow-2xs">
                        <Star size={11} fill="#d97706" /> +{totalXp} XP
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                    <p className="text-slate-600 font-bold text-xs sm:text-sm leading-relaxed line-clamp-2 font-nunito">
                      {sub.description}
                    </p>

                    {/* Preview Concept Pills */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        Key Topics in Ages {activeAge}:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {previewTopics.slice(0, 3).map(topic => (
                          <span
                            key={topic}
                            className="text-[11px] font-bold text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg"
                          >
                            • {topic}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs font-black text-slate-600 font-nunito">
                        <span>Course Progress</span>
                        <span style={{ color }}>
                          {done}/{total} done ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>

                    {/* Chunky Action Button */}
                    <div
                      className="w-full py-3 px-4 rounded-2xl text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm border-b-4 transition-all group-hover:brightness-105 active:translate-y-0.5"
                      style={{
                        backgroundColor: color,
                        borderBottomColor: `${color}bb`,
                      }}
                    >
                      <span>Explore {sub.name} ▶</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW 2: INSIDE A SELECTED COURSE (e.g. "What's Inside English Lessons")
  // ══════════════════════════════════════════════════════════════════════════
  const courseSlug = (currentSubject?.slug as SubjectSlug) ?? 'math'
  const courseColor = subjectColors[courseSlug] ?? currentSubject?.color ?? '#3b82f6'

  // Group lessons inside this course by age groups
  const ageGroupSections = AGE_GROUPS.map(ag => {
    const meta = AGE_GROUP_META[ag]
    const lessonsInAge = subjectAllLessons.filter(l => lessonMatchesAge(l, ag))
    return {
      meta,
      lessons: lessonsInAge,
    }
  }).filter(sec => sec.lessons.length > 0)

  const currentSection = ageGroupSections.find(sec => sec.meta.key === activeAge) || ageGroupSections[0]

  return (
    <div className="w-full flex flex-col bg-[#fbfdfe] min-h-screen">
      
      {/* ── Top Hero Header for Course ── */}
      <section
        className="relative overflow-hidden border-b-2 pt-6 pb-12 px-4 sm:px-6"
        style={{
          background: `linear-gradient(to bottom, #fffdf8 0%, ${courseColor}18 60%, #fbfdfe 100%)`,
          borderColor: `${courseColor}35`,
        }}
      >
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            {/* Back to All Course Categories Button */}
            <button
              type="button"
              onClick={handleBackToCourses}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-black text-xs sm:text-sm border-2 border-slate-200 border-b-4 transition-all cursor-pointer shadow-xs active:translate-y-0.5"
            >
              <ArrowLeft size={16} />
              <span>← Back to Course Categories</span>
            </button>

            <div className="flex items-center gap-3.5 flex-wrap">
              <span className="text-4xl sm:text-5xl anim-float">{currentSubject?.icon || '📚'}</span>
              <h1 className="text-3xl sm:text-5xl font-black text-[#0c4a6e] font-nunito tracking-tight">
                {currentSubject?.name}{' '}
                <span style={{ color: courseColor }}>Lessons</span>
              </h1>
            </div>
            
            <p className="text-slate-600 font-bold text-sm sm:text-base max-w-xl font-nunito leading-relaxed">
              {currentSubject?.description}
            </p>
          </div>

          {/* Quick Course Progress Card */}
          <div className="bg-white/95 border-2 border-amber-300 border-b-4 p-4 sm:p-5 rounded-3xl flex items-center gap-4 shadow-md">
            <div>
              <p className="text-xs font-black text-amber-700 uppercase tracking-wider font-nunito">Course Progress</p>
              <p className="text-2xl font-black text-[#0f172a] font-nunito">
                {completedCountInSubject} / {subjectAllLessons.length} Done
              </p>
              <p className="text-[11px] font-bold text-slate-400 font-nunito mt-0.5">
                {Math.round((completedCountInSubject / Math.max(1, subjectAllLessons.length)) * 100)}% Mastered
              </p>
            </div>
            <div className="w-13 h-13 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-amber-600 flex-shrink-0 shadow-2xs">
              <Trophy size={26} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Container: What's Inside This Course ────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full space-y-6">
        
        {/* ── Illustrated Human Wonder Fact Banner ───────────────────── */}
        <IllustratedFactBanner subjectSlug={courseSlug} />

        {/* ── Stage Filter Bar ───────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white rounded-3xl p-4 sm:p-5 border-2 border-slate-200 border-b-4 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 font-nunito">
              Filter By Age:
            </span>
            <span className="text-xs font-black text-[#1d2445] bg-slate-100 px-3 py-1 rounded-xl font-nunito">
              Showing Ages {activeAge}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {AGE_GROUPS.map(ag => {
              const meta = AGE_GROUP_META[ag]
              const count = subjectAllLessons.filter(l => lessonMatchesAge(l, ag)).length
              if (count === 0) return null
              const isActive = activeAge === ag
              return (
                <button
                  key={ag}
                  type="button"
                  onClick={() => {
                    setActiveAge(ag)
                    router.push(`/lessons?subject=${currentSubject?.slug || currentSubject?.id || courseSlug}&age=${ag}`, { scroll: false })
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl font-black font-nunito text-xs sm:text-sm border-2 border-b-4 transition-all cursor-pointer ${
                    isActive
                      ? 'text-white border-transparent shadow-md scale-105'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 border-b-slate-300'
                  }`}
                  style={isActive ? { backgroundColor: meta.color, borderBottomColor: `${meta.color}bb` } : {}}
                >
                  <span>{meta.emoji}</span>
                  <span>{meta.label}</span>
                  <span className="opacity-80">({count})</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Active Age Stage Lesson Section (Single Age View) ───────── */}
        <div className="space-y-6">
          {currentSection ? (
            <div key={currentSection.meta.key} className="space-y-4">
              
              {/* Age Section Header Card */}
              <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 p-4 sm:p-5 rounded-3xl border-2 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <span
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs"
                    style={{ backgroundColor: `${currentSection.meta.color}20` }}
                  >
                    {currentSection.meta.emoji}
                  </span>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-[#1d2445] font-nunito flex items-center gap-2">
                      <span>{currentSection.meta.label}</span>
                      <span className="text-slate-400 font-bold text-sm">· {currentSection.meta.title}</span>
                    </h3>
                    <p className="text-slate-500 font-bold text-xs mt-0.5">
                      {currentSection.meta.tagline} ({currentSection.lessons.length} Lessons)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-700 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-2xs">
                    {currentSection.lessons.filter(l => progressMap.get(Number(l.id))?.status === 'completed').length} / {currentSection.lessons.length} Completed
                  </span>
                </div>
              </div>

              {/* Lessons Grid in this Age Group */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {currentSection.lessons.map(lesson => {
                  const status = statusForLesson(lesson, currentSection.lessons, progressMap)
                  const isDone = status === 'completed'
                  const isLocked = status === 'locked'
                  const isRec = lp ? isFitForProfile(lesson, courseSlug, lp) : false

                  return (
                    <motion.div
                      key={lesson.id}
                      whileHover={!isLocked ? { scale: 1.02, y: -3 } : {}}
                      whileTap={!isLocked ? { scale: 0.98 } : {}}
                      onClick={() => {
                        if (!isLocked) {
                          router.push(`/lessons/${lesson.id}`)
                        }
                      }}
                      className={`rounded-3xl p-5 sm:p-6 border-2 border-b-4 transition-all relative flex flex-col justify-between select-none ${
                        isDone
                          ? 'bg-emerald-50/70 border-emerald-300 border-b-emerald-500 shadow-sm'
                          : isLocked
                          ? 'bg-slate-50/80 border-slate-200 opacity-65 cursor-not-allowed'
                          : 'bg-white border-slate-200 border-b-slate-300 hover:border-[#58cc02] hover:shadow-lg cursor-pointer'
                      }`}
                    >
                      <div>
                        {/* Top Row: Age Badge & XP Chip */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                            style={{
                              backgroundColor: `${currentSection.meta.color}20`,
                              color: currentSection.meta.color,
                            }}
                          >
                            <span>{currentSection.meta.emoji}</span>
                            <span>{currentSection.meta.label}</span>
                          </span>

                          <div className="flex items-center gap-1.5">
                            {isRec && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-extrabold text-[10px]">
                                <Sparkles size={10} /> Rec
                              </span>
                            )}
                            <span className="text-[11px] font-black text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                              +{lesson.xp_reward} XP
                            </span>
                          </div>
                        </div>

                        {/* Lesson Icon / Thumbnail & Title Details */}
                        <div className="flex items-start gap-3.5 my-2">
                          {lesson.thumbnail_url ? (
                            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border-2 border-amber-300 shadow-xs flex-shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={lesson.thumbnail_url}
                                alt={lesson.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div
                              className="w-13 h-13 rounded-2xl flex items-center justify-center text-2xl shadow-xs border-2 border-white flex-shrink-0"
                              style={{ backgroundColor: `${currentSection.meta.color}20` }}
                            >
                              <span>{getLessonIcon(lesson, courseSlug)}</span>
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <h4
                              className={`text-base sm:text-lg font-black font-nunito leading-tight ${
                                isLocked ? 'text-slate-400' : 'text-[#1d2445]'
                              }`}
                            >
                              {lesson.title}
                            </h4>
                            <p className="text-slate-500 font-bold text-xs mt-1.5 line-clamp-2 leading-relaxed">
                              {lesson.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Row: Difficulty & Tactile Play Button */}
                      <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            lesson.difficulty === 'easy'
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : lesson.difficulty === 'medium'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {lesson.difficulty}
                        </span>

                        <button
                          type="button"
                          disabled={isLocked}
                          className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 border-b-3 transition-all cursor-pointer ${
                            isDone
                              ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300'
                              : isLocked
                              ? 'bg-slate-200 text-slate-500 border-slate-300 cursor-not-allowed'
                              : 'bg-[#58cc02] hover:bg-[#46a302] text-white border-[#3b8702] shadow-sm hover:scale-105 active:translate-y-0.5'
                          }`}
                        >
                          {isDone ? (
                            <>
                              <CheckCircle2 size={13} />
                              <span>Completed</span>
                            </>
                          ) : isLocked ? (
                            <>
                              <Lock size={13} />
                              <span>Locked</span>
                            </>
                          ) : (
                            <>
                              <PlayCircle size={13} />
                              <span>Start Lesson ▶</span>
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center border-2 border-slate-200 shadow-xs">
              <p className="text-slate-500 font-bold font-nunito">No lessons found for this age group in this course.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LessonsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size={40} />
        </div>
      }
    >
      <LessonsPageContent />
    </Suspense>
  )
}
