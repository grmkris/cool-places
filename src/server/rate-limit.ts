/**
 * Simple in-memory sliding-window rate limiter.
 * Good enough for single-region Vercel Fluid Compute where function
 * instances are reused across requests.
 */
export function createRateLimiter(opts: { windowMs: number; max: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>()

  // Lazy cleanup every 60s to avoid unbounded growth
  let lastCleanup = Date.now()
  function cleanup() {
    const now = Date.now()
    if (now - lastCleanup < 60_000) return
    lastCleanup = now
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key)
    }
  }

  return {
    check(key: string): { ok: boolean; retryAfterMs: number } {
      cleanup()
      const now = Date.now()
      const entry = hits.get(key)

      if (!entry || entry.resetAt <= now) {
        hits.set(key, { count: 1, resetAt: now + opts.windowMs })
        return { ok: true, retryAfterMs: 0 }
      }

      if (entry.count < opts.max) {
        entry.count++
        return { ok: true, retryAfterMs: 0 }
      }

      return { ok: false, retryAfterMs: entry.resetAt - now }
    },
  }
}
