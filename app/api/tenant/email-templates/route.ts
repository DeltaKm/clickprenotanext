import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api-middleware'
import { UserRole } from '@prisma/client'

// PUT - Aggiorna template email personalizzati
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireRole(request, [UserRole.OWNER])
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult
    const emailTemplates = await request.json()

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
