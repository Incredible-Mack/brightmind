'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TooltipProps { children: React.ReactNode; content: string }

export function Tooltip({ children, content }: TooltipProps) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#1a1f2e] border border-white/10 text-white text-xs rounded-xl px-3 py-1.5 whitespace-nowrap z-50 pointer-events-none font-nunito shadow-xl"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
