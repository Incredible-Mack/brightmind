'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Star, Heart, Gamepad2, Trophy, ArrowLeft, ChevronRight, Sparkles } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useRouter } from 'next/navigation'

function playSound(type: 'pop' | 'chime' = 'pop') {
  if (typeof window === 'undefined') return
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    if (ctx.state === 'suspended') ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    if (type === 'chime') {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(587.33, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.25)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    } else {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    }
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
  } catch {}
}

const GAMES = [
  {
    id: 'math-quest',
    title: 'Math Quest',
    emoji: '🧮',
    description: 'Battle monsters by solving maths equations. Level up with combo streaks!',
    badge: 'Adventure',
    badgeColor: 'text-blue-700 bg-blue-100',
    cardBg: 'from-[#dbeafe] to-[#bfdbfe]',
    borderColor: 'border-blue-300 border-b-blue-500',
    playColor: 'bg-blue-500 hover:bg-blue-600',
    href: '/games/math-quest',
    xpPerRound: 100,
    ages: 'All Ages',
  },
  {
    id: 'balloon-pop',
    title: 'Phonics Balloon Pop',
    emoji: '🎈',
    description: 'Pop the balloon with the right letter or word. Listen and learn phonics!',
    badge: 'Phonics',
    badgeColor: 'text-emerald-700 bg-emerald-100',
    cardBg: 'from-[#dcfce7] to-[#bbf7d0]',
    borderColor: 'border-emerald-300 border-b-emerald-500',
    playColor: 'bg-emerald-500 hover:bg-emerald-600',
    href: '/games/balloon-pop',
    xpPerRound: 80,
    ages: 'Ages 0–8',
  },
  {
    id: 'puzzle-quest',
    title: 'Puzzle Quest',
    emoji: '🧩',
    description: 'Arrange coloured shapes in the right order. Speed bonus for older kids!',
    badge: 'Logic',
    badgeColor: 'text-orange-700 bg-orange-100',
    cardBg: 'from-[#ffedd5] to-[#fed7aa]',
    borderColor: 'border-orange-300 border-b-orange-500',
    playColor: 'bg-orange-500 hover:bg-orange-600',
    href: '/games/puzzle-quest',
    xpPerRound: 90,
    ages: 'All Ages',
  },
  {
    id: 'science-lab',
    title: 'Science Lab',
    emoji: '🔬',
    description: 'Mix coloured liquids and predict reactions. Learn real science facts!',
    badge: 'Science',
    badgeColor: 'text-purple-700 bg-purple-100',
    cardBg: 'from-[#f3e8ff] to-[#e9d5ff]',
    borderColor: 'border-purple-300 border-b-purple-500',
    playColor: 'bg-purple-500 hover:bg-purple-600',
    href: '/games/science-lab',
    xpPerRound: 100,
    ages: 'All Ages',
  },
  {
    id: 'memory-match',
    title: 'Memory Match',
    emoji: '🃏',
    description: 'Flip cards and find matching pairs. Train your memory and earn XP!',
    badge: 'Memory',
    badgeColor: 'text-pink-700 bg-pink-100',
    cardBg: 'from-[#fce7f3] to-[#fbcfe8]',
    borderColor: 'border-pink-300 border-b-pink-500',
    playColor: 'bg-pink-500 hover:bg-pink-600',
    href: '/games/memory-match',
    xpPerRound: 120,
    ages: 'All Ages',
  },
]

export default function GamesPage() {
  const router = useRouter()
  const { xp, lives, maxLives, child } = useAppStore()

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eef9f4] to-[#f0f9ff] font-nunito pb-16">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b-2 border-slate-100 px-4 py-3 flex items-center justify-between shadow-xs">
        <button
          type="button"
          onClick={() => { playSound('pop'); router.back() }}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs transition-all border border-slate-200 cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <div className="flex items-center gap-2 font-black text-sm">
          <Gamepad2 size={18} className="text-emerald-600" />
          <span className="text-slate-800">Play &amp; Learn</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
            <Star size={13} className="text-amber-500 fill-amber-400" />
            <span className="text-xs font-black text-amber-700">{xp} XP</span>
          </div>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: maxLives }).map((_, i) => (
              <Heart
                key={i}
                size={15}
                className={i < lives ? 'text-rose-500 fill-rose-400' : 'text-slate-200 fill-slate-200'}
              />
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 pt-8">
        {/* Page Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 rounded-full px-4 py-1.5 font-black text-xs mb-3">
            <Sparkles size={12} />
            Interactive Learning Games
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-[#0c4a6e] font-nunito mb-3">
            ✦ Play &amp; Learn ✦
          </h1>
          <p className="text-slate-500 font-bold text-sm sm:text-base max-w-md mx-auto">
            {child?.name
              ? `${child.name}, choose a game and earn XP while you learn!`
              : 'Choose a game and earn XP while you learn!'}
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-10 max-w-md mx-auto">
          {[
            { icon: '🎮', label: 'Games', value: '5' },
            { icon: '⭐', label: 'Your XP', value: xp.toLocaleString() },
            { icon: '❤️', label: 'Hearts', value: `${lives}/${maxLives}` },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl p-3 text-center border-2 border-slate-100 border-b-4 shadow-xs">
              <div className="text-xl mb-0.5">{stat.icon}</div>
              <div className="font-black text-slate-800 text-sm">{stat.value}</div>
              <div className="text-slate-400 font-bold text-xs">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Game Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GAMES.map((game, idx) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, type: 'spring', damping: 18 }}
            >
              <Link
                href={game.href}
                onClick={() => playSound('chime')}
                className={`block bg-gradient-to-b ${game.cardBg} rounded-3xl border-2 ${game.borderColor} border-b-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group overflow-hidden`}
              >
                {/* Card Top — Emoji Artwork */}
                <div className="flex items-center justify-center h-32 text-6xl">
                  {game.emoji}
                </div>

                {/* Card Body */}
                <div className="bg-white/70 backdrop-blur-sm p-4 rounded-t-2xl">
                  <div className="flex items-start justify-between mb-1.5">
                    <div>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${game.badgeColor}`}>
                        {game.badge}
                      </span>
                      <h3 className="font-black text-[#1d2445] text-base mt-1.5 font-nunito leading-tight">
                        {game.title}
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 mt-1 shrink-0">{game.ages}</span>
                  </div>

                  <p className="text-slate-500 font-bold text-xs leading-relaxed mb-3">
                    {game.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs font-black text-amber-600">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      Up to {game.xpPerRound} XP / round
                    </div>
                    <div className={`flex items-center gap-1 text-white text-xs font-black px-3 py-1.5 rounded-xl ${game.playColor} transition-colors`}>
                      Play ▶
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Footer tip */}
        <p className="text-center text-slate-400 font-bold text-xs mt-10">
          🌟 More games coming soon — including Word Builder &amp; Number Race!
        </p>
      </div>
    </div>
  )
}

