// Spoken and written encouragement. Plenty of variety so no child hears the same line over and over:
// each pool remembers what it used last and avoids repeating it until the others have had a turn.
// Lines may contain {name} and {xp}. Free, instant, no AI.
import type { AgeGroup } from '@/types/child'

type Band = 'young' | 'mid' | 'older'
const band = (a: AgeGroup): Band => (a === '0-5' ? 'young' : a === '6-8' ? 'mid' : 'older')

// ── pools ───────────────────────────────────────────────────────────────────
const POOLS: Record<string, { all: string[]; young?: string[]; older?: string[] }> = {
  // right first time
  first: {
    all: [
      'Brilliant, {name}!', 'Yes! That is it!', 'Spot on!', 'Nailed it!', 'You got it, {name}!', 'Perfect!', 'Superb work!',
      'That is exactly right!', 'Wow, {name}, well done!', 'Fantastic!', 'Right on the money!', 'Great thinking!', 'You make it look easy!',
      'Excellent, {name}!', 'Correct, and quick too!', 'Gold star for that one!',
    ],
    young: ['Hooray! You did it!', 'Yippee, {name}!', 'Clever you!', 'High five!', 'Good job, {name}!', 'You are so smart!'],
    older: ['Sharp answer.', 'Exactly. Nicely reasoned.', 'Solid work, {name}.', 'That is the one.', 'Well reasoned.'],
  },
  // right after a retry
  retry: {
    all: [
      'You stuck with it and got it!', 'There you go, {name}! Trying again paid off.', 'Got it this time!', 'Great persistence, {name}!',
      'See? You worked it out!', 'That is the spirit!', 'Second time lucky!', 'Nice recovery!', 'You did not give up, and it shows!', 'Mistakes help us learn, and you proved it!',
    ],
    young: ['Yay, you tried again and did it!', 'Good trying, {name}!'],
  },
  streak3: { all: ['Three in a row, {name}!', 'You are on a roll!', 'Hat trick! Keep going!', 'Three right in a row, brilliant!', 'You are on fire, {name}!', 'What a streak!', 'Nothing can stop you now!', 'That is three in a row!'] },
  streak5: { all: ['Five in a row! Unstoppable!', 'Wow, {name}, five right in a row!', 'Incredible streak!', 'You are a superstar today!', 'Five out of five! Amazing!', 'This is your best run yet!', 'Absolutely flying, {name}!', 'Is there anything you cannot do?'] },
  // wrong answer: kind, never harsh
  comfort: {
    all: [
      'Not quite, but you are close.', 'Good try, {name}! Have another look.', 'Almost! Think again.', 'That is okay, mistakes help us learn.', 'So near! Try once more.',
      'Hmm, not this one. You can work it out.', 'Nice effort! Let us try again.', 'Oops! Take your time.', 'Not yet, {name}. You are getting there.', 'Every try teaches you something.', 'Keep going, you have this.', 'That was a good guess. Try another.',
    ],
    young: ['Oh dear! Try again, {name}!', 'Ooh, nearly! Have another go.', 'It is okay, let us try again!'],
    older: ['Not quite. Re-read the question and try again.', 'Close, but check it once more.', 'Not that one. Think it through.'],
  },
  // say-it succeeded
  sayPass: {
    all: [
      'You said it perfectly!', 'Lovely, clear voice!', 'I heard that, great job, {name}!', 'Wonderful speaking!', 'That sounded great!', 'Yes! You said it!',
      'Beautiful pronunciation!', 'Great sound, {name}!', 'Perfect! I could hear every part.', 'Nicely said!', 'That is exactly how it sounds!', 'Terrific talking!',
    ],
    young: ['You said it! Hooray!', 'What a lovely voice!'],
  },
  sayRetry: { all: ['Nice try! Listen once more, then say it again.', 'Almost! One more time, {name}.', 'Good effort! Say it a little slower.', 'I did not quite catch that. Try again.', 'Speak up a little and try again.', 'Close! Listen again and copy me.', 'Take a breath and have another go.', 'Let us hear it one more time.'] },
  sayGaveUp: { all: ['That is okay, we will practise this one again soon.', 'No worries, {name}. We will come back to it.', 'It is a tricky one. We will try again later.', 'Good trying! We will practise it again soon.', 'Not to worry, we will meet this one again.'] },
  identifyOk: { all: ['Yes, you found it!', 'Good listening, {name}!', 'That is the one!', 'Sharp ears!', 'You picked the right one!', 'Spot on, great listening!', 'You heard it right!', 'Correct, nice work!'] },
  identifyNo: { all: ['Not that one. Listen again.', 'Hmm, try another.', 'Close! Listen once more.', 'Have another look and listen.', 'Not quite, {name}. Try again.'] },
  // asking the child to say it
  askSay: {
    all: ['Your turn! Can you say it out loud?', 'Now you try, {name}. Say it out loud!', 'Time to say it yourself!', 'Can you say it like me?', 'Let me hear you say it!', 'Your turn to talk, {name}!', 'Say it with me!', 'Ready to say it out loud?'],
    young: ['Can you say it, {name}?', 'Your turn! Say it loud!', 'Let us say it together!'],
  },
  // after Pip has said the word herself, hand over to the child
  yourTurn: { all: ['Now you!', 'Your turn!', 'Over to you, {name}!', 'Now you say it!', 'Say it with me now!', 'Can you say it?', 'Now say it, {name}!', 'Your turn to say it!'], young: ['Now you, {name}!', 'You say it!'] },
  // opening of a lesson (the only time "hi" is used)
  greetMorning: { all: ['Good morning, {name}! Ready to learn something new?', 'Morning, {name}! Let us get our brains warmed up.', 'Rise and shine, {name}! Let us start.', 'A fresh morning and a fresh lesson, {name}!'] },
  greetAfternoon: { all: ['Good afternoon, {name}! Let us have some fun learning.', 'Afternoon, {name}! Ready for a lesson?', 'Great to see you, {name}! Let us begin.', 'Welcome back, {name}! Let us dive in.'] },
  greetEvening: { all: ['Good evening, {name}! A little learning before bed?', 'Evening, {name}! Let us make it a good one.', 'Hello, {name}! A calm lesson to end the day.', 'Welcome, {name}! Let us begin.'] },
  greetStreak: { all: ['{xp}-day streak, {name}! Keep it going!', 'Back again, {name}! That streak is looking great.'] },
  // between cards (no "hi", no repeating the same opener)
  transition: {
    all: [
      'Next up!', 'Here we go!', 'Ready for the next one, {name}?', 'On to the next!', 'Let us keep going!', 'Moving on!', 'This one is a good one.', 'Let us see how you do with this.',
      'Another one for you, {name}.', 'Nice. What is next?', 'Look at this one!', 'Okay, {name}, here is another.', 'Keep it up!', 'Let us go!',
    ],
    young: ['Ooh, what is this?', 'Look, {name}!', 'Ready? Here we go!'],
    older: ['Next question.', 'Moving on to the next part.', 'Let us build on that.'],
  },
  // type-specific openers
  introListen: { all: ['Listen carefully to this.', 'Let us learn something new, {name}.', 'Here is something to learn.', 'Open your ears, {name}!', 'Listen closely.', 'Let me tell you about this one.', 'Take a look and listen.', 'Here is a new idea.'] },
  introTap: { all: ['Tap the right answer.', 'Which one is right, {name}?', 'Choose carefully.', 'Can you find the answer?', 'Think about it, then tap.', 'Pick the one you think is correct.', 'Take your time and tap.', 'Which one do you choose?'] },
  introSpeak: { all: ['Say it out loud!', 'Your turn to speak, {name}.', 'Let me hear your voice.', 'Say your answer clearly.', 'Speak up, {name}!', 'Say it in your own voice.', 'Give it a try out loud.', 'I am listening, {name}.'] },
  introType: { all: ['Type your answer.', 'Write it in the box, {name}.', 'Type what you think.', 'Put your answer in the box.', 'Spell it out for me.', 'Type it in, {name}.'] },
  introMatch: { all: ['Match each one with its partner.', 'Can you pair these up, {name}?', 'Tap a word, then tap its partner.', 'Time to make some matches.', 'Find the pairs, {name}.', 'Match them up!'] },
  // finishing a lesson
  celebrate: {
    all: [
      'Lesson complete! You earned {xp} XP.', 'Brilliant work, {name}! That is {xp} XP.', 'You did it, {name}! {xp} XP earned.', 'What a lesson! +{xp} XP.', 'All done, {name}! You picked up {xp} XP.',
      'Great effort today, {name}! {xp} XP in the bag.', 'Finished! Your brain just grew a little more. +{xp} XP.', 'Another lesson down, {name}! +{xp} XP.',
      'You should be proud, {name}! {xp} XP.', 'Smashed it! {xp} XP for you.', 'That was great learning, {name}. {xp} XP!', 'Well done, {name}! You added {xp} XP.',
    ],
    young: ['Hooray, {name}! You finished! {xp} XP!', 'You did it! Clap clap! {xp} XP!'],
  },
  celebrateTop: { all: ['Outstanding, {name}! Almost every answer right. +{xp} XP!', 'Top marks today, {name}! +{xp} XP!', 'You really know this, {name}! {xp} XP earned.', 'Fantastic scores, {name}! +{xp} XP.'] },
  celebrateTryAgain: { all: ['Well done for finishing, {name}! A little more practice and this will be easy. +{xp} XP.', 'You kept going, {name}, and that matters. +{xp} XP.', 'Good effort, {name}! We will practise this again soon. +{xp} XP.'] },
}

// Remember the last few picks per pool so lines do not repeat back to back
const recent = new Map<string, number[]>()

function choose(key: string, ageGroup: AgeGroup): string {
  const pool = POOLS[key]
  if (!pool) return ''
  const b = band(ageGroup)
  const lines = [...pool.all, ...(b === 'young' ? pool.young ?? [] : b === 'older' ? pool.older ?? [] : [])]
  const used = recent.get(key) ?? []
  const keep = Math.min(Math.max(1, Math.floor(lines.length / 2)), 6)
  let candidates = lines.map((_, i) => i).filter(i => !used.includes(i))
  if (!candidates.length) candidates = lines.map((_, i) => i)
  const pick = candidates[Math.floor(Math.random() * candidates.length)]
  recent.set(key, [...used, pick].slice(-keep))
  return lines[pick]
}

const fill = (text: string, name: string, xp?: number) =>
  text.replace(/\{name\}/g, name || 'friend').replace(/\{xp\}/g, String(xp ?? 0))

export type PraiseKind = 'yourTurn' | 'first' | 'retry' | 'streak3' | 'streak5' | 'comfort' | 'sayPass' | 'sayRetry' | 'sayGaveUp' | 'identifyOk' | 'identifyNo' | 'askSay'

/** One line of feedback, varied and age appropriate. */
export function say(kind: PraiseKind, name: string, ageGroup: AgeGroup): string {
  return fill(choose(kind, ageGroup), name)
}

/** The right line for a correct answer, including streak shout-outs. */
export function praiseCorrect(opts: { name: string; ageGroup: AgeGroup; firstTry: boolean; streak: number }): string {
  const { name, ageGroup, firstTry, streak } = opts
  if (firstTry && streak > 0 && streak % 5 === 0) return say('streak5', name, ageGroup)
  if (firstTry && streak > 0 && streak % 3 === 0) return say('streak3', name, ageGroup)
  return say(firstTry ? 'first' : 'retry', name, ageGroup)
}

/** A warm opening for the first card of a lesson. Only here do we greet. */
export function lessonGreeting(opts: { name: string; ageGroup: AgeGroup; streak: number; hour?: number }): string {
  const { name, ageGroup, streak } = opts
  const hour = opts.hour ?? new Date().getHours()
  if (streak >= 3 && Math.random() < 0.4) return fill(choose('greetStreak', ageGroup), name, streak)
  return say(hour < 12 ? 'greetMorning' as PraiseKind : hour < 18 ? 'greetAfternoon' as PraiseKind : 'greetEvening' as PraiseKind, name, ageGroup)
}

/** What Pip says when a card appears. Never "hi" after the first card. */
export function cardIntro(opts: { type: string; name: string; ageGroup: AgeGroup; first: boolean; streak: number; hour?: number }): string {
  const { type, name, ageGroup, first } = opts
  if (first) return `${lessonGreeting({ name, ageGroup, streak: opts.streak, hour: opts.hour })} ${typeOpener(type, name, ageGroup)}`
  // Mostly a type-specific line, sometimes a general transition so it never feels scripted
  return Math.random() < 0.7 ? typeOpener(type, name, ageGroup) : fill(choose('transition', ageGroup), name)
}

function typeOpener(type: string, name: string, ageGroup: AgeGroup): string {
  const key = type === 'listen' ? 'introListen' : type === 'tap_answer' ? 'introTap' : type === 'speak' ? 'introSpeak'
    : type === 'type_answer' ? 'introType' : type === 'drag_drop' ? 'introMatch' : 'transition'
  return fill(choose(key, ageGroup), name)
}

/** The lesson-complete message. */
export function celebration(opts: { name: string; ageGroup: AgeGroup; xp: number; score: number }): string {
  const { name, ageGroup, xp, score } = opts
  const key = score >= 90 ? 'celebrateTop' : score < 55 ? 'celebrateTryAgain' : 'celebrate'
  return fill(choose(key, ageGroup), name, xp)
}
