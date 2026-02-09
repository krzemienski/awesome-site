/**
 * Distributed rate limiter with Upstash Redis.
 * Falls back to in-memory sliding window when Upstash is not configured (dev mode).
 *
 * - Upstash path: uses @upstash/ratelimit sliding window algorithm
 * - Fallback path: uses Map<string, SlidingWindowEntry[]> per-instance
 */

import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SlidingWindowEntry {
  readonly timestamp: number
}

interface RateLimitResult {
  readonly allowed: boolean
  readonly remaining: number
  readonly limit: number
  readonly resetAt: number
}

// ---------------------------------------------------------------------------
// Upstash Redis client (singleton, created only when env vars present)
// ---------------------------------------------------------------------------

function createUpstashRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    return null
  }

  return new Redis({ url, token })
}

const redis = createUpstashRedis()

/**
 * Cache of Ratelimit instances keyed by `${limit}:${windowMs}`.
 * Avoids creating a new Ratelimit per call while supporting multiple
 * rate-limit tiers (e.g. auth login vs general).
 */
const upstashLimiters = new Map<string, Ratelimit>()

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit | null {
  if (!redis) return null

  const cacheKey = `${limit}:${windowMs}`
  const existing = upstashLimiters.get(cacheKey)
  if (existing) return existing

  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000))
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    prefix: "ratelimit",
  })

  upstashLimiters.set(cacheKey, limiter)
  return limiter
}

// ---------------------------------------------------------------------------
// In-memory fallback (dev / no-Redis environments)
// ---------------------------------------------------------------------------

const store = new Map<string, SlidingWindowEntry[]>()

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

function checkRateLimitInMemory(
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check and record a request against the rate limit.
 *
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 * are configured. Falls back to in-memory sliding window otherwise.
 *
 * @param key - Unique identifier (IP, userId, apiKeyId)
 * @param limit - Maximum requests allowed in the window
 * @param windowMs - Window duration in milliseconds
 * @returns Promise<RateLimitResult> with allowed status and metadata
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const limiter = getUpstashLimiter(limit, windowMs)

  if (!limiter) {
    return checkRateLimitInMemory(key, limit, windowMs)
  }

  const result = await limiter.limit(key)

  return {
    allowed: result.success,
    remaining: result.remaining,
    limit: result.limit,
    resetAt: result.reset,
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
