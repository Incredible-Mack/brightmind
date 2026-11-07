'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Star,
  Award,
  BookOpen,
  ArrowLeft,
  Heart,
  Smile,
  CheckCircle2,
} from 'lucide-react'
import { getStoryById, STORIES_DATA, StoryCourse } from '@/lib/stories.data'
import { Pip, PipMood } from '@/components/mascot/Pip'
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

export default function StoryReaderPage() {
  const params = useParams()
  const router = useRouter()
  const storyId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string)

  const story = (storyId ? getStoryById(storyId) : undefined) || STORIES_DATA[0]
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentWordIndex, setCurrentWordIndex] = useState<number | null>(null)
  const [speed, setSpeed] = useState<'normal' | 'slow'>('normal')
  const [isCompleted, setIsCompleted] = useState(false)
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [pipMood, setPipMood] = useState<PipMood>('happy')

  const { addXP } = useAppStore()
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const currentPage = story?.pages?.[currentPageIndex] || story?.pages?.[0] || STORIES_DATA[0].pages[0]
  const totalPages = story?.pages?.length || 1

  // Split text into words for clickable word-by-word read-along
  const words = currentPage?.text ? currentPage.text.split(/\s+/) : []

  // Cancel any ongoing speech
  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsPlaying(false)
    setCurrentWordIndex(null)
  }, [])

  // Single word pronunciation helper
  const speakWord = (word: string) => {
    playSound('pop')
    setSelectedWord(word)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const cleanWord = word.replace(/[^a-zA-Z]/g, '')
      const utt = new SpeechSynthesisUtterance(cleanWord)
      utt.rate = 0.8
      utt.pitch = 1.2
      window.speechSynthesis.speak(utt)
    }
  }

  // Full page narration with word boundary tracking
  const startSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()
    setIsPlaying(true)
    setPipMood('listening')
    playSound('magic')

    const utterance = new SpeechSynthesisUtterance(currentPage.text)
    utteranceRef.current = utterance

    // Gentle child narrator rate & pitch
    utterance.rate = speed === 'slow' ? 0.75 : 0.88
    utterance.pitch = 1.15

    // Word boundary event highlights word as it is spoken
    utterance.onboundary = event => {
      if (event.name === 'word') {
        const charIndex = event.charIndex
        // Find which word index corresponds to charIndex
        const textUpToChar = currentPage.text.slice(0, charIndex)
        const wordIdx = textUpToChar.trim().split(/\s+/).length - 1
        setCurrentWordIndex(Math.max(0, wordIdx))
      }
    }

    utterance.onend = () => {
      setIsPlaying(false)
      setCurrentWordIndex(null)
      setPipMood('excited')
      playSound('chime')
    }

    utterance.onerror = () => {
      setIsPlaying(false)
      setCurrentWordIndex(null)
    }

    window.speechSynthesis.speak(utterance)
  }

  const togglePlayPause = () => {
    if (isPlaying) {
      stopSpeech()
    } else {
      startSpeech()
    }
  }

  // Handle page turns
  const goToNextPage = () => {
    stopSpeech()
    playSound('pop')
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(prev => prev + 1)
    } else {
      // Completed the story!
      triggerCompletion()
    }
  }

  const goToPrevPage = () => {
    stopSpeech()
    playSound('pop')
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1)
    }
  }

  // Celebration upon finishing story
  const triggerCompletion = () => {
    setIsCompleted(true)
    playSound('magic')
    addXP(story.xpReward)

    if (typeof window !== 'undefined') {
      import('canvas-confetti')
        .then(({ default: confetti }) => {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#38bdf8', '#facc15', '#4ade80', '#ec4899', '#a855f7'],
          })
        })
        .catch(() => {})
    }
  }

  // Clean up speech synthesis when component unmounts or page changes
  useEffect(() => {
    return () => {
      stopSpeech()
    }
  }, [stopSpeech])

  // Stop speech when changing pages
  useEffect(() => {
    stopSpeech()
  }, [currentPageIndex, stopSpeech])

  return (
    <div className="min-h-screen bg-[#f0f9ff] flex flex-col font-nunito selection:bg-amber-300 selection:text-slate-900 pb-16">
      
      {/* ── Top Header Navigation Bar ─────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-sky-100 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            onClick={() => {
              stopSpeech()
              playSound('pop')
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 hover:bg-sky-100 text-[#0284c7] font-black text-xs sm:text-sm border border-sky-200 transition-all hover:scale-105"
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>

          {/* Story Title & Badge */}
          <div className="flex items-center gap-2 text-center">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${story.tagColor}`}>
              {story.tag}
            </span>
            <h1 className="text-sm sm:text-base font-black text-[#0f4c5c] hidden sm:block">
              {story.title}
            </h1>
          </div>

          {/* XP Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-black text-xs shadow-xs">
            <Star size={14} className="fill-amber-400 text-amber-500" />
            <span>+{story.xpReward} XP</span>
          </div>
        </div>
      </header>

      {/* ── Main Story Book Container ──────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 pt-6 sm:pt-8 w-full flex-1">
        
        {/* Story Book Card Frame */}
        <div className="bg-white rounded-3xl sm:rounded-[36px] border-4 border-white shadow-xl shadow-sky-900/10 overflow-hidden relative flex flex-col">
          
          {/* Top Illustration Banner with Ambient Gradient */}
          <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] max-h-80 overflow-hidden bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentPage.illustration}
              alt={currentPage.heading}
              className="w-full h-full object-cover filter brightness-105"
            />
            {/* Soft Ambient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Page Heading & Number Pill */}
            <div className="absolute bottom-4 inset-x-6 flex items-end justify-between">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 drop-shadow-md">
                  Page {currentPage.pageNumber} of {totalPages}
                </span>
                <h2 className="text-xl sm:text-3xl font-black text-white drop-shadow-lg tracking-tight">
                  {currentPage.heading}
                </h2>
              </div>

              {/* Read Time Tag */}
              <span className="px-3 py-1 rounded-full text-xs font-black bg-white/90 text-slate-800 shadow-md backdrop-blur-xs hidden sm:inline-block">
                📖 {story.readTime}
              </span>
            </div>
          </div>

          {/* ── Interactive Audio & Reading Controls Toolbar ─────────────── */}
          <div className="bg-[#f0f9ff] px-4 sm:px-8 py-3.5 border-b-2 border-sky-100 flex flex-wrap items-center justify-between gap-3">
            
            {/* Left: Play / Pause Audio Narration Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlayPause}
                className={`px-5 py-2.5 rounded-full font-black text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                  isPlaying
                    ? 'bg-amber-400 hover:bg-amber-500 text-amber-950 border-2 border-amber-300'
                    : 'bg-[#10b981] hover:bg-[#059669] text-white border-2 border-emerald-400'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause size={16} className="fill-current" />
                    <span>Pause Reading</span>
                  </>
                ) : (
                  <>
                    <Play size={16} className="fill-current ml-0.5" />
                    <span>Listen & Read</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  stopSpeech()
                  startSpeech()
                }}
                className="w-9 h-9 rounded-full bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                title="Restart narration"
              >
                <RotateCcw size={15} />
              </button>
            </div>

            {/* Right: Speed & Word Help Info */}
            <div className="flex items-center gap-3">
              {/* Narration Pace Toggle */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-sky-200 text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => {
                    setSpeed('slow')
                    playSound('pop')
                    if (isPlaying) {
                      stopSpeech()
                    }
                  }}
                  className={`px-2.5 py-1 rounded-full transition-all ${
                    speed === 'slow' ? 'bg-amber-200 text-amber-900 font-black' : 'hover:bg-slate-100'
                  }`}
                >
                  🐢 Slower
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSpeed('normal')
                    playSound('pop')
                    if (isPlaying) {
                      stopSpeech()
                    }
                  }}
                  className={`px-2.5 py-1 rounded-full transition-all ${
                    speed === 'normal' ? 'bg-[#0284c7] text-white font-black' : 'hover:bg-slate-100'
                  }`}
                >
                  🐰 Normal
                </button>
              </div>

              <span className="hidden md:inline-block text-[11px] font-bold text-slate-400">
                💡 Tap any word to hear it!
              </span>
            </div>
          </div>

          {/* ── Story Text Section (Child-Friendly Font & Word Highlighting) ── */}
          <div className="p-6 sm:p-10 flex-1 flex flex-col justify-between">
            <div>
              {/* Spoken Word Highlight Reader */}
              <div className="text-xl sm:text-2xl lg:text-[26px] font-bold text-[#1e293b] leading-[1.8] sm:leading-[1.85] tracking-wide select-none">
                {words.map((word, idx) => {
                  const isCurrent = currentWordIndex === idx
                  const isSelected = selectedWord === word
                  return (
                    <span
                      key={idx}
                      onClick={() => speakWord(word)}
                      className={`inline-block mr-2 px-1.5 py-0.5 rounded-xl cursor-pointer transition-all duration-150 ${
                        isCurrent
                          ? 'bg-[#fef08a] text-[#854d0e] font-black scale-108 shadow-sm ring-2 ring-amber-400'
                          : isSelected
                          ? 'bg-sky-100 text-[#0369a1] font-black'
                          : 'hover:bg-amber-100/70 hover:text-amber-900'
                      }`}
                      title="Click to pronounce"
                    >
                      {word}
                    </span>
                  )
                })}
              </div>

              {/* ── Vocabulary Helper Box ──────────────────────────────────── */}
              {currentPage.keywords && currentPage.keywords.length > 0 && (
                <div className="mt-8 pt-6 border-t-2 border-sky-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-amber-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-[#0f4c5c]">
                      Word Magic: Click to hear pronunciation!
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentPage.keywords.map((kw, i) => (
                      <div
                        key={i}
                        onClick={() => speakWord(kw.word)}
                        className="bg-sky-50/80 hover:bg-sky-100 rounded-2xl p-3 border border-sky-200 cursor-pointer transition-all hover:scale-102 flex items-start gap-2.5"
                      >
                        <span className="text-lg">⭐</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-[#0f4c5c]">{kw.word}</span>
                            {kw.phonetic && (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                [{kw.phonetic}]
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-slate-500 mt-0.5">
                            {kw.definition}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Interactive Pip Companion Box ──────────────────────────── */}
            <div className="mt-8 bg-amber-50 rounded-2xl p-4 border-2 border-amber-200 flex items-center gap-4">
              <div className="flex-shrink-0 anim-wiggle">
                <Pip size="sm" mood={pipMood} animate="idle" />
              </div>
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-black text-amber-900">
                  Pip&apos;s Wonder Question:
                </p>
                <p className="text-xs sm:text-sm font-bold text-amber-800 mt-0.5">
                  &ldquo;{currentPage.funPrompt}&rdquo;
                </p>
              </div>
            </div>

            {/* ── Page Turn Navigation Controls ─────────────────────────── */}
            <div className="mt-8 pt-6 border-t-2 border-slate-100 flex items-center justify-between">
              {/* Previous Page */}
              <button
                type="button"
                onClick={goToPrevPage}
                disabled={currentPageIndex === 0}
                className={`px-5 py-3 rounded-full font-black text-xs sm:text-sm flex items-center gap-2 transition-all ${
                  currentPageIndex === 0
                    ? 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-100'
                    : 'text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 cursor-pointer'
                }`}
              >
                <ChevronLeft size={18} />
                <span>Previous Page</span>
              </button>

              {/* Page Dots Indicator */}
              <div className="flex items-center gap-1.5">
                {story.pages.map((_, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      stopSpeech()
                      playSound('pop')
                      setCurrentPageIndex(idx)
                    }}
                    className={`h-2.5 rounded-full transition-all cursor-pointer ${
                      currentPageIndex === idx
                        ? 'w-7 bg-[#0284c7]'
                        : 'w-2.5 bg-slate-200 hover:bg-slate-300'
                    }`}
                  />
                ))}
              </div>

              {/* Next Page / Finish Story Button */}
              {currentPageIndex < totalPages - 1 ? (
                <button
                  type="button"
                  onClick={goToNextPage}
                  className="px-6 py-3 rounded-full font-black text-xs sm:text-sm text-white bg-[#0284c7] hover:bg-[#0369a1] border-b-4 border-[#075985] shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Next Page</span>
                  <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={triggerCompletion}
                  className="px-6 py-3 rounded-full font-black text-xs sm:text-sm text-slate-900 bg-[#facc15] hover:bg-[#eab308] border-b-4 border-[#ca8a04] shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles size={16} />
                  <span>Finish Story!</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* ── Story Completed Celebration Modal ──────────────────────────── */}
      {isCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border-4 border-amber-300 shadow-2xl text-center relative anim-float">
            
            {/* Mascot Pip Celebration */}
            <div className="w-20 h-20 rounded-full bg-amber-100 border-4 border-amber-300 mx-auto flex items-center justify-center mb-4">
              <Pip size="md" mood="excited" animate="correct" />
            </div>

            <div className="flex items-center justify-center gap-1 text-amber-400 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={24} className="fill-amber-400 text-amber-400 anim-wiggle" />
              ))}
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-[#0f4c5c] tracking-tight mb-1">
              Story Adventure Completed!
            </h3>
            <p className="text-sm font-bold text-slate-600 mb-4">
              You read <span className="text-[#0284c7] font-black">{story.title}</span> and earned{' '}
              <span className="text-amber-600 font-black">+{story.xpReward} XP Stars</span>!
            </p>

            <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-200 mb-6 flex items-center justify-center gap-2 text-emerald-800 text-xs font-black">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>Moral: &ldquo;{story.moral}&rdquo;</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  playSound('pop')
                  setIsCompleted(false)
                  setCurrentPageIndex(0)
                }}
                className="flex-1 py-3 rounded-2xl font-black text-xs sm:text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
              >
                Read Again 🔄
              </button>
              <Link
                href="/lessons?subject=english"
                onClick={() => playSound('magic')}
                className="flex-1 py-3 rounded-2xl font-black text-xs sm:text-sm text-white bg-[#0284c7] hover:bg-[#0369a1] border-b-4 border-[#075985] shadow-md transition-all hover:scale-102 active:scale-98 text-center"
              >
                More Stories 📚
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
