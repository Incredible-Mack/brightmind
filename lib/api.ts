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
      if (params?.limit)      q.set('limit', String(params.limit))
      const qs = q.toString()
      return request<Lesson[]>(`api/lessons${qs ? '?' + qs : ''}`, {}, false)
    },
    get: (id: number) => request<Lesson>(`api/lessons?id=${id}`, {}, false),
  },

  // ── Activities ────────────────────────────────────────
  activities: {
    byLesson: (lessonId: number) =>
      request<Activity[]>(`api/activities?lesson_id=${lessonId}`, {}, false),
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
}

// ── Types ─────────────────────────────────────────────────────────────────
export interface User {
  id: number
  email: string
  name: string
  role: string
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
