import { getToken } from './auth'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost/brightmind-api'

async function adminRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
    headers['X-Api-Token'] = token
  }
  const [file, queryString] = path.split('?')
  const url = `${BASE}/admin/${file}.php${queryString ? '?' + queryString : ''}`
  const res  = await fetch(url, { ...options, headers })
  const text = await res.text()
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    if (!res.ok) throw new Error(`Server error (${res.status}) — check NEXT_PUBLIC_API_URL`)
    throw new Error('Unexpected response from server. Please check your connection.')
  }
  if (!res.ok) throw new Error((json as Record<string, string>).error ?? `Request failed: ${res.status}`)
  return json as T
}

function qs(params: Record<string, string | number | undefined>) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined) p.set(k, String(v))
  const s = p.toString()
  return s ? `?${s}` : ''
}

export interface AdminLesson {
  id: number
  subject_id: number
  slug: string
  title: string
  description: string
  age_groups: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  xp_reward: number
  order_index: number
  subject_name?: string
  subject_slug?: string
  subject_color?: string
  activity_count?: number
  skill_slug?: string | null
  level?: number
}

export interface AdminActivity {
  id: number
  lesson_id: number
  type: 'listen' | 'speak' | 'tap_answer' | 'type_answer' | 'drag_drop' | 'video'
  order_index: number
  content: Record<string, unknown>
  xp_value: number
  /** 1 easy, 2 core, 3 challenge: the adaptive engine uses it to pick questions */
  tier?: number
  role?: 'teach' | 'check' | 'practice' | 'speak' | 'review' | 'retired'
  skill_slug?: string | null
}

export interface AdminSubject {
  id: number
  slug: string
  name: string
  description: string
  icon: string
  color: string
}

export interface AdminStats {
  lessons: number
  activities: number
  students: number
  subjects: number
  sessions: number
  avg_score: number
  pass_rate: number
  activities_by_type: Record<string, number>
  recent_lessons: AdminLesson[]
  students_by_age: Record<string, number>
}

// ── Monitoring ───────────────────────────────────────────────────────────────
export interface AdminMonitor {
  kpis: {
    parents: number; admins: number; children: number; signups_7d: number
    active_today: number; active_7d: number; active_30d: number
    answers_today: number; answers_7d: number
    lessons_completed_7d: number; lessons_completed_total: number
    videos: number; video_views_7d: number
    avg_score_7d: number | null; pass_rate_7d: number | null
  }
  daily: Array<{ date: string; answers: number; active_children: number; lessons_completed: number }>
  by_age: Array<{ age_group: string; children: number; active_7d: number; avg_score: number | null }>
  by_subject: Array<{ slug: string; name: string; answers: number; pass_rate: number | null }>
  hardest: Array<{ id: number; type: string; tier: number; lesson_id: number; lesson_title: string; attempts: number; pass_rate: number; question: string | null }>
  weak_skills: Array<{ skill_slug: string; name: string; children: number; avg_mastery: number }>
  events: Array<{ kind: 'answer' | 'lesson' | 'signup'; at: string; child: string; text: string; score: number | null }>
  ai: { calls_today: number; calls_7d: number; tokens_7d: number; by_kind: Array<{ kind: string; calls: number }>; drafts_waiting: number }
  audit: Array<{ created_at: string; admin: string | null; action: string; target: string }>
}

export interface AdminUser { id: number; email: string; name: string | null; role: 'parent' | 'admin'; created_at: string; children: number; last_activity: string | null }
export interface AdminUserDetail {
  id: number; email: string; name: string | null; role: 'parent' | 'admin'; created_at: string
  children: Array<{ id: number; name: string; age: number; age_group: string | null; xp: number | null; level: number | null; streak: number | null; last_active: string | null; lessons_completed: number }>
}
export interface AdminChildDetail {
  id: number; user_id: number; name: string; age: number; parent_email: string; created_at: string
  age_group: string | null; xp: number | null; level: number | null; streak: number | null; lives: number | null; max_lives: number | null; last_active: string | null
  learning_profile: Record<string, unknown> | null
  lessons: Array<{ lesson_id: number; title: string; status: string; score: number; xp_earned: number; completed_at: string | null }>
  recent: Array<{ created_at: string; lesson: string; type: string; score: number; passed: number; attempts: number; time_seconds: number }>
  skills: Array<{ skill_slug: string; name: string | null; mastery: number; status: string; attempts: number; correct: number; next_review_at: string | null; last_seen: string | null; checkpoint_passed_at: string | null; checkpoint_best: number }>
  checkpoints: Array<{ skill_slug: string; name: string | null; correct: number; total: number; passed: number; created_at: string }>
  totals: { answers: number; avg_score: number; seconds: number; days_active: number }
}

export interface AdminVideo {
  id: number; title: string; description: string | null; video_url: string; thumbnail_url: string | null
  duration: number | null; subject_id: number | null; subject_name: string | null; subject_slug: string | null
  age_groups: string[]; published: boolean; uploader_email: string | null; views: number; views_7d: number; created_at: string
}

export interface AdminBadge {
  id: number; slug: string; title: string; description: string | null; icon: string | null; xp_bonus: number
  unlock_condition: { type: string; count?: number; days?: number; amount?: number }; earned: number
}

export interface AdminSkill {
  slug: string; name: string; age_group: string; strand: string; subject_slug: string; subject_name: string
  lessons: number; teach: number; practice: number; t1: number; t2: number; t3: number; learners: number; mastered: number; issues: string[]
}
export interface AdminSkillCoverage {
  matrix: Array<{ subject_slug: string; subject_name: string; age_group: string; skills: number; lessons: number; practice: number }>
  skills: AdminSkill[]
  problems: Array<{ skill: string; slug: string; issue: string }>
  untagged_lessons: Array<{ id: number; title: string }>
}

// ── Course review ────────────────────────────────────────────────────────────
export type ReviewState = 'reviewed' | 'changed' | 'unreviewed'
export interface CourseLesson {
  id: number; title: string; level: number; difficulty: string
  counts: { teach: number; check: number; speak: number; t1: number; t2: number; t3: number; total: number }
  review_state: ReviewState; reviewed_at: string | null; reviewer: string | null
  answers: number; pass_rate: number | null
}
export interface CourseSkill {
  slug: string; name: string; age_group: string; strand: string; subject_slug: string; subject_name: string
  prerequisites: string[]; learners: number; verified: number
  checkpoint_attempts: number; checkpoint_pass_rate: number | null
  lessons: CourseLesson[]
}
export interface CourseTree { skills: CourseSkill[]; totals: { lessons: number; reviewed: number; changed: number; unreviewed: number } }
export interface CourseActivity {
  id: number; type: string; role: string; tier: number; order_index: number; xp_value: number; code: string | null
  content: Record<string, unknown>; attempts: number; pass_rate: number | null
}
export interface CourseLessonDetail {
  lesson: { id: number; title: string; description: string | null; skill_slug: string | null; skill_name: string | null; subject_name: string; age_groups: string[]; difficulty: string; level: number; review_state: ReviewState; reviewed_at: string | null; reviewer: string | null }
  activities: CourseActivity[]
}

// ── Billing ──────────────────────────────────────────────────────────────────
export interface AdminBilling {
  settings: Record<string, number>
  gateways: { espees: boolean; kingspay: boolean }
  totals: { premium_accounts: number; parents: number; pending: number }
  revenue: Array<{ currency: string; total: string | number; payments: number }>
  subscriptions: Array<{ id: number; email: string; plan: string; gateway: string; amount: number; currency: string; status: string; active: boolean; expires_at: string | null; created_at: string; note: string | null }>
}

// ── Image library ────────────────────────────────────────────────────────────
export interface AdminMedia {
  id: number; url: string; original_name: string; mime: string; size: number; width: number; height: number; alt: string
  created_at: string; uploader: string | null
  used_by: Array<{ activity_id: number; lesson_id: number; lesson_title: string }>
}

export interface AdminVariant {
  id: number
  lesson_id: number
  lesson_title?: string
  status: 'draft' | 'approved' | 'rejected'
  activities: Array<{ order_index: number; type: string; xp_value?: number; content: Record<string, unknown> }>
  model?: string
  created_at: string
}

export const adminApi = {
  monitor: {
    get: (days = 14) => adminRequest<AdminMonitor>(`monitor${qs({ days })}`),
  },

  users: {
    list: (params?: { search?: string; role?: string; page?: number }) =>
      adminRequest<{ items: AdminUser[]; total: number; page: number; per_page: number }>(`users${qs(params ?? {})}`),
    get: (id: number) => adminRequest<AdminUserDetail>(`users${qs({ id })}`),
    setRole: (id: number, role: 'parent' | 'admin') =>
      adminRequest<{ id: number; role: string }>(`users${qs({ id })}`, { method: 'PUT', body: JSON.stringify({ role }) }),
    remove: (id: number) => adminRequest<{ deleted: boolean }>(`users${qs({ id })}`, { method: 'DELETE' }),
    child: (childId: number) => adminRequest<AdminChildDetail>(`users${qs({ child_id: childId })}`),
    childAction: (childId: number, action: 'reset_progress' | 'reset_skills' | 'refill_lives') =>
      adminRequest<{ ok: boolean }>(`users${qs({ child_id: childId })}`, { method: 'POST', body: JSON.stringify({ action }) }),
    removeChild: (childId: number) => adminRequest<{ deleted: boolean }>(`users${qs({ child_id: childId })}`, { method: 'DELETE' }),
  },

  videos: {
    list: (params?: { subject_id?: number; age_group?: string; search?: string; status?: string }) =>
      adminRequest<AdminVideo[]>(`videos${qs(params ?? {})}`),
    update: (id: number, data: Partial<Pick<AdminVideo, 'title' | 'description' | 'subject_id' | 'age_groups' | 'published'>>) =>
      adminRequest<{ updated: boolean }>(`videos${qs({ id })}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: number) => adminRequest<{ deleted: boolean }>(`videos${qs({ id })}`, { method: 'DELETE' }),
    // Multipart upload with progress (fetch cannot report upload progress)
    upload: (form: FormData, onProgress?: (pct: number) => void) =>
      new Promise<{ id: number; video_url: string; thumbnail_url: string | null }>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${BASE}/admin/video_upload.php`)
        const token = getToken()
        if (token) { xhr.setRequestHeader('Authorization', `Bearer ${token}`); xhr.setRequestHeader('X-Api-Token', token) }
        xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100)) }
        xhr.onload = () => {
          let json: Record<string, unknown> = {}
          try { json = JSON.parse(xhr.responseText) } catch { /* handled below */ }
          if (xhr.status >= 200 && xhr.status < 300) resolve(json as never)
          else reject(new Error((json.error as string) ?? `Upload failed (${xhr.status})`))
        }
        xhr.onerror = () => reject(new Error('Upload failed. Check your connection and the server upload limits.'))
        xhr.send(form)
      }),
  },

  badges: {
    list: () => adminRequest<AdminBadge[]>('achievements'),
    create: (data: Partial<AdminBadge> & { slug: string; title: string }) =>
      adminRequest<{ id: number }>('achievements', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<AdminBadge>) =>
      adminRequest<{ updated: boolean }>(`achievements${qs({ id })}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: number) => adminRequest<{ deleted: boolean }>(`achievements${qs({ id })}`, { method: 'DELETE' }),
  },

  skills: {
    coverage: () => adminRequest<AdminSkillCoverage>('skills'),
  },

  images: {
    list: () => adminRequest<AdminMedia[]>('images'),
    upload: async (file: File, alt = '') => {
      const token = getToken()
      const fd = new FormData()
      fd.append('image', file)
      if (alt) fd.append('alt', alt)
      const res = await fetch(`${BASE}/admin/images.php`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}`, 'X-Api-Token': token } : {},
        body: fd,
      })
      const json = await res.json().catch(() => ({} as Record<string, unknown>))
      if (!res.ok) throw new Error((json.error as string) ?? 'Upload failed')
      return json as { id: number; url: string; width: number; height: number; size: number }
    },
    // force=true also takes the picture off every activity that still uses it
    remove: (id: number, force = false) =>
      adminRequest<{ deleted: boolean }>(`images${qs({ id, force: force ? 1 : undefined })}`, { method: 'DELETE' }),
  },

  billing: {
    get: () => adminRequest<AdminBilling>('billing'),
    saveSettings: (settings: Record<string, number>) =>
      adminRequest<{ updated: boolean }>('billing', { method: 'PUT', body: JSON.stringify(settings) }),
    grant: (email: string, days: number, note: string) =>
      adminRequest<{ premium_until: string }>('billing', { method: 'POST', body: JSON.stringify({ action: 'grant', email, days, note }) }),
    revoke: (id: number) =>
      adminRequest<{ revoked: boolean }>('billing', { method: 'POST', body: JSON.stringify({ action: 'revoke', id }) }),
  },

  curriculum: {
    tree: () => adminRequest<CourseTree>('curriculum'),
    lesson: (id: number) => adminRequest<CourseLessonDetail>(`curriculum${qs({ lesson_id: id })}`),
    review: (target: { lessonId?: number; skill?: string }, reviewed: boolean) =>
      adminRequest<{ updated: number }>(`curriculum${qs({ lesson_id: target.lessonId, skill: target.skill })}`, { method: 'PUT', body: JSON.stringify({ reviewed }) }),
  },

  variants: {
    list: (params?: { lesson_id?: number; status?: string }) =>
      adminRequest<AdminVariant[]>(`variants${qs(params ?? {})}`),
    setStatus: (id: number, status: AdminVariant['status']) =>
      adminRequest<{ id: number; status: string }>(`variants${qs({ id })}`, { method: 'PUT', body: JSON.stringify({ status }) }),
    delete: (id: number) =>
      adminRequest<{ deleted: boolean }>(`variants${qs({ id })}`, { method: 'DELETE' }),
    // AI-written draft (server route validates it and stores it as a draft)
    generate: async (lessonId: number) => {
      const token = getToken()
      const res = await fetch('/api/admin/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}`, 'X-Api-Token': token } : {}) },
        body: JSON.stringify({ lessonId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Could not generate a variant')
      return json as { id: number; status: string }
    },
  },

  stats: {
    get: () => adminRequest<AdminStats>('stats'),
  },

  subjects: {
    list: () => adminRequest<AdminSubject[]>('subjects'),
    create: (data: Partial<AdminSubject>) =>
      adminRequest<{ id: number }>('subjects', { method: 'POST', body: JSON.stringify(data) }),
  },

  lessons: {
    list: (params?: { subject_id?: number; search?: string }) =>
      adminRequest<AdminLesson[]>(`lessons${qs(params ?? {})}`),
    get: (id: number) => adminRequest<AdminLesson>(`lessons${qs({ id })}`),
    create: (data: Partial<AdminLesson>) =>
      adminRequest<{ id: number }>('lessons', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<AdminLesson>) =>
      adminRequest<{ message: string }>(`lessons${qs({ id })}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) =>
      adminRequest<{ message: string }>(`lessons${qs({ id })}`, { method: 'DELETE' }),
  },

  activities: {
    list: (lessonId: number) =>
      adminRequest<AdminActivity[]>(`activities${qs({ lesson_id: lessonId })}`),
    create: (data: Partial<AdminActivity>) =>
      adminRequest<{ id: number }>('activities', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<AdminActivity>) =>
      adminRequest<{ message: string }>(`activities${qs({ id })}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) =>
      adminRequest<{ message: string }>(`activities${qs({ id })}`, { method: 'DELETE' }),
  },
}
