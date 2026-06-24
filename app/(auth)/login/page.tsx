'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock } from 'lucide-react'
import { api } from '@/lib/api'
import { saveToken } from '@/lib/auth'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Pip } from '@/components/mascot/Pip'
import { SpeechBubble } from '@/components/mascot/SpeechBubble'
import { toast } from '@/components/ui/Toast'

const schema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(6, 'At least 6 characters'),
})
type Form = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const setChild = useAppStore((s) => s.setChild)
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: Form) => {
    setLoading(true)
    setAuthError(null)
    try {
      const res = await api.auth.login(data.email, data.password)
      saveToken(res.token)
      if (res.user?.role === 'admin') {
        router.push('/admin')
        return
      }
      if (res.child) {
        setChild({
          id: String(res.child.id),
          user_id: '',
          name: res.child.name,
          age: res.child.age,
          avatar_seed: res.child.avatar_seed ?? 'default',
          created_at: '',
        })
        router.push('/dashboard')
      } else {
        router.push('/onboarding')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      setAuthError(msg)
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-end gap-4 mb-8 justify-center">
          <Pip size="md" mood="happy" animate="idle" />
          <SpeechBubble text="Welcome back! Great to see you!" />
        </div>

        <div className="bg-[#252b3b] rounded-3xl p-8 border border-white/5">
          <h1 className="text-2xl font-extrabold text-white mb-6 font-nunito text-center">Sign In</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="parent@example.com"
              leftIcon={<Mail size={16} />}
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock size={16} />}
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" fullWidth size="lg" loading={loading} className="mt-2">
              Sign In
            </Button>
          </form>

          {authError && (
            <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3">
              <p className="text-red-300 text-sm font-nunito leading-relaxed">{authError}</p>
            </div>
          )}

          <p className="text-center text-slate-400 text-sm mt-6 font-nunito">
            No account?{' '}
            <Link href="/register" className="text-[#4ade80] font-bold hover:underline">
              Create one free
            </Link>
          </p>
        </div>

        <Link href="/" className="block text-center text-slate-500 text-sm mt-4 hover:text-slate-300 transition-colors font-nunito">
          Back to home
        </Link>
      </div>
    </div>
  )
}
