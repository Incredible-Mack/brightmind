'use client'
import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Gift, Ban, Save } from 'lucide-react'
import { adminApi, type AdminBilling } from '@/lib/adminApi'
import { Spinner } from '@/components/ui/Spinner'

export default function BillingPage() {
  const [data, setData] = useState<AdminBilling | null>(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [form, setForm] = useState<Record<string, number>>({})
  const [grantEmail, setGrantEmail] = useState('')
  const [grantDays, setGrantDays] = useState(30)
  const [grantNote, setGrantNote] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try { const d = await adminApi.billing.get(); setData(d); setForm(d.settings) } catch (e) { setError((e as Error).message) }
  }, [])
  useEffect(() => { load() }, [load])

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true); setError(''); setInfo('')
    try { await fn(); setInfo(ok); await load() } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }

  if (!data) return <div className="flex justify-center py-24">{error ? <p className="text-red-400 font-nunito text-sm">{error}</p> : <Spinner size={36} />}</div>

  const field = 'w-full bg-[#252b3b] border border-white/10 focus:border-[#4ade80] rounded-xl px-3 py-2.5 text-white font-nunito text-sm outline-none'
  const num = (k: string) => (
    <input type="number" min={0} step="any" className={field} value={form[k] ?? 0} onChange={e => setForm({ ...form, [k]: Number(e.target.value) })} />
  )

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white font-nunito">Plans & Billing</h1>
        <p className="text-slate-400 font-nunito text-xs">Free accounts have hearts; premium accounts have unlimited hearts. Payments use the same ESPEES and KingsPay accounts as the books site.</p>
      </div>
      {error && <p className="text-red-400 font-nunito text-sm mb-3">{error}</p>}
      {info && <p className="text-[#4ade80] font-nunito text-sm mb-3">{info}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-4"><p className="text-slate-400 font-nunito text-xs">Premium accounts</p><p className="text-white font-extrabold font-nunito text-2xl">{data.totals.premium_accounts}</p><p className="text-slate-500 text-[11px] font-nunito">of {data.totals.parents} parents</p></div>
        <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-4"><p className="text-slate-400 font-nunito text-xs">Waiting on payment</p><p className="text-white font-extrabold font-nunito text-2xl">{data.totals.pending}</p></div>
        {data.revenue.map(r => (
          <div key={r.currency} className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-4"><p className="text-slate-400 font-nunito text-xs">Paid in {r.currency}</p><p className="text-white font-extrabold font-nunito text-2xl">{Number(r.total).toLocaleString()}</p><p className="text-slate-500 text-[11px] font-nunito">{r.payments} payment{r.payments === 1 ? '' : 's'}</p></div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-5 space-y-4">
          <h2 className="text-white font-nunito font-bold text-sm">Payment connections</h2>
          {(['espees', 'kingspay'] as const).map(g => (
            <div key={g} className="flex items-center gap-2 text-sm font-nunito">
              {data.gateways[g] ? <CheckCircle2 size={16} className="text-[#4ade80]" /> : <XCircle size={16} className="text-red-400" />}
              <span className="text-slate-200 font-semibold">{g === 'espees' ? 'ESPEES wallet' : 'KingsPay card'}</span>
              <span className="text-slate-500 text-xs">{data.gateways[g] ? 'keys found' : 'keys not set'}</span>
            </div>
          ))}
          {(!data.gateways.espees || !data.gateways.kingspay) && (
            <p className="text-yellow-300/90 font-nunito text-xs leading-relaxed">
              Copy the keys from <code>books/php/config.php</code> into a new file <code>brightmindapi/payment_config.local.php</code> (the file explains the three lines). Keys are never shown here.
            </p>
          )}
        </div>

        <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-5 space-y-3">
          <h2 className="text-white font-nunito font-bold text-sm">Prices and hearts</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-slate-400 font-nunito text-xs mb-1">Monthly price (ESPEES)</p>{num('plan_monthly_espees')}</div>
            <div><p className="text-slate-400 font-nunito text-xs mb-1">Yearly price (ESPEES)</p>{num('plan_yearly_espees')}</div>
            <div><p className="text-slate-400 font-nunito text-xs mb-1">Naira per ESPEES</p>{num('esp_to_ngn')}</div>
            <div><p className="text-slate-400 font-nunito text-xs mb-1">Hearts for free accounts</p>{num('free_hearts')}</div>
          </div>
          <p className="text-slate-500 font-nunito text-xs">Card price = ESPEES price × rate: monthly ₦{Math.round((form.plan_monthly_espees ?? 0) * (form.esp_to_ngn ?? 0)).toLocaleString()}, yearly ₦{Math.round((form.plan_yearly_espees ?? 0) * (form.esp_to_ngn ?? 0)).toLocaleString()}.</p>
          <button disabled={busy} onClick={() => run(() => adminApi.billing.saveSettings(form), 'Saved.')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4ade80] text-[#0f1117] font-nunito font-extrabold text-sm disabled:opacity-50"><Save size={15} /> Save</button>
        </div>
      </div>

      <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-5 mb-6">
        <h2 className="text-white font-nunito font-bold text-sm mb-3 flex items-center gap-2"><Gift size={15} className="text-purple-300" /> Give premium (a gift, or a payment you received another way)</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]"><p className="text-slate-400 font-nunito text-xs mb-1">Parent email</p><input className={field} value={grantEmail} onChange={e => setGrantEmail(e.target.value)} placeholder="parent@example.com" /></div>
          <div className="w-28"><p className="text-slate-400 font-nunito text-xs mb-1">Days</p><input type="number" min={1} className={field} value={grantDays} onChange={e => setGrantDays(Number(e.target.value))} /></div>
          <div className="flex-1 min-w-[160px]"><p className="text-slate-400 font-nunito text-xs mb-1">Note</p><input className={field} value={grantNote} onChange={e => setGrantNote(e.target.value)} placeholder="Why" /></div>
          <button disabled={busy || !grantEmail.trim()} onClick={() => run(() => adminApi.billing.grant(grantEmail.trim(), grantDays, grantNote), 'Premium added.')} className="px-4 py-2.5 rounded-xl bg-purple-500/20 text-purple-200 font-nunito font-bold text-sm disabled:opacity-40">Give premium</button>
        </div>
      </div>

      <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl overflow-x-auto">
        <table className="w-full text-xs font-nunito">
          <thead><tr className="text-slate-500 text-left border-b border-white/5"><th className="px-4 py-3">Account</th><th>Plan</th><th>Paid</th><th>Status</th><th>Ends</th><th></th></tr></thead>
          <tbody>
            {data.subscriptions.map(s => (
              <tr key={s.id} className="border-t border-white/5 text-slate-300">
                <td className="px-4 py-2.5">{s.email}{s.note && <p className="text-slate-600">{s.note}</p>}</td>
                <td className="capitalize">{s.plan}</td>
                <td>{s.gateway === 'admin' ? 'Gift' : `${Number(s.amount).toLocaleString()} ${s.currency}`}</td>
                <td className={s.active ? 'text-[#4ade80]' : s.status === 'pending' ? 'text-yellow-300' : 'text-slate-500'}>{s.active ? 'Active' : s.status}</td>
                <td>{s.expires_at ? s.expires_at.slice(0, 10) : '—'}</td>
                <td className="pr-4">{s.active && <button onClick={() => confirm('End this subscription now?') && run(() => adminApi.billing.revoke(s.id), 'Ended.')} className="text-red-300 hover:text-red-200 flex items-center gap-1"><Ban size={12} /> End</button>}</td>
              </tr>
            ))}
            {data.subscriptions.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-slate-500">No subscriptions yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
