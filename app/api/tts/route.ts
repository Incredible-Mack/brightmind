import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { synthesizeSpeech } from '@/lib/elevenlabs'

const schema = z.object({ text: z.string().max(500) })

export async function POST(req: NextRequest) {
  if (!process.env.ELEVENLABS_API_KEY) {
    return NextResponse.json({ error: 'ElevenLabs not configured' }, { status: 503 })
  }
  try {
    const { text } = schema.parse(await req.json())
    const audio = await synthesizeSpeech(text)
    return new NextResponse(audio, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (e) {
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 })
  }
}
