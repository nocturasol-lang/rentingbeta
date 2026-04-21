import crypto from 'crypto'

/**
 * Timing-safe string comparison.
 *
 * Prevents timing attacks by ensuring comparison takes constant time
 * regardless of where strings differ. Case-insensitive for email comparisons.
 */
export function timingSafeStringCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a.toLowerCase())
  const bufB = Buffer.from(b.toLowerCase())

  if (bufA.length !== bufB.length) {
    // Still perform a comparison to maintain constant time,
    // then return false regardless
    crypto.timingSafeEqual(bufA, bufA)
    return false
  }

  return crypto.timingSafeEqual(bufA, bufB)
}
