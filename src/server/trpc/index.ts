import { router } from './trpc'
import { propertiesRouter } from './router/properties'
import { availabilityRouter } from './router/availability'
import { bookingsRouter } from './router/bookings'
import { adminRouter } from './router/admin'

export const appRouter = router({
  properties: propertiesRouter,
  availability: availabilityRouter,
  bookings: bookingsRouter,
  admin: adminRouter,
})

export type AppRouter = typeof appRouter
