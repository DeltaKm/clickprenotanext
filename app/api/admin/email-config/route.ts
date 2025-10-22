import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/auth'
import { UserRole } from '@prisma/client'

// GET - Ottieni configurazione email per i tenant dell'admin
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyAccessToken(token)

    if (!payload || payload.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    // Ottieni configurazione email di default per i tenant dell'admin
    const admin = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        tenant: {
          select: {
            emailConfig: true,
          },
        },
      },
    })

    return NextResponse.json({
      emailConfig: admin?.tenant?.emailConfig || null,
    })
  } catch (error) {
    console.error('Get email config error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Salva configurazione email per i tenant dell'admin
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyAccessToken(token)

    if (!payload || payload.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const body = await request.json()
    const { host, port, secure, user, pass, from, fromName } = body

    // Validazione
    if (!host || !port || !user || !pass || !from || !fromName) {
      return NextResponse.json(
        { error: 'Tutti i campi sono obbligatori' },
        { status: 400 }
      )
    }

    // Salva configurazione nel tenant dell'admin (che verrà usata come default)
    const admin = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true },
    })

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    const emailConfig = {
      host,
      port: parseInt(port),
      secure: secure === true || secure === 'true',
      user,
      pass,
      from,
      fromName,
    }

    // Aggiorna configurazione nel tenant admin
    await prisma.tenant.update({
      where: { id: admin.tenantId },
      data: { emailConfig },
    })

    // Applica configurazione SOLO ai tenant che NON hanno una configurazione personalizzata
    // (cioè quelli con emailConfig null o undefined)
    await prisma.tenant.updateMany({
      where: { 
        adminId: payload.userId,
        OR: [
          { emailConfig: { equals: null } },
          { emailConfig: { equals: {} as any } },
        ],
      },
      data: { emailConfig },
    })

    return NextResponse.json({
      message: 'Configurazione email salvata. Applicata solo ai business senza configurazione personalizzata.',
      emailConfig,
    })
  } catch (error) {
    console.error('Save email config error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
