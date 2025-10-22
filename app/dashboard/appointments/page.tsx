'use client'

import { useEffect, useState } from 'react'
import { Calendar, Clock, User, Briefcase, Filter, Eye, Users, Umbrella } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import { useLicenseStatus } from '@/lib/hooks/useLicenseStatus'
import { LicenseBanner } from '@/components/LicenseBanner'
import { ProtectedAction } from '@/components/ProtectedAction'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [services, setServices] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [formData, setFormData] = useState({
    serviceId: '',
    customerId: '',
    staffId: '',
    date: '',
    time: '',
    notes: '',
  })
  const [formLoading, setFormLoading] = useState(false)
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; appointmentId: string | null }>({ open: false, appointmentId: null })
  const { licenseStatus, loading: licenseLoading } = useLicenseStatus()

  useEffect(() => {
    fetchAppointments()
    fetchServices()
    fetchCustomers()
    fetchStaff()
  }, [statusFilter])

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/services?isActive=true', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setServices(data.services)
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/customers', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/staff?isActive=true', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setStaff(data.staff)
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
    }
  }

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

  const handleCancelClick = (appointmentId: string) => {
    setCancelDialog({ open: true, appointmentId })
  }

  const handleCancelAppointment = async () => {
    if (!cancelDialog.appointmentId) return

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/appointments/${cancelDialog.appointmentId}`, {
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

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      const token = localStorage.getItem('accessToken')
      const selectedService = services.find(s => s.id === formData.serviceId)
      
      if (!selectedService) {
        alert('Seleziona un servizio')
        setFormLoading(false)
        return
      }

      const startTime = new Date(`${formData.date}T${formData.time}:00`)
      
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: formData.serviceId,
          customerId: formData.customerId,
          staffId: formData.staffId || undefined,
          startTime: startTime.toISOString(),
          notes: formData.notes,
        }),
      })

      if (response.ok) {
        setShowCreateModal(false)
        setFormData({
          serviceId: '',
          customerId: '',
          staffId: '',
          date: '',
          time: '',
          notes: '',
        })
        fetchAppointments()
        alert('Appuntamento creato con successo!')
      } else {
        const error = await response.json()
        alert(error.error || 'Errore durante la creazione dell\'appuntamento')
      }
    } catch (error) {
      console.error('Error creating appointment:', error)
      alert('Errore durante la creazione dell\'appuntamento')
    } finally {
      setFormLoading(false)
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Appuntamenti</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Gestisci tutti gli appuntamenti</p>
        </div>
        <ProtectedAction licenseStatus={licenseStatus}>
          <Button 
            className="w-full sm:w-auto"
            onClick={() => setShowCreateModal(true)}
          >
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
            <Filter className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
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
                <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                  <div className="flex-1 space-y-3 w-full">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-wrap">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base sm:text-lg text-gray-900 truncate">
                          {appointment.customer.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                          {appointment.customer.email}
                        </p>
                      </div>
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {getStatusLabel(appointment.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 sm:pl-16">
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
                      <div className="sm:pl-16">
                        <p className="text-xs sm:text-sm text-gray-600">
                          <span className="font-medium">Note:</span> {appointment.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="w-full lg:w-auto lg:text-right space-y-2 lg:min-w-[200px]">
                    <p className="text-lg sm:text-xl font-bold text-gray-900">
                      {formatCurrency(appointment.totalPrice)}
                    </p>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedAppointment(appointment)
                        setShowDetailsModal(true)
                      }}
                      className="w-full"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Dettagli
                    </Button>
                    
                    {appointment.status === 'PENDING' && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(appointment.id, 'CONFIRMED')}
                          className="flex-1"
                        >
                          Conferma
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelClick(appointment.id)}
                          className="flex-1"
                        >
                          Cancella
                        </Button>
                      </div>
                    )}

                    {appointment.status === 'CONFIRMED' && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(appointment.id, 'COMPLETED')}
                          className="flex-1"
                        >
                          Completa
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelClick(appointment.id)}
                          className="flex-1"
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

      {/* Create Appointment Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuovo Appuntamento</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateAppointment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerId">Cliente *</Label>
              <Select value={formData.customerId} onValueChange={(value) => setFormData({ ...formData, customerId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} - {customer.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceId">Servizio *</Label>
              <Select value={formData.serviceId} onValueChange={(value) => setFormData({ ...formData, serviceId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona servizio" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - {formatCurrency(service.price)} ({service.duration} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="staffId">Operatore (opzionale)</Label>
              <Select value={formData.staffId} onValueChange={(value) => setFormData({ ...formData, staffId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Nessuno (auto-assegnazione)" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Ora *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Note aggiuntive..."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                disabled={formLoading}
                className="flex-1"
              >
                Annulla
              </Button>
              <Button type="submit" disabled={formLoading} className="flex-1">
                {formLoading ? 'Creazione...' : 'Crea Appuntamento'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dettagli Appuntamento</DialogTitle>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Customer Info */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-900 mb-3">Cliente</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Nome</p>
                    <p className="font-medium">{selectedAppointment.customer.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-medium">{selectedAppointment.customer.email}</p>
                  </div>
                  {selectedAppointment.customer.phone && (
                    <div>
                      <p className="text-gray-600">Telefono</p>
                      <p className="font-medium">{selectedAppointment.customer.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Service Info */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-900 mb-3">Servizio</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Nome Servizio</p>
                    <p className="font-medium">{selectedAppointment.service.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Durata</p>
                    <p className="font-medium">{selectedAppointment.service.duration} minuti</p>
                  </div>
                  {selectedAppointment.staff && (
                    <div>
                      <p className="text-gray-600">Operatore</p>
                      <p className="font-medium">{selectedAppointment.staff.user.name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-600">Data e Ora</p>
                    <p className="font-medium">{formatDateTime(selectedAppointment.startTime)}</p>
                  </div>
                </div>
              </div>

              {/* Restaurant-specific Info */}
              {selectedAppointment.numberOfPeople && selectedAppointment.service.category === 'RESTAURANT' && (
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Informazioni Ristorante
                  </h3>
                  <div className="text-sm">
                    <p className="text-gray-600">Numero di Persone</p>
                    <p className="font-medium text-lg">{selectedAppointment.numberOfPeople}</p>
                  </div>
                </div>
              )}

              {/* Beach-specific Info */}
              {selectedAppointment.service.category === 'BEACH' && (
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Umbrella className="h-5 w-5" />
                    Informazioni Stabilimento
                  </h3>
                  
                  {selectedAppointment.numberOfPeople && (
                    <div className="text-sm mb-4">
                      <p className="text-gray-600">Numero di Persone</p>
                      <p className="font-medium text-lg">{selectedAppointment.numberOfPeople}</p>
                    </div>
                  )}
                  
                  {selectedAppointment.beachEquipment && (
                    <>
                      <p className="text-sm font-medium text-gray-700 mb-2">Attrezzatura</p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        {selectedAppointment.beachEquipment.umbrellas > 0 && (
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-gray-600 text-xs">Ombrelloni</p>
                            <p className="font-bold text-2xl text-blue-600">
                              {selectedAppointment.beachEquipment.umbrellas}
                            </p>
                          </div>
                        )}
                        {selectedAppointment.beachEquipment.sunbeds > 0 && (
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-gray-600 text-xs">Lettini</p>
                            <p className="font-bold text-2xl text-green-600">
                              {selectedAppointment.beachEquipment.sunbeds}
                            </p>
                          </div>
                        )}
                        {selectedAppointment.beachEquipment.deckchairs > 0 && (
                          <div className="bg-yellow-50 p-3 rounded-lg">
                            <p className="text-gray-600 text-xs">Sdraio</p>
                            <p className="font-bold text-2xl text-yellow-600">
                              {selectedAppointment.beachEquipment.deckchairs}
                            </p>
                          </div>
                        )}
                      </div>
                      {selectedAppointment.beachEquipment.withRestaurant && (
                        <div className="mt-3 bg-orange-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-orange-800">
                            ✓ Con servizio ristorazione
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Custom Fields */}
              {selectedAppointment.customFieldsData && selectedAppointment.customFieldsData.length > 0 && (
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Opzioni Aggiuntive</h3>
                  <div className="space-y-2">
                    {selectedAppointment.customFieldsData.map((field: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{field.name}</span>
                        <span className="text-sm text-gray-600">
                          {field.quantity ? `Quantità: ${field.quantity}` : '✓'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedAppointment.notes && (
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Note</h3>
                  <p className="text-sm text-gray-600">{selectedAppointment.notes}</p>
                </div>
              )}

              {/* Price & Status */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Stato</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedAppointment.status)}`}>
                    {getStatusLabel(selectedAppointment.status)}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Totale</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(selectedAppointment.totalPrice)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedAppointment.status === 'PENDING' && (
                  <>
                    <Button
                      onClick={() => {
                        handleUpdateStatus(selectedAppointment.id, 'CONFIRMED')
                        setShowDetailsModal(false)
                      }}
                      className="flex-1"
                    >
                      Conferma Appuntamento
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleCancelClick(selectedAppointment.id)
                        setShowDetailsModal(false)
                      }}
                      className="flex-1"
                    >
                      Cancella
                    </Button>
                  </>
                )}
                {selectedAppointment.status === 'CONFIRMED' && (
                  <>
                    <Button
                      onClick={() => {
                        handleUpdateStatus(selectedAppointment.id, 'COMPLETED')
                        setShowDetailsModal(false)
                      }}
                      className="flex-1"
                    >
                      Segna come Completato
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleCancelClick(selectedAppointment.id)
                        setShowDetailsModal(false)
                      }}
                      className="flex-1"
                    >
                      Cancella
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={cancelDialog.open}
        onOpenChange={(open) => setCancelDialog({ ...cancelDialog, open })}
        onConfirm={handleCancelAppointment}
        title="Cancella Appuntamento"
        description="Sei sicuro di voler cancellare questo appuntamento? Questa azione non può essere annullata."
        confirmText="Cancella"
        cancelText="Annulla"
      />
    </div>
  )
}
