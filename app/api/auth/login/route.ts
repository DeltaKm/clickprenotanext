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

    // Check if this is a super admin or admin login
    const adminUser = await prisma.user.findFirst({
      where: {
        email,
        role: { in: ['SUPER_ADMIN', 'ADMIN'] },
      },
      include: {
        tenant: true,
      },
    })

    let user
    let tenant

    if (adminUser) {
      // Super admin or Admin login
      user = adminUser
      tenant = adminUser.tenant
    } else {
      // Regular tenant-based login
      // Try to find user by email across all tenants
      const foundUser = await prisma.user.findFirst({
        where: {
          email,
          role: { notIn: ['SUPER_ADMIN', 'ADMIN'] }, // Exclude admin users
        },
        include: {
          tenant: true,
        },
      })

      if (!foundUser || !foundUser.isActive) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        )
      }

      // Check if tenant is active
      if (!foundUser.tenant || !foundUser.tenant.isActive) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        )
      }

      user = foundUser
      tenant = foundUser.tenant
    }

    // Final check: ensure we have both user and tenant
    if (!user || !tenant) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

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
