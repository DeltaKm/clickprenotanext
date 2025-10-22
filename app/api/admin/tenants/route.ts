import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyAccessToken(token)

    // Verify super admin role
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    // Get only tenants created by this admin
    const tenants = await prisma.tenant.findMany({
      where: {
        adminId: payload.userId, // Filter by admin ID
      },
      include: {
        _count: {
          select: {
            users: true,
            appointments: true,
            customers: true,
            services: true,
          },
        },
        users: {
          where: { role: 'OWNER' },
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(tenants)
  } catch (error) {
    console.error('Super Admin - Get tenants error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Toggle tenant active status
export async function PATCH(request: NextRequest) {
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

    const { tenantId, isActive } = await request.json()

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { isActive },
    })

    return NextResponse.json(tenant)
  } catch (error) {
    console.error('Super Admin - Update tenant error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create new tenant
export async function POST(request: NextRequest) {
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

    const { slug, name, ownerEmail, ownerName, ownerPassword, packageId, licenseQuantity = 1 } = await request.json()

    // Check if tenant already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
    })

    if (existingTenant) {
      return NextResponse.json({ error: 'Tenant slug already exists' }, { status: 400 })
    }

    // Variables for license management
    let selectedPackage = null
    let expiresAt = null

    // Only process licenses if packageId is provided
    if (packageId) {
      // Get the selected package
      selectedPackage = await prisma.licensePackage.findUnique({
        where: { id: packageId },
      })

      if (!selectedPackage) {
        return NextResponse.json({ error: 'Pacchetto non trovato' }, { status: 404 })
      }

      // Check if package belongs to this admin
      if (selectedPackage.adminId !== payload.userId) {
        return NextResponse.json({ error: 'Pacchetto non valido' }, { status: 403 })
      }

      // Check if package has enough available licenses
      const availableLicenses = selectedPackage.quantity - selectedPackage.used
      if (availableLicenses < licenseQuantity) {
        return NextResponse.json({ 
          error: `Licenze insufficienti. Disponibili: ${availableLicenses}, Richieste: ${licenseQuantity}` 
        }, { status: 403 })
      }

      // Calculate expiry date based on package duration * quantity
      expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + (selectedPackage.durationMonths * licenseQuantity))
    }

    // Create tenant and owner in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant with admin assignment
      const tenant = await tx.tenant.create({
        data: {
          slug,
          name,
          isActive: true,
          adminId: payload.userId, // Assign to this admin
          expiresAt, // Calculate expiry from NOW + package duration
        },
      })

      // Increment used licenses in the package by the quantity used (only if package was selected)
      if (selectedPackage) {
        await tx.licensePackage.update({
          where: { id: selectedPackage.id },
          data: { used: { increment: licenseQuantity } },
        })
      }

      // Hash password
      const passwordHash = await bcrypt.hash(ownerPassword, 10)

      // Create owner user
      const owner = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: ownerEmail,
          passwordHash,
          name: ownerName,
          role: 'OWNER',
          isActive: true,
        },
      })

      return { tenant, owner }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Super Admin - Create tenant error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete tenant
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 })
    }

    // Get tenant to verify ownership and get admin info
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Verify this admin owns this tenant
    if (tenant.adminId !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden - Not your tenant' }, { status: 403 })
    }

    // Delete tenant and decrement license usage in transaction
    await prisma.$transaction(async (tx) => {
      // Delete tenant (cascade will delete all related data)
      await tx.tenant.delete({
        where: { id: tenantId },
      })

      // Find the admin's license packages and decrement usage
      if (tenant.adminId) {
        const packages = await tx.licensePackage.findMany({
          where: { 
            adminId: tenant.adminId,
            used: { gt: 0 },
          },
          orderBy: { createdAt: 'desc' }, // Decrement from newest first
        })

        if (packages.length > 0) {
          await tx.licensePackage.update({
            where: { id: packages[0].id },
            data: { used: { decrement: 1 } },
          })
        }
      }
    })

    return NextResponse.json({ message: 'Tenant deleted successfully' })
  } catch (error) {
    console.error('Super Admin - Delete tenant error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
