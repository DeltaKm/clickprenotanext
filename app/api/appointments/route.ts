import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, getTenantContext } from '@/lib/api-middleware'
import { createAppointmentSchema } from '@/lib/validations'
import { AppointmentStatus, UserRole } from '@prisma/client'

// GET /api/appointments - List appointments
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as AppointmentStatus | null
    const staffId = searchParams.get('staffId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause based on role
    const whereClause: any = {
      tenantId: context.tenant.id,
    }

    // Staff can only see their own appointments
    if (context.user.role === UserRole.STAFF) {
      const staff = await prisma.staff.findUnique({
        where: {
          tenantId_userId: {
            tenantId: context.tenant.id,
            userId: context.user.userId,
          },
        },
      })

      if (!staff) {
        return NextResponse.json(
          { error: 'Staff profile not found' },
          { status: 404 }
        )
      }

      whereClause.staffId = staff.id
    }

    // Apply filters
    if (status) {
      whereClause.status = status
    }

    if (staffId) {
      whereClause.staffId = staffId
    }

    if (startDate || endDate) {
      whereClause.startTime = {}
      if (startDate) {
        whereClause.startTime.gte = new Date(startDate)
      }
      if (endDate) {
        whereClause.startTime.lte = new Date(endDate)
      }
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        customer: true,
        staff: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        service: true,
        coupon: true,
      },
      orderBy: { startTime: 'asc' },
      take: 100,
    })

    return NextResponse.json({ appointments })
  } catch (error) {
    console.error('Get appointments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/appointments - Create appointment (public for booking)
export async function POST(request: NextRequest) {
  try {
    const tenantContext = await getTenantContext(request)
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Check if tenant has active license
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantContext.id },
      select: { slug: true, expiresAt: true, isActive: true },
    })

    if (!tenant || !tenant.isActive) {
      return NextResponse.json(
        { error: 'Tenant not available' },
        { status: 403 }
      )
    }

    // Check license expiration (except for demo tenants)
    const demoTenants = ['demo', 'super-admin', 'admin-system']
    const isDemo = demoTenants.includes(tenant.slug)
    const now = new Date()
    const isExpired = isDemo 
      ? false 
      : !tenant.expiresAt || new Date(tenant.expiresAt) < now

    if (isExpired) {
      return NextResponse.json(
        { error: 'Le prenotazioni non sono al momento disponibili. Contatta il fornitore del servizio.' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate input
    const validation = createAppointmentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    const data = validation.data

    // Get or create customer
    let customerId = data.customerId

    if (!customerId && data.customerEmail && data.customerName) {
      // Find or create customer
      let customer = await prisma.customer.findUnique({
        where: {
          tenantId_email: {
            tenantId: tenantContext.id,
            email: data.customerEmail,
          },
        },
      })

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            tenantId: tenantContext.id,
            email: data.customerEmail,
            name: data.customerName,
            phone: data.customerPhone,
          },
        })
      }

      customerId = customer.id
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer information required' },
        { status: 400 }
      )
    }

    // Verify service belongs to tenant
    const service = await prisma.service.findFirst({
      where: {
        id: data.serviceId,
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

    // Verify staff if provided
    let staff = null
    if (data.staffId) {
      staff = await prisma.staff.findFirst({
        where: {
          id: data.staffId,
          tenantId: tenantContext.id,
          isActive: true,
        },
      })

      if (!staff) {
        return NextResponse.json(
          { error: 'Staff not found' },
          { status: 404 }
        )
      }
    } else {
      // If no staff specified, try to find any staff for this service
      const availableStaff = await prisma.staff.findFirst({
        where: {
          tenantId: tenantContext.id,
          isActive: true,
          staffServices: {
            some: {
              serviceId: data.serviceId,
            },
          },
        },
      })

      staff = availableStaff
    }

    // Calculate end time
    const startTime = new Date(data.startTime)
    const endTime = new Date(startTime.getTime() + service.duration * 60000)

    // Check for conflicts only if staff is assigned
    if (staff) {
      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          tenantId: tenantContext.id,
          staffId: staff.id,
          status: {
            in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
          },
          OR: [
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gt: startTime } },
              ],
            },
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } },
              ],
            },
            {
              AND: [
                { startTime: { gte: startTime } },
                { endTime: { lte: endTime } },
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
    }

    // Apply coupon if provided
    let totalPrice = service.price
    let couponId = null

    if (data.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: {
          tenantId_code: {
            tenantId: tenantContext.id,
            code: data.couponCode.toUpperCase(),
          },
        },
      })

      if (coupon && coupon.isActive) {
        const now = new Date()
        if (now >= coupon.validFrom && now <= coupon.validTo) {
          if (!coupon.maxUses || coupon.usedCount < coupon.maxUses) {
            // Apply discount
            if (coupon.discountType === 'PERCENTAGE') {
              totalPrice = totalPrice * (1 - coupon.discountValue / 100)
            } else {
              totalPrice = Math.max(0, totalPrice - coupon.discountValue)
            }
            couponId = coupon.id

            // Increment usage count
            await prisma.coupon.update({
              where: { id: coupon.id },
              data: { usedCount: { increment: 1 } },
            })
          }
        }
      }
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        tenantId: tenantContext.id,
        customerId,
        staffId: staff?.id,
        serviceId: data.serviceId,
        startTime,
        endTime,
        notes: data.notes,
        totalPrice,
        couponId,
        status: AppointmentStatus.PENDING,
      },
      include: {
        customer: true,
        staff: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        service: true,
      },
    })

    return NextResponse.json(
      { message: 'Appointment created', appointment },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create appointment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
