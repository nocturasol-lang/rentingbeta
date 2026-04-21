import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockIncr = vi.fn()
const mockExpire = vi.fn()
const mockTtl = vi.fn()

vi.mock('@/server/redis', () => ({
  redis: {
    incr: (...args: unknown[]) => mockIncr(...args),
    expire: (...args: unknown[]) => mockExpire(...args),
    ttl: (...args: unknown[]) => mockTtl(...args),
  },
}))

import { checkRateLimit } from '@/lib/rate-limit'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('checkRateLimit', () => {
  const key = 'rl:test:127.0.0.1'
  const limit = 5
  const windowSeconds = 60

  it('allows first request and sets TTL', async () => {
    mockIncr.mockResolvedValue(1)
    mockExpire.mockResolvedValue(1)

    const result = await checkRateLimit(key, limit, windowSeconds)

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4) // limit - count = 5 - 1
    expect(result.retryAfter).toBe(0)
    expect(mockExpire).toHaveBeenCalledWith(key, windowSeconds)
  })

  it('only sets TTL on the first request (count === 1)', async () => {
    mockIncr.mockResolvedValue(2)

    await checkRateLimit(key, limit, windowSeconds)

    expect(mockExpire).not.toHaveBeenCalled()
  })

  it('allows requests up to the limit', async () => {
    mockIncr.mockResolvedValue(5) // exactly at limit

    const result = await checkRateLimit(key, limit, windowSeconds)

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(0)
    expect(result.retryAfter).toBe(0)
  })

  it('blocks requests exceeding the limit', async () => {
    mockIncr.mockResolvedValue(6) // one over
    mockTtl.mockResolvedValue(45)

    const result = await checkRateLimit(key, limit, windowSeconds)

    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.retryAfter).toBe(45)
    expect(mockTtl).toHaveBeenCalledWith(key)
  })

  it('falls back to windowSeconds when TTL returns -1 (key has no expiry)', async () => {
    mockIncr.mockResolvedValue(10)
    mockTtl.mockResolvedValue(-1)

    const result = await checkRateLimit(key, limit, windowSeconds)

    expect(result.allowed).toBe(false)
    expect(result.retryAfter).toBe(windowSeconds)
  })

  it('falls back to windowSeconds when TTL returns 0', async () => {
    mockIncr.mockResolvedValue(10)
    mockTtl.mockResolvedValue(0)

    const result = await checkRateLimit(key, limit, windowSeconds)

    expect(result.retryAfter).toBe(windowSeconds)
  })

  it('computes remaining correctly across multiple requests', async () => {
    for (let count = 1; count <= limit; count++) {
      mockIncr.mockResolvedValue(count)
      if (count === 1) mockExpire.mockResolvedValue(1)

      const result = await checkRateLimit(key, limit, windowSeconds)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(limit - count)
    }
  })

  it('uses the correct Redis key', async () => {
    mockIncr.mockResolvedValue(1)
    mockExpire.mockResolvedValue(1)

    const customKey = 'rl:booking:create:10.0.0.1'
    await checkRateLimit(customKey, 3, 3600)

    expect(mockIncr).toHaveBeenCalledWith(customKey)
    expect(mockExpire).toHaveBeenCalledWith(customKey, 3600)
  })
})
