import { Worker, Queue } from 'bullmq'
import { createRedisConnection } from '../redis'
import { prisma } from '../db'
import { emailQueue } from './email-queue'
import { addDays, startOfDay, endOfDay } from 'date-fns'

const connection = createRedisConnection()

export const checkinReminderQueue = new Queue('checkin-reminder', { connection })

/**
 * Finds CONFIRMED bookings with checkIn exactly 3 days from now
 * and enqueues check-in instruction emails.
 *
 * Runs once daily. Uses a Redis dedup key per booking to ensure
 * the email is never sent more than once even if the job runs twice.
 *
 * Scheduled every 24 hours via BullMQ repeatable jobs.
 */
export async function scheduleCheckinReminders() {
  await checkinReminderQueue.add(
    'send-checkin-reminders',
    {},
    {
      repeat: { every: 24 * 60 * 60 * 1000 }, // once per day
      jobId: 'checkin-reminder-daily',
    }
  )
}

export const checkinReminderWorker = new Worker(
  'checkin-reminder',
  async () => {
    const targetDate = addDays(new Date(), 3)
    const from = startOfDay(targetDate)
    const to = endOfDay(targetDate)

    const bookings = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        checkIn: { gte: from, lte: to },
      },
      select: { id: true, guestEmail: true, reference: true },
    })

    if (bookings.length === 0) return

    console.log(`[checkin-reminder] Sending instructions to ${bookings.length} booking(s) checking in on ${from.toISOString().slice(0, 10)}`)

    for (const booking of bookings) {
      await emailQueue.add(
        'checkin-instructions',
        { to: booking.guestEmail, bookingId: booking.id },
        {
          // Dedup: BullMQ will skip if a job with this ID already exists in the queue
          jobId: `checkin-instructions:${booking.id}`,
        }
      )
      console.log(`[checkin-reminder] Queued instructions for ${booking.reference}`)
    }
  },
  { connection: createRedisConnection() }
)
