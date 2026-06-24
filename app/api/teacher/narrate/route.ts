import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { aiNarrate } from '@/lib/aiTeacher'

const schema = z.object({
  lessonId:     z.string(),
  activityType: z.enum(['listen','speak','tap_answer','type_answer','video','drag_drop']),
  content:      z.string(),
  childName:    z.string(),
  ageGroup:     z.enum(['0-5','6-8','9-11','12-14']),
})

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json())
    const result = await aiNarrate(body)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ speech: "Let's try this together!", tier: 3 }, { status: 200 })
  }
}
