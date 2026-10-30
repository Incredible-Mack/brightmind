'use client'
import { motion } from 'framer-motion'

interface PageWrapperProps {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'full'
}

export function PageWrapper({ children, className = '', size = 'lg' }: PageWrapperProps) {
  const maxWidthClass = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    full: 'max-w-7xl',
  }[size]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`min-h-[calc(100vh-160px)] ${maxWidthClass} mx-auto px-6 sm:px-8 lg:px-12 py-8 sm:py-10 pb-24 ${className}`}
    >
      {children}
    </motion.div>
  )
}
