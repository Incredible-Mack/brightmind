import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { aiCelebrate } from '@/lib/aiTeacher'

const schema = z.object({
  lessonTitle: z.string(),
  xpEarned:   z.number(),
  childName:  z.string(),
})

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json())
    const result = await aiCelebrate(body)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ message: 'Amazing work today!', tier: 3 }, { status: 200 })
  }
}
