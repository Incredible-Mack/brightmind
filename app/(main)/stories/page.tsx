'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Star,
  Play,
  Volume2,
  BookOpen,
  ArrowLeft,
  ChevronRight,
  Clock,
  Heart,
} from 'lucide-react'
import { STORIES_DATA } from '@/lib/stories.data'
import { useAppStore } from '@/store/useAppStore'
import { getAgeGroup } from '@/lib/curriculum.data'

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

export default function StoriesGalleryPage() {
  const { child } = useAppStore()
  const childAgeGroup = child ? getAgeGroup(child.age ?? 4) : '0-5'
  const [activeFilter, setActiveFilter] = useState<string>(childAgeGroup)

  const filteredStories =
    activeFilter === 'all'
      ? STORIES_DATA
      : STORIES_DATA.filter(s => s.targetAge === activeFilter)

  return (
    <div className="min-h-screen bg-[#f0f9ff] flex flex-col font-nunito selection:bg-amber-300 selection:text-slate-900 pb-20">
      
      {/* ── Top Header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-sky-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <Link
            href="/"
            onClick={() => playSound('pop')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 hover:bg-sky-100 text-[#0284c7] font-black text-xs sm:text-sm border border-sky-200 transition-all hover:scale-105"
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-lg">
              📚
            </span>
            <span className="text-sm sm:text-base font-black text-[#0f4c5c]">
              Magical Storybooks
            </span>
          </div>

          <Link
            href="/lessons"
            onClick={() => playSound('pop')}
            className="px-4 py-1.5 rounded-full font-black text-xs text-[#0284c7] bg-[#e0f2fe] border border-[#7dd3fc] hover:bg-[#bae6fd] transition-all"
          >
            All Courses
          </Link>
        </div>
      </header>

      {/* ── Hero Banner ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 sm:pt-12 pb-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 border border-purple-200 text-xs font-black text-purple-700 mb-3 shadow-xs">
          <Sparkles size={14} className="text-amber-500" />
          <span>Interactive Audio Read-Along Stories</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-[#0f4c5c] tracking-tight">
          ✦ Magical Storybooks ✦
        </h1>
        <p className="text-slate-600 font-bold text-sm sm:text-base mt-2 max-w-xl mx-auto">
          Listen to soothing narration, tap any word to hear it pronounced, and explore enchanting adventures with Pip!
        </p>

        {/* Age Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          <button
            type="button"
            onClick={() => {
              playSound('pop')
              setActiveFilter('all')
            }}
            className={`px-4 py-1.5 rounded-full font-black text-xs transition-all ${
              activeFilter === 'all'
                ? 'bg-[#0284c7] text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Stories
          </button>
          <button
            type="button"
            onClick={() => {
              playSound('pop')
              setActiveFilter('0-5')
            }}
            className={`px-4 py-1.5 rounded-full font-black text-xs transition-all ${
              activeFilter === '0-5'
                ? 'bg-[#10b981] text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Ages 3–5
          </button>
          <button
            type="button"
            onClick={() => {
              playSound('pop')
              setActiveFilter('6-8')
            }}
            className={`px-4 py-1.5 rounded-full font-black text-xs transition-all ${
              activeFilter === '6-8'
                ? 'bg-[#3b82f6] text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Ages 6–8
          </button>
        </div>
      </section>

      {/* ── Stories Grid ────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-4 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredStories.map(story => (
            <Link
              key={story.id}
              href={`/stories/${story.id}`}
              onClick={() => playSound('magic')}
              className="bg-white rounded-3xl p-4 border-2 border-slate-200 border-b-4 hover:border-[#38bdf8] hover:border-b-[#0284c7] shadow-sm hover:shadow-xl hover:-translate-y-2 hover:scale-102 active:scale-98 transition-all duration-200 cursor-pointer flex flex-col group justify-between"
            >
              <div>
                {/* Book Cover */}
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 shadow-inner mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={story.coverImage}
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                  />
                  <span className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[11px] font-black border ${story.tagColor} shadow-xs`}>
                    {story.tag}
                  </span>

                  {/* Play Disc Button */}
                  <div className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-[#10b981] group-hover:bg-[#059669] text-white flex items-center justify-center shadow-md group-hover:scale-115 transition-transform border-2 border-white">
                    <Play size={16} className="fill-current ml-0.5" />
                  </div>
                </div>

                {/* Title & Info */}
                <h3 className="font-black text-lg text-slate-800 leading-snug group-hover:text-[#0284c7] transition-colors">
                  {story.title}
                </h3>
                <p className="text-xs text-slate-500 font-bold mt-1 line-clamp-2">
                  {story.summary}
                </p>
              </div>

              {/* Bottom Card Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-black text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock size={13} />
                  <span>{story.readTime}</span>
                </span>
                <span className="text-[#0284c7] group-hover:translate-x-1 transition-transform flex items-center gap-1 font-extrabold">
                  Read & Listen →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  )
}

