export interface AvatarOption {
  id: string
  emoji: string
  label: string
  gradient: string   // Tailwind gradient classes
  glow: string       // shadow color for selection ring
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'lion',      emoji: '🦁', label: 'Lion',      gradient: 'from-yellow-400 to-orange-500',  glow: 'shadow-yellow-500/40' },
  { id: 'panda',     emoji: '🐼', label: 'Panda',     gradient: 'from-slate-300 to-slate-500',    glow: 'shadow-slate-400/40'  },
  { id: 'fox',       emoji: '🦊', label: 'Fox',       gradient: 'from-orange-400 to-red-500',     glow: 'shadow-orange-500/40' },
  { id: 'rabbit',    emoji: '🐰', label: 'Rabbit',    gradient: 'from-pink-400 to-rose-500',      glow: 'shadow-pink-500/40'   },
  { id: 'penguin',   emoji: '🐧', label: 'Penguin',   gradient: 'from-sky-400 to-blue-600',       glow: 'shadow-blue-500/40'   },
  { id: 'koala',     emoji: '🐨', label: 'Koala',     gradient: 'from-stone-400 to-stone-600',    glow: 'shadow-stone-400/40'  },
  { id: 'cat',       emoji: '🐱', label: 'Cat',       gradient: 'from-violet-400 to-purple-600',  glow: 'shadow-purple-500/40' },
  { id: 'dog',       emoji: '🐶', label: 'Dog',       gradient: 'from-amber-400 to-yellow-600',   glow: 'shadow-amber-500/40'  },
  { id: 'elephant',  emoji: '🐘', label: 'Elephant',  gradient: 'from-indigo-400 to-violet-600',  glow: 'shadow-indigo-500/40' },
  { id: 'owl',       emoji: '🦉', label: 'Owl',       gradient: 'from-teal-400 to-green-600',     glow: 'shadow-teal-500/40'   },
  { id: 'dinosaur',  emoji: '🦕', label: 'Dino',      gradient: 'from-emerald-400 to-teal-600',   glow: 'shadow-emerald-500/40'},
  { id: 'unicorn',   emoji: '🦄', label: 'Unicorn',   gradient: 'from-pink-300 to-purple-500',    glow: 'shadow-pink-400/40'   },
]

export function getAvatar(seed: string): AvatarOption {
  return AVATAR_OPTIONS.find(a => a.id === seed) ?? AVATAR_OPTIONS[0]
}
