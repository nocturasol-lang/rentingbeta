import { z } from 'zod'
import { router, protectedProcedure } from '../../trpc'
import { prisma } from '@/server/db'
import { toDateString } from '@/lib/date-utils'

export const adminReportsRouter = router({
  /** Guest manifest for police compliance — all confirmed guests in date range */
  getGuestManifest: protectedProcedure
    .input(
      z.object({
        from: z.string(),
        to: z.string(),
      })
    )
    .query(async ({ input }) => {
      const from = new Date(input.from)
      const to = new Date(input.to)

      const bookings = await prisma.booking.findMany({
        where: {
          status: 'CONFIRMED',
          checkIn: { gte: from, lte: to },
        },
        include: {
          property: { select: { name: true } },
        },
        orderBy: { checkIn: 'asc' },
      })

      return bookings.map((b) => ({
        guestName: b.guestName,
        guestIdNumber: b.guestIdNumber ?? '',
        guestIdType: b.guestIdType ?? '',
        guestNationality: b.guestNationality ?? '',
        guestDateOfBirth: b.guestDateOfBirth ? toDateString(b.guestDateOfBirth) : '',
        guestResidenceCountry: b.guestResidenceCountry ?? '',
        propertyName: b.property.name,
        checkIn: toDateString(b.checkIn),
        checkOut: toDateString(b.checkOut),
        nights: b.nights,
        guestCount: b.guestCount,
        reference: b.reference,
      }))
    }),

  /** Financial summary for a date range */
  getFinancialSummary: protectedProcedure
    .input(
      z.object({
        from: z.string(),
        to: z.string(),
      })
    )
    .query(async ({ input }) => {
      const from = new Date(input.from)
      const to = new Date(input.to)

      const bookings = await prisma.booking.findMany({
        where: {
          checkIn: { gte: from, lte: to },
        },
        include: {
          property: { select: { id: true, name: true } },
        },
      })

      const confirmed = bookings.filter((b) => b.status === 'CONFIRMED')
      const cancelled = bookings.filter((b) => b.status === 'CANCELLED')

      const totalRevenueCents = confirmed.reduce((sum, b) => sum + b.totalCents, 0)
      const totalPlatformFeeCents = confirmed.reduce((sum, b) => sum + b.platformFeeCents, 0)
      const totalOwnerPayoutCents = confirmed.reduce((sum, b) => sum + b.ownerPayoutCents, 0)
      const cancellationRate = bookings.length > 0
        ? (cancelled.length / bookings.length) * 100
        : 0

      // Per-property breakdown
      const propertyMap = new Map<string, {
        name: string
        bookings: number
        revenueCents: number
        platformFeeCents: number
        ownerPayoutCents: number
        nights: number
      }>()

      for (const b of confirmed) {
        const existing = propertyMap.get(b.propertyId)
        if (existing) {
          existing.bookings += 1
          existing.revenueCents += b.totalCents
          existing.platformFeeCents += b.platformFeeCents
          existing.ownerPayoutCents += b.ownerPayoutCents
          existing.nights += b.nights
        } else {
          propertyMap.set(b.propertyId, {
            name: b.property.name,
            bookings: 1,
            revenueCents: b.totalCents,
            platformFeeCents: b.platformFeeCents,
            ownerPayoutCents: b.ownerPayoutCents,
            nights: b.nights,
          })
        }
      }

      return {
        totalBookings: bookings.length,
        confirmedCount: confirmed.length,
        cancelledCount: cancelled.length,
        totalRevenueCents,
        totalPlatformFeeCents,
        totalOwnerPayoutCents,
        cancellationRate,
        byProperty: Array.from(propertyMap.entries()).map(([id, data]) => ({
          propertyId: id,
          ...data,
        })),
      }
    }),

  /** Accommodation tax report — Greece charges per night for short-term rentals */
  getAccommodationTax: protectedProcedure
    .input(
      z.object({
        from: z.string(),
        to: z.string(),
        taxRateCents: z.number().int().min(0).default(150), // €1.50 default
      })
    )
    .query(async ({ input }) => {
      const from = new Date(input.from)
      const to = new Date(input.to)

      const bookings = await prisma.booking.findMany({
        where: {
          status: 'CONFIRMED',
          checkIn: { gte: from, lte: to },
        },
        include: {
          property: { select: { id: true, name: true } },
        },
        orderBy: { checkIn: 'asc' },
      })

      const totalNights = bookings.reduce((sum, b) => sum + b.nights, 0)
      const taxOwedCents = totalNights * input.taxRateCents

      // Per-property breakdown
      const propertyMap = new Map<string, { name: string; nights: number; taxCents: number }>()
      for (const b of bookings) {
        const existing = propertyMap.get(b.propertyId)
        if (existing) {
          existing.nights += b.nights
          existing.taxCents += b.nights * input.taxRateCents
        } else {
          propertyMap.set(b.propertyId, {
            name: b.property.name,
            nights: b.nights,
            taxCents: b.nights * input.taxRateCents,
          })
        }
      }

      return {
        totalNights,
        taxRateCents: input.taxRateCents,
        taxOwedCents,
        bookingCount: bookings.length,
        byProperty: Array.from(propertyMap.entries()).map(([id, data]) => ({
          propertyId: id,
          ...data,
        })),
      }
    }),
})
