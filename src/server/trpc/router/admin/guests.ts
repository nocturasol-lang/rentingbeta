import { z } from 'zod'
import { router, protectedProcedure } from '../../trpc'
import { prisma } from '@/server/db'
import { toDateString } from '@/lib/date-utils'

export const adminGuestsRouter = router({
  /** Searchable guest list with pagination */
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        nationality: z.string().optional(),
        page: z.number().int().default(1),
        limit: z.number().int().max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const where: Record<string, unknown> = {}
      if (input.nationality) where.guestNationality = input.nationality

      const bookings = await prisma.booking.findMany({
        where,
        select: {
          guestName: true,
          guestEmail: true,
          guestPhone: true,
          guestNationality: true,
          totalCents: true,
          status: true,
          checkIn: true,
        },
        orderBy: { createdAt: 'desc' },
      })

      // Group bookings by email to get unique guests
      const guestMap = new Map<
        string,
        {
          name: string
          email: string
          phone: string | null
          nationality: string | null
          bookingCount: number
          totalSpendCents: number
          lastBookingAt: string | null
        }
      >()

      for (const b of bookings) {
        if (input.search) {
          const s = input.search.toLowerCase()
          const matches =
            b.guestName.toLowerCase().includes(s) ||
            b.guestEmail.toLowerCase().includes(s) ||
            (b.guestPhone && b.guestPhone.includes(s))
          if (!matches) continue
        }

        const existing = guestMap.get(b.guestEmail)
        if (existing) {
          existing.bookingCount += 1
          if (b.status === 'CONFIRMED') {
            existing.totalSpendCents += b.totalCents
          }
          const checkInStr = b.checkIn.toISOString()
          if (!existing.lastBookingAt || checkInStr > existing.lastBookingAt) {
            existing.lastBookingAt = checkInStr
          }
        } else {
          guestMap.set(b.guestEmail, {
            name: b.guestName,
            email: b.guestEmail,
            phone: b.guestPhone,
            nationality: b.guestNationality,
            bookingCount: 1,
            totalSpendCents: b.status === 'CONFIRMED' ? b.totalCents : 0,
            lastBookingAt: b.checkIn.toISOString(),
          })
        }
      }

      const guests = Array.from(guestMap.entries())
        .map(([, g]) => ({
          ...g,
          isRepeat: g.bookingCount > 1,
        }))
        .sort((a, b) => (b.lastBookingAt ?? '').localeCompare(a.lastBookingAt ?? ''))

      const total = guests.length
      const pages = Math.ceil(total / input.limit)
      const start = (input.page - 1) * input.limit
      const paged = guests.slice(start, start + input.limit)

      return { guests: paged, total, pages }
    }),

  /** Guest detail: all bookings for an email */
  getByEmail: protectedProcedure
    .input(z.object({ email: z.string() }))
    .query(async ({ input }) => {
      const bookings = await prisma.booking.findMany({
        where: { guestEmail: input.email },
        include: {
          property: { select: { name: true } },
        },
        orderBy: { checkIn: 'desc' },
      })

      if (bookings.length === 0) return null

      const first = bookings[bookings.length - 1]
      const totalSpendCents = bookings
        .filter((b) => b.status === 'CONFIRMED')
        .reduce((sum, b) => sum + b.totalCents, 0)

      return {
        name: first.guestName,
        email: first.guestEmail,
        phone: first.guestPhone,
        nationality: first.guestNationality,
        residenceCountry: first.guestResidenceCountry,
        bookingCount: bookings.length,
        totalSpendCents,
        isRepeat: bookings.length > 1,
        bookings: bookings.map((b) => ({
          ...b,
          checkIn: toDateString(b.checkIn),
          checkOut: toDateString(b.checkOut),
        })),
      }
    }),

  /** Aggregate guest stats */
  aggregateStats: protectedProcedure.query(async () => {
    const bookings = await prisma.booking.findMany({
      where: { status: 'CONFIRMED' },
      select: {
        guestEmail: true,
        guestName: true,
        guestNationality: true,
      },
    })

    const guestCounts = new Map<string, number>()
    const nationalityCounts = new Map<string, number>()

    for (const b of bookings) {
      guestCounts.set(b.guestEmail, (guestCounts.get(b.guestEmail) || 0) + 1)
      if (b.guestNationality) {
        nationalityCounts.set(
          b.guestNationality,
          (nationalityCounts.get(b.guestNationality) || 0) + 1
        )
      }
    }

    const totalGuests = guestCounts.size
    const repeatGuests = [...guestCounts.values()].filter((c) => c > 1).length
    const topNationalities = [...nationalityCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([code, count]) => ({ code, count }))

    const topGuests = [...guestCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([email, count]) => {
        const booking = bookings.find((b) => b.guestEmail === email)
        return { email, name: booking?.guestName ?? '', count }
      })

    return {
      totalGuests,
      repeatGuests,
      repeatPercentage: totalGuests > 0 ? (repeatGuests / totalGuests) * 100 : 0,
      topNationalities,
      topGuests,
    }
  }),
})
