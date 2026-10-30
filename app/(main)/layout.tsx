import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { BottomNav } from '@/components/layout/BottomNav'
import { MainFooterTransition } from '@/components/layout/MainFooterTransition'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fffdf8] flex flex-col font-nunito selection:bg-amber-300 selection:text-slate-900">
      <Navbar />
      
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* Seamless Wave Transition into Deep Navy Footer */}
      <MainFooterTransition />

      {/* Cohesive Global Deep Navy Footer (Matching Landing Page) */}
      <footer className="bg-[#1d2445] text-white border-t border-white/10 py-10 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          <div className="md:col-span-6 space-y-3 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <div className="bg-[#f43f5e] px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-sm">
                <span className="font-black text-white text-sm">Bright Steps</span>
              </div>
            </div>
            <p className="text-slate-300 text-xs font-bold">
              Made with care for curious kids everywhere.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
              <span className="px-2.5 py-0.5 rounded-full border border-dashed border-white/40 text-[10px] font-bold text-slate-300">
                No ads
              </span>
              <span className="px-2.5 py-0.5 rounded-full border border-dashed border-white/40 text-[10px] font-bold text-slate-300">
                No sign-up to test
              </span>
              <span className="px-2.5 py-0.5 rounded-full border border-dashed border-white/40 text-[10px] font-bold text-slate-300">
                Kid-safe
              </span>
            </div>
          </div>

          <div className="md:col-span-6 flex flex-wrap items-center justify-center md:justify-end gap-5 text-xs font-black">
            <Link href="/lessons" className="text-slate-300 hover:text-amber-400 transition-colors">
              Courses
            </Link>
            <Link href="/videos" className="text-slate-300 hover:text-amber-400 transition-colors">
              Videos
            </Link>
            <Link href="/achievements" className="text-slate-300 hover:text-amber-400 transition-colors">
              Trophies
            </Link>
            <Link href="/parent" className="text-slate-300 hover:text-amber-400 transition-colors">
              Parent Dashboard
            </Link>
          </div>

        </div>
      </footer>

      <BottomNav />
    </div>
  )
}
