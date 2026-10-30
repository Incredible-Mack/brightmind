'use client'
import { motion } from 'framer-motion'

export function AnimatedSun({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className="w-full h-full"
      >
        <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-md">
          {/* Sun Rays */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(deg => (
            <line
              key={deg}
              x1="60"
              y1="10"
              x2="60"
              y2="22"
              stroke="#fbbf24"
              strokeWidth="4"
              strokeLinecap="round"
              transform={`rotate(${deg} 60 60)`}
            />
          ))}
          {/* Core Circle */}
          <circle cx="60" cy="60" r="32" fill="#facc15" stroke="#f59e0b" strokeWidth="3" />
          {/* Smile and Eyes */}
          <circle cx="50" cy="54" r="3.5" fill="#78350f" />
          <circle cx="70" cy="54" r="3.5" fill="#78350f" />
          <ellipse cx="44" cy="62" rx="3.5" ry="2" fill="#fb7185" opacity="0.8" />
          <ellipse cx="76" cy="62" rx="3.5" ry="2" fill="#fb7185" opacity="0.8" />
          <path d="M52 64 Q60 74 68 64" stroke="#78350f" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      </motion.div>
    </div>
  )
}

export function DoodleCloud({ className = '', delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      animate={{ y: [0, -8, 0], x: [0, 4, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay }}
      className={`pointer-events-none select-none ${className}`}
    >
      <svg viewBox="0 0 140 80" className="w-full h-full fill-white drop-shadow-md">
        <path
          d="M 25 60 
             A 20 20 0 0 1 35 25 
             A 25 25 0 0 1 75 15 
             A 25 25 0 0 1 115 30 
             A 20 20 0 0 1 120 60 
             Z"
        />
        {/* Soft blue outline */}
        <path
          d="M 25 60 
             A 20 20 0 0 1 35 25 
             A 25 25 0 0 1 75 15 
             A 25 25 0 0 1 115 30 
             A 20 20 0 0 1 120 60 
             Z"
          stroke="#38bdf8"
          strokeWidth="3"
          strokeDasharray="4 4"
          fill="none"
        />
      </svg>
    </motion.div>
  )
}

export function PaperAirplane({ className = '' }: { className?: string }) {
  return (
    <motion.div
      animate={{
        y: [0, -12, 0],
        x: [0, 8, 0],
        rotate: [12, 18, 12],
      }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      className={`pointer-events-none select-none ${className}`}
    >
      <svg viewBox="0 0 80 80" className="w-full h-full drop-shadow-md">
        <polygon points="10,40 70,15 45,70 38,46" fill="#f43f5e" />
        <polygon points="38,46 70,15 45,70" fill="#e11d48" />
        <path d="M10 40 L38 46" stroke="#fda4af" strokeWidth="2" />
        {/* Trail dashed line */}
        <path d="M5 65 Q 12 52 20 45" stroke="#fb7185" strokeWidth="2.5" strokeDasharray="3 3" fill="none" />
      </svg>
    </motion.div>
  )
}

export function ScallopedCloudDivider({ className = '', fill = '#ffffff' }: { className?: string; fill?: string }) {
  return (
    <div className={`w-full overflow-hidden leading-none ${className}`}>
      <svg
        viewBox="0 0 1200 60"
        preserveAspectRatio="none"
        className="w-full h-10 sm:h-14 block"
      >
        <path
          d="M 0 60 
             L 0 30 
             Q 30 0 60 30 
             Q 90 0 120 30 
             Q 150 0 180 30 
             Q 210 0 240 30 
             Q 270 0 300 30 
             Q 330 0 360 30 
             Q 390 0 420 30 
             Q 450 0 480 30 
             Q 510 0 540 30 
             Q 570 0 600 30 
             Q 630 0 660 30 
             Q 690 0 720 30 
             Q 750 0 780 30 
             Q 810 0 840 30 
             Q 870 0 900 30 
             Q 930 0 960 30 
             Q 990 0 1020 30 
             Q 1050 0 1080 30 
             Q 1110 0 1140 30 
             Q 1170 0 1200 30 
             L 1200 60 
             Z"
          fill={fill}
        />
      </svg>
    </div>
  )
}

export function DoodleStar({ className = '', color = '#facc15' }: { className?: string; color?: string }) {
  return (
    <motion.div
      animate={{ scale: [1, 1.25, 1], rotate: [0, 15, -15, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      className={`pointer-events-none select-none inline-block ${className}`}
    >
      <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-sm">
        <polygon
          points="20,2 25,14 38,15 28,24 31,37 20,30 9,37 12,24 2,15 15,14"
          fill={color}
          stroke="#f59e0b"
          strokeWidth="1.5"
        />
      </svg>
    </motion.div>
  )
}

