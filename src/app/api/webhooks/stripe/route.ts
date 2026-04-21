import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/server/db'
import { redis } from '@/server/redis'
import { emailQueue } from '@/server/queue/email-queue'
import { notifyDiscordBooking, notifyDiscordCancellation } from '@/lib/discord'
import { toDateString } from '@/lib/date-utils'
import { env } from '@/env'

/**
 * Stripe webhook handler.
 *
 * Handles:
 * - payment_intent.succeeded → Confirm booking
 * - payment_intent.payment_failed → Fail booking, release Redis lock
 * - payment_intent.canceled → Cancel the associated booking, release Redis lock
 * - charge.refunded → Complete cancellation
 *
 * Always verify the webhook signature first.
 * Always return 200 to Stripe — process async.
 */
export async function POST(req: NextRequest) {
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break
      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent)
        break
    }
  } catch (error) {
    console.error('[stripe-webhook] Error processing event:', error)
  }

  // Always return 200 — Stripe will retry on 5xx
  return NextResponse.json({ received: true })
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const booking = await prisma.booking.findUnique({
    where: { stripePaymentIntentId: paymentIntent.id },
    include: { property: true },
  })

  // Idempotent: skip if not found or already confirmed
  if (!booking || booking.status === 'CONFIRMED') return

  // Resolve charge ID — latest_charge can be string | Stripe.Charge | null
  const chargeId =
    typeof paymentIntent.latest_charge === 'string'
      ? paymentIntent.latest_charge
      : (paymentIntent.latest_charge?.id ?? null)

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: 'CONFIRMED',
      confirmedAt: new Date(),
      stripeChargeId: chargeId,
    },
  })

  console.log(`[stripe-webhook] Booking ${booking.reference} CONFIRMED`)

  // Enqueue emails — booking is already confirmed in DB, so a queue failure must not throw.
  // Log the error; the admin Discord notification below still fires.
  try {
    await emailQueue.add('booking-confirmation', {
      to: booking.guestEmail,
      bookingId: booking.id,
    })
    await emailQueue.add('booking-notification', {
      to: env.ADMIN_EMAIL,
      bookingId: booking.id,
    })
  } catch (err) {
    console.error(`[stripe-webhook] Email queue failed for ${booking.reference} — booking confirmed but emails not queued:`, err)
  }

  // Discord notification — non-critical, must not throw
  try {
    await notifyDiscordBooking({
      reference: booking.reference,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
      propertyName: booking.property.name,
      checkIn: toDateString(booking.checkIn),
      checkOut: toDateString(booking.checkOut),
      nights: booking.nights,
      guestCount: booking.guestCount,
      totalCents: booking.totalCents,
      platformFeeCents: booking.platformFeeCents,
      ownerPayoutCents: booking.ownerPayoutCents,
    })
  } catch (err) {
    console.error(`[stripe-webhook] Discord notify failed for ${booking.reference}:`, err)
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const booking = await prisma.booking.findUnique({
    where: { stripePaymentIntentId: paymentIntent.id },
  })

  // Idempotent: skip if not found or not PENDING
  if (!booking || booking.status !== 'PENDING') return

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: 'FAILED' },
  })

  // Release Redis lock
  const lockKey = `lock:property:${booking.propertyId}:${toDateString(booking.checkIn)}:${toDateString(booking.checkOut)}`
  await redis.del(lockKey)

  console.log(`[stripe-webhook] Booking ${booking.reference} FAILED`)
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const booking = await prisma.booking.findUnique({
    where: { stripePaymentIntentId: paymentIntent.id },
  })

  // Idempotent: skip if not found or not in a cancellable state
  if (!booking || booking.status === 'CANCELLED' || booking.status === 'FAILED') return

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: booking.cancellationReason ?? 'Payment intent was canceled',
    },
  })

  // Release Redis lock in case it was still held
  const lockKey = `lock:property:${booking.propertyId}:${toDateString(booking.checkIn)}:${toDateString(booking.checkOut)}`
  await redis.del(lockKey)

  console.log(`[stripe-webhook] Booking ${booking.reference} CANCELLED (payment intent canceled)`)
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  if (!charge.payment_intent) return

  const booking = await prisma.booking.findUnique({
    where: { stripePaymentIntentId: charge.payment_intent as string },
  })

  // Idempotent: skip if not found or already cancelled
  if (!booking || booking.status === 'CANCELLED') return

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    },
  })

  console.log(`[stripe-webhook] Booking ${booking.reference} CANCELLED (refunded)`)

  // Discord notification
  const property = await prisma.property.findUnique({
    where: { id: booking.propertyId },
    select: { name: true },
  })
  await notifyDiscordCancellation(booking.reference, property?.name ?? 'Unknown', booking.guestName)
}
