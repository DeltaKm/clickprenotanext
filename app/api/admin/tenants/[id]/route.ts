import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Update tenant details
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { slug, name, ownerEmail, ownerName, ownerPassword, packageId, licenseQuantity } = await request.json()
    const tenantId = params.id

    // Get current tenant
    const currentTenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    })

    if (!currentTenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Verify tenant belongs to this admin
    if (currentTenant.adminId !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden - Not your tenant' }, { status: 403 })
    }

    // Check if slug is taken by another tenant
    if (slug) {
      const existingTenant = await prisma.tenant.findFirst({
        where: {
          slug,
          id: { not: tenantId },
        },
      })

      if (existingTenant) {
        return NextResponse.json({ error: 'Slug already in use' }, { status: 400 })
      }
    }

    // If adding licenses, validate package
    let additionalMonths = 0
    if (packageId && licenseQuantity) {
      const selectedPackage = await prisma.licensePackage.findUnique({
        where: { id: packageId },
      })

      if (!selectedPackage) {
        return NextResponse.json({ error: 'Pacchetto non trovato' }, { status: 404 })
      }

      if (selectedPackage.adminId !== payload.userId) {
        return NextResponse.json({ error: 'Pacchetto non valido' }, { status: 403 })
      }

      const availableLicenses = selectedPackage.quantity - selectedPackage.used
      if (availableLicenses < licenseQuantity) {
        return NextResponse.json({ 
          error: `Licenze insufficienti. Disponibili: ${availableLicenses}, Richieste: ${licenseQuantity}` 
        }, { status: 403 })
      }

      additionalMonths = selectedPackage.durationMonths * licenseQuantity
    }

    // Update in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Calculate new expiry if adding licenses
      let newExpiresAt = currentTenant.expiresAt
      if (additionalMonths > 0 && packageId) {
        const currentExpiry = currentTenant.expiresAt || new Date()
        newExpiresAt = new Date(currentExpiry)
        newExpiresAt.setMonth(newExpiresAt.getMonth() + additionalMonths)

        // Increment used licenses
        await tx.licensePackage.update({
          where: { id: packageId },
          data: { used: { increment: licenseQuantity } },
        })
      }

      // Update tenant
      const tenant = await tx.tenant.update({
        where: { id: tenantId },
        data: {
          ...(slug && { slug }),
          ...(name && { name }),
          ...(newExpiresAt && { expiresAt: newExpiresAt }),
        },
      })

      // Find owner user
      const owner = await tx.user.findFirst({
        where: {
          tenantId,
          role: 'OWNER',
        },
      })

      if (owner) {
        // Update owner
        const updateData: any = {}
        if (ownerEmail) updateData.email = ownerEmail
        if (ownerName) updateData.name = ownerName
        if (ownerPassword) {
          updateData.passwordHash = await bcrypt.hash(ownerPassword, 10)
        }

        await tx.user.update({
          where: { id: owner.id },
          data: updateData,
        })
      }

      return tenant
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Super Admin - Update tenant error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
