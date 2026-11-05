'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Crown, Heart, Infinity as InfinityIcon, Users, Check, AlertCircle, Wallet, CreditCard } from 'lucide-react'
import { api } from '@/lib/api'
import type { Plans } from '@/lib/api'
import { useLives } from '@/hooks/useLives'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Spinner } from '@/components/ui/Spinner'
import { Pip } from '@/components/mascot/Pip'

function fmtNaira(amount: number) {
  return `₦${Number(amount).toLocaleString('en-NG')}`
}

function getPlanNgn(p: { espees: number; ngn?: number } | null | undefined): number {
  if (!p) return 0
  if (p.ngn && p.ngn >= 1000) return p.ngn
  // Correct for legacy or unscaled rate (e.g. 41 -> 4,100, 410 -> 41,000)
  return Math.round(p.espees * 2050)
}

export default function UpgradePage() {
  const router = useRouter()
  const { premium } = useLives()
  const [plans, setPlans] = useState<Plans | null>(null)
  const [selected, setSelected] = useState<'monthly' | 'yearly'>('yearly')
  const [busy, setBusy] = useState<'espees' | 'kingspay' | null>(null)
  const [error, setError] = useState('')
  const [banner, setBanner] = useState<'success' | 'failed' | 'pending' | 'error' | null>(null)

  useEffect(() => {
    api.billing.plans().then(setPlans).catch(() => setError('Could not load subscription plans'))
    const params = new URLSearchParams(window.location.search)
    const result = params.get('result')
    if (result === 'success' || result === 'failed' || result === 'pending' || result === 'error') setBanner(result)
  }, [router])

  const pay = async (gateway: 'espees' | 'kingspay') => {
    setBusy(gateway); setError('')
    try {
      const { redirect_url } = await api.billing.subscribe(selected, gateway)
      window.location.href = redirect_url
    } catch (e) { setError((e as Error).message); setBusy(null) }
  }

  if (!plans) return <div className="flex items-center justify-center min-h-[60vh]">{error ? <p className="text-red-500 font-bold font-nunito">{error}</p> : <Spinner size={40} color="#10b981" />}</div>

  const monthly = plans.plans.find((p: any) => p.id === 'monthly')
  const yearly = plans.plans.find((p: any) => p.id === 'yearly')
  const yearSaving = monthly && yearly ? Math.max(0, Math.round((1 - yearly.espees / (monthly.espees * 12)) * 100)) : 0
  const chosen = selected === 'yearly' ? yearly : monthly

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-end gap-4">
          <Pip size="lg" mood="excited" animate="idle" />
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#1d2445] font-nunito flex items-center gap-2">
              <Crown className="text-amber-500" /> Go Unlimited
            </h1>
            <p className="text-slate-600 font-bold font-nunito text-sm mt-0.5">
              Learn without ever running out of hearts.
            </p>
          </div>
        </div>

        {banner === 'success' && (
          <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 text-[#047857] font-nunito font-black flex items-center gap-2">
            <Check size={20} /> Payment received! Unlimited hearts are active!
          </div>
        )}
        {banner === 'failed' && (
          <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 text-rose-700 font-nunito font-bold flex items-center gap-2">
            <AlertCircle size={20} /> The payment did not go through. You have not been charged.
          </div>
        )}
        {banner === 'error' && (
          <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 text-rose-700 font-nunito font-bold flex items-center gap-2">
            <AlertCircle size={20} /> There was an error processing your subscription. Please try again.
          </div>
        )}
        {banner === 'pending' && (
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-900 font-nunito font-bold flex items-center gap-2">
            <AlertCircle size={20} /> Your payment is pending confirmation. Your subscription will activate once it clears.
          </div>
        )}
        {error && (
          <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 text-rose-700 font-nunito font-bold flex items-center gap-2">
            <AlertCircle size={20} /> {error}
          </div>
        )}

        {premium && (
          <div className="rounded-3xl border-2 border-emerald-300 border-b-4 border-emerald-400 bg-emerald-50 p-5 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-[#047857]">
              <InfinityIcon size={24} />
            </div>
            <div className="flex-1">
              <p className="text-[#1d2445] font-black font-nunito text-base">You have unlimited hearts</p>
              <p className="text-slate-600 font-bold font-nunito text-xs">Keep learning at your own pace without limits!</p>
            </div>
          </div>
        )}

        {/* Benefits Card */}
        <div className="bg-white border-2 border-slate-200 border-b-4 border-slate-300 rounded-3xl p-6 shadow-sm">
          <h2 className="text-[#1d2445] font-black text-lg font-nunito mb-4">What you get</h2>
          <ul className="space-y-3">
            {[
              [Heart, `Unlimited hearts. Free accounts get ${plans.free_hearts} and wait for them to recharge.`],
              [InfinityIcon, 'Never get stopped in the middle of a lesson.'],
              [Users, 'One subscription covers every child on your account.'],
            ].map(([Icon, text], i) => {
              const I = Icon as typeof Heart
              return (
                <li key={i} className="flex items-center gap-3.5 text-slate-700 font-nunito font-bold text-sm">
                  <span className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0 border border-purple-200">
                    <I size={18} />
                  </span>
                  <span>{text as string}</span>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Plans Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[monthly, yearly].map(p => p && (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`text-left rounded-3xl border-2 p-6 transition-all relative ${
                selected === p.id
                  ? 'border-[#10b981] border-b-4 border-b-[#059669] bg-emerald-50 shadow-md'
                  : 'border-slate-200 border-b-4 border-b-slate-300 bg-white hover:bg-slate-50 shadow-sm'
              }`}
            >
              {p.id === 'yearly' && yearSaving > 0 && (
                <span className="absolute -top-3 right-4 bg-[#facc15] text-[#1d2445] text-xs font-black font-nunito px-3 py-0.5 rounded-full border border-amber-300 shadow-sm">
                  Save {yearSaving}%
                </span>
              )}
              <p className="text-[#1d2445] font-black font-nunito text-lg">{p.name}</p>
              <p className="text-[#10b981] font-black font-nunito text-3xl mt-1">
                {p.espees} <span className="text-sm font-extrabold">ESPEES</span>
              </p>
              <p className="text-slate-600 font-bold font-nunito text-xs mt-1">or {fmtNaira(getPlanNgn(p))} by card</p>
              <p className="text-slate-400 font-bold font-nunito text-xs mt-3">{p.days} days access</p>
            </button>
          ))}
        </div>

        {/* Payment Action */}
        {chosen && (
          <div className="space-y-3 pt-2">
            <button
              disabled={!!busy || !plans.gateways.espees}
              onClick={() => pay('espees')}
              className="w-full py-4 px-6 bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-white font-black font-nunito text-base rounded-2xl border-b-4 border-[#047857] shadow-sm flex items-center justify-center gap-2.5 transition-all active:translate-y-0.5 cursor-pointer disabled:cursor-not-allowed"
            >
              {busy === 'espees' ? <Spinner size={20} color="#ffffff" /> : <Wallet size={20} />}
              <span>Pay {chosen.espees} ESPEES</span>
            </button>

            <button
              disabled={!!busy || !plans.gateways.kingspay}
              onClick={() => pay('kingspay')}
              className="w-full py-4 px-6 bg-white hover:bg-slate-50 border-2 border-slate-200 border-b-4 border-slate-300 text-[#1d2445] font-black font-nunito text-base rounded-2xl shadow-sm flex items-center justify-center gap-2.5 transition-all active:translate-y-0.5 cursor-pointer disabled:cursor-not-allowed"
            >
              {busy === 'kingspay' ? <Spinner size={20} color="#1d2445" /> : <CreditCard size={20} />}
              <span>Pay {fmtNaira(getPlanNgn(chosen))} by Card</span>
            </button>
          </div>
        )}

      </div>
    </PageWrapper>
  )
}
