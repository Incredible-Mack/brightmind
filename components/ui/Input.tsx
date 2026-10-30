'use client'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label, error, leftIcon, className = '', ...props
}, ref) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-semibold text-slate-300 mb-2 font-nunito tracking-wide uppercase">
        {label}
      </label>
    )}
    <div className="relative">
      {leftIcon && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{leftIcon}</span>
      )}
      <input
        ref={ref}
        className={`
          w-full bg-white border-2 border-slate-300 border-b-4 border-slate-400 focus:border-[#10b981] rounded-2xl px-4 py-3 text-[#1d2445] placeholder-slate-400 font-bold shadow-xs
          font-nunito text-base outline-none transition-all min-h-[44px]
          focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20
          ${error ? 'border-red-500' : 'border-white/10'}
          ${leftIcon ? 'pl-11' : ''}
          ${className}
        `}
        {...props}
      />
    </div>
    {error && <p className="mt-1 text-sm text-red-400 font-nunito">{error}</p>}
  </div>
))
Input.displayName = 'Input'
