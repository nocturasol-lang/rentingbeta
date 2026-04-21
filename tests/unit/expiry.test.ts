import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma
const mockFindMany = vi.fn()
const mockUpdateMany = vi.fn()

vi.mock('@/server/db', () => ({
  prisma: {
    booking: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      updateMany: (...args: unknown[]) => mockUpdateMany(...args),
    },
  },
}))

// Mock Stripe
const mockPaymentIntentsCancel = vi.fn()

vi.mock('@/lib/stripe', () => ({
  stripe: {
    paymentIntents: {
      cancel: (...args: unknown[]) => mockPaymentIntentsCancel(...args),
    },
  },
}))

// Mock Redis
const mockDel = vi.fn()

vi.mock('@/server/redis', () => ({
  redis: {
    del: (...args: unknown[]) => mockDel(...args),
  },
  createRedisConnection: () => ({
    maxRetriesPerRequest: null,
  }),
}))

// Mock BullMQ — prevent real connections
let workerProcessor: (() => Promise<void>) | null = null

vi.mock('bullmq', () => {
  return {
    Queue: class MockQueue {
      add = vi.fn()
    },
    Worker: class MockWorker {
      constructor(_name: string, processor: () => Promise<void>) {
        workerProcessor = processor
      }
      on = vi.fn()
      close = vi.fn()
    },
  }
})

// Import after mocks are set up
beforeEach(async () => {
  vi.clearAllMocks()
  workerProcessor = null
  vi.resetModules()
  await import('@/server/queue/booking-expiry')
})

describe('booking expiry worker', () => {
  it('expires PENDING bookings older than 10 minutes', async () => {
    const oldBooking = {
      id: 'booking-1',
      reference: 'KVL-TEST0001',
      propertyId: 'prop-1',
      status: 'PENDING',
      checkIn: new Date('2026-07-15'),
      checkOut: new Date('2026-07-20'),
      createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
      stripePaymentIntentId: 'pi_test_123',
    }

    mockFindMany.mockResolvedValue([oldBooking])
    mockUpdateMany.mockResolvedValue({ count: 1 })
    mockDel.mockResolvedValue(1)
    mockPaymentIntentsCancel.mockResolvedValue({})

    expect(workerProcessor).not.toBeNull()
    await workerProcessor!()

    // Should query for PENDING bookings older than 10 min with select
    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        status: 'PENDING',
        createdAt: { lt: expect.any(Date) },
      },
      select: {
        id: true,
        reference: true,
        propertyId: true,
        checkIn: true,
        checkOut: true,
        stripePaymentIntentId: true,
      },
    })

    // Should atomically update booking to FAILED (only if still PENDING)
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: 'booking-1', status: 'PENDING' },
      data: { status: 'FAILED' },
    })

    // Should release Redis lock
    expect(mockDel).toHaveBeenCalledWith(
      'lock:property:prop-1:2026-07-15:2026-07-20'
    )

    // Should cancel the Stripe PaymentIntent
    expect(mockPaymentIntentsCancel).toHaveBeenCalledWith('pi_test_123')
  })

  it('does nothing when no expired bookings exist', async () => {
    mockFindMany.mockResolvedValue([])

    expect(workerProcessor).not.toBeNull()
    await workerProcessor!()

    expect(mockFindMany).toHaveBeenCalled()
    expect(mockUpdateMany).not.toHaveBeenCalled()
    expect(mockDel).not.toHaveBeenCalled()
  })

  it('expires multiple bookings and releases all locks', async () => {
    const bookings = [
      {
        id: 'b1',
        reference: 'KVL-0001',
        propertyId: 'p1',
        checkIn: new Date('2026-08-01'),
        checkOut: new Date('2026-08-05'),
        stripePaymentIntentId: null,
      },
      {
        id: 'b2',
        reference: 'KVL-0002',
        propertyId: 'p2',
        checkIn: new Date('2026-08-10'),
        checkOut: new Date('2026-08-12'),
        stripePaymentIntentId: null,
      },
    ]

    mockFindMany.mockResolvedValue(bookings)
    mockUpdateMany.mockResolvedValue({ count: 1 })
    mockDel.mockResolvedValue(1)

    expect(workerProcessor).not.toBeNull()
    await workerProcessor!()

    expect(mockUpdateMany).toHaveBeenCalledTimes(2)
    expect(mockDel).toHaveBeenCalledTimes(2)
    expect(mockDel).toHaveBeenCalledWith('lock:property:p1:2026-08-01:2026-08-05')
    expect(mockDel).toHaveBeenCalledWith('lock:property:p2:2026-08-10:2026-08-12')
    // No Stripe cancel when stripePaymentIntentId is null
    expect(mockPaymentIntentsCancel).not.toHaveBeenCalled()
  })
})
