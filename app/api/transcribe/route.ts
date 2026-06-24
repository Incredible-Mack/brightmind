import { NextRequest, NextResponse } from 'next/server'
import { transcribeAudio } from '@/lib/whisper'

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
