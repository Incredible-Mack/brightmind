'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  LogOut,
  Star,
  Flame,
  Heart,
  Users,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  BookOpen,
  BarChart3,
  Settings,
  Plus,
  CheckCircle2,
  Trophy,
  Shield,
} from 'lucide-react'
import { signOut } from '@/lib/session'
import { useAppStore } from '@/store/useAppStore'
import { api } from '@/lib/api'
import type { Child } from '@/types/child'
import { Avatar } from '@/components/ui/Avatar'
import { XPBar } from '@/components/gamification/XPBar'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { getLevelFromXP } from '@/types/child'
import { getAgeGroup, AGE_GROUP_META } from '@/lib/curriculum.data'
import { AnimatedSun, DoodleCloud, DoodleStar } from '@/components/home/KidsDoodles'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function ProfilePage() {
  const router = useRouter()
  const { child, setChild, user, xp, lives, streak, completedLessons } = useAppStore()
  const { level, name: levelName } = getLevelFromXP(xp)
  const [loggingOut, setLoggingOut] = useState(false)
  const [childrenList, setChildrenList] = useState<Child[]>([])

  useEffect(() => {
    api.children
      .list()
      .then(res => {
        if (Array.isArray(res) && res.length > 0) {
          setChildrenList(res as unknown as Child[])
        } else if (child) {
          setChildrenList([child])
        }
      })
      .catch(() => {
        if (child) setChildrenList([child])
      })
  }, [child])

  // Hydrate active child profile & progress whenever active child ID changes
  useEffect(() => {
    if (!child?.id) return
    const childId = Number(child.id)
    api.profile
      .get(childId)
      .then(prof => {
        if (prof) {
          useAppStore.getState().hydrateProfile(prof)
        }
      })
      .catch(() => {})

    api.progress
      .list(childId)
      .then(progList => {
        if (Array.isArray(progList)) {
          const compMap: Record<number, any> = {}
          progList.forEach(p => {
            if (p.status === 'completed') {
              compMap[Number(p.lesson_id)] = {
                lessonId: Number(p.lesson_id),
                score: p.score ?? 100,
                xpEarned: p.xp_earned ?? 20,
                completedAt:
                  (p as unknown as { updated_at?: string; created_at?: string }).updated_at ||
                  (p as unknown as { updated_at?: string; created_at?: string }).created_at ||
                  new Date().toISOString(),
              }
            }
          })
          useAppStore.setState({ completedLessons: compMap })
        }
      })
      .catch(() => {})
  }, [child?.id])

  const handleLogout = () => {
    setLoggingOut(true)
    signOut(router)
  }

  const childAgeGroup = child ? getAgeGroup(child.age ?? 4) : '0-5'
  const ageMeta = AGE_GROUP_META[childAgeGroup]
  const totalCompletedLessons = Object.keys(completedLessons || {}).length

  // Dynamically compute weekly XP based on active child's stats & completed lessons
  const weeklyChartData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    if (xp === 0) {
      return days.map(day => ({ day, xp: 0 }))
    }

    const dayCounts: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 }
    const entries = Object.values(completedLessons || {})

    if (entries.length > 0) {
      entries.forEach(item => {
        if (item.completedAt) {
          const d = new Date(item.completedAt)
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
          if (dayCounts[dayName] !== undefined) {
            dayCounts[dayName] += item.xpEarned || 20
          }
        }
      })
    }

    const sumFromLessons = Object.values(dayCounts).reduce((a, b) => a + b, 0)
    if (sumFromLessons === 0 && xp > 0) {
      const todayIdx = (new Date().getDay() + 6) % 7 // Monday = 0
      const spread = Math.round(xp / 2)
      const prevDay = (todayIdx + 6) % 7
      days.forEach((day, idx) => {
        if (idx === todayIdx) dayCounts[day] = xp - spread
        else if (idx === prevDay) dayCounts[day] = spread
        else dayCounts[day] = 0
      })
    }

    return days.map(day => ({ day, xp: dayCounts[day] }))
  }, [completedLessons, xp])

  const weeklyTotalXP = useMemo(() => {
    return weeklyChartData.reduce((acc, curr) => acc + curr.xp, 0)
  }, [weeklyChartData])

  if (!child) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-white border-2 border-slate-200 border-b-4 border-slate-300 rounded-3xl p-8 shadow-sm max-w-sm mx-auto">
          <p className="text-slate-600 font-bold font-nunito mb-4">No child profile found.</p>
          <button
            onClick={() => router.push('/onboarding')}
            className="px-6 py-3 bg-[#10b981] hover:bg-[#059669] text-white font-black font-nunito rounded-2xl border-b-4 border-[#047857] shadow-sm cursor-pointer"
          >
            Set up profile
          </button>
        </div>
      </div>
    )
  }

  return (
    <PageWrapper size="lg">
      <div className="space-y-8">
        
        {/* ── 1. Child Profile Hero Header Card (Warm WonderLearn Aesthetic) ── */}
        <div className="relative bg-gradient-to-b from-[#e0f2fe]/80 via-[#f0f9ff]/50 to-white rounded-3xl border-2 border-sky-200 border-b-6 border-b-sky-300 p-6 sm:p-8 shadow-md overflow-hidden">
          {/* Playful floating sky doodles */}
          <AnimatedSun className="absolute -top-3 -right-3 w-24 sm:w-28 opacity-80 pointer-events-none anim-spin-slow" />
          <DoodleCloud className="absolute top-4 left-6 w-28 sm:w-36 opacity-60 pointer-events-none anim-float-h" delay={0} />
          <DoodleStar className="absolute bottom-4 right-1/4 w-6 h-6 opacity-40 pointer-events-none text-amber-400" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Child Avatar with 3D Ring */}
            <div className="relative flex-shrink-0">
              <Avatar
                seed={child.avatar_seed}
                name={child.name}
                size={104}
                className="border-4 border-amber-300 shadow-xl"
              />
              <span className="absolute -bottom-2 -right-1 text-2xl" title={ageMeta.label}>
                {ageMeta.emoji}
              </span>
            </div>

            {/* Profile Info & Micro Badges */}
            <div className="text-center sm:text-left flex-1 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-3xl sm:text-4xl font-black text-[#1d2445] font-nunito tracking-tight">
                      {child.name}
                    </h1>
                    <span className="text-xl" title="Bright Mind Explorer">✨</span>
                  </div>
                  <p className="text-slate-500 font-bold text-xs sm:text-sm font-nunito mt-0.5">
                    Ready for today&apos;s fun adventures &amp; discoveries!
                  </p>
                </div>

                {/* Age Stage Pill */}
                <div
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl border-2 border-b-4 font-black font-nunito text-xs shadow-xs self-center sm:self-auto"
                  style={{
                    backgroundColor: `${ageMeta.color}15`,
                    borderColor: `${ageMeta.color}40`,
                    borderBottomColor: ageMeta.color,
                    color: ageMeta.color,
                  }}
                >
                  <span>{ageMeta.emoji}</span>
                  <span>{ageMeta.label} Stage</span>
                  <span className="opacity-80 font-extrabold">· {child.age ?? 4} yrs</span>
                </div>
              </div>

              {/* Level & Milestone Tag */}
              <div>
                <span className="inline-flex items-center gap-1.5 bg-amber-100 border border-amber-300 text-amber-900 font-black text-xs px-3.5 py-1 rounded-full font-nunito shadow-xs">
                  <Trophy size={13} className="text-amber-600" />
                  <span>Level {level} · {levelName}</span>
                </span>
              </div>

              {/* Quick Gamification Chips */}
              <div className="flex flex-wrap items-center gap-2.5 justify-center sm:justify-start pt-1 font-nunito">
                <span className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-900 font-black text-xs px-3 py-1.5 rounded-xl shadow-xs">
                  <Star size={14} className="text-amber-500" fill="#f59e0b" /> {xp} XP
                </span>
                <span className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-900 font-black text-xs px-3 py-1.5 rounded-xl shadow-xs">
                  <Flame size={14} className="text-orange-500" fill="#f97316" /> {streak} day streak
                </span>
                <span className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-900 font-black text-xs px-3 py-1.5 rounded-xl shadow-xs">
                  <Heart size={14} className="text-rose-500" fill="#ef4444" /> {lives} lives
                </span>
                <span className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-900 font-black text-xs px-3 py-1.5 rounded-xl shadow-xs">
                  <BookOpen size={14} className="text-emerald-600" /> {totalCompletedLessons} lessons completed
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. PROMINENTLY HIGHLIGHTED FAMILY HUB FEATURE CARD ───────── */}
        <div className="relative bg-gradient-to-br from-[#f8f5ff] via-white to-[#f0ebff] rounded-3xl border-2 border-purple-300 border-b-6 border-b-purple-500 p-6 sm:p-8 shadow-xl overflow-hidden group">
          {/* Subtle decorative purple glow pattern */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-indigo-200/25 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20" />

          <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
            
            {/* Left Content Area */}
            <div className="space-y-4 max-w-2xl">
              {/* Badge row */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-700 text-white font-black text-xs uppercase tracking-wider shadow-sm">
                  <Users size={13} />
                  <span>Family Hub</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 border border-purple-200 text-purple-800 font-extrabold text-[11px]">
                  <ShieldCheck size={12} className="text-purple-600" />
                  <span>Parent Portal &amp; Controls</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[11px]">
                  <Sparkles size={11} className="text-amber-600" />
                  <span>Personalized</span>
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#1d2445] font-nunito tracking-tight flex items-center gap-2">
                  <span>Family Dashboard &amp; Learning Paths</span>
                </h2>
                <p className="text-slate-600 font-bold text-xs sm:text-sm font-nunito mt-1.5 leading-relaxed">
                  Manage all child profiles, customize age stages, adjust curriculum difficulty, monitor screen time, and explore weekly progress reports in one central hub.
                </p>
              </div>

              {/* Quick Feature Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="bg-white/80 border border-purple-100 rounded-2xl p-2.5 flex items-center gap-2.5 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 text-sm flex-shrink-0">
                    🎯
                  </div>
                  <div className="min-w-0">
                    <p className="text-[#1d2445] font-black text-xs font-nunito truncate">Learning Paths</p>
                    <p className="text-slate-500 font-bold text-[10px] font-nunito truncate">Reading &amp; Math levels</p>
                  </div>
                </div>

                <div className="bg-white/80 border border-purple-100 rounded-2xl p-2.5 flex items-center gap-2.5 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm flex-shrink-0">
                    📊
                  </div>
                  <div className="min-w-0">
                    <p className="text-[#1d2445] font-black text-xs font-nunito truncate">Progress Tracking</p>
                    <p className="text-slate-500 font-bold text-[10px] font-nunito truncate">Weekly stats &amp; mastery</p>
                  </div>
                </div>

                <div className="bg-white/80 border border-purple-100 rounded-2xl p-2.5 flex items-center gap-2.5 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 text-sm flex-shrink-0">
                    🛡️
                  </div>
                  <div className="min-w-0">
                    <p className="text-[#1d2445] font-black text-xs font-nunito truncate">Child Profiles</p>
                    <p className="text-slate-500 font-bold text-[10px] font-nunito truncate">{childrenList.length || 1} Enrolled in Family</p>
                  </div>
                </div>
              </div>

              {/* Children Quick Switcher Preview */}
              {childrenList.length > 0 && (
                <div className="pt-2 border-t border-purple-100 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-black uppercase text-purple-900 tracking-wider">
                    Child Profiles:
                  </span>
                  {childrenList.map(c => {
                    const isCurrent = Number(c.id) === Number(child.id)
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          if (!isCurrent) {
                            setChild(c)
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black font-nunito transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-purple-600 text-white shadow-xs scale-102'
                            : 'bg-white hover:bg-purple-50 text-purple-900 border border-purple-200'
                        }`}
                      >
                        <Avatar seed={c.avatar_seed} name={c.name} size={18} />
                        <span>{c.name}</span>
                        {isCurrent && <span className="text-[10px] bg-white/20 px-1 rounded">Active</span>}
                      </button>
                    )
                  })}
                  <Link
                    href="/parent"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-black font-nunito border border-purple-200 transition-colors"
                  >
                    <Plus size={12} />
                    <span>Manage / Add Child</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Right Action Callout Box */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-3 bg-white/90 rounded-2xl p-5 border-2 border-purple-200 shadow-md flex-shrink-0 lg:w-72 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md text-3xl">
                👨‍👩‍👧
              </div>

              <div>
                <p className="font-nunito font-black text-sm text-[#1d2445]">
                  Parental Command Center
                </p>
                <p className="font-nunito font-bold text-xs text-slate-500 mt-0.5">
                  Control all family settings &amp; reports
                </p>
              </div>

              {/* Big Standout CTA Button */}
              <Link
                href="/parent"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-black font-nunito text-sm border-b-4 border-[#5b21b6] shadow-lg transition-all transform active:translate-y-0.5 group-hover:scale-[1.02]"
              >
                <span>Enter Family Hub</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

          </div>
        </div>

        {/* ── 3. Level & XP Progress Bar ─────────────────────────────── */}
        <div>
          <XPBar />
        </div>

        {/* ── 4. XP This Week Chart Card ──────────────────────────────── */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 border-b-4 border-slate-300 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[#1d2445] font-black text-lg font-nunito">
                XP This Week
              </h2>
              <p className="text-slate-500 font-bold text-xs font-nunito">
                Keep up the daily momentum to unlock new badges!
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold font-nunito">
              <Star size={13} fill="#10b981" /> {weeklyTotalXP} XP Weekly Total
            </span>
          </div>

          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={weeklyChartData}>
              <XAxis
                dataKey="day"
                tick={{ fill: '#64748b', fontSize: 12, fontFamily: 'Nunito', fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '2px solid #e2e8f0',
                  borderRadius: 16,
                  fontFamily: 'Nunito',
                  fontWeight: 800,
                  fontSize: 12,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
                labelStyle={{ color: '#1d2445' }}
                itemStyle={{ color: '#10b981' }}
              />
              <Area
                type="monotone"
                dataKey="xp"
                stroke="#10b981"
                strokeWidth={3}
                fill="#10b981"
                fillOpacity={0.15}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── 5. 4 Core Tactile Stat Cards ────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
          {[
            { label: 'Level', value: level, sub: levelName, color: '#f59e0b', bg: 'bg-amber-50/70 border-amber-200 border-b-amber-300' },
            { label: 'Total XP', value: xp.toLocaleString(), sub: 'Points Earned', color: '#10b981', bg: 'bg-emerald-50/70 border-emerald-200 border-b-emerald-300' },
            { label: 'Streak', value: `${streak} days`, sub: 'Daily Habit', color: '#f97316', bg: 'bg-orange-50/70 border-orange-200 border-b-orange-300' },
            { label: 'Lives', value: `${lives}/5`, sub: 'Active Energy', color: '#ef4444', bg: 'bg-rose-50/70 border-rose-200 border-b-rose-300' },
          ].map(stat => (
            <div
              key={stat.label}
              className={`rounded-3xl border-2 border-b-4 p-4 text-center shadow-xs transition-transform hover:-translate-y-0.5 ${stat.bg}`}
            >
              <div
                className="text-2xl sm:text-3xl font-black font-nunito"
                style={{ color: stat.color }}
              >
                {stat.value}
              </div>
              <div className="text-slate-700 font-black text-xs uppercase tracking-wider font-nunito mt-1">
                {stat.label}
              </div>
              <div className="text-slate-400 font-extrabold text-[10px] font-nunito mt-0.5 truncate">
                {stat.sub}
              </div>
            </div>
          ))}
        </div>

        {/* ── 6. Account & Sign Out Footer ────────────────────────────── */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-slate-600 font-bold font-nunito text-xs">
              {user?.email ? (
                <>Signed in as <span className="font-black text-[#1d2445]">{user.email}</span>{user?.role === 'admin' && <span className="ml-2 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-extrabold text-[10px] uppercase">Admin</span>}</>
              ) : (
                'Signed in with Family Account'
              )}
            </p>
            <p className="text-slate-400 font-extrabold font-nunito text-[11px] mt-0.5">
              Bright Steps Learning Academy · Protected Session
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {user?.role === 'admin' && (
              <Link
                href="/admin"
                className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black font-nunito text-xs rounded-2xl border-2 border-purple-500 border-b-4 border-b-purple-900 shadow-md flex items-center justify-center gap-2 transition-all active:translate-y-0.5"
              >
                <Shield size={15} />
                <span>Admin Panel</span>
              </Link>
            )}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 font-black font-nunito text-xs rounded-2xl border-2 border-rose-200 border-b-4 border-b-rose-300 shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:translate-y-0.5"
            >
              <LogOut size={15} />
              <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        </div>

      </div>
    </PageWrapper>
  )
}
