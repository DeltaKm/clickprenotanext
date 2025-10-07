import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, getTenantContext } from '@/lib/api-middleware'
import { createCustomerSchema } from '@/lib/validations'
import { UserRole } from '@prisma/client'

// GET /api/customers - List customers (Owner/Staff only)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, [UserRole.OWNER, UserRole.STAFF])
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const customers = await prisma.customer.findMany({
      where: {
        tenantId: context.tenant.id,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ customers })
  } catch (error) {
    console.error('Get customers error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/customers - Create customer (public for booking flow)
export async function POST(request: NextRequest) {
  try {
    const tenantContext = await getTenantContext(request)
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Validate input
    const validation = createCustomerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    // Check if customer already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenantContext.id,
          email: validation.data.email,
        },
      },
    })

    if (existingCustomer) {
      // Update existing customer
      const customer = await prisma.customer.update({
        where: { id: existingCustomer.id },
        data: validation.data,
      })

      return NextResponse.json({ customer })
    }

    // Create new customer
    const customer = await prisma.customer.create({
      data: {
        ...validation.data,
        tenantId: tenantContext.id,
      },
    })

    return NextResponse.json(
      { message: 'Customer created', customer },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create customer error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
