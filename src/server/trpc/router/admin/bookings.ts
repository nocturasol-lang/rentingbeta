import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { differenceInDays } from 'date-fns'
import { router, protectedProcedure, adminProcedure } from '../../trpc'
import { prisma } from '@/server/db'
import { isAvailable } from '@/lib/availability'
import { calculateBookingPrice } from '@/lib/fees'
import { generateReference } from '@/lib/booking-ref'
import { stripe } from '@/lib/stripe'
import { emailQueue } from '@/server/queue/email-queue'
import { redis } from '@/server/redis'
import { toDateString } from '@/lib/date-utils'

export const adminBookingsRouter = router({
  /** List bookings with filters and pagination */
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLING', 'CANCELLED', 'FAILED']).optional(),
        propertyId: z.string().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
        page: z.number().int().default(1),
        limit: z.number().int().max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const where = {
        ...(input.status ? { status: input.status } : {}),
        ...(input.propertyId ? { propertyId: input.propertyId } : {}),
        ...(input.from || input.to
          ? {
              checkIn: {
                ...(input.from ? { gte: new Date(input.from) } : {}),
                ...(input.to ? { lte: new Date(input.to) } : {}),
              },
            }
          : {}),
      }

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where,
          include: {
            property: { select: { name: true, slug: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        prisma.booking.count({ where }),
      ])

      return {
        bookings,
        total,
        pages: Math.ceil(total / input.limit),
      }
    }),

  /** Manually confirm a booking (for manual/cash bookings) */
  confirm: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const booking = await prisma.booking.findUnique({
        where: { id: input.id },
      })

      if (!booking) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' })
      }

      if (booking.status !== 'PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Booking is not in PENDING state',
        })
      }

      return prisma.booking.update({
        where: { id: input.id },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
      })
    }),

  /** Admin manually creates a booking (phone, cash) — immediately CONFIRMED */
  createManual: adminProcedure
    .input(
      z.object({
        propertyId: z.string(),
        checkIn: z.string(),
        checkOut: z.string(),
        guestName: z.string(),
        guestEmail: z.string().email(),
        guestPhone: z.string().optional(),
        guestCount: z.number().int(),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const property = await prisma.property.findUnique({
        where: { id: input.propertyId },
      })

      if (!property) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Property not found' })
      }

      const checkIn = new Date(input.checkIn)
      const checkOut = new Date(input.checkOut)
      const nights = differenceInDays(checkOut, checkIn)

      if (nights < 1) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Check-out must be after check-in' })
      }

      // Still check availability — even admin shouldn't double-book
      const available = await isAvailable(property.id, checkIn, checkOut)
      if (!available) {
        throw new TRPCError({ code: 'CONFLICT', message: 'DATES_UNAVAILABLE' })
      }

      const pricing = calculateBookingPrice(
        property.pricePerNightCents,
        nights,
        property.cleaningFeeCents,
        Number(property.platformFeePercent)
      )

      return prisma.booking.create({
        data: {
          reference: generateReference(),
          propertyId: property.id,
          guestName: input.guestName,
          guestEmail: input.guestEmail,
          guestPhone: input.guestPhone,
          guestCount: input.guestCount,
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
          status: 'CONFIRMED',
          confirmedAt: new Date(),
          source: 'MANUAL',
          adminNotes: input.note ?? null,
        },
      })
    }),

  /** Admin cancels a booking with configurable refund policy */
  cancelBooking: adminProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string(),
        refundPolicy: z.enum(['FULL', 'FIRST_NIGHT', 'NONE']),
      })
    )
    .mutation(async ({ input }) => {
      const booking = await prisma.booking.findUnique({
        where: { id: input.id },
        include: { property: true },
      })

      if (!booking) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' })
      }

      if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Booking is not in a cancellable state',
        })
      }

      // Compute refund amount based on policy
      let refundCents = 0
      if (input.refundPolicy === 'FULL') {
        refundCents = booking.totalCents
      } else if (input.refundPolicy === 'FIRST_NIGHT') {
        refundCents = booking.totalCents - booking.pricePerNightCents
      }
      // NONE = 0

      // Issue Stripe refund if there was a charge and refund > 0
      if (booking.stripeChargeId && refundCents > 0) {
        await stripe.refunds.create({
          charge: booking.stripeChargeId,
          amount: refundCents,
        })
      }

      // Update booking status
      await prisma.booking.update({
        where: { id: input.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: input.reason,
        },
      })

      // Release Redis lock — PENDING bookings hold a lock that must be freed
      const lockKey = `lock:property:${booking.propertyId}:${toDateString(booking.checkIn)}:${toDateString(booking.checkOut)}`
      await redis.del(lockKey)

      // Queue cancellation email to guest
      await emailQueue.add('cancellation-email', {
        to: booking.guestEmail,
        bookingId: booking.id,
        refundAmount: refundCents,
        refundPolicy: input.refundPolicy,
      })

      return { success: true, refundCents }
    }),

  /** Admin sends a custom email to a booking's guest */
  sendEmail: adminProcedure
    .input(
      z.object({
        bookingId: z.string(),
        subject: z.string().min(1),
        body: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const booking = await prisma.booking.findUnique({
        where: { id: input.bookingId },
      })

      if (!booking) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' })
      }

      await emailQueue.add('custom-email', {
        to: booking.guestEmail,
        bookingId: booking.id,
        subject: input.subject,
        body: input.body,
      })

      return { success: true }
    }),

  /** Re-send the booking confirmation email */
  resendConfirmation: adminProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(async ({ input }) => {
      const booking = await prisma.booking.findUnique({
        where: { id: input.bookingId },
      })

      if (!booking) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' })
      }

      await emailQueue.add('booking-confirmation', {
        to: booking.guestEmail,
        bookingId: booking.id,
      })

      return { success: true }
    }),

  /** Send check-in instructions email */
  sendCheckinInstructions: adminProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(async ({ input }) => {
      const booking = await prisma.booking.findUnique({
        where: { id: input.bookingId },
      })

      if (!booking) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' })
      }

      await emailQueue.add('checkin-instructions', {
        to: booking.guestEmail,
        bookingId: booking.id,
      })

      return { success: true }
    }),
})
