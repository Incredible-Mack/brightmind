import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ removed: true, message: 'Supabase removed. Auth is handled by PHP API at /auth/me' })
}
