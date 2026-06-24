'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookOpen, PlaySquare, Trophy, ChevronRight, Star, Users } from 'lucide-react'
import { api } from '@/lib/api'
import { getToken } from '@/lib/auth'
import { useAppStore } from '@/store/useAppStore'
import { XPBar } from '@/components/gamification/XPBar'
import { StreakCounter } from '@/components/gamification/StreakCounter'
import { LivesBar } from '@/components/lesson/LivesBar'
import { LessonCard } from '@/components/lesson/LessonCard'
import { Pip } from '@/components/mascot/Pip'
import { SpeechBubble } from '@/components/mascot/SpeechBubble'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Spinner } from '@/components/ui/Spinner'
import type { Lesson } from '@/types/lesson'

export default function DashboardPage() {
  const router = useRouter()
  const { child, xp, streak, setChild } = useAppStore()
  const [recentLessons, setRecentLessons]   = useState<Lesson[]>([])
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
          api.lessons.list({ limit: 4 }),
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
          // Re-check in background to know whether to show switcher
          api.children.list().then(list => setMultipleChildren(list.length > 1)).catch(() => {})
        }

        setRecentLessons(lessons as unknown as Lesson[])
      } catch {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [child, router, setChild])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size={40} />
    </div>
  )

  const pipText = streak > 0
    ? `${greeting}, ${child?.name}! ${streak} day streak — keep it up!`
    : `${greeting}, ${child?.name}! Ready to learn today?`

  return (
    <PageWrapper>
      <div className="flex items-end gap-4 mb-6">
        <Pip size="lg" mood={streak > 2 ? 'excited' : 'happy'} animate="idle" />
        <SpeechBubble text={pipText} />
      </div>

      {multipleChildren && (
        <Link href="/parent">
          <div className="flex items-center gap-3 mb-6 bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 rounded-2xl px-4 py-3 transition-colors group">
            <Users size={16} className="text-blue-400 flex-shrink-0" />
            <span className="text-blue-300 font-nunito font-semibold text-sm flex-1">
              Learning as <strong>{child?.name}</strong> — tap to switch child
            </span>
            <ChevronRight size={14} className="text-blue-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="sm:col-span-2">
          <XPBar />
        </div>
        <div className="flex sm:flex-col gap-3">
          <StreakCounter className="flex-1" />
          <div className="flex-1 bg-[#252b3b] rounded-2xl p-4 border border-white/5 flex items-center gap-3">
            <LivesBar />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { icon: BookOpen, label: 'Lessons', href: '/lessons', color: '#3b82f6' },
          { icon: PlaySquare, label: 'Videos', href: '/videos', color: '#a855f7' },
          { icon: Trophy, label: 'Achievements', href: '/achievements', color: '#eab308' },
        ].map(({ icon: Icon, label, href, color }) => (
          <Link key={href} href={href}>
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="bg-[#252b3b] rounded-2xl p-4 border border-white/5 hover:border-white/20 flex flex-col items-center gap-2 transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                <Icon size={22} style={{ color }} />
              </div>
              <span className="text-white text-sm font-bold font-nunito">{label}</span>
            </motion.div>
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-extrabold text-xl font-nunito">Continue Learning</h2>
        <Link href="/lessons" className="flex items-center gap-1 text-[#4ade80] text-sm font-bold font-nunito hover:underline">
          See all <ChevronRight size={16} />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {recentLessons.length === 0 ? (
          <div className="col-span-2 text-center py-12">
            <Star size={40} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-nunito">No lessons yet — check back soon!</p>
          </div>
        ) : (
          recentLessons.map((lesson, i) => (
            <LessonCard key={lesson.id} lesson={lesson} index={i} />
          ))
        )}
      </div>
    </PageWrapper>
  )
}
