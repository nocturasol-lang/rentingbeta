import { appRouter } from '@/server/trpc'
import { createContext } from '@/server/trpc/trpc'

export async function createServerCaller() {
  const ctx = await createContext({ req: new Request('http://localhost'), isServer: true })
  return appRouter.createCaller(ctx)
}
