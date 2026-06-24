'use client'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Star, PlayCircle, Clock, BookOpen, ChevronRight, ArrowLeft } from 'lucide-react'
import { useLesson } from '@/hooks/useLesson'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Spinner } from '@/components/ui/Spinner'
import { SubjectIcon, subjectColors } from '@/components/icons/SubjectIcon'
import type { SubjectSlug } from '@/types/lesson'

export default function LessonDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { lesson, activities, loading, error, load } = useLesson(id)
  const { child } = useAppStore()

  useEffect(() => { load() }, [load])

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size={40} /></div>
  if (!lesson) return <div className="text-center py-16 text-slate-400">Lesson not found.</div>

  const subjectSlug = (lesson as any).subject?.slug as SubjectSlug ?? 'math'
  const color = subjectColors[subjectSlug] ?? '#4ade80'

  return (
    <PageWrapper>
      <Link href="/lessons" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 font-nunito text-sm">
        <ArrowLeft size={16} /> Back to Lessons
      </Link>

      {/* Header */}
      <div className="bg-[#252b3b] rounded-3xl overflow-hidden border border-white/5 mb-6">
        <div className="h-3 w-full" style={{ backgroundColor: color }} />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <SubjectIcon slug={subjectSlug} size={18} />
                <span className="text-sm font-semibold font-nunito" style={{ color }}>
                  {(lesson as any).subject?.name}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-white font-nunito mb-2">{lesson.title}</h1>
              <p className="text-slate-300 font-nunito">{lesson.description}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <Badge color="gold" size="md">
              <Star size={12} fill="#eab308" /> {lesson.xp_reward} XP
            </Badge>
            <Badge color={lesson.difficulty === 'easy' ? 'green' : lesson.difficulty === 'medium' ? 'orange' : 'red'}>
              {lesson.difficulty}
            </Badge>
            <span className="flex items-center gap-1.5 text-slate-400 text-sm font-nunito">
              <BookOpen size={14} /> {lesson.activities_count} activities
            </span>
          </div>
        </div>
      </div>

      {/* Activities preview */}
      <h2 className="text-white font-extrabold text-lg font-nunito mb-4">What you will learn</h2>
      <div className="flex flex-col gap-2 mb-8">
        {activities.map((act, i) => (
          <motion.div
            key={act.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-3 bg-[#252b3b] rounded-xl px-4 py-3 border border-white/5"
          >
            <div className="w-7 h-7 rounded-full bg-[#4ade80]/20 flex items-center justify-center text-[#4ade80] font-bold text-xs font-nunito flex-shrink-0">
              {i + 1}
            </div>
            <div className="flex-1">
              <span className="text-slate-300 text-sm font-nunito capitalize">{act.type.replace('-', ' ')}</span>
            </div>
            <Badge color="gold" size="sm">+{act.xp_reward} XP</Badge>
          </motion.div>
        ))}
      </div>

      <Link href={`/lesson/${lesson.id}/play`}>
        <Button size="xl" fullWidth>
          <PlayCircle size={24} /> Start Lesson
        </Button>
      </Link>
    </PageWrapper>
  )
}
