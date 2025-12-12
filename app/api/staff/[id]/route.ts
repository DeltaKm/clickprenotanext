import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api-middleware'
import { UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

// PUT /api/staff/[id] - Update staff member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(request, [UserRole.OWNER])
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult
    const body = await request.json()
    const { id } = await params

    // Verify staff belongs to tenant
    const existingStaff = await prisma.staff.findFirst({
      where: {
        id,
        tenantId: context.tenant.id,
      },
      include: {
        user: true,
        staffServices: true,
      },
    })

    if (!existingStaff) {
      return NextResponse.json(
        { error: 'Staff not found' },
        { status: 404 }
      )
    }

    // Update user data
    const userData: any = {
      name: body.name,
      email: body.email?.toLowerCase(),
    }

    // Only update password if provided
    if (body.password) {
      userData.passwordHash = await bcrypt.hash(body.password, 10)
    }

    await prisma.user.update({
      where: { id: existingStaff.userId },
      data: userData,
    })

    // Update staff profile
    await prisma.staff.update({
      where: { id },
      data: {
        bio: body.bio,
      },
    })

    // Update staff services
    if (body.serviceIds) {
      // Delete existing associations
      await prisma.staffService.deleteMany({
        where: { staffId: id },
      })

      // Create new associations
      if (body.serviceIds.length > 0) {
        await prisma.staffService.createMany({
          data: body.serviceIds.map((serviceId: string) => ({
            staffId: id,
            serviceId,
            tenantId: context.tenant.id,
          })),
        })
      }
    }

    return NextResponse.json({
      message: 'Staff updated',
    })
  } catch (error) {
    console.error('Update staff error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/staff/[id] - Delete staff member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(request, [UserRole.OWNER])
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult
    const { id } = await params

    // Verify staff belongs to tenant
    const existingStaff = await prisma.staff.findFirst({
      where: {
        id,
        tenantId: context.tenant.id,
      },
      include: {
        user: true,
      },
    })

    if (!existingStaff) {
      return NextResponse.json(
        { error: 'Staff not found' },
        { status: 404 }
      )
    }

    // Delete staff (will cascade delete staff services and set appointments staffId to null)
    await prisma.staff.delete({
      where: { id },
    })

    // Also delete the user account
    await prisma.user.delete({
      where: { id: existingStaff.userId },
    })

    return NextResponse.json({
      message: 'Staff deleted',
    })
  } catch (error) {
    console.error('Delete staff error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
