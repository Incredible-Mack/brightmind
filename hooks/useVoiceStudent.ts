'use client'
import { useState, useRef, useCallback } from 'react'
import type { VoiceStudentState } from '@/types/voice'

interface UseVoiceStudentReturn extends VoiceStudentState {
  startListening: () => void
  stopListening: () => void
  reset: () => void
}

export function useVoiceStudent(): UseVoiceStudentReturn {
  const [state, setState] = useState<VoiceStudentState>({
    isListening: false,
    transcript: '',
    interimTranscript: '',
    error: null,
    state: 'idle',
  })

  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startWithWebSpeech = useCallback(() => {
    const SpeechRec = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SpeechRec) return false

    const rec = new SpeechRec()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = 'en-US'
    recognitionRef.current = rec

    rec.onstart = () => setState(s => ({ ...s, isListening: true, state: 'listening', error: null }))
    rec.onresult = (e: any) => {
      let final = ''
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else interim += t
      }
      setState(s => ({
        ...s,
        transcript: s.transcript + final,
        interimTranscript: interim,
      }))
    }
    rec.onerror = (e: any) => setState(s => ({ ...s, error: e.error, isListening: false, state: 'done' }))
    rec.onend = () => setState(s => ({ ...s, isListening: false, state: 'done', interimTranscript: '' }))

    setState(s => ({ ...s, state: 'loading', transcript: '', interimTranscript: '' }))
    rec.start()
    return true
  }, [])

  const startWithMediaRecorder = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      chunksRef.current = []

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        setState(s => ({ ...s, state: 'processing', isListening: false }))
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        try {
          const fd = new FormData()
          fd.append('audio', blob, 'recording.webm')
          const res = await fetch('/api/transcribe', { method: 'POST', body: fd })
          const { transcript, error } = await res.json()
          if (error) throw new Error(error)
          setState(s => ({ ...s, transcript, state: 'done' }))
        } catch (err: any) {
          setState(s => ({ ...s, error: err.message, state: 'done' }))
        }
      }

      setState(s => ({ ...s, state: 'loading', transcript: '', interimTranscript: '', isListening: true }))
      mr.start()
      setState(s => ({ ...s, state: 'listening' }))
    } catch (err: any) {
      setState(s => ({ ...s, error: err.message, state: 'done' }))
    }
  }, [])

  const startListening = useCallback(() => {
    const started = startWithWebSpeech()
    if (!started) startWithMediaRecorder()
  }, [startWithWebSpeech, startWithMediaRecorder])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const reset = useCallback(() => {
    setState({ isListening: false, transcript: '', interimTranscript: '', error: null, state: 'idle' })
  }, [])

  return { ...state, startListening, stopListening, reset }
}
