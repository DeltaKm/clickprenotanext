import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateTokenPair } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { email, password } = validation.data
    
    // Normalize email to lowercase for case-insensitive comparison
    const normalizedEmail = email.toLowerCase()

    // Find user by email (now unique globally)
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        tenant: true,
      },
    })

    // Check if user exists and is active
    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if tenant exists
    if (!user.tenant) {
      return NextResponse.json(
        { error: 'Account non trovato' },
        { status: 401 }
      )
    }

    // Check if tenant is active
    if (!user.tenant.isActive) {
      return NextResponse.json(
        { error: 'Account disattivato. Contatta l\'amministratore per maggiori informazioni.' },
        { status: 403 }
      )
    }

    const tenant = user.tenant

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      tenantId: tenant.id,
      email: user.email,
      role: user.role,
    })

    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
      },
      ...tokens,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
