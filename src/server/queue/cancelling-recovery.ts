import { Worker, Queue } from 'bullmq'
import { createRedisConnection } from '../redis'
import { prisma } from '../db'
import { stripe } from '@/lib/stripe'
import { toDateString } from '@/lib/date-utils'
import { redis } from '../redis'

const connection = createRedisConnection()

export const cancellingRecoveryQueue = new Queue('cancelling-recovery', { connection })

/**
 * Scans for CANCELLING bookings older than 30 minutes — these are stuck because
 * the Stripe `charge.refunded` webhook never arrived (delivery failure, secret rotation, etc.).
 *
 * Recovery strategy:
 * 1. Re-query the Stripe charge to check refund status.
 * 2. If already refunded on Stripe's side → mark CANCELLED (idempotent fix).
 * 3. If not refunded → re-issue the refund and let the webhook complete it.
 *    If no charge exists (manual booking) → mark CANCELLED directly.
 *
 * Runs every 10 minutes.
 */
export async function scheduleCancellingRecovery() {
  await cancellingRecoveryQueue.add(
    'recover-stuck-cancelling',
    {},
    {
      repeat: { every: 10 * 60 * 1000 }, // 10 minutes
      jobId: 'cancelling-recovery-check',
    }
  )
}

export const cancellingRecoveryWorker = new Worker(
  'cancelling-recovery',
  async () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)

    const stuckBookings = await prisma.booking.findMany({
      where: {
        status: 'CANCELLING',
        updatedAt: { lt: thirtyMinutesAgo },
      },
    })

    if (stuckBookings.length === 0) return

    console.log(`[cancelling-recovery] Found ${stuckBookings.length} stuck CANCELLING booking(s)`)

    for (const booking of stuckBookings) {
      try {
        if (!booking.stripeChargeId) {
          // Manual booking — no charge, mark cancelled directly
          await prisma.booking.update({
            where: { id: booking.id },
            data: { status: 'CANCELLED', cancelledAt: new Date() },
          })
          console.log(`[cancelling-recovery] ${booking.reference} — no charge, marked CANCELLED`)
          continue
        }

        const charge = await stripe.charges.retrieve(booking.stripeChargeId)

        if (charge.refunded) {
          // Stripe already refunded — webhook was lost, fix the record
          await prisma.booking.update({
            where: { id: booking.id },
            data: { status: 'CANCELLED', cancelledAt: new Date() },
          })

          // Release Redis lock if still held
          const lockKey = `lock:property:${booking.propertyId}:${toDateString(booking.checkIn)}:${toDateString(booking.checkOut)}`
          await redis.del(lockKey)

          console.log(`[cancelling-recovery] ${booking.reference} — already refunded on Stripe, marked CANCELLED`)
        } else {
          // Refund not yet issued — retry it. Webhook will complete the transition.
          await stripe.refunds.create({ charge: booking.stripeChargeId })
          console.log(`[cancelling-recovery] ${booking.reference} — re-issued Stripe refund`)
        }
      } catch (err) {
        console.error(`[cancelling-recovery] Error recovering ${booking.reference}:`, err)
      }
    }
  },
  { connection: createRedisConnection() }
)
