'use client'
import { motion } from 'framer-motion'

interface PipExplorerProps {
  className?: string
  speech?: string
}

export function PipExplorer({ className = '', speech = "You're doing awesome! Pick a story and let's explore!" }: PipExplorerProps) {
  return (
    <div className={`flex items-end gap-3 ${className}`}>
      {/* Pip Explorer Vector */}
      <motion.div
        animate={{
          y: [0, -6, 0],
          rotate: [0, 1.5, 0, -1.5, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: 3,
          ease: 'easeInOut',
        }}
        className="w-24 sm:w-28 flex-shrink-0 cursor-pointer"
      >
        <svg viewBox="0 0 160 200" className="w-full h-auto drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
          {/* Sparkles around head */}
          <line x1="40" y1="20" x2="48" y2="35" stroke="#facc15" strokeWidth="4" strokeLinecap="round" />
          <line x1="80" y1="10" x2="80" y2="28" stroke="#facc15" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="120" y1="22" x2="112" y2="36" stroke="#facc15" strokeWidth="4" strokeLinecap="round" />

          {/* Waving Hand (Left Arm) */}
          <g>
            <path d="M22 135 C10 120 12 95 24 85" stroke="#d8b4fe" strokeWidth="10" strokeLinecap="round" fill="none" />
            {/* Glove */}
            <circle cx="25" cy="85" r="14" fill="#8b5cf6" />
            <circle cx="21" cy="74" r="5" fill="#8b5cf6" />
            <circle cx="29" cy="73" r="5" fill="#8b5cf6" />
            <circle cx="36" cy="78" r="5" fill="#8b5cf6" />
          </g>

          {/* Character Body (Tubular Pill Shape) */}
          <rect x="35" y="60" width="90" height="110" rx="36" fill="#f472b6" />
          <rect x="38" y="63" width="84" height="104" rx="33" fill="#ec4899" />

          {/* Backwards / Sideways Cap */}
          {/* Cap Crown */}
          <path d="M35 80 C35 35 125 35 125 80 Z" fill="#6d28d9" />
          {/* Cap Front Panel Band */}
          <path d="M32 78 Q80 72 128 78" stroke="#5b21b6" strokeWidth="6" strokeLinecap="round" fill="none" />
          {/* Visor Brim (pointing to the right) */}
          <path d="M110 74 C140 70 160 90 145 96 C125 96 112 84 110 74 Z" fill="#facc15" stroke="#eab308" strokeWidth="2" />

          {/* Big Glasses Frame */}
          <g>
            {/* Bridge */}
            <rect x="74" y="98" width="12" height="6" rx="2" fill="#3b0764" />
            {/* Left Rim */}
            <circle cx="56" cy="102" r="23" fill="#ffffff" stroke="#3b0764" strokeWidth="6" />
            {/* Right Rim */}
            <circle cx="104" cy="102" r="23" fill="#ffffff" stroke="#3b0764" strokeWidth="6" />

            {/* Left Eye */}
            <circle cx="56" cy="102" r="13" fill="#4c1d95" />
            <circle cx="59" cy="99" r="5" fill="#ffffff" />
            <circle cx="53" cy="105" r="2" fill="#ffffff" />

            {/* Right Eye */}
            <circle cx="104" cy="102" r="13" fill="#4c1d95" />
            <circle cx="107" cy="99" r="5" fill="#ffffff" />
            <circle cx="101" cy="105" r="2" fill="#ffffff" />
          </g>

          {/* Cheerful Smile */}
          <path d="M70 140 Q80 152 90 140" stroke="#831843" strokeWidth="4" strokeLinecap="round" fill="none" />
          <ellipse cx="80" cy="144" rx="5" ry="3" fill="#f43f5e" />

          {/* Cute Rosy Cheeks */}
          <ellipse cx="40" cy="132" rx="6" ry="4" fill="#fb7185" opacity="0.6" />
          <ellipse cx="120" cy="132" rx="6" ry="4" fill="#fb7185" opacity="0.6" />

          {/* Little Feet */}
          <ellipse cx="60" cy="176" rx="14" ry="8" fill="#4c1d95" />
          <ellipse cx="100" cy="176" rx="14" ry="8" fill="#4c1d95" />

        </svg>
      </motion.div>

      {/* Speech Bubble */}
      {speech && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="relative bg-white/95 text-slate-800 rounded-2xl p-3.5 shadow-xl border-2 border-purple-300 max-w-xs mb-3 text-xs sm:text-sm font-bold font-nunito leading-snug"
        >
          {speech}
          {/* Arrow */}
          <div className="absolute -left-2 bottom-3 w-0 h-0 border-t-[8px] border-t-transparent border-r-[10px] border-r-white border-b-[8px] border-b-transparent" />
        </motion.div>
      )}
    </div>
  )
}

