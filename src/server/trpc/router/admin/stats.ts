import { subMonths, format, eachMonthOfInterval, startOfMonth, startOfYear } from 'date-fns'
import { router, protectedProcedure } from '../../trpc'
import { prisma } from '@/server/db'

export const adminStatsRouter = router({
  overview: protectedProcedure.query(async () => {
    const now = new Date()
    const firstOfMonth = startOfMonth(now)
    const firstOfJan = startOfYear(now)

    const [
      totalAgg,
      confirmedAgg,
      cancelledCount,
      monthlyAgg,
      ytdAgg,
      properties,
      avgStats,
      bySource,
    ] = await Promise.all([
      // Total booking count
      prisma.booking.count(),

      // All-time confirmed: revenue + nights
      prisma.booking.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { totalCents: true, nights: true },
        _count: true,
      }),

      // Cancelled count
      prisma.booking.count({ where: { status: 'CANCELLED' } }),

      // This month's confirmed bookings
      prisma.booking.aggregate({
        where: { status: 'CONFIRMED', checkIn: { gte: firstOfMonth } },
        _sum: { totalCents: true },
        _count: true,
      }),

      // YTD confirmed bookings
      prisma.booking.aggregate({
        where: { status: 'CONFIRMED', checkIn: { gte: firstOfJan } },
        _sum: { totalCents: true },
        _count: true,
      }),

      // Active property count
      prisma.property.count({ where: { isActive: true } }),

      // Average lead time and stay length — bounded to last 24 months to prevent unbounded memory growth
      prisma.booking.findMany({
        where: { status: 'CONFIRMED', checkIn: { gte: subMonths(startOfMonth(now), 23) } },
        select: { checkIn: true, createdAt: true, nights: true },
      }),

      // Booking source breakdown
      prisma.booking.groupBy({
        by: ['source'],
        where: { status: 'CONFIRMED' },
        _count: true,
      }),
    ])

    const totalRevenueCents = confirmedAgg._sum.totalCents ?? 0
    const occupiedNights = confirmedAgg._sum.nights ?? 0
    const confirmedCount = confirmedAgg._count
    const totalDays = properties * 365.25
    const occupancyRate = totalDays > 0 ? (occupiedNights / totalDays) * 100 : 0
    const adrCents = occupiedNights > 0 ? Math.round(totalRevenueCents / occupiedNights) : 0

    const avgStayLength = confirmedCount > 0
      ? avgStats.reduce((sum, b) => sum + b.nights, 0) / confirmedCount
      : 0

    const avgLeadTime = confirmedCount > 0
      ? avgStats.reduce(
          (sum, b) => sum + (b.checkIn.getTime() - b.createdAt.getTime()) / (1000 * 60 * 60 * 24),
          0
        ) / confirmedCount
      : 0

    const cancellationRate = totalAgg > 0 ? (cancelledCount / totalAgg) * 100 : 0

    const sourceMap = Object.fromEntries(bySource.map((s) => [s.source, s._count]))

    return {
      totalBookings: totalAgg,
      confirmedCount,
      cancelledCount,
      totalRevenueCents,
      monthlyBookings: monthlyAgg._count,
      monthlyRevenueCents: monthlyAgg._sum.totalCents ?? 0,
      ytdBookings: ytdAgg._count,
      ytdRevenueCents: ytdAgg._sum.totalCents ?? 0,
      occupancyRate,
      adrCents,
      avgStayLength,
      avgLeadTime,
      cancellationRate,
      bySource: {
        DIRECT: sourceMap['DIRECT'] ?? 0,
        BOOKING_COM: sourceMap['BOOKING_COM'] ?? 0,
        MANUAL: sourceMap['MANUAL'] ?? 0,
      },
    }
  }),

  revenueByMonth: protectedProcedure.query(async () => {
    const twelveMonthsAgo = subMonths(startOfMonth(new Date()), 11)

    // DB-side groupBy is not available for DateTime truncation in Prisma without raw SQL,
    // so we fetch only checkIn + totalCents for the relevant window (bounded query, not full table)
    const bookings = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        checkIn: { gte: twelveMonthsAgo },
      },
      select: { checkIn: true, totalCents: true },
    })

    const months = eachMonthOfInterval({ start: twelveMonthsAgo, end: new Date() })

    return months.map((month) => {
      const key = format(month, 'yyyy-MM')
      const monthBookings = bookings.filter((b) => format(b.checkIn, 'yyyy-MM') === key)
      return {
        month: format(month, 'MMM yy'),
        revenueCents: monthBookings.reduce((sum, b) => sum + b.totalCents, 0),
        bookingCount: monthBookings.length,
      }
    })
  }),

  byProperty: protectedProcedure.query(async () => {
    const [grouped, properties] = await Promise.all([
      prisma.booking.groupBy({
        by: ['propertyId'],
        where: { status: 'CONFIRMED' },
        _count: true,
        _sum: { totalCents: true },
      }),
      prisma.property.findMany({
        select: { id: true, name: true },
      }),
    ])

    const groupMap = Object.fromEntries(
      grouped.map((g) => [g.propertyId, { count: g._count, revenueCents: g._sum.totalCents ?? 0 }])
    )

    return properties.map((p) => ({
      id: p.id,
      name: p.name,
      revenueCents: groupMap[p.id]?.revenueCents ?? 0,
      bookingCount: groupMap[p.id]?.count ?? 0,
    }))
  }),
})
