import { Worker } from 'bullmq'
import { Resend } from 'resend'
import { createRedisConnection } from '../redis'
import { prisma } from '../db'
import { toDateString } from '@/lib/date-utils'
import { env } from '@/env'

const resend = new Resend(env.RESEND_API_KEY)

/**
 * Email worker — processes email jobs from the queue.
 *
 * Job types:
 * - booking-confirmation: sent to guest after payment succeeds
 * - booking-notification: sent to admin (Georgia) for new bookings
 * - cancellation-email: sent to guest after cancellation
 * - checkin-instructions: sent to guest before arrival
 * - custom-email: sent manually from admin dashboard
 *
 * Run as a standalone process via: tsx jobs/workers.ts
 */
export const emailWorker = new Worker(
  'email',
  async (job) => {
    const { to, bookingId } = job.data as { to: string; bookingId: string }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { property: true },
    })

    if (!booking) {
      console.error(`[email] Booking ${bookingId} not found, skipping`)
      return
    }

    const totalEuros = (booking.totalCents / 100).toFixed(2)

    if (job.name === 'booking-confirmation') {
      await resend.emails.send({
        from: env.FROM_EMAIL,
        to,
        subject: `Booking confirmed — ${booking.reference} · Georgia's Cozy Rooms`,
        text: `Hi ${booking.guestName},

Your booking is confirmed!

Reference: ${booking.reference}
Property: ${booking.property.name}
Address: ${booking.property.address}

Check-in: ${toDateString(booking.checkIn)} from ${booking.property.checkInFrom}
Check-out: ${toDateString(booking.checkOut)} by ${booking.property.checkOutTo}
Guests: ${booking.guestCount}
Total paid: €${totalEuros}

We look forward to welcoming you to Kavala.

Georgia
georgiascosyrooms.gr`,
      })

      console.log(`[email] Confirmation sent to ${to} for ${booking.reference}`)
    }

    if (job.name === 'booking-notification') {
      const platformFeeEuros = (booking.platformFeeCents / 100).toFixed(2)
      const ownerPayoutEuros = (booking.ownerPayoutCents / 100).toFixed(2)
      const appUrl = env.NEXT_PUBLIC_APP_URL

      await resend.emails.send({
        from: env.FROM_EMAIL,
        to,
        subject: `New booking — ${booking.reference} · ${booking.property.name}`,
        text: `New direct booking received.

Reference: ${booking.reference}
Property: ${booking.property.name}
Guest: ${booking.guestName} (${booking.guestEmail})
Phone: ${booking.guestPhone ?? 'N/A'}
Dates: ${toDateString(booking.checkIn)} – ${toDateString(booking.checkOut)} (${booking.nights} nights)
Guests: ${booking.guestCount}
Total: €${totalEuros}
Platform fee: €${platformFeeEuros}
Your payout: €${ownerPayoutEuros}

View in dashboard: ${appUrl}/admin/bookings`,
      })

      console.log(`[email] Admin notification sent to ${to} for ${booking.reference}`)
    }

    if (job.name === 'custom-email') {
      const { subject, body } = job.data as { subject: string; body: string }
      await resend.emails.send({
        from: env.FROM_EMAIL,
        to,
        subject,
        text: `${body}\n\nReference: ${booking.reference} · ${booking.property.name}`,
      })
      console.log(`[email] Custom email sent to ${to} for ${booking.reference}`)
    }

    if (job.name === 'cancellation-email') {
      const { refundAmount, refundPolicy } = job.data as { refundAmount: number; refundPolicy: string }
      const refundEuros = (refundAmount / 100).toFixed(2)
      await resend.emails.send({
        from: env.FROM_EMAIL,
        to,
        subject: `Booking cancelled — ${booking.reference} · Georgia's Cozy Rooms`,
        text: `Hi ${booking.guestName},

Your booking has been cancelled.

Reference: ${booking.reference}
Property: ${booking.property.name}
Dates: ${toDateString(booking.checkIn)} – ${toDateString(booking.checkOut)}
Refund policy: ${refundPolicy}
Refund amount: €${refundEuros}

Refunds are processed through Stripe within 5-10 business days.

We're sorry for the inconvenience and hope to welcome you another time.

Georgia
georgiascosyrooms.gr`,
      })
      console.log(`[email] Cancellation email sent to ${to} for ${booking.reference}`)
    }

    if (job.name === 'checkin-instructions') {
      await resend.emails.send({
        from: env.FROM_EMAIL,
        to,
        subject: `Check-in instructions — ${booking.reference} · Georgia's Cozy Rooms`,
        text: `Hi ${booking.guestName},

We look forward to welcoming you to ${booking.property.name}!

Property: ${booking.property.name}
Address: ${booking.property.address}
Check-in: ${toDateString(booking.checkIn)} from ${booking.property.checkInFrom} to ${booking.property.checkInTo}
Check-out: ${toDateString(booking.checkOut)} by ${booking.property.checkOutTo}
Guests: ${booking.guestCount}

${booking.property.checkInInstructions ?? 'Please contact us closer to your arrival date for detailed check-in instructions.'}

If you have any questions before your stay, please don't hesitate to reach out.

See you soon!
Georgia
georgiascosyrooms.gr`,
      })
      console.log(`[email] Check-in instructions sent to ${to} for ${booking.reference}`)
    }
  },
  { connection: createRedisConnection() }
)
