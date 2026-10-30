import { NextRequest, NextResponse } from 'next/server'
import { transcribeAudio } from '@/lib/whisper'

// The page asks this once to learn whether voice answers can be marked in browsers without built-in speech recognition
export async function GET() {
  return NextResponse.json({ available: Boolean(process.env.OPENAI_API_KEY) })
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'Whisper not configured' }, { status: 503 })
  }
  try {
    const formData = await req.formData()
    const file = formData.get('audio')
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No audio file' }, { status: 400 })
    }
    const transcript = await transcribeAudio(file)
    return NextResponse.json({ transcript })
  } catch (e) {
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
  }
}
