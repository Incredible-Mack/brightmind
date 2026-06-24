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
  const base = `bg-[#252b3b] rounded-2xl border border-white/5 ${paddings[padding]} ${className}`
  if (hover) {
    return (
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ duration: 0.2 }}
        className={`${base} cursor-pointer transition-shadow ${glow ? `hover:shadow-lg hover:shadow-${glow}/20` : 'hover:border-white/20'}`}
        {...(props as any)}
      >
        {children}
      </motion.div>
    )
  }
  return <div className={base} {...props}>{children}</div>
}
