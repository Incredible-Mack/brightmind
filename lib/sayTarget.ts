// What a child must SAY after each teaching card, how that is marked, and the tap-to-identify
// alternative for when they cannot talk right now. Pure functions: no network, no randomness.
import { gradeLetterAttempt, isLetterContent, soundFor, cleanForSpeech } from './phonics'
import { fallbackGradeSpeech } from './fallbackTeacher'

export interface SayTarget {
  kind: 'letter' | 'number' | 'sequence' | 'text'
  /** What the child is asked to do, shown and spoken */
  instruction: string
  /** The words Pip says out loud first, so the child hears exactly how it sounds before saying it */
  model: string
  /** The words we expect to hear (shown on screen as a guide) */
  expected: string
  grade: (transcript: string) => { passed: boolean; score: number }
}

export interface IdentifyQuestion {
  question: string
  options: string[]
  correct: string
  /** Read aloud for the child */
  spoken: string
}

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']
// Words a speech engine commonly returns for a spoken number
const HOMOPHONES: Record<number, string[]> = { 1: ['won'], 2: ['to', 'too'], 4: ['for', 'fore'], 8: ['ate'], 10: ['tin'] }

const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h }
const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()

function stableShuffle<T>(items: T[], seed: string): T[] {
  return items.map((v, i) => ({ v, k: hash(seed + ':' + i) })).sort((a, b) => a.k - b.k).map(x => x.v)
}

function numberFromContent(c: Record<string, unknown>): number | null {
  if (c.number === undefined) return null
  const n = Number(c.number)
  return Number.isFinite(n) ? n : null
}

// "Counting: one, two, three" -> the number words in order, when there are at least two
function sequenceWords(text: string): string[] | null {
  const tokens = norm(text).split(' ')
  const words = tokens.filter(t => NUMBER_WORDS.includes(t))
  return words.length >= 2 ? words : null
}

function firstSentence(text: string, maxWords = 14): string {
  const cleaned = cleanForSpeech(text).replace(/^[^:]{1,40}:\s*/, '')   // drop a "Topic:" label
  const sentence = cleaned.split(/(?<=[.!?])\s+/)[0] ?? cleaned
  return sentence.split(/\s+/).slice(0, maxWords).join(' ').replace(/[,;:]$/, '')
}

const STOP = new Set(['that', 'this', 'with', 'from', 'they', 'them', 'then', 'than', 'have', 'will', 'your', 'what', 'when', 'where', 'which', 'there', 'their', 'about', 'because', 'would', 'could', 'should', 'into', 'over', 'also', 'more', 'most', 'some', 'such', 'each', 'every', 'many', 'only', 'very'])
const DECOYS = ['window', 'banana', 'river', 'pencil', 'cloud', 'garden', 'rocket', 'button', 'basket', 'candle', 'ladder', 'pillow', 'bridge', 'magnet', 'mirror', 'jungle']

function keyWord(sentence: string): string {
  const words = norm(sentence).split(' ').filter(w => /^[a-z]+$/.test(w))
  const good = words.filter(w => w.length >= 4 && !STOP.has(w))
  const pool = good.length ? good : words
  return pool.slice().sort((a, b) => b.length - a.length || a.localeCompare(b))[0] ?? ''
}

// One slip of a letter is fine for words of four letters or more ("rectangel" for "rectangle")
function sameWord(a: string, b: string): boolean {
  if (a === b) return true
  if (a.length < 4 || b.length < 4 || Math.abs(a.length - b.length) > 1) return false
  let i = 0, j = 0, miss = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue }
    if (++miss > 1) return false
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++ }
  }
  return miss + (a.length - i) + (b.length - j) <= 1
}

/** Passes when most of the expected words were said (any order), so a pause, a cough or a small mishearing does not fail a sentence. */
function gradeByWords(expected: string, said: string): { passed: boolean; score: number } {
  const want = norm(expected).split(' ').filter(Boolean)
  const heard = norm(said).split(' ').filter(Boolean)
  if (!want.length || !heard.length) return { passed: false, score: 0 }
  const pool = heard.slice()
  let hits = 0
  for (const w of want) {
    const idx = pool.findIndex(h => sameWord(h, w))
    if (idx >= 0) { hits++; pool.splice(idx, 1) }
  }
  const pct = hits / want.length
  return { passed: pct >= 0.6, score: Math.round(pct * 100) }
}

export function buildSayTarget(c: Record<string, unknown>): SayTarget | null {
  // Letter: say the sound (the name, the sound or the example word all count)
  if (isLetterContent(c)) {
    const sound = soundFor(c.letter, c)
    const word = c.word ? String(c.word).toLowerCase() : ''
    return {
      kind: 'letter',
      instruction: `Say ${sound}${word ? `, like ${word}` : ''}`,
      model: `${sound}. ${sound}.${word ? ` As in ${word}.` : ''}`,
      expected: sound,
      grade: t => gradeLetterAttempt(t, c.letter, c.word),
    }
  }

  // A single number: the word or the digit
  const n = numberFromContent(c)
  if (n !== null) {
    const word = String(c.word ?? NUMBER_WORDS[n] ?? n).toLowerCase()
    const accepted = new Set([word, String(n), ...(HOMOPHONES[n] ?? [])])
    return {
      kind: 'number',
      instruction: `Say the number: ${word}`,
      model: `${word}. ${word}.`,
      expected: word,
      grade: t => {
        const tokens = norm(t).split(' ')
        const ok = tokens.some(x => accepted.has(x))
        return ok ? { passed: true, score: 100 } : { passed: false, score: 20 }
      },
    }
  }

  const text = String(c.prompt ?? c.text ?? '')
  if (!text.trim()) return null

  // "one, two, three": count along
  const seq = sequenceWords(text.replace(/^[^:]{1,40}:\s*/, ''))
  if (seq) {
    const expected = seq.join(' ')
    return {
      kind: 'sequence',
      instruction: `Count along: ${seq.join(', ')}`,
      model: seq.join(', '),
      expected,
      grade: t => {
        const said = norm(t)
        // each number word or its digit, in order, with a little give for the speech engine
        const tokens = said.split(' ')
        let at = 0, hits = 0
        for (const w of seq) {
          const digit = String(NUMBER_WORDS.indexOf(w))
          const idx = tokens.findIndex((x, i) => i >= at && (x === w || x === digit))
          if (idx >= 0) { hits++; at = idx + 1 }
        }
        const pct = hits / seq.length
        return pct >= 0.7 ? { passed: true, score: Math.round(pct * 100) } : { passed: false, score: Math.round(pct * 100) }
      },
    }
  }

  // Any other card: repeat the key sentence
  const sentence = firstSentence(text)
  if (!sentence) return null
  return {
    kind: 'text',
    instruction: 'Say it with me',
    model: sentence,
    expected: sentence,
    grade: t => gradeByWords(sentence, t),
  }
}

export function buildIdentify(c: Record<string, unknown>): IdentifyQuestion | null {
  if (isLetterContent(c)) {
    const L = c.letter.toUpperCase()
    const sound = soundFor(c.letter, c)
    const others: string[] = []
    for (let k = 1; others.length < 3 && k < 40; k++) {
      const cand = String.fromCharCode(65 + ((L.charCodeAt(0) - 65 + k * 7) % 26))
      if (cand !== L && !others.includes(cand)) others.push(cand)
    }
    const word = c.word ? String(c.word).toLowerCase() : ''
    const q = `Which letter says ${sound}${word ? `, like ${word}` : ''}?`
    return { question: q, options: stableShuffle([L, ...others], L), correct: L, spoken: q }
  }

  const n = numberFromContent(c)
  if (n !== null) {
    const word = String(c.word ?? NUMBER_WORDS[n] ?? n).toLowerCase()
    const cands = [n - 2, n - 1, n + 1, n + 2, n + 3].filter(x => x >= 0 && x !== n && x <= 99)
    const others = stableShuffle(cands, 'num' + n).slice(0, 3).map(String)
    const q = `Which number is ${word}?`
    return { question: q, options: stableShuffle([String(n), ...others], String(n)), correct: String(n), spoken: q }
  }

  const text = String(c.prompt ?? c.text ?? '')
  if (!text.trim()) return null

  const seq = sequenceWords(text.replace(/^[^:]{1,40}:\s*/, ''))
  if (seq) {
    const k = Math.max(0, Math.min(seq.length - 2, Math.floor(seq.length / 2) - 1))
    const after = NUMBER_WORDS.indexOf(seq[k + 1])
    const from = seq[k]
    const cands = [after - 2, after - 1, after + 1, after + 2, after + 3].filter(x => x >= 0 && x !== after)
    const others = stableShuffle(cands, 'seq' + from).slice(0, 3).map(String)
    const q = `Which number comes after ${from}?`
    return { question: q, options: stableShuffle([String(after), ...others], 'seq' + after), correct: String(after), spoken: q }
  }

  const sentence = firstSentence(text)
  const key = keyWord(sentence)
  if (!key) return null
  const present = new Set(norm(text).split(' '))
  const decoys = stableShuffle(DECOYS.filter(d => !present.has(d)), key).slice(0, 3)
  const q = 'Which word was in what you just heard?'
  return { question: q, options: stableShuffle([key, ...decoys], 'k' + key), correct: key, spoken: q }
}
