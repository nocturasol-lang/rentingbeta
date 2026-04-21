import { describe, it, expect } from 'vitest'
import { calculateBookingPrice } from '@/lib/fees'

describe('calculateBookingPrice', () => {
  it('calculates correctly with 0% platform fee (demo mode)', () => {
    // 4 nights × €65/night + €25 cleaning = €285
    const result = calculateBookingPrice(6500, 4, 2500, 0)

    expect(result.nightsTotal).toBe(26000)  // 4 × 6500
    expect(result.cleaningFee).toBe(2500)
    expect(result.subtotal).toBe(28500)      // 26000 + 2500
    expect(result.platformFee).toBe(0)       // 0% of 28500
    expect(result.ownerPayout).toBe(28500)   // 28500 - 0
    expect(result.total).toBe(28500)         // guest pays €285.00
  })

  it('calculates correctly with 15% platform fee', () => {
    // 3 nights × €120/night + €50 cleaning = €410
    const result = calculateBookingPrice(12000, 3, 5000, 15)

    expect(result.nightsTotal).toBe(36000)   // 3 × 12000
    expect(result.cleaningFee).toBe(5000)
    expect(result.subtotal).toBe(41000)       // 36000 + 5000
    expect(result.platformFee).toBe(6150)     // 15% of 41000 = 6150
    expect(result.ownerPayout).toBe(34850)    // 41000 - 6150
    expect(result.total).toBe(41000)          // guest pays €410.00
  })

  it('rounds platform fee to nearest cent', () => {
    // 1 night × €65/night + €0 cleaning = €65, 10% fee
    const result = calculateBookingPrice(6500, 1, 0, 10)

    expect(result.platformFee).toBe(650)  // 10% of 6500 = 650 exact
    expect(result.ownerPayout).toBe(5850) // 6500 - 650
  })

  it('handles fractional percentage correctly', () => {
    // 2 nights × €70/night + €25 cleaning = €165, 7.5% fee
    const result = calculateBookingPrice(7000, 2, 2500, 7.5)

    expect(result.subtotal).toBe(16500)
    expect(result.platformFee).toBe(1238) // 7.5% of 16500 = 1237.5, rounds to 1238
    expect(result.ownerPayout).toBe(15262) // 16500 - 1238
  })

  it('handles single night with no cleaning fee', () => {
    const result = calculateBookingPrice(12000, 1, 0, 0)

    expect(result.nightsTotal).toBe(12000)
    expect(result.cleaningFee).toBe(0)
    expect(result.subtotal).toBe(12000)
    expect(result.total).toBe(12000)
  })

  it('all values are integers (no floating point)', () => {
    const result = calculateBookingPrice(6500, 3, 2500, 12.5)

    expect(Number.isInteger(result.nightsTotal)).toBe(true)
    expect(Number.isInteger(result.cleaningFee)).toBe(true)
    expect(Number.isInteger(result.subtotal)).toBe(true)
    expect(Number.isInteger(result.platformFee)).toBe(true)
    expect(Number.isInteger(result.ownerPayout)).toBe(true)
    expect(Number.isInteger(result.total)).toBe(true)
  })
})
