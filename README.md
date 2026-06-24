# BrightMind

Gamified AI-powered educational platform for children aged 0–14.

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** + **Framer Motion**
- **Supabase** (Auth, PostgreSQL, Storage, Realtime)
- **Claude API** (claude-sonnet-4-6) — 3-tier AI teacher with local fallback
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
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=         # optional — app works without (uses Tier 2 fallback)
ELEVENLABS_API_KEY=        # optional TTS fallback
OPENAI_API_KEY=            # optional STT fallback (Whisper)
NEXT_PUBLIC_SHOW_AI_TIER=true
```

### 3. Set up Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Run `supabase/seed.sql` in the SQL Editor
4. Enable Realtime for the `child_profiles` table

### 4. Run dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## AI Teacher — 3-Tier System

| Tier | Engine | When Used |
|------|--------|-----------|
| 1 | Claude API (claude-sonnet-4-6) | `ANTHROPIC_API_KEY` set + responds < 4s |
| 2 | Local rule-based + Levenshtein grader | Claude unavailable or slow |
| 3 | Static strings | Tier 2 throws |

Set `NEXT_PUBLIC_SHOW_AI_TIER=true` to show a corner badge (AI / Local / Default) in dev.

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
