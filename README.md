# Bright Steps

Gamified AI-powered educational platform for children aged 0–14.

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** + **Framer Motion**
- **PHP + MySQL API** (`brightmindapi`) — auth, lessons, progress, achievements
- **Claude API** — cached, capped coaching notes and admin-reviewed lesson variants; everything else runs on free rules and templates
- **Web Speech API** (primary TTS/STT) + **ElevenLabs** / **Whisper** (fallbacks)
- **Zustand** — global XP, lives, streak, session state
- **canvas-confetti** — celebrations
- **recharts** — XP history charts

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
Copy `.env.local` and fill in your keys:
```
NEXT_PUBLIC_API_URL=       # the PHP/MySQL API, e.g. http://brightmindapi.test
ANTHROPIC_API_KEY=         # optional — the app works without it (rules + templates)
ELEVENLABS_API_KEY=        # optional TTS fallback
OPENAI_API_KEY=            # optional STT fallback (Whisper)
NEXT_PUBLIC_SHOW_AI_TIER=true

# AI cost controls (all optional)
AI_ENABLED=true            # false = no runtime AI calls at all
AI_RUNTIME_MODEL=claude-haiku-5-5
AI_AUTHOR_MODEL=claude-sonnet-5-5   # admin variant authoring only
AI_DAILY_CAP_PER_CHILD=6
AI_DAILY_CAP_GLOBAL=500
AI_MAX_CALLS_PER_HOUR=120  # per server instance (hints, borderline speech grading)
```

### 3. Set up the API
Point a local web server at `brightmindapi/`, import `brightmindapi/schema.sql`, and edit `config.php`.
The AI tables (`lesson_variants`, `ai_cache`, `ai_usage`) are created automatically on first use.

### 4. Run dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## AI — rules first, AI second

| What | How | Cost |
|------|-----|------|
| Next lesson, mastery, review | Rules over `lesson_progress` (`api/recommend.php`) | free |
| Narration, celebrations, most feedback | Template pools (`lib/fallbackTeacher*.ts`) | free |
| Letter-sound practice | Local matcher (`lib/phonics.ts`) | free |
| Unique lessons | Admin-approved AI variants (`/admin/variants`) + `{name}`/`{theme}` tokens | one call per variant |
| Coaching note (dashboard, parent page, lesson end) | `/api/ai/coach`: cached per child + progress snapshot, daily caps, kill switch | ≤ 1 small call per progress change |
| Hints, borderline speech grading | Small model, hourly budget per instance | rare |

Every AI call falls back to the free text, so `AI_ENABLED=false` keeps the app fully working.
Calls are logged in the `ai_usage` table.

## Voice System

**Teacher TTS:** Web Speech API (primary) → ElevenLabs (fallback)
**Student STT:** SpeechRecognition (primary) → MediaRecorder + Whisper (fallback)

- Chrome/Edge: full support
- Firefox: SpeechSynthesis TTS only, Whisper STT fallback
- iOS Safari: MediaRecorder STT fallback

## Video System

Four `source_type` paths — app works fully with just Supabase Storage:

| source_type | Requirements |
|-------------|-------------|
| `supabase` | Supabase Storage bucket "videos" |
| `mux` | `MUX_TOKEN_ID` + `MUX_TOKEN_SECRET` |
| `cloudflare` | `NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE` |
| `external_url` | Any public video URL |

Upload videos via: **Parent Dashboard → Upload Video**

## Project Structure

```
app/
  page.tsx              Landing page
  (auth)/               Login / Register
  onboarding/           Child profile setup
  (main)/
    dashboard/          Home screen
    lessons/            Browse + lesson detail
    lesson/[id]/play/   Activity player (full-screen)
    videos/             Video library
    achievements/       Badge collection
    profile/            Child profile + XP chart
    parent/             Parent dashboard + video upload
  api/
    teacher/            AI narrate / grade-speech / hint / celebrate
    tts/                ElevenLabs TTS
    transcribe/         Whisper STT

components/
  mascot/               Pip SVG + SpeechBubble
  lesson/               LessonCard, MicrophonePanel, LivesBar, XPCounter
  gamification/         XPBar, StreakCounter, BadgeCard, LevelUpModal
  video/                VideoPlayer, VideoCard, ChapterList
  voice/                VoiceTeacher, VoiceStudent wrappers
  ui/                   Button, Card, Badge, Modal, Input, Toast, ...

lib/
  aiTeacher.ts          3-tier engine
  fallbackTeacher.ts    Tier 2 rule-based engine
  supabase.ts           Browser client
  supabaseServer.ts     Server client (service role)

store/
  useAppStore.ts        Zustand (XP, lives, streak, child, AI tier)

supabase/
  schema.sql            Full DB schema + RLS + storage
  seed.sql              Subjects, lessons, activities, achievements
```

## Gamification

- XP per activity (full on first try, 50% on retry)
- 10 levels: Seedling → Champion
- 5 hearts, refill 1 every 4 hours
- Daily streak with flame counter
- 9 achievements with XP bonuses

## Subjects & Seed Data

| Subject | Age Groups | Lessons |
|---------|-----------|---------|
| Math | 0–5, 6–8 | Numbers 1-3, Big/Small, Shapes, Numbers 1-10 |
| English | 0–5, 6–8 | Vowels A+E, Vowels I/O/U, Sight Words |
| Science | 3–8, 6–8 | Animals, Plants, Weather |
| Social Studies | 6–8, 9–11 | Family, Community, Colours of the World |
