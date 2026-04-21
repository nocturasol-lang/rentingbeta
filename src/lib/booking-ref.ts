import crypto from 'crypto'

/**
 * Generate a booking reference like "KVL-A3F9B2C1D4E5F6A7"
 * KVL = Kavala prefix, followed by 16 uppercase hex characters (8 random bytes)
 */
export function generateReference(): string {
  return 'KVL-' + crypto.randomBytes(8).toString('hex').toUpperCase()
}
