import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import type { Session } from 'next-auth'
import { auth } from '@/server/auth'

// Context type — available in every procedure
export interface TRPCContext {
  session: Session | null
  ip: string
  isServer: boolean
}

export async function createContext({
  req,
  isServer = false,
}: {
  req: Request
  isServer?: boolean
}): Promise<TRPCContext> {
  const session = await auth()
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  return { session, ip, isServer }
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
})

// Mutation logger middleware — logs every mutation with procedure name, user ID, and timestamp
const loggerMiddleware = t.middleware(async ({ path, type, ctx, next }) => {
  const start = Date.now()
  const result = await next()
  const duration = Date.now() - start

  if (type === 'mutation') {
    console.log(
      JSON.stringify({
        type: 'mutation',
        path,
        userId: ctx.session?.user?.id ?? 'anon',
        duration,
        ok: result.ok,
        timestamp: new Date().toISOString(),
      })
    )
  }

  return result
})

export const router = t.router
export const publicProcedure = t.procedure.use(loggerMiddleware)

// Protected procedure — requires any authenticated session
export const protectedProcedure = t.procedure
  .use(loggerMiddleware)
  .use(async ({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
    }
    return next({
      ctx: {
        ...ctx,
        session: ctx.session,
      },
    })
  })

// Admin procedure — requires ADMIN role (not MANAGER)
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.session.user.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' })
  }
  return next({ ctx })
})
