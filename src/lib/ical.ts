import ICAL from 'ical.js'

export interface IcalEvent {
  uid: string
  checkIn: Date
  checkOut: Date
  summary: string | null
}

/**
 * Parse an iCal (.ics) text into an array of events.
 * Used by the BullMQ worker to import Booking.com reservations.
 *
 * Each event has a unique UID, check-in/check-out dates, and an optional summary.
 * Booking.com uses all-day events (DATE not DATETIME) — ical.js handles this correctly.
 */
export function parseIcal(icsText: string): IcalEvent[] {
  const jcal = ICAL.parse(icsText)
  const comp = new ICAL.Component(jcal)
  const vevents = comp.getAllSubcomponents('vevent')

  return vevents
    .map((vevent: ICAL.Component) => {
      const event = new ICAL.Event(vevent)
      return {
        uid: event.uid,
        checkIn: event.startDate.toJSDate(),
        checkOut: event.endDate.toJSDate(),
        summary: event.summary ?? null,
      }
    })
    .filter((e: IcalEvent) => e.uid && e.checkIn && e.checkOut)
}
