import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { redis } from '@/server/redis'
import { stripe } from '@/lib/stripe'
import { Queue } from 'bullmq'
import { createRedisConnection } from '@/server/redis'

const APP_VERSION = '0.1.0'
const startedAt = new Date()

interface CheckResult {
  status: 'pass' | 'fail'
  latencyMs: number
  details?: Record<string, unknown>
  error?: string
}

async function checkDatabase(): Promise<CheckResult> {
  const start = performance.now()
  try {
    const result = await prisma.$queryRaw<Array<{ now: Date; version: string }>>`
      SELECT now() as now, version() as version
    `
    const row = result[0]

    const propertyCount = await prisma.property.count()
    const bookingCount = await prisma.booking.count()
    const userCount = await prisma.user.count()
    const imageCount = await prisma.propertyImage.count()

    return {
      status: 'pass',
      latencyMs: Math.round(performance.now() - start),
      details: {
        serverTime: row.now,
        postgresVersion: row.version.split(' ').slice(0, 2).join(' '),
        tables: {
          properties: propertyCount,
          bookings: bookingCount,
          users: userCount,
          images: imageCount,
        },
      },
    }
  } catch (e) {
    return {
      status: 'fail',
      latencyMs: Math.round(performance.now() - start),
      error: e instanceof Error ? e.message : 'Unknown error',
    }
  }
}

async function checkRedis(): Promise<CheckResult> {
  const start = performance.now()
  try {
    const pong = await redis.ping()
    const info = await redis.info('memory')
    const usedMemory = info.match(/used_memory_human:(.+)/)?.[1]?.trim() ?? 'unknown'

    const keyCount = await redis.dbsize()

    return {
      status: pong === 'PONG' ? 'pass' : 'fail',
      latencyMs: Math.round(performance.now() - start),
      details: {
        ping: pong,
        memoryUsed: usedMemory,
        keys: keyCount,
      },
    }
  } catch (e) {
    return {
      status: 'fail',
      latencyMs: Math.round(performance.now() - start),
      error: e instanceof Error ? e.message : 'Unknown error',
    }
  }
}

async function checkStripe(): Promise<CheckResult> {
  const start = performance.now()
  try {
    const balance = await stripe.balance.retrieve()
    const availableCurrencies = balance.available.map((b) => ({
      currency: b.currency.toUpperCase(),
      amountCents: b.amount,
    }))

    return {
      status: 'pass',
      latencyMs: Math.round(performance.now() - start),
      details: {
        livemode: balance.livemode,
        available: availableCurrencies,
      },
    }
  } catch (e) {
    return {
      status: 'fail',
      latencyMs: Math.round(performance.now() - start),
      error: e instanceof Error ? e.message : 'Unknown error',
    }
  }
}

async function checkQueues(): Promise<CheckResult> {
  const start = performance.now()
  const connection = createRedisConnection()

  try {
    const queueNames = ['email', 'booking-expiry', 'ical-sync'] as const
    const queueDetails: Record<string, unknown> = {}

    for (const name of queueNames) {
      const queue = new Queue(name, { connection })
      const counts = await queue.getJobCounts(
        'active',
        'completed',
        'failed',
        'delayed',
        'waiting'
      )
      const repeatableJobs = await queue.getRepeatableJobs()
      queueDetails[name] = {
        jobs: counts,
        repeatableJobs: repeatableJobs.map((j) => ({
          name: j.name,
          pattern: j.pattern,
          next: j.next ? new Date(j.next).toISOString() : null,
        })),
      }
      await queue.close()
    }

    return {
      status: 'pass',
      latencyMs: Math.round(performance.now() - start),
      details: queueDetails,
    }
  } catch (e) {
    return {
      status: 'fail',
      latencyMs: Math.round(performance.now() - start),
      error: e instanceof Error ? e.message : 'Unknown error',
    }
  } finally {
    await connection.quit()
  }
}

async function checkEmail(): Promise<CheckResult> {
  const start = performance.now()
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return {
      status: 'fail',
      latencyMs: Math.round(performance.now() - start),
      error: 'RESEND_API_KEY not set',
    }
  }

  try {
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    const data = await res.json()
    const domains = Array.isArray(data.data)
      ? data.data.map((d: { name: string; status: string }) => ({
          name: d.name,
          status: d.status,
        }))
      : []

    return {
      status: res.ok ? 'pass' : 'fail',
      latencyMs: Math.round(performance.now() - start),
      details: {
        domains,
      },
    }
  } catch (e) {
    return {
      status: 'fail',
      latencyMs: Math.round(performance.now() - start),
      error: e instanceof Error ? e.message : 'Unknown error',
    }
  }
}

function checkEnvVars(): CheckResult {
  const start = performance.now()
  const required = [
    'DATABASE_URL',
    'REDIS_URL',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'RESEND_API_KEY',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ] as const

  const results: Record<string, boolean> = {}
  const missing: string[] = []

  for (const key of required) {
    const isSet = Boolean(process.env[key])
    results[key] = isSet
    if (!isSet) missing.push(key)
  }

  return {
    status: missing.length === 0 ? 'pass' : 'fail',
    latencyMs: Math.round(performance.now() - start),
    details: {
      variables: results,
      missing: missing.length > 0 ? missing : undefined,
    },
  }
}

export async function GET() {
  const totalStart = performance.now()

  const [database, redisCheck, stripeCheck, queues, email] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkStripe(),
    checkQueues(),
    checkEmail(),
  ])

  const env = checkEnvVars()

  const checks = { database, redis: redisCheck, stripe: stripeCheck, queues, email, env }
  const allPass = Object.values(checks).every((c) => c.status === 'pass')

  const uptimeSeconds = Math.round((Date.now() - startedAt.getTime()) / 1000)
  const uptimeFormatted = [
    Math.floor(uptimeSeconds / 3600),
    Math.floor((uptimeSeconds % 3600) / 60),
    uptimeSeconds % 60,
  ]
    .map((n) => String(n).padStart(2, '0'))
    .join(':')

  const response = {
    status: allPass ? 'healthy' : 'degraded',
    version: APP_VERSION,
    environment: process.env.NODE_ENV ?? 'unknown',
    timestamp: new Date().toISOString(),
    uptime: uptimeFormatted,
    totalLatencyMs: Math.round(performance.now() - totalStart),
    checks,
  }

  return NextResponse.json(response, { status: allPass ? 200 : 503 })
}
