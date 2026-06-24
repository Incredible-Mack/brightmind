'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Star, Flame, Heart, Users } from 'lucide-react'
import { clearToken } from '@/lib/auth'
import { useAppStore } from '@/store/useAppStore'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { XPBar } from '@/components/gamification/XPBar'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { getLevelFromXP } from '@/types/child'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const XP_MOCK = [
  { day: 'Mon', xp: 40 }, { day: 'Tue', xp: 70 }, { day: 'Wed', xp: 30 },
  { day: 'Thu', xp: 90 }, { day: 'Fri', xp: 60 }, { day: 'Sat', xp: 110 }, { day: 'Sun', xp: 85 },
]

export default function ProfilePage() {
  const router = useRouter()
  const { child, xp, lives, streak, resetSession } = useAppStore()
  const { level, name: levelName } = getLevelFromXP(xp)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = () => {
    setLoggingOut(true)
    clearToken()
    resetSession()
    router.push('/')
  }

  if (!child) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <p className="text-slate-400 font-nunito mb-4">No profile found.</p>
        <Button onClick={() => router.push('/onboarding')}>Set up profile</Button>
      </div>
    </div>
  )

  return (
    <PageWrapper>
      <Card className="flex flex-col sm:flex-row items-center gap-6 mb-6">
        <Avatar seed={child.avatar_seed} name={child.name} size={96} className="border-4 border-[#4ade80]" />
        <div className="text-center sm:text-left flex-1">
          <h1 className="text-3xl font-extrabold text-white font-nunito">{child.name}</h1>
          <div className="flex items-center gap-2 justify-center sm:justify-start mt-1">
            <div className="bg-yellow-500/20 text-yellow-400 font-bold text-sm px-3 py-1 rounded-full font-nunito">
              Level {level} · {levelName}
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 justify-center sm:justify-start text-slate-300 text-sm font-nunito">
            <span className="flex items-center gap-1"><Star size={14} className="text-yellow-400" fill="#eab308" /> {xp} XP</span>
            <span className="flex items-center gap-1"><Flame size={14} className="text-orange-400" fill="#f97316" /> {streak} day streak</span>
            <span className="flex items-center gap-1"><Heart size={14} className="text-red-400" fill="#ef4444" /> {lives} lives</span>
          </div>
        </div>
      </Card>

      <div className="mb-6">
        <XPBar />
      </div>

      <Card className="mb-6">
        <h2 className="text-white font-bold font-nunito mb-4">XP This Week</h2>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={XP_MOCK}>
            <defs>
              <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12, fontFamily: 'Nunito' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ backgroundColor: '#252b3b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontFamily: 'Nunito', fontSize: 12 }}
              labelStyle={{ color: '#94a3b8' }}
              itemStyle={{ color: '#4ade80' }}
            />
            <Area type="monotone" dataKey="xp" stroke="#4ade80" strokeWidth={2} fill="url(#xpGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Level', value: level, color: '#eab308' },
          { label: 'Total XP', value: xp.toLocaleString(), color: '#4ade80' },
          { label: 'Streak', value: `${streak} days`, color: '#f97316' },
          { label: 'Lives', value: `${lives}/5`, color: '#ef4444' },
        ].map(stat => (
          <Card key={stat.label} className="text-center">
            <div className="text-2xl font-extrabold font-nunito" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-slate-400 text-sm font-nunito mt-0.5">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Family Hub shortcut */}
      <Link href="/parent" className="block mb-3">
        <div className="flex items-center gap-3 w-full bg-[#1a1f2e] hover:bg-[#252b3b] border border-white/5 hover:border-blue-500/20 rounded-2xl px-5 py-4 transition-all group">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
            <Users size={18} className="text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-white font-nunito font-bold text-sm">Family Hub</p>
            <p className="text-slate-500 font-nunito text-xs">Manage child profiles &amp; progress</p>
          </div>
          <Star size={14} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
        </div>
      </Link>

      <Button variant="danger" size="lg" fullWidth loading={loggingOut} onClick={handleLogout}>
        <LogOut size={18} /> Sign Out
      </Button>
    </PageWrapper>
  )
}
