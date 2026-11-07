import { getToken } from './auth'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost/brightmind-api'

async function request<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (authenticated) {
    const token = getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
      headers['X-Api-Token'] = token  // fallback for servers that strip Authorization header
    }
  }

  // Append .php if the path has no extension (supports servers without mod_rewrite)
  const [pathname, qs] = path.split('?')
  const resolved = pathname.includes('.') ? pathname : `${pathname}.php`
  const url = `${BASE}/${resolved}${qs ? '?' + qs : ''}`
  const res = await fetch(url, { ...options, headers })
  const text = await res.text()
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    if (!res.ok) throw new Error(`Server error (${res.status})`)
    throw new Error('Unexpected response from server. Please check your connection.')
  }
  if (!res.ok) throw new Error((json as Record<string, string>).error ?? `Request failed: ${res.status}`)
  return json as T
}

// ── Auth ────────────────────────────────────────────────
export const api = {
  auth: {
    register: (email: string, password: string, name: string) =>
      request<{ token: string; user: User }>('auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      }, false),

    login: (email: string, password: string) =>
      request<{ token: string; user: User; child?: Child }>('auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }, false),

    me: () => request<{ user: User; child?: Child }>('auth/me'),
  },

  // ── Premium / payments ──
  billing: {
    plans: () => request<Plans>('api/plans', {}, !!getToken()),
    subscribe: (plan: string, gateway: 'espees' | 'kingspay') =>
      request<{ redirect_url: string }>('api/subscribe', { method: 'POST', body: JSON.stringify({ plan, gateway }) }),
    // verify=true re-checks payments still pending with the gateway (when the buyer did not come back through the redirect)
    status: (verify = false) => request<SubscriptionStatus>(`api/subscription${verify ? '?verify=1' : ''}`),
  },

  // ── Subjects ──────────────────────────────────────────
  subjects: {
    list: () => request<Subject[]>('api/subjects', {}, false),
  },

  // ── Lessons ───────────────────────────────────────────
  lessons: {
    list: (params?: { subject_id?: number; age_group?: string; limit?: number }) => {
      const q = new URLSearchParams()
      if (params?.subject_id) q.set('subject_id', String(params.subject_id))
      if (params?.age_group)  q.set('age_group', params.age_group)
      q.set('limit', String(params?.limit ?? 300))
      const qs = q.toString()
      return request<Lesson[]>(`api/lessons${qs ? '?' + qs : ''}`, {}, false)
    },
    get: (id: number) => request<Lesson>(`api/lessons?id=${id}`, {}, false),
  },

  // ── Activities ────────────────────────────────────────
  activities: {
    // With a child id the server may swap in an approved variant (needs the parent's token)
    byLesson: (lessonId: number, childId?: number) =>
      request<Activity[]>(`api/activities?lesson_id=${lessonId}${childId ? `&child_id=${childId}` : ''}`, {}, !!childId),
  },

  // ── Children ──────────────────────────────────────────
  children: {
    list: () => request<Child[]>('api/children'),
    create: (data: { name: string; age: number; age_group: string; avatar_seed?: string; learning_profile?: import('@/types/child').LearningProfile }) =>
      request<Child>('api/children', { method: 'POST', body: JSON.stringify(data) }),
  },

  // ── Profile ───────────────────────────────────────────
  profile: {
    get: (childId: number) => request<ChildProfile>(`api/profile?child_id=${childId}`),
    update: (childId: number, data: Partial<ChildProfile>) =>
      request<ChildProfile>(`api/profile?child_id=${childId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // ── Progress ──────────────────────────────────────────
  progress: {
    list: (childId: number) =>
      request<LessonProgress[]>(`api/progress?child_id=${childId}`),
    get: (childId: number, lessonId: number) =>
      request<LessonProgress>(`api/progress?child_id=${childId}&lesson_id=${lessonId}`),
    upsert: (data: {
      child_id: number
      lesson_id: number
      status: 'in_progress' | 'completed'
      score?: number
      xp_earned?: number
    }) => request<LessonProgress>('api/progress', { method: 'POST', body: JSON.stringify(data) }),
  },

  // ── Activity Results ──────────────────────────────────
  activityResults: {
    create: (data: {
      child_id: number
      lesson_id: number
      activity_id: number
      score: number
      passed: boolean
      attempts?: number
      time_seconds?: number
    }) =>
      request<{ id: number }>('api/activity_results', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // ── The personalised run of a lesson (server-side adaptive engine) ──
  lessonPlan: {
    get: (lessonId: number, childId: number) =>
      request<LessonPlan>(`api/lesson_plan?lesson_id=${lessonId}&child_id=${childId}`),
  },

  // ── Skill checkpoints (prove a skill is really known) ──
  checkpoint: {
    get: (skill: string, childId: number) =>
      request<CheckpointSet>(`api/checkpoint?skill=${encodeURIComponent(skill)}&child_id=${childId}`),
    submit: (childId: number, skill: string, answers: Array<{ activity_id: number; correct: boolean }>) =>
      request<CheckpointResult>('api/checkpoint', { method: 'POST', body: JSON.stringify({ child_id: childId, skill_slug: skill, answers }) }),
  },

  // ── The child's learning path (skills, unlocked or not, with mastery) ──
  path: {
    get: (childId: number) => request<LearningPath>(`api/path?child_id=${childId}`),
  },

  // ── Mastery + what to learn next (rule-based, no AI) ──
  recommend: {
    get: (childId: number) => request<Recommendation>(`api/recommend?child_id=${childId}`),
  },

  // ── Videos ────────────────────────────────────────────
  videos: {
    list: (params?: { age_group?: string; subject_id?: number }) => {
      const q = new URLSearchParams()
      if (params?.age_group)  q.set('age_group', params.age_group)
      if (params?.subject_id) q.set('subject_id', String(params.subject_id))
      const qs = q.toString()
      return request<Video[]>(`api/videos${qs ? '?' + qs : ''}`, {}, false)
    },
    get: (id: number) => request<Video>(`api/videos?id=${id}`, {}, false),
    // Counted in the admin view numbers; never blocks the page
    view: (videoId: number, childId?: number) =>
      request<{ ok: boolean }>('api/video_view', { method: 'POST', body: JSON.stringify({ video_id: videoId, child_id: childId }) }, !!childId).catch(() => null),
    upload: (formData: FormData) => {
      const token = getToken()
      return fetch(`${BASE}/api/upload.php`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}`, 'X-Api-Token': token } : {},
        body: formData,
      }).then(async (r) => {
        const text = await r.text()
        let j: Record<string, unknown>
        try { j = JSON.parse(text) } catch { throw new Error('Upload failed — unexpected server response') }
        if (!r.ok) throw new Error((j.error as string) ?? 'Upload failed')
        return j as unknown as Video
      })
    },
  },

  // ── Achievements ──────────────────────────────────────
  achievements: {
    list: (childId?: number) => {
      const qs = childId ? `?child_id=${childId}` : ''
      return request<Achievement[]>(`api/achievements${qs}`, {}, !!childId)
    },
  },

  // ── Hero & Showcase Configuration ─────────────────────
  hero: {
    get: () => request<HeroSettings>('hero', {}, false),
  },

  // ── Testimonials ──────────────────────────────────────
  testimonials: {
    get: () => request<{ visible: boolean; items: Testimonial[] }>('testimonials', {}, false),
  },

  // ── Wonder Facts ──────────────────────────────────────
  facts: {
    get: (subjectSlug?: string) =>
      request<{ visible: boolean; items: WonderFact[] }>(`facts${subjectSlug ? `?subject=${encodeURIComponent(subjectSlug)}` : ''}`, {}, false),
  },
}

// ── Types ─────────────────────────────────────────────────────────────────
export interface HeroSettings {
  hero_badge?: string
  hero_title?: string
  hero_subtitle?: string
  hero_image?: string
  hero_video?: string
  hero_cta_text?: string
  hero_trust_1?: string
  hero_trust_2?: string
  hero_trust_3?: string
  hero_sticker_title?: string
  hero_sticker_sub?: string
  hero_bg_color?: string
}

export interface Testimonial {
  id: number
  name: string
  role: string
  avatar: string
  avatar_bg: string
  quote: string
  rating: number
  order_index: number
  is_active: boolean
  created_at?: string
}

export interface WonderFact {
  id: number
  subject_slug: string
  badge: string
  title: string
  fact: string
  detail: string
  illustration: 'brain' | 'heart' | 'bones' | 'stardust' | 'dolphins' | 'books' | string
  accent_color: string
  bg_gradient: string
  border_color: string
  order_index: number
  is_active: boolean
  created_at?: string
}

export interface User {
  id: number
  email: string
  name: string
  role: string
  is_premium?: boolean
  premium_until?: string | null
}

export interface Child {
  id: number
  user_id: number
  name: string
  age: number
  avatar_seed: string
  xp?: number
  level?: number
  streak?: number
  lives?: number
  max_lives?: number
  age_group?: string
  learning_profile?: import('@/types/child').LearningProfile | null
}

export interface ChildProfile {
  child_id: number
  age_group: string
  xp: number
  level: number
  streak: number
  lives: number
  max_lives: number
  last_active?: string
}

export interface Subject {
  id: number
  slug: string
  name: string
  description: string
  icon: string
  color: string
}

export interface Lesson {
  id: number
  subject_id: number
  slug: string
  title: string
  description: string
  age_groups: string[]
  order_index: number
  xp_reward: number
  difficulty: 'easy' | 'medium' | 'hard'
  subject_name?: string
  subject_icon?: string
}

export interface Activity {
  id: number
  lesson_id: number
  type: 'tap_answer' | 'listen' | 'speak' | 'type_answer' | 'drag_drop' | 'video'
  order_index: number
  content: Record<string, unknown>
  xp_value: number
}

export interface LessonProgress {
  id: number
  child_id: number
  lesson_id: number
  status: 'not_started' | 'in_progress' | 'completed'
  score: number
  xp_earned: number
  completed_at?: string
  /** Present on a "completed" save: the child's updated numbers and any badges just unlocked */
  profile?: ChildProfile | null
  new_achievements?: Array<{ slug: string; title: string; icon: string; xp_bonus: number }>
}

export interface Plans {
  plans: Array<{ id: 'monthly' | 'yearly'; name: string; days: number; espees: number; ngn: number }>
  rate: number
  gateways: { espees: boolean; kingspay: boolean }
  free_hearts: number
  premium: boolean
  premium_until: string | null
}

export interface SubscriptionStatus {
  premium: boolean
  premium_until: string | null
  history: Array<{ plan: string; gateway: string; amount: number; currency: string; status: string; starts_at: string | null; expires_at: string | null; created_at: string; note: string | null }>
}

export type PlanReason = 'new' | 'continue' | 'review' | 'retry' | 'challenge' | 'checkpoint'

export interface LessonPlan {
  items: Activity[]
  reserve: Activity[]
  reason: PlanReason
  target_tier: number
  mastery?: number
  skill_slug?: string
  adaptive: boolean
}

export interface CheckpointSet {
  skill: { slug: string; name: string }
  items: Activity[]
  pass_mark: number
  already_passed: boolean
  best: number
}

export interface CheckpointResult {
  passed: boolean; correct: number; total: number; percent: number; pass_mark: number
  best: number; bonus_xp: number; missed: number[]; status: string; profile: ChildProfile | null
}

export type SkillState = 'locked' | 'available' | 'learning' | 'practicing' | 'mastered'

export interface LearningPath {
  child_id: number
  subjects: Array<{
    slug: string
    name: string
    skills: Array<{
      slug: string; name: string; strand: string; age_group: string
      state: SkillState; mastery: number | null; review_due: boolean; prerequisites: string[]
      /** 'ready' = practised enough to take the checkpoint, 'passed' = verified */
      checkpoint?: 'not_yet' | 'ready' | 'passed'; checkpoint_best?: number
      lessons: Array<{ id: number; title: string; level: number; status: 'not_started' | 'in_progress' | 'completed'; score: number | null }>
    }>
  }>
}

export interface Recommendation {
  child_id: number
  mastery: Array<{ subject_id: number; subject_name: string; slug: string; completed: number; total: number; avg_score: number | null; level: 'new' | 'weak' | 'ok' | 'strong' }>
  recommended: Array<{ lesson_id: number; title: string; subject_name: string; subject_slug: string; reason: PlanReason | 'resume' | 'next'; message: string; skill_slug?: string }>
  weak: string[]
  strong: string[]
  /** Skill-level numbers from the adaptive engine (null until the curriculum is loaded) */
  engine?: { skills_started: number; skills_mastered: number; skills_total: number; weak_skills: string[]; due_reviews: string[]; active_days_14: number; ready_for_checkpoint: string[] } | null
  summary: import('./coachTemplates').CoachSummary
}

export interface Video {
  id: number
  title: string
  description: string
  source_type: 'local' | 'mux' | 'cloudflare' | 'external_url'
  video_url: string
  thumbnail_url?: string
  duration?: number
  subject_id?: number
  age_groups: string[]
  chapter_markers?: Array<{ time: number; label: string }>
}

export interface Achievement {
  id: number
  slug: string
  title: string
  description: string
  icon: string
  xp_bonus: number
  unlock_condition?: Record<string, unknown>
  unlocked?: boolean
  unlocked_at?: string
}
