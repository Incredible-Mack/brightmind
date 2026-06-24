'use client'
import { motion } from 'framer-motion'

interface PageWrapperProps { children: React.ReactNode; className?: string }

export function PageWrapper({ children, className = '' }: PageWrapperProps) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`min-h-screen pb-20 sm:pb-8 ${className}`}
    >
      {children}
    </motion.main>
  )
}
