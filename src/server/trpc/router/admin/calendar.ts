import { z } from 'zod'
import { router, protectedProcedure } from '../../trpc'
import { prisma } from '@/server/db'
import { toDateString } from '@/lib/date-utils'

// Property colors for calendar display
const PROPERTY_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']

export const adminCalendarRouter = router({
  /** Get all events for all properties in a date range — powers master calendar */
  getRange: protectedProcedure
    .input(
      z.object({
        from: z.string(),
        to: z.string(),
      })
    )
    .query(async ({ input }) => {
      const from = new Date(input.from)
      const to = new Date(input.to)

      const properties = await prisma.property.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true },
        orderBy: { name: 'asc' },
      })

      const result = await Promise.all(
        properties.map(async (property, index) => {
          const [bookings, externalBlocks, availabilityRules] = await Promise.all([
            prisma.booking.findMany({
              where: {
                propertyId: property.id,
                status: { in: ['PENDING', 'CONFIRMED'] },
                checkIn: { lte: to },
                checkOut: { gte: from },
              },
            }),
            prisma.externalBlock.findMany({
              where: {
                propertyId: property.id,
                checkIn: { lte: to },
                checkOut: { gte: from },
              },
            }),
            prisma.availabilityRule.findMany({
              where: {
                propertyId: property.id,
                startDate: { lte: to },
                endDate: { gte: from },
              },
            }),
          ])

          const events = [
            ...bookings.map((b) => ({
              type: 'BOOKING' as const,
              checkIn: toDateString(b.checkIn),
              checkOut: toDateString(b.checkOut),
              label: b.guestName,
              status: b.status,
              bookingId: b.id,
              reference: b.reference,
              source: b.source,
            })),
            ...externalBlocks.map((b) => ({
              type: 'EXTERNAL_BLOCK' as const,
              checkIn: toDateString(b.checkIn),
              checkOut: toDateString(b.checkOut),
              label: b.summary ?? 'Booking.com',
              source: b.source,
            })),
            ...availabilityRules.map((r) => ({
              type: 'AVAILABILITY_RULE' as const,
              checkIn: toDateString(r.startDate),
              checkOut: toDateString(r.endDate),
              label: r.note ?? 'Blocked',
            })),
          ]

          return {
            propertyId: property.id,
            propertyName: property.name,
            propertySlug: property.slug,
            color: PROPERTY_COLORS[index % PROPERTY_COLORS.length],
            events,
          }
        })
      )

      return result
    }),
})
