import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Delete license package
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: packageId } = await params

    // Check if package has used licenses
    const pkg = await prisma.licensePackage.findUnique({
      where: { id: packageId },
    })

    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    if (pkg.used > 0) {
      return NextResponse.json({ 
        error: `Impossibile eliminare: ${pkg.used} licenze sono in uso` 
      }, { status: 400 })
    }

    // Delete package
    await prisma.licensePackage.delete({
      where: { id: packageId },
    })

    return NextResponse.json({ message: 'Package deleted successfully' })
  } catch (error) {
    console.error('Super Admin - Delete package error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update license package
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { quantity, durationMonths } = await request.json()
    const { id: packageId } = await params

    // Get current package
    const pkg = await prisma.licensePackage.findUnique({
      where: { id: packageId },
    })

    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    // Check if new quantity is less than used
    if (quantity < pkg.used) {
      return NextResponse.json({ 
        error: `La quantità non può essere inferiore alle licenze in uso (${pkg.used})` 
      }, { status: 400 })
    }

    // Update package
    const updated = await prisma.licensePackage.update({
      where: { id: packageId },
      data: {
        quantity,
        durationMonths,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Super Admin - Update package error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
