'use client'
import { useState, useRef, useCallback } from 'react'

interface UseVoiceTeacherReturn {
  speak: (text: string) => Promise<void>
  stop: () => void
  isSpeaking: boolean
}

export function useVoiceTeacher(): UseVoiceTeacherReturn {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const speakWithBrowser = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) { resolve(); return }
      window.speechSynthesis.cancel()
      const utt = new SpeechSynthesisUtterance(text)
      utt.pitch = 1.1
      utt.rate = 0.85
      utt.volume = 1.0
      const voices = window.speechSynthesis.getVoices()
      const preferred = voices.find(v =>
        v.name.toLowerCase().includes('google uk english female') ||
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('female')
      )
      if (preferred) utt.voice = preferred
      utt.onend = () => { setIsSpeaking(false); resolve() }
      utt.onerror = () => { setIsSpeaking(false); resolve() }
      setIsSpeaking(true)
      window.speechSynthesis.speak(utt)
    })
  }, [])

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

  const speak = useCallback(async (text: string) => {
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

  return { speak, stop, isSpeaking }
}
