import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, getTenantContext } from '@/lib/api-middleware'
import { createServiceSchema } from '@/lib/validations'
import { UserRole } from '@prisma/client'

// GET /api/services - List services (public)
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

    const services = await prisma.service.findMany({
      where: {
        tenantId: tenantContext.id,
        ...(isActive !== null && { isActive: isActive === 'true' }),
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ services })
  } catch (error) {
    console.error('Get services error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/services - Create service (Owner only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(request, [UserRole.OWNER])
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult
    const body = await request.json()

    // Validate input
    const validation = createServiceSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    const service = await prisma.service.create({
      data: {
        ...validation.data,
        price: validation.data.price ?? 0,
        tenantId: context.tenant.id,
      },
    })

    return NextResponse.json(
      { message: 'Service created', service },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create service error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
