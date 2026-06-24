import { NextResponse } from 'next/server'

// Video upload is now handled directly by the PHP API at /api/upload
// The frontend posts FormData to NEXT_PUBLIC_API_URL/api/upload via lib/api.ts
export async function POST() {
  return NextResponse.json(
    { error: 'Use the PHP API endpoint directly. See lib/api.ts → api.videos.upload()' },
    { status: 410 }
  )
}
