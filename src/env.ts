/**
 * Central environment variable validation.
 *
 * Fails fast at startup with a clear error message rather than crashing
 * at the call site with "Cannot read properties of undefined".
 *
 * Import `env` instead of reading process.env directly in server code.
 * Optional vars are typed as `string | undefined` — callers decide behaviour.
 */

function require(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined
}

export const env = {
  // Database
  DATABASE_URL: require('DATABASE_URL'),

  // Redis
  REDIS_URL: optional('REDIS_URL') ?? 'redis://localhost:6379',

  // Auth
  NEXTAUTH_SECRET: require('NEXTAUTH_SECRET'),

  // Stripe
  STRIPE_SECRET_KEY: require('STRIPE_SECRET_KEY'),
  STRIPE_WEBHOOK_SECRET: require('STRIPE_WEBHOOK_SECRET'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: require('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),

  // Email
  RESEND_API_KEY: require('RESEND_API_KEY'),
  FROM_EMAIL: optional('FROM_EMAIL') ?? 'noreply@georgiascosyrooms.gr',
  ADMIN_EMAIL: optional('ADMIN_EMAIL') ?? 'georgia@georgiascosyrooms.gr',

  // App
  NEXT_PUBLIC_APP_URL: require('NEXT_PUBLIC_APP_URL'),
  INTERNAL_SECRET: require('INTERNAL_SECRET'),

  // Optional / tuneable
  ICAL_POLL_INTERVAL_MS: Number(optional('ICAL_POLL_INTERVAL_MS') ?? '900000'),
  DISCORD_WEBHOOK_URL: optional('DISCORD_WEBHOOK_URL'),
} as const
