import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import crypto, { randomUUID } from 'crypto'
import { differenceInDays } from 'date-fns'
import { router, publicProcedure } from '../trpc'
import { prisma } from '@/server/db'
import { redis } from '@/server/redis'
import { isAvailable } from '@/lib/availability'
import { calculateBookingPrice } from '@/lib/fees'
import { generateReference } from '@/lib/booking-ref'
import { stripe } from '@/lib/stripe'
import { timingSafeStringCompare } from '@/lib/crypto-utils'
import { checkRateLimit } from '@/lib/rate-limit'
import { toDateString } from '@/lib/date-utils'

export const bookingsRouter = router({
  /**
   * Create a PENDING booking + Stripe PaymentIntent.
   *
   * Flow:
   * 1. Validate inputs and property exists
   * 2. Re-check availability server-side (never trust client)
   * 3. Acquire Redis lock (NX + 600s TTL)
   * 4. Pre-generate booking ID + reference
   * 5. Create Stripe PaymentIntent (with pre-generated IDs in metadata)
   * 6. Single prisma.booking.create() with PI ID already set — no two-step write
   * 7. Return clientSecret so frontend can collect payment
   */
  create: publicProcedure
    .input(
      z.object({
        propertyId: z.string(),
        checkIn: z.string(),
        checkOut: z.string(),
        guestName: z.string().min(2),
        guestEmail: z.string().email(),
        guestPhone: z.string().min(5),
        guestCount: z.number().int().min(1),
        guestIdNumber: z.string().min(3),
        guestIdType: z.enum(['PASSPORT', 'NATIONAL_ID']),
        guestNationality: z.string().min(2).max(3),
        guestDateOfBirth: z.string(),
        guestResidenceCountry: z.string().min(2).max(3),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Rate limit: 3 bookings per hour per IP
      const rl = await checkRateLimit(`rl:booking:create:${ctx.ip}`, 3, 3600)
      if (!rl.allowed) {
        throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Too many booking attempts. Please try again later.' })
      }

      // 1. Find property
      const property = await prisma.property.findUnique({
        where: { id: input.propertyId, isActive: true },
      })

      if (!property) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Property not found or inactive' })
      }

      const checkIn = new Date(input.checkIn)
      const checkOut = new Date(input.checkOut)
      const nights = differenceInDays(checkOut, checkIn)

      if (nights < 1) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Check-out must be after check-in' })
      }

      if (nights < property.minNights) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Minimum stay is ${property.minNights} nights`,
        })
      }

      if (input.guestCount > property.maxGuests) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Maximum ${property.maxGuests} guests allowed`,
        })
      }

      // 2. Re-validate availability server-side
      const available = await isAvailable(property.id, checkIn, checkOut)
      if (!available) {
        throw new TRPCError({ code: 'CONFLICT', message: 'DATES_UNAVAILABLE' })
      }

      // 3. Acquire Redis lock
      const lockKey = `lock:property:${property.id}:${input.checkIn}:${input.checkOut}`
      const lockValue = crypto.randomUUID()
      const acquired = await redis.set(lockKey, lockValue, 'EX', 600, 'NX')

      if (!acquired) {
        throw new TRPCError({ code: 'CONFLICT', message: 'DATES_UNAVAILABLE' })
      }

      try {
        // 4. Calculate price (read fee from DB — never hardcode)
        const pricing = calculateBookingPrice(
          property.pricePerNightCents,
          nights,
          property.cleaningFeeCents,
          Number(property.platformFeePercent)
        )

        // 5. Pre-generate IDs so Stripe metadata and DB write happen atomically
        const bookingId = randomUUID()
        const reference = generateReference()

        // 6. Create Stripe PaymentIntent first (external call outside transaction)
        const paymentIntent = await stripe.paymentIntents.create({
          amount: pricing.total,
          currency: property.currency.toLowerCase(),
          metadata: {
            bookingId,
            reference,
            propertyId: property.id,
          },
          // Stripe Connect split — only when property has a connected account
          ...(property.stripeAccountId
            ? {
                transfer_data: {
                  destination: property.stripeAccountId,
                  amount: pricing.ownerPayout,
                },
              }
            : {}),
        })

        // 7. Single DB write — no separate update needed (rule #2: transaction for availability writes)
        const booking = await prisma.booking.create({
          data: {
            id: bookingId,
            reference,
            propertyId: property.id,
            guestName: input.guestName,
            guestEmail: input.guestEmail,
            guestPhone: input.guestPhone,
            guestCount: input.guestCount,
            guestIdNumber: input.guestIdNumber,
            guestIdType: input.guestIdType,
            guestNationality: input.guestNationality,
            guestDateOfBirth: new Date(input.guestDateOfBirth),
            guestResidenceCountry: input.guestResidenceCountry,
            checkIn,
            checkOut,
            nights,
            pricePerNightCents: property.pricePerNightCents,
            cleaningFeeCents: property.cleaningFeeCents,
            platformFeeCents: pricing.platformFee,
            ownerPayoutCents: pricing.ownerPayout,
            totalCents: pricing.total,
            platformFeePercent: property.platformFeePercent,
            currency: property.currency,
            stripePaymentIntentId: paymentIntent.id,
            status: 'PENDING',
            source: 'DIRECT',
          },
        })

        return {
          bookingId: booking.id,
          reference: booking.reference,
          clientSecret: paymentIntent.client_secret!,
          totalCents: pricing.total,
          currency: property.currency,
        }
      } catch (error) {
        // Release lock if anything fails
        await redis.del(lockKey)
        throw error
      }
    }),

  /**
   * Guest looks up their booking by reference code + email.
   * Both must match — never reveal which part was wrong.
   */
  getByReference: publicProcedure
    .input(
      z.object({
        reference: z.string(),
        guestEmail: z.string().email(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Rate limit: 10 lookups per minute per IP
      const rl = await checkRateLimit(`rl:booking:lookup:${ctx.ip}`, 10, 60)
      if (!rl.allowed) {
        throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Too many requests. Please try again later.' })
      }

      const booking = await prisma.booking.findUnique({
        where: { reference: input.reference },
        include: {
          property: {
            select: {
              name: true,
              address: true,
              slug: true,
              checkInFrom: true,
              checkInTo: true,
              checkOutFrom: true,
              checkOutTo: true,
            },
          },
        },
      })

      // Same error for wrong reference OR wrong email — never reveal which
      if (!booking || !timingSafeStringCompare(booking.guestEmail, input.guestEmail)) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' })
      }

      return {
        reference: booking.reference,
        status: booking.status,
        property: booking.property,
        checkIn: toDateString(booking.checkIn),
        checkOut: toDateString(booking.checkOut),
        nights: booking.nights,
        guestName: booking.guestName,
        guestCount: booking.guestCount,
        totalCents: booking.totalCents,
        currency: booking.currency,
        confirmedAt: booking.confirmedAt?.toISOString() ?? null,
      }
    }),

  /**
   * Guest cancels their booking. Email must match for verification.
   */
  cancel: publicProcedure
    .input(
      z.object({
        reference: z.string(),
        guestEmail: z.string().email(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Rate limit: 5 cancellation attempts per hour per IP
      const rl = await checkRateLimit(`rl:booking:cancel:${ctx.ip}`, 5, 3600)
      if (!rl.allowed) {
        throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Too many requests. Please try again later.' })
      }

      const booking = await prisma.booking.findUnique({
        where: { reference: input.reference },
      })

      if (!booking) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' })
      }

      // Timing-safe email comparison
      if (!timingSafeStringCompare(booking.guestEmail, input.guestEmail)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Email does not match this booking' })
      }

      if (booking.status !== 'CONFIRMED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Booking is not in a cancellable state',
        })
      }

      // Set to CANCELLING, then issue Stripe refund
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CANCELLING',
          cancellationReason: 'Guest requested cancellation',
        },
      })

      // Issue Stripe refund if payment was made, then set booking CANCELLED immediately.
      // Do NOT rely on the charge.refunded webhook — if Stripe throws, the booking
      // would be stuck CANCELLING forever. Log Stripe failures for admin follow-up.
      let refundFailed = false
      if (booking.stripeChargeId) {
        try {
          await stripe.refunds.create({
            charge: booking.stripeChargeId,
          })
        } catch (err) {
          refundFailed = true
          console.error(
            `[bookings.cancel] Stripe refund failed for ${booking.reference}:`,
            err
          )
        }
      }

      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
      })

      return { success: true, refundCents: booking.totalCents, refundFailed }
    }),
})
