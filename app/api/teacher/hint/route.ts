import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { aiHint } from '@/lib/aiTeacher'

const schema = z.object({
  question:       z.string(),
  childAnswer:    z.string(),
  correctAnswer:  z.string(),
  attempts:       z.number(),
  activityType:   z.enum(['listen','speak','tap_answer','type_answer','video','drag_drop']).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json())
    const result = await aiHint({
      ...body,
      activityType: body.activityType ?? 'tap_answer',
    })
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ hint: 'Look carefully and try once more.', tier: 3 }, { status: 200 })
  }
}
