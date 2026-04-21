import { auth } from '@/server/auth'
import { NextResponse } from 'next/server'

const isProd = process.env.NODE_ENV === 'production'
const isDev = process.env.NODE_ENV === 'development'

// CSP: allow Stripe Elements, Tailwind inline styles, external images
const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://js.stripe.com${isDev ? " 'unsafe-eval'" : ''}`,
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "connect-src 'self' https://api.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProd ? ['upgrade-insecure-requests'] : []),
]
const cspHeader = cspDirectives.join('; ')

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('Content-Security-Policy', cspHeader)

  if (isProd) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    )
  }

  return response
}

// NextAuth v5 auth wrapper — req.auth contains the session
export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Admin login page: redirect to dashboard if already authenticated
  if (pathname.startsWith('/admin/login')) {
    if (isLoggedIn) {
      return addSecurityHeaders(
        NextResponse.redirect(new URL('/admin/dashboard', req.url))
      )
    }
    return addSecurityHeaders(NextResponse.next())
  }

  // All other admin routes: require authentication
  if (pathname.startsWith('/admin')) {
    if (!isLoggedIn) {
      return addSecurityHeaders(
        NextResponse.redirect(new URL('/admin/login', req.url))
      )
    }
    return addSecurityHeaders(NextResponse.next())
  }

  // Public routes: just add security headers
  return addSecurityHeaders(NextResponse.next())
})

export const config = {
  matcher: [
    // Match all paths except static files, images, and webhook API routes
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/webhooks).*)',
  ],
}
