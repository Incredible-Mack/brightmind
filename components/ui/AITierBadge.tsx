'use client'
import { useAppStore } from '@/store/useAppStore'

export function AITierBadge() {
  const tier = useAppStore(s => s.aiTierUsed)
  const show = process.env.NEXT_PUBLIC_SHOW_AI_TIER === 'true'
  if (!show || tier === null) return null

  const labels = { 1: { text: 'AI', bg: 'bg-green-500/20 border-green-500/30 text-green-400' }, 2: { text: 'Local', bg: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' }, 3: { text: 'Default', bg: 'bg-slate-500/20 border-slate-500/30 text-slate-400' } }
  const { text, bg } = labels[tier]

  return (
    <div className={`fixed bottom-24 sm:bottom-4 left-4 z-50 px-2.5 py-1 rounded-lg border text-xs font-bold font-nunito ${bg}`}>
      {text}
    </div>
  )
}
