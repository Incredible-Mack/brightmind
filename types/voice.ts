export interface SpeechSupportResult {
  ttsSupported: boolean
  sttSupported: boolean
  sttFallback: boolean
}

export interface VoiceTeacherState {
  isSpeaking: boolean
  currentText: string | null
}

export interface VoiceStudentState {
  isListening: boolean
  transcript: string
  interimTranscript: string
  error: string | null
  state: 'idle' | 'loading' | 'listening' | 'processing' | 'done'
}

export interface GradeSpeechRequest {
  expected: string
  transcript: string
  subject: string
  ageGroup: string
  childName: string
}

export interface GradeSpeechResponse {
  score: number
  passed: boolean
  feedback: string
  tier: 1 | 2 | 3
}
