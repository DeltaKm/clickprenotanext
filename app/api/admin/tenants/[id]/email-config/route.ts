import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Get email config for a specific tenant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyAccessToken(token)

    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const { id: tenantId } = await params

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        emailConfig: true,
        adminId: true,
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Verify tenant belongs to this admin
    if (tenant.adminId !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden - Not your tenant' }, { status: 403 })
    }

    return NextResponse.json({ emailConfig: tenant.emailConfig })
  } catch (error) {
    console.error('Get tenant email config error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
