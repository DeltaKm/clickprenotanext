import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api-middleware'
import { UserRole } from '@prisma/client'

// GET - Ottieni template email
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, [UserRole.OWNER, UserRole.ADMIN])
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult
    const tenant = await prisma.tenant.findUnique({
      where: { id: context.tenant.id },
      select: {
        emailTemplates: true,
      },
    })

    return NextResponse.json({
      emailTemplates: tenant?.emailTemplates || null,
    })
  } catch (error) {
    console.error('Get email templates error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Aggiorna template email personalizzati (alias per PUT)
export async function POST(request: NextRequest) {
  return PUT(request)
}

// PUT - Aggiorna template email personalizzati
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireRole(request, [UserRole.OWNER, UserRole.ADMIN])
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult
    const body = await request.json()
    const emailTemplates = body.emailTemplates || body

    // Aggiorna template nel tenant
    const updatedTenant = await prisma.tenant.update({
      where: { id: context.tenant.id },
      data: {
        emailTemplates,
      },
    })

    return NextResponse.json({
      message: 'Template email aggiornati con successo',
      emailTemplates: updatedTenant.emailTemplates,
    })
  } catch (error) {
    console.error('Update email templates error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
