interface PillProps { children: React.ReactNode; color?: string; className?: string }

export function Pill({ children, color = '#4ade80', className = '' }: PillProps) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide font-nunito ${className}`}
      style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}30` }}
    >
      {children}
    </span>
  )
}
