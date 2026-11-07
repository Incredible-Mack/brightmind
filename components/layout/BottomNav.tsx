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
    <nav className="fixed bottom-3 left-4 right-4 z-40 sm:hidden bg-white/95 backdrop-blur-md border-2 border-sky-100 rounded-3xl shadow-xl shadow-sky-950/10 safe-area-pb">
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
                    ? 'bg-[#0284c7] text-white shadow-md shadow-sky-400/30 scale-105'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              </div>
              <span
                className={`text-[10px] font-black font-nunito tracking-tight ${
                  active ? 'text-[#0284c7] font-extrabold' : 'text-slate-400 font-bold'
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
