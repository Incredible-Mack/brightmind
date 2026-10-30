'use client'
import { useState, useRef, useCallback } from 'react'
import { cleanForSpeech } from '@/lib/phonics'

interface UseVoiceTeacherReturn {
  speak: (text: string) => Promise<void>
  stop: () => void
  isSpeaking: boolean
  /** The browser refused to speak (it needs a tap first). The page should offer a "tap to hear" button. */
  blocked: boolean
  clearBlocked: () => void
  /** Call from a click/tap handler: allows speech for the rest of the page's life */
  unlock: () => void
}

export function useVoiceTeacher(): UseVoiceTeacherReturn {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Chrome fills the voice list asynchronously; wait briefly so the first line uses the right voice
  const loadVoices = useCallback((): Promise<SpeechSynthesisVoice[]> => {
    return new Promise((resolve) => {
      const have = window.speechSynthesis.getVoices()
      if (have.length) { resolve(have); return }
      const done = () => resolve(window.speechSynthesis.getVoices())
      const t = setTimeout(done, 500)
      window.speechSynthesis.addEventListener('voiceschanged', () => { clearTimeout(t); done() }, { once: true })
    })
  }, [])

  const speakWithBrowser = useCallback(async (text: string): Promise<void> => {
    const synth = window.speechSynthesis
    if (!synth) return
    const voices = await loadVoices()

    // Only cancel when something is actually playing, and give the engine a moment afterwards:
    // Firefox drops an utterance that is spoken straight after cancel().
    if (synth.speaking || synth.pending) { synth.cancel(); await new Promise(r => setTimeout(r, 80)) }
    if (synth.paused) synth.resume()

    return new Promise((resolve) => {
      const utt = new SpeechSynthesisUtterance(text)
      utt.pitch = 1.1
      utt.rate = 0.85
      utt.volume = 1.0
      const preferred = voices.find(v =>
        v.name.toLowerCase().includes('google uk english female') ||
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('female')
      )
      if (preferred) utt.voice = preferred

      let started = false
      let finished = false
      const done = () => { if (finished) return; finished = true; clearTimeout(watchdog); setIsSpeaking(false); resolve() }

      // If nothing starts within a few seconds the browser has silently refused: say so, don't hang
      const watchdog = setTimeout(() => {
        if (started) return
        setBlocked(true)
        try { synth.cancel() } catch { /* ignore */ }
        done()
      }, 3000)

      utt.onstart = () => { started = true; setBlocked(false) }
      utt.onend = done
      utt.onerror = (e) => {
        // Browsers refuse to talk until the person has tapped something on the page
        if ((e as SpeechSynthesisErrorEvent).error === 'not-allowed') setBlocked(true)
        done()
      }
      setIsSpeaking(true)
      synth.speak(utt)
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
    const text = cleanForSpeech(raw)          // emoji and symbols are for the eyes, not the voice
    if (!text) return
    if ('speechSynthesis' in window) {
      await speakWithBrowser(text)
    } else if (process.env.ELEVENLABS_API_KEY) {
      await speakWithElevenLabs(text)
    }
  }, [speakWithBrowser, speakWithElevenLabs])

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel()
    audioRef.current?.pause()
    setIsSpeaking(false)
  }, [])

  const clearBlocked = useCallback(() => setBlocked(false), [])
  const unlock = useCallback(() => {
    try {
      if (window.speechSynthesis) {
        // A real (silent) utterance spoken inside the tap tells Firefox and Chrome that speech is allowed
        const u = new SpeechSynthesisUtterance('ok')
        u.volume = 0
        window.speechSynthesis.speak(u)
      }
    } catch { /* nothing to unlock */ }
    setBlocked(false)
  }, [])

  return { speak, stop, isSpeaking, blocked, clearBlocked, unlock }
}
