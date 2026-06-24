import { Calculator, BookOpen, FlaskConical, Globe } from 'lucide-react'
import type { SubjectSlug } from '@/types/lesson'

interface SubjectIconProps { slug: SubjectSlug; size?: number; className?: string }

const icons: Record<SubjectSlug, React.ReactNode> = {
  'math':           <Calculator />,
  'english':        <BookOpen />,
  'science':        <FlaskConical />,
  'social-studies': <Globe />,
}

const colors: Record<SubjectSlug, string> = {
  'math':           '#3b82f6',
  'english':        '#a855f7',
  'science':        '#14b8a6',
  'social-studies': '#f97316',
}

export function SubjectIcon({ slug, size = 24, className = '' }: SubjectIconProps) {
  const icon = icons[slug]
  const color = colors[slug]
  return (
    <span className={`inline-flex items-center justify-center ${className}`} style={{ color, width: size, height: size }}>
      {icon}
    </span>
  )
}

export { colors as subjectColors }
