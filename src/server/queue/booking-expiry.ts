import { Worker, Queue } from 'bullmq'
import { createRedisConnection } from '../redis'
import { prisma } from '../db'
import { redis } from '../redis'
import { stripe } from '@/lib/stripe'
import { toDateString } from '@/lib/date-utils'

const connection = createRedisConnection()

export const expiryQueue = new Queue('booking-expiry', { connection })

/**
 * Schedule the booking expiry job to run every 2 minutes.
 * Finds PENDING bookings older than 10 minutes and marks them FAILED.
 */
export async function scheduleBookingExpiry() {
  await expiryQueue.add(
    'expire-pending',
    {},
    {
      repeat: { every: 120000 }, // 2 minutes
      jobId: 'booking-expiry-check',
    }
  )
}

export const expiryWorker = new Worker(
  'booking-expiry',
  async () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)

    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: tenMinutesAgo },
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

    if (expiredBookings.length === 0) return

    console.log(`[booking-expiry] Expiring ${expiredBookings.length} PENDING bookings`)

    for (const booking of expiredBookings) {
      // Atomic: only updates if still PENDING — guards against concurrent workers
      const result = await prisma.booking.updateMany({
        where: { id: booking.id, status: 'PENDING' },
        data: { status: 'FAILED' },
      })

      // Another worker already processed this booking
      if (result.count === 0) continue

      // Release Redis lock — must use toDateString (local date parts) to match the key
      // created at booking time from the raw client string (e.g. "2026-07-15").
      // toISOString() would produce the wrong date on UTC+ servers (Greece = UTC+3).
      const lockKey = `lock:property:${booking.propertyId}:${toDateString(booking.checkIn)}:${toDateString(booking.checkOut)}`
      await redis.del(lockKey)

      // Cancel the Stripe PaymentIntent so the guest cannot complete payment later
      if (booking.stripePaymentIntentId) {
        try {
          await stripe.paymentIntents.cancel(booking.stripePaymentIntentId)
        } catch (err) {
          // May already be cancelled or succeeded — log and continue
          console.error(`[booking-expiry] Stripe cancel failed for ${booking.reference}:`, err)
        }
      }

      console.log(`[booking-expiry] Expired ${booking.reference}`)
    }
  },
  { connection: createRedisConnection() }
)
