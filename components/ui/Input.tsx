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
      <label className="block text-xs font-black text-slate-700 mb-1.5 font-nunito tracking-wider uppercase">
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
          w-full bg-[#f8fafc] border-2 border-slate-200 border-b-4 border-slate-300 focus:bg-white focus:border-[#0284c7] rounded-2xl px-4 py-3 text-[#1d2445] placeholder-slate-400 font-bold shadow-xs
          font-nunito text-base outline-none transition-all min-h-[44px]
          focus:ring-2 focus:ring-[#0284c7]/20
          ${error ? 'border-red-500' : ''}
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
