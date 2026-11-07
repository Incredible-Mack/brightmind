'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Star,
  Shield,
  BookOpen,
  Play,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  ArrowRight,
  Search,
  X,
  Volume2,
  Smile,
  Layers,
  Award,
  Smartphone,
  Heart,
  Puzzle,
  FlaskConical,
  GraduationCap,
  Sparkle,
  Settings,
} from 'lucide-react'
import { api, type Testimonial } from '@/lib/api'
import { Pip, PipMood } from '@/components/mascot/Pip'
import { AnimatedSun, DoodleCloud, DoodleStar, PaperAirplane } from '@/components/home/KidsDoodles'
import {
  Math3DIcon,
  Science3DIcon,
  Reading3DIcon,
  Art3DIcon,
  Geography3DIcon,
  LifeSkills3DIcon,
} from '@/components/home/Topic3DIcons'
import { ScienceLabThumbnail, MemoryCardsThumbnail } from '@/components/home/GameThumbnails'
import { useAppStore } from '@/store/useAppStore'
import { Avatar } from '@/components/ui/Avatar'
import { getAgeGroup } from '@/lib/curriculum.data'

// Gentle Web Audio Sound Synthesis (Instant response, zero external files)
function playSound(type: 'pop' | 'chime' | 'boing' | 'magic' = 'pop') {
  if (typeof window === 'undefined') return
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    if (ctx.state === 'suspended') ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    if (type === 'magic') {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1) // A5
      osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.2) // D6
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.3)
    } else if (type === 'chime') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.22)
    } else if (type === 'boing') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(220, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.08)
      osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.18)
      gain.gain.setValueAtTime(0.18, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.25)
    } else {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(540, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(920, ctx.currentTime + 0.07)
      gain.gain.setValueAtTime(0.14, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.12)
    }
  } catch {
    // Ignore audio restriction errors
  }
}

// Topic Cards Data (Matching WonderLearn "Explore by Topic" Chunky Rounded-Square Claymorphism)
const topics = [
  {
    id: 'math',
    name: 'Math Magic',
    href: '/lessons?subject=math',
    cardBg: 'bg-gradient-to-b from-[#fefce8] to-[#fef08a]',
    border: 'border-[#fde047] border-b-[#ca8a04]',
    textColor: 'text-[#713f12]',
    IconComponent: Math3DIcon,
  },
  {
    id: 'science',
    name: 'Science Lab',
    href: '/lessons?subject=science',
    cardBg: 'bg-gradient-to-b from-[#f0f9ff] to-[#bae6fd]',
    border: 'border-[#7dd3fc] border-b-[#0284c7]',
    textColor: 'text-[#075985]',
    IconComponent: Science3DIcon,
  },
  {
    id: 'reading',
    name: 'Reading Land',
    href: '/lessons?subject=english',
    cardBg: 'bg-gradient-to-b from-[#f0fdf4] to-[#bbf7d0]',
    border: 'border-[#86efac] border-b-[#16a34a]',
    textColor: 'text-[#166534]',
    IconComponent: Reading3DIcon,
  },
  {
    id: 'art',
    name: 'Art Studio',
    href: '/lessons?subject=creative-arts',
    cardBg: 'bg-gradient-to-b from-[#fff7ed] to-[#fed7aa]',
    border: 'border-[#fdba74] border-b-[#ea580c]',
    textColor: 'text-[#9a3412]',
    IconComponent: Art3DIcon,
  },
  {
    id: 'geography',
    name: 'Geography',
    href: '/lessons?subject=social-studies',
    cardBg: 'bg-gradient-to-b from-[#eef2ff] to-[#c7d2fe]',
    border: 'border-[#a5b4fc] border-b-[#4f46e5]',
    textColor: 'text-[#3730a3]',
    IconComponent: Geography3DIcon,
  },
  {
    id: 'life-skills',
    name: 'Life Skills',
    href: '/lessons?subject=life-skills',
    cardBg: 'bg-gradient-to-b from-[#faf5ff] to-[#e9d5ff]',
    border: 'border-[#d8b4fe] border-b-[#9333ea]',
    textColor: 'text-[#6b21a8]',
    IconComponent: LifeSkills3DIcon,
  },
]

// Magical Stories Data
const stories = [
  {
    id: 'starry-balloon',
    title: 'The Starry Balloon',
    tag: 'Friendship',
    tagColor: 'bg-blue-100 text-blue-700 border-blue-200',
    coverImage: '/images/story-starry-balloon.jpg',
    ageRange: 'Ages 4–8',
    readTime: '4 min read',
    description: 'Join three joyful adventurers drifting among glowing constellations, shooting stars, and a friendly smiling moon.',
  },
  {
    id: 'luna-glow',
    title: 'Luna and the Little Glow',
    tag: 'Fantasy',
    tagColor: 'bg-purple-100 text-purple-700 border-purple-200',
    coverImage: '/images/story-luna-glow.jpg',
    ageRange: 'Ages 3–7',
    readTime: '3 min read',
    description: 'In an enchanted moonlit forest, Luna meets a tiny radiant forest kitten that needs help finding its family.',
  },
  {
    id: 'brave-sailor',
    title: 'The Brave Little Sailor',
    tag: 'Adventure',
    tagColor: 'bg-teal-100 text-teal-700 border-teal-200',
    coverImage: '/images/story-brave-sailor.jpg',
    ageRange: 'Ages 5–9',
    readTime: '5 min read',
    description: 'Across sunlit turquoise waters, Leo navigates his little wooden boat to discover the mysterious Whispering Palms.',
  },
  {
    id: 'secret-garden',
    title: 'The Secret Garden',
    tag: 'Kindness',
    tagColor: 'bg-rose-100 text-rose-700 border-rose-200',
    coverImage: '/images/story-secret-garden.jpg',
    ageRange: 'Ages 4–8',
    readTime: '4 min read',
    description: 'A stone archway covered in ivy leads Aria into a magical sanctuary of oversized talking blooms and fluttering butterflies.',
  },
]

// Play & Learn Quest Cards (Illustrated Game Thumbnails matching WonderLearn)
const games = [
  {
    id: 'math-quest',
    title: 'Math Quest',
    badge: '5 + 2 = ?',
    cardBg: 'bg-gradient-to-b from-[#e0f2fe] to-[#bae6fd]',
    border: 'border-[#7dd3fc] border-b-[#0284c7]',
    href: '/games/math-quest',
    thumbnail: '/images/game-math-quest.jpg',
  },
  {
    id: 'balloon-pop',
    title: 'Phonics Balloon Pop',
    badge: 'A • B • C',
    cardBg: 'bg-gradient-to-b from-[#dcfce7] to-[#bbf7d0]',
    border: 'border-[#86efac] border-b-[#16a34a]',
    href: '/games/balloon-pop',
    thumbnail: '/images/game-balloon-pop.jpg',
  },
  {
    id: 'puzzle-quest',
    title: 'Puzzle Quest',
    badge: 'Puzzle Logic',
    cardBg: 'bg-gradient-to-b from-[#ffedd5] to-[#fed7aa]',
    border: 'border-[#fdba74] border-b-[#ea580c]',
    href: '/games/puzzle-quest',
    thumbnail: '/images/game-puzzle-quest.jpg',
  },
  {
    id: 'science-experiment',
    title: 'Science Lab',
    badge: 'Lab Master',
    cardBg: 'bg-gradient-to-b from-[#f3e8ff] to-[#e9d5ff]',
    border: 'border-[#d8b4fe] border-b-[#9333ea]',
    href: '/games/science-lab',
    ThumbnailComponent: ScienceLabThumbnail,
  },
  {
    id: 'memory-match',
    title: 'Memory Match',
    badge: 'Memory Boost',
    cardBg: 'bg-gradient-to-b from-[#fce7f3] to-[#fbcfe8]',
    border: 'border-[#f472b6] border-b-[#db2777]',
    href: '/games/memory-match',
    ThumbnailComponent: MemoryCardsThumbnail,
  },
]

// Fallback default testimonials matching database seed
const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: 'Sarah M.',
    role: 'Mother of 5-year-old Leo',
    avatar: '👩‍🦰',
    avatar_bg: 'bg-rose-100 border-rose-300',
    quote: 'Bright Steps has made learning something my kids look forward to every day! The voice speaking feature makes them so proud.',
    rating: 5,
    order_index: 0,
    is_active: true,
  },
  {
    id: 2,
    name: 'Daniel R.',
    role: 'Father of 7-year-old Maya',
    avatar: '👨‍🦱',
    avatar_bg: 'bg-blue-100 border-blue-300',
    quote: 'The stories are beautiful and the games are both fun and educational. It feels like stepping into a Pixar adventure.',
    rating: 5,
    order_index: 1,
    is_active: true,
  },
  {
    id: 3,
    name: 'Priya S.',
    role: 'Parent of 4 & 8-year-old',
    avatar: '👩',
    avatar_bg: 'bg-amber-100 border-amber-300',
    quote: 'Finally a safe, creative, ad-free platform that keeps my child inspired to explore without frustration or endless scrolling.',
    rating: 5,
    order_index: 2,
    is_active: true,
  },
]

// Featured Adventures Carousel Data
const featuredAdventures = [
  {
    id: 'island',
    badge: 'Epic Journey',
    title: 'Island of Imagination',
    desc: 'Join Mia, Leo and Aria as they discover a floating island full of wonders, puzzles, talking animals and new friends!',
    image: '/images/island-adventure.jpg',
    href: '/lessons',
  },
  {
    id: 'starry-balloon',
    badge: 'Sky Exploration',
    title: 'The Starry Balloon Voyage',
    desc: 'Drift across glowing constellations, shooting stars, and a friendly smiling moon in a magical hot air balloon!',
    image: '/images/story-starry-balloon.jpg',
    href: '/stories/starry-balloon',
  },
  {
    id: 'hero-world',
    badge: 'Heroic Quest',
    title: 'The Brave Little Sailor',
    desc: 'Across turquoise sunlit waters, sail to discover the mystery of Whispering Palms with fun challenges and rewards!',
    image: '/images/story-brave-sailor.jpg',
    href: '/stories/brave-sailor',
  },
]

export default function WonderLearnLandingPage() {
  const { child, user, xp } = useAppStore()
  const childAgeGroup = child ? getAgeGroup(child.age ?? 4) : '0-5'
  const [activeStory, setActiveStory] = useState<(typeof stories)[0] | null>(null)
  const [activeAdventureIndex, setActiveAdventureIndex] = useState(0)
  const [pipMood, setPipMood] = useState<PipMood>('happy')
  const [pipSpeech, setPipSpeech] = useState<string>(
    child ? `Hi ${child.name}! Ready to explore? ✨` : "Hi, I'm Pip! Let's explore together!"
  )
  const [testimonialsData, setTestimonialsData] = useState<{ visible: boolean; items: Testimonial[] }>({
    visible: true,
    items: DEFAULT_TESTIMONIALS,
  })

  useEffect(() => {
    api.testimonials.get()
      .then((res) => {
        if (res && typeof res.visible === 'boolean') {
          setTestimonialsData(res)
        }
      })
      .catch(() => {
        // keep default fallback testimonials
      })
  }, [])

  const handlePipClick = () => {
    playSound('magic')
    const moods: PipMood[] = ['excited', 'happy', 'thinking', 'listening']
    const nextMood = moods[Math.floor(Math.random() * moods.length)]
    setPipMood(nextMood)

    const speeches = [
      "You're doing amazing! Let's find a story! ⭐",
      "Ready to count, read, and explore with me? 🚀",
      "Yay! Click Start Exploring below! ✨",
      "I love learning new words with you! 🎈",
    ]
    setPipSpeech(speeches[Math.floor(Math.random() * speeches.length)])
  }

  return (
    <div className="min-h-screen bg-[#f0f9ff] flex flex-col font-nunito selection:bg-amber-300 selection:text-slate-900 overflow-x-hidden">
      
      {/* ══════════════════════════════════════════════════════════════════════
          1. TOP CLOUD-HEADER (WonderLearn Style with Ambient Doodles)
          ══════════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-[#eaf6ff]/95 backdrop-blur-md border-b-2 border-[#d0e8fc] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
          
          {/* Logo & Tagline */}
          <Link
            href="/"
            onClick={() => playSound('pop')}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] border-2 border-white shadow-md flex items-center justify-center text-2xl anim-wiggle">
              📖
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black text-[#0f4c5c] tracking-tight leading-none group-hover:text-[#0284c7] transition-colors">
                Bright Steps
              </span>
              <span className="text-[10px] sm:text-[11px] font-black text-[#0284c7] tracking-wider uppercase mt-0.5">
                Imagine • Discover • Grow
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              href="/"
              onClick={() => playSound('pop')}
              className="px-4 py-2 rounded-full font-black text-sm text-[#0284c7] bg-white border border-[#bae6fd] shadow-sm transition-all hover:scale-105"
            >
              Home
            </Link>
            <Link
              href="/lessons"
              onClick={() => playSound('pop')}
              className="px-4 py-2 rounded-full font-extrabold text-sm text-[#334155] hover:text-[#0284c7] hover:bg-white/80 transition-all hover:scale-105"
            >
              Explore Topics
            </Link>
            <a
              href="#stories"
              onClick={() => playSound('pop')}
              className="px-4 py-2 rounded-full font-extrabold text-sm text-[#334155] hover:text-[#0284c7] hover:bg-white/80 transition-all hover:scale-105"
            >
              Stories
            </a>
            <a
              href="#games"
              onClick={() => playSound('pop')}
              className="px-4 py-2 rounded-full font-extrabold text-sm text-[#334155] hover:text-[#0284c7] hover:bg-white/80 transition-all hover:scale-105"
            >
              Games
            </a>
            <Link
              href="/parent"
              onClick={() => playSound('pop')}
              className="px-4 py-2 rounded-full font-extrabold text-sm text-[#334155] hover:text-[#0284c7] hover:bg-white/80 transition-all hover:scale-105"
            >
              For Parents
            </Link>
          </nav>

          {/* Top-Right Action Pill Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {child ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => playSound('pop')}
                  className="flex items-center gap-2 bg-white/95 hover:bg-white border-2 border-sky-200 rounded-full py-1 px-3 shadow-xs hover:scale-105 transition-transform"
                >
                  <Avatar seed={child.avatar_seed} name={child.name} size={28} />
                  <div className="hidden sm:flex flex-col text-left leading-none">
                    <span className="font-nunito font-black text-xs text-[#0f4c5c]">{child.name}</span>
                    <span className="text-[10px] text-[#0284c7] font-bold">Ages {childAgeGroup}</span>
                  </div>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-1.5 py-0.5 rounded-full">{xp} XP</span>
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => playSound('chime')}
                  className="px-4 sm:px-5 py-2 rounded-full font-black text-xs sm:text-sm text-white bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] border-2 border-emerald-400 shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
                >
                  <span>My Dashboard</span>
                  <ArrowRight size={14} />
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/demo"
                  onClick={() => playSound('chime')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#e0f2fe] hover:bg-[#bae6fd] text-[#0369a1] font-black text-xs border border-[#7dd3fc] transition-all hover:scale-105 active:scale-95 shadow-xs"
                >
                  <Sparkles size={13} className="text-[#0284c7] anim-spin-slow" />
                  <span>Demo</span>
                </Link>

                <Link
                  href="/login"
                  onClick={() => playSound('pop')}
                  className="px-4 sm:px-5 py-2 rounded-full font-black text-xs sm:text-sm text-[#854d0e] bg-[#fef08a] hover:bg-[#fde047] border-2 border-[#facc15] shadow-sm transition-all hover:scale-105 active:scale-95"
                >
                  Log In
                </Link>

                <Link
                  href="/register"
                  onClick={() => playSound('chime')}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-black text-xs sm:text-sm text-white bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] border-2 border-emerald-400 shadow-md shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-1 relative overflow-hidden group"
                >
                  <div className="anim-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
                  <Star size={14} className="fill-amber-300 text-amber-300 relative z-10" />
                  <span className="relative z-10">Join Now</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          2. MAGICAL HERO SECTION WITH CONTINUOUS ANIMATIONS & PIP
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#e0f2fe] via-[#bae6fd]/40 to-[#f0f9ff]">
        
        {/* Continuous Animated Clouds */}
        <div className="absolute top-4 left-6 z-10 anim-float-h pointer-events-none">
          <DoodleCloud className="w-28 sm:w-44 opacity-85" delay={0} />
        </div>
        <div className="absolute top-10 right-10 z-10 anim-float pointer-events-none">
          <DoodleCloud className="w-32 sm:w-52 opacity-85" delay={1.5} />
        </div>

        {/* Rotating Animated Smiling Sun */}
        <div className="absolute top-6 right-6 sm:right-20 z-10 w-20 sm:w-28 h-20 sm:h-28 pointer-events-none">
          <AnimatedSun className="w-full h-full" />
        </div>

        {/* Gliding Paper Airplane */}
        <div className="absolute top-20 left-12 sm:left-1/4 z-10 pointer-events-none">
          <PaperAirplane className="w-10 sm:w-14 h-10 sm:h-14" />
        </div>

        {/* Floating Twinkling Stars */}
        <div className="absolute top-36 left-8 z-10 anim-pulse-glow pointer-events-none">
          <DoodleStar className="w-7 h-7 text-amber-400" />
        </div>
        <div className="absolute bottom-28 right-16 z-10 anim-float-slow pointer-events-none">
          <DoodleStar className="w-8 h-8 text-yellow-400" />
        </div>

        {/* Fantasy Illustration Hero Backdrop */}
        <div className="relative w-full min-h-[500px] sm:min-h-[600px] lg:min-h-[660px] flex items-center justify-center">
          
          {/* Generated Image Background with Soft Warm Filter */}
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/magical-hero-world.jpg"
              alt="Magical fairy-tale learning world with floating treehouses and children exploring"
              className="w-full h-full object-cover object-center filter saturate-110 brightness-102"
            />
            {/* Soft Ambient Dream Overlay - kept gentle so world artwork shines through */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-950/20 via-transparent to-sky-950/30" />
            <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[#eaf6ff]/90 to-transparent" />
          </div>

          {/* Centered Hero Content with Crisp High-Contrast Typography & Cloud Glow */}
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center pt-6 sm:pt-10 pb-16 sm:pb-24">
            
            {/* Ambient Sunlit Cloud Halo behind title to guarantee 100% contrast */}
            <div className="relative max-w-3xl mx-auto py-2">
              <div className="absolute inset-0 -inset-x-8 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.92)_0%,rgba(255,255,255,0.65)_50%,transparent_80%)] rounded-full blur-md -z-10 pointer-events-none" />

              {/* Ultra-Visible Hero Title (Matching WonderLearn Typography & Deep Teal Colors) */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#0f4c5c] tracking-tight leading-[1.08] mb-3 drop-shadow-[0_2px_12px_rgba(255,255,255,1)] [text-shadow:_0_0_24px_rgba(255,255,255,1),_0_2px_8px_rgba(255,255,255,1)]">
                Let Curiosity <br />
                <span className="text-[#0d5c56] drop-shadow-[0_2px_16px_rgba(255,255,255,1)] [text-shadow:_0_0_24px_rgba(255,255,255,1),_0_2px_8px_rgba(255,255,255,1)] inline-block">
                  Lead the Way
                </span>
              </h1>

              {/* Ultra-Visible Subtitle (Deep Slate with Pure White Halo) */}
              <p className="text-base sm:text-2xl font-black text-[#0f172a] max-w-xl mx-auto mb-7 drop-shadow-[0_2px_10px_rgba(255,255,255,1)] [text-shadow:_0_0_16px_rgba(255,255,255,1),_0_1px_4px_rgba(255,255,255,1)]">
                A magical world where learning feels like an adventure!
              </p>
            </div>

            {/* Primary CTA: Golden Chunky Button with Pip Companion */}
            <div className="inline-flex items-center justify-center gap-4 relative mt-1">
              {/* Animated Glow Halo */}
              <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full blur-lg opacity-75 anim-pulse-glow -z-10" />

              <Link href="/lessons" onClick={() => playSound('magic')}>
                <button className="px-8 sm:px-12 py-3.5 sm:py-4 rounded-full font-black text-lg sm:text-xl text-[#78350f] bg-[#facc15] hover:bg-[#eab308] border-2 border-white border-b-4 border-[#ca8a04] shadow-2xl shadow-amber-950/40 hover:scale-106 active:scale-95 transition-all flex items-center gap-3 mx-auto relative overflow-hidden group cursor-pointer">
                  {/* Shimmer light pass */}
                  <div className="anim-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

                  <Sparkles size={22} className="text-amber-800 anim-spin-slow" />
                  <span>Start Exploring</span>
                  <ArrowRight size={20} className="text-amber-900 group-hover:translate-x-1.5 transition-transform" />
                </button>
              </Link>

              {/* Interactive Pip Mascot Companion (Floating playfully next to button) */}
              <div
                onClick={handlePipClick}
                className="hidden sm:flex anim-float cursor-pointer group flex-col items-center"
                title="Click Pip to say hello!"
              >
                <div className="bg-white/95 backdrop-blur-md rounded-2xl px-3 py-1 border border-amber-300 shadow-md flex items-center gap-1.5 mb-1 text-[11px] font-black text-[#0f4c5c] whitespace-nowrap">
                  <span>👋 Pip</span>
                </div>
                <div className="p-1 rounded-full bg-white/70 backdrop-blur-sm shadow-md group-hover:scale-115 transition-transform">
                  <Pip size="sm" mood={pipMood} animate="idle" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Floating Trust Bar (Frosted White Pill Bar with Bouncy Hover) ── */}
        <div className="relative z-20 max-w-5xl mx-auto px-4 -mt-8 sm:-mt-10 mb-8 sm:mb-12">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl sm:rounded-full px-4 sm:px-8 py-3.5 border-2 border-white shadow-xl shadow-sky-900/10 flex flex-wrap items-center justify-around gap-3 sm:gap-6 text-xs sm:text-sm font-black text-[#1e293b]">
            
            <div
              className="flex items-center gap-2 cursor-pointer hover:scale-108 transition-transform"
              onClick={() => playSound('pop')}
            >
              <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-base anim-wiggle">
                🛡️
              </span>
              <span>Safe & Ad-Free</span>
            </div>

            <div className="w-px h-5 bg-slate-200 hidden sm:block" />

            <div
              className="flex items-center gap-2 cursor-pointer hover:scale-108 transition-transform"
              onClick={() => playSound('pop')}
            >
              <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-base anim-float">
                ⭐
              </span>
              <span>Expert Curated</span>
            </div>

            <div className="w-px h-5 bg-slate-200 hidden sm:block" />

            <div
              className="flex items-center gap-2 cursor-pointer hover:scale-108 transition-transform"
              onClick={() => playSound('pop')}
            >
              <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-base anim-float-slow">
                🎮
              </span>
              <span>Learn Through Play</span>
            </div>

            <div className="w-px h-5 bg-slate-200 hidden sm:block" />

            <div
              className="flex items-center gap-2 cursor-pointer hover:scale-108 transition-transform"
              onClick={() => playSound('pop')}
            >
              <span className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-base anim-pulse-glow">
                ❤️
              </span>
              <span>For Ages 0–14</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          3. EXPLORE BY TOPIC (Framed by Bunny Scholar & Signpost)
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="w-full py-8 sm:py-14 px-4 sm:px-8 max-w-7xl mx-auto relative">
        
        {/* Section Title */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100 border border-sky-200 text-xs font-black text-[#0369a1] mb-2 shadow-xs">
            <Sparkles size={14} className="text-amber-500 anim-spin-slow" />
            <span>Interactive Learning Adventures</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-[#0f4c5c] tracking-tight">
            ✦ Explore by Topic ✦
          </h2>
          <p className="text-slate-600 font-bold text-sm sm:text-base mt-2 max-w-lg mx-auto">
            Choose a subject to embark on quests, hear spoken stories, and collect XP stars!
          </p>
        </div>

        {/* Mascot Banner for Mobile/Tablet */}
        <div className="flex xl:hidden items-center justify-center gap-4 mb-6 px-2">
          {/* Bunny */}
          <div
            onClick={() => playSound('magic')}
            className="flex items-center gap-2.5 bg-white/95 rounded-2xl px-3.5 py-2 border-2 border-amber-200 shadow-sm cursor-pointer hover:scale-105 transition-transform"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/bunny-scholar.jpg"
              alt="Bunny scholar"
              className="w-10 h-12 object-contain rounded-lg anim-float"
            />
            <div>
              <p className="text-xs font-black text-[#0f4c5c]">Bunny Scholar</p>
              <p className="text-[10px] font-bold text-slate-500">Pick a topic! 📖</p>
            </div>
          </div>

          {/* Signpost */}
          <div
            onClick={() => playSound('chime')}
            className="flex items-center gap-2.5 bg-white/95 rounded-2xl px-3.5 py-2 border-2 border-emerald-200 shadow-sm cursor-pointer hover:scale-105 transition-transform"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/wooden-signpost.jpg"
              alt="Wooden signpost"
              className="w-10 h-12 object-contain rounded-lg anim-float-slow"
            />
            <div>
              <p className="text-xs font-black text-emerald-800">Adventure Post</p>
              <p className="text-[10px] font-bold text-slate-500">Have fun! 🐦</p>
            </div>
          </div>
        </div>

        {/* Grid Container with Seamless Side Mascots & Chunky Rounded Cards */}
        <div className="relative flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-6">
          
          {/* Left Mascot: Seamless Bunny Scholar (Visible on Desktop/Laptops) */}
          <div className="hidden lg:flex flex-col items-center flex-shrink-0 w-28 lg:w-36 -mt-2">
            <div
              onClick={() => playSound('magic')}
              className="anim-float cursor-pointer group hover:scale-108 transition-transform flex flex-col items-center"
              title="Click Bunny to cheer!"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/bunny-scholar.jpg"
                alt="Cute bunny mascot scholar holding open book"
                className="w-28 lg:w-36 h-40 lg:h-48 object-contain filter drop-shadow-md mix-blend-multiply"
              />
            </div>
          </div>

          {/* 6 Chunky Rounded-Square Claymorphic Topic Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4 w-full">
            {topics.map(topic => (
              <Link
                key={topic.id}
                href={`${topic.href}&age=${childAgeGroup}`}
                onClick={() => playSound('pop')}
                className="group focus:outline-none"
              >
                <div
                  className={`${topic.cardBg} rounded-[28px] sm:rounded-[32px] p-3 sm:p-4 border-2 ${topic.border} border-b-[5px] shadow-sm hover:shadow-xl hover:-translate-y-2 hover:scale-106 active:scale-95 transition-all duration-200 flex flex-col items-center justify-center text-center aspect-square cursor-pointer relative overflow-hidden`}
                >
                  {/* Subtle Light Reflection */}
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  {/* 3D Icon Container in Soft White Squircle */}
                  <div
                    className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-white/95 border-2 border-white shadow-xs flex items-center justify-center p-2.5 anim-float group-hover:scale-115 transition-transform"
                  >
                    <topic.IconComponent className="w-full h-full" />
                  </div>

                  {/* Clean Bold Title */}
                  <h3 className={`text-xs sm:text-sm font-black ${topic.textColor} leading-tight mt-2.5 group-hover:scale-105 transition-transform`}>
                    {topic.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>

          {/* Right Mascot: Seamless Wooden Signpost & Bluebird (Visible on Desktop/Laptops) */}
          <div className="hidden lg:flex flex-col items-center flex-shrink-0 w-28 lg:w-36 -mt-2">
            <div
              onClick={() => playSound('chime')}
              className="anim-float-slow cursor-pointer group hover:scale-108 transition-transform flex flex-col items-center"
              title="Click signpost to chime!"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/wooden-signpost.jpg"
                alt="Rustic wooden signpost pointing to Discover, Learn, Have Fun"
                className="w-28 lg:w-36 h-40 lg:h-48 object-contain filter drop-shadow-md mix-blend-multiply"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          4. MAGICAL STORIES SECTION (4 Illustrated Stories with Tactile Modals)
          ══════════════════════════════════════════════════════════════════════ */}
      <section id="stories" className="w-full py-10 sm:py-16 px-4 sm:px-8 bg-white/70 border-y-2 border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-black text-xs mb-2">
                <span>📚</span>
                <span>Bedtime & Day Lessons</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-[#0f4c5c] tracking-tight">
                ✦ Magical Stories ✦
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/stories"
                onClick={() => playSound('pop')}
                className="px-5 py-2 rounded-full font-black text-xs sm:text-sm text-[#0284c7] bg-[#e0f2fe] hover:bg-[#bae6fd] border border-[#7dd3fc] transition-all hover:scale-105 active:scale-95 shadow-xs"
              >
                View All Stories
              </Link>
            </div>
          </div>

          {/* Stories Carousel with Left/Right Buttons */}
          <div className="relative">
            {/* Left Circular Arrow Button */}
            <button
              type="button"
              onClick={() => playSound('pop')}
              className="hidden lg:flex absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer"
              title="Previous stories"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Stories Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stories.map(story => (
                <div
                  key={story.id}
                  className="bg-white rounded-3xl p-3.5 border-2 border-slate-200 border-b-4 hover:border-[#38bdf8] hover:border-b-[#0284c7] shadow-sm hover:shadow-xl hover:-translate-y-2 hover:scale-102 active:scale-98 transition-all duration-200 flex flex-col group justify-between"
                >
                  <div
                    onClick={() => {
                      playSound('chime')
                      setActiveStory(story)
                    }}
                    className="cursor-pointer"
                  >
                    {/* Story Book Cover Image */}
                    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 shadow-inner mb-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={story.coverImage}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                      />
                      <span className={`absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[11px] font-black border ${story.tagColor} shadow-xs`}>
                        {story.tag}
                      </span>
                      
                      {/* Play Disc Button */}
                      <div className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-[#10b981] text-white flex items-center justify-center shadow-md group-hover:bg-[#059669] group-hover:scale-115 transition-all border-2 border-white">
                        <Play size={14} className="fill-current ml-0.5" />
                      </div>
                    </div>

                    {/* Story Info */}
                    <h3 className="font-black text-base sm:text-lg text-slate-800 leading-snug group-hover:text-[#0284c7] transition-colors line-clamp-1">
                      {story.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold mt-1 line-clamp-2">
                      {story.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-black">
                    <span className="text-slate-400">{story.ageRange}</span>
                    <Link
                      href={`/stories/${story.id}`}
                      onClick={() => playSound('magic')}
                      className="text-[#0284c7] hover:text-[#0369a1] group-hover:translate-x-1 transition-transform flex items-center gap-1 font-extrabold"
                    >
                      <span>Read & Listen →</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Circular Arrow Button */}
            <button
              type="button"
              onClick={() => playSound('pop')}
              className="hidden lg:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer"
              title="Next stories"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Interactive Story Preview Modal with Read-Aloud Narration ──── */}
      <AnimatePresence>
        {activeStory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 border-4 border-amber-300 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel()
                  }
                  playSound('pop')
                  setActiveStory(null)
                }}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-black transition-all hover:scale-110 active:scale-90 cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-4 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeStory.coverImage}
                  alt={activeStory.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-black bg-white/95 text-slate-800 shadow-sm">
                  {activeStory.tag} • {activeStory.ageRange}
                </span>

                {/* Listen to Preview Button on Artwork */}
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                      window.speechSynthesis.cancel()
                      playSound('magic')
                      const utt = new SpeechSynthesisUtterance(activeStory.description)
                      utt.rate = 0.85
                      utt.pitch = 1.15
                      window.speechSynthesis.speak(utt)
                    }
                  }}
                  className="absolute bottom-3 right-3 px-3.5 py-1.5 rounded-full bg-black/70 hover:bg-black/90 text-white font-black text-xs flex items-center gap-1.5 backdrop-blur-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-md"
                >
                  <Volume2 size={14} className="text-amber-400" />
                  <span>Listen to Intro</span>
                </button>
              </div>

              <h3 className="text-2xl font-black text-slate-800 mb-1">
                {activeStory.title}
              </h3>
              <p className="text-sm font-bold text-slate-600 mb-6 leading-relaxed">
                {activeStory.description}
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Link
                  href={`/stories/${activeStory.id}`}
                  onClick={() => {
                    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                      window.speechSynthesis.cancel()
                    }
                    playSound('magic')
                  }}
                  className="w-full sm:flex-1 py-3.5 rounded-2xl font-black text-center text-slate-900 bg-[#facc15] hover:bg-[#eab308] border-b-4 border-[#ca8a04] shadow-md transition-all hover:scale-102 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <BookOpen size={16} />
                  <span>Start Reading with Pip ➔</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                      window.speechSynthesis.cancel()
                    }
                    playSound('pop')
                    setActiveStory(null)
                  }}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-2xl font-black text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          5. PLAY & LEARN (5 Illustrated Quests Matching WonderLearn)
          ══════════════════════════════════════════════════════════════════════ */}
      <section id="games" className="w-full py-10 sm:py-16 px-4 sm:px-8 bg-[#e8f7f5] border-y-2 border-[#ccede7]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs mb-2">
                <span>🎮</span>
                <span>Interactive Learning Games</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-[#0f4c5c] tracking-tight">
                ✦ Play & Learn ✦
              </h2>
            </div>

            <Link
              href="/lessons"
              onClick={() => playSound('pop')}
              className="px-5 py-2 rounded-full font-black text-xs sm:text-sm text-[#059669] bg-white hover:bg-emerald-50 border border-[#6ee7b7] transition-all hover:scale-105 active:scale-95 shadow-xs"
            >
              View All Games
            </Link>
          </div>

          {/* 5 Illustrated Game Thumbnail Cards (Centered Green Play Disc on Pastel Card) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
            {games.map(game => (
              <Link
                key={game.id}
                href={game.href.includes('?') ? `${game.href}&age=${childAgeGroup}` : `${game.href}?age=${childAgeGroup}`}
                onClick={() => playSound('chime')}
                className="group focus:outline-none flex flex-col items-center"
              >
                <div
                  className={`w-full ${game.cardBg} rounded-[28px] sm:rounded-[32px] p-2.5 sm:p-3 border-2 ${game.border} border-b-[5px] shadow-sm hover:shadow-xl hover:-translate-y-2 hover:scale-105 active:scale-95 transition-all duration-200 flex flex-col items-center justify-between aspect-[1/1.2] cursor-pointer relative overflow-hidden`}
                >
                  {/* 3D Illustrated Game Artwork */}
                  <div className="relative w-full h-[78%] rounded-2xl overflow-hidden bg-white/40 shadow-inner flex items-center justify-center">
                    {game.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={game.thumbnail}
                        alt={game.title}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                      />
                    ) : game.ThumbnailComponent ? (
                      <div className="w-full h-full group-hover:scale-108 transition-transform duration-300">
                        <game.ThumbnailComponent className="w-full h-full" />
                      </div>
                    ) : null}

                    {/* Top-left Category Pill */}
                    <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/90 text-slate-700 shadow-xs backdrop-blur-xs">
                      {game.badge}
                    </span>
                  </div>

                  {/* Centered Glowing Emerald Green Play Disc */}
                  <div className="w-full flex items-center justify-center pt-1 pb-0.5">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#10b981] group-hover:bg-[#059669] text-white flex items-center justify-center shadow-md shadow-emerald-700/40 border-2 border-white group-hover:scale-115 transition-transform">
                      <Play size={14} className="fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Game Title Below Card */}
                <h3 className="font-black text-xs sm:text-sm text-[#0f4c5c] group-hover:text-[#0284c7] transition-colors mt-2 text-center line-clamp-1">
                  {game.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          6. FEATURED ADVENTURES (Interactive Multi-Adventure Carousel)
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="w-full py-8 sm:py-12 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-black text-[#0f4c5c] tracking-tight">
            ✦ Featured Adventures ✦
          </h2>
        </div>

        {(() => {
          const adv = featuredAdventures[activeAdventureIndex] || featuredAdventures[0]
          return (
            <div className="relative rounded-3xl sm:rounded-[36px] overflow-hidden bg-gradient-to-r from-[#dbeafe] via-[#eff6ff] to-[#fef3c7] border-2 border-[#bfdbfe] border-b-4 shadow-md flex flex-col md:flex-row items-center transition-all">
              
              {/* Panoramic Illustration */}
              <div className="relative w-full md:w-1/2 aspect-[16/10] md:aspect-auto md:h-80 overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={adv.image}
                  alt={adv.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>

              {/* Copy and CTA Button */}
              <div className="p-6 sm:p-10 md:w-1/2 flex flex-col justify-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-black text-xs self-start mb-3 border border-amber-200">
                  <Sparkles size={13} className="text-amber-600" />
                  <span>{adv.badge}</span>
                </div>
                <h3 className="text-2xl sm:text-4xl font-black text-[#0f4c5c] tracking-tight mb-2">
                  {adv.title}
                </h3>
                <p className="text-sm sm:text-base font-bold text-slate-600 mb-6 leading-relaxed">
                  {adv.desc}
                </p>
                <div>
                  <Link
                    href={adv.href.includes('?') ? `${adv.href}&age=${childAgeGroup}` : `${adv.href}?age=${childAgeGroup}`}
                    onClick={() => playSound('pop')}
                    className="inline-flex items-center gap-2 px-7 sm:px-9 py-3.5 sm:py-4 rounded-full font-black text-sm sm:text-base text-slate-900 bg-[#facc15] hover:bg-[#eab308] border-b-4 border-[#ca8a04] shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Start Adventure</span>
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Carousel Pagination Dots */}
        <div className="flex items-center justify-center gap-2.5 mt-5">
          {featuredAdventures.map((adv, idx) => (
            <button
              key={adv.id}
              type="button"
              onClick={() => {
                playSound('pop')
                setActiveAdventureIndex(idx)
              }}
              className={`h-3 rounded-full transition-all cursor-pointer ${
                activeAdventureIndex === idx ? 'w-8 bg-[#0d9488]' : 'w-3 bg-slate-300 hover:bg-slate-400'
              }`}
              title={adv.title}
            />
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          7. LOVED BY PARENTS (Wall of Love Testimonials)
          ══════════════════════════════════════════════════════════════════════ */}
      {testimonialsData.visible && testimonialsData.items.length > 0 ? (
        <section className="w-full py-10 sm:py-16 px-4 sm:px-8 bg-white/70 border-t-2 border-b-2 border-slate-200">
          <div className="max-w-7xl mx-auto">
            
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-4xl font-black text-[#0f4c5c] tracking-tight">
                ✦ Loved by Parents ✦
              </h2>
              <p className="text-slate-500 font-bold text-sm mt-1">
                Real families learning, laughing and leveling up every day.
              </p>

              {user?.role === 'admin' && (
                <div className="mt-3 flex items-center justify-center">
                  <Link
                    href="/admin/testimonials"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 hover:bg-slate-900 text-[#4ade80] text-xs font-bold transition-all shadow-sm"
                  >
                    <Settings size={13} />
                    <span>Admin: Manage Testimonials</span>
                  </Link>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonialsData.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-6 border-2 border-slate-200 border-b-4 shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all duration-200"
                >
                  <div>
                    {/* Gold Stars */}
                    <div className="flex items-center gap-1 mb-3 text-amber-400">
                      {[...Array(item.rating || 5)].map((_, i) => (
                        <Star key={i} size={16} className="fill-amber-400 text-amber-400 anim-wiggle" style={{ animationDelay: `${i * 0.2}s` }} />
                      ))}
                    </div>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                      &ldquo;{item.quote}&rdquo;
                    </p>
                  </div>

                  <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
                    <div className={`w-11 h-11 rounded-2xl ${item.avatar_bg || 'bg-rose-100 border-rose-300'} border-2 flex items-center justify-center text-xl shadow-xs anim-float`}>
                      {item.avatar}
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-800 leading-tight">
                        {item.name}
                      </h4>
                      <p className="text-xs font-bold text-slate-400 mt-0.5">
                        {item.role}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ══════════════════════════════════════════════════════════════════════
          8. LEARNING ON THE GO! (Animated Mobile Mascots Banner)
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="w-full py-12 sm:py-16 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-b from-[#e0f2fe] to-[#bae6fd] border-2 border-[#7dd3fc] border-b-4 p-6 sm:p-10 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* Animated Mascots Art with Float Loop */}
          <div className="w-full md:w-5/12 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/mascots-mobile.jpg"
              alt="Purple monster holding tablet and orange fox holding phone"
              className="max-h-60 sm:max-h-72 object-contain drop-shadow-xl anim-float cursor-pointer hover:scale-110 transition-transform"
              onClick={() => playSound('boing')}
              title="Click mascots to play!"
            />
          </div>

          {/* Copy & Badges */}
          <div className="w-full md:w-7/12 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 text-[#0284c7] font-black text-xs mb-3 border border-white">
              <Smartphone size={14} />
              <span>Available Everywhere</span>
            </div>
            <h3 className="text-2xl sm:text-4xl font-black text-[#0f4c5c] tracking-tight leading-tight mb-2">
              Learning on the Go!
            </h3>
            <p className="text-sm sm:text-base font-bold text-slate-600 mb-6 max-w-lg">
              Enjoy Bright Steps anywhere, anytime — seamlessly on tablets, phones, or on your computer right in your browser!
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <Link
                href="/lessons"
                onClick={() => playSound('magic')}
                className="px-8 py-4 rounded-full font-black text-sm sm:text-base text-white bg-[#0284c7] hover:bg-[#0369a1] border-b-4 border-[#075985] shadow-lg hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Play in Browser Now ✨</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          9. WAVY SCALLOPED FOOTER (Emerald / Teal Rolling Hills)
          ══════════════════════════════════════════════════════════════════════ */}
      <footer className="w-full bg-[#0d5c56] text-white pt-12 pb-8 mt-auto border-t-4 border-[#0a4843]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pb-10 border-b border-emerald-700/60">
            
            {/* Brand Column */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#fde047] text-amber-900 flex items-center justify-center text-xl shadow-md font-black anim-wiggle">
                  📖
                </div>
                <div>
                  <h4 className="text-xl font-black text-white leading-tight">
                    Bright Steps
                  </h4>
                  <p className="text-xs font-bold text-emerald-200">
                    Imagine • Discover • Grow
                  </p>
                </div>
              </div>
              <p className="text-sm font-bold text-emerald-100 max-w-sm leading-relaxed">
                Making learning magical for every child. Safe, voice-interactive, ad-free educational adventures designed for kids aged 0–14.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h5 className="font-black text-xs uppercase tracking-wider text-amber-300 mb-3">
                Quick Links
              </h5>
              <ul className="space-y-2 text-sm font-bold text-emerald-100">
                <li>
                  <Link href="/lessons" className="hover:text-amber-300 transition-colors">
                    Explore Topics
                  </Link>
                </li>
                <li>
                  <a href="#stories" className="hover:text-amber-300 transition-colors">
                    Stories
                  </a>
                </li>
                <li>
                  <a href="#games" className="hover:text-amber-300 transition-colors">
                    Games & Quests
                  </a>
                </li>
                <li>
                  <Link href="/videos" className="hover:text-amber-300 transition-colors">
                    Videos
                  </Link>
                </li>
              </ul>
            </div>

            {/* For Parents */}
            <div>
              <h5 className="font-black text-xs uppercase tracking-wider text-amber-300 mb-3">
                For Parents
              </h5>
              <ul className="space-y-2 text-sm font-bold text-emerald-100">
                <li>
                  <Link href="/parent" className="hover:text-amber-300 transition-colors">
                    Parent Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/parent" className="hover:text-amber-300 transition-colors">
                    Child Safety & Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/parent" className="hover:text-amber-300 transition-colors">
                    Curriculum Standards
                  </Link>
                </li>
                <li>
                  <Link href="/demo" className="hover:text-amber-300 transition-colors">
                    Free Trial Demo
                  </Link>
                </li>
              </ul>
            </div>

            {/* Stay Connected */}
            <div>
              <h5 className="font-black text-xs uppercase tracking-wider text-amber-300 mb-3">
                Stay Connected
              </h5>
              <p className="text-xs font-bold text-emerald-200 mb-3">
                Subscribe for new weekly lessons & activity sheets:
              </p>
              <div className="flex items-center gap-1.5">
                <input
                  type="email"
                  placeholder="Enter parent email"
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-800 placeholder-slate-400 outline-none w-full"
                />
                <button
                  type="button"
                  onClick={() => playSound('pop')}
                  className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs transition-colors flex-shrink-0 cursor-pointer"
                >
                  Join
                </button>
              </div>
            </div>
          </div>

          {/* Copyright Row */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs font-bold text-emerald-300 gap-3">
            <p>© 2026 Bright Steps. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/parent" className="hover:underline">Privacy Policy</Link>
              <span>•</span>
              <Link href="/parent" className="hover:underline">Terms of Service</Link>
              <span>•</span>
              <Link href="/parent" className="hover:underline">Contact Support</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
