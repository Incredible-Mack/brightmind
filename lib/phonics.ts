// Letter sounds, spoken scripts and a forgiving matcher for "say the sound" practice.
// Speech recognition is poor at single sounds ("buh"), so we accept the letter name,
// the sound, common mis-hearings and the example word.

interface LetterInfo {
  /** Respelling the TTS voice pronounces as the phonics sound */
  sound: string
  /** Letter name as a speech engine tends to transcribe it */
  names: string[]
  /** Other things recognition commonly returns for the sound */
  heard: string[]
}

const LETTERS: Record<string, LetterInfo> = {
  a: { sound: 'ah',   names: ['a', 'ay', 'eh'],              heard: ['ah', 'aa', 'uh', 'hey', 'at'] },
  b: { sound: 'buh',  names: ['b', 'bee', 'be'],             heard: ['buh', 'bah', 'bud', 'bub', 'but'] },
  c: { sound: 'kuh',  names: ['c', 'see', 'sea', 'si'],      heard: ['kuh', 'cuh', 'ka', 'cup', 'cut', 'k'] },
  d: { sound: 'duh',  names: ['d', 'dee'],                   heard: ['duh', 'dah', 'dud', 'the', 'da'] },
  e: { sound: 'eh',   names: ['e', 'ee'],                    heard: ['eh', 'ed', 'en', 'air', 'a'] },
  f: { sound: 'fuh',  names: ['f', 'ef', 'eff'],             heard: ['fuh', 'fah', 'fff', 'huh', 'off'] },
  g: { sound: 'guh',  names: ['g', 'gee', 'jee'],            heard: ['guh', 'gah', 'gut', 'good', 'ga'] },
  h: { sound: 'huh',  names: ['h', 'aitch', 'age'],          heard: ['huh', 'hah', 'ha', 'hut'] },
  i: { sound: 'ih',   names: ['i', 'eye', 'aye'],            heard: ['ih', 'it', 'in', 'ee', 'ick'] },
  j: { sound: 'juh',  names: ['j', 'jay'],                   heard: ['juh', 'jah', 'jut', 'ja'] },
  k: { sound: 'kuh',  names: ['k', 'kay'],                   heard: ['kuh', 'cuh', 'ka', 'cup', 'c'] },
  l: { sound: 'luh',  names: ['l', 'el', 'elle'],            heard: ['luh', 'lah', 'la', 'lull'] },
  m: { sound: 'muh',  names: ['m', 'em'],                    heard: ['muh', 'mah', 'ma', 'mum', 'mm'] },
  n: { sound: 'nuh',  names: ['n', 'en'],                    heard: ['nuh', 'nah', 'na', 'nut', 'no'] },
  o: { sound: 'aw',   names: ['o', 'oh', 'owe'],             heard: ['aw', 'ah', 'au', 'on', 'off'] },
  p: { sound: 'puh',  names: ['p', 'pee'],                   heard: ['puh', 'pah', 'pa', 'pup', 'pop'] },
  q: { sound: 'kwuh', names: ['q', 'queue', 'cue'],          heard: ['kwuh', 'kwa', 'qua', 'quack'] },
  r: { sound: 'ruh',  names: ['r', 'are', 'ar'],             heard: ['ruh', 'rah', 'ra', 'run'] },
  s: { sound: 'suh',  names: ['s', 'ess', 'es'],             heard: ['suh', 'sah', 'sa', 'sss', 'sun'] },
  t: { sound: 'tuh',  names: ['t', 'tee', 'tea'],            heard: ['tuh', 'tah', 'ta', 'tut', 'tut tut'] },
  u: { sound: 'uh',   names: ['u', 'you', 'yu'],             heard: ['uh', 'ah', 'up', 'um'] },
  v: { sound: 'vuh',  names: ['v', 'vee'],                   heard: ['vuh', 'vah', 'va', 'van'] },
  w: { sound: 'wuh',  names: ['w', 'double u', 'double you'], heard: ['wuh', 'wah', 'wa', 'wow'] },
  x: { sound: 'ks',   names: ['x', 'ex'],                    heard: ['ks', 'ox', 'ecks', 'eggs', 'x'] },
  y: { sound: 'yuh',  names: ['y', 'why', 'wy'],             heard: ['yuh', 'yah', 'ya', 'yes', 'yum'] },
  z: { sound: 'zuh',  names: ['z', 'zee', 'zed'],            heard: ['zuh', 'zah', 'za', 'zoo', 'zip'] },
}

/** Remove emoji and symbols the TTS voice would read aloud or stumble on. */
export function cleanForSpeech(text: string): string {
  return text
    .replace(/(?:[\uD83C-\uD83E][\uDC00-\uDFFF]|[\u2190-\u21FF\u2300-\u23FF\u25AA-\u25FE\u2600-\u27BF\u2934\u2935\u2B00-\u2BFF\u3030\u303D\u3297\u3299\u20E3\uFE0F\u200D])/g, '')
    .replace(/[—–]/g, ', ')
    .replace(/["“”]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?])/g, '$1')
    .trim()
}

export interface LetterContent {
  letter: string
  word?: string
  visual?: string
  audio_hint?: string
}

export function isLetterContent(c: Record<string, unknown>): c is Record<string, unknown> & LetterContent {
  return typeof c.letter === 'string' && c.letter.length === 1
}

/** The phonics sound to say for a letter, e.g. "eh" for E. */
export function soundFor(letter: string, content?: Record<string, unknown>): string {
  const info = LETTERS[letter.toLowerCase()]
  if (info) return info.sound
  // Unknown symbol: fall back to the "says X" hint in the lesson data
  const m = String(content?.audio_hint ?? '').match(/says\s+([A-Za-z]+)/i)
  return (m?.[1] ?? letter).toLowerCase()
}

/** What Pip says on a letter card: "E. E says eh, as in egg. Egg." */
export function letterScript(c: LetterContent & Record<string, unknown>): string {
  const L = c.letter.toUpperCase()
  const sound = soundFor(c.letter, c)
  const word = c.word ? cleanForSpeech(String(c.word)).toLowerCase() : ''
  const bits = [`${L}.`, `${L} says ${sound}${word ? `, as in ${word}` : ''}.`]
  if (word) bits.push(`${word.charAt(0).toUpperCase()}${word.slice(1)}.`)
  return bits.join(' ')
}

/** The "your turn" line spoken before the mic opens. */
export function letterPracticePrompt(c: LetterContent & Record<string, unknown>): string {
  return `Now you try! Say ${soundFor(c.letter, c)}.`
}

function norm(t: string): string {
  return t.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function lev(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
  return dp[a.length][b.length]
}

/** Words that count as a correct attempt for a letter card. */
export function acceptedFor(letter: string, word?: string): string[] {
  const info = LETTERS[letter.toLowerCase()]
  const list = new Set<string>([letter.toLowerCase()])
  if (info) {
    list.add(info.sound)
    info.names.forEach(n => list.add(n))
    info.heard.forEach(h => list.add(h))
  }
  if (word) list.add(norm(word))
  return Array.from(list)
}

/** Local, free grading for "say the letter sound / word" practice. */
export function gradeLetterAttempt(
  transcript: string,
  letter: string,
  word?: string,
): { passed: boolean; score: number } {
  const said = norm(transcript)
  if (!said) return { passed: false, score: 0 }
  const accepted = acceptedFor(letter, word)
  const tokens = said.split(' ')
  const phrase = said
  if (tokens.some(t => accepted.includes(t)) || accepted.includes(phrase)) return { passed: true, score: 100 }
  // Close enough: one slip on a 3+ letter target (e.g. "buhh" for "buh", "egg" heard as "eggs")
  const close = tokens.some(t => accepted.some(a => a.length >= 3 && t.length >= 3 && lev(t, a) <= 1))
  return close ? { passed: true, score: 80 } : { passed: false, score: 20 }
}

/** For `speak` activities whose expected answer is a single letter ("a"). */
export function gradeSingleLetter(transcript: string, expected: string): { passed: boolean; score: number } | null {
  const e = norm(expected)
  if (e.length !== 1 || !LETTERS[e]) return null
  return gradeLetterAttempt(transcript, e)
}

const ENCOURAGE_PASS = [
  'Yes! That is it!',
  'Great sound!',
  'Wonderful! You said it!',
  'Brilliant! Well done!',
]
const ENCOURAGE_RETRY = [
  'Nice try! Listen once more, then say it again.',
  'Almost! Let us try that sound again.',
  'Good effort! One more time.',
]

export const letterFeedback = {
  pass: () => ENCOURAGE_PASS[Math.floor(Math.random() * ENCOURAGE_PASS.length)],
  retry: () => ENCOURAGE_RETRY[Math.floor(Math.random() * ENCOURAGE_RETRY.length)],
  gaveUp: 'That is okay! We will practise this one again soon.',
}
