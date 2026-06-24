'use client'
import { motion } from 'framer-motion'

export type PipMood = 'happy' | 'thinking' | 'excited' | 'sad' | 'listening'
export type PipSize = 'sm' | 'md' | 'lg' | 'xl'

const sizeMap: Record<PipSize, number> = { sm: 64, md: 96, lg: 128, xl: 160 }

const idleAnim = {
  y: [0, -6, 0],
  transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
}

const correctAnim = {
  y: [0, -20, 0],
  rotate: [0, 360],
  transition: { duration: 0.6, ease: 'easeOut' },
}

const wrongAnim = {
  x: [0, -10, 10, -8, 8, -4, 4, 0],
  transition: { duration: 0.4, ease: 'easeInOut' },
}

interface PipProps {
  size?: PipSize
  mood?: PipMood
  animate?: 'idle' | 'correct' | 'wrong' | 'none'
  className?: string
}

export function Pip({ size = 'md', mood = 'happy', animate = 'idle', className = '' }: PipProps) {
  const px = sizeMap[size]

  const eyeSquint = mood === 'happy' || mood === 'excited'
  const eyeHalf = mood === 'thinking'
  const eyeSad = mood === 'sad'

  const anim = animate === 'idle' ? idleAnim
    : animate === 'correct' ? correctAnim
    : animate === 'wrong' ? wrongAnim
    : undefined

  return (
    <motion.div
      className={`inline-block ${className}`}
      style={{ width: px, height: px }}
      animate={anim as any}
    >
      <svg viewBox="0 0 100 120" width={px} height={px} xmlns="http://www.w3.org/2000/svg">
        {/* Body */}
        <ellipse cx="50" cy="55" rx="42" ry="44" fill="#4ade80" />
        {/* Shine */}
        <ellipse cx="36" cy="36" rx="10" ry="7" fill="white" opacity="0.25" transform="rotate(-20 36 36)" />

        {/* Left eye */}
        <ellipse cx="35" cy="48" rx="10" ry={eyeSquint ? 8 : eyeHalf ? 5 : eyeSad ? 7 : 9} fill="white" />
        <circle cx="37" cy={eyeSad ? 50 : 48} r="5" fill="#1a1f2e" />
        <circle cx="39" cy={eyeSad ? 48 : 46} r="2" fill="white" />

        {/* Right eye */}
        <ellipse cx="65" cy="48" rx="10" ry={eyeSquint ? 8 : eyeHalf ? 5 : eyeSad ? 7 : 9} fill="white" />
        <circle cx="67" cy={eyeSad ? 50 : 48} r="5" fill="#1a1f2e" />
        <circle cx="69" cy={eyeSad ? 48 : 46} r="2" fill="white" />

        {/* Thinking eyebrow */}
        {mood === 'thinking' && (
          <path d="M58 36 Q65 31 72 35" stroke="#1a1f2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        )}

        {/* Beak */}
        <ellipse cx="50" cy="63" rx="8" ry="5" fill="#f97316" />

        {/* Mouth — smile or frown */}
        {mood === 'sad'
          ? <path d="M42 70 Q50 66 58 70" stroke="#1a1f2e" strokeWidth="2" fill="none" strokeLinecap="round" />
          : <path d="M42 68 Q50 74 58 68" stroke="#1a1f2e" strokeWidth="2" fill="none" strokeLinecap="round" />
        }

        {/* Listening antenna */}
        {mood === 'listening' && (
          <>
            <circle cx="50" cy="10" r="5" fill="#4ade80" stroke="#22c55e" strokeWidth="2" />
            <line x1="50" y1="15" x2="50" y2="22" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
          </>
        )}

        {/* Excited sparkles */}
        {mood === 'excited' && (
          <>
            <line x1="14" y1="28" x2="22" y2="20" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="18" y1="22" x2="14" y2="20" stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
            <line x1="86" y1="28" x2="78" y2="20" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="82" y1="22" x2="86" y2="20" stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
          </>
        )}

        {/* Feet */}
        <ellipse cx="38" cy="98" rx="12" ry="7" fill="#f97316" />
        <ellipse cx="62" cy="98" rx="12" ry="7" fill="#f97316" />
      </svg>
    </motion.div>
  )
}
