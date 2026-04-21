import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@/server/trpc'
import { createContext } from '@/server/trpc/trpc'

const handler = (req: Request) => {
  // CSRF defense: require custom header on mutations
  // Browsers cannot add custom headers in cross-origin simple requests
  if (req.method === 'POST' && req.headers.get('x-trpc-source') !== 'client') {
    return new Response('Forbidden', { status: 403 })
  }

  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext({ req }),
  })
}

export { handler as GET, handler as POST }
