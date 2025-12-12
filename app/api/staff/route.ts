import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, getTenantContext } from '@/lib/api-middleware'
import { createStaffSchema } from '@/lib/validations'
import { hashPassword } from '@/lib/auth'
import { UserRole } from '@prisma/client'

// GET /api/staff - List staff (public)
export async function GET(request: NextRequest) {
  try {
    const tenantContext = await getTenantContext(request)
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')

    const staff = await prisma.staff.findMany({
      where: {
        tenantId: tenantContext.id,
        ...(isActive !== null && { isActive: isActive === 'true' }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        staffServices: {
          include: {
            service: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ staff })
  } catch (error) {
    console.error('Get staff error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/staff - Create staff (Owner only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(request, [UserRole.OWNER])
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult
    const body = await request.json()

    // Validate input
    const validation = createStaffSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { email, password, name, bio, avatar } = validation.data
    const serviceIds = body.serviceIds || []
    
    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase()

    // Check if user already exists (email is now unique globally)
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email già in uso' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user and staff in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          tenantId: context.tenant.id,
          email: normalizedEmail,
          passwordHash,
          name,
          role: UserRole.STAFF,
        },
      })

      const staff = await tx.staff.create({
        data: {
          tenantId: context.tenant.id,
          userId: user.id,
          bio,
          avatar,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      })

      // Create staff-service relationships
      if (serviceIds.length > 0) {
        await tx.staffService.createMany({
          data: serviceIds.map((serviceId: string) => ({
            tenantId: context.tenant.id,
            staffId: staff.id,
            serviceId,
          })),
        })
      }

      return staff
    })

    return NextResponse.json(
      { message: 'Staff created', staff: result },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create staff error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
