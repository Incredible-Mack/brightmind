'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import type { VoiceStudentState } from '@/types/voice'
import { localAsrSupported, onAsrStatus, transcribeLocally } from '@/lib/asr/localAsr'

export interface ListenOptions {
  /** Longest recording allowed, in ms. Longer sentences need longer. */
  maxMs?: number
  /** The answer is a sentence, not a word: wait longer through the child's pauses */
  long?: boolean
}

/** What the microphone actually captured: tells "mic is silent" apart from "words not understood". */
export interface CaptureInfo {
  peak: number        // loudest moment, 0 to 1
  heardSpeech: boolean
  ms: number
}

interface UseVoiceStudentReturn extends VoiceStudentState {
  /** 0-100 while the in-browser speech model is downloading for the first time, otherwise null */
  modelProgress: number | null
  /** Live microphone loudness, 0 to 1, while recording (lets the child SEE the mic is working) */
  level: number
  capture: CaptureInfo | null
  startListening: (opts?: ListenOptions) => void
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
  const [level, setLevel] = useState(0)
  const [capture, setCapture] = useState<CaptureInfo | null>(null)

  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const stopTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startWithWebSpeech = useCallback((opts: ListenOptions) => {
    const SpeechRec = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SpeechRec) return false

    // Clean up any existing session
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch { /* ignore */ }
    }
    if (stopTimerRef.current) clearInterval(stopTimerRef.current)

    const rec = new SpeechRec()
    // Always continuous to prevent Chrome's premature 4-second initial silence cutoff
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'
    recognitionRef.current = rec

    const t0 = Date.now()
    let lastResultAt = 0

    stopTimerRef.current = setInterval(() => {
      const now = Date.now()
      const quiet = lastResultAt ? now - lastResultAt : 0
      const total = now - t0
      const silenceLimit = opts.long ? 2000 : 1500
      const maxInitialSilence = 12000 // 12 seconds for child to get ready
      const maxDuration = opts.maxMs ?? (opts.long ? 24000 : 14000)

      if ((lastResultAt && quiet > silenceLimit) || (!lastResultAt && total > maxInitialSilence) || total > maxDuration) {
        if (stopTimerRef.current) clearInterval(stopTimerRef.current)
        try { rec.stop() } catch { /* already stopped */ }
      }
    }, 150)

    rec.onstart = () => setState(s => ({ ...s, isListening: true, state: 'listening', error: null }))
    rec.onresult = (e: any) => {
      lastResultAt = Date.now()
      let final = ''
      let interim = ''
      for (let i = 0; i < e.results.length; i++) {
        const item = e.results[i]
        if (item.isFinal) final += item[0].transcript + ' '
        else interim += item[0].transcript + ' '
      }
      setState(s => ({
        ...s,
        transcript: final.trim(),
        interimTranscript: interim.trim(),
      }))
    }
    rec.onerror = (e: any) => {
      if (stopTimerRef.current) clearInterval(stopTimerRef.current)
      if (e.error === 'aborted') return
      setState(s => ({ ...s, error: e.error === 'no-speech' ? null : e.error, isListening: false, state: 'done' }))
    }
    rec.onend = () => {
      if (stopTimerRef.current) clearInterval(stopTimerRef.current)
      recognitionRef.current = null
      // Retain whichever transcript or interim was captured
      setState(s => ({
        ...s,
        transcript: (s.transcript || s.interimTranscript).trim(),
        isListening: false,
        state: 'done',
        interimTranscript: '',
      }))
    }

    setState(s => ({ ...s, state: 'loading', transcript: '', interimTranscript: '' }))
    setCapture(null)
    try {
      rec.start()
    } catch (err) {
      console.warn('[voice] rec.start error:', err)
      return false
    }
    return true
  }, [])

  const [modelProgress, setModelProgress] = useState<number | null>(null)
  useEffect(() => onAsrStatus((st, pct) => setModelProgress(st === 'loading' ? pct : null)), [])

  // Browsers without built-in recognition (Firefox): record, then turn the recording into words.
  // The in-browser model is tried first (free, private); the server is the backup if it is configured.
  const transcribeRecording = useCallback(async (blob: Blob): Promise<string> => {
    let localError: unknown = null
    if (localAsrSupported()) {
      try { return await transcribeLocally(blob) } catch (e) { localError = e }
    }
    try {
      const fd = new FormData()
      fd.append('audio', blob, 'recording.webm')
      const res = await fetch('/api/transcribe', { method: 'POST', body: fd })
      const { transcript, error } = await res.json()
      if (error) throw new Error(error)
      return String(transcript ?? '')
    } catch (serverError) {
      throw localError ?? serverError
    }
  }, [])

  const startWithMediaRecorder = useCallback(async (opts: ListenOptions) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      chunksRef.current = []

      const maxMs = opts.maxMs ?? 9000
      const silenceMs = opts.long ? 1800 : 1200
      let peak = 0
      let heard = false
      const t0 = Date.now()

      // Watch the microphone: show its level, and stop by itself shortly after the child stops talking
      let stopWatching: (() => void) | null = null
      try {
        const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const ac = new Ctx()
        await ac.resume().catch(() => {})            // a suspended context reads pure silence
        const analyser = ac.createAnalyser()
        analyser.fftSize = 1024
        ac.createMediaStreamSource(stream).connect(analyser)
        const data = new Uint8Array(analyser.fftSize)
        let lastLoud = t0
        let floor = 0
        let floorSamples = 0
        const timer = setInterval(() => {
          analyser.getByteTimeDomainData(data)
          let sum = 0
          for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v }
          const rms = Math.sqrt(sum / data.length)
          const now = Date.now()
          peak = Math.max(peak, rms)
          setLevel(Math.min(1, rms * 6))
          // The first third of a second sets the room's background noise; speech is anything clearly above it
          if (now - t0 < 350) { floor = (floor * floorSamples + rms) / (floorSamples + 1); floorSamples++ }
          const threshold = Math.max(0.015, floor * 2.5 + 0.008)
          if (now - t0 >= 350 && rms > threshold) { heard = true; lastLoud = now }
          const quietFor = now - lastLoud
          const total = now - t0
          if ((heard && quietFor > silenceMs) || (!heard && total > 7000) || total > maxMs) {
            if (mr.state === 'recording') mr.stop()
          }
        }, 100)
        stopWatching = () => { clearInterval(timer); setLevel(0); ac.close().catch(() => {}) }
      } catch { /* no analyser: the child taps the mic to stop */ }

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stopWatching?.()
        const ms = Date.now() - t0
        setCapture({ peak, heardSpeech: heard, ms })
        setState(s => ({ ...s, state: 'processing', isListening: false }))
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' })
        try {
          const transcript = await transcribeRecording(blob)
          // Visible in the browser console (F12) when something does not work
          console.info('[voice] recorded', { ms, peak: Number(peak.toFixed(3)), heardSpeech: heard, bytes: blob.size, type: blob.type, transcript })
          setState(s => ({ ...s, transcript, state: 'done' }))
        } catch (err: any) {
          console.warn('[voice] could not transcribe', err)
          setState(s => ({ ...s, error: err?.message ?? 'Could not understand the recording', state: 'done' }))
        }
      }

      setState(s => ({ ...s, state: 'loading', transcript: '', interimTranscript: '', isListening: true }))
      setCapture(null)
      mr.start()
      setState(s => ({ ...s, state: 'listening' }))
    } catch (err: any) {
      setState(s => ({ ...s, error: err.message, state: 'done' }))
    }
  }, [transcribeRecording])

  const startListening = useCallback((opts: ListenOptions = {}) => {
    const started = startWithWebSpeech(opts)
    if (!started) {
      const hasSpeechRec = typeof window !== 'undefined' && Boolean((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition)
      if (hasSpeechRec) {
        setTimeout(() => {
          const retried = startWithWebSpeech(opts)
          if (!retried) startWithMediaRecorder(opts)
        }, 120)
      } else {
        startWithMediaRecorder(opts)
      }
    }
  }, [startWithWebSpeech, startWithMediaRecorder])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  // Never leave the mic open after the activity is gone
  useEffect(() => () => {
    if (stopTimerRef.current) clearInterval(stopTimerRef.current)
    try { recognitionRef.current?.abort?.() } catch { /* already stopped */ }
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
  }, [])

  const reset = useCallback(() => {
    setState({ isListening: false, transcript: '', interimTranscript: '', error: null, state: 'idle' })
    setCapture(null)
  }, [])

  return { ...state, modelProgress, level, capture, startListening, stopListening, reset }
}
