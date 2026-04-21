import { router } from '../trpc'
import { adminPropertiesRouter } from './admin/properties'
import { adminBookingsRouter } from './admin/bookings'
import { adminCalendarRouter } from './admin/calendar'
import { adminStatsRouter } from './admin/stats'
import { adminOperationsRouter } from './admin/operations'
import { adminGuestsRouter } from './admin/guests'
import { adminIcalRouter } from './admin/ical'
import { adminReportsRouter } from './admin/reports'

export const adminRouter = router({
  properties: adminPropertiesRouter,
  bookings: adminBookingsRouter,
  calendar: adminCalendarRouter,
  stats: adminStatsRouter,
  operations: adminOperationsRouter,
  guests: adminGuestsRouter,
  ical: adminIcalRouter,
  reports: adminReportsRouter,
})
