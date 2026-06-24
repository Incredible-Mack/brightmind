interface BadgeProps {
  children: React.ReactNode
  color?: 'green' | 'blue' | 'purple' | 'orange' | 'teal' | 'gold' | 'red' | 'gray'
  size?: 'sm' | 'md'
}

const colors = {
  green:  'bg-green-500/20 text-green-400 border-green-500/30',
  blue:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
  purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  teal:   'bg-teal-500/20 text-teal-400 border-teal-500/30',
  gold:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  red:    'bg-red-500/20 text-red-400 border-red-500/30',
  gray:   'bg-slate-500/20 text-slate-400 border-slate-500/30',
}
const sizes = { sm: 'px-2 py-0.5 text-xs', md: 'px-3 py-1 text-sm' }

export function Badge({ children, color = 'green', size = 'md' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-semibold font-nunito ${colors[color]} ${sizes[size]}`}>
      {children}
    </span>
  )
}
