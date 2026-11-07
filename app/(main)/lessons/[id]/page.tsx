'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star,
  PlayCircle,
  ArrowLeft,
  Volume2,
  VolumeX,
  Sparkles,
  Headphones,
  Mic,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useLesson } from '@/hooks/useLesson'
import { Spinner } from '@/components/ui/Spinner'
import type { SubjectSlug } from '@/types/lesson'
import type { Activity } from '@/types/activity'

// Character companions per subject
const subjectCharacterMap: Record<
  SubjectSlug,
  {
    characterName: string
    imageSrc: string
    badge: string
    accentColor: string
    headerGradient: string
    greeting: string
  }
> = {
  'creative-arts': {
    characterName: 'Bunny Artist',
    imageSrc: '/images/bunny-scholar.png',
    badge: 'Creative Arts',
    accentColor: '#ec4899',
    headerGradient: 'from-pink-500 via-rose-500 to-amber-400',
    greeting: "Hi, I'm Bunny! Let's mix colors and paint beautiful wonders together! 🎨",
  },
  math: {
    characterName: 'Math Knight',
    imageSrc: '/images/game-math-quest.jpg',
    badge: 'Numbers & Shapes',
    accentColor: '#2563eb',
    headerGradient: 'from-blue-600 via-sky-500 to-cyan-400',
    greeting: "Numbers are like friendly puzzle pieces! Let's count and unlock shiny stars! 🔢",
  },
  english: {
    characterName: 'Bunny Scholar',
    imageSrc: '/images/bunny-scholar.png',
    badge: 'Reading & Phonics',
    accentColor: '#7c3aed',
    headerGradient: 'from-purple-600 via-indigo-500 to-pink-400',
    greeting: "Words have secret sounds! Listen closely and speak out loud with me! 📖",
  },
  science: {
    characterName: 'Science Scout',
    imageSrc: '/images/game-puzzle-quest.jpg',
    badge: 'Science Lab',
    accentColor: '#0d9488',
    headerGradient: 'from-teal-600 via-emerald-500 to-cyan-400',
    greeting: "Every plant, rock, and star has a secret to discover! Let's explore together! 🔬",
  },
  'social-studies': {
    characterName: 'Captain Leo',
    imageSrc: '/images/island-adventure.jpg',
    badge: 'Our Great Planet',
    accentColor: '#ea580c',
    headerGradient: 'from-orange-600 via-amber-500 to-yellow-400',
    greeting: "Set sail with our flying cloud ship to discover distant lands and make new friends! 🌍",
  },
  'life-skills': {
    characterName: 'Pip & Friends',
    imageSrc: '/images/mascots-mobile.jpg',
    badge: 'Life Skills',
    accentColor: '#059669',
    headerGradient: 'from-emerald-600 via-teal-500 to-cyan-400',
    greeting: "Kindness and healthy daily habits make every day bright and happy! 🌱",
  },
}

export default function LessonDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { lesson, activities, loading, load } = useLesson(id)

  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [showAllActivities, setShowAllActivities] = useState(false)

  useEffect(() => {
    load()
  }, [load])

  const subjectSlug = ((lesson as unknown as { subject?: { slug?: SubjectSlug } })?.subject?.slug as SubjectSlug) ?? 'creative-arts'
  const charConfig = subjectCharacterMap[subjectSlug] ?? subjectCharacterMap['creative-arts']

  // Clean activity breakdown
  const activityCounts = useMemo(() => {
    let listen = 0
    let speak = 0
    let tap = 0
    activities.forEach(a => {
      if (a.type === 'listen') listen++
      else if (a.type === 'speak') speak++
      else tap++
    })
    return { listen, speak, tap }
  }, [activities])

  // Web Speech API Voice Reader
  const toggleAudio = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    if (isPlayingAudio) {
      window.speechSynthesis.cancel()
      setIsPlayingAudio(false)
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.92
    utterance.pitch = 1.15
    utterance.onend = () => setIsPlayingAudio(false)
    utterance.onerror = () => setIsPlayingAudio(false)
    setIsPlayingAudio(true)
    window.speechSynthesis.speak(utterance)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-[#fffdf8] font-nunito gap-3">
        <Spinner size={44} color="#10b981" />
        <p className="text-slate-500 font-extrabold text-sm">Getting your lesson ready...</p>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="text-center py-24 text-slate-600 font-bold font-nunito bg-[#fffdf8] min-h-[70vh]">
        <p className="text-2xl mb-4">Lesson not found 🔍</p>
        <Link href="/lessons" className="text-emerald-600 underline font-black">
          Back to Course Map
        </Link>
      </div>
    )
  }

  const narrationScript = `${lesson.title}. ${lesson.description}. ${charConfig.greeting}`

  return (
    <div className="w-full min-h-screen bg-[#fffdf8] relative overflow-hidden pb-20 font-nunito selection:bg-amber-300 selection:text-slate-900">
      
      {/* ── Soft Sunlit Sky Gradient Background (Clean WonderLearn Style) ── */}
      <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-b from-[#e0f2fe] via-[#f0f9ff]/70 to-[#fffdf8] pointer-events-none z-0" />


      {/* ── Main Clean Container ─────────────────────────────────────── */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7">
        
        {/* Top Back Pill */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href={lesson.subject_id ? `/lessons?subject=${lesson.subject_id}` : '/lessons'}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-2xl border-2 border-slate-200 border-b-[4px] border-b-slate-300 shadow-xs transition-all hover:scale-102 active:translate-y-0.5 font-black text-xs sm:text-sm"
          >
            <ArrowLeft size={16} strokeWidth={3} className="text-emerald-600" />
            <span>Back to Courses</span>
          </Link>

          <span className="text-xs font-bold text-slate-400">
            Ages 0–5 • Preschool &amp; Kindergarten
          </span>
        </div>

        {/* ── HERO SHOWCASE CARD (CLEAN, FOCUSED, BREATHABLE) ─────────── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-[32px] sm:rounded-[36px] overflow-hidden border-2 border-slate-200 border-b-[8px] border-b-slate-300 shadow-xl mb-8"
        >
          <div className="flex flex-col md:flex-row items-center">
            
            {/* Left: Illustrated 3D Character Box */}
            <div className="w-full md:w-5/12 bg-gradient-to-br from-pink-50 via-sky-50 to-amber-50/50 p-6 sm:p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 relative">
              <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-3xl bg-white p-3 shadow-md border-2 border-white/80 flex items-center justify-center">
                <Image
                  src={charConfig.imageSrc}
                  alt={charConfig.characterName}
                  width={200}
                  height={200}
                  className="object-contain w-full h-full hover:scale-105 transition-transform duration-300"
                  priority
                />
              </div>

              {/* Character name label */}
              <div className="mt-3 text-center">
                <span className="text-xs font-black text-slate-800 tracking-wide">
                  {charConfig.characterName}
                </span>
                <p className="text-[11px] font-bold text-slate-500">Your Friendly Guide</p>
              </div>
            </div>

            {/* Right: Lesson Details & Clear Single CTA */}
            <div className="w-full md:w-7/12 p-6 sm:p-8 space-y-4">
              
              {/* Category Pill */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 text-pink-900 border border-pink-200 text-xs font-black uppercase tracking-wider">
                  {charConfig.badge}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-black">
                  <Star size={12} fill="#eab308" className="text-amber-500" />
                  <span>+{lesson.xp_reward} XP</span>
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl font-black font-nunito tracking-tight text-[#0f4c5c] leading-tight">
                {lesson.title}
              </h1>

              {/* Description */}
              <p className="text-slate-600 font-bold text-sm sm:text-base leading-relaxed">
                {lesson.description}. Join us to mix vibrant colors, speak words out loud, and play interactive games!
              </p>

              {/* Companion Speech Bubble with Audio */}
              <div className="bg-sky-50/80 rounded-2xl p-3 sm:p-3.5 border border-sky-200/90 flex items-start gap-3">
                <span className="text-xl flex-shrink-0">💬</span>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 font-bold text-xs sm:text-sm leading-snug">
                    {charConfig.greeting}
                  </p>
                </div>
                <button
                  onClick={() => toggleAudio(narrationScript)}
                  className={`p-2 rounded-xl border flex-shrink-0 transition-all ${
                    isPlayingAudio
                      ? 'bg-amber-200 text-amber-900 border-amber-300 animate-pulse'
                      : 'bg-white text-sky-700 hover:bg-sky-100 border-sky-200 shadow-2xs'
                  }`}
                  title="Hear greeting out loud"
                >
                  {isPlayingAudio ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
              </div>

              {/* Big Primary Action Button */}
              <div className="pt-2">
                <Link href={`/lesson/${lesson.id}/play`} className="block">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 px-8 bg-[#10b981] hover:bg-[#059669] text-white font-black font-nunito text-base sm:text-lg rounded-2xl border-2 border-white/60 border-b-[5px] border-[#047857] shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2.5 transition-all active:translate-y-0.5"
                  >
                    <PlayCircle size={22} />
                    <span>Start Adventure! 🚀</span>
                  </motion.button>
                </Link>
              </div>

            </div>

          </div>
        </motion.div>

        {/* ── WHAT'S INSIDE THIS LESSON (CLEAN 3-STEP SUMMARY) ──────── */}
        <div className="bg-white rounded-[32px] border-2 border-slate-200 border-b-[6px] border-b-slate-300 p-6 sm:p-8 shadow-sm mb-6">
          
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[#0f4c5c] font-black text-xl sm:text-2xl font-nunito tracking-tight">
                What&apos;s Inside This Adventure
              </h2>
              <p className="text-slate-500 font-bold text-xs sm:text-sm mt-0.5">
                {activities.length} fun, gentle interactive steps designed for young learners
              </p>
            </div>
            <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black">
              🌱 Gentle &amp; Self-Paced
            </span>
          </div>

          {/* 3 Balanced Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            
            {/* Pillar 1: Listen */}
            <div className="bg-sky-50/70 rounded-2xl p-4 border-2 border-sky-200 border-b-[3px] border-b-sky-300">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center text-xl mb-2.5">
                <Headphones size={20} />
              </div>
              <h3 className="text-slate-800 font-black text-sm mb-1">
                {activityCounts.listen} Listen &amp; Learn
              </h3>
              <p className="text-slate-600 font-bold text-xs leading-relaxed">
                Pip introduces each color with clear voice narration and joyful animations.
              </p>
            </div>

            {/* Pillar 2: Speak */}
            <div className="bg-rose-50/70 rounded-2xl p-4 border-2 border-rose-200 border-b-[3px] border-b-rose-300">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-xl mb-2.5">
                <Mic size={20} />
              </div>
              <h3 className="text-slate-800 font-black text-sm mb-1">
                {activityCounts.speak} Speak Out Loud
              </h3>
              <p className="text-slate-600 font-bold text-xs leading-relaxed">
                Practice saying color names aloud with instant, encouraging voice feedback.
              </p>
            </div>

            {/* Pillar 3: Tap & Match */}
            <div className="bg-amber-50/70 rounded-2xl p-4 border-2 border-amber-200 border-b-[3px] border-b-amber-300">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl mb-2.5">
                <Sparkles size={20} />
              </div>
              <h3 className="text-slate-800 font-black text-sm mb-1">
                {activityCounts.tap} Tap &amp; Match Quests
              </h3>
              <p className="text-slate-600 font-bold text-xs leading-relaxed">
                Fun interactive multiple-choice cards and puzzles that test recognition.
              </p>
            </div>

          </div>

          {/* Expandable Step-by-Step List (For Parents/Curious Kids) */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <button
              onClick={() => setShowAllActivities(!showAllActivities)}
              className="w-full flex items-center justify-between text-slate-600 hover:text-slate-900 font-black text-xs sm:text-sm py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <span>{showAllActivities ? 'Hide Step-by-Step Details' : `View All ${activities.length} Steps in Order`}</span>
              {showAllActivities ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            <AnimatePresence>
              {showAllActivities && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 pt-4 overflow-hidden"
                >
                  {activities.map((act, i) => {
                    const c = act.content as unknown as Record<string, unknown> | undefined
                    const previewText = (c?.question as string) || (c?.text as string) || (c?.expected as string) || (c?.prompt as string) || 'Interactive step'

                    return (
                      <div
                        key={act.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white font-black text-[11px] flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="font-black text-slate-700">
                            {act.type === 'listen' ? '🎧 Listen' : act.type === 'speak' ? '🎙️ Voice' : '🎯 Quiz'}:
                          </span>
                          <span className="text-slate-600 font-bold truncate max-w-xs sm:max-w-md">
                            {previewText}
                          </span>
                        </div>
                        <span className="text-amber-800 font-black text-[11px] flex-shrink-0">
                          +{act.xp_reward} XP
                        </span>
                      </div>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* ── CLEAN BOTTOM CTA BAR ─────────────────────────────────── */}
        <div className="text-center pt-2">
          <Link href={`/lesson/${lesson.id}/play`} className="inline-block">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="px-10 py-4 bg-[#10b981] hover:bg-[#059669] text-white font-black font-nunito text-base sm:text-lg rounded-2xl border-2 border-white/60 border-b-[5px] border-[#047857] shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2.5 transition-all active:translate-y-0.5"
            >
              <PlayCircle size={22} />
              <span>Let&apos;s Play Now! 🚀</span>
            </motion.button>
          </Link>
        </div>

      </div>
    </div>
  )
}
