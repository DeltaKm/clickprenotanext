import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-middleware'
import { rescheduleAppointmentSchema, updateAppointmentStatusSchema } from '@/lib/validations'
import { AppointmentStatus, UserRole } from '@prisma/client'
import { sendBookingConfirmationEmail, sendBookingRejectionEmail } from '@/lib/email'

// PATCH /api/appointments/[id] - Update appointment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult
    const { id } = await params
    const body = await request.json()

    // Find appointment
    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        tenantId: context.tenant.id,
      },
      include: {
        service: true,
      },
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (context.user.role === UserRole.STAFF) {
      const staff = await prisma.staff.findUnique({
        where: {
          tenantId_userId: {
            tenantId: context.tenant.id,
            userId: context.user.userId,
          },
        },
      })

      if (!staff || staff.id !== appointment.staffId) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }
    }

    // Handle reschedule
    if (body.startTime) {
      const validation = rescheduleAppointmentSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validation.error.errors },
          { status: 400 }
        )
      }

      const newStartTime = new Date(validation.data.startTime)
      const newEndTime = new Date(newStartTime.getTime() + appointment.service.duration * 60000)

      // Check for conflicts
      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          id: { not: id },
          tenantId: context.tenant.id,
          staffId: appointment.staffId,
          status: {
            in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
          },
          OR: [
            {
              AND: [
                { startTime: { lte: newStartTime } },
                { endTime: { gt: newStartTime } },
              ],
            },
            {
              AND: [
                { startTime: { lt: newEndTime } },
                { endTime: { gte: newEndTime } },
              ],
            },
          ],
        },
      })

      if (conflictingAppointment) {
        return NextResponse.json(
          { error: 'Time slot not available' },
          { status: 409 }
        )
      }

      const updated = await prisma.appointment.update({
        where: { id },
        data: {
          startTime: newStartTime,
          endTime: newEndTime,
        },
        include: {
          customer: true,
          staff: {
            include: {
              user: {
                select: { name: true },
              },
            },
          },
          service: true,
        },
      })

      return NextResponse.json({
        message: 'Appointment rescheduled',
        appointment: updated,
      })
    }

    // Handle status update
    if (body.status) {
      const validation = updateAppointmentStatusSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validation.error.errors },
          { status: 400 }
        )
      }

      const updated = await prisma.appointment.update({
        where: { id },
        data: { status: validation.data.status },
        include: {
          customer: true,
          staff: {
            include: {
              user: {
                select: { name: true },
              },
            },
          },
          service: true,
        },
      })

      // Invia email in base allo stato
      const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('it-IT', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(date)
      }

      const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('it-IT', {
          hour: '2-digit',
          minute: '2-digit',
        }).format(date)
      }

      const formatPrice = (price: number) => {
        return new Intl.NumberFormat('it-IT', {
          style: 'currency',
          currency: 'EUR',
        }).format(price)
      }

      if (validation.data.status === AppointmentStatus.CONFIRMED) {
        // Email conferma al cliente
        await sendBookingConfirmationEmail(
          context.tenant.id,
          updated.customer.email,
          {
            customerName: updated.customer.name,
            serviceName: updated.service.name,
            bookingDate: formatDate(updated.startTime),
            bookingTime: formatTime(updated.startTime),
            totalPrice: formatPrice(updated.totalPrice),
          }
        )
      } else if (validation.data.status === AppointmentStatus.CANCELLED) {
        // Email rifiuto al cliente
        await sendBookingRejectionEmail(
          context.tenant.id,
          updated.customer.email,
          {
            customerName: updated.customer.name,
            serviceName: updated.service.name,
            bookingDate: formatDate(updated.startTime),
            bookingTime: formatTime(updated.startTime),
          }
        )
      }

      return NextResponse.json({
        message: 'Appointment updated',
        appointment: updated,
      })
    }

    return NextResponse.json(
      { error: 'No valid update fields provided' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Update appointment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/appointments/[id] - Cancel appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult
    const { id } = await params

    // Find appointment
    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        tenantId: context.tenant.id,
      },
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (context.user.role === UserRole.STAFF) {
      const staff = await prisma.staff.findUnique({
        where: {
          tenantId_userId: {
            tenantId: context.tenant.id,
            userId: context.user.userId,
          },
        },
      })

      if (!staff || staff.id !== appointment.staffId) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }
    }

    // Update status to cancelled
    await prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELLED },
    })

    return NextResponse.json({
      message: 'Appointment cancelled',
    })
  } catch (error) {
    console.error('Cancel appointment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
