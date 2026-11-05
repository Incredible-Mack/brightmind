'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Mic,
  Trophy,
  BookOpen,
  Zap,
  Star,
  Shield,
  ArrowRight,
  Sparkles,
  Play,
} from 'lucide-react'
import { Pip } from '@/components/mascot/Pip'
import { ScallopRibbon } from '@/components/home/ScallopRibbon'

const features = [
  {
    icon: Mic,
    color: '#10b981',
    cardBg: 'bg-[#ecfdf5]',
    cardBorder: 'border-[#10b981] border-b-[#059669]',
    buttonBg: 'bg-[#10b981] hover:bg-[#059669]',
    badgeBg: 'bg-[#10b981]/15 text-[#065f46] border-[#10b981]/30',
    badgeText: '🎙️ Live Speech AI',
    titleColor: 'text-[#064e3b]',
    descColor: 'text-[#065f46]',
    title: 'Voice Learning',
    desc: 'Speak your answers — AI grades your pronunciation in real time with gentle, encouraging feedback.',
    microAccent: 'ılılıl Real-time pronunciation grading',
    actionText: 'Try Voice Practice',
    actionHref: '/lessons',
  },
  {
    icon: Trophy,
    color: '#eab308',
    cardBg: 'bg-[#fefce8]',
    cardBorder: 'border-[#eab308] border-b-[#ca8a04]',
    buttonBg: 'bg-[#eab308] hover:bg-[#ca8a04]',
    badgeBg: 'bg-[#eab308]/20 text-[#854d0e] border-[#eab308]/40',
    badgeText: '⭐ +20 XP Daily',
    titleColor: 'text-[#713f12]',
    descColor: 'text-[#854d0e]',
    title: 'Earn XP & Level Up',
    desc: 'Collect stars, maintain streaks, and unlock achievements every single day.',
    microAccent: '🔥 Streaks, medals & surprise gifts',
    actionText: 'Collect Rewards',
    actionHref: '/lessons',
  },
  {
    icon: BookOpen,
    color: '#3b82f6',
    cardBg: 'bg-[#eff6ff]',
    cardBorder: 'border-[#3b82f6] border-b-[#1d4ed8]',
    buttonBg: 'bg-[#3b82f6] hover:bg-[#1d4ed8]',
    badgeBg: 'bg-[#3b82f6]/15 text-[#1e40af] border-[#3b82f6]/30',
    badgeText: '📚 4 Core Subjects',
    titleColor: 'text-[#1e3a8a]',
    descColor: 'text-[#1e40af]',
    title: '4 Core Subjects',
    desc: 'Math, English, Science, and Social Studies — carefully crafted for every age.',
    microAccent: '📐 Math • 📖 English • 🔬 Science • 🌍 Social',
    actionText: 'Explore Subjects',
    actionHref: '/lessons',
  },
  {
    icon: Zap,
    color: '#8b5cf6',
    cardBg: 'bg-[#faf5ff]',
    cardBorder: 'border-[#8b5cf6] border-b-[#6d28d9]',
    buttonBg: 'bg-[#8b5cf6] hover:bg-[#6d28d9]',
    badgeBg: 'bg-[#8b5cf6]/15 text-[#5b21b6] border-[#8b5cf6]/30',
    badgeText: '🤖 Pip AI Coach',
    titleColor: 'text-[#4c1d95]',
    descColor: 'text-[#5b21b6]',
    title: 'AI-Powered Teacher',
    desc: "Pip adapts to your child's pace and delivers smart hints when they get stuck.",
    microAccent: '💡 Instant gentle hints when stuck',
    actionText: 'Meet Pip',
    actionHref: '/lessons',
  },
  {
    icon: Star,
    color: '#f97316',
    cardBg: 'bg-[#fff7ed]',
    cardBorder: 'border-[#f97316] border-b-[#c2410c]',
    buttonBg: 'bg-[#f97316] hover:bg-[#c2410c]',
    badgeBg: 'bg-[#f97316]/15 text-[#9a3412] border-[#f97316]/30',
    badgeText: '🎬 Video Lessons',
    titleColor: 'text-[#7c2d12]',
    descColor: 'text-[#9a3412]',
    title: 'Video Lessons',
    desc: 'Watch engaging, age-appropriate videos woven right into the lesson flow.',
    microAccent: '▶️ Animated short lessons & songs',
    actionText: 'Watch Previews',
    actionHref: '/videos',
  },
  {
    icon: Shield,
    color: '#14b8a6',
    cardBg: 'bg-[#f0fdfa]',
    cardBorder: 'border-[#14b8a6] border-b-[#0f766e]',
    buttonBg: 'bg-[#14b8a6] hover:bg-[#0f766e]',
    badgeBg: 'bg-[#14b8a6]/15 text-[#115e59] border-[#14b8a6]/30',
    badgeText: '🔒 100% Kid-Safe',
    titleColor: 'text-[#134e4a]',
    descColor: 'text-[#115e59]',
    title: 'Safe for Kids',
    desc: 'Zero ads. No external links. Full parent dashboard included, always.',
    microAccent: '🛡️ Zero ads • No tracking • Parent lock',
    actionText: 'Parent Controls',
    actionHref: '/parent',
  },
]

const stats = [
  { value: '39+', label: 'Lessons' },
  { value: '4', label: 'Subjects' },
  { value: 'Ages 0–14', label: 'Covered' },
  { value: '100%', label: 'Free to Start' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#24225a] flex flex-col overflow-x-hidden font-nunito selection:bg-amber-300 selection:text-slate-900">
      
      {/* ── Solid Navy-Purple Header ─────────────────────────────────── */}
      <header className="bg-[#24225a] text-white w-full border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          
          {/* Logo in Candy Pink Pill Badge */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-[#f43f5e] hover:bg-[#e11d48] px-4 py-2 rounded-2xl flex items-center gap-2 shadow-md shadow-pink-950/40 transition-transform group-hover:scale-105 border-2 border-white/20">
              <Sparkles size={18} className="text-white" />
              <span className="font-black text-xl tracking-tight text-white">Bright Steps</span>
            </div>
          </Link>

          {/* Nav with Golden Pill & Links */}
          <nav className="hidden md:flex items-center gap-2">
            <Link
              href="/"
              className="bg-[#facc15] hover:bg-[#eab308] text-[#24225a] font-black text-sm px-5 py-2 rounded-xl shadow-sm transition-all"
            >
              Home
            </Link>
            <Link
              href="/lessons"
              className="text-white hover:text-amber-300 font-extrabold text-sm px-3.5 py-2 transition-colors flex items-center gap-1.5"
            >
              <BookOpen size={16} />
              <span>Courses</span>
            </Link>
            <Link
              href="/videos"
              className="text-white hover:text-amber-300 font-extrabold text-sm px-3.5 py-2 transition-colors flex items-center gap-1.5"
            >
              <Play size={16} />
              <span>Videos</span>
            </Link>
            <Link
              href="/parent"
              className="text-white hover:text-amber-300 font-extrabold text-sm px-3.5 py-2 transition-colors flex items-center gap-1.5"
            >
              <Shield size={16} />
              <span>For Parents</span>
            </Link>
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/demo"
              className="bg-[#22c55e]/20 border border-[#22c55e]/50 hover:bg-[#22c55e]/30 text-[#4ade80] font-black text-xs sm:text-sm px-3.5 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              <Sparkles size={14} />
              <span>Try Demo</span>
            </Link>
            <Link
              href="/login"
              className="text-white hover:text-amber-300 font-black text-sm px-3 py-2 transition-colors"
            >
              Sign In
            </Link>
            <Link href="/register">
              <button className="bg-[#facc15] hover:bg-[#eab308] text-[#24225a] font-black text-sm px-5 py-2.5 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Full-Bleed Landscape Hero (From KidsFM(6).html reference) ── */}
      <section className="relative bg-[#201c4d] text-white pt-6 sm:pt-12 overflow-hidden">
        
        {/* Soft Stylized Purple Cloud Puffs in Sky (Matching reference placement) */}
        <div className="absolute top-8 left-8 sm:left-14 w-32 sm:w-44 h-16 sm:h-20 bg-[#2e2968] rounded-full pointer-events-none opacity-80" />
        <div className="absolute top-4 right-10 sm:right-24 w-40 sm:w-56 h-20 sm:h-24 bg-[#2e2968] rounded-full pointer-events-none opacity-80" />
        <div className="absolute top-24 right-1/3 w-28 h-14 bg-[#2e2968] rounded-full pointer-events-none opacity-60 hidden sm:block" />

        <div className="max-w-7xl mx-auto px-6 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left pt-2 pb-6 lg:pb-16">
              
              {/* Online Status Pill (Like '● The radio is off' in reference) */}
              <div className="inline-flex items-center gap-2 bg-[#171439]/95 border border-white/15 rounded-full px-4 py-1.5 text-xs font-black text-purple-200 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] animate-pulse shadow-[0_0_8px_#22c55e]" />
                <span>AI Voice Teacher Online</span>
              </div>

              {/* Exact Original Heading with Golden Accent */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.06] tracking-tight">
                Learning is an<br />
                <span className="text-[#facc15] drop-shadow-sm">adventure</span>
              </h1>

              {/* Exact Original Paragraph Copy */}
              <p className="text-purple-100/90 text-lg sm:text-xl font-bold font-nunito max-w-xl mx-auto lg:mx-0 leading-relaxed">
                A gamified, AI-powered platform where children speak, play, earn XP, and level up — one lesson at a time.
              </p>

              {/* Live Lesson Subtitle (Like 'Story Time with Aunty Ruth' in KidsFM) */}
              <div className="text-sm font-extrabold text-amber-300 flex items-center justify-center lg:justify-start gap-2">
                <span>🌟 Next up:</span>
                <span className="text-white">Numbers & Phonics Adventure with Pip</span>
              </div>

              {/* Candy Action Buttons (Pill Green, Yellow & Glass) */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link href="/demo">
                  <button className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-[#22c55e] hover:bg-[#16a34a] text-white font-black text-base px-8 py-4 rounded-full shadow-lg shadow-green-950/40 transition-all hover:scale-105 active:scale-95 border-2 border-white/20 border-b-4 border-b-[#15803d]">
                    <Play size={18} fill="white" />
                    <span>Try Free Demo — No Sign-In</span>
                  </button>
                </Link>
                <Link href="/register">
                  <button className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-[#facc15] hover:bg-[#eab308] text-[#24225a] font-black text-base px-8 py-4 rounded-full shadow-lg shadow-amber-950/30 transition-all hover:scale-105 active:scale-95">
                    <span>Create Free Account</span>
                  </button>
                </Link>
                <Link href="/login">
                  <button className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-white/10 hover:bg-white/20 border-2 border-white/25 text-white font-black text-sm px-6 py-4 rounded-full transition-all hover:scale-105 active:scale-95">
                    <span>Sign In</span>
                  </button>
                </Link>
              </div>

            </div>

            {/* Right Column: Pip Standing Directly ON the Green Meadow */}
            <div className="lg:col-span-5 flex flex-col items-center justify-end relative z-20 pb-0 lg:-mb-10">
              
              {/* Speech Bubble pointing down to Pip */}
              <div className="bg-white text-slate-900 rounded-3xl px-5 py-3.5 shadow-2xl max-w-[260px] mb-3 relative z-30 border-2 border-slate-100">
                <p className="font-nunito font-black text-sm leading-snug text-center text-slate-800">
                  Hi! I&apos;m Pip, your AI teacher! 🌟 Tap <span className="text-[#15803d] font-black underline">Try Free Demo</span> to start!
                </p>
                {/* Speech tail pointing down */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r border-b border-slate-100" />
              </div>

              {/* Pip Mascot Character */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="relative z-20 flex justify-center"
              >
                <Pip size="2xl" mood="excited" animate="idle" />
              </motion.div>

            </div>

          </div>
        </div>

        {/* ── Full-Width Undulating Rolling Green Hills SVG ───────────── */}
        <div className="w-full leading-none relative z-10 -mt-16 sm:-mt-24 lg:-mt-28">
          <svg
            viewBox="0 0 1440 220"
            preserveAspectRatio="none"
            className="w-full h-36 sm:h-48 lg:h-56 block"
          >
            {/* Back Rolling Forest Green Hill */}
            <path
              d="M 0 100 
                 Q 360 30 780 75 
                 T 1440 50 
                 L 1440 220 
                 L 0 220 
                 Z"
              fill="#1e6b37"
            />
            {/* Stylized Lollipop Tree on Back Hill Left */}
            <rect x="180" y="65" width="10" height="20" rx="2" fill="#144a24" />
            <circle cx="185" cy="55" r="20" fill="#144a24" />

            {/* Second Cute Little Bush/Tree on Back Hill */}
            <circle cx="1280" cy="48" r="14" fill="#144a24" />

            {/* Front Rolling Meadow Green Hill */}
            <path
              d="M 0 145 
                 Q 400 75 880 120 
                 T 1440 90 
                 L 1440 220 
                 L 0 220 
                 Z"
              fill="#2ea84e"
            />

            {/* Daisies Scattered along the Meadow */}
            {/* Left Daisy */}
            <g transform="translate(260, 155)">
              <circle cx="0" cy="0" r="7" fill="#ffffff" />
              <circle cx="0" cy="0" r="3" fill="#facc15" />
            </g>
            {/* Center Daisy */}
            <g transform="translate(680, 150)">
              <circle cx="0" cy="0" r="6" fill="#ffffff" />
              <circle cx="0" cy="0" r="2.5" fill="#facc15" />
            </g>
            {/* Daisy near Pip on Right */}
            <g transform="translate(1080, 128)">
              <circle cx="0" cy="0" r="7" fill="#ffffff" />
              <circle cx="0" cy="0" r="3" fill="#facc15" />
            </g>
            {/* Far Right Daisy */}
            <g transform="translate(1360, 115)">
              <circle cx="0" cy="0" r="6" fill="#ffffff" />
              <circle cx="0" cy="0" r="2.5" fill="#facc15" />
            </g>
          </svg>
        </div>

        {/* ── Deep Navy Ground Below Hills with Stats & Voice Waveform ─── */}
        <div className="w-full bg-[#161338] py-8 sm:py-10 px-6 border-t-2 border-[#120f2e]">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Animated Sound Wave Activity Bar (Inspired by KidsFM audio bar) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#201c4d]/90 border border-white/10 rounded-2xl px-6 py-3.5 shadow-inner">
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
                <span className="text-white font-extrabold text-sm tracking-wide">
                  AI Speech Grading Active
                </span>
              </div>

              {/* Colorful Waveform Waves */}
              <div className="flex items-center gap-1.5 h-6">
                {[40, 75, 100, 60, 90, 45, 80, 100, 70, 50, 85, 60].map((h, i) => (
                  <span
                    key={i}
                    className="w-1.5 rounded-full bg-[#facc15] animate-pulse"
                    style={{
                      height: `${h}%`,
                      animationDelay: `${(i % 5) * 150}ms`,
                      animationDuration: '1.2s',
                    }}
                  />
                ))}
              </div>

              <div className="text-purple-200 text-xs font-black tracking-wider uppercase">
                Instant Gentle Feedback
              </div>
            </div>

            {/* 4 Candy Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {stats.map(({ value, label }) => (
                <div
                  key={label}
                  className="bg-[#201c4d] border border-white/15 rounded-2xl p-4 shadow-md hover:border-amber-400/40 transition-colors"
                >
                  <div className="text-3xl sm:text-4xl font-black text-[#facc15] mb-1 tracking-tight">
                    {value}
                  </div>
                  <div className="text-purple-200 text-xs font-black uppercase tracking-wider">
                    {label}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

      </section>

      {/* ── Seamless Scalloped Cloud Divider into Features ───────────── */}
      <ScallopRibbon topBg="#161338" bottomBg="#fffdf8" variant="scallop" />

      {/* ── Playful Kids Section: Features (Exact Original Copy) ──────── */}
      <section className="py-20 px-6 bg-[#fffdf8] relative overflow-hidden">
        
        {/* Playful Floating Kids Doodles (Eliminating the plain feeling) */}
        
        {/* 1. Happy Smiling Sun Doodle (Top-Left) */}
        <div className="absolute top-6 left-4 sm:left-12 pointer-events-none opacity-85 hidden sm:block">
          <svg width="74" height="74" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="18" fill="#facc15" />
            <path d="M40 8 V16 M40 64 V72 M8 40 H16 M64 40 H72 M17 17 L23 23 M57 57 L63 63 M17 63 L23 57 M57 23 L63 17" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
            <circle cx="34" cy="38" r="2.5" fill="#78350f" />
            <circle cx="46" cy="38" r="2.5" fill="#78350f" />
            <path d="M35 44 Q40 48 45 44" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <circle cx="30" cy="41" r="2.5" fill="#f43f5e" opacity="0.6" />
            <circle cx="50" cy="41" r="2.5" fill="#f43f5e" opacity="0.6" />
          </svg>
        </div>

        {/* 2. Soaring Paper Airplane with Looping Trail (Top-Right) */}
        <div className="absolute top-8 right-6 sm:right-16 pointer-events-none opacity-75 hidden sm:block">
          <svg width="96" height="72" viewBox="0 0 100 80" fill="none">
            <path d="M10 65 Q 40 75 55 45 Q 65 20 45 25 Q 25 30 50 15 L 85 10" stroke="#fb7185" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" fill="none" />
            <polygon points="85,10 65,22 72,16" fill="#fb7185" />
            <polygon points="85,10 72,16 92,2" fill="#f43f5e" />
          </svg>
        </div>

        {/* 3. Dashed Outline Cloud (Left Margin) */}
        <div className="absolute top-1/2 -left-4 sm:left-6 -translate-y-1/2 pointer-events-none opacity-50 hidden md:block">
          <svg width="110" height="60" viewBox="0 0 110 60" fill="none">
            <path d="M 20 45 C 10 45 5 35 15 28 C 15 15 35 12 45 20 C 55 10 80 12 85 24 C 95 24 102 32 95 42 C 90 48 20 48 20 45 Z" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="5 5" fill="#f0f9ff" />
          </svg>
        </div>

        {/* 4. Playful Green Squiggle Loop Doodle (Right Margin) */}
        <div className="absolute top-1/2 -right-2 sm:right-8 -translate-y-1/2 pointer-events-none opacity-60 hidden md:block">
          <svg width="60" height="100" viewBox="0 0 60 100" fill="none">
            <path d="M 30 10 C 60 20 50 50 20 45 C -5 40 10 75 40 80 C 60 85 45 95 30 95" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" fill="none" />
          </svg>
        </div>

        {/* 5. Scattered Confetti Sparkles */}
        <div className="absolute top-24 left-1/4 w-3 h-3 rounded-full bg-pink-400 opacity-60 pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-3.5 h-3.5 rounded-full bg-amber-400 opacity-70 pointer-events-none" />
        <div className="absolute bottom-20 left-1/3 w-3 h-3 rounded-full bg-sky-400 opacity-60 pointer-events-none" />
        <div className="absolute bottom-16 right-1/3 w-4 h-4 rounded-full bg-purple-400 opacity-60 pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          
          {/* Popping Section Header */}
          <div className="text-center mb-16 space-y-3">
            
            {/* Popping Candy Badge */}
            <div className="inline-flex items-center gap-2 bg-[#22c55e] text-white font-black text-xs uppercase tracking-widest px-5 py-2 rounded-full shadow-md border-2 border-white">
              <Sparkles size={14} className="text-amber-300" />
              <span>What we offer</span>
              <Sparkles size={14} className="text-amber-300" />
            </div>

            {/* Bubbly Heading with Playful Underline Accent */}
            <h2 className="text-3xl sm:text-5xl font-black text-[#1d2445] tracking-tight leading-tight">
              Everything a{' '}
              <span className="relative inline-block text-[#6366f1]">
                young learner
                {/* Wavy Underline Ribbon */}
                <svg
                  className="absolute -bottom-2 left-0 w-full h-3 text-[#facc15]"
                  viewBox="0 0 200 12"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M 0 6 Q 25 0 50 6 T 100 6 T 150 6 T 200 6"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{' '}
              needs
            </h2>

            {/* Exact Original Paragraph Copy */}
            <p className="text-slate-600 font-bold text-base sm:text-lg max-w-xl mx-auto leading-relaxed pt-2">
              Built from the ground up for children — engaging, safe, and genuinely fun.
            </p>
          </div>

          {/* 6 Chunky 3D Color Brick Cards with Tactile Depth & Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({
              icon: Icon,
              cardBg,
              cardBorder,
              buttonBg,
              badgeBg,
              badgeText,
              titleColor,
              descColor,
              title,
              desc,
              microAccent,
              actionText,
              actionHref,
            }) => (
              <div
                key={title}
                className={`${cardBg} ${cardBorder} border-2 border-b-[6px] rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between group relative`}
              >
                <div>
                  {/* Card Header: Icon + Pill Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-14 h-14 rounded-2xl ${buttonBg} text-white flex items-center justify-center shadow-md transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                      <Icon size={26} strokeWidth={2.4} />
                    </div>
                    <span className={`${badgeBg} px-3 py-1 rounded-full text-xs font-black border shadow-2xs`}>
                      {badgeText}
                    </span>
                  </div>

                  {/* Title & Desc (Exact Original Copy) */}
                  <h3 className={`${titleColor} font-black text-2xl mb-2.5 tracking-tight`}>
                    {title}
                  </h3>
                  <p className={`${descColor}/95 font-bold text-sm leading-relaxed mb-4`}>
                    {desc}
                  </p>
                </div>

                {/* Micro-Accent Chip & Popping Action Link */}
                <div className="space-y-3 pt-2 border-t border-black/5">
                  <div className="bg-white/90 border border-black/5 rounded-xl px-3 py-1.5 text-xs font-black text-slate-700 flex items-center justify-between shadow-2xs">
                    <span>{microAccent}</span>
                    <span className="text-amber-500">★</span>
                  </div>
                  <Link
                    href={actionHref}
                    className={`w-full ${buttonBg} text-white font-black text-sm py-2.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 group-hover:gap-3 transition-all hover:scale-[1.02] active:scale-95`}
                  >
                    <span>{actionText}</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>

              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Solid Section: How It Works (Exact Original Copy + Playful Path) ── */}
      <section className="py-20 px-6 bg-[#fbf8f3] border-t border-b border-amber-200/40 relative overflow-hidden">
        
        {/* Soft Background Accents */}
        <div className="absolute top-10 left-10 w-24 h-24 rounded-full bg-amber-100/60 pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-purple-100/60 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-14 relative z-10">
          
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 text-purple-700 font-black text-xs uppercase tracking-widest bg-purple-100 border border-purple-200 px-4 py-1.5 rounded-full">
              <span>✦ How it works ✦</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-[#1d2445] tracking-tight">
              Three steps to brilliance
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
            {[
              {
                step: '01',
                color: 'bg-[#7c3aed]',
                cardBorder: 'border-[#7c3aed] border-b-[#5b21b6]',
                title: 'Create a Profile',
                desc: "Set up your child's age and avatar in under a minute.",
                badge: '60 Seconds',
              },
              {
                step: '02',
                color: 'bg-[#10b981]',
                cardBorder: 'border-[#10b981] border-b-[#059669]',
                title: 'Pick a Lesson',
                desc: 'Choose from Math, English, Science, or Social Studies.',
                badge: '4 Subjects',
              },
              {
                step: '03',
                color: 'bg-[#f59e0b]',
                cardBorder: 'border-[#f59e0b] border-b-[#d97706]',
                title: 'Learn & Level Up',
                desc: 'Speak, tap, watch videos, and earn XP with every answer.',
                badge: 'XP & Badges',
              },
            ].map(({ step, color, cardBorder, title, desc, badge }) => (
              <div
                key={step}
                className={`bg-white rounded-3xl p-7 border-2 ${cardBorder} border-b-[6px] shadow-sm hover:shadow-lg transition-all hover:-translate-y-1.5 flex flex-col items-center gap-4 text-center group`}
              >
                <div className={`w-16 h-16 rounded-3xl ${color} text-white flex items-center justify-center shadow-md font-black text-2xl transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                  {step}
                </div>
                <span className="bg-slate-100 text-slate-700 font-black text-[11px] uppercase tracking-wider px-3 py-0.5 rounded-full">
                  {badge}
                </span>
                <div className="space-y-1.5">
                  <h3 className="text-[#1d2445] font-black text-xl">{title}</h3>
                  <p className="text-slate-600 font-bold text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solid Deep Navy Call to Action & Footer ─────────────────── */}
      <div className="bg-[#1d2445] text-white">
        
        {/* Smooth Playful Wave Transition into CTA */}
        <ScallopRibbon topBg="#fbf8f3" bottomBg="#1d2445" variant="wave" />

        {/* Call to Action Section (Exact Original Copy) */}
        <section className="py-16 px-6 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Ready to start?
            </h2>
            <p className="text-slate-300 font-bold text-base sm:text-lg max-w-md mx-auto leading-relaxed">
              Join thousands of families making learning an adventure — completely free to begin.
            </p>
            <Link href="/register">
              <button className="inline-flex items-center gap-2.5 bg-[#facc15] hover:bg-[#eab308] text-[#1d2445] font-black text-base px-10 py-4 rounded-2xl shadow-[0_5px_0_#ca8a04] active:translate-y-1 active:shadow-none transition-all border-2 border-[#ca8a04] mt-2">
                <span>Create a Free Account</span>
                <ArrowRight size={18} />
              </button>
            </Link>
          </div>
        </section>

        {/* Footer (Exact Original Copy + Pill Tags) */}
        <footer className="border-t border-white/10 py-12 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Left: Brand & Pill Badges */}
            <div className="md:col-span-6 space-y-4 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2.5">
                <div className="bg-[#f43f5e] px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-sm">
                  <span className="font-black text-white text-base">Bright Steps</span>
                </div>
              </div>
              <p className="text-slate-300 text-sm font-bold">
                Made with care for curious kids everywhere.
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                <span className="px-3 py-1 rounded-full border border-dashed border-white/40 text-[11px] font-bold text-slate-300">
                  No ads
                </span>
                <span className="px-3 py-1 rounded-full border border-dashed border-white/40 text-[11px] font-bold text-slate-300">
                  No sign-up to test
                </span>
                <span className="px-3 py-1 rounded-full border border-dashed border-white/40 text-[11px] font-bold text-slate-300">
                  Kid-safe
                </span>
              </div>
            </div>

            {/* Right: Links */}
            <div className="md:col-span-6 flex flex-wrap items-center justify-center md:justify-end gap-6 text-sm font-black">
              <Link href="/lessons" className="text-slate-300 hover:text-amber-400 transition-colors">
                Courses
              </Link>
              <Link href="/videos" className="text-slate-300 hover:text-amber-400 transition-colors">
                Videos
              </Link>
              <Link href="/parent" className="text-slate-300 hover:text-amber-400 transition-colors">
                Parent Dashboard
              </Link>
              <Link href="/login" className="text-slate-300 hover:text-amber-400 transition-colors">
                Sign In
              </Link>
              <Link href="/register" className="text-amber-400 hover:text-amber-300 transition-colors">
                Register Free
              </Link>
            </div>

          </div>
        </footer>

      </div>

    </div>
  )
}
