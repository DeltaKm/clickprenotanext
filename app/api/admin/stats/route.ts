import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyAccessToken(token)

    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    // Get admin's license packages
    const admin = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        licensePackages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    // Calculate license totals
    const totalLicenses = admin.licensePackages.reduce((sum, pkg) => sum + pkg.quantity, 0)
    const usedLicenses = admin.licensePackages.reduce((sum, pkg) => sum + pkg.used, 0)
    const availableLicenses = totalLicenses - usedLicenses

    // Get statistics for this admin's tenants only
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      totalAppointments,
      totalCustomers,
      recentTenants,
    ] = await Promise.all([
      prisma.tenant.count({ where: { adminId: payload.userId } }),
      prisma.tenant.count({ where: { adminId: payload.userId, isActive: true } }),
      prisma.user.count({ 
        where: { 
          tenant: { adminId: payload.userId } 
        } 
      }),
      prisma.appointment.count({ 
        where: { 
          tenant: { adminId: payload.userId } 
        } 
      }),
      prisma.customer.count({ 
        where: { 
          tenant: { adminId: payload.userId } 
        } 
      }),
      prisma.tenant.findMany({
        where: { adminId: payload.userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
        },
      }),
    ])

    return NextResponse.json({
      totalTenants,
      activeTenants,
      inactiveTenants: totalTenants - activeTenants,
      totalUsers,
      totalAppointments,
      totalCustomers,
      recentTenants,
      // License info
      licenses: {
        total: totalLicenses,
        used: usedLicenses,
        available: availableLicenses,
        packages: admin.licensePackages,
      },
    })
  } catch (error) {
    console.error('Super Admin - Get stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
