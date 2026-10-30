export interface AvatarOption {
  id: string
  emoji: string
  label: string
  bgColor: string    // Solid background class
  glow: string       // shadow color for selection ring
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'lion',      emoji: '🦁', label: 'Lion',      bgColor: 'bg-amber-400',   glow: 'shadow-yellow-500/40' },
  { id: 'panda',     emoji: '🐼', label: 'Panda',     bgColor: 'bg-slate-400',   glow: 'shadow-slate-400/40'  },
  { id: 'fox',       emoji: '🦊', label: 'Fox',       bgColor: 'bg-orange-500',  glow: 'shadow-orange-500/40' },
  { id: 'rabbit',    emoji: '🐰', label: 'Rabbit',    bgColor: 'bg-pink-400',    glow: 'shadow-pink-500/40'   },
  { id: 'penguin',   emoji: '🐧', label: 'Penguin',   bgColor: 'bg-sky-400',     glow: 'shadow-blue-500/40'   },
  { id: 'koala',     emoji: '🐨', label: 'Koala',     bgColor: 'bg-stone-400',   glow: 'shadow-stone-400/40'  },
  { id: 'cat',       emoji: '🐱', label: 'Cat',       bgColor: 'bg-purple-500',  glow: 'shadow-purple-500/40' },
  { id: 'dog',       emoji: '🐶', label: 'Dog',       bgColor: 'bg-yellow-400',  glow: 'shadow-amber-500/40'  },
  { id: 'elephant',  emoji: '🐘', label: 'Elephant',  bgColor: 'bg-indigo-500',  glow: 'shadow-indigo-500/40' },
  { id: 'owl',       emoji: '🦉', label: 'Owl',       bgColor: 'bg-teal-500',    glow: 'shadow-teal-500/40'   },
  { id: 'dinosaur',  emoji: '🦕', label: 'Dino',      bgColor: 'bg-emerald-500', glow: 'shadow-emerald-500/40'},
  { id: 'unicorn',   emoji: '🦄', label: 'Unicorn',   bgColor: 'bg-rose-400',    glow: 'shadow-pink-400/40'   },
]

export function getAvatar(seed: string): AvatarOption {
  return AVATAR_OPTIONS.find(a => a.id === seed) ?? AVATAR_OPTIONS[0]
}
