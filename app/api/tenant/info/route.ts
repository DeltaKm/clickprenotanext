import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'

/**
 * Get tenant information for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult
    const tenantId = context.tenant.id

    // Get full tenant info
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        slug: true,
        name: true,
        domain: true,
        brandColor: true,
        logo: true,
        welcomeMessage: true,
        expiresAt: true,
        isActive: true,
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    return NextResponse.json({
      tenant,
    })
  } catch (error) {
    console.error('Error fetching tenant info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
