'use client'
import { MicrophonePanel } from '@/components/lesson/MicrophonePanel'

interface VoiceStudentProps {
  expected: string
  onResult: (transcript: string, score: number, passed: boolean) => void
  subject?: string
  ageGroup?: string
  childName?: string
  disabled?: boolean
}

export function VoiceStudent(props: VoiceStudentProps) {
  return <MicrophonePanel {...props} />
}
