export interface StoryKeyword {
  word: string
  phonetic?: string
  definition: string
}

export interface StoryPage {
  pageNumber: number
  heading: string
  text: string
  illustration: string
  ambientColor: string
  keywords: StoryKeyword[]
  funPrompt: string
}

export interface StoryCourse {
  id: string
  title: string
  subtitle: string
  tag: string
  tagColor: string
  coverImage: string
  ageRange: string
  targetAge: '0-5' | '6-8' | '9-11' | '12-14'
  readTime: string
  summary: string
  moral: string
  xpReward: number
  accentColor: string
  bgGradient: string
  pages: StoryPage[]
}

export const STORIES_DATA: StoryCourse[] = [
  {
    id: 'starry-balloon',
    title: 'The Starry Balloon',
    subtitle: 'A high-flying night adventure among glowing constellations',
    tag: 'Friendship',
    tagColor: 'bg-blue-100 text-blue-700 border-blue-300',
    coverImage: '/images/story-starry-balloon.jpg',
    ageRange: 'Ages 4–8',
    targetAge: '6-8',
    readTime: '4 min read',
    summary:
      'Join three joyful adventurers drifting high above the sleepy town in a giant golden hot-air balloon, discovering smiling constellations, wishing stars, and a friendly moon.',
    moral: 'When we explore together and help each other, every journey becomes unforgettable.',
    xpReward: 30,
    accentColor: '#0284c7',
    bgGradient: 'from-[#0f172a] via-[#1e1b4b] to-[#0c4a6e]',
    pages: [
      {
        pageNumber: 1,
        heading: 'Night of the Golden Balloon',
        text: 'As the twilight sky turned deep violet, Mia, Leo, and little Sam stepped into the cozy wicker basket of the Starry Balloon. The huge balloon glowed warm amber, painted with swirls of golden starlight. With a soft gentle swoosh of warm air, the balloon lifted off the ground, floating softly into the cool evening breeze.',
        illustration: '/images/story-starry-balloon.jpg',
        ambientColor: '#1e3a8a',
        keywords: [
          { word: 'twilight', phonetic: 'TWYE-lyte', definition: 'The soft glowing light in the sky after sunset' },
          { word: 'wicker', phonetic: 'WIK-er', definition: 'Flexible wooden twigs woven into a sturdy basket' },
          { word: 'breeze', phonetic: 'BREEZ', definition: 'A gentle, refreshing puff of cool wind' },
        ],
        funPrompt: 'Look up at the balloon! Can you spot the glowing golden stars on the side?',
      },
      {
        pageNumber: 2,
        heading: 'Dancing Constellations',
        text: 'Higher and higher they floated, drifting right through fluffy silver clouds. Suddenly, Sam pointed into the dark blue sky. "Look! The stars are drawing pictures!" A friendly constellation shaped like a playful flying pegasus danced beside their basket, winking its bright silver eyes.',
        illustration: '/images/story-starry-balloon.jpg',
        ambientColor: '#312e81',
        keywords: [
          { word: 'constellation', phonetic: 'kon-stuh-LAY-shun', definition: 'A group of shining stars that form a shape like an animal or hero' },
          { word: 'pegasus', phonetic: 'PEG-uh-sus', definition: 'A magical winged horse from ancient myths' },
        ],
        funPrompt: 'If you could draw a constellation in the sky right now, what animal would you make?',
      },
      {
        pageNumber: 3,
        heading: 'The Smiling Moon',
        text: 'Around midnight, the balloon gently floated near a big, smiling crescent moon. "Welcome, brave dreamers," whispered the moon in a warm, humming voice. Mia smiled and waved her telescope. "Thank you for lighting our path!" Sam held hands with Leo, feeling safe and full of wonder.',
        illustration: '/images/story-starry-balloon.jpg',
        ambientColor: '#1e293b',
        keywords: [
          { word: 'crescent', phonetic: 'KREZ-ent', definition: 'A curved, banana-shaped moon outline' },
          { word: 'telescope', phonetic: 'TEL-uh-skope', definition: 'A magical tube with glass lenses to see far-away planets' },
        ],
        funPrompt: 'Wave hello to the moon! Can you make a gentle crescent shape with your fingers?',
      },
      {
        pageNumber: 4,
        heading: 'Safe Landing in Dreamland',
        text: 'As the first golden rays of dawn began to peek over the horizon, the Starry Balloon drifted softly back down toward emerald green meadows. The three friends tucked their blankets tight, knowing they had seen the true magic of the night sky. "Best adventure ever," whispered Leo, drifting off into sweet dreams.',
        illustration: '/images/story-starry-balloon.jpg',
        ambientColor: '#0f172a',
        keywords: [
          { word: 'horizon', phonetic: 'huh-RYE-zun', definition: 'The faraway line where the sky touches the ground' },
          { word: 'meadow', phonetic: 'MED-oh', definition: 'A wide grassy field filled with wildflowers' },
        ],
        funPrompt: 'Yay! You finished the story! How many stars do you rate this adventure?',
      },
    ],
  },
  {
    id: 'luna-glow',
    title: 'Luna and the Little Glow',
    subtitle: 'An enchanted forest tale of warmth and finding family',
    tag: 'Fantasy',
    tagColor: 'bg-purple-100 text-purple-700 border-purple-300',
    coverImage: '/images/story-luna-glow.jpg',
    ageRange: 'Ages 3–7',
    targetAge: '0-5',
    readTime: '3 min read',
    summary:
      'In a magical forest where oversized mushrooms glow like lanterns, a kind-hearted girl named Luna discovers a tiny glowing kitten who lost its way home.',
    moral: 'Kindness is the brightest light of all.',
    xpReward: 30,
    accentColor: '#9333ea',
    bgGradient: 'from-[#1e1b4b] via-[#3b0764] to-[#1e293b]',
    pages: [
      {
        pageNumber: 1,
        heading: 'The Glowing Forest',
        text: 'Every evening, the Whispering Woods transformed into a wonderland of lights. Giant turquoise mushrooms glowed like friendly nightlights, and silver fireflies danced between ancient mossy oak trees. Luna loved walking here with her purple lantern, listening to the gentle hum of the forest.',
        illustration: '/images/story-luna-glow.jpg',
        ambientColor: '#581c87',
        keywords: [
          { word: 'wonderland', phonetic: 'WUN-der-land', definition: 'An enchanted place full of magical and beautiful surprises' },
          { word: 'lantern', phonetic: 'LAN-tern', definition: 'A portable light with a glass case that protects the flame or glow' },
        ],
        funPrompt: 'What color would you like your magical glowing mushroom to be?',
      },
      {
        pageNumber: 2,
        heading: 'A Tiny Lost Friend',
        text: 'Near the roots of a giant weeping willow, Luna heard a tiny sound. "Mew... mew..." Sitting alone in a nest of glowing blue moss was a little kitten, no bigger than a teacup! But this was no ordinary kitty. Its soft fur sparkled with pure starlight, radiating a comforting warm golden glow.',
        illustration: '/images/story-luna-glow.jpg',
        ambientColor: '#4c1d95',
        keywords: [
          { word: 'radiating', phonetic: 'RAY-dee-ay-ting', definition: 'Sending out warmth and bright friendly beams of light' },
          { word: 'ordinary', phonetic: 'OR-din-air-ee', definition: 'Normal and usual; not magical' },
        ],
        funPrompt: 'Gently cup your hands together! Imagine holding the warm glowing kitten.',
      },
      {
        pageNumber: 3,
        heading: 'Following the Starlight Trail',
        text: '"Do not worry, little Glow," Luna whispered gently, scooping the kitten into her warm woolen scarf. The kitten purred happily, sending soft ripples of golden sparkles into the night. Together, they followed a trail of luminous starlight petals leading toward the center of the enchanted clearing.',
        illustration: '/images/story-luna-glow.jpg',
        ambientColor: '#3b0764',
        keywords: [
          { word: 'luminous', phonetic: 'LOO-min-us', definition: 'Shining brightly in the dark with its own light' },
          { word: 'purred', phonetic: 'PURD', definition: 'The vibrating happy humming sound a kitten makes' },
        ],
        funPrompt: 'Can you purr like a happy magical kitten? "Purrrrrr!"',
      },
      {
        pageNumber: 4,
        heading: 'Reunited in the Starlight',
        text: 'Under the giant Starlight Tree, Mother Cat was waiting, her big sapphire eyes shining with relief. She nuzzled little Glow and brushed her tail against Luna in deep gratitude. Luna smiled warmly, knowing that kindness always finds a way to brighten the darkest night.',
        illustration: '/images/story-luna-glow.jpg',
        ambientColor: '#2e1065',
        keywords: [
          { word: 'sapphire', phonetic: 'SAF-yre', definition: 'A precious gemstone of deep, brilliant blue' },
          { word: 'gratitude', phonetic: 'GRAT-ih-tood', definition: 'The warm feeling of being deeply thankful' },
        ],
        funPrompt: 'Give yourself a gentle hug for helping Luna bring the kitten home!',
      },
    ],
  },
  {
    id: 'brave-sailor',
    title: 'The Brave Little Sailor',
    subtitle: 'An island voyage of courage, dolphins, and crystal seas',
    tag: 'Adventure',
    tagColor: 'bg-teal-100 text-teal-700 border-teal-300',
    coverImage: '/images/story-brave-sailor.jpg',
    ageRange: 'Ages 5–9',
    targetAge: '6-8',
    readTime: '5 min read',
    summary:
      'Leo sets sail in his trusty wooden boat across sunlit turquoise seas, accompanied by a pod of leaping dolphins on a quest to find the legendary Shell of Harmony.',
    moral: 'Courage is not about having no fear—it is about sailing forward with a joyful heart.',
    xpReward: 30,
    accentColor: '#0d9488',
    bgGradient: 'from-[#042f2e] via-[#115e59] to-[#0f766e]',
    pages: [
      {
        pageNumber: 1,
        heading: 'Setting Sail on the Sea Breeze',
        text: 'The morning sun turned the turquoise lagoon into shimmering liquid gold. Leo adjusted his captain cap, untied the rope from the wooden dock, and hoisted the white canvas sail. His boat, "Sea Breeze," glided smoothly across the crystal waves, rocking gently in the warm ocean swells.',
        illustration: '/images/story-brave-sailor.jpg',
        ambientColor: '#0f766e',
        keywords: [
          { word: 'lagoon', phonetic: 'luh-GOON', definition: 'A calm, shallow pool of clear ocean water near an island' },
          { word: 'hoisted', phonetic: 'HOY-sted', definition: 'Pulled up high using ropes and strong hands' },
        ],
        funPrompt: 'Raise your hands and pretend you are hoisting the big sail into the wind!',
      },
      {
        pageNumber: 2,
        heading: 'Dolphin Companions',
        text: 'Suddenly, a playful splash broke the water on Leo\'s port side! Three sleek blue dolphins leaped into the air, doing joyful flips in the sun. The lead dolphin, with a silver spot near her fin, chirped merrily and swam ahead, showing Leo the safest passage through the coral reef.',
        illustration: '/images/story-brave-sailor.jpg',
        ambientColor: '#134e4a',
        keywords: [
          { word: 'port', phonetic: 'PORT', definition: 'The left side of a ship when you are facing forward' },
          { word: 'coral', phonetic: 'KOR-ul', definition: 'Colorful living sea rocks that shelter tiny tropical fish' },
        ],
        funPrompt: 'Make dolphin clicks and whistles with your mouth: "Click-click-chirp!"',
      },
      {
        pageNumber: 3,
        heading: 'The Mysterious Whispering Palms',
        text: 'Guided by the dolphins, Leo spotted an uncharted emerald island in the distance. Tall palm trees swayed in the breeze, singing a gentle melodious song. As his boat touched the powdery white sand, Leo found a giant rainbow conch shell half-buried near the tide line.',
        illustration: '/images/story-brave-sailor.jpg',
        ambientColor: '#115e59',
        keywords: [
          { word: 'uncharted', phonetic: 'un-CHAR-ted', definition: 'A new, magical place not yet drawn on any map' },
          { word: 'conch', phonetic: 'KONK', definition: 'A large, spiraled seashell that can echo the ocean sound' },
        ],
        funPrompt: 'Put your hand to your ear like a conch shell! Can you hear the whispering waves?',
      },
      {
        pageNumber: 4,
        heading: 'The Song of Harmony',
        text: 'Leo held the rainbow shell to his lips and blew a gentle breath. A pure, musical chime echoed across the open sea. The dolphins leaped high in celebration, and colorful parakeets circled overhead. Leo stood tall on the sand, a proud and brave young captain who had found harmony with the ocean.',
        illustration: '/images/story-brave-sailor.jpg',
        ambientColor: '#042f2e',
        keywords: [
          { word: 'harmony', phonetic: 'HAR-muh-nee', definition: 'When different voices and sounds fit together in peace and beauty' },
          { word: 'celebration', phonetic: 'sel-uh-BRAY-shun', definition: 'A joyful party celebrating a happy achievement' },
        ],
        funPrompt: 'Take a deep breath and blow out gently like blowing a magic conch shell!',
      },
    ],
  },
  {
    id: 'secret-garden',
    title: 'The Secret Garden',
    subtitle: 'A sanctuary of talking blossoms and fluttering butterflies',
    tag: 'Kindness',
    tagColor: 'bg-rose-100 text-rose-700 border-rose-300',
    coverImage: '/images/story-secret-garden.jpg',
    ageRange: 'Ages 4–8',
    targetAge: '6-8',
    readTime: '4 min read',
    summary:
      'Aria discovers a forgotten stone archway hidden behind thick ivy, opening into a vibrant secret garden where flowers speak gently to those who care for them.',
    moral: 'When we nurture living things with patience and love, wonderful blossoms bloom.',
    xpReward: 30,
    accentColor: '#e11d48',
    bgGradient: 'from-[#4c0519] via-[#881337] to-[#1c1917]',
    pages: [
      {
        pageNumber: 1,
        heading: 'Behind the Ivy Wall',
        text: 'In the oldest corner of the village park stood a crumbling brick wall completely covered in climbing ivy. While chasing a yellow butterfly, Aria noticed something curious: a golden brass keyhole hidden beneath the dark green leaves. She gently parted the vines and pushed the heavy oak door open.',
        illustration: '/images/story-secret-garden.jpg',
        ambientColor: '#881337',
        keywords: [
          { word: 'curious', phonetic: 'KYOOR-ee-us', definition: 'Eager to explore, learn, and discover new things' },
          { word: 'ivy', phonetic: 'EYE-vee', definition: 'A climbing green plant that grows up walls and tree trunks' },
        ],
        funPrompt: 'Pretend to turn an old brass key in a secret door: "Click-clack!"',
      },
      {
        pageNumber: 2,
        heading: 'Talking Blossoms',
        text: 'The door opened into a breathless sea of pink roses, giant bluebells, and fragrant lavender. "Hello, kind child!" chimed a sweet, velvety voice. Aria blinked. A pair of oversized blushing pink roses bowed gracefully toward her! "We have waited so long for a friend to visit," the roses whispered.',
        illustration: '/images/story-secret-garden.jpg',
        ambientColor: '#9f1239',
        keywords: [
          { word: 'fragrant', phonetic: 'FRAY-grunt', definition: 'Having a lovely, sweet, pleasant smell' },
          { word: 'velvety', phonetic: 'VEL-vuh-tee', definition: 'Soft and smooth like rich royal cloth' },
        ],
        funPrompt: 'Take a big sniff through your nose! Imagine the sweetest rose in the world.',
      },
      {
        pageNumber: 3,
        heading: 'The Magic Watering Can',
        text: 'Beside a bubbling stone fountain sat a silver watering can engraved with laughing bees. Aria filled it with clear spring water and walked down the cobblestone paths, giving each thirsty blossom a cool, sparkling drink. With every droplet, the flowers grew taller, shining with rainbow colors.',
        illustration: '/images/story-secret-garden.jpg',
        ambientColor: '#be123c',
        keywords: [
          { word: 'engraved', phonetic: 'en-GRAYVD', definition: 'Carved with delicate decorative patterns' },
          { word: 'cobblestone', phonetic: 'KOB-ul-stone', definition: 'Smooth, rounded stones used to pave old walking paths' },
        ],
        funPrompt: 'Pretend you are holding a watering can, tipping it gently: "Drip, drop, splash!"',
      },
      {
        pageNumber: 4,
        heading: 'A Sanctuary of Wonder',
        text: 'Hundreds of shimmering butterflies fluttered around Aria, forming a glowing crown of light above her straw sunhat. The entire garden sang a chorus of thanks. Aria smiled, promising to return every afternoon to tend her beloved secret sanctuary.',
        illustration: '/images/story-secret-garden.jpg',
        ambientColor: '#4c0519',
        keywords: [
          { word: 'sanctuary', phonetic: 'SANK-choo-air-ee', definition: 'A safe, peaceful place of beauty and protection' },
          { word: 'shimmering', phonetic: 'SHIM-er-ing', definition: 'Gleaming with a soft, flickering, dancing light' },
        ],
        funPrompt: 'Flap your arms gently like a friendly butterfly visiting the roses!',
      },
    ],
  },
]

export function getStoryById(id: string): StoryCourse | undefined {
  return STORIES_DATA.find(s => s.id === id)
}

export function getAllStories(): StoryCourse[] {
  return STORIES_DATA
}

