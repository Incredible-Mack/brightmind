'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Flame, Star, Heart, Users } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Avatar } from '@/components/ui/Avatar'

export function Navbar() {
  const pathname = usePathname()
  const { child, xp, streak, lives } = useAppStore()

  return (
    <nav className="sticky top-0 z-40 bg-[#1e2433]/95 backdrop-blur-md border-b border-white/5 h-16">
      <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-[#4ade80] font-extrabold text-xl tracking-tight">BrightMind</span>
        </Link>

        <div className="flex items-center gap-4 sm:gap-6">
          {/* XP */}
          <div className="hidden sm:flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-3 py-1.5">
            <Star size={14} className="text-yellow-400" fill="#eab308" />
            <span className="text-yellow-400 font-bold text-sm">{xp.toLocaleString()}</span>
          </div>
          {/* Streak */}
          <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1.5">
            <Flame size={14} className="text-orange-400" fill="#f97316" />
            <span className="text-orange-400 font-bold text-sm">{streak}</span>
          </div>
          {/* Lives */}
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Heart
                key={i}
                size={16}
                className={i < lives ? 'text-red-500' : 'text-slate-700'}
                fill={i < lives ? '#ef4444' : 'transparent'}
              />
            ))}
          </div>
          {/* Family Hub */}
          <Link
            href="/parent"
            className={`hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
              pathname.startsWith('/parent')
                ? 'bg-blue-500/15 text-blue-400'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users size={15} />
            <span className="font-nunito font-semibold text-sm">Family</span>
          </Link>
          {/* Avatar → Profile */}
          {child && (
            <Link href="/profile">
              <Avatar seed={child.avatar_seed} name={child.name} size={32} />
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
