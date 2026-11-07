'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api'
import { saveToken } from '@/lib/auth'
import { useAppStore } from '@/store/useAppStore'
import { Input } from '@/components/ui/Input'
import { Pip } from '@/components/mascot/Pip'
import { toast } from '@/components/ui/Toast'
import { AnimatedSun, DoodleCloud, DoodleStar } from '@/components/home/KidsDoodles'

const schema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(6, 'At least 6 characters'),
})
type Form = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const setChild = useAppStore((s) => s.setChild)
  const hydrateProfile = useAppStore((s) => s.hydrateProfile)
  const setPremium = useAppStore((s) => s.setPremium)
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: Form) => {
    setLoading(true)
    setAuthError(null)
    try {
      const res = await api.auth.login(data.email, data.password)
      saveToken(res.token)
      setPremium(!!res.user?.is_premium, res.user?.premium_until ?? null)
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
        hydrateProfile(res.child)
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
    <div className="min-h-screen bg-gradient-to-b from-[#e0f2fe] via-[#f0f9ff] to-[#fffdf8] flex flex-col justify-between relative overflow-hidden font-nunito selection:bg-amber-300 selection:text-slate-900">
      
      {/* Friendly Sun & Floating Clouds in Sunny Daytime Sky */}
      <div className="absolute top-4 left-6 sm:left-12 w-20 h-20 sm:w-28 sm:h-28 pointer-events-none opacity-90 z-0">
        <AnimatedSun />
      </div>
      <DoodleCloud className="absolute top-10 left-20 sm:left-32 w-32 sm:w-44 h-16 sm:h-20 opacity-70 z-0" delay={0} />
      <DoodleCloud className="absolute top-8 right-10 sm:right-24 w-40 sm:w-52 h-20 sm:h-24 opacity-80 z-0" delay={1.5} />
      <DoodleStar className="absolute top-32 left-1/4 w-7 h-7 opacity-60 z-0" />
      <DoodleStar className="absolute top-24 right-1/4 w-8 h-8 opacity-60 z-0" />

      {/* Header with Official Bright Steps Logo & Nav */}
      <header className="p-4 sm:p-6 relative z-20 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] border-2 border-white shadow-md flex items-center justify-center text-2xl transition-transform group-hover:scale-105">
            📖
          </div>
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-black text-[#0f4c5c] tracking-tight leading-none group-hover:text-[#0284c7] transition-colors">
              Bright Steps
            </span>
            <span className="text-[10px] sm:text-[11px] font-black text-[#0284c7] tracking-wider uppercase mt-0.5">
              Imagine • Discover • Grow
            </span>
          </div>
        </Link>
        <Link href="/register" className="text-slate-600 hover:text-[#0284c7] font-black text-sm transition-colors">
          Need an account? <span className="text-[#0284c7] underline ml-1">Register Free</span>
        </Link>
      </header>

      {/* Main Form Center */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative z-20">
        <div className="w-full max-w-md">
          
          {/* Mascot Greeting */}
          <div className="flex items-end justify-center gap-3 mb-5">
            <Pip size="md" mood="happy" animate="idle" />
            <div className="bg-white text-slate-800 rounded-2xl px-4 py-2.5 shadow-md border-2 border-[#bae6fd] relative text-xs font-black">
              <span>Welcome back! Ready for adventure? 🌟</span>
              <div className="absolute -bottom-1.5 left-4 w-3 h-3 bg-white border-b-2 border-r-2 border-[#bae6fd] rotate-45" />
            </div>
          </div>

          {/* Crisp White Card matching Brand Theme */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#bae6fd] border-b-[6px] border-b-[#7dd3fc] shadow-xl shadow-sky-100/50">
            <h1 className="text-2xl sm:text-3xl font-black text-[#0f4c5c] mb-1.5 font-nunito text-center tracking-tight">
              Sign In to Bright Steps
            </h1>
            <p className="text-slate-500 font-bold text-xs sm:text-sm text-center mb-6">
              Continue your child&apos;s joyful learning journey
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <Input
                label="Email Address"
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

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full bg-[#10b981] hover:bg-[#059669] text-white font-black text-base py-3.5 px-6 rounded-2xl shadow-md border-b-4 border-b-[#047857] transition-all hover:scale-[1.01] active:translate-y-1 active:border-b-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <span>{loading ? 'Signing In...' : 'Sign In'}</span>
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            {authError && (
              <div className="mt-4 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3">
                <p className="text-rose-700 text-xs font-bold leading-relaxed">{authError}</p>
              </div>
            )}

            <p className="text-center text-slate-500 text-xs mt-6 font-bold">
              New to Bright Steps?{' '}
              <Link href="/register" className="text-[#0284c7] font-black hover:underline">
                Create a Free Account
              </Link>
            </p>
          </div>

        </div>
      </div>

      {/* Rolling Green Hills SVG at bottom with cheerful daisies */}
      <div className="w-full leading-none relative z-10 -mt-6">
        <svg
          viewBox="0 0 1440 140"
          preserveAspectRatio="none"
          className="w-full h-20 sm:h-28 block"
        >
          <path d="M 0 50 Q 400 10 850 45 T 1440 30 L 1440 140 L 0 140 Z" fill="#86efac" opacity="0.6" />
          <path d="M 0 75 Q 420 35 900 65 T 1440 45 L 1440 140 L 0 140 Z" fill="#22c55e" />
          <g transform="translate(240, 78)">
            <circle cx="0" cy="0" r="5" fill="#ffffff" />
            <circle cx="0" cy="0" r="2" fill="#facc15" />
          </g>
          <g transform="translate(680, 85)">
            <circle cx="0" cy="0" r="4" fill="#ffffff" />
            <circle cx="0" cy="0" r="1.8" fill="#facc15" />
          </g>
          <g transform="translate(1200, 68)">
            <circle cx="0" cy="0" r="5" fill="#ffffff" />
            <circle cx="0" cy="0" r="2" fill="#facc15" />
          </g>
        </svg>
      </div>

    </div>
  )
}
