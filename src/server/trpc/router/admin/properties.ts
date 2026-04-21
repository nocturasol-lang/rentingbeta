import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure, adminProcedure } from '../../trpc'
import { prisma } from '@/server/db'

export const adminPropertiesRouter = router({
  /** List all properties (including inactive) */
  list: protectedProcedure.query(async () => {
    return prisma.property.findMany({
      orderBy: { name: 'asc' },
      include: {
        images: { orderBy: { position: 'asc' }, take: 1 },
        _count: { select: { bookings: true, externalBlocks: true } },
      },
    })
  }),

  /** Get single property with all images */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const property = await prisma.property.findUnique({
        where: { id: input.id },
        include: {
          images: { orderBy: { position: 'asc' } },
        },
      })
      if (!property) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Property not found' })
      }
      return property
    }),

  /** Delete a property image */
  deleteImage: adminProcedure
    .input(z.object({ imageId: z.string() }))
    .mutation(async ({ input }) => {
      await prisma.propertyImage.delete({ where: { id: input.imageId } })
      return { success: true }
    }),

  /** Create a new property */
  create: adminProcedure
    .input(
      z.object({
        name: z.string(),
        slug: z.string().regex(/^[a-z0-9-]+$/),
        description: z.string(),
        address: z.string(),
        size: z.number().int().optional(),
        pricePerNightCents: z.number().int().positive(),
        cleaningFeeCents: z.number().int().min(0).default(0),
        platformFeePercent: z.number().min(0).max(100).default(0),
        maxGuests: z.number().int().positive(),
        bedrooms: z.number().int().positive(),
        bathrooms: z.number().int().positive(),
        amenities: z.array(z.string()).default([]),
        icalUrl: z.string().url().optional(),
        licenseNumber: z.string().optional(),
        checkInFrom: z.string().default('14:00'),
        checkInTo: z.string().default('20:00'),
        checkOutFrom: z.string().default('08:00'),
        checkOutTo: z.string().default('10:00'),
        minNights: z.number().int().min(1).default(1),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.property.create({ data: input })
    }),

  /** Update an existing property */
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
        description: z.string().optional(),
        address: z.string().optional(),
        size: z.number().int().optional(),
        pricePerNightCents: z.number().int().positive().optional(),
        cleaningFeeCents: z.number().int().min(0).optional(),
        platformFeePercent: z.number().min(0).max(100).optional(),
        maxGuests: z.number().int().positive().optional(),
        bedrooms: z.number().int().positive().optional(),
        bathrooms: z.number().int().positive().optional(),
        amenities: z.array(z.string()).optional(),
        icalUrl: z.string().url().nullable().optional(),
        licenseNumber: z.string().nullable().optional(),
        checkInFrom: z.string().optional(),
        checkInTo: z.string().optional(),
        checkOutFrom: z.string().optional(),
        checkOutTo: z.string().optional(),
        minNights: z.number().int().min(1).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input
      return prisma.property.update({ where: { id }, data })
    }),

  /** Soft delete — sets isActive = false */
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await prisma.property.update({
        where: { id: input.id },
        data: { isActive: false },
      })
      return { success: true }
    }),
})
