'use client'

import { useEffect, useState } from 'react'
import { Calendar, Clock, User, Briefcase, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import { useLicenseStatus } from '@/lib/hooks/useLicenseStatus'
import { LicenseBanner } from '@/components/LicenseBanner'
import { ProtectedAction } from '@/components/ProtectedAction'

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { licenseStatus, loading: licenseLoading } = useLicenseStatus()

  useEffect(() => {
    fetchAppointments()
  }, [statusFilter])

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const url = statusFilter === 'all' 
        ? '/api/appointments'
        : `/api/appointments?status=${statusFilter}`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments)
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'In Attesa',
      CONFIRMED: 'Confermato',
      CANCELLED: 'Cancellato',
      COMPLETED: 'Completato',
      NO_SHOW: 'Non Presentato',
    }
    return labels[status] || status
  }

  const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchAppointments()
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
    }
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Sei sicuro di voler cancellare questo appuntamento?')) {
      return
    }

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchAppointments()
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error)
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appuntamenti</h1>
          <p className="text-gray-600 mt-1">Gestisci tutti gli appuntamenti</p>
        </div>
        <ProtectedAction licenseStatus={licenseStatus}>
          <Button>
            <Calendar className="h-4 w-4 mr-2" />
            Nuovo Appuntamento
          </Button>
        </ProtectedAction>
      </div>

      {/* License Status Banner */}
      {!licenseLoading && <LicenseBanner licenseStatus={licenseStatus} />}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtra per stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                <SelectItem value="PENDING">In Attesa</SelectItem>
                <SelectItem value="CONFIRMED">Confermati</SelectItem>
                <SelectItem value="COMPLETED">Completati</SelectItem>
                <SelectItem value="CANCELLED">Cancellati</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <div className="space-y-4">
        {appointments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nessun appuntamento trovato</p>
            </CardContent>
          </Card>
        ) : (
          appointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          {appointment.customer.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {appointment.customer.email}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {getStatusLabel(appointment.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pl-16">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {formatDateTime(appointment.startTime)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Briefcase className="h-4 w-4" />
                        {appointment.service.name}
                      </div>
                      {appointment.staff && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="h-4 w-4" />
                          {appointment.staff.user.name}
                        </div>
                      )}
                    </div>

                    {appointment.notes && (
                      <div className="pl-16">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Note:</span> {appointment.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="text-right space-y-2">
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(appointment.totalPrice)}
                    </p>
                    
                    {appointment.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(appointment.id, 'CONFIRMED')}
                        >
                          Conferma
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelAppointment(appointment.id)}
                        >
                          Cancella
                        </Button>
                      </div>
                    )}

                    {appointment.status === 'CONFIRMED' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(appointment.id, 'COMPLETED')}
                        >
                          Completa
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelAppointment(appointment.id)}
                        >
                          Cancella
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
