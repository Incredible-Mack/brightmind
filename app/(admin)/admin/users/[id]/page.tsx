'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Shield, Trash2 } from 'lucide-react'
import { adminApi, type AdminUserDetail } from '@/lib/adminApi'
import { Spinner } from '@/components/ui/Spinner'

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [user, setUser] = useState<AdminUserDetail | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => adminApi.users.get(Number(id)).then(setUser).catch(e => setError((e as Error).message))
  useEffect(() => { load() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return <div className="flex justify-center py-24">{error ? <p className="text-red-400 font-nunito text-sm">{error}</p> : <Spinner size={36} />}</div>

  const changeRole = async () => {
    const next = user.role === 'admin' ? 'parent' : 'admin'
    if (!confirm(`Make ${user.email} ${next === 'admin' ? 'an admin (full access to this panel)' : 'a regular parent'}?`)) return
    setBusy(true); setError('')
    try { await adminApi.users.setRole(user.id, next); await load() } catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }

  const remove = async () => {
    if (!confirm(`Delete ${user.email} and ALL of their children and progress? This cannot be undone.`)) return
    setBusy(true); setError('')
    try { await adminApi.users.remove(user.id); router.push('/admin/users') } catch (e) { setError((e as Error).message); setBusy(false) }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/admin/users" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-nunito mb-5"><ArrowLeft size={15} /> All users</Link>

      <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-6 mb-6 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-extrabold text-white font-nunito truncate">{user.email}</h1>
          <p className="text-slate-500 font-nunito text-xs">{user.name ?? 'No name'} · joined {user.created_at.slice(0, 10)} · {user.role === 'admin' ? 'Admin' : 'Parent'}</p>
        </div>
        <button onClick={changeRole} disabled={busy} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/15 text-purple-300 font-nunito font-bold text-sm disabled:opacity-40">
          <Shield size={15} /> {user.role === 'admin' ? 'Remove admin' : 'Make admin'}
        </button>
        <button onClick={remove} disabled={busy} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/15 text-red-300 font-nunito font-bold text-sm disabled:opacity-40">
          <Trash2 size={15} /> Delete account
        </button>
      </div>
      {error && <p className="text-red-400 font-nunito text-sm mb-4">{error}</p>}

      <h2 className="text-white font-nunito font-bold text-base mb-3">Children ({user.children.length})</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {user.children.map(c => (
          <Link key={c.id} href={`/admin/children/${c.id}`} className="bg-[#1a1f2e] border border-white/5 hover:border-[#4ade80]/40 rounded-2xl p-5 transition-colors">
            <p className="text-white font-nunito font-bold">{c.name} <span className="text-slate-500 font-normal text-sm">· age {c.age}</span></p>
            <p className="text-slate-500 font-nunito text-xs mb-3">Group {c.age_group ?? '—'} · last active {c.last_active ? c.last_active.slice(0, 10) : 'never'}</p>
            <div className="flex gap-4 text-xs font-nunito text-slate-300"><span>{c.xp ?? 0} XP</span><span>Level {c.level ?? 1}</span><span>{c.streak ?? 0}-day streak</span><span>{c.lessons_completed} lessons</span></div>
          </Link>
        ))}
        {user.children.length === 0 && <p className="text-slate-500 font-nunito text-sm">No children on this account.</p>}
      </div>
    </div>
  )
}
