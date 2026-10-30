'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { X, CheckCircle2, XCircle, ChevronRight, Volume2 } from 'lucide-react'
import confetti from 'canvas-confetti'
import { api } from '@/lib/api'
import type { CheckpointSet, CheckpointResult } from '@/lib/api'

type CheckpointItem = any
import { useAppStore } from '@/store/useAppStore'
import { useVoiceTeacher } from '@/hooks/useVoiceTeacher'
import { Pip } from '@/components/mascot/Pip'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Spinner } from '@/components/ui/Spinner'
import { ActivityImage } from '@/components/lesson/ActivityImage'
import { MatchActivity } from '@/components/lesson/MatchActivity'

function questionText(item?: CheckpointItem): string {
  if (!item) return ''
  const c = item.content as Record<string, unknown>
  return String(c.question ?? c.prompt ?? '')
}

function stripEmoji(text: string): string {
  return text.replace(/[^\w\s.,?!'-]/g, '').trim()
}

function activityImage(c: Record<string, unknown>): string | undefined {
  return (c.image ?? c.image_url) as string | undefined
}

function normalizeTapOptions(c: Record<string, unknown>): Array<{ id: string; text: string; correct: boolean }> {
  if (Array.isArray(c.options)) {
    return c.options.map((o: unknown, idx: number) => {
      if (typeof o === 'string') return { id: String(idx), text: o, correct: o === c.correct_answer }
      const obj = o as Record<string, unknown>
      return { id: String(obj.id ?? idx), text: String(obj.text ?? obj.label ?? ''), correct: Boolean(obj.correct) }
    })
  }
  return []
}

function optionImages(c: Record<string, unknown>): Record<string, string> {
  return (c.option_images ?? {}) as Record<string, string>
}

function expectedAnswer(item?: CheckpointItem): string {
  if (!item) return ''
  const c = item.content as Record<string, unknown>
  return String(c.correct_answer ?? c.answer ?? '')
}

export default function CheckpointPage() {
  const { skill } = useParams<{ skill: string }>()
  const slug = decodeURIComponent(skill)
  const router = useRouter()
  const child = useAppStore(s => s.child)
  const hydrateProfile = useAppStore(s => s.hydrateProfile)
  const childId = child?.id ? Number(child.id) : null
  const { speak, stop } = useVoiceTeacher()

  const [set, setSet] = useState<CheckpointSet | null>(null)
  const [error, setError] = useState('')
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [typed, setTyped] = useState('')
  const [feedback, setFeedback] = useState<{ correct: boolean; answer: string } | null>(null)
  const [answers, setAnswers] = useState<Array<{ activity_id: number; correct: boolean }>>([])
  const [result, setResult] = useState<CheckpointResult | null>(null)
  const [saving, setSaving] = useState(false)
  const submittedRef = useRef(false)

  useEffect(() => {
    if (childId) {
      api.checkpoint.get(slug, childId).then(setSet).catch(e => setError(e.message))
    }
  }, [slug, childId])

  const items = set?.items ?? []
  const current = items[index]
  const young = (child?.age ?? 7) <= 8

  useEffect(() => {
    if (started && current && young) {
      speak(questionText(current)).catch(() => {})
      return () => stop()
    }
  }, [started, index, young, current, speak, stop])

  const finish = useCallback(async (allAnswers: Array<{ activity_id: number; correct: boolean }>) => {
    if (!childId || submittedRef.current) return
    submittedRef.current = true
    setSaving(true)
    try {
      const res = await api.checkpoint.submit(childId, slug, allAnswers)
      setResult(res)
      if (res.profile) hydrateProfile(res.profile)
      if (res.passed) {
        confetti({
          particleCount: 180,
          spread: 110,
          origin: { y: 0.5 },
          colors: ['#10b981', '#facc15', '#38bdf8', '#a855f7'],
        })
      }
    } catch (e: any) {
      submittedRef.current = false
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }, [childId, slug, hydrateProfile])

  const answer = (correct: boolean) => {
    if (!current || feedback) return
    setFeedback({ correct, answer: expectedAnswer(current) })
    setAnswers(prev => [...prev, { activity_id: Number(current.id), correct }])
  }

  const next = () => {
    setFeedback(null)
    setPicked(null)
    setTyped('')
    if (index + 1 >= items.length) finish(answers)
    else setIndex(i => i + 1)
  }

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-[#fffdf8] flex flex-col font-nunito selection:bg-amber-300 selection:text-slate-900">
      <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-200 bg-white shadow-xs">
        <button
          onClick={() => router.push('/lessons')}
          className="p-2 rounded-2xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <X size={20} />
        </button>
        <div className="flex-1">
          {started && !result && (
            <ProgressBar value={(index / Math.max(1, items.length)) * 100} max={100} color="#10b981" height={8} />
          )}
        </div>
        <span className="text-purple-700 bg-purple-100 border border-purple-200 px-3 py-1 rounded-full font-black text-xs uppercase tracking-wider">
          Checkpoint
        </span>
      </div>
      <div className="flex-1 flex flex-col items-center px-6 py-10 max-w-xl mx-auto w-full">{children}</div>
    </div>
  )

  if (!childId) return shell(<p className="text-slate-600 font-bold">Choose a child first.</p>)
  if (error && !result) {
    return shell(
      <div className="text-center mt-10 bg-white border-2 border-slate-200 border-b-4 border-slate-300 rounded-3xl p-8 shadow-sm">
        <Pip size="lg" mood="thinking" animate="idle" />
        <p className="text-[#1d2445] font-black text-xl mt-4 mb-2">Not quite yet</p>
        <p className="text-slate-600 font-bold text-sm mb-6 max-w-sm mx-auto">{error}</p>
        <Button onClick={() => router.push('/lessons')}>Back to Adventure Map</Button>
      </div>
    )
  }
  if (!set) return <div className="min-h-screen bg-[#fffdf8] flex items-center justify-center"><Spinner size={40} color="#10b981" /></div>

  if (result) {
    const missed = items.filter(i => result.missed.includes(Number(i.id)))
    return shell(
      <div className="w-full text-center bg-white border-2 border-slate-200 border-b-4 border-slate-300 rounded-3xl p-8 shadow-sm">
        <Pip size="xl" mood={result.passed ? 'excited' : 'happy'} animate={result.passed ? 'correct' : 'idle'} />
        <h1 className="text-3xl font-black text-[#1d2445] mt-5 mb-1">
          {result.passed ? 'You know it! 🎉' : 'Almost there!'}
        </h1>
        <p className="text-slate-600 font-bold mb-1">{set.skill.name}</p>
        <p className={`text-5xl font-black my-4 ${result.passed ? 'text-[#10b981]' : 'text-amber-500'}`}>
          {result.correct} / {result.total}
        </p>
        <p className="text-slate-600 font-bold text-sm mb-6 max-w-sm mx-auto">
          {result.passed
            ? `You passed with ${result.percent}%. This skill is verified${result.bonus_xp ? ` and you earned +${result.bonus_xp} XP!` : '.'}`
            : `You need ${result.pass_mark}% to pass. Practise a little more, then try again. You can do it!`}
        </p>
        {missed.length > 0 && (
          <div className="text-left bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6">
            <p className="text-[#1d2445] font-black text-sm mb-3">
              {result.passed ? 'Worth a second look' : 'Let\'s learn from these'}
            </p>
            <div className="space-y-3">
              {missed.map(m => (
                <div key={String(m.id)} className="text-sm">
                  <p className="text-slate-700 font-bold">{questionText(m)}</p>
                  <p className="text-[#047857] font-black">Answer: {expectedAnswer(m)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-3 justify-center flex-wrap">
          <Button size="lg" onClick={() => router.push('/lessons')}>Back to Adventure Map</Button>
          <Button variant="secondary" size="lg" onClick={() => router.push('/dashboard')}>Go Home</Button>
        </div>
      </div>
    )
  }

  if (saving) return shell(<div className="mt-24"><Spinner size={40} color="#10b981" /></div>)

  if (!started) {
    return shell(
      <div className="text-center mt-4 w-full bg-white border-2 border-slate-200 border-b-4 border-slate-300 rounded-3xl p-8 shadow-sm">
        <Pip size="xl" mood="excited" animate="idle" />
        <h1 className="text-3xl font-black text-[#1d2445] mt-5 mb-2">Show what you know!</h1>
        <p className="text-slate-600 font-bold text-base mb-2">{set.skill.name}</p>
        <ul className="text-slate-600 font-bold text-sm space-y-2 my-6 max-w-xs mx-auto text-left">
          <li>• {items.length} questions, one try each</li>
          <li>• No hints this time</li>
          <li>• Get {Math.ceil(items.length * set.pass_mark / 100)} right to pass</li>
          <li>• You will not lose any hearts</li>
        </ul>
        {set.already_passed && (
          <p className="text-purple-700 font-bold text-sm mb-4">
            You already passed this one (best {set.best}%). This is a refresher!
          </p>
        )}
        <Button size="xl" onClick={() => setStarted(true)}>
          Start Challenge <ChevronRight size={22} />
        </Button>
      </div>
    )
  }

  if (!current) return shell(<Spinner size={36} color="#10b981" />)
  const c = current.content as unknown as Record<string, unknown>

  return shell(
    <motion.div key={String(current.id)} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col items-center gap-6">
      <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">
        Question {index + 1} of {items.length}
      </p>
      {activityImage(c) && <ActivityImage path={activityImage(c)!} />}
      {current.type !== 'drag_drop' && (
        <div className="flex items-start gap-3 w-full justify-center">
          <p className="text-[#1d2445] font-black text-2xl text-center">
            {activityImage(c) ? stripEmoji(questionText(current)) : questionText(current)}
          </p>
          {young && (
            <button
              onClick={() => speak(questionText(current)).catch(() => {})}
              className="p-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 flex-shrink-0"
              aria-label="Read aloud"
            >
              <Volume2 size={20} />
            </button>
          )}
        </div>
      )}

      {current.type === 'tap_answer' && (
        <div className="grid grid-cols-2 gap-3 w-full">
          {normalizeTapOptions(c).map(o => {
            const chosen = picked === o.id
            const show = !!feedback
            return (
              <motion.button
                key={o.id}
                whileTap={{ scale: 0.97 }}
                disabled={show}
                onClick={() => { setPicked(o.id); answer(o.correct) }}
                className={`p-5 rounded-2xl border-2 font-black text-lg min-h-[88px] transition-all flex flex-col items-center justify-center gap-2 ${
                  show && o.correct
                    ? 'border-[#10b981] bg-emerald-50 text-[#047857]'
                    : show && chosen
                    ? 'border-rose-400 bg-rose-50 text-rose-700'
                    : 'border-slate-200 border-b-4 border-slate-300 bg-white hover:bg-slate-50 text-[#1d2445] shadow-xs'
                }`}
              >
                {optionImages(c)[o.text] && <ActivityImage path={optionImages(c)[o.text]} alt={o.text} size="md" />}
                <span>{o.text}</span>
              </motion.button>
            )
          })}
        </div>
      )}

      {current.type === 'type_answer' && (
        <>
          <input
            autoFocus
            value={typed}
            disabled={!!feedback}
            onChange={e => setTyped(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && typed.trim() && answer(typed.trim().toLowerCase() === expectedAnswer(current).toLowerCase())}
            placeholder="Type your answer..."
            className="w-full bg-white border-2 border-slate-200 border-b-4 border-slate-300 focus:border-[#10b981] rounded-2xl px-5 py-4 text-[#1d2445] text-xl font-black outline-none shadow-xs"
          />
          {!feedback && (
            <Button
              fullWidth
              size="lg"
              disabled={!typed.trim()}
              onClick={() => answer(typed.trim().toLowerCase() === expectedAnswer(current).toLowerCase())}
            >
              Check Answer
            </Button>
          )}
        </>
      )}

      {current.type === 'drag_drop' && (
        <MatchActivity
          prompt={String(c.prompt ?? '')}
          pairs={(c.pairs ?? []) as Array<{ id: string; item: string; target: string }>}
          disabled={!!feedback}
          onComplete={ok => answer(ok)}
        />
      )}

      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full rounded-2xl p-5 border-2 ${
            feedback.correct
              ? 'bg-emerald-50 border-emerald-300 text-[#047857]'
              : 'bg-rose-50 border-rose-300 text-rose-700'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            {feedback.correct ? <CheckCircle2 size={22} className="text-[#10b981]" /> : <XCircle size={22} className="text-rose-500" />}
            <p className="font-black text-lg">
              {feedback.correct ? 'Correct! 🎉' : 'Not this time'}
            </p>
          </div>
          {!feedback.correct && feedback.answer && (
            <p className="text-slate-600 font-bold text-sm mt-1">
              The correct answer is: {feedback.answer}
            </p>
          )}
          <Button className="mt-4" fullWidth size="lg" onClick={next}>
            {index + 1 >= items.length ? 'See my result' : 'Next Question'} <ChevronRight size={20} />
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}
