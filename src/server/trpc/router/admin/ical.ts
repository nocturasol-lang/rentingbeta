import { z } from 'zod'
import { router, protectedProcedure, adminProcedure } from '../../trpc'
import { prisma } from '@/server/db'
import { triggerManualSync } from '@/server/queue/ical-sync'

export const adminIcalRouter = router({
  /** Get iCal sync status for all properties */
  status: protectedProcedure.query(async () => {
    const properties = await prisma.property.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        icalUrl: true,
        icalSyncStatus: true,
        icalLastSyncedAt: true,
        _count: { select: { externalBlocks: true } },
      },
      orderBy: { name: 'asc' },
    })

    return properties.map((p) => ({
      propertyId: p.id,
      propertyName: p.name,
      icalUrl: p.icalUrl,
      icalSyncStatus: p.icalSyncStatus,
      icalLastSyncedAt: p.icalLastSyncedAt?.toISOString() ?? null,
      externalBlockCount: p._count.externalBlocks,
    }))
  }),

  /** Manually trigger iCal sync for one or all properties */
  sync: adminProcedure
    .input(z.object({ propertyId: z.string().optional() }))
    .mutation(async ({ input }) => {
      const jobId = await triggerManualSync(input.propertyId)
      const count = input.propertyId
        ? 1
        : await prisma.property.count({
            where: { isActive: true, icalUrl: { not: null } },
          })
      return { jobId: jobId ?? 'queued', queued: count }
    }),
})
