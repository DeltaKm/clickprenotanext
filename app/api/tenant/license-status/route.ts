import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult
    const tenantId = context.tenant.id

    // Get tenant info
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        slug: true,
        expiresAt: true,
        isActive: true,
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const now = new Date()
    
    // Special tenants that are always demo (no expiration)
    const demoTenants = ['demo', 'super-admin', 'admin-system']
    const isDemo = demoTenants.includes(tenant.slug)
    
    // If not a demo tenant and no expiresAt, it means no license = expired
    // If has expiresAt, check if it's in the past
    const isExpired = isDemo 
      ? false 
      : !tenant.expiresAt || new Date(tenant.expiresAt) < now
    
    let daysRemaining: number | null = null
    if (tenant.expiresAt && !isDemo) {
      const diffTime = new Date(tenant.expiresAt).getTime() - now.getTime()
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    return NextResponse.json({
      isExpired,
      expiresAt: tenant.expiresAt,
      daysRemaining,
      isDemo,
    })
  } catch (error) {
    console.error('Error fetching license status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
