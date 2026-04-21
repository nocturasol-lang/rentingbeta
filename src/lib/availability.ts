import { differenceInDays } from 'date-fns'
import { prisma } from '@/server/db'

/**
 * Check if a property is available for a given date range.
 *
 * Checks FOUR sources:
 * 1. Existing bookings (PENDING, CONFIRMED, CANCELLING) — our direct bookings
 * 2. External blocks — dates imported from Booking.com via iCal
 * 3. Availability rules — BLOCKED type (maintenance, owner use)
 * 4. Availability rules — MIN_STAY type (requested stay is shorter than required minimum)
 *
 * All four must be clear for the dates to be available.
 */
export async function isAvailable(
  propertyId: string,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string
): Promise<boolean> {

  const nights = differenceInDays(checkOut, checkIn)

  const [conflictingBooking, conflictingBlock, conflictingRule, minStayRules] = await Promise.all([
    // Check 1: confirmed or pending direct bookings, plus cancellations in progress
    // CANCELLING stays blocked until Stripe refund completes to avoid double-booking
    prisma.booking.findFirst({
      where: {
        propertyId,
        status: { in: ['CONFIRMED', 'PENDING', 'CANCELLING'] },
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        AND: [
          { checkIn: { lt: checkOut } },
          { checkOut: { gt: checkIn } },
        ],
      },
    }),
    // Check 2: external blocks from Booking.com iCal
    prisma.externalBlock.findFirst({
      where: {
        propertyId,
        AND: [
          { checkIn: { lt: checkOut } },
          { checkOut: { gt: checkIn } },
        ],
      },
    }),
    // Check 3: admin-set blocked dates
    prisma.availabilityRule.findFirst({
      where: {
        propertyId,
        type: 'BLOCKED',
        AND: [
          { startDate: { lt: checkOut } },
          { endDate: { gt: checkIn } },
        ],
      },
    }),
    // Check 4: MIN_STAY rules that overlap this date range
    // Fetch all overlapping MIN_STAY rules — any with minNights > requested nights blocks the booking
    prisma.availabilityRule.findMany({
      where: {
        propertyId,
        type: 'MIN_STAY',
        minNights: { not: null },
        AND: [
          { startDate: { lt: checkOut } },
          { endDate: { gt: checkIn } },
        ],
      },
      select: { minNights: true },
    }),
  ])

  // If any overlapping MIN_STAY rule requires more nights than requested, block it
  const violatesMinStay = minStayRules.some((r) => (r.minNights ?? 0) > nights)

  return !conflictingBooking && !conflictingBlock && !conflictingRule && !violatesMinStay
}
