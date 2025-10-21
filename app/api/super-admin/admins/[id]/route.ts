import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Update admin
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

    if (!payload || payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Super Admin only' }, { status: 403 })
    }

    const { email, name, password, totalLicenses, licenseMonths } = await request.json()
    const adminId = params.id

    // Check if email is taken by another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: adminId },
        },
      })

      if (existingUser) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (email) updateData.email = email
    if (name) updateData.name = name
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10)
    }

    // Add new license package if specified
    if (totalLicenses && licenseMonths) {
      updateData.licensePackages = {
        create: {
          quantity: totalLicenses,
          used: 0,
          durationMonths: licenseMonths,
        },
      }
    }

    const admin = await prisma.user.update({
      where: { id: adminId },
      data: updateData,
      include: {
        licensePackages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    return NextResponse.json(admin)
  } catch (error) {
    console.error('Super Admin - Update admin error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
