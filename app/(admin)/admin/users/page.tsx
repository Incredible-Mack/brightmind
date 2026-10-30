'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, ChevronLeft, ChevronRight, Shield } from 'lucide-react'
import { adminApi, type AdminUser } from '@/lib/adminApi'
import { Spinner } from '@/components/ui/Spinner'

export default function UsersPage() {
  const [items, setItems] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [per, setPer] = useState(25)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await adminApi.users.list({ search: search || undefined, role: role || undefined, page })
      setItems(res.items); setTotal(res.total); setPer(res.per_page)
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [search, role, page])

  // Small delay so typing in the search box does not fire a request per key
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t) }, [load])

  const pages = Math.max(1, Math.ceil(total / per))

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white font-nunito">Users & Children</h1>
        <p className="text-slate-400 font-nunito text-xs">{total} account{total === 1 ? '' : 's'}. Open one to see their children and learning progress.</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search by email or name"
            className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white font-nunito text-sm" />
        </div>
        <select value={role} onChange={e => { setRole(e.target.value); setPage(1) }}
          className="bg-[#1a1f2e] border border-white/10 rounded-xl px-3 py-2.5 text-white font-nunito text-sm">
          <option value="">All roles</option><option value="parent">Parents</option><option value="admin">Admins</option>
        </select>
      </div>

      {error && <p className="text-red-400 font-nunito text-sm mb-3">{error}</p>}

      <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-sm font-nunito">
          <thead><tr className="text-slate-500 text-xs text-left border-b border-white/5">
            <th className="px-4 py-3">Account</th><th className="px-3">Role</th><th className="px-3">Children</th><th className="px-3">Last activity</th><th className="px-3">Joined</th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="py-10 text-center"><Spinner size={24} /></td></tr>}
            {!loading && items.map(u => (
              <tr key={u.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                <td className="px-4 py-3"><Link href={`/admin/users/${u.id}`} className="text-white font-semibold hover:text-[#4ade80]">{u.email}</Link>{u.name && <p className="text-slate-500 text-xs">{u.name}</p>}</td>
                <td className="px-3">{u.role === 'admin' ? <span className="inline-flex items-center gap-1 text-purple-300 text-xs font-bold"><Shield size={12} /> Admin</span> : <span className="text-slate-400 text-xs">Parent</span>}</td>
                <td className="px-3 text-slate-300">{u.children}</td>
                <td className="px-3 text-slate-400 text-xs">{u.last_activity ? u.last_activity.slice(0, 16) : 'Never'}</td>
                <td className="px-3 text-slate-500 text-xs">{u.created_at.slice(0, 10)}</td>
              </tr>
            ))}
            {!loading && items.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-500">No accounts match.</td></tr>}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5 text-slate-300 font-nunito text-sm">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg bg-white/5 disabled:opacity-30"><ChevronLeft size={16} /></button>
          Page {page} of {pages}
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg bg-white/5 disabled:opacity-30"><ChevronRight size={16} /></button>
        </div>
      )}
    </div>
  )
}
