'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { BottomNav } from '@/components/layout/BottomNav'
import { ScallopRibbon } from '@/components/home/ScallopRibbon'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPlayPage = pathname?.includes('/play')

  if (isPlayPage) {
    return (
      <div className="min-h-screen bg-[#f0f9ff] text-slate-800 flex flex-col font-nunito selection:bg-amber-300 selection:text-slate-900">
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fffdf8] flex flex-col font-nunito selection:bg-amber-300 selection:text-slate-900">
      <Navbar />
      
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* Scalloped Wave Transition into Lush Emerald Footer */}
      <ScallopRibbon topBg="#fffdf8" bottomBg="#0d5c56" variant="wave" />

      {/* Cohesive Global Rolling Hills Emerald Footer (Matching Home Page) */}
      <footer className="w-full bg-[#0d5c56] text-white pt-8 pb-10 px-6 border-t-2 border-[#0a4843]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#fde047] text-amber-900 flex items-center justify-center text-lg shadow-sm font-black">
                📖
              </div>
              <div>
                <span className="font-black text-white text-base leading-tight">Bright Steps</span>
                <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">Imagine • Discover • Grow</p>
              </div>
            </div>
            <p className="text-emerald-100 text-xs font-bold max-w-sm">
              Safe, voice-interactive educational adventures designed for kids aged 0–14.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-800/80 border border-emerald-600/50 text-[10px] font-black text-emerald-200">
                🛡️ 100% Ad-Free
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-800/80 border border-emerald-600/50 text-[10px] font-black text-emerald-200">
                ⭐ Expert Curated
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-800/80 border border-emerald-600/50 text-[10px] font-black text-emerald-200">
                ❤️ For Kids Everywhere
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-5 text-xs font-black">
            <Link href="/lessons" className="text-emerald-100 hover:text-amber-300 transition-colors">
              Courses
            </Link>
            <Link href="/videos" className="text-emerald-100 hover:text-amber-300 transition-colors">
              Videos
            </Link>
            <Link href="/achievements" className="text-emerald-100 hover:text-amber-300 transition-colors">
              Trophies
            </Link>
            <Link href="/parent" className="text-emerald-100 hover:text-amber-300 transition-colors">
              Parent Dashboard
            </Link>
          </div>

        </div>
      </footer>

      <BottomNav />
    </div>
  )
}
