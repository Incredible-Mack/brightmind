'use client'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, CheckCircle2, PlayCircle, BookOpen, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'
import type { Subject, LearningPath as PathData } from '@/lib/api'
import { LearningPath } from '@/components/lesson/LearningPath'
import { CourseAdventureMap } from '@/components/course/CourseAdventureMap'
import { ScallopRibbon } from '@/components/home/ScallopRibbon'
import { useAppStore } from '@/store/useAppStore'
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Spinner } from '@/components/ui/Spinner'
import { SubjectIcon, subjectColors } from '@/components/icons/SubjectIcon'
import type { Lesson, SubjectSlug } from '@/types/lesson'
import type { LessonProgress } from '@/lib/api'
import type { LearningProfile } from '@/types/child'

type LessonStatus = 'locked' | 'unlocked' | 'in_progress' | 'completed'

// â”€â”€ Profile-aware difficulty fit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Returns true when a lesson's difficulty matches the child's current level
// for that subject area.
function isFitForProfile(lesson: Lesson, subjectSlug: string, lp: LearningProfile): boolean {
  const d = lesson.difficulty
  if (subjectSlug === 'math') {
    if (lp.math === 'none')       return d === 'easy'
    if (lp.math === 'counting')   return d === 'easy' || d === 'medium'
    return true // arithmetic â†’ all
  }
  if (subjectSlug === 'english') {
    if (lp.reading === 'none')   return d === 'easy'
    if (lp.reading === 'basic')  return d === 'easy' || d === 'medium'
    return true // fluent â†’ all
  }
  // science / social-studies â€” no profile field, show all
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
            unlocked ? 'bg-emerald-50 border-2 border-emerald-400 border-b-4 border-emerald-600 hover:scale-105 shadow-sm' :
                       'bg-slate-100 border-2 border-slate-200 opacity-60 cursor-not-allowed'
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
          unlocked ? 'bg-white border-2 border-slate-200 hover:border-emerald-400 border-b-4 border-b-slate-300 shadow-sm' :
                     'bg-slate-50 border-2 border-slate-200 border-b-4 border-slate-300 opacity-60 cursor-not-allowed'
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
            {active ? 'â†© Continue' : 'â–¶ Start lesson'}
          </div>
        )}
        {done && (
          <div className="mt-3 text-xs font-nunito text-[#4ade80] font-bold">âœ“ Completed</div>
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
  const [path,     setPath]     = useState<PathData | null>(null)
  const [view,     setView]     = useState<'course' | 'path' | 'all'>('course')

  const lp = child?.learning_profile

  const load = useCallback(() => {
    const childId = child?.id ? Number(child.id) : null
    Promise.all([
      api.subjects.list(),
      api.lessons.list(),
      childId ? api.progress.list(childId) : Promise.resolve([]),
      childId ? api.path.get(childId).catch(() => null) : Promise.resolve(null),
    ]).then(([subs, less, prog, pathData]) => {
      setPath(pathData && pathData.subjects.length ? pathData : null)
      setSubjects(subs)
      setLessons(less as unknown as Lesson[])

      // Merge server progress with local completed lessons
      const stored = useAppStore.getState().completedLessons || {}
      const map = new Map<number, LessonProgress>()

      // Local progress
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

      // Server progress takes priority
      if (Array.isArray(prog)) {
        prog.forEach(p => map.set(Number(p.lesson_id), p))
      }

      setProgress(Array.from(map.values()))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [child?.id])

  useEffect(() => { load() }, [load])
  useRefetchOnFocus(load)

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

  // ── Full-Bleed Adventure World (No outer container!) ─────────────
  if (view === 'course') {
    return (
      <CourseAdventureMap
        lessons={lessons}
        progressMap={progressMap}
        onSelectLesson={id => router.push(`/lessons/${id}`)}
        view={view}
        onViewChange={setView}
        hasPath={Boolean(path)}
      />
    )
  }

  return (
    <div className="w-full flex flex-col">
      {/* ── Top Hero Header for Path / All views ───────────────────── */}
      <section className="bg-[#201c4d] text-white pt-8 pb-10 px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-[#171439]/90 border border-white/15 rounded-full px-4 py-1.5 text-xs font-black text-purple-200 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] animate-pulse" />
              <span>Learning Explorer</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Your Course <span className="text-[#facc15]">Journey</span> 🗺️
            </h1>
            <p className="text-purple-100 font-bold text-sm sm:text-base max-w-xl">
              Explore 4 seasonal worlds with interactive voice games, stories, and XP rewards!
            </p>
          </div>

          {/* View Switcher Pills */}
          <div className="flex gap-2 bg-[#171439]/90 border border-white/15 p-1.5 rounded-2xl shadow-md">
            {([
              ['course', '🗺️ Adventure Course'],
              ['path', '🌱 Skill Tree'],
              ['all', '📋 All Lessons'],
            ] as const).map(([v, label]) => {
              if (v === 'path' && !path) return null
              const active = view === v
              return (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-2 rounded-xl font-nunito text-xs sm:text-sm font-black transition-all ${
                    active
                      ? 'bg-[#facc15] text-[#201c4d] shadow-md scale-105'
                      : 'text-purple-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <ScallopRibbon topBg="#201c4d" bottomBg="#fffdf8" variant="scallop" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full">
      {lp && (
        <div className="mb-6 flex items-center gap-3 bg-purple-50 border border-purple-200/80 rounded-2xl px-4 py-3 shadow-sm">
          <span className="text-lg">
            {lp.style === 'video' ? '🎬' : lp.style === 'activity' ? '🎯' : '⚡'}
          </span>
          <div className="flex-1">
            <p className="text-purple-900 font-nunito font-extrabold text-sm">{child?.name}&apos;s learning path</p>
            <p className="text-slate-500 font-nunito text-xs">
              {currentSubjectSlug
                ? levelHint(currentSubjectSlug, lp) || `${completedCount}/${currentLessons.length} completed`
                : `${completedCount}/${currentLessons.length} completed · Lessons marked ✦ match ${child?.name}'s level`}
            </p>
          </div>
          <span className="text-purple-700 font-nunito text-xs font-black bg-purple-100 px-2.5 py-1 rounded-xl">
            {completedCount}/{currentLessons.length} done
          </span>
        </div>
      )}

      {path && view === 'path' ? (
        <LearningPath path={path} onOpenLesson={id => router.push(`/lessons/${id}`)} />
      ) : (
      <>

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
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
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
                    <h2 className="text-[#1d2445] font-nunito font-black text-lg">{sub.name}</h2>
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
      </>
      )}
      </div>
    </div>
  )
}
