import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantContext } from '@/lib/api-middleware'
import { AppointmentStatus } from '@prisma/client'

/**
 * GET /api/services/[id]/available-slots
 * Returns available time slots for a service on a specific date
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantContext = await getTenantContext(request)
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') // Format: YYYY-MM-DD
    const staffId = searchParams.get('staffId') // Optional

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      )
    }

    // Get service with availability settings
    const service = await prisma.service.findFirst({
      where: {
        id: params.id,
        tenantId: tenantContext.id,
        isActive: true,
      },
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Use default values if service doesn't have availability settings
    const availableDays = service.availableDays?.length > 0 
      ? service.availableDays 
      : ['1', '2', '3', '4', '5'] // Default: Mon-Fri
    const startTime = service.startTime || '09:00'
    const endTime = service.endTime || '18:00'
    const slotDuration = service.slotDuration || 30

    console.log('Service availability:', {
      serviceId: service.id,
      serviceName: service.name,
      availableDays,
      startTime,
      endTime,
      slotDuration,
      duration: service.duration,
    })

    // Check if the requested date is an available day
    const requestedDate = new Date(date)
    const dayOfWeek = requestedDate.getDay().toString()

    console.log('Requested date:', { date, dayOfWeek, availableDays })

    if (!availableDays.includes(dayOfWeek)) {
      return NextResponse.json({
        slots: [],
        message: 'Service not available on this day',
      })
    }

    // Check if date is in closed dates
    const closedDates = service.closedDates as Array<{ date: string; reason: string }> || []
    const closedDate = closedDates.find(cd => cd.date === date)
    
    if (closedDate) {
      return NextResponse.json({
        slots: [],
        message: closedDate.reason ? `Chiuso per ${closedDate.reason}` : 'Chiuso',
      })
    }

    // Generate all possible slots for the day
    const slots: string[] = []
    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)

    let currentTime = startHour * 60 + startMinute // Convert to minutes
    const endTimeMinutes = endHour * 60 + endMinute

    while (currentTime + service.duration <= endTimeMinutes) {
      const hours = Math.floor(currentTime / 60)
      const minutes = currentTime % 60
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      slots.push(timeString)
      currentTime += slotDuration
    }

    console.log('Generated slots:', slots.length, slots.slice(0, 5))

    // Get existing appointments for this date and service
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        tenantId: tenantContext.id,
        serviceId: service.id,
        ...(staffId && { staffId }),
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    })

    // Filter out occupied slots
    const availableSlots = slots.filter((slot) => {
      const [hours, minutes] = slot.split(':').map(Number)
      const slotStart = new Date(date)
      slotStart.setHours(hours, minutes, 0, 0)
      const slotEnd = new Date(slotStart.getTime() + service.duration * 60000)

      // Check if this slot conflicts with any existing appointment
      const hasConflict = existingAppointments.some((appointment) => {
        const appointmentStart = new Date(appointment.startTime)
        const appointmentEnd = new Date(appointment.endTime)

        // Check for overlap
        return (
          (slotStart >= appointmentStart && slotStart < appointmentEnd) ||
          (slotEnd > appointmentStart && slotEnd <= appointmentEnd) ||
          (slotStart <= appointmentStart && slotEnd >= appointmentEnd)
        )
      })

      return !hasConflict
    })

    // Check if slot is in the past
    const now = new Date()
    const availableFutureSlots = availableSlots.filter((slot) => {
      const [hours, minutes] = slot.split(':').map(Number)
      const slotTime = new Date(date)
      slotTime.setHours(hours, minutes, 0, 0)
      return slotTime > now
    })

    console.log('Filtering results:', {
      totalSlots: slots.length,
      afterConflictFilter: availableSlots.length,
      afterPastFilter: availableFutureSlots.length,
      existingAppointments: existingAppointments.length,
      now: now.toISOString(),
      requestedDate: date,
    })

    return NextResponse.json({
      slots: availableFutureSlots,
      service: {
        id: service.id,
        name: service.name,
        duration: service.duration,
        price: service.price,
      },
    })
  } catch (error) {
    console.error('Error fetching available slots:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
