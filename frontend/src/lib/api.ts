const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

const HEALTH_RETRY_DELAY_MS = 3_000

async function pingHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/health/`)
    return res.ok
  } catch {
    return false
  }
}

let healthCheck: Promise<boolean> | null = null

// At most two requests per page load: one on load, and one retry only if that
// fails. Memoized at module level so remounts (including StrictMode's dev
// double-mount) reuse the same result instead of calling the backend again.
export function checkHealth(): Promise<boolean> {
  healthCheck ??= pingHealth().then(
    (ok) => ok || new Promise((resolve) => setTimeout(() => resolve(pingHealth()), HEALTH_RETRY_DELAY_MS)),
  )
  return healthCheck
}
