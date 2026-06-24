import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { aiGradeSpeech } from '@/lib/aiTeacher'

const schema = z.object({
  expected:   z.string(),
  transcript: z.string(),
  subject:    z.string(),
  ageGroup:   z.enum(['0-5','6-8','9-11','12-14']),
  childName:  z.string(),
})

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json())
    const result = await aiGradeSpeech(body)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ score: 0, passed: false, feedback: "Good try! Let's try again.", tier: 3 }, { status: 200 })
  }
}
