'use client'

import { useState, useEffect } from 'react'
import { Clock, Briefcase, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, formatDate } from '@/lib/utils'

type Step = 'service' | 'staff' | 'datetime' | 'details' | 'confirm'

export default function BookingPage() {
  const [step, setStep] = useState<Step>('service')
  const [services, setServices] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  
  // Tenant customization
  const [brandColor, setBrandColor] = useState('#2563eb')
  const [logo, setLogo] = useState('')
  const [welcomeMessage, setWelcomeMessage] = useState('')

  useEffect(() => {
    // Load customization first, then services
    const loadData = async () => {
      await fetchCustomization()
      await fetchServices()
      setInitialLoading(false)
    }
    loadData()
  }, [])

  const fetchCustomization = async () => {
    try {
      console.log('🎨 Fetching customization...')
      // Add cache-busting parameter to force fresh data
      const response = await fetch('/api/tenant/customization?t=' + Date.now(), {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      console.log('📡 Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Customization data:', data.customization)
        
        if (data.customization) {
          const color = data.customization.brandColor || '#2563eb'
          const logoUrl = data.customization.logo || ''
          const message = data.customization.welcomeMessage || ''
          
          console.log('🎨 Applying:', { color, logoUrl, message })
          
          setBrandColor(color)
          setLogo(logoUrl)
          setWelcomeMessage(message)
        }
      } else {
        console.error('❌ Error response:', await response.text())
      }
    } catch (error) {
      console.error('❌ Error fetching customization:', error)
    }
  }

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services?isActive=true')
      if (response.ok) {
        const data = await response.json()
        console.log('Services loaded:', data.services)
        setServices(data.services)
      } else {
        console.error('Error fetching services:', response.status, await response.text())
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const fetchStaffForService = async (serviceId: string) => {
    try {
      const response = await fetch('/api/staff?isActive=true')
      if (response.ok) {
        const data = await response.json()
        // Filter staff that offer this service
        const filteredStaff = data.staff.filter((s: any) =>
          s.staffServices.some((ss: any) => ss.serviceId === serviceId)
        )
        setStaff(filteredStaff)
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
    }
  }

  const handleServiceSelect = (service: any) => {
    setSelectedService(service)
    fetchStaffForService(service.id)
    setStep('staff')
  }

  const handleStaffSelect = (staffMember: any) => {
    setSelectedStaff(staffMember)
    setStep('datetime')
  }

  const handleDateTimeSelect = () => {
    if (selectedDate && selectedTime) {
      setStep('details')
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const startTime = new Date(`${selectedDate}T${selectedTime}:00`)
      
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: selectedService.id,
          staffId: selectedStaff.id,
          startTime: startTime.toISOString(),
          customerName: customerData.name,
          customerEmail: customerData.email,
          customerPhone: customerData.phone,
          notes: customerData.notes,
        }),
      })

      if (response.ok) {
        setSuccess(true)
        setStep('confirm')
      } else {
        const data = await response.json()
        alert(data.error || 'Errore nella prenotazione')
      }
    } catch (error) {
      console.error('Error creating appointment:', error)
      alert('Errore nella prenotazione')
    } finally {
      setLoading(false)
    }
  }

  // Generate time slots (9:00 - 18:00, every 30 minutes)
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 9; hour < 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
      slots.push(`${hour.toString().padStart(2, '0')}:30`)
    }
    return slots
  }

  // Generate next 14 days
  const generateDates = () => {
    const dates = []
    for (let i = 1; i <= 14; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }
    return dates
  }

  // Show loading screen while fetching customization
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: brandColor }}
          ></div>
          {logo && <img src={logo} alt="Logo" className="h-12 mx-auto mb-2" />}
          <p className="text-gray-600">
            {welcomeMessage ? 'Caricamento...' : 'Caricamento...'}
          </p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Prenotazione Confermata!
            </h2>
            <p className="text-gray-600 mb-6">
              Riceverai una email di conferma a {customerData.email}
            </p>
            <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-600 mb-1">Servizio</p>
              <p className="font-semibold text-gray-900 mb-3">{selectedService.name}</p>
              
              <p className="text-sm text-gray-600 mb-1">Con</p>
              <p className="font-semibold text-gray-900 mb-3">{selectedStaff.user.name}</p>
              
              <p className="text-sm text-gray-600 mb-1">Quando</p>
              <p className="font-semibold text-gray-900">
                {formatDate(selectedDate)} alle {selectedTime}
              </p>
            </div>
            <Button onClick={() => window.location.reload()} className="w-full">
              Nuova Prenotazione
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {logo && (
            <img src={logo} alt="Logo" className="h-16 mx-auto mb-4" />
          )}
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {welcomeMessage || 'Prenota un Appuntamento'}
          </h1>
          <p className="text-gray-600">Scegli il servizio e l&apos;orario che preferisci</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 gap-2">
          {['service', 'staff', 'datetime', 'details'].map((s, idx) => (
            <div key={s} className="flex items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s ? 'text-white' : 
                  ['service', 'staff', 'datetime', 'details'].indexOf(step) > idx ? 'text-white' : 
                  'bg-gray-200 text-gray-600'
                }`}
                style={
                  step === s || ['service', 'staff', 'datetime', 'details'].indexOf(step) > idx
                    ? { backgroundColor: brandColor }
                    : {}
                }
              >
                {idx + 1}
              </div>
              {idx < 3 && <div className="w-12 h-0.5 bg-gray-200 mx-1" />}
            </div>
          ))}
        </div>

        {/* Step: Select Service */}
        {step === 'service' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Seleziona un Servizio</h2>
            {services.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Nessun servizio disponibile al momento</p>
                  <p className="text-sm text-gray-500">
                    Contatta l&apos;attività per maggiori informazioni
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                <Card
                  key={service.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleServiceSelect(service)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${brandColor}20` }}
                      >
                        <Briefcase className="h-6 w-6" style={{ color: brandColor }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">
                          {service.name}
                        </h3>
                        {service.description && (
                          <p className="text-sm text-gray-600 mb-3">
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            {service.duration} min
                          </div>
                          <p className="text-lg font-bold" style={{ color: brandColor }}>
                            {formatCurrency(service.price)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            )}
          </div>
        )}

        {/* Step: Select Staff */}
        {step === 'staff' && (
          <div>
            <Button variant="ghost" onClick={() => setStep('service')} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Seleziona un Operatore</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {staff.map((member) => (
                <Card
                  key={member.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleStaffSelect(member)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${brandColor}20` }}
                      >
                        <span className="text-2xl font-bold" style={{ color: brandColor }}>
                          {member.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">
                          {member.user.name}
                        </h3>
                        {member.bio && (
                          <p className="text-sm text-gray-600">
                            {member.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step: Select Date & Time */}
        {step === 'datetime' && (
          <div>
            <Button variant="ghost" onClick={() => setStep('staff')} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            <Card>
              <CardHeader>
                <CardTitle>Seleziona Data e Ora</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Select value={selectedDate} onValueChange={setSelectedDate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona una data" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateDates().map((date) => (
                        <SelectItem key={date} value={date}>
                          {formatDate(date)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ora</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona un orario" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateTimeSlots().map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleDateTimeSelect}
                  disabled={!selectedDate || !selectedTime}
                  className="w-full"
                  style={{ backgroundColor: brandColor, borderColor: brandColor }}
                >
                  Continua
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step: Customer Details */}
        {step === 'details' && (
          <div>
            <Button variant="ghost" onClick={() => setStep('datetime')} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            <Card>
              <CardHeader>
                <CardTitle>I Tuoi Dati</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={customerData.name}
                    onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerData.email}
                    onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerData.phone}
                    onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Note</Label>
                  <Input
                    id="notes"
                    value={customerData.notes}
                    onChange={(e) => setCustomerData({ ...customerData, notes: e.target.value })}
                    placeholder="Eventuali richieste speciali..."
                  />
                </div>

                {/* Summary */}
                <div className="bg-blue-50 rounded-lg p-4 mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Riepilogo</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Servizio:</span>
                      <span className="font-medium">{selectedService.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Operatore:</span>
                      <span className="font-medium">{selectedStaff.user.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Data e Ora:</span>
                      <span className="font-medium">
                        {formatDate(selectedDate)} - {selectedTime}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-600">Totale:</span>
                      <span className="font-bold text-lg">{formatCurrency(selectedService.price)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!customerData.name || !customerData.email || loading}
                  className="w-full"
                  style={{ backgroundColor: brandColor, borderColor: brandColor }}
                >
                  {loading ? 'Prenotazione in corso...' : 'Conferma Prenotazione'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
