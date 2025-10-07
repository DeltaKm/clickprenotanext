import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { extractTenantFromHost } from '@/lib/tenant'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host')
  
  if (host) {
    const tenantSlug = extractTenantFromHost(host)
    
    if (tenantSlug) {
      // Clone headers and add tenant ID
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-tenant-slug', tenantSlug)
      
      // Return response with modified headers
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
