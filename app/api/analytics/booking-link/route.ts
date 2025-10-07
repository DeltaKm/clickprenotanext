import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api-middleware'
import { UserRole } from '@prisma/client'

// GET /api/analytics/booking-link - Get booking link analytics
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, [UserRole.OWNER, UserRole.STAFF])
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get total appointments created in period (as proxy for conversions)
    const totalAppointments = await prisma.appointment.count({
      where: {
        tenantId: context.tenant.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    // Get appointments by status
    const appointmentsByStatus = await prisma.appointment.groupBy({
      by: ['status'],
      where: {
        tenantId: context.tenant.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    })

    // Get new customers in period
    const newCustomers = await prisma.customer.count({
      where: {
        tenantId: context.tenant.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    // Calculate conversion rate (simplified - in production, track actual visits)
    // For now, we'll use a simulated metric
    const estimatedVisits = totalAppointments * 3 // Assume 3 visits per booking
    const conversionRate = estimatedVisits > 0 
      ? ((totalAppointments / estimatedVisits) * 100).toFixed(1)
      : '0.0'

    return NextResponse.json({
      analytics: {
        totalVisits: estimatedVisits,
        totalBookings: totalAppointments,
        conversionRate: parseFloat(conversionRate),
        newCustomers,
        appointmentsByStatus: appointmentsByStatus.map(item => ({
          status: item.status,
          count: item._count,
        })),
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          days,
        },
      },
    })
  } catch (error) {
    console.error('Get analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
