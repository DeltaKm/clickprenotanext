'use client'

import { useEffect, useState } from 'react'
import { Calendar, Users, TrendingUp, Link as LinkIcon, Copy, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { useLicenseStatus } from '@/lib/hooks/useLicenseStatus'
import { LicenseBanner } from '@/components/LicenseBanner'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalAppointments: 0,
    todayAppointments: 0,
    totalCustomers: 0,
    totalRevenue: 0,
  })
  const [recentAppointments, setRecentAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [bookingLink, setBookingLink] = useState('')
  const [copied, setCopied] = useState(false)
  const { licenseStatus, loading: licenseLoading } = useLicenseStatus()

  useEffect(() => {
    fetchDashboardData()
    // Get booking link with tenant
    const fetchBookingLink = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        
        // Get tenant info from stored user data or fetch it
        const response = await fetch('/api/tenant/info', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          const host = window.location.host
          const protocol = window.location.protocol
          
          // Always use query parameter format for compatibility
          const tenantSlug = data.tenant.slug
          setBookingLink(`${protocol}//${host}/book?tenant=${tenantSlug}`)
        }
      } catch (error) {
        console.error('Error fetching booking link:', error)
        // Fallback
        const host = window.location.host
        const protocol = window.location.protocol
        setBookingLink(`${protocol}//${host}/book`)
      }
    }
    
    fetchBookingLink()
  }, [])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bookingLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      
      // Fetch appointments - PENDING and CONFIRMED for dashboard
      const appointmentsRes = await fetch('/api/appointments', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (appointmentsRes.ok) {
        const { appointments } = await appointmentsRes.json()
        
        // Calculate stats
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        
        const todayAppts = appointments.filter((apt: any) => {
          const aptDate = new Date(apt.startTime)
          return aptDate >= today && aptDate < tomorrow
        })
        
        const totalRevenue = appointments
          .filter((apt: any) => apt.status === 'COMPLETED')
          .reduce((sum: number, apt: any) => sum + apt.totalPrice, 0)
        
        setStats({
          totalAppointments: appointments.length,
          todayAppointments: todayAppts.length,
          totalCustomers: 0, // Will be updated with customers API
          totalRevenue,
        })
        
        // Get recent appointments (next 5) - only PENDING and CONFIRMED
        const upcoming = appointments
          .filter((apt: any) => {
            const isFuture = new Date(apt.startTime) >= new Date()
            const isRelevant = apt.status === 'PENDING' || apt.status === 'CONFIRMED'
            return isFuture && isRelevant
          })
          .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
          .slice(0, 5)
        
        setRecentAppointments(upcoming)
      }
      
      // Fetch customers count
      const customersRes = await fetch('/api/customers', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (customersRes.ok) {
        const { customers } = await customersRes.json()
        setStats(prev => ({ ...prev, totalCustomers: customers.length }))
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Caricamento...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Panoramica della tua attività</p>
      </div>

      {/* License Status Banner */}
      {!licenseLoading && <LicenseBanner licenseStatus={licenseStatus} />}

      {/* License Expiration Info - Show when active */}
      {!licenseLoading && !licenseStatus.isExpired && licenseStatus.expiresAt && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">Licenza Attiva</p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Scadenza: {new Date(licenseStatus.expiresAt).toLocaleDateString('it-IT', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs sm:text-sm font-medium text-green-700">
                  {licenseStatus.daysRemaining} giorni rimanenti
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking Link Widget */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <LinkIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            Link di Prenotazione Pubblico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs sm:text-sm text-gray-600 mb-4">
            Condividi questo link con i tuoi clienti per permettere loro di prenotare online
          </p>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="flex-1 bg-white rounded-lg border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 font-mono text-xs sm:text-sm text-gray-700 break-all">
              {bookingLink || 'Caricamento...'}
            </div>
            <div className="flex gap-2">
              <Button onClick={copyToClipboard} variant="outline" className="gap-2 flex-1 sm:flex-none">
                <Copy className="h-4 w-4" />
                <span className="sm:inline">{copied ? 'Copiato!' : 'Copia'}</span>
              </Button>
              <Button asChild variant="default" className="gap-2 flex-1 sm:flex-none">
                <a href={bookingLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  <span className="sm:inline">Apri</span>
                </a>
              </Button>
            </div>
          </div>
          <Link href="/dashboard/booking-link">
            <Button variant="link" className="p-0 h-auto text-blue-600">
              Visualizza QR Code e opzioni avanzate →
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Appuntamenti Totali
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAppointments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Oggi
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.todayAppointments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Clienti
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Fatturato
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalRevenue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Prossimi Appuntamenti</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAppointments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nessun appuntamento in programma
            </p>
          ) : (
            <div className="space-y-4">
              {recentAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 gap-3"
                >
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                          {appointment.customer.name}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                          {appointment.service.name}
                          {appointment.staff && ` • ${appointment.staff.user.name}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto gap-2 sm:space-y-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-900">
                      {formatDateTime(appointment.startTime)}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        appointment.status === 'CONFIRMED' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {appointment.status === 'CONFIRMED' ? 'Confermato' : 'In Attesa'}
                      </span>
                      <p className="text-xs sm:text-sm text-gray-600 font-medium">
                        {formatCurrency(appointment.totalPrice)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
