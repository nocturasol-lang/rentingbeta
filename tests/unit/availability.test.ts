import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockBookingFindFirst = vi.fn()
const mockExternalBlockFindFirst = vi.fn()
const mockAvailabilityRuleFindFirst = vi.fn()
const mockAvailabilityRuleFindMany = vi.fn()

vi.mock('@/server/db', () => ({
  prisma: {
    booking: { findFirst: (...args: unknown[]) => mockBookingFindFirst(...args) },
    externalBlock: { findFirst: (...args: unknown[]) => mockExternalBlockFindFirst(...args) },
    availabilityRule: {
      findFirst: (...args: unknown[]) => mockAvailabilityRuleFindFirst(...args),
      findMany: (...args: unknown[]) => mockAvailabilityRuleFindMany(...args),
    },
  },
}))

import { isAvailable } from '@/lib/availability'

// Helper: set up the "all clear" default for all four checks
function allClear() {
  mockBookingFindFirst.mockResolvedValue(null)
  mockExternalBlockFindFirst.mockResolvedValue(null)
  mockAvailabilityRuleFindFirst.mockResolvedValue(null)
  mockAvailabilityRuleFindMany.mockResolvedValue([])
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('isAvailable', () => {
  const propertyId = 'prop-1'
  // checkIn Jul 15, checkOut Jul 20 = 5 nights
  const checkIn = new Date('2026-07-15')
  const checkOut = new Date('2026-07-20')

  it('returns true when no conflicts exist', async () => {
    allClear()
    expect(await isAvailable(propertyId, checkIn, checkOut)).toBe(true)
  })

  it('returns false when a booking overlaps', async () => {
    allClear()
    mockBookingFindFirst.mockResolvedValue({ id: 'booking-1' })

    expect(await isAvailable(propertyId, checkIn, checkOut)).toBe(false)

    // All four checks run in parallel via Promise.all
    expect(mockBookingFindFirst).toHaveBeenCalled()
    expect(mockExternalBlockFindFirst).toHaveBeenCalled()
    expect(mockAvailabilityRuleFindFirst).toHaveBeenCalled()
    expect(mockAvailabilityRuleFindMany).toHaveBeenCalled()
  })

  it('returns false when an external block overlaps', async () => {
    allClear()
    mockExternalBlockFindFirst.mockResolvedValue({ id: 'block-1' })

    expect(await isAvailable(propertyId, checkIn, checkOut)).toBe(false)
  })

  it('returns false when a BLOCKED availability rule overlaps', async () => {
    allClear()
    mockAvailabilityRuleFindFirst.mockResolvedValue({ id: 'rule-1' })

    expect(await isAvailable(propertyId, checkIn, checkOut)).toBe(false)
  })

  it('excludes a specific booking by ID', async () => {
    allClear()
    await isAvailable(propertyId, checkIn, checkOut, 'exclude-booking-1')

    const callArgs = mockBookingFindFirst.mock.calls[0][0]
    expect(callArgs.where.id).toEqual({ not: 'exclude-booking-1' })
  })

  it('does not set id exclusion when no excludeBookingId is given', async () => {
    allClear()
    await isAvailable(propertyId, checkIn, checkOut)

    const callArgs = mockBookingFindFirst.mock.calls[0][0]
    expect(callArgs.where.id).toBeUndefined()
  })

  describe('MIN_STAY rules', () => {
    it('returns false when stay is shorter than an overlapping MIN_STAY rule', async () => {
      allClear()
      // 5-night stay but rule requires 7 nights minimum
      mockAvailabilityRuleFindMany.mockResolvedValue([{ minNights: 7 }])

      expect(await isAvailable(propertyId, checkIn, checkOut)).toBe(false)
    })

    it('returns true when stay meets the MIN_STAY requirement', async () => {
      allClear()
      // 5-night stay, rule requires exactly 5 — passes
      mockAvailabilityRuleFindMany.mockResolvedValue([{ minNights: 5 }])

      expect(await isAvailable(propertyId, checkIn, checkOut)).toBe(true)
    })

    it('returns true when stay exceeds the MIN_STAY requirement', async () => {
      allClear()
      // 5-night stay, rule requires 3 — passes
      mockAvailabilityRuleFindMany.mockResolvedValue([{ minNights: 3 }])

      expect(await isAvailable(propertyId, checkIn, checkOut)).toBe(true)
    })

    it('returns false when any overlapping MIN_STAY rule is violated', async () => {
      allClear()
      // Two overlapping rules — one passes, one fails
      mockAvailabilityRuleFindMany.mockResolvedValue([
        { minNights: 3 },
        { minNights: 7 },
      ])

      expect(await isAvailable(propertyId, checkIn, checkOut)).toBe(false)
    })

    it('returns true when no MIN_STAY rules overlap', async () => {
      allClear()
      mockAvailabilityRuleFindMany.mockResolvedValue([])

      expect(await isAvailable(propertyId, checkIn, checkOut)).toBe(true)
    })

    it('queries MIN_STAY rules with correct date overlap filter', async () => {
      allClear()
      mockAvailabilityRuleFindMany.mockResolvedValue([])

      await isAvailable(propertyId, checkIn, checkOut)

      const callArgs = mockAvailabilityRuleFindMany.mock.calls[0][0]
      expect(callArgs.where.type).toBe('MIN_STAY')
      expect(callArgs.where.AND).toContainEqual({ startDate: { lt: checkOut } })
      expect(callArgs.where.AND).toContainEqual({ endDate: { gt: checkIn } })
    })
  })
})
