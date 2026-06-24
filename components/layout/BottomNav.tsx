'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, PlaySquare, Users, User } from 'lucide-react'

const items = [
  { href: '/dashboard',    icon: Home,       label: 'Home' },
  { href: '/lessons',      icon: BookOpen,   label: 'Lessons' },
  { href: '/videos',       icon: PlaySquare, label: 'Videos' },
  { href: '/parent',       icon: Users,      label: 'Family' },
  { href: '/profile',      icon: User,       label: 'Profile' },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-[#1e2433]/95 backdrop-blur-md border-t border-white/5 safe-area-pb">
      <div className="flex">
        {items.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href} className="flex-1 flex flex-col items-center py-2 gap-0.5 min-h-[56px] justify-center">
              <Icon
                size={22}
                className={active ? 'text-[#4ade80]' : 'text-slate-500'}
                strokeWidth={active ? 2.5 : 1.5}
              />
              <span className={`text-[10px] font-semibold font-nunito ${active ? 'text-[#4ade80]' : 'text-slate-500'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
