'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Sparkles, Trophy, Play, User } from 'lucide-react'

const items = [
  { href: '/dashboard',    icon: Sparkles,   label: 'Home' },
  { href: '/lessons',      icon: BookOpen,   label: 'Courses' },
  { href: '/videos',       icon: Play,       label: 'Videos' },
  { href: '/achievements', icon: Trophy,     label: 'Trophies' },
  { href: '/profile',      icon: User,       label: 'Profile' },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-3 left-4 right-4 z-40 sm:hidden bg-[#201c4d]/95 backdrop-blur-md border border-white/15 rounded-3xl shadow-2xl shadow-indigo-950/60 safe-area-pb">
      <div className="flex items-center px-1.5 py-1">
        {items.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center py-1.5 gap-0.5 justify-center rounded-2xl transition-all"
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  active
                    ? 'bg-[#facc15] text-[#201c4d] shadow-md shadow-amber-400/40 scale-105'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              </div>
              <span
                className={`text-[10px] font-black font-nunito tracking-tight ${
                  active ? 'text-[#facc15] font-extrabold' : 'text-white/60'
                }`}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
