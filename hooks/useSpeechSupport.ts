'use client'
import { useState, useEffect } from 'react'
import type { SpeechSupportResult } from '@/types/voice'

export function useSpeechSupport(): SpeechSupportResult {
  const [result, setResult] = useState<SpeechSupportResult>({
    ttsSupported: false,
    sttSupported: false,
    sttFallback: false,
  })

  useEffect(() => {
    const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window
    const SpeechRec = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    const sttSupported = Boolean(SpeechRec)
    const sttFallback = !sttSupported && Boolean(window.MediaRecorder)
    setResult({ ttsSupported, sttSupported, sttFallback })
  }, [])

  return result
}
