const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export type Health = {
  api: 'ok' | 'error'
  redis: 'ok' | 'error'
}

export async function fetchHealth(): Promise<Health> {
  const res = await fetch(`${API_URL}/api/health/`)
  return res.json()
}

export function roomSocketUrl(code: string): string {
  const base = API_URL || window.location.origin
  return `${base.replace(/^http/, 'ws')}/ws/${code}`
}
