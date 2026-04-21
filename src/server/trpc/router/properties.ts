import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure } from '../trpc'
import { prisma } from '@/server/db'
import { isAvailable } from '@/lib/availability'
import { toDateString } from '@/lib/date-utils'
import { checkRateLimit } from '@/lib/rate-limit'

export const propertiesRouter = router({
  /**
   * List all active properties — powers the homepage.
   * Optionally filter by date availability and guest count.
   */
  list: publicProcedure
    .input(
      z
        .object({
          checkIn: z.string().optional(),
          checkOut: z.string().optional(),
          guests: z.number().int().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      // Rate limit: 30 requests per minute per IP (skip for server-side renders)
      if (!ctx.isServer) {
        const rl = await checkRateLimit(`rl:properties:list:${ctx.ip}`, 30, 60)
        if (!rl.allowed) {
          throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Too many requests. Please try again later.' })
        }
      }

      const properties = await prisma.property.findMany({
        where: {
          isActive: true,
          ...(input?.guests ? { maxGuests: { gte: input.guests } } : {}),
        },
        include: {
          images: {
            orderBy: { position: 'asc' },
            take: 5,
          },
        },
        orderBy: { name: 'asc' },
      })

      const results = await Promise.all(
        properties.map(async (p) => {
          let available: boolean | null = null

          if (input?.checkIn && input?.checkOut) {
            available = await isAvailable(
              p.id,
              new Date(input.checkIn),
              new Date(input.checkOut)
            )
          }

          return {
            id: p.id,
            slug: p.slug,
            name: p.name,
            description: p.description.substring(0, 200),
            pricePerNightCents: p.pricePerNightCents,
            cleaningFeeCents: p.cleaningFeeCents,
            currency: p.currency,
            maxGuests: p.maxGuests,
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
            size: p.size,
            amenities: p.amenities,
            images: p.images.map((img) => ({ url: img.url, alt: img.alt })),
            reviewScore: p.reviewScore,
            reviewCount: p.reviewCount,
            beachDistanceM: p.beachDistanceM,
            available,
          }
        })
      )

      return results
    }),

  /**
   * Get full property detail by slug — powers the property detail page.
   */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      // Rate limit: 30 requests per minute per IP (skip for server-side renders)
      if (!ctx.isServer) {
        const rl = await checkRateLimit(`rl:properties:detail:${ctx.ip}`, 30, 60)
        if (!rl.allowed) {
          throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Too many requests. Please try again later.' })
        }
      }

      const property = await prisma.property.findUnique({
        where: { slug: input.slug, isActive: true },
        include: {
          images: { orderBy: { position: 'asc' } },
        },
      })

      if (!property) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Property not found' })
      }

      // Get all blocked date ranges for the next 12 months (for calendar display)
      const now = new Date()
      const twelveMonthsFromNow = new Date()
      twelveMonthsFromNow.setMonth(twelveMonthsFromNow.getMonth() + 12)

      const [bookings, externalBlocks, availabilityRules] = await Promise.all([
        prisma.booking.findMany({
          where: {
            propertyId: property.id,
            status: { in: ['CONFIRMED', 'PENDING'] },
            checkOut: { gte: now },
            checkIn: { lte: twelveMonthsFromNow },
          },
          select: { checkIn: true, checkOut: true },
        }),
        prisma.externalBlock.findMany({
          where: {
            propertyId: property.id,
            checkOut: { gte: now },
            checkIn: { lte: twelveMonthsFromNow },
          },
          select: { checkIn: true, checkOut: true, source: true },
        }),
        prisma.availabilityRule.findMany({
          where: {
            propertyId: property.id,
            type: 'BLOCKED',
            endDate: { gte: now },
            startDate: { lte: twelveMonthsFromNow },
          },
          select: { startDate: true, endDate: true },
        }),
      ])

      const blockedRanges = [
        ...bookings.map((b) => ({
          checkIn: toDateString(b.checkIn),
          checkOut: toDateString(b.checkOut),
          source: 'booking',
        })),
        ...externalBlocks.map((b) => ({
          checkIn: toDateString(b.checkIn),
          checkOut: toDateString(b.checkOut),
          source: b.source,
        })),
        ...availabilityRules.map((r) => ({
          checkIn: toDateString(r.startDate),
          checkOut: toDateString(r.endDate),
          source: 'admin_block',
        })),
      ]

      return {
        id: property.id,
        slug: property.slug,
        name: property.name,
        description: property.description,
        address: property.address,
        pricePerNightCents: property.pricePerNightCents,
        cleaningFeeCents: property.cleaningFeeCents,
        currency: property.currency,
        maxGuests: property.maxGuests,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        size: property.size,
        amenities: property.amenities,
        images: property.images.map((i) => ({
          url: i.url,
          alt: i.alt,
          position: i.position,
        })),
        reviewScore: property.reviewScore,
        reviewCount: property.reviewCount,
        checkInFrom: property.checkInFrom,
        checkInTo: property.checkInTo,
        checkOutFrom: property.checkOutFrom,
        checkOutTo: property.checkOutTo,
        minNights: property.minNights,
        licenseNumber: property.licenseNumber,
        cancellationPolicy: property.cancellationPolicy,
        blockedRanges,
      }
    }),
})
