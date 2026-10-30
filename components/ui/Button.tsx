'use client'
import { ButtonHTMLAttributes, forwardRef } from 'react'
import { motion } from 'framer-motion'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
type Size = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary:   'bg-[#4ade80] hover:bg-[#22c55e] text-[#0f1117] font-extrabold shadow-lg shadow-green-900/30',
  secondary: 'bg-white hover:bg-slate-50 text-[#1d2445] font-black border-2 border-slate-200 border-b-4 border-slate-300 shadow-sm',
  danger:    'bg-[#ef4444] hover:bg-red-600 text-white font-bold',
  ghost:     'bg-transparent hover:bg-white/10 text-slate-300 font-semibold',
  outline:   'bg-transparent border-2 border-[#22c55e] text-[#4ade80] hover:bg-[#22c55e]/10 font-bold',
}

const sizes: Record<Size, string> = {
  sm:  'px-4 py-2 text-sm rounded-xl min-h-[36px]',
  md:  'px-6 py-3 text-base rounded-2xl min-h-[44px]',
  lg:  'px-8 py-4 text-lg rounded-2xl min-h-[52px]',
  xl:  'px-10 py-5 text-xl rounded-3xl min-h-[60px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className = '',
  children,
  disabled,
  ...props
}, ref) => {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.1 }}
      className={`
        inline-flex items-center justify-center gap-2 transition-colors duration-150
        font-nunito tracking-wide select-none
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
        ${variants[variant]} ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...(props as any)}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      )}
      {children}
    </motion.button>
  )
})
Button.displayName = 'Button'
