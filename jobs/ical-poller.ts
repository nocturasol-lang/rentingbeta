import 'dotenv/config'
import { scheduleIcalSync, icalWorker } from '../src/server/queue/ical-sync'
import { scheduleBookingExpiry, expiryWorker } from '../src/server/queue/booking-expiry'
import { emailWorker } from '../src/server/queue/email-worker'
import { scheduleCancellingRecovery, cancellingRecoveryWorker } from '../src/server/queue/cancelling-recovery'
import { scheduleCheckinReminders, checkinReminderWorker } from '../src/server/queue/checkin-reminder'

async function main() {
  console.log('[workers] Starting all background workers...')

  // Schedule repeating jobs
  await scheduleIcalSync()
  console.log('[workers] iCal sync scheduled (every 15 min)')

  await scheduleBookingExpiry()
  console.log('[workers] Booking expiry scheduled (every 2 min)')

  await scheduleCancellingRecovery()
  console.log('[workers] Cancelling recovery scheduled (every 10 min)')

  await scheduleCheckinReminders()
  console.log('[workers] Check-in reminders scheduled (daily, 3 days before arrival)')

  console.log('[workers] Email worker listening')
  console.log('[workers] All workers running. Press Ctrl+C to stop.')

  // Graceful shutdown
  const shutdown = async () => {
    console.log('[workers] Shutting down...')
    await Promise.all([
      icalWorker.close(),
      expiryWorker.close(),
      emailWorker.close(),
      cancellingRecoveryWorker.close(),
      checkinReminderWorker.close(),
    ])
    process.exit(0)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

main().catch(console.error)
