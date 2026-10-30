'use client'
import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { getToken } from '@/lib/auth'
import { Spinner } from '@/components/ui/Spinner'

// The admin API already refuses non-admins; this keeps everyone else from seeing a broken admin shell.
export function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [ok, setOk] = useState(false)

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return }
    api.auth.me()
      .then(res => { if (res.user?.role === 'admin') setOk(true); else router.replace('/dashboard') })
      .catch(() => router.replace('/login'))
  }, [router])

  if (!ok) return <div className="min-h-screen flex items-center justify-center bg-[#13161f]"><Spinner size={36} /></div>
  return <>{children}</>
}
