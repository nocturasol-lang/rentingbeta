import { Worker, Queue } from 'bullmq'
import { createRedisConnection } from '../redis'
import { prisma } from '../db'
import { parseIcal } from '../../lib/ical'

const connection = createRedisConnection()

export const icalQueue = new Queue('ical-sync', { connection })

/**
 * Schedule the iCal sync to run every 15 minutes.
 * Uses a deduplicated jobId so only one scheduled job exists.
 */
export async function scheduleIcalSync() {
  await icalQueue.add(
    'sync-all',
    {},
    {
      repeat: {
        every: Number(process.env.ICAL_POLL_INTERVAL_MS) || 900000,
      },
      jobId: 'ical-sync-all',
    }
  )
}

/**
 * Add a manual sync job for a specific property or all properties.
 */
export async function triggerManualSync(propertyId?: string) {
  const job = await icalQueue.add('sync-manual', { propertyId })
  return job.id
}

/**
 * The BullMQ worker that actually does the syncing.
 *
 * For each active property with an iCal URL:
 * 1. Fetch the .ics file from Booking.com
 * 2. Parse it into events
 * 3. Upsert each event into external_blocks
 * 4. Update the property's sync status
 */
export const icalWorker = new Worker(
  'ical-sync',
  async (job) => {
    const specificPropertyId = job.data?.propertyId as string | undefined

    const whereClause = {
      isActive: true,
      icalUrl: { not: null },
      ...(specificPropertyId ? { id: specificPropertyId } : {}),
    }

    const properties = await prisma.property.findMany({
      where: whereClause,
      select: { id: true, icalUrl: true, name: true },
    })

    console.log(`[ical-sync] Syncing ${properties.length} properties`)

    for (const property of properties) {
      try {
        await syncProperty(property.id, property.icalUrl!)
        console.log(`[ical-sync] OK ${property.name}`)
      } catch (err) {
        console.error(`[ical-sync] FAIL ${property.name}:`, err)
        // Continue to next property even if one fails
      }
    }
  },
  { connection: createRedisConnection() }
)

async function syncProperty(propertyId: string, icalUrl: string) {
  // Mark as syncing
  await prisma.property.update({
    where: { id: propertyId },
    data: { icalSyncStatus: 'SYNCING' },
  })

  try {
    // Fetch with 10 second timeout
    const response = await fetch(icalUrl, {
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      throw new Error(`iCal fetch failed: ${response.status} ${response.statusText}`)
    }

    const icsText = await response.text()

    // Validate it's actually an iCal feed before parsing
    if (!icsText.includes('BEGIN:VCALENDAR')) {
      throw new Error(`iCal response is not a valid calendar feed (missing BEGIN:VCALENDAR)`)
    }

    const events = parseIcal(icsText)
    const hasVEvents = icsText.includes('BEGIN:VEVENT')

    // If the feed has VEVENT entries but we parsed none, the parser silently failed
    if (hasVEvents && events.length === 0) {
      throw new Error(`iCal parsed 0 events from a feed containing VEVENT entries — possible format issue`)
    }

    console.log(`[ical-sync] Parsed ${events.length} events for property ${propertyId}`)

    // Upsert all events — insert new, update changed
    for (const event of events) {
      await prisma.externalBlock.upsert({
        where: {
          propertyId_externalId_source: {
            propertyId,
            externalId: event.uid,
            source: 'booking_com',
          },
        },
        update: {
          checkIn: event.checkIn,
          checkOut: event.checkOut,
          summary: event.summary,
          updatedAt: new Date(),
        },
        create: {
          propertyId,
          source: 'booking_com',
          externalId: event.uid,
          checkIn: event.checkIn,
          checkOut: event.checkOut,
          summary: event.summary,
        },
      })
    }

    // Mark success
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        icalLastSyncedAt: new Date(),
        icalSyncStatus: 'SUCCESS',
      },
    })
  } catch (error) {
    // Mark error — BullMQ will retry
    await prisma.property.update({
      where: { id: propertyId },
      data: { icalSyncStatus: 'ERROR' },
    })
    throw error
  }
}
