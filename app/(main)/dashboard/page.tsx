'use client'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookOpen, Play, Trophy, ChevronRight, Star, Users, Sparkles, Flame, Heart, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api'
import { getToken } from '@/lib/auth'
import { useAppStore } from '@/store/useAppStore'
import { XPBar } from '@/components/gamification/XPBar'
import { StreakCounter } from '@/components/gamification/StreakCounter'
import { LivesBar } from '@/components/lesson/LivesBar'
import { LessonCard } from '@/components/lesson/LessonCard'
import { Pip } from '@/components/mascot/Pip'
import { Spinner } from '@/components/ui/Spinner'
import { ScallopRibbon } from '@/components/home/ScallopRibbon'
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus'
import { useCoach } from '@/hooks/useCoach'
import type { Lesson, LessonProgress } from '@/types/lesson'
import { getAgeGroup, lessonMatchesAge } from '@/lib/curriculum.data'

export default function DashboardPage() {
  const router = useRouter()
  const { child, xp, streak, lives, setChild, hydrateProfile } = useAppStore()
  const [progress, setProgress] = useState<LessonProgress[]>([])
  const [recentLessons, setRecentLessons] = useState<Lesson[]>([])
  const [multipleChildren, setMultipleChildren] = useState(false)
  const [loading, setLoading] = useState(true)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return }

    const loadData = async () => {
      try {
        const [childList, lessons] = await Promise.all([
          child ? Promise.resolve(null) : api.children.list(),
          api.lessons.list(),
        ])

        if (!child) {
          if (!childList || childList.length === 0) { router.push('/onboarding'); return }
          const first = childList[0]
          setChild({
            id: String(first.id),
            user_id: String(first.user_id),
            name: first.name,
            age: first.age,
            avatar_seed: first.avatar_seed ?? 'lion',
            created_at: '',
          })
          setMultipleChildren(childList.length > 1)
        } else {
          api.children.list().then(list => setMultipleChildren(list.length > 1)).catch(() => {})
        }

        const currentChild = child || (childList ? childList[0] : null)
        const childAgeGroup = currentChild ? getAgeGroup(currentChild.age ?? 4) : '0-5'
        const allLessons = Array.isArray(lessons) ? (lessons as unknown as Lesson[]) : []
        const ageFiltered = allLessons.filter(l => lessonMatchesAge(l, childAgeGroup))
        setRecentLessons(ageFiltered.length > 0 ? ageFiltered.slice(0, 4) : allLessons.slice(0, 4))
      } catch {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [child, router, setChild])

  const refresh = useCallback(async () => {
    const c = useAppStore.getState().child
    if (!c) return
    try {
      const [prog, prof] = await Promise.all([api.progress.list(Number(c.id)), api.profile.get(Number(c.id))])
      setProgress(prog as unknown as LessonProgress[])
      hydrateProfile(prof)
    } catch { /* keep current */ }
  }, [hydrateProfile])

  const coach = useCoach('weekly_plan')
  useEffect(() => { if (child?.id) { refresh(); coach.refresh() } }, [child?.id, refresh]) // eslint-disable-line react-hooks/exhaustive-deps
  useRefetchOnFocus(() => { refresh(); coach.refresh() })

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#201c4d]">
      <Spinner size={44} />
    </div>
  )

  const pipText = coach.note?.child
    ?? (streak > 0
      ? `${greeting}, ${child?.name || 'friend'}! You're on a ${streak} day streak!`
      : `${greeting}, ${child?.name || 'friend'}! Ready to learn today? 🌟`)
  const topPick = coach.rec?.recommended[0]

  return (
    <div className="w-full flex flex-col">
      
      {/* ── Full-Bleed Twilight Hero Greeting (Matching Landing Page) ── */}
      <section className="relative bg-[#201c4d] text-white pt-6 sm:pt-10 overflow-hidden">
        
        {/* Soft Purple Cloud Puffs */}
        <div className="absolute top-6 left-8 w-32 h-16 bg-[#2e2968] rounded-full pointer-events-none opacity-80" />
        <div className="absolute top-4 right-16 w-40 h-20 bg-[#2e2968] rounded-full pointer-events-none opacity-75 hidden sm:block" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            
            {/* Left Column: Greeting, Stats & Child Badge */}
            <div className="lg:col-span-8 space-y-4 pb-6 sm:pb-10">
              
              {/* Online / Active Badge */}
              <div className="inline-flex items-center gap-2 bg-[#171439]/90 border border-white/15 rounded-full px-4 py-1.5 text-xs font-black text-purple-200 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] animate-pulse" />
                <span>Pip is ready for today&apos;s lesson!</span>
              </div>

              {/* Big Bubbly Greeting */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
                {greeting},{' '}
                <span className="text-[#facc15]">{child?.name || 'Little Star'}</span>!
              </h1>

              {/* Multiple Children Switcher */}
              {multipleChildren && (
                <Link href="/parent" className="inline-flex items-center gap-2 text-purple-200 hover:text-white text-xs font-extrabold bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-xl transition-all">
                  <Users size={14} />
                  <span>Switch child profile</span>
                  <ChevronRight size={14} />
                </Link>
              )}

              {/* Gamification Level Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 max-w-2xl">
                <div className="sm:col-span-2 bg-[#171439]/90 border border-white/10 rounded-2xl p-3 shadow-inner">
                  <XPBar />
                </div>
                <div className="flex items-center justify-around bg-[#171439]/90 border border-white/10 rounded-2xl p-3">
                  <div className="flex items-center gap-1.5">
                    <Flame size={18} className="text-orange-400" fill="#f97316" />
                    <span className="text-orange-200 font-black text-sm font-nunito">{streak}d Streak</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Heart size={18} className="text-rose-400" fill="#f43f5e" />
                    <span className="text-rose-200 font-black text-sm font-nunito">{lives} Hearts</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Pip with Speech Bubble standing on the meadow */}
            <div className="lg:col-span-4 flex flex-col items-center justify-end relative z-20 pb-0 lg:-mb-8">
              
              {/* Speech Bubble */}
              <div className="bg-white text-slate-900 rounded-3xl px-4 py-3 shadow-2xl max-w-[260px] mb-3 relative z-30 border-2 border-slate-100">
                <p className="font-nunito font-black text-xs sm:text-sm leading-snug text-center text-slate-800">
                  {pipText}
                </p>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r border-b border-slate-100" />
              </div>

              {/* Pip Character */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="relative z-20 flex justify-center"
              >
                <Pip size="xl" mood={streak > 2 ? 'excited' : 'happy'} animate="idle" />
              </motion.div>

            </div>

          </div>
        </div>

        {/* ── Undulating Rolling Green Hill SVG ───────────────────────── */}
        <div className="w-full leading-none relative z-10 -mt-10 sm:-mt-16">
          <svg
            viewBox="0 0 1440 180"
            preserveAspectRatio="none"
            className="w-full h-24 sm:h-36 block"
          >
            <path
              d="M 0 80 Q 400 20 850 65 T 1440 40 L 1440 180 L 0 180 Z"
              fill="#1e6b37"
            />
            <path
              d="M 0 115 Q 420 55 900 95 T 1440 70 L 1440 180 L 0 180 Z"
              fill="#2ea84e"
            />
            {/* Daisies */}
            <g transform="translate(320, 125)">
              <circle cx="0" cy="0" r="6" fill="#ffffff" />
              <circle cx="0" cy="0" r="2.5" fill="#facc15" />
            </g>
            <g transform="translate(1120, 100)">
              <circle cx="0" cy="0" r="6" fill="#ffffff" />
              <circle cx="0" cy="0" r="2.5" fill="#facc15" />
            </g>
          </svg>
        </div>

        {/* Ground Bar under Hills */}
        <div className="w-full bg-[#161338] h-3" />

      </section>

      {/* ── Scalloped Cloud Transition into Sunny Canvas ──────────────── */}
      <ScallopRibbon topBg="#161338" bottomBg="#fffdf8" variant="scallop" />

      {/* ── Main Content Area: Warm Sunny Canvas with 3D Color Bricks ─── */}
      <section className="py-10 px-4 sm:px-6 bg-[#fffdf8] relative overflow-hidden">
        
        {/* Playful kids doodles */}
        <div className="absolute top-12 right-10 pointer-events-none opacity-70 hidden sm:block">
          <svg width="70" height="70" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="16" fill="#facc15" />
            <path d="M40 8 V16 M40 64 V72 M8 40 H16 M64 40 H72" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
            <circle cx="34" cy="38" r="2" fill="#78350f" />
            <circle cx="46" cy="38" r="2" fill="#78350f" />
            <path d="M35 44 Q40 48 45 44" stroke="#78350f" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        </div>

        <div className="max-w-6xl mx-auto space-y-10 relative z-10">
          
          {/* 3 Chunky 3D Quick-Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                icon: BookOpen,
                label: 'Course Adventure',
                desc: 'Explore the 4 Seasons Map',
                href: `/lessons?age=${child ? getAgeGroup(child.age ?? 4) : '0-5'}`,
                cardBg: 'bg-[#eff6ff]',
                cardBorder: 'border-[#3b82f6] border-b-[#1d4ed8]',
                badgeBg: 'bg-[#3b82f6]',
                textColor: 'text-[#1e3a8a]',
              },
              {
                icon: Play,
                label: 'Video Lessons',
                desc: 'Watch fun stories & songs',
                href: '/videos',
                cardBg: 'bg-[#fff7ed]',
                cardBorder: 'border-[#f97316] border-b-[#c2410c]',
                badgeBg: 'bg-[#f97316]',
                textColor: 'text-[#7c2d12]',
              },
              {
                icon: Trophy,
                label: 'Trophy Room',
                desc: 'View unlocked badges & XP',
                href: '/achievements',
                cardBg: 'bg-[#fefce8]',
                cardBorder: 'border-[#eab308] border-b-[#ca8a04]',
                badgeBg: 'bg-[#eab308]',
                textColor: 'text-[#713f12]',
              },
            ].map(({ icon: Icon, label, desc, href, cardBg, cardBorder, badgeBg, textColor }) => (
              <Link key={href} href={href} className="group">
                <div className={`${cardBg} ${cardBorder} border-2 border-b-[6px] rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between h-full`}>
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-14 h-14 rounded-2xl ${badgeBg} text-white flex items-center justify-center shadow-md transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                        <Icon size={26} strokeWidth={2.4} />
                      </div>
                      <span className="text-xs font-black px-3 py-1 rounded-full bg-white/80 text-slate-800 border border-black/5 shadow-2xs">
                        Enter →
                      </span>
                    </div>
                    <h3 className={`${textColor} font-black text-xl mb-1`}>{label}</h3>
                    <p className="text-slate-600 font-bold text-xs">{desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* "Picked For You" Recommendation Card */}
          {topPick && (
            <Link
              href={topPick.reason === 'checkpoint' && topPick.skill_slug ? `/checkpoint/${encodeURIComponent(topPick.skill_slug)}` : `/lessons/${topPick.lesson_id}`}
              className="block group"
            >
              <div className="bg-[#10b981] rounded-3xl p-6 sm:p-7 text-white shadow-lg shadow-emerald-600/20 border-2 border-[#059669] border-b-[5px] transition-all hover:scale-[1.01] hover:shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center flex-shrink-0 shadow-md">
                    <Star size={28} className="text-[#facc15]" fill="#facc15" />
                  </div>
                  <div>
                    <span className="bg-[#facc15] text-[#164e24] text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full inline-block mb-1">
                      ✦ Picked Just For You
                    </span>
                    <h3 className="font-black text-xl sm:text-2xl text-white tracking-tight">{topPick.title}</h3>
                    <p className="text-emerald-100 font-bold text-xs sm:text-sm">{topPick.message}</p>
                  </div>
                </div>
                <div className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-emerald-800 font-black text-sm px-6 py-3 rounded-2xl shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
                  <span>Start Adventure</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            </Link>
          )}

          {/* Continue Learning Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#1d2445] tracking-tight">
                  Continue Learning
                </h2>
                <p className="text-slate-500 font-bold text-sm">Pick up where you left off</p>
              </div>
              <Link href={`/lessons?age=${child ? getAgeGroup(child.age ?? 4) : '0-5'}`} className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-black text-sm font-nunito bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl border border-emerald-200 transition-colors">
                <span>See all</span>
                <ChevronRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {recentLessons.length === 0 ? (
                <div className="col-span-2 text-center py-16 bg-white rounded-3xl border-2 border-slate-200 p-8 shadow-sm">
                  <Star size={44} className="text-amber-400 mx-auto mb-3" />
                  <p className="text-slate-800 font-black text-lg">No lessons yet!</p>
                  <p className="text-slate-500 font-bold text-sm mt-1">Jump into Courses to start your first story adventure!</p>
                  <Link href="/lessons" className="inline-flex items-center gap-2 bg-[#22c55e] text-white font-black px-6 py-2.5 rounded-full mt-4 shadow-md">
                    <span>Explore Courses</span>
                  </Link>
                </div>
              ) : (
                recentLessons.map((lesson, i) => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    index={i}
                    progress={progress.find(p => Number(p.lesson_id) === Number(lesson.id))}
                  />
                ))
              )}
            </div>
          </div>

        </div>
      </section>

    </div>
  )
}
