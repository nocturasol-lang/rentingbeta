import { NextRequest } from 'next/server'
import { prisma } from '@/server/db'
import { generateIcal } from '@/lib/ical-export'

/**
 * Public iCal export feed for a property.
 * Booking.com imports this URL to block dates booked on our platform.
 *
 * GET /api/ical/{propertyId} → text/calendar (.ics)
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  const { propertyId } = await params

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { slug: true },
  })

  if (!property) {
    return new Response('Property not found', { status: 404 })
  }

  const bookings = await prisma.booking.findMany({
    where: {
      propertyId,
      status: { in: ['CONFIRMED', 'PENDING'] },
      checkOut: { gte: new Date() },
    },
    select: {
      id: true,
      checkIn: true,
      checkOut: true,
      status: true,
    },
    orderBy: { checkIn: 'asc' },
  })

  const ics = generateIcal(property.slug, bookings)

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${property.slug}.ics"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
