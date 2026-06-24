'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { api } from '@/lib/api'
import type { Achievement } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import { BadgeCard } from '@/components/gamification/BadgeCard'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Pip } from '@/components/mascot/Pip'
import { SpeechBubble } from '@/components/mascot/SpeechBubble'
import { Spinner } from '@/components/ui/Spinner'

export default function AchievementsPage() {
  const { child } = useAppStore()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const childId = child?.id ? Number(child.id) : undefined
    api.achievements.list(childId).then(data => {
      setAchievements(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [child])

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size={40} /></div>

  const unlockedCount = achievements.filter(a => a.unlocked).length

  return (
    <PageWrapper>
      <div className="flex items-end gap-4 mb-8">
        <Pip size="md" mood={unlockedCount > 0 ? 'excited' : 'happy'} animate="idle" />
        <SpeechBubble text={unlockedCount > 0 ? `You have earned ${unlockedCount} badges! Keep going!` : 'Earn badges by completing lessons and streaks!'} />
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold text-white font-nunito">Achievements</h1>
        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-4 py-2">
          <Trophy size={16} className="text-yellow-400" />
          <span className="text-yellow-400 font-bold font-nunito text-sm">
            {unlockedCount} / {achievements.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {achievements.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
          >
            <BadgeCard achievement={{ id: String(a.id), slug: a.slug, title: a.title, description: a.description, icon: a.icon, xp_bonus: a.xp_bonus, unlocked: a.unlocked }} />
          </motion.div>
        ))}
      </div>
    </PageWrapper>
  )
}
