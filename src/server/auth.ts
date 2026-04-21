import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from './db'
import { redis } from './redis'
import { checkRateLimit } from '@/lib/rate-limit'

// Production guard: fail fast if NEXTAUTH_SECRET is a dev placeholder
if (
  process.env.NODE_ENV === 'production' &&
  process.env.NEXTAUTH_SECRET?.includes('dev-secret')
) {
  throw new Error('FATAL: NEXTAUTH_SECRET must be changed in production')
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = (credentials.email as string).toLowerCase().trim()
        const password = credentials.password as string

        // Extract IP from request for rate limiting
        const ip =
          request?.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() ??
          'unknown'

        // Rate limit by IP: 5 attempts per 15 minutes
        const ipLimit = await checkRateLimit(`rl:login:${ip}`, 5, 900)
        if (!ipLimit.allowed) {
          console.log(
            JSON.stringify({
              event: 'login_rate_limited',
              reason: 'ip',
              ip,
              timestamp: new Date().toISOString(),
            })
          )
          return null
        }

        // Rate limit by email: 10 attempts per hour
        const emailLimit = await checkRateLimit(
          `rl:login:email:${email}`,
          10,
          3600
        )
        if (!emailLimit.allowed) {
          console.log(
            JSON.stringify({
              event: 'login_rate_limited',
              reason: 'email',
              email,
              timestamp: new Date().toISOString(),
            })
          )
          return null
        }

        // Check account lockout
        const lockoutKey = `auth:lockout:${email}`
        const isLockedOut = await redis.exists(lockoutKey)
        if (isLockedOut) {
          console.log(
            JSON.stringify({
              event: 'login_locked_out',
              email,
              timestamp: new Date().toISOString(),
            })
          )
          return null
        }

        // Find user — never reveal if email exists
        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user) {
          // Track failed attempt even for non-existent emails
          // to avoid leaking email existence through timing
          await trackFailedAttempt(email)
          console.log(
            JSON.stringify({
              event: 'login_failed',
              email,
              timestamp: new Date().toISOString(),
            })
          )
          return null
        }

        const isValid = await compare(password, user.password)
        if (!isValid) {
          await trackFailedAttempt(email)
          console.log(
            JSON.stringify({
              event: 'login_failed',
              email,
              timestamp: new Date().toISOString(),
            })
          )
          return null
        }

        // Success: clear failed attempt counter
        await redis.del(`auth:failed:${email}`)

        console.log(
          JSON.stringify({
            event: 'login_success',
            email,
            timestamp: new Date().toISOString(),
          })
        )

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
    updateAge: 60 * 60, // Refresh token every hour
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/admin/login',
  },
})

/**
 * Track a failed login attempt. After 5 failures in 15 minutes,
 * lock the account for 30 minutes.
 */
async function trackFailedAttempt(email: string): Promise<void> {
  const failedKey = `auth:failed:${email}`
  const count = await redis.incr(failedKey)

  // Set TTL on first failure (15 minute window)
  if (count === 1) {
    await redis.expire(failedKey, 900)
  }

  // Lock account after 5 failures
  if (count >= 5) {
    await redis.set(`auth:lockout:${email}`, '1', 'EX', 1800) // 30 minutes
    console.log(
      JSON.stringify({
        event: 'account_locked',
        email,
        timestamp: new Date().toISOString(),
      })
    )
  }
}
