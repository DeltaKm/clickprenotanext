import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Get all admins
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

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        createdAt: true,
        licensePackages: {
          select: {
            id: true,
            quantity: true,
            used: true,
            durationMonths: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate totals for each admin
    const adminsWithTotals = admins.map(admin => {
      const totalLicenses = admin.licensePackages.reduce((sum: number, pkg: any) => sum + pkg.quantity, 0)
      const usedLicenses = admin.licensePackages.reduce((sum: number, pkg: any) => sum + pkg.used, 0)
      
      return {
        ...admin,
        totalLicenses,
        usedLicenses,
        licenseExpiresAt: null, // Non più necessario, calcoliamo al momento dell'uso
      }
    })

    return NextResponse.json(adminsWithTotals)
  } catch (error) {
    console.error('Super Admin - Get admins error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create new admin
export async function POST(request: NextRequest) {
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

    const { email, name, password, totalLicenses, licenseMonths } = await request.json()

    // Check if email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    }

    // Find or create admin tenant
    let adminTenant = await prisma.tenant.findFirst({
      where: { slug: 'admin-system' },
    })

    if (!adminTenant) {
      adminTenant = await prisma.tenant.create({
        data: {
          slug: 'admin-system',
          name: 'Admin System',
          isActive: true,
        },
      })
    }

    // Create admin and first license package
    const passwordHash = await bcrypt.hash(password, 10)

    const admin = await prisma.user.create({
      data: {
        tenantId: adminTenant.id,
        email,
        passwordHash,
        name,
        role: 'ADMIN',
        isActive: true,
        licensePackages: {
          create: {
            quantity: totalLicenses,
            used: 0,
            durationMonths: licenseMonths,
          },
        },
      },
      include: {
        licensePackages: true,
      },
    })

    return NextResponse.json(admin, { status: 201 })
  } catch (error) {
    console.error('Super Admin - Create admin error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Toggle admin active status
export async function PATCH(request: NextRequest) {
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

    const { adminId, isActive } = await request.json()

    const admin = await prisma.user.update({
      where: { id: adminId },
      data: { isActive },
    })

    return NextResponse.json(admin)
  } catch (error) {
    console.error('Super Admin - Update admin error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete admin
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get('adminId')

    if (!adminId) {
      return NextResponse.json({ error: 'Admin ID required' }, { status: 400 })
    }

    // Delete all tenants managed by this admin
    await prisma.tenant.deleteMany({
      where: { adminId },
    })

    // Delete admin
    await prisma.user.delete({
      where: { id: adminId },
    })

    return NextResponse.json({ message: 'Admin deleted successfully' })
  } catch (error) {
    console.error('Super Admin - Delete admin error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
