'use client'

import React from 'react'

/**
 * 3D Claymorphic Subject Icons matching the reference design:
 * 1. Math Magic - 3D colorful counting cubes (1, 2, 3)
 * 2. Science Lab - 3D bubbly potion Erlenmeyer flask
 * 3. Reading Land - 3D open magical fairy-tale storybook
 * 4. Art Studio - 3D wooden palette with paint blobs and paintbrush
 * 5. Geography - 3D spinning globe on a golden brass stand
 * 6. Life Skills - 3D cute teal watering can with smiling potted sprout
 */

export function Math3DIcon({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Drop Shadows */}
      <ellipse cx="50" cy="85" rx="36" ry="8" fill="#eab308" opacity="0.25" />

      {/* Block 1 (Left - Blue/Purple) */}
      <g transform="translate(14, 38)">
        {/* Top Face */}
        <polygon points="16,0 32,8 16,16 0,8" fill="#93c5fd" />
        {/* Left Face */}
        <polygon points="0,8 16,16 16,36 0,28" fill="#3b82f6" />
        {/* Right Face */}
        <polygon points="16,16 32,8 32,28 16,36" fill="#1d4ed8" />
        {/* Number 1 */}
        <text x="16" y="27" fontSize="14" fontWeight="900" fill="white" textAnchor="middle" fontFamily="sans-serif">1</text>
      </g>

      {/* Block 2 (Top/Center - Golden Yellow) */}
      <g transform="translate(34, 14)">
        {/* Top Face */}
        <polygon points="16,0 32,8 16,16 0,8" fill="#fef08a" />
        {/* Left Face */}
        <polygon points="0,8 16,16 16,36 0,28" fill="#facc15" />
        {/* Right Face */}
        <polygon points="16,16 32,8 32,28 16,36" fill="#eab308" />
        {/* Number 2 */}
        <text x="16" y="27" fontSize="14" fontWeight="900" fill="#78350f" textAnchor="middle" fontFamily="sans-serif">2</text>
      </g>

      {/* Block 3 (Right - Mint Green) */}
      <g transform="translate(54, 38)">
        {/* Top Face */}
        <polygon points="16,0 32,8 16,16 0,8" fill="#86efac" />
        {/* Left Face */}
        <polygon points="0,8 16,16 16,36 0,28" fill="#22c55e" />
        {/* Right Face */}
        <polygon points="16,16 32,8 32,28 16,36" fill="#15803d" />
        {/* Number 3 */}
        <text x="16" y="27" fontSize="14" fontWeight="900" fill="white" textAnchor="middle" fontFamily="sans-serif">3</text>
      </g>
    </svg>
  )
}

export function Science3DIcon({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Drop Shadow */}
      <ellipse cx="50" cy="88" rx="30" ry="7" fill="#0284c7" opacity="0.2" />

      {/* Flask Glass Outline */}
      <path
        d="M42 16 H58 V34 L78 72 C82 80 76 86 66 86 H34 C24 86 18 80 22 72 L42 34 Z"
        fill="#e0f2fe"
        stroke="#38bdf8"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Flask Lip */}
      <rect x="38" y="12" width="24" height="6" rx="3" fill="#bae6fd" stroke="#38bdf8" strokeWidth="2.5" />

      {/* Liquid Body */}
      <path
        d="M30 58 L24 72 C22 76 25 82 34 82 H66 C75 82 78 76 76 72 L70 58 Q50 64 30 58 Z"
        fill="#06b6d4"
      />
      <path
        d="M32 64 C42 66 58 62 68 64 C73 70 74 76 72 80 H28 C26 76 27 70 32 64 Z"
        fill="#22d3ee"
        opacity="0.8"
      />

      {/* Glass Highlight */}
      <path d="M46 36 L66 74" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
      <circle cx="68" cy="78" r="2.5" fill="white" opacity="0.8" />

      {/* Floating Magic Bubbles */}
      <circle cx="50" cy="70" r="4" fill="white" opacity="0.7" />
      <circle cx="42" cy="76" r="2.5" fill="white" opacity="0.6" />
      <circle cx="58" cy="74" r="3" fill="white" opacity="0.7" />
      
      {/* Rising Bubbles out of Flask */}
      <circle cx="52" cy="24" r="3.5" fill="#38bdf8" opacity="0.85" />
      <circle cx="46" cy="8" r="2.5" fill="#06b6d4" opacity="0.75" />
      <circle cx="56" cy="4" r="3" fill="#67e8f9" />
      {/* Sparkles */}
      <path d="M72 26 L74 22 L76 26 L80 28 L76 30 L74 34 L72 30 L68 28 Z" fill="#facc15" />
    </svg>
  )
}

export function Reading3DIcon({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Drop Shadow */}
      <ellipse cx="50" cy="84" rx="36" ry="7" fill="#059669" opacity="0.2" />

      {/* Hardcover Spine / Backing */}
      <path
        d="M10 68 Q50 80 50 78 Q50 80 90 68 L92 48 Q50 60 50 58 Q50 60 8 48 Z"
        fill="#047857"
      />

      {/* Left Pages (Thick 3D book block) */}
      <path
        d="M12 48 Q48 58 48 56 L48 30 Q48 32 12 24 Z"
        fill="#ecfdf5"
        stroke="#10b981"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Left Top Curved Page */}
      <path
        d="M14 26 Q48 34 48 32 L48 30 Q48 32 14 24 Z"
        fill="#ffffff"
      />

      {/* Right Pages (Thick 3D book block) */}
      <path
        d="M52 56 Q52 58 88 48 L86 24 Q52 32 52 30 Z"
        fill="#ecfdf5"
        stroke="#10b981"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Right Top Curved Page */}
      <path
        d="M52 32 Q52 34 86 26 L86 24 Q52 32 52 30 Z"
        fill="#ffffff"
      />

      {/* Text Lines on Left Page */}
      <line x1="20" y1="33" x2="42" y2="38" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="20" y1="41" x2="40" y2="45" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" />

      {/* Text Lines on Right Page */}
      <line x1="58" y1="38" x2="80" y2="33" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="60" y1="45" x2="80" y2="41" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" />

      {/* Golden Bookmark Ribbon */}
      <path d="M50 32 V64 L46 58 L42 64 V32" fill="#f59e0b" />

      {/* Floating Golden Stars & Sparkles */}
      <path d="M48 10 L50 4 L52 10 L58 12 L52 14 L50 20 L48 14 L42 12 Z" fill="#facc15" />
      <circle cx="34" cy="14" r="2.5" fill="#fde047" />
      <circle cx="68" cy="18" r="2" fill="#fde047" />
    </svg>
  )
}

export function Art3DIcon({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Drop Shadow */}
      <ellipse cx="48" cy="84" rx="34" ry="8" fill="#ea580c" opacity="0.2" />

      {/* Wooden Palette Base */}
      <path
        d="M20 50 C14 34 30 16 52 18 C74 20 86 34 82 54 C78 72 64 82 46 80 C36 78 30 68 28 66 C24 62 16 66 14 58 C12 54 16 52 20 50 Z"
        fill="#fde047"
        stroke="#d97706"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Palette 3D Bevel Edge */}
      <path
        d="M20 53 C14 37 30 19 52 21 C74 23 86 37 82 57 C78 75 64 85 46 83"
        stroke="#fef08a"
        strokeWidth="2"
        fill="none"
      />

      {/* Thumb Hole */}
      <ellipse cx="64" cy="62" rx="6" ry="8" fill="#fff7ed" stroke="#d97706" strokeWidth="2.5" />

      {/* 3D Colorful Paint Blobs */}
      {/* Red */}
      <circle cx="34" cy="32" r="6.5" fill="#ef4444" />
      <ellipse cx="32" cy="30" rx="2" ry="1.2" fill="white" opacity="0.7" />

      {/* Blue */}
      <circle cx="48" cy="28" r="6.5" fill="#3b82f6" />
      <ellipse cx="46" cy="26" rx="2" ry="1.2" fill="white" opacity="0.7" />

      {/* Green */}
      <circle cx="64" cy="32" r="6.5" fill="#22c55e" />
      <ellipse cx="62" cy="30" rx="2" ry="1.2" fill="white" opacity="0.7" />

      {/* Purple */}
      <circle cx="74" cy="46" r="6.5" fill="#a855f7" />
      <ellipse cx="72" cy="44" rx="2" ry="1.2" fill="white" opacity="0.7" />

      {/* Orange */}
      <circle cx="34" cy="52" r="5.5" fill="#f97316" />

      {/* Paintbrush Crossing */}
      <g transform="translate(18, 12) rotate(-35)">
        {/* Handle */}
        <rect x="0" y="24" width="7" height="60" rx="3.5" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
        {/* Metal Ferrule */}
        <rect x="0" y="14" width="7" height="12" rx="1.5" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
        {/* Bristles */}
        <path d="M0 14 Q3.5 0 7 14 Z" fill="#38bdf8" />
      </g>
    </svg>
  )
}

export function Geography3DIcon({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Drop Shadow */}
      <ellipse cx="50" cy="90" rx="30" ry="6" fill="#4338ca" opacity="0.25" />

      {/* Brass Stand Base */}
      <ellipse cx="50" cy="85" rx="20" ry="5" fill="#ca8a04" stroke="#854d0e" strokeWidth="2.5" />
      <ellipse cx="50" cy="83" rx="16" ry="3.5" fill="#facc15" />
      {/* Stand Vertical Stem */}
      <rect x="47" y="66" width="6" height="18" rx="2" fill="#eab308" stroke="#854d0e" strokeWidth="2" />

      {/* Golden Brass Semi-Meridian Arch */}
      <path
        d="M26 44 C26 24 40 16 58 16 C68 16 75 22 75 22"
        stroke="#ca8a04"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M75 52 C75 66 66 74 50 74 C36 74 26 62 26 48"
        stroke="#ca8a04"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Globe Sphere Base (Ocean) */}
      <circle cx="50" cy="45" r="26" fill="#38bdf8" stroke="#0284c7" strokeWidth="3" />

      {/* Continents (Green/Emerald) */}
      <g>
        {/* North America / Europe blob */}
        <path d="M38 32 C42 28 48 30 52 34 C50 40 44 42 40 40 C36 38 34 34 38 32 Z" fill="#4ade80" />
        {/* South America blob */}
        <path d="M42 46 C48 46 50 52 46 58 C42 62 38 56 42 46 Z" fill="#22c55e" />
        {/* Africa / Asia blob */}
        <path d="M58 34 C64 30 70 34 72 40 C70 46 64 48 60 44 C56 42 56 36 58 34 Z" fill="#4ade80" />
      </g>

      {/* 3D Sphere Specular Shine */}
      <ellipse cx="40" cy="33" rx="8" ry="4" fill="white" opacity="0.45" transform="rotate(-30 40 33)" />
      
      {/* Axis Finials */}
      <circle cx="58" cy="18" r="3.5" fill="#facc15" stroke="#854d0e" strokeWidth="1.5" />
      <circle cx="42" cy="72" r="3.5" fill="#facc15" stroke="#854d0e" strokeWidth="1.5" />
    </svg>
  )
}

export function LifeSkills3DIcon({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Drop Shadow */}
      <ellipse cx="50" cy="88" rx="34" ry="7" fill="#7e22ce" opacity="0.2" />

      {/* Terracotta Pot */}
      <polygon points="34,60 66,60 60,84 40,84" fill="#ea580c" stroke="#9a3412" strokeWidth="2.5" />
      {/* Pot Rim */}
      <rect x="30" y="55" width="40" height="7" rx="3" fill="#f97316" stroke="#9a3412" strokeWidth="2" />
      
      {/* Soil */}
      <ellipse cx="50" cy="56" rx="16" ry="3.5" fill="#78350f" />

      {/* Growing Green Sprout */}
      <path d="M50 56 V36" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" />
      {/* Left Leaf */}
      <path d="M50 44 Q36 38 38 28 Q48 30 50 44 Z" fill="#4ade80" stroke="#16a34a" strokeWidth="2" />
      {/* Right Leaf */}
      <path d="M50 40 Q64 34 62 24 Q52 26 50 40 Z" fill="#22c55e" stroke="#15803d" strokeWidth="2" />

      {/* Cute Watering Can (Left) */}
      <g transform="translate(10, 24) rotate(-15)">
        {/* Can Body */}
        <rect x="10" y="16" width="22" height="24" rx="6" fill="#2dd4bf" stroke="#0f766e" strokeWidth="2.5" />
        {/* Can Top Handle */}
        <path d="M14 16 C14 8 28 8 28 16" stroke="#0f766e" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Spout */}
        <path d="M32 30 L44 24" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" />
        {/* Spout Rose Head */}
        <line x1="43" y1="20" x2="47" y2="28" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Gentle Water Droplets */}
      <circle cx="56" cy="28" r="2" fill="#38bdf8" />
      <circle cx="53" cy="34" r="2.5" fill="#38bdf8" />
      <circle cx="58" cy="38" r="2" fill="#0284c7" />

      {/* Little Smiling Face on the Pot */}
      <circle cx="46" cy="70" r="1.8" fill="#7c2d12" />
      <circle cx="54" cy="70" r="1.8" fill="#7c2d12" />
      <path d="M47 74 Q50 77 53 74" stroke="#7c2d12" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

