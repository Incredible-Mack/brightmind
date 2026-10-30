'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock, User, Sparkles, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api'
import { saveToken } from '@/lib/auth'
import { Input } from '@/components/ui/Input'
import { Pip } from '@/components/mascot/Pip'
import { toast } from '@/components/ui/Toast'

const schema = z.object({
  name:     z.string().min(2, 'Name required'),
  email:    z.string().email('Invalid email'),
  password: z.string().min(6, 'At least 6 characters'),
  confirm:  z.string(),
}).refine(d => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })
type Form = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: Form) => {
    setLoading(true)
    try {
      const res = await api.auth.register(data.email, data.password, data.name)
      saveToken(res.token)
      router.push('/onboarding')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#201c4d] flex flex-col justify-between relative overflow-hidden font-nunito selection:bg-amber-300 selection:text-slate-900">
      
      {/* Soft Purple Cloud Puffs in Twilight Sky */}
      <div className="absolute top-10 left-12 w-36 h-18 bg-[#2e2968] rounded-full pointer-events-none opacity-80" />
      <div className="absolute top-8 right-16 w-48 h-22 bg-[#2e2968] rounded-full pointer-events-none opacity-75" />

      {/* Header with Pink Pill Logo */}
      <header className="p-6 relative z-20 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-[#f43f5e] hover:bg-[#e11d48] px-4 py-2 rounded-2xl flex items-center gap-2 shadow-md shadow-pink-950/40 transition-transform group-hover:scale-105 border-2 border-white/20">
            <Sparkles size={18} className="text-white" />
            <span className="font-black text-xl tracking-tight text-white">Bright Steps</span>
          </div>
        </Link>
        <Link href="/login" className="text-white/80 hover:text-amber-300 font-black text-sm transition-colors">
          Already registered? <span className="text-[#facc15] underline ml-1">Sign In</span>
        </Link>
      </header>

      {/* Main Form Center */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-20">
        <div className="w-full max-w-md">
          
          {/* Mascot Greeting */}
          <div className="flex items-end justify-center gap-3 mb-6">
            <Pip size="md" mood="excited" animate="idle" />
            <div className="bg-white text-slate-800 rounded-2xl px-4 py-2.5 shadow-xl border-2 border-white relative text-xs font-black">
              <span>Let&apos;s get you started! It only takes 60s 🌟</span>
              <div className="absolute -bottom-1.5 left-4 w-3 h-3 bg-white rotate-45" />
            </div>
          </div>

          {/* Crisp White Card */}
          <div className="bg-white rounded-3xl p-8 border-2 border-white shadow-2xl">
            <h1 className="text-2xl sm:text-3xl font-black text-[#1d2445] mb-2 font-nunito text-center tracking-tight">
              Create Free Account
            </h1>
            <p className="text-slate-500 font-bold text-xs sm:text-sm text-center mb-6">
              100% free to begin · Zero ads · Safe for kids
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <Input
                label="Parent Name"
                type="text"
                placeholder="Jane Smith"
                leftIcon={<User size={16} />}
                error={errors.name?.message}
                {...register('name')}
              />
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
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock size={16} />}
                error={errors.confirm?.message}
                {...register('confirm')}
              />

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-black text-base py-3.5 px-6 rounded-2xl shadow-md transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Creating Account...' : 'Start Learning Free'}</span>
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <p className="text-center text-slate-500 text-xs mt-6 font-bold">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-600 font-black hover:underline">
                Sign In
              </Link>
            </p>
          </div>

        </div>
      </div>

      {/* Undulating Rolling Green Hills SVG at bottom */}
      <div className="w-full leading-none relative z-10 -mt-8">
        <svg
          viewBox="0 0 1440 140"
          preserveAspectRatio="none"
          className="w-full h-20 sm:h-28 block"
        >
          <path d="M 0 50 Q 400 10 850 45 T 1440 30 L 1440 140 L 0 140 Z" fill="#1e6b37" />
          <path d="M 0 75 Q 420 35 900 65 T 1440 45 L 1440 140 L 0 140 Z" fill="#2ea84e" />
          <g transform="translate(240, 78)">
            <circle cx="0" cy="0" r="5" fill="#ffffff" />
            <circle cx="0" cy="0" r="2" fill="#facc15" />
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
