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
}

export interface AdminActivity {
  id: number
  lesson_id: number
  type: 'listen' | 'speak' | 'tap_answer' | 'type_answer' | 'drag_drop' | 'video'
  order_index: number
  content: Record<string, unknown>
  xp_value: number
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

export const adminApi = {
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
