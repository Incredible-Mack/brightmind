// Small helpers for reading activity content. The API turns numeric strings into numbers ("3" -> 3),
// so everything here compares as text.
export interface TapOption { id: string; text: string; correct: boolean }

export function normalizeTapOptions(content: Record<string, unknown>): TapOption[] {
  const opts = (content.options ?? []) as unknown[]
  if (opts.length > 0 && typeof opts[0] === 'object' && opts[0] !== null) {
    return (opts as Array<{ id?: string; text: unknown; correct: boolean }>).map((o, i) => ({ id: String(o.id ?? i), text: String(o.text), correct: !!o.correct }))
  }
  const correct = String(content.correct ?? '')
  return opts.map((raw, i) => ({ id: String(i), text: String(raw), correct: String(raw) === correct }))
}

export function expectedAnswer(act: { expected_answer?: unknown; content?: Record<string, unknown> }): string {
  return String(act.expected_answer ?? act.content?.expected ?? '').trim()
}

export function correctAnswerText(act: { type: string; expected_answer?: unknown; content: Record<string, unknown> }): string {
  if (act.type === 'tap_answer') return normalizeTapOptions(act.content).find(o => o.correct)?.text ?? ''
  if (act.type === 'drag_drop') {
    const pairs = (act.content.pairs ?? []) as Array<{ item: string; target: string }>
    return pairs.map(p => `${p.item} → ${p.target}`).join(', ')
  }
  return expectedAnswer(act)
}
