import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, JWTPayload, extractTokenFromHeader } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export interface AuthContext {
  user: JWTPayload
  tenant: {
    id: string
    slug: string
    name: string
  }
}

/**
 * Authenticate request and return user context
 */
export async function authenticate(request: NextRequest): Promise<AuthContext | null> {
  const authHeader = request.headers.get('authorization')
  const token = extractTokenFromHeader(authHeader)

  if (!token) {
    return null
  }

  const payload = verifyAccessToken(token)
  if (!payload) {
    return null
  }

  // Fetch tenant info
  const tenant = await prisma.tenant.findUnique({
    where: { id: payload.tenantId },
    select: { id: true, slug: true, name: true, isActive: true },
  })

  if (!tenant || !tenant.isActive) {
    return null
  }

  return {
    user: payload,
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
    },
  }
}

/**
 * Require authentication for API route
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ context: AuthContext } | { error: NextResponse }> {
  const context = await authenticate(request)

  if (!context) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return { context }
}

/**
 * Require specific role(s) for API route
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<{ context: AuthContext } | { error: NextResponse }> {
  const authResult = await requireAuth(request)

  if ('error' in authResult) {
    return authResult
  }

  const { context } = authResult

  if (!allowedRoles.includes(context.user.role)) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return { context }
}

/**
 * Get tenant from request (from slug header or authenticate)
 */
export async function getTenantContext(
  request: NextRequest
): Promise<{ id: string; slug: string } | null> {
  // Try to get from authenticated user first
  const context = await authenticate(request)
  if (context) {
    return {
      id: context.tenant.id,
      slug: context.tenant.slug,
    }
  }

  // Fallback to tenant slug from header (for public routes)
  let tenantSlug = request.headers.get('x-tenant-slug')
  
  // If no header, try to get from URL or use default 'demo'
  if (!tenantSlug) {
    // For localhost without subdomain, default to 'demo'
    tenantSlug = 'demo'
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, slug: true, isActive: true },
  })

  if (!tenant || !tenant.isActive) {
    return null
  }

  return {
    id: tenant.id,
    slug: tenant.slug,
  }
}
