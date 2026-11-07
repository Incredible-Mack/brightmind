'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, Layers, Film, ChevronRight, ExternalLink, Sparkles, Shuffle, Activity, Users, Trophy, Target, GraduationCap, CreditCard, Image as ImageIcon, MessageSquareHeart, Lightbulb } from 'lucide-react'

const NAV = [
  { href: '/admin',              icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/monitor',      icon: Activity,        label: 'Activity & Monitor' },
  { href: '/admin/users',        icon: Users,           label: 'Users & Children' },
  { href: '/admin/curriculum',   icon: GraduationCap,   label: 'Course Review' },
  { href: '/admin/lessons',      icon: BookOpen,        label: 'Lessons & Activities' },
  { href: '/admin/skills',       icon: Target,          label: 'Curriculum Coverage' },
  { href: '/admin/variants',     icon: Shuffle,         label: 'AI Variants' },
  { href: '/admin/images',      icon: ImageIcon,       label: 'Images' },
  { href: '/admin/videos',       icon: Film,            label: 'Videos' },
  { href: '/admin/billing',      icon: CreditCard,      label: 'Plans & Billing' },
  { href: '/admin/achievements', icon: Trophy,          label: 'Badges' },
  { href: '/admin/subjects',     icon: Layers,          label: 'Subjects' },
  { href: '/admin/hero',         icon: Sparkles,        label: 'Hero & Showcase' },
  { href: '/admin/testimonials', icon: MessageSquareHeart, label: 'Testimonials' },
  { href: '/admin/facts',        icon: Lightbulb,       label: 'Wonder Facts' },
]

export function AdminSidebar() {
  const path = usePathname()

  return (
    <aside className="w-60 min-h-screen bg-[#0f1117] border-r border-white/5 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#4ade80] flex items-center justify-center">
            <Sparkles size={16} className="text-[#0f1117]" />
          </div>
          <div>
            <p className="text-white font-extrabold font-nunito text-sm leading-none">Bright Steps</p>
            <p className="text-[#4ade80] font-bold font-nunito text-[10px] uppercase tracking-widest">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = href === '/admin' ? path === '/admin' : path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-nunito font-semibold text-sm transition-all group ${
                active
                  ? 'bg-[#4ade80]/15 text-[#4ade80]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={18} className={active ? 'text-[#4ade80]' : 'text-slate-500 group-hover:text-white'} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={14} className="text-[#4ade80]/60" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 pb-6 space-y-2 border-t border-white/5 pt-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 font-nunito text-sm font-semibold transition-all"
        >
          <ExternalLink size={16} />
          Back to App
        </Link>
      </div>
    </aside>
  )
}
