import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api-middleware'
import { UserRole } from '@prisma/client'

// PUT /api/services/[id] - Update service
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireRole(request, [UserRole.OWNER])
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult
    const body = await request.json()

    // Verify service belongs to tenant
    const existingService = await prisma.service.findFirst({
      where: {
        id: params.id,
        tenantId: context.tenant.id,
      },
    })

    if (!existingService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Update service
    const updateData: any = {
      name: body.name,
      description: body.description,
      duration: body.duration,
      price: body.price,
      availableDays: body.availableDays,
      startTime: body.startTime,
      endTime: body.endTime,
      slotDuration: body.slotDuration,
    }

    // Only update closedDates if provided
    if (body.closedDates !== undefined) {
      updateData.closedDates = Array.isArray(body.closedDates) ? body.closedDates : []
    }

    const service = await prisma.service.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({
      message: 'Service updated',
      service,
    })
  } catch (error) {
    console.error('Update service error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/services/[id] - Delete service
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireRole(request, [UserRole.OWNER])
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult

    // Verify service belongs to tenant
    const existingService = await prisma.service.findFirst({
      where: {
        id: params.id,
        tenantId: context.tenant.id,
      },
    })

    if (!existingService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Delete service (will cascade delete appointments and staff services)
    await prisma.service.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      message: 'Service deleted',
    })
  } catch (error) {
    console.error('Delete service error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
