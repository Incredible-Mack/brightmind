'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, CheckCircle2, PlayCircle, BookOpen, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'
import type { Subject } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Spinner } from '@/components/ui/Spinner'
import { SubjectIcon, subjectColors } from '@/components/icons/SubjectIcon'
import type { Lesson, SubjectSlug } from '@/types/lesson'
import type { LessonProgress } from '@/lib/api'
import type { LearningProfile } from '@/types/child'

type LessonStatus = 'locked' | 'unlocked' | 'in_progress' | 'completed'

// ── Profile-aware difficulty fit ──────────────────────────────────────────────
// Returns true when a lesson's difficulty matches the child's current level
// for that subject area.
function isFitForProfile(lesson: Lesson, subjectSlug: string, lp: LearningProfile): boolean {
  const d = lesson.difficulty
  if (subjectSlug === 'math') {
    if (lp.math === 'none')       return d === 'easy'
    if (lp.math === 'counting')   return d === 'easy' || d === 'medium'
    return true // arithmetic → all
  }
  if (subjectSlug === 'english') {
    if (lp.reading === 'none')   return d === 'easy'
    if (lp.reading === 'basic')  return d === 'easy' || d === 'medium'
    return true // fluent → all
  }
  // science / social-studies — no profile field, show all
  return true
}

// Human-readable level hint for the profile banner
function levelHint(subjectSlug: string, lp: LearningProfile): string {
  if (subjectSlug === 'math') {
    return lp.math === 'none' ? 'Starting with numbers' : lp.math === 'counting' ? 'Counting & addition' : 'Advanced maths'
  }
  if (subjectSlug === 'english') {
    return lp.reading === 'none' ? 'Learning letters' : lp.reading === 'basic' ? 'Building reading skills' : 'Fluent reading'
  }
  return ''
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

function LessonNode({
  lesson,
  status,
  isLast,
  fit,
  onStart,
}: {
  lesson: Lesson
  status: LessonStatus
  isLast: boolean
  fit: boolean
  onStart: () => void
}) {
  const locked   = status === 'locked'
  const done     = status === 'completed'
  const active   = status === 'in_progress'
  const unlocked = status === 'unlocked'

  const diffColor = {
    easy:   'text-green-400 bg-green-500/15',
    medium: 'text-yellow-400 bg-yellow-500/15',
    hard:   'text-red-400 bg-red-500/15',
  }[lesson.difficulty] ?? 'text-slate-400 bg-white/5'

  return (
    <div className="flex gap-4 items-start">
      {/* Left spine */}
      <div className="flex flex-col items-center">
        <button
          onClick={locked ? undefined : onStart}
          disabled={locked}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all flex-shrink-0 ${
            done     ? 'bg-[#4ade80] shadow-lg shadow-[#4ade80]/30' :
            active   ? 'bg-blue-500 shadow-lg shadow-blue-500/30 animate-pulse' :
            unlocked ? 'bg-[#252b3b] border-2 border-[#4ade80] hover:bg-[#4ade80]/20 hover:scale-110' :
                       'bg-[#1a1f2e] border border-white/10 opacity-40 cursor-not-allowed'
          }`}
        >
          {done    ? <CheckCircle2 size={20} className="text-[#0f1117]" /> :
           locked  ? <Lock size={18} className="text-slate-600" /> :
           active  ? <PlayCircle size={20} className="text-white" /> :
                     <BookOpen size={18} className="text-[#4ade80]" />}
        </button>
        {!isLast && (
          <div className={`w-0.5 h-8 mt-1 rounded-full ${done ? 'bg-[#4ade80]/60' : 'bg-white/10'}`} />
        )}
      </div>

      {/* Card */}
      <button
        onClick={locked ? undefined : onStart}
        disabled={locked}
        className={`flex-1 mb-8 text-left rounded-2xl border p-4 transition-all group ${
          done     ? 'bg-[#4ade80]/5 border-[#4ade80]/30 hover:border-[#4ade80]/60' :
          active   ? 'bg-blue-500/5 border-blue-500/40 hover:border-blue-500/70' :
          unlocked ? 'bg-[#1a1f2e] border-white/10 hover:border-[#4ade80]/40 hover:bg-[#4ade80]/5' :
                     'bg-[#1a1f2e]/50 border-white/5 opacity-50 cursor-not-allowed'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`font-nunito font-bold text-sm leading-tight ${locked ? 'text-slate-500' : 'text-white'}`}>
                {lesson.title}
              </p>
              {fit && !locked && !done && (
                <span className="flex items-center gap-0.5 text-[10px] font-nunito font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-full">
                  <Sparkles size={9} /> Recommended
                </span>
              )}
            </div>
            {lesson.description && (
              <p className="text-slate-500 font-nunito text-xs mt-1 line-clamp-2 hidden sm:block">
                {lesson.description}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className={`font-nunito font-bold text-[10px] px-2 py-0.5 rounded-full capitalize ${diffColor}`}>
              {lesson.difficulty}
            </span>
            <span className="text-slate-600 font-nunito text-[10px]">+{lesson.xp_reward} XP</span>
          </div>
        </div>
        {(active || unlocked) && (
          <div className={`mt-3 text-xs font-nunito font-bold flex items-center gap-1 ${active ? 'text-blue-400' : 'text-[#4ade80] group-hover:gap-2 transition-all'}`}>
            {active ? '↩ Continue' : '▶ Start lesson'}
          </div>
        )}
        {done && (
          <div className="mt-3 text-xs font-nunito text-[#4ade80] font-bold">✓ Completed</div>
        )}
      </button>
    </div>
  )
}

export default function LessonsPage() {
  const router = useRouter()
  const { child } = useAppStore()
  const [lessons,  setLessons]  = useState<Lesson[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [progress, setProgress] = useState<LessonProgress[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [loading,  setLoading]  = useState(true)

  const lp = child?.learning_profile

  useEffect(() => {
    const childId = child?.id ? Number(child.id) : null
    Promise.all([
      api.subjects.list(),
      api.lessons.list(),
      childId ? api.progress.list(childId) : Promise.resolve([]),
    ]).then(([subs, less, prog]) => {
      setSubjects(subs)
      setLessons(less as unknown as Lesson[])
      setProgress(prog as LessonProgress[])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [child?.id])

  const progressMap = new Map<number, LessonProgress>(
    progress.map(p => [Number(p.lesson_id), p])
  )

  const sorted = [...lessons].sort((a, b) => Number(a.order_index) - Number(b.order_index))
  const subjectLessons = (subjectId: number) => sorted.filter(l => Number(l.subject_id) === subjectId)
  const activeSubjects = subjects.filter(s => subjectLessons(Number(s.id)).length > 0)
  const displaySubject = selected ?? (activeSubjects[0] ? Number(activeSubjects[0].id) : null)
  const currentLessons = displaySubject ? subjectLessons(displaySubject) : sorted
  const completedCount = currentLessons.filter(l => progressMap.get(Number(l.id))?.status === 'completed').length

  // Subject slug for current view (used for profile hint)
  const currentSubjectSlug = activeSubjects.find(s => Number(s.id) === displaySubject)?.slug ?? ''

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size={40} /></div>

  return (
    <PageWrapper>
      {/* Profile banner */}
      {lp && (
        <div className="mb-5 flex items-center gap-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl px-4 py-3">
          <span className="text-lg">
            {lp.style === 'video' ? '🎬' : lp.style === 'activity' ? '🎯' : '⚡'}
          </span>
          <div className="flex-1">
            <p className="text-purple-300 font-nunito font-bold text-sm">{child?.name}&apos;s learning path</p>
            <p className="text-slate-500 font-nunito text-xs">
              {currentSubjectSlug
                ? levelHint(currentSubjectSlug, lp) || `${completedCount}/${currentLessons.length} completed`
                : `${completedCount}/${currentLessons.length} completed · Lessons marked ✦ match ${child?.name}'s level`}
            </p>
          </div>
          <span className="text-slate-600 font-nunito text-xs font-semibold bg-white/5 px-2 py-1 rounded-lg">
            {completedCount}/{currentLessons.length} done
          </span>
        </div>
      )}

      <h1 className="text-3xl font-extrabold text-white mb-5 font-nunito">Lessons</h1>

      {/* Subject tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelected(null)}
          className={`px-4 py-2 rounded-xl font-bold text-sm font-nunito transition-all border ${
            !selected ? 'bg-[#4ade80] text-[#1a1f2e] border-[#4ade80]' : 'bg-transparent border-white/20 text-slate-300 hover:border-white/40'
          }`}
        >
          All
        </button>
        {activeSubjects.map(sub => {
          const slug   = sub.slug as SubjectSlug
          const color  = subjectColors[slug] ?? '#4ade80'
          const active = displaySubject === Number(sub.id)
          const subDone  = subjectLessons(Number(sub.id)).filter(l => progressMap.get(Number(l.id))?.status === 'completed').length
          const subTotal = subjectLessons(Number(sub.id)).length
          return (
            <button
              key={sub.id}
              onClick={() => setSelected(active && selected !== null ? null : Number(sub.id))}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm font-nunito transition-all border ${
                active ? 'text-[#1a1f2e] border-transparent' : 'bg-transparent border-white/20 text-slate-300 hover:border-white/40'
              }`}
              style={active ? { backgroundColor: color, borderColor: color } : {}}
            >
              <SubjectIcon slug={slug} size={16} />
              {sub.name}
              <span className={`text-[10px] font-normal px-1.5 py-0.5 rounded-full ${active ? 'bg-black/20 text-inherit' : 'bg-white/10 text-slate-500'}`}>
                {subDone}/{subTotal}
              </span>
            </button>
          )
        })}
      </div>

      {/* Lesson path */}
      {displaySubject ? (
        <div className="max-w-lg">
          {currentLessons.map((lesson, i) => (
            <LessonNode
              key={lesson.id}
              lesson={lesson}
              status={statusForLesson(lesson, currentLessons, progressMap)}
              isLast={i === currentLessons.length - 1}
              fit={lp ? isFitForProfile(lesson, currentSubjectSlug, lp) : false}
              onStart={() => router.push(`/lessons/${lesson.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {activeSubjects.map(sub => {
            const subLessons = subjectLessons(Number(sub.id))
            const slug  = sub.slug as SubjectSlug
            const color = subjectColors[slug] ?? '#4ade80'
            const done  = subLessons.filter(l => progressMap.get(Number(l.id))?.status === 'completed').length
            const hint  = lp ? levelHint(sub.slug, lp) : ''
            return (
              <div key={sub.id}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}25` }}>
                    <SubjectIcon slug={slug} size={16} className="opacity-90" />
                  </div>
                  <div>
                    <h2 className="text-white font-nunito font-bold text-base">{sub.name}</h2>
                    <p className="text-slate-500 font-nunito text-xs">
                      {hint || `${done}/${subLessons.length} completed`}
                    </p>
                  </div>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full ml-2 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${subLessons.length ? (done / subLessons.length) * 100 : 0}%`, backgroundColor: color }} />
                  </div>
                </div>
                <div className="max-w-lg">
                  {subLessons.map((lesson, i) => (
                    <LessonNode
                      key={lesson.id}
                      lesson={lesson}
                      status={statusForLesson(lesson, subLessons, progressMap)}
                      isLast={i === subLessons.length - 1}
                      fit={lp ? isFitForProfile(lesson, sub.slug, lp) : false}
                      onStart={() => router.push(`/lessons/${lesson.id}`)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </PageWrapper>
  )
}
