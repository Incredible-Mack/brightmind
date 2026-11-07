'use client'

import React from 'react'

/**
 * 3D Illustrated Game Thumbnails for Science Lab & Memory Match
 */

export function ScienceLabThumbnail({ className = 'w-full h-full' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Pastel Purple Background Vignette */}
      <rect width="200" height="200" rx="24" fill="url(#sci-bg)" />
      
      <defs>
        <radialGradient id="sci-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#f3e8ff" />
          <stop offset="100%" stopColor="#d8b4fe" />
        </radialGradient>
        <filter id="sci-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Orbiting Science Atom Rings */}
      <g transform="translate(100, 95)" filter="url(#sci-glow)">
        {/* Ring 1 */}
        <ellipse cx="0" cy="0" rx="65" ry="24" stroke="#8b5cf6" strokeWidth="3" transform="rotate(-30)" fill="none" opacity="0.8" />
        <circle cx="56" cy="-32" r="5" fill="#38bdf8" />

        {/* Ring 2 */}
        <ellipse cx="0" cy="0" rx="65" ry="24" stroke="#a855f7" strokeWidth="3" transform="rotate(30)" fill="none" opacity="0.8" />
        <circle cx="-56" cy="-32" r="5" fill="#c084fc" />

        {/* Ring 3 */}
        <ellipse cx="0" cy="0" rx="65" ry="24" stroke="#06b6d4" strokeWidth="3" transform="rotate(90)" fill="none" opacity="0.8" />
        <circle cx="0" cy="65" r="5" fill="#22d3ee" />
      </g>

      {/* 3D Glass Flask with Glowing Potion */}
      <g transform="translate(68, 60)">
        {/* Shadow */}
        <ellipse cx="32" cy="85" rx="36" ry="8" fill="#6b21a8" opacity="0.25" />

        {/* Glass Flask Body */}
        <path
          d="M24 10 H40 V30 L60 70 C64 78 58 84 48 84 H16 C6 84 0 78 4 70 L24 30 Z"
          fill="#faf5ff"
          stroke="#7c3aed"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Flask Rim */}
        <rect x="20" y="6" width="24" height="6" rx="3" fill="#e9d5ff" stroke="#7c3aed" strokeWidth="2.5" />

        {/* Glowing Turquoise Liquid */}
        <path
          d="M12 58 L6 70 C4 74 8 80 18 80 H46 C56 80 60 74 58 70 L52 58 Q32 64 12 58 Z"
          fill="#06b6d4"
        />
        <path
          d="M14 64 C24 66 40 62 50 64 C55 70 56 76 54 78 H10 C8 74 9 70 14 64 Z"
          fill="#67e8f9"
          opacity="0.85"
        />

        {/* Floating Sparkles & Bubbles */}
        <circle cx="32" cy="70" r="3.5" fill="white" opacity="0.8" />
        <circle cx="24" cy="74" r="2.5" fill="white" opacity="0.7" />
        <circle cx="42" cy="72" r="3" fill="white" opacity="0.8" />
        
        {/* Rising Bubble */}
        <circle cx="34" cy="24" r="3.5" fill="#a78bfa" />
        <circle cx="28" cy="8" r="2.5" fill="#c4b5fd" />
      </g>

      {/* Golden Stars in Background */}
      <path d="M40 30 L42 24 L44 30 L50 32 L44 34 L42 40 L40 34 L34 32 Z" fill="#facc15" />
      <path d="M165 45 L166 40 L168 45 L173 46 L168 48 L166 53 L165 48 L160 46 Z" fill="#facc15" />
    </svg>
  )
}

export function MemoryCardsThumbnail({ className = 'w-full h-full' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Pastel Pink Background Vignette */}
      <rect width="200" height="200" rx="24" fill="url(#mem-bg)" />
      
      <defs>
        <radialGradient id="mem-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#fdf2f8" />
          <stop offset="100%" stopColor="#fbcfe8" />
        </radialGradient>
      </defs>

      {/* Card Shadows */}
      <ellipse cx="68" cy="155" rx="34" ry="8" fill="#be185d" opacity="0.25" />
      <ellipse cx="132" cy="155" rx="34" ry="8" fill="#be185d" opacity="0.25" />

      {/* Left Card: 3D Star Card (Blue/Teal back, gold star) */}
      <g transform="translate(32, 42) rotate(-8)">
        {/* Card Body */}
        <rect x="0" y="0" width="68" height="96" rx="14" fill="#38bdf8" stroke="#0284c7" strokeWidth="3.5" />
        {/* Card Inner Bevel */}
        <rect x="4" y="4" width="60" height="88" rx="10" fill="#bae6fd" stroke="white" strokeWidth="2" />
        <rect x="8" y="8" width="52" height="80" rx="8" fill="#e0f2fe" />

        {/* 3D Glowing Golden Star */}
        <g transform="translate(34, 48)">
          <path
            d="M0 -22 L6 -6 L22 -4 L10 8 L14 24 L0 15 L-14 24 L-10 8 L-22 -4 L-6 -6 Z"
            fill="#facc15"
            stroke="#eab308"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Star Face */}
          <circle cx="-4" cy="0" r="2" fill="#78350f" />
          <circle cx="4" cy="0" r="2" fill="#78350f" />
          <path d="M-3 5 Q0 8 3 5" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </g>
      </g>

      {/* Right Card: 3D Heart Card (Lavender back, pink heart) */}
      <g transform="translate(104, 38) rotate(8)">
        {/* Card Body */}
        <rect x="0" y="0" width="68" height="96" rx="14" fill="#f472b6" stroke="#db2777" strokeWidth="3.5" />
        {/* Card Inner Bevel */}
        <rect x="4" y="4" width="60" height="88" rx="10" fill="#fbcfe8" stroke="white" strokeWidth="2" />
        <rect x="8" y="8" width="52" height="80" rx="8" fill="#fdf2f8" />

        {/* 3D Glowing Pink Heart */}
        <g transform="translate(34, 48)">
          <path
            d="M0 16 C-24 2 -24 -16 -6 -16 C0 -16 0 -10 0 -10 C0 -10 0 -16 6 -16 C24 -16 24 2 0 16 Z"
            fill="#ec4899"
            stroke="#be185d"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Heart Specular Highlight */}
          <ellipse cx="-6" cy="-8" rx="3.5" ry="2" fill="white" opacity="0.65" transform="rotate(-30 -6 -8)" />
        </g>
      </g>

      {/* Floating Sparkles */}
      <path d="M100 24 L102 18 L104 24 L110 26 L104 28 L102 34 L100 28 L94 26 Z" fill="#facc15" />
      <circle cx="28" cy="38" r="3" fill="#fde047" />
      <circle cx="174" cy="42" r="2.5" fill="#fde047" />
    </svg>
  )
}

