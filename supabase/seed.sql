-- =============================================
-- BrightMind Seed Data
-- Run AFTER schema.sql
-- =============================================

-- ─── SUBJECTS ────────────────────────────────
INSERT INTO subjects (id, name, slug, icon, color, description) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Math',          'math',          'calculator', '#3b82f6', 'Numbers, shapes, and logic'),
  ('10000000-0000-0000-0000-000000000002', 'English',       'english',       'book-open',  '#a855f7', 'Reading, writing, and vocabulary'),
  ('10000000-0000-0000-0000-000000000003', 'Science',       'science',       'flask',      '#14b8a6', 'Animals, plants, and the world'),
  ('10000000-0000-0000-0000-000000000004', 'Social Studies','social-studies','globe',      '#f97316', 'Community, culture, and geography')
ON CONFLICT DO NOTHING;

-- ─── MATH LESSONS ────────────────────────────
INSERT INTO lessons (id, subject_id, title, slug, description, age_groups, difficulty, xp_reward, concepts_count, activities_count, order_index) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   'Numbers 1, 2, 3', 'numbers-1-2-3',
   'Learn to recognize and say the numbers one, two, and three!',
   ARRAY['0-5'], 'easy', 30, 3, 9, 1),

  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001',
   'Big and Small', 'big-and-small',
   'Discover the difference between big things and small things.',
   ARRAY['0-5'], 'easy', 25, 2, 6, 2),

  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001',
   'Shapes: Circle, Square, Triangle', 'basic-shapes',
   'Identify circles, squares, and triangles all around you!',
   ARRAY['0-5'], 'easy', 30, 3, 9, 3),

  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001',
   'Numbers 1–10', 'numbers-1-to-10',
   'Count all the way to ten! You can do it!',
   ARRAY['0-5','6-8'], 'easy', 40, 5, 12, 4)
ON CONFLICT DO NOTHING;

-- ─── ENGLISH LESSONS ─────────────────────────
INSERT INTO lessons (id, subject_id, title, slug, description, age_groups, difficulty, xp_reward, concepts_count, activities_count, order_index) VALUES
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002',
   'Vowels A and E', 'vowels-a-and-e',
   'Say hello to the vowels A and E — they are everywhere!',
   ARRAY['0-5'], 'easy', 30, 2, 6, 1),

  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002',
   'Vowels I, O and U', 'vowels-i-o-u',
   'Complete your vowel family — learn I, O, and U!',
   ARRAY['0-5'], 'easy', 30, 3, 9, 2),

  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002',
   'Sight Words Set 1', 'sight-words-1',
   'Read the most common words: the, a, is, it.',
   ARRAY['0-5','6-8'], 'easy', 35, 4, 12, 3)
ON CONFLICT DO NOTHING;

-- ─── SCIENCE LESSONS ─────────────────────────
INSERT INTO lessons (id, subject_id, title, slug, description, age_groups, difficulty, xp_reward, concepts_count, activities_count, order_index) VALUES
  ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000003',
   'Animals and Their Sounds', 'animals-sounds',
   'What do the dog, cat, and cow say? Let''s find out!',
   ARRAY['0-5','6-8'], 'easy', 30, 4, 8, 1),

  ('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000003',
   'Plants and Sunlight', 'plants-sunlight',
   'How do plants grow? The sun is their best friend!',
   ARRAY['3-8','6-8'], 'easy', 35, 3, 6, 2),

  ('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000003',
   'Weather and Seasons', 'weather-seasons',
   'Sunny, rainy, snowy — explore all kinds of weather!',
   ARRAY['6-8'], 'medium', 40, 4, 8, 3)
ON CONFLICT DO NOTHING;

-- ─── SOCIAL STUDIES LESSONS ──────────────────
INSERT INTO lessons (id, subject_id, title, slug, description, age_groups, difficulty, xp_reward, concepts_count, activities_count, order_index) VALUES
  ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000004',
   'My Family', 'my-family',
   'Mom, Dad, sister, brother — let''s learn family words!',
   ARRAY['0-5','6-8'], 'easy', 25, 3, 6, 1),

  ('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000004',
   'My Community', 'my-community',
   'Schools, parks, shops — discover the places around you!',
   ARRAY['6-8'], 'easy', 30, 4, 8, 2),

  ('20000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000004',
   'Colours of the World', 'colours-of-world',
   'People and cultures come in beautiful variety!',
   ARRAY['6-8','9-11'], 'medium', 35, 3, 6, 3)
ON CONFLICT DO NOTHING;

-- ─── ACTIVITIES: Numbers 1,2,3 ───────────────
INSERT INTO activities (lesson_id, type, order_index, content, expected_answer, xp_reward) VALUES
  -- listen x3
  ('20000000-0000-0000-0000-000000000001', 'listen', 1, '{"text":"1","visual":"one"}', '1', 3),
  ('20000000-0000-0000-0000-000000000001', 'listen', 2, '{"text":"2","visual":"two"}', '2', 3),
  ('20000000-0000-0000-0000-000000000001', 'listen', 3, '{"text":"3","visual":"three"}', '3', 3),
  -- speak x3
  ('20000000-0000-0000-0000-000000000001', 'speak', 4, '{"prompt":"1","expected":"one"}', 'one', 4),
  ('20000000-0000-0000-0000-000000000001', 'speak', 5, '{"prompt":"2","expected":"two"}', 'two', 4),
  ('20000000-0000-0000-0000-000000000001', 'speak', 6, '{"prompt":"3","expected":"three"}', 'three', 4),
  -- tap-answer x3
  ('20000000-0000-0000-0000-000000000001', 'tap-answer', 7,
   '{"question":"Which number is TWO?","options":[{"id":"a","text":"1","correct":false},{"id":"b","text":"2","correct":true},{"id":"c","text":"3","correct":false},{"id":"d","text":"4","correct":false}]}',
   '2', 5),
  ('20000000-0000-0000-0000-000000000001', 'tap-answer', 8,
   '{"question":"Which number is ONE?","options":[{"id":"a","text":"2","correct":false},{"id":"b","text":"3","correct":false},{"id":"c","text":"1","correct":true},{"id":"d","text":"4","correct":false}]}',
   '1', 5),
  ('20000000-0000-0000-0000-000000000001', 'tap-answer', 9,
   '{"question":"Which number is THREE?","options":[{"id":"a","text":"1","correct":false},{"id":"b","text":"3","correct":true},{"id":"c","text":"2","correct":false},{"id":"d","text":"5","correct":false}]}',
   '3', 5)
ON CONFLICT DO NOTHING;

-- ─── ACTIVITIES: Vowels A and E ──────────────
INSERT INTO activities (lesson_id, type, order_index, content, expected_answer, xp_reward) VALUES
  ('20000000-0000-0000-0000-000000000005', 'listen', 1, '{"text":"A","visual":"apple"}', 'A', 3),
  ('20000000-0000-0000-0000-000000000005', 'listen', 2, '{"text":"E","visual":"elephant"}', 'E', 3),
  ('20000000-0000-0000-0000-000000000005', 'speak', 3, '{"prompt":"A","expected":"a"}', 'a', 4),
  ('20000000-0000-0000-0000-000000000005', 'speak', 4, '{"prompt":"E","expected":"e"}', 'e', 4),
  ('20000000-0000-0000-0000-000000000005', 'tap-answer', 5,
   '{"question":"Which is the vowel A?","options":[{"id":"a","text":"A","correct":true},{"id":"b","text":"B","correct":false},{"id":"c","text":"C","correct":false},{"id":"d","text":"D","correct":false}]}',
   'A', 5),
  ('20000000-0000-0000-0000-000000000005', 'tap-answer', 6,
   '{"question":"Which is the vowel E?","options":[{"id":"a","text":"F","correct":false},{"id":"b","text":"G","correct":false},{"id":"c","text":"E","correct":true},{"id":"d","text":"H","correct":false}]}',
   'E', 5)
ON CONFLICT DO NOTHING;

-- ─── ACTIVITIES: Animals and Sounds ──────────
INSERT INTO activities (lesson_id, type, order_index, content, expected_answer, xp_reward) VALUES
  ('20000000-0000-0000-0000-000000000008', 'listen', 1, '{"text":"Woof!","visual":"dog"}', 'woof', 3),
  ('20000000-0000-0000-0000-000000000008', 'listen', 2, '{"text":"Meow!","visual":"cat"}', 'meow', 3),
  ('20000000-0000-0000-0000-000000000008', 'speak', 3, '{"prompt":"Dog","expected":"woof"}', 'woof', 4),
  ('20000000-0000-0000-0000-000000000008', 'speak', 4, '{"prompt":"Cat","expected":"meow"}', 'meow', 4),
  ('20000000-0000-0000-0000-000000000008', 'tap-answer', 5,
   '{"question":"What sound does a dog make?","options":[{"id":"a","text":"Meow","correct":false},{"id":"b","text":"Moo","correct":false},{"id":"c","text":"Woof","correct":true},{"id":"d","text":"Oink","correct":false}]}',
   'woof', 5),
  ('20000000-0000-0000-0000-000000000008', 'tap-answer', 6,
   '{"question":"What sound does a cat make?","options":[{"id":"a","text":"Woof","correct":false},{"id":"b","text":"Meow","correct":true},{"id":"c","text":"Cluck","correct":false},{"id":"d","text":"Hiss","correct":false}]}',
   'meow', 5),
  ('20000000-0000-0000-0000-000000000008', 'tap-answer', 7,
   '{"question":"Which animal says MOO?","options":[{"id":"a","text":"Horse","correct":false},{"id":"b","text":"Pig","correct":false},{"id":"c","text":"Cow","correct":true},{"id":"d","text":"Duck","correct":false}]}',
   'cow', 5),
  ('20000000-0000-0000-0000-000000000008', 'tap-answer', 8,
   '{"question":"Which animal FLIES?","options":[{"id":"a","text":"Fish","correct":false},{"id":"b","text":"Dog","correct":false},{"id":"c","text":"Snake","correct":false},{"id":"d","text":"Bird","correct":true}]}',
   'bird', 5)
ON CONFLICT DO NOTHING;

-- ─── ACTIVITIES: Sight Words ─────────────────
INSERT INTO activities (lesson_id, type, order_index, content, expected_answer, xp_reward) VALUES
  ('20000000-0000-0000-0000-000000000007', 'listen', 1, '{"text":"the","visual":"the"}', 'the', 3),
  ('20000000-0000-0000-0000-000000000007', 'listen', 2, '{"text":"a","visual":"a"}', 'a', 3),
  ('20000000-0000-0000-0000-000000000007', 'listen', 3, '{"text":"is","visual":"is"}', 'is', 3),
  ('20000000-0000-0000-0000-000000000007', 'listen', 4, '{"text":"it","visual":"it"}', 'it', 3),
  ('20000000-0000-0000-0000-000000000007', 'speak', 5, '{"prompt":"the","expected":"the"}', 'the', 4),
  ('20000000-0000-0000-0000-000000000007', 'speak', 6, '{"prompt":"is","expected":"is"}', 'is', 4),
  ('20000000-0000-0000-0000-000000000007', 'tap-answer', 7,
   '{"question":"Which word means the same as ''a single thing''?","options":[{"id":"a","text":"the","correct":false},{"id":"b","text":"it","correct":true},{"id":"c","text":"is","correct":false},{"id":"d","text":"and","correct":false}]}',
   'it', 5),
  ('20000000-0000-0000-0000-000000000007', 'tap-answer', 8,
   '{"question":"Which is a sight word?","options":[{"id":"a","text":"elephant","correct":false},{"id":"b","text":"the","correct":true},{"id":"c","text":"jumping","correct":false},{"id":"d","text":"purple","correct":false}]}',
   'the', 5)
ON CONFLICT DO NOTHING;

-- ─── ACHIEVEMENTS ────────────────────────────
INSERT INTO achievements (slug, title, description, icon, xp_bonus, unlock_condition) VALUES
  ('first-step',    'First Step',     'Complete your first lesson',          'star',   25,  '{"lessons_completed":1}'),
  ('voice-star',    'Voice Star',     'Speak 10 activities correctly',       'mic',    50,  '{"speak_correct":10}'),
  ('streak-3',      '3-Day Streak',   'Learn 3 days in a row',               'flame',  30,  '{"streak":3}'),
  ('streak-7',      '7-Day Streak',   'Learn 7 days in a row',               'flame',  75,  '{"streak":7}'),
  ('streak-30',     '30-Day Streak',  'Learn 30 days in a row',              'trophy', 300, '{"streak":30}'),
  ('math-wizard',   'Math Wizard',    'Complete all math lessons',           'zap',    100, '{"subject":"math","all":true}'),
  ('perfect',       'Perfect Lesson', 'Complete a lesson 100% on first try', 'check',  50,  '{"first_try_perfect":true}'),
  ('speed-learner', 'Speed Learner',  'Complete 3 lessons in one day',       'zap',    60,  '{"lessons_today":3}'),
  ('bookworm',      'Bookworm',       'Complete 10 lessons total',           'book',   80,  '{"lessons_completed":10}')
ON CONFLICT (slug) DO NOTHING;
