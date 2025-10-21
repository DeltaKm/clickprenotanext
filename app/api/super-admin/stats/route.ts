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

    if (!payload || payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Super Admin only' }, { status: 403 })
    }

    // Get statistics
    const [
      totalAdmins,
      activeAdmins,
      licensePackages,
      totalTenants,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'ADMIN', isActive: true } }),
      prisma.licensePackage.findMany({
        select: {
          quantity: true,
          used: true,
        },
      }),
      prisma.tenant.count(),
    ])

    const totalLicenses = licensePackages.reduce((sum, pkg) => sum + pkg.quantity, 0)
    const usedLicenses = licensePackages.reduce((sum, pkg) => sum + pkg.used, 0)

    return NextResponse.json({
      totalAdmins,
      activeAdmins,
      totalLicenses,
      usedLicenses,
      totalTenants,
    })
  } catch (error) {
    console.error('Super Admin - Get stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
