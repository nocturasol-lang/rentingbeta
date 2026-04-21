import { z } from 'zod'
import { router, protectedProcedure, adminProcedure } from '../../trpc'
import { prisma } from '@/server/db'
import { toDateString } from '@/lib/date-utils'

export const adminOperationsRouter = router({
  /** Get all cleaning tasks for a date range */
  cleaningTasks: protectedProcedure
    .input(
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const where: { date?: { gte?: Date; lte?: Date } } = {}
      if (input?.from || input?.to) {
        if (!where.date) where.date = {}
        if (input.from) where.date.gte = new Date(input.from)
        if (input.to) where.date.lte = new Date(input.to)
      }

      const tasks = await prisma.cleaningTask.findMany({
        where,
        include: {
          property: { select: { name: true } },
        },
        orderBy: { date: 'asc' },
      })

      return tasks.map((t) => ({
        ...t,
        date: toDateString(t.date),
      }))
    }),

  /** Create a cleaning task */
  createCleaningTask: adminProcedure
    .input(
      z.object({
        propertyId: z.string(),
        bookingReference: z.string().optional(),
        date: z.string(),
        type: z.enum(['TURNOVER', 'DEEP_CLEAN', 'MAINTENANCE']),
        assignedTo: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.cleaningTask.create({
        data: {
          propertyId: input.propertyId,
          bookingReference: input.bookingReference ?? null,
          date: new Date(input.date),
          type: input.type,
          assignedTo: input.assignedTo ?? null,
          notes: input.notes ?? null,
        },
      })
    }),

  /** Update cleaning task status */
  updateCleaningTaskStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['PENDING', 'IN_PROGRESS', 'DONE']),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.cleaningTask.update({
        where: { id: input.id },
        data: { status: input.status },
      })
    }),

  /** Get maintenance issues */
  maintenanceIssues: protectedProcedure
    .input(
      z.object({
        status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED']).optional(),
        propertyId: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const where: Record<string, unknown> = {}
      if (input?.status) where.status = input.status
      if (input?.propertyId) where.propertyId = input.propertyId

      const issues = await prisma.maintenanceIssue.findMany({
        where,
        include: {
          property: { select: { name: true } },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      })

      return issues.map((issue) => ({
        ...issue,
        resolvedAt: issue.resolvedAt?.toISOString() ?? null,
      }))
    }),

  /** Create a maintenance issue */
  createMaintenanceIssue: adminProcedure
    .input(
      z.object({
        propertyId: z.string(),
        title: z.string(),
        description: z.string(),
        priority: z.enum(['LOW', 'MEDIUM', 'URGENT']),
        assignedTo: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return prisma.maintenanceIssue.create({
        data: {
          propertyId: input.propertyId,
          title: input.title,
          description: input.description,
          priority: input.priority,
          status: 'OPEN',
          reportedBy: ctx.session.user.name ?? ctx.session.user.email ?? ctx.session.user.id,
          assignedTo: input.assignedTo ?? null,
          notes: input.notes ?? null,
        },
      })
    }),

  /** Update a maintenance issue */
  updateMaintenanceIssue: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED']).optional(),
        notes: z.string().optional(),
        assignedTo: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, status, ...rest } = input
      const data: Record<string, unknown> = rest
      if (status) {
        data.status = status
        if (status === 'RESOLVED') {
          data.resolvedAt = new Date()
        }
      }
      return prisma.maintenanceIssue.update({ where: { id }, data })
    }),

  /** Check room readiness: checkout/checkin gaps for a date range */
  roomReadiness: protectedProcedure
    .input(
      z.object({
        from: z.string(),
        to: z.string(),
      })
    )
    .query(async ({ input }) => {
      const from = new Date(input.from)
      const to = new Date(input.to)

      const properties = await prisma.property.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      })

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      return Promise.all(
        properties.map(async (property) => {
          const todayCheckout = await prisma.booking.findFirst({
            where: {
              propertyId: property.id,
              status: 'CONFIRMED',
              checkOut: { gte: today, lte: new Date(today.getTime() + 86400000) },
            },
            select: { guestName: true, checkOut: true },
            orderBy: { checkOut: 'asc' },
          })

          const todayCheckin = await prisma.booking.findFirst({
            where: {
              propertyId: property.id,
              status: 'CONFIRMED',
              checkIn: { gte: today, lte: new Date(today.getTime() + 86400000) },
            },
            select: { guestName: true, checkIn: true },
            orderBy: { checkIn: 'asc' },
          })

          const cleaningTask = await prisma.cleaningTask
            .findFirst({
              where: {
                propertyId: property.id,
                date: { gte: today, lte: new Date(today.getTime() + 86400000) },
                status: 'DONE',
              },
              orderBy: { updatedAt: 'desc' },
            })

          const needsCleaning = !!todayCheckout
          const isCleaned = !!cleaningTask
          const needsCheckin = !!todayCheckin

          return {
            propertyId: property.id,
            propertyName: property.name,
            checkout: todayCheckout
              ? { guestName: todayCheckout.guestName, time: toDateString(todayCheckout.checkOut) }
              : null,
            checkin: todayCheckin
              ? { guestName: todayCheckin.guestName, time: toDateString(todayCheckin.checkIn) }
              : null,
            needsCleaning,
            isCleaned,
            needsCheckin,
            ready: !needsCleaning || isCleaned,
          }
        })
      )
    }),
})
