'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { cleanForSpeech } from '@/lib/phonics'

interface UseVoiceTeacherReturn {
  speak: (text: string) => Promise<void>
  stop: () => void
  isSpeaking: boolean
  blocked: boolean
  clearBlocked: () => void
  unlock: () => void
}

/** Rank available voices to select the clearest, most natural English voice */
function pickBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  if (!voices || voices.length === 0) return undefined
  const english = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('en'))
  const candidatePool = english.length > 0 ? english : voices

  const rateVoice = (v: SpeechSynthesisVoice): number => {
    const name = v.name.toLowerCase()
    const lang = (v.lang || '').toLowerCase()
    let score = 0

    // Top tier: Modern Natural / Neural / Online voices (Edge, Chrome, Windows 11)
    if (name.includes('natural') || name.includes('neural') || name.includes('online')) score += 120
    if (name.includes('google')) score += 90

    // Specific famous crystal-clear voices
    if (name.includes('jenny') || name.includes('aria') || name.includes('sonia') || name.includes('libby')) score += 70
    if (name.includes('samantha') || name.includes('karen') || name.includes('daniel') || name.includes('serena')) score += 60
    if (name.includes('zira') || name.includes('hazel') || name.includes('susan')) score += 40

    // Friendly female clarity boost (great for mascot Pip)
    if (name.includes('female')) score += 15

    // Standard en-US and en-GB dialects
    if (lang === 'en-us' || lang === 'en_us') score += 15
    if (lang === 'en-gb' || lang === 'en_gb') score += 12

    // Demote legacy tinny/robotic voices
    if (name.includes('desktop') || name.includes('david') || name.includes('mark') || name.includes('george')) score -= 30

    return score
  }

  return [...candidatePool].sort((a, b) => rateVoice(b) - rateVoice(a))[0]
}

export function useVoiceTeacher(): UseVoiceTeacherReturn {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const cachedVoicesRef = useRef<SpeechSynthesisVoice[]>([])

  // Pre-load voices on mount so they are ready immediately and auto-enable speech
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const update = () => {
      const v = window.speechSynthesis.getVoices()
      if (v.length) cachedVoicesRef.current = v
    }
    update()
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      }
    } catch {}

    const enableAudio = () => {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume()
        }
      } catch {}
    }
    window.addEventListener('click', enableAudio, { passive: true })
    window.addEventListener('touchstart', enableAudio, { passive: true })
    window.addEventListener('keydown', enableAudio, { passive: true })

    window.speechSynthesis.addEventListener('voiceschanged', update)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', update)
      window.removeEventListener('click', enableAudio)
      window.removeEventListener('touchstart', enableAudio)
      window.removeEventListener('keydown', enableAudio)
    }
  }, [])

  const loadVoices = useCallback((): Promise<SpeechSynthesisVoice[]> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        resolve([])
        return
      }
      if (cachedVoicesRef.current.length > 0) {
        resolve(cachedVoicesRef.current)
        return
      }
      const have = window.speechSynthesis.getVoices()
      if (have.length) {
        cachedVoicesRef.current = have
        resolve(have)
        return
      }
      const done = () => {
        const v = window.speechSynthesis.getVoices()
        cachedVoicesRef.current = v
        resolve(v)
      }
      const t = setTimeout(done, 400)
      window.speechSynthesis.addEventListener('voiceschanged', () => { clearTimeout(t); done() }, { once: true })
    })
  }, [])

  const speakWithBrowser = useCallback(async (text: string): Promise<void> => {
    if (typeof window === 'undefined') return
    const synth = window.speechSynthesis
    if (!synth) return
    const voices = await loadVoices()

    // Cancel any previous speech cleanly
    if (synth.speaking || synth.pending) {
      try { synth.cancel() } catch {}
      await new Promise(r => setTimeout(r, 30))
    }
    if (synth.paused) {
      try { synth.resume() } catch {}
    }

    return new Promise((resolve) => {
      const utt = new SpeechSynthesisUtterance(text)
      
      // NATURAL VOCAL PARAMETERS FOR MAXIMUM CLARITY:
      // pitch 1.0 = natural human voice (no robotic chipmunk distortion)
      // rate 0.94 = clear, articulate, comfortably paced for learners
      utt.pitch = 1.0
      utt.rate = 0.94
      utt.volume = 1.0

      const best = pickBestVoice(voices)
      if (best) utt.voice = best

      let started = false
      let finished = false
      let resumeTimer: ReturnType<typeof setInterval> | null = null

      const done = () => {
        if (finished) return
        finished = true
        clearTimeout(watchdog)
        clearTimeout(maxGuardTimer)
        if (resumeTimer) clearInterval(resumeTimer)
        setIsSpeaking(false)
        resolve()
      }

      // 18s safety guard: NEVER cuts off speech prematurely
      const maxGuardTimer = setTimeout(done, 18000)

      // Watchdog: safely resolves if speech engine terminates unexpectedly
      const watchdog = setTimeout(() => {
        if (!started) {
          try { synth.resume() } catch {}
          done()
        }
      }, 5000)

      utt.onstart = () => {
        started = true
        clearTimeout(watchdog)
        setIsSpeaking(true)
      }

      utt.onend = done

      utt.onerror = () => {
        done()
      }

      setIsSpeaking(true)
      try {
        synth.speak(utt)
        // Autoplay assurance: un-pause if browser paused speech engine
        if (synth.paused) {
          synth.resume()
        }
        // Chromium heartbeat: keeps speech synthesis active during full playback
        resumeTimer = setInterval(() => {
          if (!synth.speaking) {
            if (resumeTimer) clearInterval(resumeTimer)
          } else if (synth.paused) {
            synth.resume()
          }
        }, 350)
      } catch {
        done()
      }
    })
  }, [loadVoices])

  const speakWithElevenLabs = useCallback(async (text: string): Promise<void> => {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) throw new Error('TTS failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    return new Promise((resolve) => {
      const audio = new Audio(url)
      audioRef.current = audio
      setIsSpeaking(true)
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); resolve() }
      audio.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(url); resolve() }
      audio.play().catch(() => { setIsSpeaking(false); resolve() })
    })
  }, [])

  const speak = useCallback(async (raw: string) => {
    const text = cleanForSpeech(raw)
    if (!text) return
    if ('speechSynthesis' in window) {
      await speakWithBrowser(text)
    } else if (process.env.ELEVENLABS_API_KEY) {
      await speakWithElevenLabs(text)
    }
  }, [speakWithBrowser, speakWithElevenLabs])

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try { window.speechSynthesis.cancel() } catch {}
    }
    audioRef.current?.pause()
    setIsSpeaking(false)
  }, [])

  const clearBlocked = useCallback(() => setBlocked(false), [])

  const unlock = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const synth = window.speechSynthesis
        if (synth.paused) {
          synth.resume()
        }
        // Instant micro-utterance inside the tap gesture to prime Web Speech API
        const u = new SpeechSynthesisUtterance(' ')
        u.volume = 0.01
        u.rate = 2.0
        synth.speak(u)
        if (synth.paused) {
          synth.resume()
        }
      }
    } catch {}
    setBlocked(false)
  }, [])

  return { speak, stop, isSpeaking, blocked, clearBlocked, unlock }
}
