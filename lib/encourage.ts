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
      'Brilliant work, {name}!', 'Yes! That is exactly right!', 'You got it right, {name}!', 'Perfect answer, {name}!', 'Superb work today!',
      'That is exactly right!', 'Wow, {name}, well done!', 'Fantastic thinking!', 'You make learning look so fun!',
      'Excellent work, {name}!', 'Correct, and very quick too!', 'You earned a gold star for that answer!',
    ],
    young: ['Hooray! You did it, {name}!', 'Yippee, {name}!', 'You are so clever, {name}!', 'High five, {name}!', 'Good job, {name}!', 'You are so smart!'],
    older: ['That was a sharp answer, {name}.', 'Exactly right. Nicely reasoned.', 'Solid work, {name}.', 'That is the right one.', 'Very well reasoned, {name}.'],
  },
  // right after a retry
  retry: {
    all: [
      'You stuck with it and got it right!', 'There you go, {name}! Trying again paid off.', 'You got it this time, {name}!', 'Great persistence, {name}!',
      'See? You worked it out!', 'That is the spirit, {name}!', 'You solved it on your second try!', 'Great job working that out, {name}!', 'You did not give up, and it shows!', 'Mistakes help us learn, and you proved it!',
    ],
    young: ['Yay, you tried again and did it!', 'Great effort, {name}!'],
  },
  streak3: { all: ['Three correct answers in a row, {name}!', 'You are doing wonderful, {name}!', 'Three in a row! Keep going, {name}!', 'Three right in a row, brilliant work!', 'You are doing fantastic today, {name}!', 'What a wonderful streak, {name}!', 'You are doing so well, {name}!', 'That is three correct in a row!'] },
  streak5: { all: ['Five in a row! You are doing fantastic, {name}!', 'Wow, {name}, five correct answers in a row!', 'What an incredible streak, {name}!', 'You are a superstar today, {name}!', 'Five out of five! Amazing work!', 'This is your best run yet, {name}!', 'You are doing extraordinary work, {name}!', 'You are such a fantastic learner, {name}!'] },
  // wrong answer: kind, never harsh
  comfort: {
    all: [
      'Not quite, but you are very close.', 'Good try, {name}! Have another look.', 'Almost! Think about it once more.', 'That is okay, mistakes help our brains grow.', 'So near! Try once more, {name}.',
      'Hmm, not this one. You can work it out!', 'Nice effort! Let us try again together.', 'Take your time, {name}. You can do this.', 'Not yet, {name}. You are getting closer!', 'Every try teaches you something new.', 'Keep going, {name}, you can do this!', 'That was a good guess. Let us try another.',
    ],
    young: ['That is okay! Try once more, {name}!', 'You are so close! Have another go, {name}.', 'It is okay, let us try again together!'],
    older: ['Not quite. Re-read the question and try again.', 'Close, but check your answer once more.', 'Not that one. Think it through carefully.'],
  },
  // say-it succeeded
  sayPass: {
    all: [
      'You said it perfectly, {name}!', 'You have a lovely, clear voice, {name}!', 'I heard that clearly! Great job, {name}!', 'Wonderful speaking, {name}!', 'That sounded great!', 'Yes! You said it out loud!',
      'Beautiful pronunciation, {name}!', 'That was a great sound, {name}!', 'Perfect! I could hear every part clearly.', 'Nicely said, {name}!', 'That is exactly how it sounds!', 'That was terrific speaking, {name}!',
    ],
    young: ['You said it! Hooray, {name}!', 'You have such a lovely voice, {name}!'],
  },
  sayRetry: { all: ['Nice try! Listen once more, then say it again with me.', 'You are almost there! Try saying it one more time, {name}.', 'That was a good effort! Say it a little slower this time.', 'I did not quite hear that. Please try again, {name}.', 'Speak up a little and try again, {name}.', 'You are very close! Listen once more and say it with me.', 'Take a breath and have another go, {name}.', 'Let us hear it one more time together.'] },
  sayGaveUp: { all: ['That is okay, we will practise this one again soon.', 'That is completely fine, {name}. We will come back to this one soon.', 'It is a tricky one. We will try again later.', 'You tried very hard, {name}! We will practise this again soon.', 'Do not worry, {name}. We will practise this one again soon.'] },
  identifyOk: { all: ['Yes, you found it, {name}!', 'Good listening, {name}!', 'That is the right one!', 'Sharp ears, {name}!', 'You picked the correct answer!', 'Spot on, that was great listening!', 'You heard it right!', 'Correct, nice work, {name}!'] },
  identifyNo: { all: ['Not that one. Listen carefully again.', 'Hmm, try another one, {name}.', 'Close! Listen once more.', 'Have another look and listen carefully.', 'Not quite, {name}. Try again.'] },
  // asking the child to say it
  askSay: {
    all: ['Your turn! Can you say it out loud?', 'Now you try, {name}. Say it out loud!', 'Time to say it yourself, {name}!', 'Can you say it like me?', 'Let me hear you say it!', 'Your turn to talk, {name}!', 'Say it with me now!', 'Are you ready to say it out loud?'],
    young: ['Can you say it, {name}?', 'Your turn, {name}! Say it loud and proud!', 'Let us say it together, {name}!'],
  },
  // after Pip has said the word herself, hand over to the child
  yourTurn: { all: ['Now you!', 'Your turn, {name}!', 'Over to you, {name}!', 'Now you say it!', 'Say it with me now!', 'Can you say it, {name}?', 'Now say it out loud, {name}!', 'Your turn to say it!'], young: ['Now you, {name}!', 'You say it, {name}!'] },
  // opening of a lesson (the only time "hi" is used)
  greetMorning: { all: ['Good morning, {name}! Ready to learn something new?', 'Good morning, {name}! Let us get our brains warmed up.', 'Rise and shine, {name}! Let us start learning.', 'A fresh morning and a fresh lesson, {name}!'] },
  greetAfternoon: { all: ['Good afternoon, {name}! Let us have some fun learning.', 'Good afternoon, {name}! Ready for your lesson?', 'Great to see you, {name}! Let us begin.', 'Welcome back, {name}! Let us dive right in.'] },
  greetEvening: { all: ['Good evening, {name}! A little learning before bedtime?', 'Good evening, {name}! Let us make it a great lesson.', 'Hello, {name}! A calm lesson to end the day.', 'Welcome, {name}! Let us begin our lesson.'] },
  greetStreak: { all: ['You are on a {xp}-day streak, {name}! Keep it going!', 'Welcome back, {name}! Your learning streak is looking great.'] },
  // between cards (no "hi", no repeating the same opener)
  transition: {
    all: [
      'Here is our next question!', 'Are you ready for the next one, {name}?', 'Let us keep going, {name}!', 'Let us move on to the next activity!',
      'This next one is exciting!', 'Let us see how you do with this one, {name}.', 'Here is another question for you, {name}.', 'Look at this new question, {name}!',
      'Keep up the great work, {name}!', 'Let us continue!',
    ],
    young: ['Ooh, what do we have here?', 'Look, {name}! Here comes the next one!', 'Are you ready? Here we go!'],
    older: ['Let us look at the next question.', 'We are moving on to the next part now.', 'Let us build on what you just learned.'],
  },
  // type-specific openers
  introListen: { all: ['Listen carefully to this.', 'Let us learn something new, {name}.', 'Here is something fun to learn.', 'Open your ears, {name}!', 'Listen closely to what Pip says.', 'Let me tell you about this one.', 'Take a look and listen carefully.', 'Here is a new idea for you.'] },
  introTap: { all: ['Tap the correct answer.', 'Which one is right, {name}?', 'Choose carefully.', 'Can you find the correct answer?', 'Think about it, then tap your choice.', 'Pick the one you think is correct.', 'Take your time and tap the answer.', 'Which one do you choose, {name}?'] },
  introSpeak: { all: ['Say the answer out loud!', 'Your turn to speak, {name}.', 'Let me hear your clear voice.', 'Say your answer clearly.', 'Speak up, {name}!', 'Say it in your own voice.', 'Give it a try out loud, {name}.', 'I am listening, {name}.'] },
  introType: { all: ['Type your answer.', 'Write your answer in the box, {name}.', 'Type what you think.', 'Put your answer in the box.', 'Spell it out for me, {name}.', 'Type it in carefully, {name}.'] },
  introMatch: { all: ['Match each item with its partner.', 'Can you pair these up, {name}?', 'Tap a word, then tap its partner.', 'Time to make some matches, {name}.', 'Find the matching pairs, {name}.', 'Match them up together!'] },
  // finishing a lesson
  celebrate: {
    all: [
      'You have completed the lesson, {name}! You earned {xp} points.',
      'Brilliant work, {name}! You earned {xp} points today.',
      'You did a fantastic job, {name}! You earned {xp} points.',
      'Congratulations on finishing your lesson, {name}! You earned {xp} points.',
      'You worked so hard today, {name}! You earned {xp} points.',
      'Your brain grew stronger today, {name}! You earned {xp} points.',
      'You completed another wonderful lesson, {name}!',
      'You should be very proud of yourself, {name}! You earned {xp} points.',
      'That was wonderful learning today, {name}! You earned {xp} points.',
      'Well done, {name}! You added {xp} points to your progress.',
    ],
    young: [
      'Hooray, {name}! You finished the whole lesson and earned {xp} points!',
      'You did it, {name}! I am so proud of your wonderful work!',
    ],
  },
  celebrateTop: {
    all: [
      'Outstanding work, {name}! You got almost every answer correct and earned {xp} points.',
      'Top marks today, {name}! You earned {xp} points for your wonderful work.',
      'You really understand this topic, {name}! You earned {xp} points today.',
      'You achieved a fantastic score today, {name}! You earned {xp} points.',
    ],
  },
  celebrateTryAgain: {
    all: [
      'Well done for finishing the lesson, {name}! With a little more practice, this will be easy.',
      'You kept trying and did not give up, {name}! You earned {xp} points today.',
      'Great effort today, {name}! We will practise this together again soon.',
    ],
  },
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
