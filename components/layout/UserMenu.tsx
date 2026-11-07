'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronDown, User, Trophy, Users, Crown, Shield, LogOut, Infinity as InfinityIcon, Film } from 'lucide-react'
import { api } from '@/lib/api'
import { getToken } from '@/lib/auth'
import { signOut } from '@/lib/session'
import { useAppStore } from '@/store/useAppStore'
import { getLevelFromXP } from '@/types/child'
import { Avatar } from '@/components/ui/Avatar'

const fmtDate = (iso: string) => new Date(iso.replace(' ', 'T')).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

// The avatar in the top bar opens this: who is learning, quick links, upgrade, admin, log out.
export function UserMenu() {
  const router = useRouter()
  const pathname = usePathname()
  const { child, setChild, user, xp, premium, premiumUntil, setUser, setPremium } = useAppStore()
  const [open, setOpen] = useState(false)
  const [childrenList, setChildrenList] = useState<any[]>([])
  const wrapRef = useRef<HTMLDivElement>(null)

  // Learn who the signed-in parent is (role, email, premium), so the menu always shows the right things
  useEffect(() => {
    if (!getToken()) return
    api.auth.me().then(res => {
      if (res.user) {
        setUser({ id: Number(res.user.id), email: res.user.email, role: res.user.role === 'admin' ? 'admin' : 'parent' })
        setPremium(!!res.user.is_premium, res.user.premium_until ?? null)
      }
    }).catch(() => {})
  }, [setUser, setPremium])

  // Fetch children list to allow quick switching directly from the top menu
  useEffect(() => {
    if (!getToken()) return
    api.children.list().then(res => {
      if (Array.isArray(res)) setChildrenList(res)
    }).catch(() => {})
  }, [child])

  // Close on outside click, Escape, or navigation
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey) }
  }, [open])
  useEffect(() => { setOpen(false) }, [pathname])

  if (!child) return null
  const { level, name: levelName } = getLevelFromXP(xp)

  const item = 'flex items-center gap-3 px-4 py-2.5 text-sm font-nunito font-bold text-slate-700 hover:bg-purple-50 hover:text-purple-900 transition-colors'

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1 rounded-full pr-1.5 hover:bg-purple-50 transition-colors p-0.5 border border-purple-200/60"
      >
        <Avatar seed={child.avatar_seed} name={child.name} size={34} />
        <ChevronDown size={14} className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-72 rounded-3xl bg-white border border-purple-100 shadow-2xl shadow-purple-950/10 overflow-hidden z-50">
          <div className="px-4 py-4 flex items-center gap-3 bg-purple-50/70 border-b border-purple-100">
            <Avatar seed={child.avatar_seed} name={child.name} size={44} />
            <div className="min-w-0">
              <p className="text-slate-900 font-nunito font-black text-sm truncate">{child.name}</p>
              <p className="text-purple-700 font-nunito font-bold text-xs">Level {level} · {levelName}</p>
              {user?.email && <p className="text-slate-500 font-nunito text-[11px] truncate">{user.email}</p>}
            </div>
          </div>

          {childrenList.length > 1 && (
            <div className="px-3 py-2 bg-slate-50/80 border-b border-purple-100">
              <p className="text-[10px] font-black uppercase text-slate-500 mb-1.5 px-1 font-nunito tracking-wider">
                Switch Child Profile
              </p>
              <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                {childrenList.map(c => {
                  const isCurrent = Number(c.id) === Number(child.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        if (!isCurrent) {
                          setChild(c)
                          setOpen(false)
                        }
                      }}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-black font-nunito transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-purple-100 text-purple-900 border border-purple-300'
                          : 'hover:bg-purple-50 text-slate-700 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar seed={c.avatar_seed} name={c.name} size={22} />
                        <span className="truncate">{c.name}</span>
                      </div>
                      {isCurrent ? (
                        <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.5 rounded-full font-extrabold flex-shrink-0">Active</span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold flex-shrink-0">{c.xp ?? 0} XP</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="py-2">
            <Link role="menuitem" href="/profile" className={item}><User size={16} className="text-purple-500" /> My profile</Link>
            <Link role="menuitem" href="/achievements" className={item}><Trophy size={16} className="text-amber-500" /> Achievements</Link>
            <Link role="menuitem" href="/videos" className={item}><Film size={16} className="text-sky-500" /> Videos</Link>
            <Link role="menuitem" href="/parent" className={item}><Users size={16} className="text-indigo-500" /> Family and switch child</Link>
          </div>

          <div className="py-2 border-t border-purple-100">
            {premium ? (
              <Link role="menuitem" href="/upgrade" className={item}>
                <InfinityIcon size={16} className="text-emerald-500" />
                <span className="flex-1 font-bold">Unlimited hearts{premiumUntil && <span className="block text-[11px] font-normal text-slate-500">until {fmtDate(premiumUntil)}</span>}</span>
              </Link>
            ) : (
              <Link role="menuitem" href="/upgrade" className={`${item} text-emerald-600 font-black`}><Crown size={16} /> Go unlimited</Link>
            )}
            {user?.role === 'admin' && (
              <Link role="menuitem" href="/admin" className={item}><Shield size={16} className="text-purple-600" /> Admin panel</Link>
            )}
          </div>

          <div className="py-2 border-t border-purple-100">
            <button role="menuitem" onClick={() => signOut(router)} className={`${item} w-full text-left text-rose-600 hover:bg-rose-50`}>
              <LogOut size={16} /> Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
