'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Lock, Play, Star, Gift, Trophy, Sparkles, X, Heart, ArrowLeft, BookOpen } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useLives } from '@/hooks/useLives'
import { HeartsModal } from '@/components/gamification/HeartsModal'
import type { Lesson } from '@/types/lesson'
import type { Subject } from '@/lib/api'
import {
  SpringDuckPond,
  SpringFarmBarn,
  SpringMushroom,
  AutumnCampfire,
  AutumnParkBench,
  WinterSnowman,
  WinterSnowCabin,
  WinterFrozenLake,
  PineTreeSnow,
  FairytaleCottage3D,
  IsometricPineTree,
  PrizeWheelMilestone,
  BubbleTreeCluster,
  MeadowFlowersAndRocks,
  SideQuestBadge,
  MapIconButton,
} from './CourseScenery'
import { AnimatedSun, DoodleCloud, DoodleStar } from '@/components/home/KidsDoodles'
import { GiftRewardModal } from './GiftRewardModal'

export type FloorTheme = 'spring' | 'autumn' | 'winter'

interface CourseAdventureMapProps {
  lessons: Lesson[]
  progressMap: Map<number, any>
  onSelectLesson?: (lessonId: number) => void
  view?: 'course' | 'path' | 'all'
  onViewChange?: (v: 'course' | 'path' | 'all') => void
  hasPath?: boolean
  currentSubject?: Subject | { id?: number; name: string; slug?: string; color?: string; icon?: string } | null
  onBackToCourses?: () => void
}

interface MilestoneStation {
  id: number
  index: number
  title: string
  subtitle: string
  themeColor: string
  borderBottomColor: string
  icon: string
  status: 'completed' | 'active' | 'locked'
  difficulty: string
  xp: number
  realLessonId?: number
  stars: number
}

export function CourseAdventureMap({
  lessons,
  progressMap,
  onSelectLesson,
  currentSubject,
  onBackToCourses,
}: CourseAdventureMapProps) {
  const router = useRouter()
  const { child, xp } = useAppStore()
  const { lives, maxLives, formattedTime } = useLives()
  const [activeFloor, setActiveFloor] = useState<FloorTheme>('spring')
  const [giftOpen, setGiftOpen] = useState(false)
  const [heartsOpen, setHeartsOpen] = useState(false)
  const [selectedStation, setSelectedStation] = useState<MilestoneStation | null>(null)

  // Split lessons into 3 seasonal world tiers
  const worldLessons = useMemo(() => {
    const sorted = [...lessons].sort((a, b) => Number(a.order_index) - Number(b.order_index))
    const chunkSize = Math.max(3, Math.ceil(sorted.length / 3))
    return {
      spring: sorted.slice(0, chunkSize),
      autumn: sorted.slice(chunkSize, chunkSize * 2),
      winter: sorted.slice(chunkSize * 2),
    }
  }, [lessons])

  // Build milestone stations for the selected world
  const stations: MilestoneStation[] = useMemo(() => {
    const list = worldLessons[activeFloor]
    const iconsByWorld = {
      spring: ['🌸', '🏖️', '🌧️', '🍎', '🐥', '🦋'],
      autumn: ['🍂', '🦊', '🔥', '🦉', '🌾', '🍁'],
      winter: ['❄️', '🐋', '⛄', '🌲', '🎅', '🐧'],
    }[activeFloor]

    const colorsByWorld = {
      spring: [
        { bg: '#fb7185', border: '#e11d48' },
        { bg: '#38bdf8', border: '#0284c7' },
        { bg: '#34d399', border: '#059669' },
        { bg: '#facc15', border: '#d97706' },
      ],
      autumn: [
        { bg: '#fb923c', border: '#ea580c' },
        { bg: '#a78bfa', border: '#7c3aed' },
        { bg: '#facc15', border: '#d97706' },
        { bg: '#f43f5e', border: '#be123c' },
      ],
      winter: [
        { bg: '#38bdf8', border: '#0284c7' },
        { bg: '#818cf8', border: '#4f46e5' },
        { bg: '#2dd4bf', border: '#0d9488' },
        { bg: '#c084fc', border: '#9333ea' },
      ],
    }[activeFloor]

    const count = Math.max(4, Math.min(list.length, 5))
    const result: MilestoneStation[] = []
    let hasFoundActive = false

    for (let i = 0; i < count; i++) {
      const lesson = list[i]
      const realId = lesson?.id ? Number(lesson.id) : undefined
      const prog = realId ? progressMap.get(realId) : undefined

      let status: 'completed' | 'active' | 'locked' = 'locked'
      let stars = 0

      if (prog?.status === 'completed') {
        status = 'completed'
        stars = 3
      } else if (!hasFoundActive) {
        status = 'active'
        stars = 0
        hasFoundActive = true
      } else {
        status = 'locked'
        stars = 0
      }

      // Station 1 is active by default for brand new student if no stations completed yet
      if (i === 0 && status === 'locked') {
        status = 'active'
        hasFoundActive = true
      }

      const colorPair = colorsByWorld[i % colorsByWorld.length]
      const icon = iconsByWorld[i % iconsByWorld.length]

      result.push({
        id: realId || (i + 1) * 100,
        index: i + 1,
        title: lesson?.title || `${activeFloor.toUpperCase()} ${i + 1}`,
        subtitle: lesson?.description || 'Interactive voice, story, and fun games!',
        themeColor: colorPair.bg,
        borderBottomColor: colorPair.border,
        icon,
        status,
        difficulty: lesson?.difficulty ? lesson.difficulty.toUpperCase() : 'EASY',
        xp: lesson?.xp_reward || 20 + i * 10,
        realLessonId: realId,
        stars,
      })
    }

    return result
  }, [worldLessons, activeFloor, progressMap])

  // World visual theme settings
  const worldTheme = {
    spring: {
      name: 'Spring Meadow',
      emoji: '🌸',
      booksCount: '30 books',
      skyBg: 'bg-[#a7f3d0]',
      skyBgColor: '#a7f3d0',
      hillBack: '#4ade80',
      hillMid: '#22c55e',
      hillFront: '#16a34a',
      activeTabBg: 'bg-[#10b981] text-white border-b-4 border-[#047857] shadow-lg shadow-emerald-600/30',
    },
    autumn: {
      name: 'Autumn Woods',
      emoji: '🍂',
      booksCount: '50 books',
      skyBg: 'bg-[#fef08a]',
      skyBgColor: '#fef08a',
      hillBack: '#facc15',
      hillMid: '#fbbf24',
      hillFront: '#f59e0b',
      activeTabBg: 'bg-[#f59e0b] text-white border-b-4 border-[#b45309] shadow-lg shadow-amber-600/30',
    },
    winter: {
      name: 'Winter Wonderland',
      emoji: '❄️',
      booksCount: '70 books',
      skyBg: 'bg-[#bae6fd]',
      skyBgColor: '#bae6fd',
      hillBack: '#7dd3fc',
      hillMid: '#38bdf8',
      hillFront: '#0284c7',
      activeTabBg: 'bg-[#0284c7] text-white border-b-4 border-[#0369a1] shadow-lg shadow-sky-600/30',
    },
  }[activeFloor]

  const handleStartStation = (station: MilestoneStation) => {
    if (station.status === 'locked') return
    if (station.realLessonId) {
      if (onSelectLesson) {
        onSelectLesson(station.realLessonId)
      } else {
        router.push(`/lessons/${station.realLessonId}`)
      }
    } else if (lessons[0]?.id) {
      router.push(`/lessons/${lessons[0].id}`)
    }
  }

  // Exact S-curve horizontal alignments matching the SVG trail (Image 2)
  const curveAlignments = [
    'justify-center sm:justify-start sm:pl-28', // Station 1 (Left: x ~ 260)
    'justify-center sm:justify-end sm:pr-28',   // Station 2 (Right: x ~ 740)
    'justify-center',                           // Station 3 (Center: x ~ 500)
    'justify-center sm:justify-start sm:pl-28', // Station 4 (Left: x ~ 260)
    'justify-center sm:justify-end sm:pr-28',   // Station 5 (Right: x ~ 740)
  ]

  return (
    <div className={`w-full min-h-screen ${worldTheme.skyBg} transition-colors duration-700 relative overflow-hidden flex flex-col items-center pb-20`}>
      
      {/* ── Background Doodles & Sky Props ─────────────────────────── */}
      <AnimatedSun className="absolute top-8 right-12 sm:right-24 w-28 sm:w-36 z-10 pointer-events-none" />
      <DoodleCloud className="absolute top-12 left-10 sm:left-24 w-36 sm:w-48 z-10 pointer-events-none" delay={0} />
      <DoodleCloud className="absolute top-52 right-1/4 w-32 sm:w-44 z-10 pointer-events-none" delay={1.5} />
      <DoodleStar className="absolute top-40 left-1/3 text-amber-300 w-8 h-8 z-10 pointer-events-none" />

      {/* ── Side HUD Badges (Parchment Map & Quest Timer - Image 2) ─── */}
      <div className="absolute top-28 left-4 sm:left-8 z-30 hidden sm:block">
        <MapIconButton onClick={onBackToCourses ?? (() => router.push('/lessons'))} />
      </div>
      <div className="absolute bottom-12 left-4 sm:left-8 z-30 hidden sm:block">
        <SideQuestBadge />
      </div>

      {/* ── Full-Bleed Rolling Hills & Crisp White Dotted Trail ─────── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Rolling Hills Background Landscape */}
        <svg className="absolute bottom-0 w-full h-[950px]" viewBox="0 0 1440 950" preserveAspectRatio="none">
          {/* Back Hill Layer */}
          <path
            d="M0,260 C360,160 640,320 980,200 C1200,120 1440,220 1440,950 L0,950 Z"
            fill={worldTheme.hillBack}
            opacity="0.75"
          />
          {/* Mid Hill Layer */}
          <path
            d="M0,420 C280,300 580,480 920,360 C1180,280 1440,380 1440,950 L0,950 Z"
            fill={worldTheme.hillMid}
            opacity="0.85"
          />
          {/* Front Hill Layer */}
          <path
            d="M0,600 C320,500 660,680 1020,540 C1240,460 1440,560 1440,950 L0,950 Z"
            fill={worldTheme.hillFront}
          />
        </svg>

        {/* Crisp White Dotted Walking Path (Curving through stations - Image 2) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 1350" preserveAspectRatio="none">
          {/* Path Soft Drop Shadow */}
          <path
            d="M 280,240 C 520,240 720,340 720,490 C 720,620 500,640 500,770 C 500,890 280,910 280,1040 C 280,1170 520,1200 720,1270"
            stroke="rgba(0, 0, 0, 0.16)"
            strokeWidth="11"
            strokeDasharray="14 18"
            strokeLinecap="round"
            fill="none"
          />
          {/* Pure White Stepping Dots */}
          <path
            d="M 280,236 C 520,236 720,336 720,486 C 720,616 500,636 500,766 C 500,886 280,906 280,1036 C 280,1166 520,1196 720,1266"
            stroke="#ffffff"
            strokeWidth="8"
            strokeDasharray="14 18"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      {/* ── Scenery Props Placed Natural to the Trail (Image 2 & 3) ─── */}
      {activeFloor === 'spring' && (
        <>
          {/* Top-Right Duck Pond */}
          <div className="absolute top-[210px] right-4 sm:right-20 w-36 sm:w-48 z-10 pointer-events-none">
            <SpringDuckPond />
          </div>
          {/* Bubbly Cartoon Trees near Station 1 & 2 (Image 2) */}
          <div className="absolute top-[340px] left-2 sm:left-14 w-28 sm:w-36 z-10 pointer-events-none">
            <BubbleTreeCluster variant="teal" />
          </div>
          {/* Meadow Daisies and River Pebbles */}
          <div className="absolute top-[440px] left-8 sm:left-24 w-32 sm:w-40 z-10 pointer-events-none">
            <MeadowFlowersAndRocks />
          </div>
          {/* 3D Fairytale Cottage with Blue Roof & Picnic Bench (Image 3) */}
          <div className="absolute top-[560px] left-3 sm:left-12 w-48 sm:w-56 z-10 pointer-events-none">
            <FairytaleCottage3D />
          </div>
          {/* Milestone Prize Wheel with Alert Badge (Image 2) */}
          <div className="absolute top-[780px] right-4 sm:right-24 w-24 sm:w-32 z-10 pointer-events-none">
            <PrizeWheelMilestone />
          </div>
          {/* Evergreen Pine Tree */}
          <div className="absolute top-[720px] left-6 sm:left-20 w-20 sm:w-24 z-10 pointer-events-none">
            <IsometricPineTree />
          </div>
          {/* Clustered Trees near Finish Line */}
          <div className="absolute bottom-16 left-4 sm:left-20 w-32 sm:w-40 z-10 pointer-events-none">
            <BubbleTreeCluster variant="emerald" />
          </div>
          {/* Spring Farm Barn & Spinning Windmill */}
          <div className="absolute bottom-10 right-2 sm:right-20 w-44 sm:w-56 z-10 pointer-events-none">
            <SpringFarmBarn />
          </div>
        </>
      )}

      {activeFloor === 'autumn' && (
        <>
          <div className="absolute top-[260px] left-6 sm:left-20 w-32 sm:w-40 z-10 pointer-events-none">
            <BubbleTreeCluster variant="warm" />
          </div>
          <div className="absolute top-[380px] left-8 sm:left-24 w-44 sm:w-56 z-10 pointer-events-none">
            <AutumnCampfire />
          </div>
          <div className="absolute top-[580px] left-6 sm:left-20 w-48 sm:w-60 z-10 pointer-events-none">
            <FairytaleCottage3D />
          </div>
          <div className="absolute top-[480px] right-6 sm:right-24 w-24 sm:w-28 z-10 pointer-events-none">
            <PrizeWheelMilestone />
          </div>
          <div className="absolute bottom-16 right-8 sm:right-28 w-48 sm:w-60 z-10 pointer-events-none">
            <AutumnParkBench />
          </div>
        </>
      )}

      {activeFloor === 'winter' && (
        <>
          <div className="absolute top-28 right-24 sm:right-36 w-20 z-10 pointer-events-none">
            <PineTreeSnow />
          </div>
          <div className="absolute top-[360px] left-6 sm:left-20 w-44 sm:w-56 z-10 pointer-events-none">
            <WinterFrozenLake />
          </div>
          <div className="absolute bottom-28 left-10 sm:left-24 w-24 z-10 pointer-events-none">
            <WinterSnowman />
          </div>
          <div className="absolute bottom-16 right-6 sm:right-24 w-52 sm:w-64 z-10 pointer-events-none">
            <WinterSnowCabin />
          </div>
        </>
      )}

      {/* ── Unified Floating Adventure HUD ──────────────────────────── */}
      {/* Kept elevated with adequate spacing so Pip & Station 1 never overlap! */}
      <header className="w-full max-w-4xl px-4 pt-6 pb-4 z-30">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-3 sm:p-3.5 shadow-xl border-4 border-white flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Left: Child Profile Badge & Back Button */}
          <div className="flex items-center gap-2.5 sm:gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5">
              {onBackToCourses && (
                <button
                  type="button"
                  onClick={onBackToCourses}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#eff6ff] hover:bg-[#dbeafe] text-[#1e3a8a] border-2 border-[#bfdbfe] border-b-4 border-[#93c5fd] font-black font-nunito text-xs active:translate-y-0.5 transition-all cursor-pointer shadow-sm flex-shrink-0"
                  title="Back to Course Categories"
                >
                  <ArrowLeft size={15} className="text-[#2563eb]" />
                  <span className="hidden sm:inline">All Courses</span>
                  <span className="sm:hidden">Courses</span>
                </button>
              )}
              <div className="w-11 h-11 rounded-2xl bg-[#ec4899] border-2 border-white shadow-sm flex items-center justify-center text-2xl flex-shrink-0">
                {child?.avatar_seed === 'bear' ? '🐻' : child?.avatar_seed === 'cat' ? '🐱' : '👧'}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black text-[#1d2445] font-nunito leading-tight">
                    Hi, {child?.name || 'Explorer'}!
                  </h3>
                  {currentSubject && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-100 text-purple-900 font-extrabold text-[10px]">
                      <span>{currentSubject.icon || '📚'}</span>
                      <span>{currentSubject.name}</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="flex items-center gap-1 bg-amber-100 border border-amber-300 rounded-full px-2.5 py-0.5 text-[10px] font-black text-amber-900">
                    <Trophy size={11} className="text-amber-600" />
                    Lvl 1 · {xp || 0}/50
                  </span>
                  <button
                    onClick={() => setHeartsOpen(true)}
                    className="flex items-center gap-1 bg-rose-100 hover:bg-rose-200 border border-rose-300 rounded-full px-2.5 py-0.5 text-[10px] font-black text-rose-900 cursor-pointer transition-transform active:scale-95"
                    title={`Hearts: ${lives}/${maxLives} · Click to refill`}
                  >
                    <Heart size={10} className="text-rose-500" fill="#f43f5e" />
                    <span>{lives}/{maxLives}</span>
                    {lives < maxLives && (
                      <span className="text-[9px] text-amber-700 font-mono">
                        ({formattedTime})
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Hearts Refill Modal */}
            <HeartsModal isOpen={heartsOpen} onClose={() => setHeartsOpen(false)} />

            {/* Mobile-only Action Buttons */}
            <div className="flex md:hidden items-center gap-1.5">
              <button
                onClick={() => router.push('/demo')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-black font-nunito text-xs border-2 border-white/60 border-b-4 border-[#047857] shadow-sm active:translate-y-0.5"
              >
                <Sparkles size={12} className="text-amber-300" />
                <span>Demo</span>
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setGiftOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#9333ea] hover:bg-[#7e22ce] text-white font-black font-nunito text-xs border-2 border-white/60 border-b-4 border-[#581c87] shadow-sm transition-all"
              >
                <Gift size={13} className="text-white animate-bounce" />
                <span>Gift</span>
              </motion.button>
            </div>
          </div>

          {/* Center: 3D Segmented World Navigation Tabs */}
          <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/90 grid grid-cols-3 gap-1.5 w-full md:w-auto">
            {(['spring', 'autumn', 'winter'] as const).map(f => {
              const isActive = activeFloor === f
              const meta = {
                spring: { title: 'FLOOR 1', sub: '🌸 30 bks', color: 'bg-[#10b981] border-[#047857]' },
                autumn: { title: 'FLOOR 2', sub: '🍂 50 bks', color: 'bg-[#f59e0b] border-[#b45309]' },
                winter: { title: 'FLOOR 3', sub: '❄️ 70 bks', color: 'bg-[#0284c7] border-[#0369a1]' },
              }[f]

              return (
                <button
                  key={f}
                  onClick={() => setActiveFloor(f)}
                  className={`py-1.5 px-3.5 sm:px-5 rounded-xl font-nunito text-center transition-all cursor-pointer select-none ${
                    isActive
                      ? `${meta.color} text-white border-b-4 shadow-md scale-[1.02]`
                      : 'bg-transparent hover:bg-white/70 text-slate-700'
                  }`}
                >
                  <span className="block font-black text-xs tracking-wider uppercase leading-none">
                    {meta.title}
                  </span>
                  <span className="block font-bold text-[10px] opacity-90 leading-none mt-1">
                    {meta.sub}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Right: Action Buttons (Desktop) */}
          <div className="hidden md:flex items-center gap-2.5 flex-shrink-0">
            <button
              onClick={() => router.push('/demo')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#10b981] hover:bg-[#059669] text-white font-black font-nunito text-xs sm:text-sm border-2 border-white/60 border-b-4 border-[#047857] shadow-md transition-all active:translate-y-0.5 cursor-pointer"
            >
              <Sparkles size={14} className="text-amber-300" />
              <span>Free Demo</span>
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setGiftOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#9333ea] hover:bg-[#7e22ce] text-white font-black font-nunito text-xs sm:text-sm border-2 border-white/60 border-b-4 border-[#581c87] shadow-md transition-all active:translate-y-0.5 cursor-pointer"
            >
              <Gift size={16} className="text-white animate-bounce" />
              <span>Claim Mystery Gift!</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* ── 3D Coin Podiums Along the S-Curve (Image 2) ─────────────── */}
      {/* Placed with generous top padding so Station 1 and Pip have clear breathing space */}
      <main className="relative z-20 w-full max-w-4xl px-4 pt-16 pb-24 space-y-24 sm:space-y-28">
        {stations.length === 0 ? (
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 max-w-md mx-auto text-center border-4 border-white shadow-xl space-y-4">
            <span className="text-5xl">🚀</span>
            <h3 className="text-xl font-black text-[#1d2445] font-nunito">New Adventures Coming Soon!</h3>
            <p className="text-slate-600 font-bold text-sm">Pip is preparing wonderful new lessons for this course.</p>
            {onBackToCourses && (
              <button
                type="button"
                onClick={onBackToCourses}
                className="px-6 py-2.5 rounded-2xl bg-[#58cc02] hover:bg-[#46a302] text-white font-black text-sm border-2 border-white border-b-4 border-[#3b8702] shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                Choose Another Course
              </button>
            )}
          </div>
        ) : (
          stations.map((station, idx) => {
          const alignClass = curveAlignments[idx % curveAlignments.length]
          const isCompleted = station.status === 'completed'
          const isActive = station.status === 'active'
          const isLocked = station.status === 'locked'
          const number = station.index
          const isLast = idx === stations.length - 1

          return (
            <div key={station.id} className={`flex items-center ${alignClass}`}>
              <div className="relative flex flex-col items-center">
                
                {/* Animated Yellow Chick Mascot Pip on Active Station (Image 2) */}
                {isActive && (
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-20 z-30 flex flex-col items-center pointer-events-none select-none"
                  >
                    {/* High-Contrast Speech Bubble */}
                    <div className="bg-white border-2 border-slate-900 rounded-full px-3 py-1 text-[11px] font-black text-slate-900 shadow-xl whitespace-nowrap mb-1 flex items-center gap-1.5">
                      <Sparkles size={11} className="text-amber-500" fill="#f59e0b" />
                      <span>Ready to play! ▶</span>
                    </div>
                    {/* Pip Yellow Duck Chick Mascot */}
                    <span className="text-4xl filter drop-shadow-lg">🐥</span>
                  </motion.div>
                )}

                {/* Active Station Radiant Aura Glow Rings (Image 2) */}
                {isActive && (
                  <>
                    <div className="absolute -inset-4 rounded-full bg-amber-400/30 animate-ping pointer-events-none" />
                    <div className="absolute -inset-2 rounded-full bg-amber-300/40 animate-pulse pointer-events-none" />
                  </>
                )}

                {/* 3D Round Coin Podium (Golden for Completed/Active, Stone for Locked) */}
                <motion.button
                  whileHover={{ scale: isLocked ? 1 : 1.08 }}
                  whileTap={{ scale: isLocked ? 1 : 0.94 }}
                  onClick={() => setSelectedStation(station)}
                  className={`
                    relative w-20 h-20 sm:w-24 sm:h-24 rounded-full select-none cursor-pointer
                    flex items-center justify-center transition-transform aspect-square
                    ${isLocked ? 'cursor-not-allowed opacity-90' : ''}
                  `}
                >
                  {/* Soft Ground Shadow */}
                  <div className="absolute inset-x-2 -bottom-3 h-8 rounded-full bg-slate-950/25 blur-xs pointer-events-none" />

                  {/* Outer Coin Rim Cylinder */}
                  <div className={`
                    absolute inset-0 rounded-full flex items-center justify-center p-1.5
                    ${isCompleted || isActive
                      ? 'bg-gradient-to-b from-[#fde047] via-[#facc15] to-[#ca8a04] border-2 border-[#fef9c3] shadow-[0_8px_0_#a16207,0_12px_24px_rgba(0,0,0,0.25)]'
                      : 'bg-gradient-to-b from-[#f1f5f9] via-[#cbd5e1] to-[#94a3b8] border-2 border-white/80 shadow-[0_8px_0_#64748b,0_12px_20px_rgba(0,0,0,0.18)]'
                    }
                    ${isActive ? 'ring-4 ring-amber-300 ring-offset-2 ring-offset-emerald-400 shadow-[0_8px_0_#a16207,0_0_28px_rgba(250,204,21,0.7)]' : ''}
                  `}>
                    
                    {/* Inner 3D Coin Face */}
                    <div className={`
                      w-full h-full rounded-full flex flex-col items-center justify-center
                      border-2 shadow-inner relative
                      ${isCompleted || isActive
                        ? 'bg-gradient-to-b from-[#fef08a] via-[#facc15] to-[#eab308] border-[#fef9c3]'
                        : 'bg-gradient-to-b from-[#f8fafc] to-[#cbd5e1] border-white/70'
                      }
                    `}>
                      {/* Top Glossy Bevel Highlight Arc */}
                      <div className="absolute top-1 left-2 right-2 h-3 rounded-full bg-white/40 pointer-events-none" />

                      {/* Embossed Bold Digit or Lock Icon */}
                      {isLocked ? (
                        <div className="flex flex-col items-center justify-center -space-y-0.5">
                          <Lock size={20} className="text-[#64748b] drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]" />
                          <span className="font-nunito font-black text-xs text-[#64748b]">
                            {number}
                          </span>
                        </div>
                      ) : (
                        <span className="font-nunito font-black text-3xl sm:text-4xl text-[#78350f] drop-shadow-[0_2px_0_#fef08a]">
                          {number}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>

                {/* 3 Floating 3D Gold Stars Nestled Under Completed Coin (Image 2) */}
                {isCompleted && (
                  <div className="absolute -bottom-4 flex items-center justify-center gap-1 z-20 pointer-events-none select-none">
                    <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 2.2, repeat: Infinity, delay: 0 }}>
                      <Star size={18} fill="#facc15" className="text-yellow-500 drop-shadow-md -rotate-12" />
                    </motion.div>
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2.2, repeat: Infinity, delay: 0.25 }}>
                      <Star size={24} fill="#facc15" className="text-yellow-400 drop-shadow-lg -mt-1" />
                    </motion.div>
                    <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 2.2, repeat: Infinity, delay: 0.5 }}>
                      <Star size={18} fill="#facc15" className="text-yellow-500 drop-shadow-md rotate-12" />
                    </motion.div>
                  </div>
                )}

                {/* Checkered Finish Victory Flag at final station (Image 2) */}
                {isLast && (
                  <div className="absolute -top-12 -right-8 text-3xl filter drop-shadow-md pointer-events-none animate-bounce">
                    🏁
                  </div>
                )}

                {/* Attached Signpost Pill Below Coin */}
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  onClick={() => setSelectedStation(station)}
                  className="mt-4 bg-white/95 backdrop-blur-md border-2 border-slate-200 border-b-4 border-slate-300 rounded-2xl px-4 py-2 shadow-lg text-center cursor-pointer max-w-[190px]"
                >
                  <p className="font-nunito font-black text-xs text-[#1d2445] truncate">
                    {station.title}
                  </p>
                  <div className="flex items-center justify-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] font-black rounded-full px-2 py-0.5 ${
                      isCompleted ? 'bg-emerald-100 text-emerald-800' :
                      isLocked ? 'bg-slate-100 text-slate-500' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {isCompleted ? 'Finished ✓' : isLocked ? 'Locked 🔒' : 'Play now ▶'}
                    </span>
                    <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 flex items-center gap-0.5">
                      <Star size={9} fill="#d97706" /> +{station.xp}
                    </span>
                  </div>
                </motion.div>

              </div>
            </div>
          )
        }))}
      </main>

      {/* ── Interactive Mystery Gift Modal ───────────────────────────── */}
      <GiftRewardModal
        isOpen={giftOpen}
        onClose={() => setGiftOpen(false)}
      />

      {/* ── Milestone Station Preview Dialog ─────────────────────────── */}
      <AnimatePresence>
        {selectedStation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 15 }}
              className="w-full max-w-sm bg-white border-4 border-amber-300 rounded-[36px] p-6 shadow-2xl text-center relative"
            >
              <button
                onClick={() => setSelectedStation(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div
                style={{ backgroundColor: selectedStation.themeColor }}
                className="w-24 h-24 rounded-full mx-auto flex items-center justify-center text-5xl shadow-xl border-4 border-white mb-4"
              >
                {selectedStation.icon}
              </div>

              <span className="bg-amber-100 text-amber-900 font-black text-xs font-nunito px-3 py-1 rounded-full uppercase tracking-wider">
                {selectedStation.difficulty} · {selectedStation.xp} XP
              </span>

              <h3 className="text-xl font-black font-nunito text-[#1d2445] mt-2 mb-1">
                {selectedStation.title}
              </h3>
              <p className="text-slate-600 font-bold text-xs font-nunito mb-6 max-w-[260px] mx-auto leading-relaxed">
                {selectedStation.subtitle}
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedStation(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black font-nunito rounded-2xl text-sm transition-colors cursor-pointer"
                >
                  Close
                </button>

                {selectedStation.status !== 'locked' ? (
                  <button
                    onClick={() => {
                      const st = selectedStation
                      setSelectedStation(null)
                      handleStartStation(st)
                    }}
                    className="flex-1 py-3 bg-[#22c55e] hover:bg-[#16a34a] text-white font-black font-nunito rounded-2xl text-sm border-b-4 border-[#15803d] shadow-md flex items-center justify-center gap-1.5 transition-all hover:scale-105 active:translate-y-0.5 cursor-pointer"
                  >
                    <Play size={16} fill="white" />
                    <span>Play Now</span>
                  </button>
                ) : (
                  <div className="flex-1 py-3 bg-slate-100 text-slate-400 font-black font-nunito rounded-2xl text-sm flex items-center justify-center gap-1.5 cursor-not-allowed">
                    <Lock size={16} />
                    <span>Locked</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
