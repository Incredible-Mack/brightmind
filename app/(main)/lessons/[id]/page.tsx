'use client'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Star, PlayCircle, BookOpen, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react'
import { useLesson } from '@/hooks/useLesson'
import { useAppStore } from '@/store/useAppStore'
import { Spinner } from '@/components/ui/Spinner'
import { SubjectIcon, subjectColors } from '@/components/icons/SubjectIcon'
import { AnimatedSun, DoodleCloud, DoodleStar } from '@/components/home/KidsDoodles'
import type { SubjectSlug } from '@/types/lesson'
import type { Activity } from '@/types/activity'

// Subject-specific vibrant themes matching Bright Steps design system
const subjectThemeConfig: Record<SubjectSlug, {
  bg: string
  hillFront: string
  hillBack: string
  headerBg: string
  headerBorder: string
  badgeBg: string
  badgeText: string
  accentColor: string
  doodles: string[]
  mascotTip: string
}> = {
  math: {
    bg: 'bg-[#dcfce7]', // lush pastel green landscape
    hillFront: '#86efac',
    hillBack: '#4ade80',
    headerBg: 'bg-[#3b82f6]', // vibrant royal blue header
    headerBorder: 'border-[#1d4ed8]',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-900',
    accentColor: '#3b82f6',
    doodles: ['🔢', '➕', '⭐', '🎲', '1️⃣', '2️⃣', '3️⃣'],
    mascotTip: "Let's count, tap, and have fun with numbers!",
  },
  english: {
    bg: 'bg-[#ede9fe]', // soft magical lavender
    hillFront: '#c4b5fd',
    hillBack: '#a78bfa',
    headerBg: 'bg-[#8b5cf6]',
    headerBorder: 'border-[#6d28d9]',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-900',
    accentColor: '#8b5cf6',
    doodles: ['🔤', '📖', '✨', '✏️', '🅰️', '🅱️'],
    mascotTip: "Listen closely and speak the words out loud!",
  },
  science: {
    bg: 'bg-[#ccfbf1]', // fresh ocean mint
    hillFront: '#5eead4',
    hillBack: '#2dd4bf',
    headerBg: 'bg-[#0d9488]',
    headerBorder: 'border-[#0f766e]',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-900',
    accentColor: '#0d9488',
    doodles: ['🪐', '🌱', '🔬', '⚡', '🌟', '🌍'],
    mascotTip: "Get ready to explore amazing natural wonders!",
  },
  'social-studies': {
    bg: 'bg-[#fef3c7]', // warm sunny amber
    hillFront: '#fde047',
    hillBack: '#facc15',
    headerBg: 'bg-[#f97316]',
    headerBorder: 'border-[#ea580c]',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    accentColor: '#f97316',
    doodles: ['🌍', '🧭', '🏛️', '🗺️', '⭐'],
    mascotTip: "Discover people, places, and exciting stories!",
  },
  'life-skills': {
    bg: 'bg-[#ecfdf5]',
    hillFront: '#86efac',
    hillBack: '#4ade80',
    headerBg: 'bg-[#10b981]',
    headerBorder: 'border-[#047857]',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900',
    accentColor: '#10b981',
    doodles: ['🌱', '🤝', '💡', '🌟', '❤️'],
    mascotTip: "Super skills that make you shine every day!",
  },
  'creative-arts': {
    bg: 'bg-[#fce7f3]', // playful bubblegum pink
    hillFront: '#f9a8d4',
    hillBack: '#f472b6',
    headerBg: 'bg-[#ec4899]',
    headerBorder: 'border-[#be185d]',
    badgeBg: 'bg-pink-100',
    badgeText: 'text-pink-900',
    accentColor: '#ec4899',
    doodles: ['🎨', '🌈', '✂️', '🎭', '✨'],
    mascotTip: "Unleash your creativity and imagination!",
  },
}

// Activity card color palette cycling (inspired by the landing page cards)
const activityCardStyles = [
  {
    bg: 'bg-[#ecfdf5]',
    border: 'border-[#a7f3d0] border-b-[#6ee7b7]',
    badge: 'bg-[#10b981] text-white',
    pill: 'bg-emerald-100 text-emerald-900',
    iconBg: 'bg-emerald-100 text-[#059669]',
  },
  {
    bg: 'bg-[#f0f9ff]',
    border: 'border-[#bae6fd] border-b-[#7dd3fc]',
    badge: 'bg-[#0284c7] text-white',
    pill: 'bg-sky-100 text-sky-900',
    iconBg: 'bg-sky-100 text-[#0284c7]',
  },
  {
    bg: 'bg-[#fffbeb]',
    border: 'border-[#fde68a] border-b-[#fcd34d]',
    badge: 'bg-[#f59e0b] text-white',
    pill: 'bg-amber-100 text-amber-900',
    iconBg: 'bg-amber-100 text-[#d97706]',
  },
  {
    bg: 'bg-[#faf5ff]',
    border: 'border-[#e9d5ff] border-b-[#d8b4fe]',
    badge: 'bg-[#9333ea] text-white',
    pill: 'bg-purple-100 text-purple-900',
    iconBg: 'bg-purple-100 text-[#7e22ce]',
  },
  {
    bg: 'bg-[#fff1f2]',
    border: 'border-[#fecdd3] border-b-[#fda4af]',
    badge: 'bg-[#f43f5e] text-white',
    pill: 'bg-rose-100 text-rose-900',
    iconBg: 'bg-rose-100 text-[#e11d48]',
  },
  {
    bg: 'bg-[#f0fdfa]',
    border: 'border-[#99f6e4] border-b-[#5eead4]',
    badge: 'bg-[#0d9488] text-white',
    pill: 'bg-teal-100 text-teal-900',
    iconBg: 'bg-teal-100 text-[#0f766e]',
  },
]

function getActivityInfo(act: Activity, index: number) {
  const c = act.content as any
  let title = ''
  let icon = '🎧'
  let label = 'Listen'

  if (act.type === 'listen') {
    icon = '🎧'
    label = 'Listen & Learn'
    title = c?.text ? `"${c.text}"` : `Listen to the concept`
  } else if (act.type === 'speak') {
    icon = '🎙️'
    label = 'Speak Out Loud'
    title = c?.expected || c?.prompt ? `Say "${c?.expected || c?.prompt}"` : `Voice pronunciation challenge`
  } else if (act.type === 'tap_answer') {
    icon = '🎯'
    label = 'Tap & Choose'
    title = c?.question || `Choose the correct answer`
  } else if (act.type === 'type_answer') {
    icon = '✏️'
    label = 'Write & Spell'
    title = c?.question || `Type your answer`
  } else if (act.type === 'video') {
    icon = '🎬'
    label = 'Watch Video'
    title = c?.title || `Watch and discover`
  } else if (act.type === 'drag_drop') {
    icon = '🧩'
    label = 'Puzzle Match'
    title = `Match the pairs together`
  } else {
    icon = '⭐'
    label = ((act as any).type as string || 'Activity').replace(/[-_]/g, ' ')
    title = `Interactive Activity`
  }

  return { icon, label, title }
}

export default function LessonDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { lesson, activities, loading, load } = useLesson(id)
  const { child } = useAppStore()

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Spinner size={44} color="#10b981" />
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="text-center py-24 text-slate-600 font-bold font-nunito">
        <p className="text-2xl mb-4">Lesson not found 🔍</p>
        <Link href="/lessons" className="text-emerald-600 underline font-black">
          Back to Course Map
        </Link>
      </div>
    )
  }

  const subjectSlug = ((lesson as any).subject?.slug as SubjectSlug) ?? 'math'
  const theme = subjectThemeConfig[subjectSlug] ?? subjectThemeConfig.math
  const subjectName = (lesson as any).subject?.name ?? 'Mathematics'

  return (
    <div className={`w-full min-h-screen ${theme.bg} transition-colors duration-500 relative overflow-hidden pb-16`}>
      
      {/* ── Playful Sky Doodles & Ambient Floating Props ─────────────── */}
      <AnimatedSun className="absolute top-8 right-8 sm:right-20 w-28 sm:w-36 z-0 pointer-events-none" />
      <DoodleCloud className="absolute top-12 left-6 sm:left-16 w-36 sm:w-48 z-0 pointer-events-none" delay={0} />
      <DoodleCloud className="absolute top-52 right-1/4 w-32 sm:w-40 z-0 pointer-events-none" delay={1.8} />
      <DoodleStar className="absolute top-28 left-1/3 text-amber-300 w-8 h-8 z-0 pointer-events-none" />
      <DoodleStar className="absolute top-72 right-12 text-amber-300 w-6 h-6 z-0 pointer-events-none" />

      {/* Floating Subject-Themed Icons in Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
        {theme.doodles.map((doodle, idx) => (
          <span
            key={idx}
            style={{
              top: `${15 + (idx * 14)}%`,
              left: idx % 2 === 0 ? `${4 + (idx * 3)}%` : `${82 - (idx * 2)}%`,
            }}
            className="absolute text-2xl sm:text-3xl opacity-35 filter drop-shadow-sm pointer-events-none animate-pulse"
          >
            {doodle}
          </span>
        ))}
      </div>

      {/* ── Rolling Hills Layer at Bottom ───────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Back Hill */}
        <svg className="absolute bottom-0 w-full h-[420px]" viewBox="0 0 1440 420" preserveAspectRatio="none">
          <path
            d="M0,220 C360,120 640,280 980,160 C1200,90 1440,140 1440,140 L1440,420 L0,420 Z"
            fill={theme.hillBack}
            opacity="0.5"
          />
        </svg>
        {/* Front Hill */}
        <svg className="absolute bottom-0 w-full h-[320px]" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path
            d="M0,140 C280,70 580,200 920,100 C1180,40 1440,110 1440,110 L1440,320 L0,320 Z"
            fill={theme.hillFront}
            opacity="0.85"
          />
        </svg>
      </div>

      {/* ── Main Foreground Content Container ────────────────────────── */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        
        {/* 3D Back Navigation Pill */}
        <div className="mb-6">
          <Link
            href="/lessons"
            className="inline-flex items-center gap-2 bg-white/95 hover:bg-white text-[#1d2445] px-4 sm:px-5 py-2.5 rounded-2xl border-2 border-white/80 border-b-4 border-slate-200 shadow-md transition-all hover:scale-105 active:translate-y-0.5 font-nunito font-black text-xs sm:text-sm"
          >
            <ArrowLeft size={16} strokeWidth={3} className="text-[#10b981]" />
            <span>Back to Adventure Map</span>
          </Link>
        </div>

        {/* ── Main Lesson Hero Card (Vibrant 3D Toy Brick Style) ──────── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[36px] overflow-hidden border-4 border-white border-b-[8px] border-b-slate-200 shadow-2xl mb-8"
        >
          {/* Top Vibrant Header Banner */}
          <div className={`${theme.headerBg} border-b-4 ${theme.headerBorder} p-6 sm:p-8 text-white relative overflow-hidden`}>
            {/* Glossy top bevel highlight */}
            <div className="absolute top-0 left-0 right-0 h-6 bg-white/15 pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-3.5 py-1 text-xs font-black uppercase tracking-wider text-white">
                  <SubjectIcon slug={subjectSlug} size={16} className="text-white" />
                  <span>{subjectName}</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black font-nunito tracking-tight text-white drop-shadow-sm">
                  {lesson.title}
                </h1>
                <p className="text-white/90 font-bold text-sm sm:text-base max-w-xl">
                  {lesson.description}
                </p>
              </div>

              {/* Subject Big Icon Badge in Corner */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-3xl sm:text-4xl shadow-md flex-shrink-0">
                {subjectSlug === 'math' ? '🧮' : subjectSlug === 'english' ? '📚' : subjectSlug === 'science' ? '🔬' : '🎨'}
              </div>
            </div>

            {/* Mascot Pip Speech Encouragement */}
            <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-2.5 text-xs sm:text-sm font-extrabold text-white/95">
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                💡
              </span>
              <span>{theme.mascotTip}</span>
            </div>
          </div>

          {/* Card Body: Stat Pills & Instant CTA */}
          <div className="p-6 sm:p-8 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            
            {/* Stat Badges */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              {/* XP Reward Badge */}
              <div className="flex items-center gap-1.5 bg-amber-50 border-2 border-amber-300 border-b-4 border-b-amber-400 rounded-2xl px-3.5 py-1.5 text-xs sm:text-sm font-black text-amber-900 shadow-sm">
                <Star size={15} fill="#eab308" className="text-amber-500" />
                <span>+{lesson.xp_reward} XP Reward</span>
              </div>

              {/* Difficulty Badge */}
              <div className={`px-3.5 py-1.5 rounded-2xl text-xs sm:text-sm font-black border-2 border-b-4 shadow-sm uppercase ${
                lesson.difficulty === 'easy'
                  ? 'bg-emerald-50 border-emerald-300 border-b-emerald-400 text-emerald-900'
                  : lesson.difficulty === 'medium'
                  ? 'bg-amber-50 border-amber-300 border-b-amber-400 text-amber-900'
                  : 'bg-rose-50 border-rose-300 border-b-rose-400 text-rose-900'
              }`}>
                {lesson.difficulty}
              </div>

              {/* Activities Count */}
              <div className="flex items-center gap-1.5 bg-sky-50 border-2 border-sky-300 border-b-4 border-b-sky-400 rounded-2xl px-3.5 py-1.5 text-xs sm:text-sm font-black text-sky-900 shadow-sm">
                <BookOpen size={14} className="text-sky-600" />
                <span>{lesson.activities_count ?? activities.length} activities</span>
              </div>
            </div>

            {/* Quick Play CTA inside Hero Header */}
            <Link href={`/lesson/${lesson.id}/play`} className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 bg-[#10b981] hover:bg-[#059669] text-white font-black font-nunito text-sm sm:text-base rounded-2xl border-2 border-white/60 border-b-4 border-[#047857] shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2.5 transition-all active:translate-y-0.5"
              >
                <PlayCircle size={20} />
                <span>Start Adventure!</span>
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* ── Colorful Activities List ("What you will learn") ─────────── */}
        <div className="bg-white/95 backdrop-blur-md rounded-[36px] border-4 border-white border-b-[8px] border-b-slate-200 p-6 sm:p-8 shadow-2xl mb-8">
          
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" fill="#f59e0b" />
                <h2 className="text-[#1d2445] font-black text-xl sm:text-2xl font-nunito">
                  What you will learn
                </h2>
              </div>
              <p className="text-slate-500 font-bold text-xs sm:text-sm font-nunito mt-0.5">
                Fun interactive voice, listen & challenge activities
              </p>
            </div>

            <span className="bg-emerald-100 text-emerald-900 font-black text-xs font-nunito px-3 py-1 rounded-full border border-emerald-300">
              {activities.length} Steps
            </span>
          </div>

          {/* List of Colorful Pastel Activity Cards */}
          <div className="flex flex-col gap-3">
            {activities.map((act, i) => {
              const info = getActivityInfo(act, i)
              const style = activityCardStyles[i % activityCardStyles.length]

              return (
                <motion.div
                  key={act.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ scale: 1.01 }}
                  className={`flex items-center gap-3.5 sm:gap-4 ${style.bg} rounded-2xl p-3 sm:p-4 border-2 border-b-4 ${style.border} shadow-sm transition-all`}
                >
                  {/* Step Number Round Badge */}
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-2xl ${style.badge} flex items-center justify-center font-black text-xs sm:text-sm font-nunito shadow-sm flex-shrink-0`}>
                    {i + 1}
                  </div>

                  {/* Activity Type Icon */}
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl ${style.iconBg} flex items-center justify-center text-lg sm:text-xl shadow-xs flex-shrink-0`}>
                    {info.icon}
                  </div>

                  {/* Activity Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[#1d2445] font-black text-xs sm:text-sm font-nunito">
                        {info.label}
                      </span>
                    </div>
                    <p className="text-slate-600 font-bold text-xs font-nunito truncate mt-0.5">
                      {info.title}
                    </p>
                  </div>

                  {/* XP Reward Pill */}
                  <div className="bg-amber-100 border border-amber-300 rounded-xl px-2.5 sm:px-3 py-1 flex items-center gap-1 text-[11px] sm:text-xs font-black text-amber-900 flex-shrink-0">
                    <Star size={11} fill="#d97706" className="text-amber-600" />
                    <span>+{act.xp_reward} XP</span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* ── Big Bottom Start Action Button ─────────────────────────── */}
        <Link href={`/lesson/${lesson.id}/play`} className="block pb-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 sm:py-5 px-8 bg-[#10b981] hover:bg-[#059669] text-white font-black font-nunito text-lg sm:text-xl rounded-3xl border-2 border-white/60 border-b-[6px] border-[#047857] shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-3 transition-all active:translate-y-0.5"
          >
            <PlayCircle size={28} />
            <span>Start Lesson Adventure!</span>
          </motion.button>
        </Link>

      </div>
    </div>
  )
}
