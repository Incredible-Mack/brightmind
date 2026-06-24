import Link from 'next/link'
import { BookOpen, Mic, Trophy, Zap, Star, Shield, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Pip } from '@/components/mascot/Pip'

const features = [
  { icon: Mic,      color: '#4ade80', bg: '#4ade8015', title: 'Voice Learning',       desc: 'Speak your answers — AI grades your pronunciation in real time with gentle, encouraging feedback.' },
  { icon: Trophy,   color: '#eab308', bg: '#eab30815', title: 'Earn XP & Level Up',   desc: 'Collect stars, maintain streaks, and unlock achievements every single day.' },
  { icon: BookOpen, color: '#3b82f6', bg: '#3b82f615', title: '4 Core Subjects',      desc: 'Math, English, Science, and Social Studies — carefully crafted for every age.' },
  { icon: Zap,      color: '#a855f7', bg: '#a855f715', title: 'AI-Powered Teacher',   desc: 'Pip adapts to your child\'s pace and delivers smart hints when they get stuck.' },
  { icon: Star,     color: '#f97316', bg: '#f9731615', title: 'Video Lessons',         desc: 'Watch engaging, age-appropriate videos woven right into the lesson flow.' },
  { icon: Shield,   color: '#14b8a6', bg: '#14b8a615', title: 'Safe for Kids',         desc: 'Zero ads. No external links. Full parent dashboard included, always.' },
]

const stats = [
  { value: '39+',    label: 'Lessons' },
  { value: '4',      label: 'Subjects' },
  { value: 'Ages 0–14', label: 'Covered' },
  { value: '100%',   label: 'Free to Start' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col overflow-x-hidden">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="w-full px-8 py-6 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#4ade80] flex items-center justify-center">
            <Sparkles size={18} className="text-[#0f1117]" />
          </div>
          <span className="text-white font-extrabold text-xl tracking-tight">BrightMind</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Get Started</Button>
          </Link>
        </nav>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-20 pb-32 gap-10 overflow-hidden">
        {/* Background glow blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#4ade80]/6 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-[300px] h-[300px] bg-[#3b82f6]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-1/4 w-[250px] h-[250px] bg-[#a855f7]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Pip + speech bubble */}
        <div className="relative flex items-end gap-5 justify-center">
          <Pip size="xl" mood="excited" animate="idle" />
          <div className="relative bg-white rounded-3xl rounded-bl-sm px-7 py-4 shadow-2xl shadow-black/30 mb-10 max-w-[260px]">
            <p className="text-[#1a1f2e] font-bold font-nunito text-lg leading-snug">
              Hi! I&apos;m Pip,<br />your AI teacher! 🌟
            </p>
            {/* tail */}
            <div className="absolute -bottom-2 left-5 w-4 h-4 bg-white rotate-45 rounded-sm" />
          </div>
        </div>

        {/* Headline */}
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 bg-[#4ade80]/10 border border-[#4ade80]/20 rounded-full px-5 py-2 text-[#4ade80] font-nunito font-semibold text-sm">
            <Sparkles size={14} />
            AI-Powered Learning for Ages 0–14
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] tracking-tight">
            Learning is an<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4ade80] via-[#34d399] to-[#14b8a6]">
              adventure
            </span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl font-nunito max-w-xl mx-auto leading-relaxed">
            A gamified, AI-powered platform where children speak, play, earn XP, and level up — one lesson at a time.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <Link href="/register">
            <button className="flex items-center gap-2.5 bg-[#4ade80] hover:bg-[#22c55e] active:scale-95 text-[#0f1117] font-extrabold font-nunito text-base px-8 py-4 rounded-2xl transition-all shadow-lg shadow-green-500/20">
              Start Learning — It&apos;s Free
              <ArrowRight size={18} />
            </button>
          </Link>
          <Link href="/login">
            <button className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold font-nunito text-base px-8 py-4 rounded-2xl transition-all">
              I already have an account
            </button>
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-12 pt-6">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-extrabold text-white mb-1">{value}</div>
              <div className="text-slate-500 text-sm font-nunito">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature divider ────────────────────────────────────── */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* ── Features ───────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-[#0f1117]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <p className="text-[#4ade80] font-nunito font-semibold text-sm uppercase tracking-widest">What we offer</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              Everything a young learner needs
            </h2>
            <p className="text-slate-400 font-nunito text-lg max-w-xl mx-auto leading-relaxed">
              Built from the ground up for children — engaging, safe, and genuinely fun.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, color, bg, title, desc }) => (
              <div
                key={title}
                className="group bg-[#1a1f2e] rounded-3xl p-8 border border-white/5 hover:border-white/12 hover:bg-[#1e2436] transition-all duration-300"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: bg }}
                >
                  <Icon size={26} style={{ color }} />
                </div>
                <h3 className="text-white font-bold text-xl mb-3 font-nunito">{title}</h3>
                <p className="text-slate-400 text-sm font-nunito leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <section className="py-28 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-16">
          <div className="space-y-4">
            <p className="text-[#14b8a6] font-nunito font-semibold text-sm uppercase tracking-widest">How it works</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              Three steps to brilliance
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {[
              { step: '01', title: 'Create a Profile', desc: 'Set up your child\'s age and avatar in under a minute.' },
              { step: '02', title: 'Pick a Lesson',    desc: 'Choose from Math, English, Science, or Social Studies.' },
              { step: '03', title: 'Learn & Level Up', desc: 'Speak, tap, watch videos, and earn XP with every answer.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-[#4ade80]/10 border border-[#4ade80]/20 flex items-center justify-center">
                  <span className="text-[#4ade80] font-extrabold font-nunito text-lg">{step}</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-white font-bold text-xl font-nunito">{title}</h3>
                  <p className="text-slate-400 font-nunito text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────── */}
      <section className="py-8 px-6 pb-28">
        <div className="max-w-3xl mx-auto relative overflow-hidden bg-gradient-to-br from-[#1a2e1a] via-[#1a1f2e] to-[#1a1f2e] border border-[#4ade80]/15 rounded-3xl px-10 py-16 text-center">
          {/* glow */}
          <div className="absolute inset-0 bg-[#4ade80]/4 rounded-3xl" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#4ade80]/10 blur-3xl rounded-full" />

          <div className="relative space-y-6">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              Ready to start?
            </h2>
            <p className="text-slate-400 font-nunito text-lg max-w-md mx-auto leading-relaxed">
              Join thousands of families making learning an adventure — completely free to begin.
            </p>
            <Link href="/register">
              <button className="inline-flex items-center gap-2.5 bg-[#4ade80] hover:bg-[#22c55e] active:scale-95 text-[#0f1117] font-extrabold font-nunito text-base px-10 py-4 rounded-2xl transition-all shadow-lg shadow-green-500/25 mt-2">
                Create a Free Account
                <ArrowRight size={18} />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10 px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#4ade80] flex items-center justify-center">
              <Sparkles size={14} className="text-[#0f1117]" />
            </div>
            <span className="text-white font-bold font-nunito text-sm">BrightMind</span>
          </div>
          <p className="text-slate-600 text-sm font-nunito">Made with care for curious kids everywhere.</p>
          <div className="flex items-center gap-6">
            <Link href="/login"    className="text-slate-500 hover:text-slate-300 font-nunito text-sm transition-colors">Sign In</Link>
            <Link href="/register" className="text-slate-500 hover:text-slate-300 font-nunito text-sm transition-colors">Register</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
