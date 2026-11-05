import type { ActivityType } from '@/types/activity'
import type { AgeGroup } from '@/types/child'

export const NARRATION_TEMPLATES: Record<ActivityType, Record<AgeGroup, string[]>> = {
  listen: {
    '0-5':   [
      "Hi {name}! Let's listen together. Can you hear this?",
      "Great job, {name}! Now listen carefully to this one.",
      "You're doing amazing, {name}! Listen to what I say.",
    ],
    '6-8':   [
      "{name}, listen carefully and remember this!",
      "Pay attention, {name}. This is important!",
      "Let's learn this together, {name}!",
    ],
    '9-11':  [
      "Listen carefully, {name}. You got this!",
      "Focus up, {name}! Let's learn this concept.",
      "Ready to learn something new, {name}?",
    ],
    '12-14': [
      "Let's explore this concept, {name}.",
      "Here's something interesting for you, {name}.",
      "Stay focused, {name}. This one is key.",
    ],
  },
  speak: {
    '0-5':   [
      "Your turn, {name}! Can you say it with me?",
      "Let's try it together, {name}! Speak clearly!",
      "You can do it, {name}! Say it out loud!",
    ],
    '6-8':   [
      "Now it's your turn, {name}. Say it clearly!",
      "Speak it out, {name}! I'm listening.",
      "Let me hear you, {name}! Give it your best!",
    ],
    '9-11':  [
      "Your turn, {name}. Say it as clearly as you can.",
      "Pronounce it carefully, {name}. I'm listening!",
      "Speak up, {name}! You've got this.",
    ],
    '12-14': [
      "Now speak the answer, {name}. Be clear and confident.",
      "Your pronunciation matters, {name}. Say it clearly.",
      "Speak your answer, {name}. Take your time.",
    ],
  },
  'tap_answer': {
    '0-5':   [
      "Tap the right answer, {name}! Which one is it?",
      "Can you find it, {name}? Tap the correct one!",
      "Look carefully, {name}. Tap the right picture!",
    ],
    '6-8':   [
      "Choose the correct answer, {name}!",
      "Think carefully and tap, {name}!",
      "Which one is right, {name}? Tap it!",
    ],
    '9-11':  [
      "Select the best answer, {name}.",
      "Think it through, {name}. Which is correct?",
      "Read all options carefully, {name}, then choose.",
    ],
    '12-14': [
      "Analyze the options and choose, {name}.",
      "Consider each choice carefully, {name}.",
      "What's the correct answer, {name}?",
    ],
  },
  'type_answer': {
    '0-5':   [
      "Can you type the answer, {name}?",
      "Type what you think, {name}!",
      "Write your answer, {name}!",
    ],
    '6-8':   [
      "Type your answer, {name}. Spell it right!",
      "Write it out, {name}!",
      "Type the answer you know, {name}!",
    ],
    '9-11':  [
      "Type your answer, {name}. Check your spelling!",
      "Write the answer clearly, {name}.",
      "Think, then type, {name}!",
    ],
    '12-14': [
      "Type a complete answer, {name}.",
      "Write your response carefully, {name}.",
      "Express your answer in writing, {name}.",
    ],
  },
  'video': {
    '0-5':   [
      "Watch this fun video, {name}!",
      "Let's see what happens, {name}!",
      "Pay attention to the video, {name}!",
    ],
    '6-8':   [
      "Watch carefully, {name}! There will be questions.",
      "This video has cool things to learn, {name}!",
      "Eyes on the screen, {name}!",
    ],
    '9-11':  [
      "Watch this video and take mental notes, {name}.",
      "Pay close attention to the details, {name}.",
      "There's a lot to learn in this video, {name}!",
    ],
    '12-14': [
      "Watch and think critically, {name}.",
      "Take note of the key concepts, {name}.",
      "This video covers important material, {name}.",
    ],
  },
  'drag_drop': {
    '0-5':   [
      "Drag the pictures to the right place, {name}!",
      "Match them up, {name}! You can do it!",
      "Put them where they belong, {name}!",
    ],
    '6-8':   [
      "Drag and match the pairs, {name}!",
      "Connect the right items, {name}!",
      "Match them correctly, {name}!",
    ],
    '9-11':  [
      "Match each item to its pair, {name}.",
      "Drag the correct items to match, {name}.",
      "Think carefully about each match, {name}.",
    ],
    '12-14': [
      "Match each concept to its definition, {name}.",
      "Pair the items correctly, {name}.",
      "Analyze and match, {name}.",
    ],
  },
}

export const HINTS_BY_ACTIVITY: Record<ActivityType, string[][]> = {
  listen: [
    ["Listen one more time carefully!", "Focus on the sounds you hear.", "Try closing your eyes and listening again."],
  ],
  speak: [
    ["Say it slowly, one sound at a time.", "Break the word into small parts.", "Try saying it again — louder this time!"],
  ],
  'tap_answer': [
    ["Look at each answer again.", "Try to eliminate the ones you know are wrong.", "Think about what you learned — which matches?"],
  ],
  'type_answer': [
    ["Think about the letters in the word.", "Sound it out as you type.", "Check your spelling carefully."],
  ],
  'video': [
    ["Rewatch the video if you need to!", "Look for clues in what was shown.", "Think about the main idea of the video."],
  ],
  'drag_drop': [
    ["Read each item carefully.", "Match the ones you're most sure about first.", "Think about how the pairs are related."],
  ],
}

export const CELEBRATE_MESSAGES: string[] = [
  "Incredible work! You are a superstar!",
  "You worked so hard today, and I am so proud of you!",
  "That was amazing! Keep shining bright!",
  "Wow, you did fantastic work today!",
  "You did it! Every lesson makes your brain stronger!",
  "Brilliant performance! You are doing wonderful!",
  "Outstanding! You should be very proud of yourself!",
  "Superb effort! That was really impressive work!",
  "You did a wonderful job today! Well done!",
  "Remarkable job! You are growing smarter every day!",
  "Excellent! Your hard work is really paying off!",
  "Phenomenal work! You make learning look so fun!",
  "You did an extraordinary job on this lesson today!",
  "Wonderful! Keep up this great momentum!",
  "You did great today! Keep up the wonderful work!",
  "Spectacular! Your brain is getting stronger every day!",
  "Bravo! That was a top-notch performance today!",
  "You are a true learning champion! Well done!",
  "Awesome job completing that lesson today!",
  "Your brain is growing smarter and stronger every day!",
]

export const CORRECT_FEEDBACKS: string[] = [
  "That is correct! Great thinking!",
  "Yes! You got it right!",
  "Exactly right! Well done!",
  "Perfect answer! You are so smart!",
  "Correct! I knew you could do it!",
]

export const WRONG_FEEDBACKS: string[] = [
  "Not quite, but keep trying! You are getting closer.",
  "Good effort! Let us try that again.",
  "Almost there! Give it another go.",
  "Not this time, but do not give up!",
  "Keep going! You will get it with one more try.",
]
