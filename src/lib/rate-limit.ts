import { redis } from '@/server/redis'

interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfter: number // seconds until window resets, 0 if allowed
}

/**
 * Redis fixed-window rate limiter.
 *
 * Uses INCR + EXPIRE for a simple fixed-window counter.
 * Key auto-expires after the window, so no cleanup needed.
 *
 * @param key      Redis key (e.g. "rl:login:192.168.1.1")
 * @param limit    Max requests allowed in the window
 * @param windowSeconds  Window duration in seconds
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const count = await redis.incr(key)

  // Set TTL only on first request (when count === 1)
  if (count === 1) {
    await redis.expire(key, windowSeconds)
  }

  if (count > limit) {
    const ttl = await redis.ttl(key)
    return { allowed: false, remaining: 0, retryAfter: ttl > 0 ? ttl : windowSeconds }
  }

  return { allowed: true, remaining: limit - count, retryAfter: 0 }
}
