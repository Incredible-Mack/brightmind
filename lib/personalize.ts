// Free personalisation: fills {name}, {theme} and {theme_emoji} in lesson text.
// Variants written by the AI can use these tokens, so no model call is needed per child.
import type { Interest } from '@/types/child'

const THEMES: Record<Interest, { word: string; emoji: string }> = {
  animals: { word: 'animals', emoji: '🐾' },
  space:   { word: 'space',   emoji: '🚀' },
  sports:  { word: 'sports',  emoji: '⚽' },
  arts:    { word: 'art',     emoji: '🎨' },
  stories: { word: 'stories', emoji: '📖' },
  puzzles: { word: 'puzzles', emoji: '🧩' },
}

export interface PersonalizeContext {
  name: string
  interest?: Interest
}

export function personalizeText(text: string, ctx: PersonalizeContext): string {
  if (!text.includes('{')) return text
  const theme = (ctx.interest && THEMES[ctx.interest]) || { word: 'fun things', emoji: '⭐' }
  return text
    .replace(/\{name\}/g, ctx.name)
    .replace(/\{theme_emoji\}/g, theme.emoji)
    .replace(/\{theme\}/g, theme.word)
}

export function personalizeContent<T>(value: T, ctx: PersonalizeContext): T {
  if (typeof value === 'string') return personalizeText(value, ctx) as unknown as T
  if (Array.isArray(value)) return value.map(v => personalizeContent(v, ctx)) as unknown as T
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = personalizeContent(v, ctx)
    return out as T
  }
  return value
}
