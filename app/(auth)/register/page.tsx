'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock, User } from 'lucide-react'
import { api } from '@/lib/api'
import { saveToken } from '@/lib/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Pip } from '@/components/mascot/Pip'
import { SpeechBubble } from '@/components/mascot/SpeechBubble'
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
    <div className="min-h-screen bg-[#1a1f2e] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-end gap-4 mb-8 justify-center">
          <Pip size="md" mood="excited" animate="idle" />
          <SpeechBubble text="Let's get you started! It only takes a minute." />
        </div>

        <div className="bg-[#252b3b] rounded-3xl p-8 border border-white/5">
          <h1 className="text-2xl font-extrabold text-white mb-6 font-nunito text-center">Create Account</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Your Name"
              type="text"
              placeholder="Jane Smith"
              leftIcon={<User size={16} />}
              error={errors.name?.message}
              {...register('name')}
            />
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
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock size={16} />}
              error={errors.confirm?.message}
              {...register('confirm')}
            />
            <Button type="submit" fullWidth size="lg" loading={loading} className="mt-2">
              Create Account
            </Button>
          </form>
          <p className="text-center text-slate-400 text-sm mt-6 font-nunito">
            Already have an account?{' '}
            <Link href="/login" className="text-[#4ade80] font-bold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
