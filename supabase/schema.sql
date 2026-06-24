-- =============================================
-- BrightMind Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── SUBJECTS ────────────────────────────────
CREATE TABLE IF NOT EXISTS subjects (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  icon        text NOT NULL DEFAULT 'book',
  color       text NOT NULL DEFAULT '#4ade80',
  description text NOT NULL DEFAULT ''
);

-- ─── LESSONS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS lessons (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id       uuid REFERENCES subjects(id) ON DELETE CASCADE,
  title            text NOT NULL,
  slug             text NOT NULL,
  description      text NOT NULL DEFAULT '',
  age_groups       text[] NOT NULL DEFAULT '{}',
  difficulty       text NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy','medium','hard')),
  xp_reward        int  NOT NULL DEFAULT 20,
  concepts_count   int  NOT NULL DEFAULT 0,
  activities_count int  NOT NULL DEFAULT 0,
  order_index      int  NOT NULL DEFAULT 0,
  thumbnail_url    text,
  created_at       timestamptz DEFAULT now()
);

-- ─── ACTIVITIES ──────────────────────────────
CREATE TABLE IF NOT EXISTS activities (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id       uuid REFERENCES lessons(id) ON DELETE CASCADE,
  type            text NOT NULL CHECK (type IN ('listen','speak','tap-answer','type-answer','video-watch','drag-drop')),
  order_index     int  NOT NULL DEFAULT 0,
  content         jsonb NOT NULL DEFAULT '{}',
  expected_answer text,
  xp_reward       int  NOT NULL DEFAULT 5
);

-- ─── CHILDREN ────────────────────────────────
CREATE TABLE IF NOT EXISTS children (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  age         int  NOT NULL DEFAULT 7,
  avatar_seed text NOT NULL DEFAULT 'default',
  created_at  timestamptz DEFAULT now()
);

-- ─── CHILD PROFILES ──────────────────────────
CREATE TABLE IF NOT EXISTS child_profiles (
  child_id    uuid PRIMARY KEY REFERENCES children(id) ON DELETE CASCADE,
  age_group   text NOT NULL DEFAULT '6-8',
  xp          int  NOT NULL DEFAULT 0,
  level       int  NOT NULL DEFAULT 0,
  streak      int  NOT NULL DEFAULT 0,
  last_active timestamptz DEFAULT now(),
  lives       int  NOT NULL DEFAULT 5,
  max_lives   int  NOT NULL DEFAULT 5
);

-- ─── LESSON PROGRESS ─────────────────────────
CREATE TABLE IF NOT EXISTS lesson_progress (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id     uuid REFERENCES children(id) ON DELETE CASCADE,
  lesson_id    uuid REFERENCES lessons(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed')),
  score        int  NOT NULL DEFAULT 0,
  completed_at timestamptz,
  xp_earned    int  NOT NULL DEFAULT 0,
  UNIQUE(child_id, lesson_id)
);

-- ─── ACTIVITY RESULTS ────────────────────────
CREATE TABLE IF NOT EXISTS activity_results (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id    uuid REFERENCES children(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  passed      boolean NOT NULL DEFAULT false,
  transcript  text,
  score       int  NOT NULL DEFAULT 0,
  attempts    int  NOT NULL DEFAULT 1,
  created_at  timestamptz DEFAULT now()
);

-- ─── VIDEOS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS videos (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id      uuid REFERENCES subjects(id) ON DELETE SET NULL,
  title           text NOT NULL,
  source_type     text NOT NULL DEFAULT 'supabase' CHECK (source_type IN ('mux','cloudflare','supabase','external_url')),
  mux_playback_id text,
  cf_video_id     text,
  storage_path    text,
  external_url    text,
  duration        int,
  thumbnail_url   text,
  age_groups      text[] NOT NULL DEFAULT '{}',
  chapter_markers jsonb  NOT NULL DEFAULT '[]',
  created_at      timestamptz DEFAULT now()
);

-- ─── ACHIEVEMENTS ────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug             text NOT NULL UNIQUE,
  title            text NOT NULL,
  description      text NOT NULL,
  icon             text NOT NULL DEFAULT 'trophy',
  xp_bonus         int  NOT NULL DEFAULT 25,
  unlock_condition jsonb NOT NULL DEFAULT '{}'
);

-- ─── CHILD ACHIEVEMENTS ──────────────────────
CREATE TABLE IF NOT EXISTS child_achievements (
  child_id       uuid REFERENCES children(id) ON DELETE CASCADE,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at    timestamptz DEFAULT now(),
  PRIMARY KEY (child_id, achievement_id)
);

-- ─── STREAKS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS streaks (
  child_id            uuid PRIMARY KEY REFERENCES children(id) ON DELETE CASCADE,
  current_streak      int  NOT NULL DEFAULT 0,
  longest_streak      int  NOT NULL DEFAULT 0,
  last_completed_date date
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE children         ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress  ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks           ENABLE ROW LEVEL SECURITY;

-- Parents see only their own children
CREATE POLICY "children_owner" ON children
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "child_profiles_owner" ON child_profiles
  FOR ALL USING (
    child_id IN (SELECT id FROM children WHERE user_id = auth.uid())
  );

CREATE POLICY "lesson_progress_owner" ON lesson_progress
  FOR ALL USING (
    child_id IN (SELECT id FROM children WHERE user_id = auth.uid())
  );

CREATE POLICY "activity_results_owner" ON activity_results
  FOR ALL USING (
    child_id IN (SELECT id FROM children WHERE user_id = auth.uid())
  );

CREATE POLICY "child_achievements_owner" ON child_achievements
  FOR ALL USING (
    child_id IN (SELECT id FROM children WHERE user_id = auth.uid())
  );

CREATE POLICY "streaks_owner" ON streaks
  FOR ALL USING (
    child_id IN (SELECT id FROM children WHERE user_id = auth.uid())
  );

-- Public read for curriculum content
CREATE POLICY "subjects_public_read"   ON subjects    FOR SELECT USING (true);
CREATE POLICY "lessons_public_read"    ON lessons     FOR SELECT USING (true);
CREATE POLICY "activities_public_read" ON activities  FOR SELECT USING (true);
CREATE POLICY "videos_public_read"     ON videos      FOR SELECT USING (true);
CREATE POLICY "achievements_public_read" ON achievements FOR SELECT USING (true);

-- =============================================
-- REALTIME
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE child_profiles;

-- =============================================
-- STORAGE BUCKET
-- =============================================
INSERT INTO storage.buckets (id, name, public)
  VALUES ('videos', 'videos', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "videos_auth_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos' AND auth.role() = 'authenticated');

CREATE POLICY "videos_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');
