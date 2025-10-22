import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api-middleware'
import { UserRole } from '@prisma/client'

// GET - Ottieni impostazioni tenant
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, [UserRole.OWNER, UserRole.STAFF])
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult

    const tenant = await prisma.tenant.findUnique({
      where: { id: context.tenant.id },
      select: {
        name: true,
        slug: true,
        businessEmail: true,
        businessPhone: true,
        brandColor: true,
        logo: true,
        welcomeMessage: true,
        emailTemplates: true,
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    return NextResponse.json(tenant)
  } catch (error) {
    console.error('Get tenant settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Aggiorna impostazioni tenant
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireRole(request, [UserRole.OWNER])
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult
    const body = await request.json()

    const { name, slug, businessEmail, businessPhone, brandColor, logo, welcomeMessage } = body

    // Validazione slug
    if (slug) {
      const slugRegex = /^[a-z0-9-]+$/
      if (!slugRegex.test(slug)) {
        return NextResponse.json(
          { error: 'Slug non valido. Usa solo lettere minuscole, numeri e trattini.' },
          { status: 400 }
        )
      }

      // Verifica che slug non sia già usato da altro tenant
      const existingTenant = await prisma.tenant.findFirst({
        where: {
          slug,
          id: { not: context.tenant.id },
        },
      })

      if (existingTenant) {
        return NextResponse.json(
          { error: 'Questo slug è già in uso da un altro business' },
          { status: 409 }
        )
      }
    }

    // Aggiorna tenant
    const updatedTenant = await prisma.tenant.update({
      where: { id: context.tenant.id },
      data: {
        name,
        slug,
        businessEmail,
        businessPhone,
        brandColor,
        logo,
        welcomeMessage,
      },
    })

    return NextResponse.json({
      message: 'Impostazioni aggiornate con successo',
      tenant: updatedTenant,
    })
  } catch (error) {
    console.error('Update tenant settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
