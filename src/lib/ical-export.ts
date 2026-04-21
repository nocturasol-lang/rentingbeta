import { toDateString } from '@/lib/date-utils'

interface ExportBooking {
  id: string
  checkIn: Date
  checkOut: Date
  status: string
}

/**
 * Generate a .ics calendar feed from bookings.
 * Booking.com imports this to block dates booked on our platform.
 *
 * Uses DATE (not DATETIME) values — standard for all-day booking events.
 */
export function generateIcal(propertySlug: string, bookings: ExportBooking[]): string {
  const now = new Date()
  const timestamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

  const events = bookings.map((b) => {
    const dtstart = toDateString(b.checkIn).replace(/-/g, '')
    const dtend = toDateString(b.checkOut).replace(/-/g, '')

    return [
      'BEGIN:VEVENT',
      `UID:${b.id}@georgiascosyrooms.gr`,
      `DTSTART;VALUE=DATE:${dtstart}`,
      `DTEND;VALUE=DATE:${dtend}`,
      `SUMMARY:Booked — Direct`,
      `DTSTAMP:${timestamp}`,
      `STATUS:CONFIRMED`,
      'END:VEVENT',
    ].join('\r\n')
  })

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//Georgia's Cozy Rooms//${propertySlug}//EN`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Georgia's Cozy Rooms — ${propertySlug}`,
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')
}
