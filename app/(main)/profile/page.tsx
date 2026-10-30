'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Star, Flame, Heart, Users, ArrowRight } from 'lucide-react'
import { signOut } from '@/lib/session'
import { useAppStore } from '@/store/useAppStore'
import { Avatar } from '@/components/ui/Avatar'
import { XPBar } from '@/components/gamification/XPBar'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { getLevelFromXP } from '@/types/child'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const XP_MOCK = [
  { day: 'Mon', xp: 40 },
  { day: 'Tue', xp: 70 },
  { day: 'Wed', xp: 30 },
  { day: 'Thu', xp: 90 },
  { day: 'Fri', xp: 60 },
  { day: 'Sat', xp: 110 },
  { day: 'Sun', xp: 85 },
]

export default function ProfilePage() {
  const router = useRouter()
  const { child, xp, lives, streak } = useAppStore()
  const { level, name: levelName } = getLevelFromXP(xp)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = () => {
    setLoggingOut(true)
    signOut(router)
  }

  if (!child) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-white border-2 border-slate-200 border-b-4 border-slate-300 rounded-3xl p-8 shadow-sm max-w-sm mx-auto">
          <p className="text-slate-600 font-bold font-nunito mb-4">No child profile found.</p>
          <button
            onClick={() => router.push('/onboarding')}
            className="px-6 py-3 bg-[#10b981] hover:bg-[#059669] text-white font-black font-nunito rounded-2xl border-b-4 border-[#047857] shadow-sm"
          >
            Set up profile
          </button>
        </div>
      </div>
    )
  }

  return (
    <PageWrapper>
      <div className="space-y-6">
        
        {/* Child Profile Header Card */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 border-b-4 border-slate-300 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center gap-6">
          <Avatar
            seed={child.avatar_seed}
            name={child.name}
            size={96}
            className="border-4 border-amber-300 shadow-md flex-shrink-0"
          />
          <div className="text-center sm:text-left flex-1 space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black text-[#1d2445] font-nunito tracking-tight">
              {child.name}
            </h1>
            <div>
              <span className="inline-flex items-center gap-1.5 bg-amber-100 border border-amber-300 text-amber-900 font-black text-xs px-3.5 py-1 rounded-full font-nunito">
                Level {level} · {levelName}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 justify-center sm:justify-start pt-1 font-nunito">
              <span className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-900 font-black text-xs px-3 py-1.5 rounded-xl">
                <Star size={14} className="text-amber-500" fill="#f59e0b" /> {xp} XP
              </span>
              <span className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-900 font-black text-xs px-3 py-1.5 rounded-xl">
                <Flame size={14} className="text-orange-500" fill="#f97316" /> {streak} day streak
              </span>
              <span className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-900 font-black text-xs px-3 py-1.5 rounded-xl">
                <Heart size={14} className="text-rose-500" fill="#ef4444" /> {lives} lives
              </span>
            </div>
          </div>
        </div>

        {/* Level & XP Progress Bar */}
        <div>
          <XPBar />
        </div>

        {/* XP This Week Chart Card */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 border-b-4 border-slate-300 p-6 shadow-sm">
          <h2 className="text-[#1d2445] font-black text-lg font-nunito mb-4">
            XP This Week
          </h2>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={XP_MOCK}>
              <XAxis
                dataKey="day"
                tick={{ fill: '#64748b', fontSize: 12, fontFamily: 'Nunito', fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '2px solid #e2e8f0',
                  borderRadius: 16,
                  fontFamily: 'Nunito',
                  fontWeight: 800,
                  fontSize: 12,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
                labelStyle={{ color: '#1d2445' }}
                itemStyle={{ color: '#10b981' }}
              />
              <Area
                type="monotone"
                dataKey="xp"
                stroke="#10b981"
                strokeWidth={3}
                fill="#10b981"
                fillOpacity={0.15}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 4 Core Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {[
            { label: 'Level', value: level, color: '#f59e0b', bg: 'bg-amber-50 border-amber-200' },
            { label: 'Total XP', value: xp.toLocaleString(), color: '#10b981', bg: 'bg-emerald-50 border-emerald-200' },
            { label: 'Streak', value: `${streak} days`, color: '#f97316', bg: 'bg-orange-50 border-orange-200' },
            { label: 'Lives', value: `${lives}/5`, color: '#ef4444', bg: 'bg-rose-50 border-rose-200' },
          ].map(stat => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border-2 border-slate-200 border-b-4 border-slate-300 p-4 text-center shadow-sm"
            >
              <div
                className="text-2xl sm:text-3xl font-black font-nunito"
                style={{ color: stat.color }}
              >
                {stat.value}
              </div>
              <div className="text-slate-500 font-extrabold text-xs uppercase tracking-wider font-nunito mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Family Hub Navigation Tile */}
        <Link href="/parent" className="block group">
          <div className="bg-white hover:bg-slate-50 border-2 border-slate-200 border-b-4 border-slate-300 rounded-2xl p-4 sm:p-5 shadow-sm flex items-center justify-between gap-4 transition-all group-hover:scale-[1.01]">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 flex-shrink-0">
                <Users size={20} />
              </div>
              <div>
                <p className="text-[#1d2445] font-black font-nunito text-sm sm:text-base">
                  Family Hub
                </p>
                <p className="text-slate-500 font-bold font-nunito text-xs">
                  Manage child profiles, learning paths &amp; progress
                </p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-400 group-hover:text-purple-600 transition-colors mr-2" />
          </div>
        </Link>

        {/* Sign Out Action Button */}
        <div className="pt-2 text-center">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full sm:w-auto px-8 py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-black font-nunito rounded-2xl border-b-4 border-rose-700 shadow-sm flex items-center justify-center gap-2 mx-auto transition-all active:translate-y-0.5"
          >
            <LogOut size={18} />
            <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>

      </div>
    </PageWrapper>
  )
}
