'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Sparkles, Volume2, RotateCcw, Lightbulb, ChevronRight, Heart, Brain, Star, Settings } from 'lucide-react'
import { Pip } from '@/components/mascot/Pip'
import { api, type WonderFact } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'

// Gentle Web Audio Sound Synthesis
function playSound(type: 'pop' | 'chime' | 'boing' | 'magic' = 'pop') {
  if (typeof window === 'undefined') return
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    if (ctx.state === 'suspended') ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    if (type === 'magic') {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(587.33, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.25)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.3)
    } else if (type === 'chime') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.25)
    } else {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(540, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(920, ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0.14, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.12)
    }
  } catch {}
}

export interface HumanFact {
  badge: string
  title: string
  fact: string
  detail: string
  illustration: 'brain' | 'heart' | 'bones' | 'stardust' | 'dolphins' | 'books'
  accentColor: string
  bgGradient: string
  borderColor: string
}

const FACTS_BY_SUBJECT: Record<string, HumanFact[]> = {
  english: [
    {
      badge: 'Human Brain & Imagination',
      title: 'Your Mind is a Movie Theater! 🧠🎬',
      fact: 'When you read or listen to stories, your human brain lights up over 100 billion brain cells to paint vivid 3D pictures in your mind!',
      detail: 'Scientists found that hearing words like "lavender" or "cinnamon" activates the exact same smell centers in your brain as smelling the real flower!',
      illustration: 'brain',
      accentColor: '#8b5cf6',
      bgGradient: 'from-[#f5f3ff] via-[#ede9fe] to-[#fae8ff]',
      borderColor: 'border-[#c4b5fd]',
    },
    {
      badge: 'Language Wonder',
      title: 'The Magic Alphabet Fox 🦊🔤',
      fact: 'The fun sentence "The quick brown fox jumps over the lazy dog" uses every single letter from A to Z!',
      detail: 'Sentences that include all 26 letters are called pangrams, and typists and font artists have used them for over 140 years.',
      illustration: 'books',
      accentColor: '#3b82f6',
      bgGradient: 'from-[#eff6ff] via-[#dbeafe] to-[#e0f2fe]',
      borderColor: 'border-[#93c5fd]',
    },
    {
      badge: 'Human Connection',
      title: 'The Global Word for "Mama" 👶🌍',
      fact: 'Almost every human language on Earth uses the "M" and "B" sounds for parents because baby lips make those sounds first!',
      detail: 'Whether you say "Mama", "Mère", "Madre", or "Maa", children all over the world share the same warm baby sound of love.',
      illustration: 'heart',
      accentColor: '#ec4899',
      bgGradient: 'from-[#fdf2f8] via-[#fce7f3] to-[#ffe4e6]',
      borderColor: 'border-[#f9a8d4]',
    },
  ],
  science: [
    {
      badge: 'Human Body Power',
      title: 'Your Supercharged Heart! 🫀⚡',
      fact: 'Your human heart beats about 100,000 times every day, pumping blood through 60,000 miles of tiny vessels inside you!',
      detail: 'That is enough blood vessel length to wrap around Planet Earth more than two whole times!',
      illustration: 'heart',
      accentColor: '#e11d48',
      bgGradient: 'from-[#fff1f2] via-[#ffe4e6] to-[#fef2f2]',
      borderColor: 'border-[#fda4af]',
    },
    {
      badge: 'Human Anatomy',
      title: 'Bone Transformers! 🦴✨',
      fact: 'You were born with about 300 soft bones! As you grow taller and jump around, some bones gently fuse into 206 strong adult bones.',
      detail: 'Your thigh bone (the femur) is stronger than concrete and can support 30 times your own body weight!',
      illustration: 'bones',
      accentColor: '#059669',
      bgGradient: 'from-[#ecfdf5] via-[#d1fae5] to-[#e6fffa]',
      borderColor: 'border-[#6ee7b7]',
    },
    {
      badge: 'Cosmic Human Fact',
      title: 'You Are Made of Real Stardust! ⭐🧬',
      fact: 'Every single atom of iron in your blood and calcium in your teeth was forged inside exploding giant stars billions of years ago!',
      detail: 'Astronomer Carl Sagan famously said: "The nitrogen in our DNA, the calcium in our teeth, the iron in our blood were made in the interiors of collapsing stars."',
      illustration: 'stardust',
      accentColor: '#7c3aed',
      bgGradient: 'from-[#faf5ff] via-[#f3e8ff] to-[#e0e7ff]',
      borderColor: 'border-[#d8b4fe]',
    },
  ],
  math: [
    {
      badge: 'Human Invention',
      title: 'The 10-Finger Supercomputer! 🖐️🔢',
      fact: 'Humans invented the base-10 number system because our ancestors had 10 fingers to point, count, and share berries!',
      detail: 'Archaeologists found the Ishango Bone in Africa with tally marks carved by human mathematicians over 20,000 years ago.',
      illustration: 'brain',
      accentColor: '#d97706',
      bgGradient: 'from-[#fffbeb] via-[#fef3c7] to-[#fef9c3]',
      borderColor: 'border-[#fde68a]',
    },
    {
      badge: 'Nature & Math',
      title: 'Honeybee Geometry Masters 🐝📐',
      fact: 'Honeybees solve complex math equations to build hexagonal honeycombs that use the least amount of wax to hold the most honey!',
      detail: 'In mathematics, this is called the "Honeycomb Conjecture", proven by human mathematicians only in 1999!',
      illustration: 'stardust',
      accentColor: '#ca8a04',
      bgGradient: 'from-[#fefce8] via-[#fef08a] to-[#ffedd5]',
      borderColor: 'border-[#facc15]',
    },
  ],
  'social-studies': [
    {
      badge: 'Human Family',
      title: 'We Share 99.9% of Our DNA! 🌍🤝',
      fact: 'No matter what language you speak or where on Earth you live, every single human is 99.9% genetically identical!',
      detail: 'All of human history, art, song, and science comes from one giant, beautiful, interconnected family on our blue planet.',
      illustration: 'heart',
      accentColor: '#0284c7',
      bgGradient: 'from-[#f0f9ff] via-[#e0f2fe] to-[#eff6ff]',
      borderColor: 'border-[#bae6fd]',
    },
  ],
}

// 3D Isometric SVG illustrations for Human Facts
function FactIllustration({ type }: { type: HumanFact['illustration'] }) {
  if (type === 'brain') {
    return (
      <svg viewBox="0 0 160 160" fill="none" className="w-full h-full drop-shadow-md anim-float">
        {/* Glow */}
        <circle cx="80" cy="80" r="60" fill="#c084fc" opacity="0.25" filter="blur(10px)" />
        {/* Brain Left Hemisphere */}
        <path
          d="M75 40 C55 35 35 48 35 70 C30 80 32 95 45 105 C42 115 50 125 65 125 C75 125 75 120 75 120 Z"
          fill="#e879f9"
          stroke="#a21caf"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Brain Right Hemisphere */}
        <path
          d="M85 40 C105 35 125 48 125 70 C130 80 128 95 115 105 C118 115 110 125 95 125 C85 125 85 120 85 120 Z"
          fill="#f472b6"
          stroke="#be185d"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Gyri / Folds */}
        <path d="M50 65 Q65 60 72 75 Q58 85 45 92" stroke="#86198f" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M110 65 Q95 60 88 75 Q102 85 115 92" stroke="#9d174d" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M52 100 Q65 95 72 110" stroke="#86198f" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M108 100 Q95 95 88 110" stroke="#9d174d" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* Sparkles / Lightbulb idea */}
        <circle cx="80" cy="24" r="7" fill="#facc15" />
        <path d="M80 10 L80 14 M70 17 L73 20 M90 17 L87 20" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    )
  }

  if (type === 'heart') {
    return (
      <svg viewBox="0 0 160 160" fill="none" className="w-full h-full drop-shadow-md anim-pulse-glow">
        <circle cx="80" cy="80" r="60" fill="#f43f5e" opacity="0.2" filter="blur(12px)" />
        {/* 3D Anatomical & Friendly Heart */}
        <path
          d="M80 135 C35 105 20 70 35 48 C48 30 72 35 80 55 C88 35 112 30 125 48 C140 70 125 105 80 135 Z"
          fill="#f43f5e"
          stroke="#be123c"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        {/* Aorta / Vessels */}
        <path d="M70 42 V22 H85 V38" stroke="#be123c" strokeWidth="4" strokeLinecap="round" fill="#fda4af" />
        <path d="M90 35 V18 H102 V32" stroke="#be123c" strokeWidth="3.5" strokeLinecap="round" fill="#fda4af" />
        {/* Highlight Specular */}
        <ellipse cx="55" cy="55" rx="8" ry="14" fill="white" opacity="0.6" transform="rotate(-30 55 55)" />
        {/* Pulse ECG Line */}
        <path d="M45 80 H62 L68 65 L76 95 L84 72 L90 82 H115" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (type === 'bones') {
    return (
      <svg viewBox="0 0 160 160" fill="none" className="w-full h-full drop-shadow-md anim-float-slow">
        <circle cx="80" cy="80" r="55" fill="#34d399" opacity="0.2" filter="blur(10px)" />
        {/* Friendly Crossed Bones */}
        <g transform="translate(80, 80) rotate(45) translate(-80, -80)">
          <path
            d="M45 74 H115 C118 68 126 68 129 74 C132 80 128 86 122 86 C128 86 132 92 129 98 C126 104 118 104 115 98 H45 C42 104 34 104 31 98 C28 92 32 86 38 86 C32 86 28 80 31 74 C34 68 42 68 45 74 Z"
            fill="#ecfdf5"
            stroke="#059669"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
        </g>
        <g transform="translate(80, 80) rotate(-45) translate(-80, -80)">
          <path
            d="M45 74 H115 C118 68 126 68 129 74 C132 80 128 86 122 86 C128 86 132 92 129 98 C126 104 118 104 115 98 H45 C42 104 34 104 31 98 C28 92 32 86 38 86 C32 86 28 80 31 74 C34 68 42 68 45 74 Z"
            fill="#ffffff"
            stroke="#059669"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
        </g>
        <circle cx="80" cy="80" r="10" fill="#a7f3d0" stroke="#059669" strokeWidth="2.5" />
      </svg>
    )
  }

  // Stardust / Books fallback
  return (
    <svg viewBox="0 0 160 160" fill="none" className="w-full h-full drop-shadow-md anim-spin-slow">
      <circle cx="80" cy="80" r="55" fill="#a855f7" opacity="0.25" filter="blur(12px)" />
      {/* Central Star */}
      <path
        d="M80 25 L92 65 L135 80 L92 95 L80 135 L68 95 L25 80 L68 65 Z"
        fill="#facc15"
        stroke="#ca8a04"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Mini Stars */}
      <circle cx="45" cy="40" r="5" fill="#e879f9" />
      <circle cx="120" cy="40" r="6" fill="#38bdf8" />
      <circle cx="125" cy="120" r="5" fill="#4ade80" />
      <circle cx="40" cy="115" r="4" fill="#fb923c" />
    </svg>
  )
}

export function IllustratedFactBanner({ subjectSlug = 'english' }: { subjectSlug?: string }) {
  const { user } = useAppStore()
  const fallbackList = FACTS_BY_SUBJECT[subjectSlug] || FACTS_BY_SUBJECT.english
  
  const [factsState, setFactsState] = useState<{ visible: boolean; items: (HumanFact | WonderFact)[] }>({
    visible: true,
    items: fallbackList,
  })
  const [factIndex, setFactIndex] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)

  useEffect(() => {
    api.facts.get(subjectSlug)
      .then((res) => {
        if (res && typeof res.visible === 'boolean') {
          setFactsState({
            visible: res.visible,
            items: res.items.length > 0 ? res.items : fallbackList,
          })
        }
      })
      .catch(() => {
        // keep fallback list
      })
  }, [subjectSlug])

  const factsList = factsState.items
  const currentFact = factsList.length > 0 ? factsList[factIndex % factsList.length] : null

  const handleNextFact = () => {
    stopSpeaking()
    playSound('boing')
    setFactIndex(prev => (prev + 1) % factsList.length)
  }

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
  }

  const speakFact = () => {
    if (!currentFact || typeof window === 'undefined' || !('speechSynthesis' in window)) return

    if (isSpeaking) {
      stopSpeaking()
      return
    }

    stopSpeaking()
    setIsSpeaking(true)
    playSound('magic')

    const speechText = `${currentFact.title}. ${currentFact.fact} ${currentFact.detail || ''}`
    const utterance = new SpeechSynthesisUtterance(speechText)
    utterance.rate = 0.86
    utterance.pitch = 1.15
    utterance.onend = () => {
      setIsSpeaking(false)
      playSound('chime')
    }
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  // If section is turned off by admin
  if (!factsState.visible) {
    return null
  }

  if (!currentFact) return null

  const bgGradient = ('bg_gradient' in currentFact ? currentFact.bg_gradient : currentFact.bgGradient) || 'from-[#fdf2f8] via-[#fce7f3] to-[#ffe4e6]'
  const borderColor = ('border_color' in currentFact ? currentFact.border_color : currentFact.borderColor) || 'border-[#f9a8d4]'
  const accentColor = ('accent_color' in currentFact ? currentFact.accent_color : currentFact.accentColor) || '#ec4899'
  const illustration = (currentFact.illustration as HumanFact['illustration']) || 'brain'

  return (
    <div className={`w-full rounded-3xl sm:rounded-[32px] bg-gradient-to-r ${bgGradient} p-5 sm:p-7 border-2 ${borderColor} border-b-[6px] shadow-lg relative overflow-hidden transition-all duration-300`}>
      
      {/* Background Decorative Sparkles */}
      <div className="absolute top-3 right-6 text-amber-400 opacity-60 pointer-events-none anim-pulse-glow">
        <Sparkles size={28} />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left: 3D Illustrated Mascot & Graphic */}
        <div className="flex-shrink-0 flex items-center justify-center relative w-28 h-28 sm:w-36 sm:h-36">
          <FactIllustration type={illustration} />
          {/* Mini Pip in corner cheering */}
          <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-md border-2 border-amber-300 anim-wiggle">
            <Pip size="sm" mood="excited" animate="idle" />
          </div>
        </div>

        {/* Middle: Rich Human Wonder Fact Copy */}
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-slate-200 text-xs font-black shadow-xs" style={{ color: accentColor }}>
            <Lightbulb size={13} className="text-amber-500" />
            <span>✨ Illustrated Wonder Fact • {currentFact.badge}</span>
            {user?.role === 'admin' && (
              <Link
                href="/admin/facts"
                className="ml-1 text-slate-400 hover:text-slate-800 transition-colors p-0.5"
                title="Edit Wonder Facts in Admin"
              >
                <Settings size={12} />
              </Link>
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-snug">
            {currentFact.title}
          </h3>

          <p className="text-sm sm:text-base font-black text-slate-700 leading-relaxed max-w-2xl">
            {currentFact.fact}
          </p>

          {currentFact.detail && (
            <p className="text-xs sm:text-sm font-bold text-slate-500 leading-normal max-w-2xl">
              💡 {currentFact.detail}
            </p>
          )}
        </div>

        {/* Right: Audio Narration & Next Fact Action Buttons */}
        <div className="flex flex-row md:flex-col items-center justify-center gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={speakFact}
            className={`px-4 sm:px-5 py-2.5 rounded-full font-black text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer ${
              isSpeaking
                ? 'bg-amber-400 text-amber-950 border-2 border-amber-300'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200'
            }`}
          >
            <Volume2 size={16} className={isSpeaking ? 'text-amber-900 anim-pulse-glow' : 'text-[#0284c7]'} />
            <span>{isSpeaking ? 'Pause Voice' : 'Hear Fact 🔊'}</span>
          </button>

          <button
            type="button"
            onClick={handleNextFact}
            className="px-4 sm:px-5 py-2.5 rounded-full font-black text-xs sm:text-sm text-white bg-[#0284c7] hover:bg-[#0369a1] border-b-4 border-[#075985] shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Next Fact</span>
            <ChevronRight size={16} />
          </button>
        </div>

      </div>

    </div>
  )
}

