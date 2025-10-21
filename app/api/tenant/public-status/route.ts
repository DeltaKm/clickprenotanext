import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'

/**
 * Public endpoint to check if tenant accepts bookings
 * Used by the public booking page
 */
export async function GET(request: NextRequest) {
  try {
    const tenantContext = await getTenantContext(request)
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Get tenant info
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantContext.id },
      select: {
        slug: true,
        name: true,
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

    const acceptsBookings = tenant.isActive && !isExpired

    return NextResponse.json({
      acceptsBookings,
      tenantName: tenant.name,
      message: acceptsBookings 
        ? null 
        : 'Le prenotazioni non sono al momento disponibili. Contatta direttamente il fornitore del servizio.',
    })
  } catch (error) {
    console.error('Error checking tenant status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
