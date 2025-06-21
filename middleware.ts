import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Add security headers
  const response = NextResponse.next()
  
  // Skip security headers for Next.js internal routes
  if (!pathname.startsWith('/_next/') && !pathname.startsWith('/api/auth/')) {
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  }

  return response
}

export const config = {
  matcher: [
    // Match all routes except specific exclusions
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 