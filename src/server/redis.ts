import Redis from 'ioredis'
import { env } from '@/env'

const globalForRedis = globalThis as unknown as { redis: Redis }

export const redis =
  globalForRedis.redis ??
  new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null, // required by BullMQ
  })

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

// Export a factory for BullMQ (it needs its own connection)
export function createRedisConnection() {
  return new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
  })
}
