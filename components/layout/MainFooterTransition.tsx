'use client'
import { usePathname } from 'next/navigation'
import { ScallopRibbon } from '@/components/home/ScallopRibbon'

export function MainFooterTransition() {
  const pathname = usePathname()
  // Both /lessons (course map) and /lessons/[id] (lesson preview) have lush landscape hills at the bottom
  const isLessonRoute = pathname === '/lessons' || pathname.startsWith('/lessons/')

  const topBg = isLessonRoute ? '#86efac' : '#fffdf8'

  return <ScallopRibbon topBg={topBg} bottomBg="#1d2445" variant="wave" />
}
