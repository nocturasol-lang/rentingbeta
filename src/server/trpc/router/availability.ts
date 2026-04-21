import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure } from '../trpc'
import { prisma } from '@/server/db'
import { isAvailable } from '@/lib/availability'
import { calculateBookingPrice } from '@/lib/fees'
import { differenceInDays } from 'date-fns'
import { checkRateLimit } from '@/lib/rate-limit'

export const availabilityRouter = router({
  /**
   * Check if dates are free and return price breakdown.
   * Called by guests before booking — public, no auth needed.
   */
  check: publicProcedure
    .input(
      z.object({
        propertyId: z.string(),
        checkIn: z.string(),  // "2025-07-15"
        checkOut: z.string(), // "2025-07-20"
      })
    )
    .query(async ({ input, ctx }) => {
      // Rate limit: 30 checks per minute per IP (skip for server-side renders)
      if (!ctx.isServer) {
        const rl = await checkRateLimit(`rl:availability:${ctx.ip}`, 30, 60)
        if (!rl.allowed) {
          throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Too many requests. Please try again later.' })
        }
      }

      const property = await prisma.property.findUnique({
        where: { id: input.propertyId, isActive: true },
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

      if (nights < property.minNights) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Minimum stay is ${property.minNights} nights`,
        })
      }

      const available = await isAvailable(property.id, checkIn, checkOut)

      if (!available) {
        return { available: false, nights, breakdown: null }
      }

      const breakdown = calculateBookingPrice(
        property.pricePerNightCents,
        nights,
        property.cleaningFeeCents,
        Number(property.platformFeePercent)
      )

      return {
        available: true,
        nights,
        breakdown: {
          pricePerNightCents: property.pricePerNightCents,
          nightsTotalCents: breakdown.nightsTotal,
          cleaningFeeCents: breakdown.cleaningFee,
          platformFeeCents: breakdown.platformFee,
          ownerPayoutCents: breakdown.ownerPayout,
          totalCents: breakdown.total,
          currency: property.currency,
        },
      }
    }),
})
