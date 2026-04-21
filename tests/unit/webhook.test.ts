import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// --- Mocks must be declared before any imports that trigger module load ---

vi.mock('@/env', () => ({
  env: {
    STRIPE_SECRET_KEY: 'sk_test_mock',
    STRIPE_WEBHOOK_SECRET: 'whsec_test_mock',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_mock',
    DATABASE_URL: 'postgresql://mock',
    REDIS_URL: 'redis://localhost:6379',
    NEXTAUTH_SECRET: 'mock-secret',
    RESEND_API_KEY: 're_mock',
    FROM_EMAIL: 'noreply@test.com',
    ADMIN_EMAIL: 'admin@test.com',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    INTERNAL_SECRET: 'mock-internal-secret',
    ICAL_POLL_INTERVAL_MS: 900000,
    DISCORD_WEBHOOK_URL: undefined,
  },
}))

// Mock stripe.webhooks.constructEvent — bypass real signature verification
const mockConstructEvent = vi.fn()

vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: { constructEvent: (...args: unknown[]) => mockConstructEvent(...args) },
  },
}))

// Mock Prisma
const mockBookingFindUnique = vi.fn()
const mockBookingUpdate = vi.fn()
const mockPropertyFindUnique = vi.fn()

vi.mock('@/server/db', () => ({
  prisma: {
    booking: {
      findUnique: (...args: unknown[]) => mockBookingFindUnique(...args),
      update: (...args: unknown[]) => mockBookingUpdate(...args),
    },
    property: {
      findUnique: (...args: unknown[]) => mockPropertyFindUnique(...args),
    },
  },
}))

// Mock Redis
const mockDel = vi.fn()

vi.mock('@/server/redis', () => ({
  redis: { del: (...args: unknown[]) => mockDel(...args) },
}))

// Mock email queue
const mockEmailAdd = vi.fn()

vi.mock('@/server/queue/email-queue', () => ({
  emailQueue: { add: (...args: unknown[]) => mockEmailAdd(...args) },
}))

// Mock Discord — optional, non-critical
const mockNotifyBooking = vi.fn()
const mockNotifyCancellation = vi.fn()

vi.mock('@/lib/discord', () => ({
  notifyDiscordBooking: (...args: unknown[]) => mockNotifyBooking(...args),
  notifyDiscordCancellation: (...args: unknown[]) => mockNotifyCancellation(...args),
}))

// Import the real handler AFTER mocks are wired
import { POST } from '@/app/api/webhooks/stripe/route'

// --- Helpers ---

function makeRequest(event: object): NextRequest {
  const body = JSON.stringify(event)
  return new NextRequest('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    body,
    headers: { 'stripe-signature': 'test-sig', 'content-type': 'application/json' },
  })
}

function makePaymentIntent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pi_test_123',
    latest_charge: 'ch_test_456',
    ...overrides,
  }
}

const confirmedBooking = {
  id: 'b1',
  reference: 'KVL-TEST0001',
  status: 'CONFIRMED',
  guestName: 'Test Guest',
  guestEmail: 'guest@test.com',
  guestPhone: null,
  propertyId: 'prop-1',
  checkIn: new Date('2026-07-15'),
  checkOut: new Date('2026-07-20'),
  nights: 5,
  guestCount: 2,
  totalCents: 50000,
  platformFeeCents: 7500,
  ownerPayoutCents: 42500,
  property: { name: 'Studio 1' },
}

// ---

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/webhooks/stripe', () => {
  describe('signature validation', () => {
    it('returns 400 when stripe-signature header is missing', async () => {
      const req = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: '{}',
        headers: { 'content-type': 'application/json' },
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
      expect(await res.json()).toMatchObject({ error: 'Missing signature' })
    })

    it('returns 400 when signature is invalid', async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error('No signatures found matching the expected signature for payload')
      })
      const res = await POST(makeRequest({ type: 'payment_intent.succeeded' }))
      expect(res.status).toBe(400)
      expect(await res.json()).toMatchObject({ error: 'Invalid signature' })
    })
  })

  describe('payment_intent.succeeded', () => {
    it('confirms a PENDING booking, stores charge ID, enqueues both emails', async () => {
      const pendingBooking = { ...confirmedBooking, status: 'PENDING' }
      mockBookingFindUnique.mockResolvedValue(pendingBooking)
      mockBookingUpdate.mockResolvedValue({ ...pendingBooking, status: 'CONFIRMED' })
      mockEmailAdd.mockResolvedValue(undefined)
      mockNotifyBooking.mockResolvedValue(undefined)

      const pi = makePaymentIntent({ latest_charge: 'ch_test_456' })
      mockConstructEvent.mockReturnValue({ type: 'payment_intent.succeeded', data: { object: pi } })

      const res = await POST(makeRequest(pi))
      expect(res.status).toBe(200)

      expect(mockBookingFindUnique).toHaveBeenCalledWith({
        where: { stripePaymentIntentId: 'pi_test_123' },
        include: { property: true },
      })

      expect(mockBookingUpdate).toHaveBeenCalledWith({
        where: { id: 'b1' },
        data: {
          status: 'CONFIRMED',
          confirmedAt: expect.any(Date),
          stripeChargeId: 'ch_test_456',
        },
      })

      expect(mockEmailAdd).toHaveBeenCalledTimes(2)
      expect(mockEmailAdd).toHaveBeenCalledWith('booking-confirmation', {
        to: 'guest@test.com',
        bookingId: 'b1',
      })
      expect(mockEmailAdd).toHaveBeenCalledWith('booking-notification', {
        to: 'admin@test.com',
        bookingId: 'b1',
      })
    })

    it('resolves charge ID when latest_charge is an expanded Stripe.Charge object', async () => {
      const pendingBooking = { ...confirmedBooking, status: 'PENDING' }
      mockBookingFindUnique.mockResolvedValue(pendingBooking)
      mockBookingUpdate.mockResolvedValue({})
      mockEmailAdd.mockResolvedValue(undefined)
      mockNotifyBooking.mockResolvedValue(undefined)

      // Stripe sometimes expands latest_charge into a full object
      const pi = makePaymentIntent({ latest_charge: { id: 'ch_expanded_789', object: 'charge' } })
      mockConstructEvent.mockReturnValue({ type: 'payment_intent.succeeded', data: { object: pi } })

      await POST(makeRequest(pi))

      expect(mockBookingUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ stripeChargeId: 'ch_expanded_789' }),
        })
      )
    })

    it('is idempotent — skips already CONFIRMED booking', async () => {
      mockBookingFindUnique.mockResolvedValue(confirmedBooking) // already CONFIRMED
      const pi = makePaymentIntent()
      mockConstructEvent.mockReturnValue({ type: 'payment_intent.succeeded', data: { object: pi } })

      const res = await POST(makeRequest(pi))
      expect(res.status).toBe(200)
      expect(mockBookingUpdate).not.toHaveBeenCalled()
      expect(mockEmailAdd).not.toHaveBeenCalled()
    })

    it('is idempotent — skips when booking not found', async () => {
      mockBookingFindUnique.mockResolvedValue(null)
      const pi = makePaymentIntent()
      mockConstructEvent.mockReturnValue({ type: 'payment_intent.succeeded', data: { object: pi } })

      const res = await POST(makeRequest(pi))
      expect(res.status).toBe(200)
      expect(mockBookingUpdate).not.toHaveBeenCalled()
    })

    it('returns 200 even when email queue throws — booking is already confirmed', async () => {
      const pendingBooking = { ...confirmedBooking, status: 'PENDING' }
      mockBookingFindUnique.mockResolvedValue(pendingBooking)
      mockBookingUpdate.mockResolvedValue({})
      mockEmailAdd.mockRejectedValue(new Error('Redis unavailable'))
      mockNotifyBooking.mockResolvedValue(undefined)

      const pi = makePaymentIntent()
      mockConstructEvent.mockReturnValue({ type: 'payment_intent.succeeded', data: { object: pi } })

      const res = await POST(makeRequest(pi))
      expect(res.status).toBe(200)
      expect(mockBookingUpdate).toHaveBeenCalled() // DB write still happened
    })
  })

  describe('payment_intent.payment_failed', () => {
    it('marks a PENDING booking FAILED and releases the Redis lock', async () => {
      const pendingBooking = {
        id: 'b1',
        reference: 'KVL-TEST0001',
        status: 'PENDING',
        propertyId: 'prop-1',
        checkIn: new Date('2026-07-15'),
        checkOut: new Date('2026-07-20'),
      }
      mockBookingFindUnique.mockResolvedValue(pendingBooking)
      mockBookingUpdate.mockResolvedValue({})
      mockDel.mockResolvedValue(1)

      const pi = makePaymentIntent()
      mockConstructEvent.mockReturnValue({ type: 'payment_intent.payment_failed', data: { object: pi } })

      const res = await POST(makeRequest(pi))
      expect(res.status).toBe(200)

      expect(mockBookingUpdate).toHaveBeenCalledWith({
        where: { id: 'b1' },
        data: { status: 'FAILED' },
      })

      // Lock key must use local date parts (toDateString), not UTC
      expect(mockDel).toHaveBeenCalledWith(
        expect.stringMatching(/^lock:property:prop-1:\d{4}-\d{2}-\d{2}:\d{4}-\d{2}-\d{2}$/)
      )
    })

    it('is idempotent — skips if booking is not PENDING', async () => {
      mockBookingFindUnique.mockResolvedValue({ ...confirmedBooking, status: 'CONFIRMED' })
      const pi = makePaymentIntent()
      mockConstructEvent.mockReturnValue({ type: 'payment_intent.payment_failed', data: { object: pi } })

      const res = await POST(makeRequest(pi))
      expect(res.status).toBe(200)
      expect(mockBookingUpdate).not.toHaveBeenCalled()
      expect(mockDel).not.toHaveBeenCalled()
    })
  })

  describe('charge.refunded', () => {
    it('cancels a CANCELLING booking and sends Discord notification', async () => {
      const cancellingBooking = {
        id: 'b1',
        reference: 'KVL-TEST0001',
        status: 'CANCELLING',
        guestName: 'Test Guest',
        propertyId: 'prop-1',
      }
      mockBookingFindUnique.mockResolvedValue(cancellingBooking)
      mockBookingUpdate.mockResolvedValue({})
      mockPropertyFindUnique.mockResolvedValue({ name: 'Studio 1' })
      mockNotifyCancellation.mockResolvedValue(undefined)

      const charge = { id: 'ch_test_456', payment_intent: 'pi_test_123' }
      mockConstructEvent.mockReturnValue({ type: 'charge.refunded', data: { object: charge } })

      const res = await POST(makeRequest(charge))
      expect(res.status).toBe(200)

      expect(mockBookingUpdate).toHaveBeenCalledWith({
        where: { id: 'b1' },
        data: {
          status: 'CANCELLED',
          cancelledAt: expect.any(Date),
        },
      })

      expect(mockNotifyCancellation).toHaveBeenCalledWith('KVL-TEST0001', 'Studio 1', 'Test Guest')
    })

    it('is idempotent — skips already CANCELLED booking', async () => {
      mockBookingFindUnique.mockResolvedValue({ id: 'b1', status: 'CANCELLED' })
      const charge = { id: 'ch_test_456', payment_intent: 'pi_test_123' }
      mockConstructEvent.mockReturnValue({ type: 'charge.refunded', data: { object: charge } })

      const res = await POST(makeRequest(charge))
      expect(res.status).toBe(200)
      expect(mockBookingUpdate).not.toHaveBeenCalled()
    })

    it('skips when charge has no payment_intent', async () => {
      const charge = { id: 'ch_test_456', payment_intent: null }
      mockConstructEvent.mockReturnValue({ type: 'charge.refunded', data: { object: charge } })

      const res = await POST(makeRequest(charge))
      expect(res.status).toBe(200)
      expect(mockBookingFindUnique).not.toHaveBeenCalled()
    })
  })

  describe('unknown event types', () => {
    it('returns 200 and does nothing for unhandled event types', async () => {
      mockConstructEvent.mockReturnValue({ type: 'customer.created', data: { object: {} } })

      const res = await POST(makeRequest({}))
      expect(res.status).toBe(200)
      expect(mockBookingUpdate).not.toHaveBeenCalled()
    })
  })
})
