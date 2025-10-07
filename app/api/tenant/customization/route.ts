import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, getTenantContext } from '@/lib/api-middleware'
import { UserRole } from '@prisma/client'
import { z } from 'zod'

const customizationSchema = z.object({
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  logo: z.string().url().optional().nullable(),
  welcomeMessage: z.string().max(200).optional().nullable(),
})

// GET /api/tenant/customization - Get tenant customization (PUBLIC)
export async function GET(request: NextRequest) {
  try {
    // Try to get tenant from auth first
    const authResult = await requireRole(request, [UserRole.OWNER, UserRole.STAFF])
    
    let tenantId: string
    
    if ('error' in authResult) {
      // Not authenticated, try to get tenant from context (public access)
      const tenantContext = await getTenantContext(request)
      if (!tenantContext) {
        return NextResponse.json(
          { error: 'Tenant not found' },
          { status: 404 }
        )
      }
      tenantId = tenantContext.id
    } else {
      // Authenticated
      tenantId = authResult.context.tenant.id
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        brandColor: true,
        logo: true,
        welcomeMessage: true,
      },
    })

    return NextResponse.json(
      { customization: tenant },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  } catch (error) {
    console.error('Get customization error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/tenant/customization - Update tenant customization
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireRole(request, [UserRole.OWNER])
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult
    const body = await request.json()

    // Validate input
    const validation = customizationSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    const tenant = await prisma.tenant.update({
      where: { id: context.tenant.id },
      data: validation.data,
      select: {
        brandColor: true,
        logo: true,
        welcomeMessage: true,
      },
    })

    return NextResponse.json({
      message: 'Customization updated',
      customization: tenant,
    })
  } catch (error) {
    console.error('Update customization error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
