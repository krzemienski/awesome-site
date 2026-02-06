/**
 * In-memory sliding window rate limiter.
 * Works in both edge runtime (middleware.ts) and Node.js runtime (route handlers).
 *
 * Uses a Map<string, SlidingWindowEntry[]> where each entry tracks
 * a request timestamp within the current window.
 */

interface SlidingWindowEntry {
  readonly timestamp: number
}

interface RateLimitResult {
  readonly allowed: boolean
  readonly remaining: number
  readonly limit: number
  readonly resetAt: number
}

const store = new Map<string, SlidingWindowEntry[]>()

/**
 * Periodic cleanup interval (5 minutes).
 * Removes expired entries to prevent memory leaks.
 */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000

let lastCleanup = Date.now()

function cleanupExpiredEntries(windowMs: number): void {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now

  const cutoff = now - windowMs
  for (const [key, entries] of store) {
    const valid = entries.filter((e) => e.timestamp > cutoff)
    if (valid.length === 0) {
      store.delete(key)
    } else {
      store.set(key, valid)
    }
  }
}

/**
 * Check and record a request against the rate limit.
 *
 * @param key - Unique identifier (IP, userId, apiKeyId)
 * @param limit - Maximum requests allowed in the window
 * @param windowMs - Window duration in milliseconds
 * @returns RateLimitResult with allowed status and metadata
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const windowStart = now - windowMs

  cleanupExpiredEntries(windowMs)

  const existing = store.get(key) ?? []
  const validEntries = existing.filter((e) => e.timestamp > windowStart)

  if (validEntries.length >= limit) {
    const oldestInWindow = validEntries[0]?.timestamp ?? now
    const resetAt = oldestInWindow + windowMs

    return {
      allowed: false,
      remaining: 0,
      limit,
      resetAt,
    }
  }

  const updatedEntries = [...validEntries, { timestamp: now }]
  store.set(key, updatedEntries)

  const resetAt = now + windowMs

  return {
    allowed: true,
    remaining: limit - updatedEntries.length,
    limit,
    resetAt,
  }
}

/**
 * Build rate limit response headers.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  }
}

/**
 * Build a 429 Too Many Requests JSON response with rate limit headers.
 */
export function rateLimitExceededResponse(result: RateLimitResult): Response {
  const retryAfterSeconds = Math.ceil((result.resetAt - Date.now()) / 1000)

  return Response.json(
    {
      success: false,
      error: "Rate limit exceeded",
      code: "RATE_LIMITED",
    },
    {
      status: 429,
      headers: {
        ...rateLimitHeaders(result),
        "Retry-After": String(Math.max(1, retryAfterSeconds)),
      },
    }
  )
}
