'use client'
import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Star, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'
import type { Achievement } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import { BadgeCard } from '@/components/gamification/BadgeCard'
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus'
import { Pip } from '@/components/mascot/Pip'
import { Spinner } from '@/components/ui/Spinner'
import { ScallopRibbon } from '@/components/home/ScallopRibbon'

export default function AchievementsPage() {
  const { child } = useAppStore()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    const childId = child?.id ? Number(child.id) : undefined
    api.achievements.list(childId).then(data => {
      setAchievements(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [child?.id])

  useEffect(() => { load() }, [load])
  useRefetchOnFocus(load)

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] bg-[#201c4d]">
      <Spinner size={44} />
    </div>
  )

  const unlockedCount = achievements.filter(a => a.unlocked).length

  return (
    <div className="w-full flex flex-col">
      {/* ── Top Hero Header (Matching Landing Page) ───────────────── */}
      <section className="bg-[#201c4d] text-white pt-8 pb-10 px-4 sm:px-6 relative overflow-hidden">
        {/* Soft Purple Cloud Puffs */}
        <div className="absolute top-4 left-10 w-32 h-16 bg-[#2e2968] rounded-full pointer-events-none opacity-80" />
        <div className="absolute top-2 right-14 w-40 h-20 bg-[#2e2968] rounded-full pointer-events-none opacity-75 hidden sm:block" />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-[#171439]/90 border border-white/15 rounded-full px-4 py-1.5 text-xs font-black text-purple-200 shadow-sm">
              <Sparkles size={14} className="text-[#facc15]" />
              <span>Pip&apos;s Hall of Fame</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Trophy <span className="text-[#facc15]">Room</span> 🏆
            </h1>
            <p className="text-purple-100 font-bold text-sm sm:text-base max-w-xl">
              Celebrate your victories! Earn stars, level badges, and secret rewards with every challenge!
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#171439]/90 border border-white/15 px-5 py-3 rounded-2xl shadow-lg">
            <Trophy size={24} className="text-[#facc15]" />
            <div>
              <p className="text-[10px] uppercase font-black tracking-wider text-purple-200">Badges Unlocked</p>
              <p className="text-xl font-black text-[#facc15] font-nunito leading-tight">
                {unlockedCount} <span className="text-sm text-purple-200 font-bold">/ {achievements.length}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Scallop Wave Transition into Warm Canvas */}
      <ScallopRibbon topBg="#201c4d" bottomBg="#fffdf8" variant="scallop" />

      {/* Main Achievements Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full space-y-8">
        
        {/* Pip Encouragement Card */}
        <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 border-b-[5px] shadow-sm flex flex-col sm:flex-row items-center gap-6">
          <Pip size="lg" mood={unlockedCount > 0 ? 'excited' : 'happy'} animate="idle" />
          <div className="text-center sm:text-left flex-1">
            <h3 className="text-slate-900 font-black text-xl mb-1">
              {unlockedCount > 0 ? `Amazing work, ${child?.name || 'friend'}!` : 'Ready to start collecting?'}
            </h3>
            <p className="text-slate-600 font-bold text-sm">
              {unlockedCount > 0
                ? `You have already collected ${unlockedCount} shiny badges. Keep learning to complete your showcase!`
                : 'Complete interactive lessons, maintain streaks, and speak answers aloud to unlock your first badge!'}
            </p>
          </div>
        </div>

        {/* Badge Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {achievements.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
            >
              <BadgeCard
                achievement={{
                  id: String(a.id),
                  slug: a.slug,
                  title: a.title,
                  description: a.description,
                  icon: a.icon,
                  xp_bonus: a.xp_bonus,
                  unlocked: a.unlocked,
                }}
              />
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  )
}
