'use client'
import { motion } from 'framer-motion'

export function SpringDuckPond({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 160 100" className="w-full h-auto drop-shadow-md">
        {/* Pond Water */}
        <ellipse cx="80" cy="55" rx="74" ry="40" fill="#0284c7" />
        <ellipse cx="80" cy="55" rx="68" ry="34" fill="#38bdf8" />
        
        {/* Water Ripples */}
        <path d="M40 54 Q60 51 80 54" stroke="#bae6fd" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M85 66 Q105 63 125 66" stroke="#bae6fd" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Bobbing Rubber Duck */}
        <motion.g
          animate={{ y: [0, -4, 0], rotate: [-2, 2, -2] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          transform="translate(68, 28)"
        >
          {/* Duck Body */}
          <ellipse cx="22" cy="20" rx="16" ry="12" fill="#facc15" />
          {/* Tail */}
          <path d="M8 18 Q2 12 10 14 Z" fill="#facc15" />
          {/* Head */}
          <circle cx="30" cy="12" r="10" fill="#facc15" />
          {/* Eye */}
          <circle cx="34" cy="10" r="2" fill="#1e293b" />
          <circle cx="35" cy="9" r="0.8" fill="#ffffff" />
          {/* Beak */}
          <path d="M38 12 Q46 13 40 16 Z" fill="#ea580c" />
          {/* Wing */}
          <path d="M16 20 Q24 24 26 18 Q20 16 16 20 Z" fill="#eab308" />
        </motion.g>

        {/* Water Lilies & Reeds */}
        <circle cx="32" cy="62" r="8" fill="#16a34a" />
        <circle cx="34" cy="60" r="3.5" fill="#f43f5e" />
      </svg>
    </div>
  )
}

export function SpringFarmBarn({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 190 150" className="w-full h-auto drop-shadow-xl">
        {/* Barn Base */}
        <rect x="25" y="60" width="90" height="65" rx="4" fill="#dc2626" />
        {/* Barn Roof */}
        <path d="M20 62 L70 20 L120 62 Z" fill="#991b1b" />
        {/* White Trim Cross Door */}
        <rect x="52" y="80" width="36" height="45" fill="#ffffff" />
        <rect x="55" y="83" width="30" height="42" fill="#7f1d1d" />
        <line x1="55" y1="83" x2="85" y2="125" stroke="#ffffff" strokeWidth="3" />
        <line x1="85" y1="83" x2="55" y2="125" stroke="#ffffff" strokeWidth="3" />
        {/* Barn Window */}
        <rect x="62" y="40" width="16" height="15" rx="2" fill="#ffffff" />
        <rect x="64" y="42" width="12" height="11" rx="1" fill="#fef08a" />
        
        {/* Windmill Tower */}
        <polygon points="142,125 166,125 158,60 148,60" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
        <circle cx="153" cy="60" r="6" fill="#475569" />
        
        {/* Continuously Spinning Windmill Blades */}
        <g transform="translate(153, 60)">
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          >
            <line x1="-30" y1="-30" x2="30" y2="30" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
            <line x1="30" y1="-30" x2="-30" y2="30" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
            
            <rect x="10" y="8" width="18" height="8" rx="2" fill="#e2e8f0" stroke="#94a3b8" transform="rotate(45)" />
            <rect x="-28" y="-16" width="18" height="8" rx="2" fill="#e2e8f0" stroke="#94a3b8" transform="rotate(45)" />
            <rect x="-16" y="10" width="18" height="8" rx="2" fill="#e2e8f0" stroke="#94a3b8" transform="rotate(-45)" />
            <rect x="10" y="-16" width="18" height="8" rx="2" fill="#e2e8f0" stroke="#94a3b8" transform="rotate(-45)" />
            <circle cx="0" cy="0" r="4" fill="#0f172a" />
          </motion.g>
        </g>

        {/* Golden Wheat Stalks */}
        <path d="M14 125 Q8 108 18 100" stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M125 125 Q130 110 124 102" stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  )
}

export function SpringMushroom({ className = '' }: { className?: string }) {
  return (
    <motion.div
      animate={{ scale: [1, 1.08, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      className={`relative ${className}`}
    >
      <svg viewBox="0 0 60 60" className="w-full h-auto drop-shadow-md">
        {/* Stem */}
        <path d="M22 55 Q30 35 38 55 Z" fill="#ffffff" />
        {/* Cap with Popping Coral Red */}
        <path d="M8 38 Q30 5 52 38 Q30 43 8 38 Z" fill="#ef4444" stroke="#dc2626" strokeWidth="1.5" />
        {/* Big White Dots */}
        <circle cx="23" cy="24" r="4.5" fill="#ffffff" />
        <circle cx="37" cy="21" r="5" fill="#ffffff" />
        <circle cx="30" cy="33" r="3.5" fill="#ffffff" />
      </svg>
    </motion.div>
  )
}

export function AutumnCampfire({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 170 120" className="w-full h-auto drop-shadow-lg">
        {/* Orange Tent */}
        <polygon points="15,100 65,30 115,100" fill="#f97316" stroke="#ea580c" strokeWidth="2" />
        <polygon points="65,30 115,100 85,100 65,55" fill="#ea580c" />
        <polygon points="45,100 65,55 85,100" fill="#7c2d12" />
        
        {/* Campfire Logs */}
        <line x1="125" y1="96" x2="155" y2="86" stroke="#78350f" strokeWidth="5" strokeLinecap="round" />
        <line x1="125" y1="86" x2="155" y2="96" stroke="#92400e" strokeWidth="5" strokeLinecap="round" />
        
        {/* Flickering Animated Flames */}
        <g transform="translate(140, 90)">
          <motion.path
            d="M 0 0 Q -8 -25 0 -35 Q 10 -20 0 0 Z"
            fill="#ef4444"
            animate={{ scaleY: [1, 1.25, 0.95, 1], scaleX: [1, 0.9, 1.1, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.path
            d="M 0 0 Q -4 -15 0 -22 Q 6 -12 0 0 Z"
            fill="#facc15"
            animate={{ scaleY: [1, 1.2, 0.9, 1] }}
            transition={{ duration: 0.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </g>
      </svg>
    </div>
  )
}

export function AutumnParkBench({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 140 100" className="w-full h-auto drop-shadow-md">
        {/* Streetlamp with warm light */}
        <rect x="105" y="25" width="4" height="65" fill="#334155" />
        <path d="M98 25 L116 25 L113 14 L101 14 Z" fill="#1e293b" />
        <motion.circle
          cx="107"
          cy="22"
          r="6"
          fill="#fde047"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        {/* Bench */}
        <rect x="25" y="65" width="60" height="5" rx="1.5" fill="#9a3412" />
        <rect x="25" y="55" width="60" height="4" rx="1" fill="#c2410c" />
        {/* Legs */}
        <line x1="32" y1="65" x2="28" y2="88" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
        <line x1="78" y1="65" x2="82" y2="88" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
        {/* Colorful Autumn Leaves */}
        <ellipse cx="45" cy="88" rx="4.5" ry="2.5" fill="#f97316" transform="rotate(15 45 88)" />
        <ellipse cx="60" cy="89" rx="4" ry="2" fill="#eab308" transform="rotate(-20 60 89)" />
      </svg>
    </div>
  )
}

export function WinterSnowman({ className = '' }: { className?: string }) {
  return (
    <motion.div
      animate={{ rotate: [-2, 2, -2] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      className={`relative ${className}`}
    >
      <svg viewBox="0 0 100 120" className="w-full h-auto drop-shadow-lg">
        {/* Bottom Ball */}
        <circle cx="50" cy="85" r="28" fill="#ffffff" stroke="#93c5fd" strokeWidth="2.5" />
        {/* Middle Ball */}
        <circle cx="50" cy="50" r="20" fill="#ffffff" stroke="#93c5fd" strokeWidth="2.5" />
        {/* Head */}
        <circle cx="50" cy="24" r="14" fill="#ffffff" stroke="#93c5fd" strokeWidth="2.5" />
        {/* Eyes */}
        <circle cx="45" cy="22" r="2" fill="#0f172a" />
        <circle cx="55" cy="22" r="2" fill="#0f172a" />
        {/* Carrot Nose */}
        <polygon points="50,25 64,28 50,29" fill="#f97316" />
        {/* Smile */}
        <circle cx="45" cy="30" r="1" fill="#0f172a" />
        <circle cx="48" cy="31.5" r="1" fill="#0f172a" />
        <circle cx="52" cy="31.5" r="1" fill="#0f172a" />
        <circle cx="55" cy="30" r="1" fill="#0f172a" />
        {/* Vibrant Red Scarf */}
        <path d="M40 37 Q50 43 60 37 Q63 42 58 44 Q50 47 38 42 Z" fill="#ef4444" />
        <path d="M54 42 L55 60 L62 58 L60 41 Z" fill="#dc2626" />
        {/* Buttons */}
        <circle cx="50" cy="52" r="2.5" fill="#0f172a" />
        <circle cx="50" cy="62" r="2.5" fill="#0f172a" />
        {/* Top Hat */}
        <ellipse cx="50" cy="14" rx="15" ry="3.5" fill="#1e293b" />
        <rect x="42" y="3" width="16" height="11" fill="#1e293b" rx="1" />
        <rect x="42" y="10" width="16" height="2.5" fill="#ef4444" />
      </svg>
    </motion.div>
  )
}

export function WinterSnowCabin({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 160 120" className="w-full h-auto drop-shadow-xl">
        {/* Red House Body */}
        <rect x="35" y="55" width="85" height="50" rx="3" fill="#dc2626" />
        {/* Door */}
        <rect x="70" y="75" width="18" height="30" rx="2" fill="#7f1d1d" />
        <circle cx="74" cy="90" r="1.5" fill="#facc15" />
        {/* Glowing Windows with warm light */}
        <rect x="44" y="68" width="16" height="16" rx="2" fill="#fde047" stroke="#b91c1c" strokeWidth="1.5" />
        <rect x="96" y="68" width="16" height="16" rx="2" fill="#fde047" stroke="#b91c1c" strokeWidth="1.5" />
        {/* Chimney */}
        <rect x="98" y="22" width="14" height="25" fill="#991b1b" />
        {/* Floating Smoke Particles */}
        <motion.circle
          cx="105"
          cy="12"
          r="5"
          fill="#e2e8f0"
          animate={{ y: [0, -12], opacity: [0.8, 0], scale: [1, 1.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        />
        <motion.circle
          cx="108"
          cy="4"
          r="6"
          fill="#e2e8f0"
          animate={{ y: [0, -14], opacity: [0.6, 0], scale: [1, 1.6] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut', delay: 0.8 }}
        />
        {/* Thick Snowy Roof */}
        <path d="M25 58 L78 20 L130 58 Q118 64 105 58 Q90 65 78 58 Q65 65 50 58 Q38 65 25 58 Z" fill="#ffffff" stroke="#bae6fd" strokeWidth="2" />
      </svg>
    </div>
  )
}

export function WinterFrozenLake({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 160 90" className="w-full h-auto drop-shadow-md">
        {/* Frozen Lake Ice */}
        <ellipse cx="80" cy="48" rx="74" ry="34" fill="#0284c7" />
        <ellipse cx="80" cy="48" rx="68" ry="28" fill="#38bdf8" />
        {/* Swimming Fish under the ice */}
        <motion.g
          animate={{ x: [0, 20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          transform="translate(60, 42)"
        >
          <path d="M0 6 C8 0 16 0 24 6 C16 12 8 12 0 6 Z" fill="#f97316" />
          <polygon points="0,6 -6,1 -6,11" fill="#ea580c" />
          <circle cx="18" cy="5" r="1.2" fill="#ffffff" />
        </motion.g>
        {/* Ice Highlights */}
        <path d="M38 45 L55 42 L68 48" stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
        <path d="M110 50 L125 46" stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />
      </svg>
    </div>
  )
}

export function PineTreeSnow({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 70 100" className="w-full h-auto drop-shadow-md">
        {/* Trunk */}
        <rect x="31" y="80" width="8" height="18" rx="2" fill="#78350f" />
        {/* Tiers with Vibrant Green and Snow Caps */}
        <polygon points="35,35 10,78 60,78" fill="#0d9488" />
        <path d="M10 78 Q35 70 60 78 Q48 72 35 72 Q22 72 10 78 Z" fill="#ffffff" />
        
        <polygon points="35,20 18,55 52,55" fill="#14b8a6" />
        <path d="M18 55 Q35 48 52 55 Q43 50 35 50 Q26 50 18 55 Z" fill="#ffffff" />
        
        <polygon points="35,8 24,35 46,35" fill="#2dd4bf" />
        <path d="M24 35 Q35 30 46 35 Q40 32 35 32 Q29 32 24 35 Z" fill="#ffffff" />
      </svg>
    </div>
  )
}


// ── 3D Fairytale Scenery (Inspired by user's game screenshot) ────────────────
export function FairytaleCottage3D({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 240 180" className="w-full h-auto drop-shadow-2xl">
        {/* Soft Drop Shadow under House and Bench */}
        <ellipse cx="120" cy="155" rx="100" ry="20" fill="#0f172a" opacity="0.25" />

        {/* Stone Foundation */}
        <polygon points="35,148 165,148 180,135 50,135" fill="#64748b" />
        <rect x="35" y="146" width="130" height="12" rx="3" fill="#475569" />

        {/* Plaster Walls (Warm Cream) */}
        <polygon points="40,90 120,90 120,146 40,146" fill="#fef3c7" stroke="#b45309" strokeWidth="2" />
        <polygon points="120,90 170,82 170,136 120,146" fill="#fde68a" stroke="#b45309" strokeWidth="2" />

        {/* Timber Framing Beams */}
        <line x1="40" y1="90" x2="120" y2="146" stroke="#92400e" strokeWidth="3.5" />
        <line x1="120" y1="90" x2="40" y2="146" stroke="#92400e" strokeWidth="3.5" />
        <rect x="75" y="112" width="22" height="34" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="2" />
        <circle cx="92" cy="128" r="1.5" fill="#facc15" />

        {/* Window with Flower Box */}
        <rect x="48" y="102" width="18" height="18" rx="2" fill="#38bdf8" stroke="#78350f" strokeWidth="2" />
        <line x1="57" y1="102" x2="57" y2="120" stroke="#78350f" strokeWidth="1.5" />
        <line x1="48" y1="111" x2="66" y2="111" stroke="#78350f" strokeWidth="1.5" />
        {/* Flower Box */}
        <rect x="46" y="119" width="22" height="5" rx="1" fill="#92400e" />
        <circle cx="50" cy="118" r="2.5" fill="#f43f5e" />
        <circle cx="57" cy="118" r="2.5" fill="#facc15" />
        <circle cx="64" cy="118" r="2.5" fill="#f43f5e" />

        {/* Side Wall Window */}
        <polygon points="135,100 155,97 155,114 135,117" fill="#38bdf8" stroke="#78350f" strokeWidth="1.5" />

        {/* 3D Cobalt Blue Shingled Roof (Image 3) */}
        {/* Main Gable */}
        <polygon points="80,28 20,88 125,88" fill="#1e40af" stroke="#172554" strokeWidth="2.5" />
        {/* Right Roof Face */}
        <polygon points="80,28 150,22 185,82 125,88" fill="#2563eb" stroke="#172554" strokeWidth="2.5" />
        {/* Roof Tiles Highlight Details */}
        <path d="M40 76 Q50 72 60 76 Q70 72 80 76 Q90 72 100 76" stroke="#60a5fa" strokeWidth="2" fill="none" />
        <path d="M55 58 Q65 54 75 58 Q85 54 95 58" stroke="#60a5fa" strokeWidth="2" fill="none" />
        <path d="M100 50 L155 45 M115 70 L170 65" stroke="#93c5fd" strokeWidth="2" fill="none" />

        {/* Stone Chimney with Puffing Smoke */}
        <rect x="130" y="24" width="16" height="26" fill="#64748b" stroke="#334155" strokeWidth="2" />
        <motion.circle
          cx="138"
          cy="14"
          r="4"
          fill="#e2e8f0"
          animate={{ y: [0, -12], opacity: [0.9, 0], scale: [1, 1.4] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
        />
        <motion.circle
          cx="142"
          cy="6"
          r="5.5"
          fill="#f1f5f9"
          animate={{ y: [0, -15], opacity: [0.7, 0], scale: [1, 1.6] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeOut', delay: 0.7 }}
        />

        {/* Wooden Picnic Table & Bench (Image 3) */}
        <g transform="translate(145, 138)">
          <polygon points="0,6 28,2 30,8 2,12" fill="#b45309" stroke="#78350f" strokeWidth="1" />
          <line x1="6" y1="11" x2="4" y2="20" stroke="#78350f" strokeWidth="2.5" />
          <line x1="24" y1="7" x2="22" y2="16" stroke="#78350f" strokeWidth="2.5" />
          {/* Bench */}
          <polygon points="-6,14 18,10 20,13 -4,17" fill="#92400e" />
        </g>
      </svg>
    </div>
  )
}

export function IsometricPineTree({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 80 120" className="w-full h-auto drop-shadow-xl">
        {/* Ground Shadow */}
        <ellipse cx="40" cy="112" rx="28" ry="8" fill="#0f172a" opacity="0.2" />
        {/* Trunk */}
        <rect x="36" y="94" width="8" height="18" rx="2" fill="#78350f" />
        {/* 3D Tiered Conical Evergreen (Darker right face for 3D depth) */}
        {/* Bottom Tier */}
        <polygon points="40,65 10,98 70,98" fill="#15803d" />
        <polygon points="40,65 40,98 70,98" fill="#166534" />
        {/* Middle Tier */}
        <polygon points="40,38 18,72 62,72" fill="#16a34a" />
        <polygon points="40,38 40,72 62,72" fill="#15803d" />
        {/* Top Tier */}
        <polygon points="40,12 26,45 54,45" fill="#22c55e" />
        <polygon points="40,12 40,45 54,45" fill="#16a34a" />
      </svg>
    </div>
  )
}

export function PrizeWheelMilestone({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 100 110" className="w-full h-auto drop-shadow-xl">
        {/* Ground Shadow */}
        <ellipse cx="50" cy="102" rx="36" ry="7" fill="#0f172a" opacity="0.25" />
        {/* Stand Base */}
        <polygon points="40,88 60,88 66,102 34,102" fill="#9333ea" stroke="#581c87" strokeWidth="2" />
        
        {/* Rotating Wheel Disc */}
        <g transform="translate(50, 48)">
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          >
            {/* Wheel Outer Rim */}
            <circle cx="0" cy="0" r="38" fill="#a855f7" stroke="#7e22ce" strokeWidth="4" />
            <circle cx="0" cy="0" r="34" fill="#ffffff" />
            {/* Colored Segments */}
            <path d="M0,0 L34,0 A34,34 0 0,1 17,29.4 Z" fill="#ef4444" />
            <path d="M0,0 L17,29.4 A34,34 0 0,1 -17,29.4 Z" fill="#facc15" />
            <path d="M0,0 L-17,29.4 A34,34 0 0,1 -34,0 Z" fill="#22c55e" />
            <path d="M0,0 L-34,0 A34,34 0 0,1 -17,-29.4 Z" fill="#3b82f6" />
            <path d="M0,0 L-17,-29.4 A34,34 0 0,1 17,-29.4 Z" fill="#ec4899" />
            <path d="M0,0 L17,-29.4 A34,34 0 0,1 34,0 Z" fill="#f97316" />
            {/* Center Cap */}
            <circle cx="0" cy="0" r="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
            <circle cx="0" cy="0" r="4" fill="#facc15" />
          </motion.g>
        </g>

        {/* Red Pointer Arrow at Top with Exclamation Bubble (Image 2) */}
        <polygon points="50,18 45,8 55,8" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
        
        {/* Alert Bubble */}
        <g transform="translate(68, 6)">
          <circle cx="8" cy="8" r="9" fill="#ffffff" stroke="#e11d48" strokeWidth="2" />
          <text x="8" y="12" textAnchor="middle" fill="#e11d48" fontWeight="900" fontSize="12" fontFamily="sans-serif">!</text>
        </g>
      </svg>
    </div>
  )
}


export function BubbleTreeCluster({ className = '', variant = 'teal' }: { className?: string; variant?: 'teal' | 'emerald' | 'warm' }) {
  const colors = {
    teal: {
      light: '#2dd4bf',
      mid: '#0d9488',
      dark: '#115e59',
      highlight: '#99f6e4',
    },
    emerald: {
      light: '#34d399',
      mid: '#059669',
      dark: '#065f46',
      highlight: '#a7f3d0',
    },
    warm: {
      light: '#facc15',
      mid: '#d97706',
      dark: '#b45309',
      highlight: '#fef08a',
    },
  }[variant]

  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 120 130" className="w-full h-auto drop-shadow-xl">
        {/* Soft Ground Shadow */}
        <ellipse cx="60" cy="120" rx="42" ry="9" fill="#0f172a" opacity="0.22" />

        {/* Tree Trunk */}
        <path d="M52 85 L50 120 L70 120 L68 85 Z" fill="#92400e" stroke="#78350f" strokeWidth="2" />
        <path d="M58 95 L58 115" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />

        {/* Tier 1: Lower Bubbly Foliage (Dark) */}
        <ellipse cx="42" cy="80" rx="26" ry="22" fill={colors.dark} />
        <ellipse cx="78" cy="80" rx="26" ry="22" fill={colors.dark} />

        {/* Tier 2: Mid Foliage */}
        <ellipse cx="40" cy="74" rx="24" ry="20" fill={colors.mid} />
        <ellipse cx="76" cy="74" rx="24" ry="20" fill={colors.mid} />
        <ellipse cx="60" cy="62" rx="30" ry="24" fill={colors.mid} />

        {/* Tier 3: Top Bubbly Crown */}
        <ellipse cx="58" cy="56" rx="28" ry="22" fill={colors.light} />

        {/* Glossy Highlights on Puffy Bubbles */}
        <ellipse cx="50" cy="48" rx="14" ry="8" fill={colors.highlight} opacity="0.6" />
        <ellipse cx="36" cy="70" rx="9" ry="5" fill={colors.highlight} opacity="0.5" />
        <ellipse cx="74" cy="70" rx="9" ry="5" fill={colors.highlight} opacity="0.5" />
      </svg>
    </div>
  )
}

export function MeadowFlowersAndRocks({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className} pointer-events-none select-none`}>
      <svg viewBox="0 0 140 70" className="w-full h-auto drop-shadow-sm">
        {/* Smooth River Stone 1 */}
        <ellipse cx="26" cy="46" rx="18" ry="11" fill="#94a3b8" stroke="#64748b" strokeWidth="1.5" />
        <ellipse cx="23" cy="42" rx="9" ry="4" fill="#cbd5e1" opacity="0.7" />

        {/* Smooth River Stone 2 */}
        <ellipse cx="112" cy="50" rx="14" ry="8" fill="#94a3b8" stroke="#64748b" strokeWidth="1.5" />
        <ellipse cx="110" cy="48" rx="7" ry="3" fill="#cbd5e1" opacity="0.6" />

        {/* Pink Flower 🌸 */}
        <g transform="translate(56, 38)">
          <circle cx="-6" cy="0" r="4.5" fill="#f472b6" />
          <circle cx="6" cy="0" r="4.5" fill="#f472b6" />
          <circle cx="0" cy="-6" r="4.5" fill="#f472b6" />
          <circle cx="0" cy="6" r="4.5" fill="#f472b6" />
          <circle cx="0" cy="0" r="3.5" fill="#fef08a" stroke="#f59e0b" strokeWidth="1" />
        </g>

        {/* White Daisy 🌼 */}
        <g transform="translate(82, 28)">
          <circle cx="-5" cy="0" r="4" fill="#ffffff" />
          <circle cx="5" cy="0" r="4" fill="#ffffff" />
          <circle cx="0" cy="-5" r="4" fill="#ffffff" />
          <circle cx="0" cy="5" r="4" fill="#ffffff" />
          <circle cx="0" cy="0" r="3" fill="#facc15" />
        </g>

        {/* Little Yellow Blossom */}
        <g transform="translate(38, 22)">
          <circle cx="0" cy="0" r="3.5" fill="#fef08a" stroke="#eab308" strokeWidth="1" />
        </g>
      </svg>
    </div>
  )
}

export function SideQuestBadge({ className = '' }: { className?: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`bg-white rounded-2xl border-2 border-red-500 shadow-xl overflow-hidden flex flex-col items-center cursor-pointer select-none ${className}`}
    >
      <div className="bg-red-500 w-full px-2 py-0.5 text-center">
        <span className="font-nunito font-black text-[11px] text-white uppercase tracking-wider">
          Quest
        </span>
      </div>
      <div className="bg-amber-300 w-full px-2.5 py-1 text-center border-t border-amber-400">
        <span className="font-nunito font-black text-[11px] text-amber-950 flex items-center justify-center gap-1">
          <span>⏰</span> 23h 58m
        </span>
      </div>
    </motion.div>
  )
}

export function MapIconButton({ className = '', onClick }: { className?: string; onClick?: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={`bg-amber-100 hover:bg-amber-200 border-2 border-amber-400 border-b-4 border-amber-600 rounded-2xl p-2 shadow-lg flex flex-col items-center gap-0.5 cursor-pointer ${className}`}
      title="View Adventure Map"
    >
      <span className="text-xl">🧭</span>
      <span className="font-nunito font-black text-[9px] text-amber-900 uppercase tracking-wider">
        MAP
      </span>
    </motion.button>
  )
}
