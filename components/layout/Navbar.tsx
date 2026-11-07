'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Flame, Star, Heart, Users, Crown, Infinity as InfinityIcon, Sparkles, BookOpen, Play, Trophy, Shield } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useLives } from '@/hooks/useLives'
import { UserMenu } from '@/components/layout/UserMenu'
import { HeartsModal } from '@/components/gamification/HeartsModal'

export function Navbar() {
  const pathname = usePathname()
  const { child, xp, streak, user } = useAppStore()
  const { lives, maxLives, formattedTime, premium } = useLives()
  const [heartsOpen, setHeartsOpen] = useState(false)

  const navLinks = [
    { href: '/', label: 'Home', icon: Sparkles },
    { href: '/lessons', label: 'Courses', icon: BookOpen },
    { href: '/videos', label: 'Videos', icon: Play },
    { href: '/achievements', label: 'Trophies', icon: Trophy },
    { href: '/parent', label: 'For Parents', icon: Users },
  ]

  return (
    <nav className="sticky top-0 z-40 bg-[#eaf6ff]/95 backdrop-blur-md border-b-2 border-[#d0e8fc] shadow-sm h-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        
        {/* Left: Brand Logo in WonderLearn Aesthetic */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] border-2 border-white shadow-md flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
            📖
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-black text-[#0f4c5c] tracking-tight leading-none group-hover:text-[#0284c7] transition-colors">
              Bright Steps
            </span>
            <span className="text-[9px] sm:text-[10px] font-black text-[#0284c7] tracking-wider uppercase mt-0.5">
              Imagine • Discover • Grow
            </span>
          </div>
        </Link>

        {/* Center: Desktop Navigation Links with Warm Rounded Pills */}
        <div className="hidden md:flex items-center gap-1.5">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-nunito text-xs sm:text-sm font-black transition-all ${
                  active
                    ? 'bg-[#facc15] hover:bg-[#eab308] text-[#713f12] border-2 border-[#fde047] shadow-sm scale-105'
                    : 'text-[#334155] hover:text-[#0284c7] hover:bg-white/80'
                }`}
              >
                <Icon size={15} />
                <span>{label}</span>
              </Link>
            )
          })}
        </div>

        {/* Right: Gamification Stats & User Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* XP Pill */}
          <div className="hidden sm:flex items-center gap-1.5 bg-[#fef9c3] border-2 border-[#fde047] rounded-full px-3 py-1 shadow-xs">
            <Star size={14} className="text-amber-500 fill-amber-400" />
            <span className="text-[#854d0e] font-black text-xs font-nunito">{xp.toLocaleString()} XP</span>
          </div>

          {/* Streak Pill */}
          <div className="flex items-center gap-1.5 bg-[#fff7ed] border-2 border-[#fdba74] rounded-full px-2.5 sm:px-3 py-1 shadow-xs">
            <Flame size={14} className="text-orange-500 fill-orange-400" />
            <span className="text-[#9a3412] font-black text-xs font-nunito">{streak}</span>
          </div>

          {/* Lives / Energy Pill */}
          {premium ? (
            <button
              onClick={() => setHeartsOpen(true)}
              className="flex items-center gap-1 bg-[#fdf2f8] hover:bg-[#fce7f3] border-2 border-[#f472b6] rounded-full px-3 py-1 shadow-xs transition-transform active:scale-95 cursor-pointer"
              title="Unlimited hearts"
            >
              <Heart size={14} className="text-rose-500 fill-rose-400" />
              <InfinityIcon size={14} className="text-rose-600" />
            </button>
          ) : (
            <button
              onClick={() => setHeartsOpen(true)}
              className="flex items-center gap-1 bg-[#fdf2f8] hover:bg-[#fce7f3] border-2 border-[#f472b6] rounded-full px-2.5 py-1 shadow-xs transition-transform active:scale-95 cursor-pointer group"
              title={`Hearts: ${lives}/${maxLives} · Click to refill`}
            >
              <Heart size={14} className="text-rose-500 group-hover:scale-110 transition-transform fill-rose-400" />
              <span className="text-rose-700 font-black text-xs font-nunito">{lives}</span>
              {lives < maxLives && (
                <span className="text-[10px] text-amber-700 font-mono ml-0.5 hidden sm:inline font-bold">
                  {formattedTime}
                </span>
              )}
            </button>
          )}

          {/* Interactive Hearts Refill Modal */}
          <HeartsModal isOpen={heartsOpen} onClose={() => setHeartsOpen(false)} />

          {/* Admin Portal Quick Link */}
          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 border-2 border-purple-300 rounded-full px-3 py-1 text-xs font-black font-nunito shadow-xs transition-all hover:scale-105"
              title="Admin Panel"
            >
              <Shield size={13} className="text-purple-600" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          {/* User Menu / Avatar */}
          <UserMenu />
        </div>
      </div>
    </nav>
  )
}
