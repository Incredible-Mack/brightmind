import { getAvatar } from '@/lib/avatars'

interface AvatarProps {
  seed: string
  name: string
  size?: number
  className?: string
  ring?: boolean
}

export function Avatar({ seed, name, size = 40, className = '', ring = false }: AvatarProps) {
  const av = getAvatar(seed)
  const fontSize = Math.round(size * 0.52)

  return (
    <div
      role="img"
      aria-label={name}
      className={`
        rounded-full bg-gradient-to-br ${av.gradient} flex items-center justify-center
        flex-shrink-0 select-none leading-none
        ${ring ? `ring-4 ring-[#4ade80] ring-offset-2 ring-offset-[#1a1f2e]` : ''}
        ${className}
      `}
      style={{ width: size, height: size, fontSize }}
    >
      {av.emoji}
    </div>
  )
}
