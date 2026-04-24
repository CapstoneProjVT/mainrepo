export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '/api'

function formatApiError(payload: any): string {
  if (!payload) return 'Request failed'
  if (typeof payload === 'string') return payload

  const detail = payload.detail

  if (typeof detail === 'string') return detail

  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        const field = Array.isArray(d?.loc) ? d.loc[d.loc.length - 1] : undefined
        const msg = d?.msg ?? 'Invalid input'
        return field ? `${field}: ${msg}` : msg
      })
      .join('; ')
  }

  if (typeof payload.message === 'string') return payload.message
  return 'Request failed'
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(init?.headers || {}),
    },
    credentials: 'include',
    cache: 'no-store',
  })

  const text = await res.text()
  const contentType = res.headers.get('content-type') || ''
  const payload = contentType.includes('application/json') && text ? JSON.parse(text) : text

  if (!res.ok) {
	throw new ApiError(formatApiError(payload), res.status)
  }

  return payload as T
}

export const api = {
  getMe: () => request<{ id: number; email: string; is_admin: boolean }>('/me'),
  getProfile: () => request<any>('/me/profile'),
  updateProfile: (body: any) => request('/me/profile', { method: 'PUT', body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  signup: (body: { email: string; password: string }) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  listOpportunities: (query: string) => request<any[]>(`/opportunities${query}`),
  getOpportunity: (id: string) => request<any>(`/opportunities/${id}`),
  saveOpportunity: (id: number | string) => request(`/opportunities/${id}/save`, { method: 'POST' }),
  unsaveOpportunity: (id: number | string) => request(`/opportunities/${id}/unsave`, { method: 'POST' }),
  rateOpportunity: (id: number | string, rating: number) => request(`/opportunities/${id}/rate`, { method: 'POST', body: JSON.stringify({ rating }) }),
  trackerList: () => request<any[]>('/tracker/applications'),
  trackerCreate: (body: any) => request<any>('/tracker/applications', { method: 'POST', body: JSON.stringify(body) }),
  trackerPatchStage: (id: number, stage: string) => request<any>(`/tracker/applications/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ stage }) }),
  trackerPatch: (id: number, body: any) => request<any>(`/tracker/applications/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  trackerDelete: (id: number) => request(`/tracker/applications/${id}`, { method: 'DELETE' }),
  funnel: () => request<any>('/insights/funnel'),
  appsPerWeek: () => request<Array<{ week: string; count: number }>>('/insights/apps_per_week'),
  exportCsv: () => request<string>('/insights/export.csv'),
  krs: () => request<any>('/metrics/krs'),
  runSeed: () => request<any>('/admin/seed', { method: 'POST' }),
  importFile: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request<any>('/admin/import', { method: 'POST', body: formData })
  },
  scrapeUrl: (url: string) => request<any>('/admin/scrape', { method: 'POST', body: JSON.stringify({ url }) }),
  mlMatch: (id: number | string) => request<any>(`/opportunities/${id}/ml-match`),
  generateCoverLetter: (id: number | string) => request<any>(`/opportunities/${id}/cover-letter`),
  generateInterviewPrep: (id: number | string) => request<any>(`/opportunities/${id}/interview-prep`),
}
