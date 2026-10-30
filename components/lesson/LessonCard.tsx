'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Star, Lock, CheckCircle, BookOpen } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { Lesson } from '@/types/lesson'
import type { LessonProgress } from '@/types/lesson'
import { subjectColors } from '@/components/icons/SubjectIcon'

interface LessonCardProps {
  lesson: Lesson
  progress?: LessonProgress
  index?: number
}

export function LessonCard({ lesson, progress, index = 0 }: LessonCardProps) {
  const isCompleted = progress?.status === 'completed'
  const isInProgress = progress?.status === 'in_progress'
  const subjectSlug = (lesson as any).subject?.slug ?? 'math'
  const color = (subjectColors as any)[subjectSlug] ?? '#4ade80'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link href={`/lessons/${lesson.id}`}>
        <div className="bg-white rounded-3xl border-2 border-slate-200 border-b-[5px] border-b-slate-300 shadow-sm hover:shadow-lg hover:border-purple-300 hover:border-b-purple-400 transition-all hover:-translate-y-1 overflow-hidden group">
          <div className="h-2.5 w-full" style={{ backgroundColor: color }} />
          <div className="p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <h3 className="text-slate-900 font-black text-lg font-nunito leading-snug group-hover:text-purple-700 transition-colors">
                  {lesson.title}
                </h3>
                <p className="text-slate-600 font-bold text-sm font-nunito mt-1 line-clamp-2">{lesson.description}</p>
              </div>
              <div className="flex-shrink-0">
                {isCompleted
                  ? <CheckCircle size={24} className="text-[#22c55e]" fill="#22c55e" />
                  : isInProgress
                  ? <div className="w-5 h-5 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />
                  : <BookOpen size={22} className="text-slate-400 group-hover:text-purple-600 transition-colors" />
                }
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge color="gold" size="sm">
                <Star size={11} fill="#eab308" />
                {lesson.xp_reward} XP
              </Badge>
              <Badge
                color={lesson.difficulty === 'easy' ? 'green' : lesson.difficulty === 'medium' ? 'orange' : 'red'}
                size="sm"
              >
                {lesson.difficulty}
              </Badge>
              {lesson.activities_count != null && (
                <span className="text-slate-500 font-bold text-xs font-nunito">{lesson.activities_count} activities</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
