'use client'
import { HTMLAttributes } from 'react'
import { motion } from 'framer-motion'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  glow?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddings = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' }

export function Card({ hover = false, glow, padding = 'md', className = '', children, ...props }: CardProps) {
  const base = `bg-white rounded-3xl border-2 border-slate-200 border-b-4 border-slate-300 shadow-sm text-slate-800 ${paddings[padding]} ${className}`
  if (hover) {
    return (
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ duration: 0.2 }}
        className={`${base} cursor-pointer transition-all hover:border-slate-300 hover:shadow-md`}
        {...(props as any)}
      >
        {children}
      </motion.div>
    )
  }
  return <div className={base} {...props}>{children}</div>
}
