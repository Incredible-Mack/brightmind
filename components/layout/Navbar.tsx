'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Flame, Star, Heart, Users, Crown, Infinity as InfinityIcon, Sparkles, BookOpen, Play, Trophy } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useLives } from '@/hooks/useLives'
import { UserMenu } from '@/components/layout/UserMenu'
import { HeartsModal } from '@/components/gamification/HeartsModal'

export function Navbar() {
  const pathname = usePathname()
  const { child, xp, streak } = useAppStore()
  const { lives, maxLives, formattedTime, premium } = useLives()
  const [heartsOpen, setHeartsOpen] = useState(false)

  const navLinks = [
    { href: '/dashboard', label: 'Home', icon: Sparkles },
    { href: '/lessons', label: 'Courses', icon: BookOpen },
    { href: '/videos', label: 'Videos', icon: Play },
    { href: '/achievements', label: 'Trophies', icon: Trophy },
    { href: '/parent', label: 'For Parents', icon: Users },
  ]

  return (
    <nav className="sticky top-0 z-40 bg-[#201c4d] text-white border-b border-white/10 shadow-md h-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        
        {/* Left: Brand Logo in Candy Pink Pill Badge (Matching Landing Page) */}
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="bg-[#f43f5e] hover:bg-[#e11d48] px-3.5 py-1.5 rounded-2xl flex items-center gap-2 shadow-md shadow-pink-950/40 transition-transform group-hover:scale-105 border-2 border-white/20">
            <Sparkles size={16} className="text-white" />
            <span className="font-black text-lg tracking-tight text-white font-nunito">Bright Steps</span>
          </div>
        </Link>

        {/* Center: Desktop Navigation Links with Golden Active Pill */}
        <div className="hidden md:flex items-center gap-1.5">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-nunito text-xs sm:text-sm font-black transition-all ${
                  active
                    ? 'bg-[#facc15] hover:bg-[#eab308] text-[#201c4d] shadow-sm scale-105'
                    : 'text-white/90 hover:text-amber-300 hover:bg-white/5'
                }`}
              >
                <Icon size={15} />
                <span>{label}</span>
              </Link>
            )
          })}
        </div>

        {/* Right: Gamification Stats & User Navigation */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* XP Pill */}
          <div className="hidden sm:flex items-center gap-1.5 bg-amber-400/20 border border-amber-300/40 rounded-full px-3 py-1 shadow-sm">
            <Star size={14} className="text-amber-300" fill="#facc15" />
            <span className="text-amber-200 font-black text-xs font-nunito">{xp.toLocaleString()} XP</span>
          </div>

          {/* Streak Pill */}
          <div className="flex items-center gap-1.5 bg-orange-500/20 border border-orange-400/40 rounded-full px-3 py-1 shadow-sm">
            <Flame size={14} className="text-orange-400" fill="#f97316" />
            <span className="text-orange-200 font-black text-xs font-nunito">{streak}</span>
          </div>

          {/* Lives / Energy Pill (Clickable with Live 10-min Countdown & Refill Modal) */}
          {premium ? (
            <button
              onClick={() => setHeartsOpen(true)}
              className="flex items-center gap-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 rounded-full px-3 py-1 shadow-sm transition-transform active:scale-95 cursor-pointer"
              title="Unlimited hearts"
            >
              <Heart size={14} className="text-rose-400" fill="#f43f5e" />
              <InfinityIcon size={14} className="text-rose-300" />
            </button>
          ) : (
            <button
              onClick={() => setHeartsOpen(true)}
              className="flex items-center gap-1 bg-rose-500/20 hover:bg-rose-500/35 border border-rose-400/40 rounded-full px-2.5 py-1 shadow-sm transition-transform active:scale-95 cursor-pointer group"
              title={`Hearts: ${lives}/${maxLives} · Click to refill`}
            >
              <Heart size={14} className="text-rose-400 group-hover:scale-110 transition-transform" fill="#f43f5e" />
              <span className="text-rose-200 font-black text-xs font-nunito">{lives}</span>
              {lives < maxLives && (
                <span className="text-[10px] text-amber-300 font-mono ml-0.5 hidden sm:inline">
                  {formattedTime}
                </span>
              )}
            </button>
          )}

          {/* Interactive Hearts Refill Modal */}
          <HeartsModal isOpen={heartsOpen} onClose={() => setHeartsOpen(false)} />

          {/* Quick Demo Button (No login required) */}
          <Link
            href="/demo"
            className="hidden sm:flex items-center gap-1.5 bg-[#22c55e]/25 hover:bg-[#22c55e]/35 border border-[#22c55e]/50 text-[#4ade80] rounded-full px-3 py-1 font-black text-xs font-nunito transition-transform active:scale-95"
            title="Try instant lesson without login"
          >
            <Sparkles size={13} className="text-amber-300" />
            <span>Try Demo</span>
          </Link>

          {/* Upgrade Button */}
          {!premium && (
            <Link
              href="/upgrade"
              className="hidden lg:flex items-center gap-1.5 bg-[#facc15] hover:bg-[#eab308] text-[#201c4d] font-black rounded-full px-3 py-1 text-xs shadow-sm transition-transform hover:scale-105 active:scale-95"
            >
              <Crown size={13} />
              <span>Plus</span>
            </Link>
          )}

          {/* Avatar Menu */}
          <UserMenu />
        </div>

      </div>
    </nav>
  )
}
