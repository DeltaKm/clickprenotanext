'use client'

import { useState, useEffect } from 'react'
import { Clock, Briefcase, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DatePicker } from '@/components/DatePicker'

type Step = 'service' | 'staff' | 'datetime' | 'details' | 'confirm' | 'people' | 'equipment'

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
    phonePrefix: '+39',
    phone: '',
    notes: '',
  })
  // Category-specific data
  const [numberOfPeople, setNumberOfPeople] = useState(2)
  const [beachEquipment, setBeachEquipment] = useState({
    umbrellas: 0,
    sunbeds: 0,
    deckchairs: 0,
    withRestaurant: false,
  })
  const [customFieldsData, setCustomFieldsData] = useState<any[]>([])
  const [totalPrice, setTotalPrice] = useState(0)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [bookingDisabled, setBookingDisabled] = useState(false)
  const [disabledMessage, setDisabledMessage] = useState('')
  const [tenantSlug, setTenantSlug] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [closedMessage, setClosedMessage] = useState('')
  
  // Tenant customization
  const [brandColor, setBrandColor] = useState('#2563eb')
  const [logo, setLogo] = useState('')
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [businessName, setBusinessName] = useState('')

  useEffect(() => {
    // Get tenant from URL query parameter
    const params = new URLSearchParams(window.location.search)
    const tenant = params.get('tenant') || 'demo'
    setTenantSlug(tenant)
    
    // Load customization first, then services
    const loadData = async () => {
      await checkTenantStatus(tenant)
      await fetchCustomization(tenant)
      await fetchServices(tenant)
      setInitialLoading(false)
    }
    loadData()
  }, [])

  const checkTenantStatus = async (tenant: string) => {
    try {
      const response = await fetch('/api/tenant/public-status', {
        headers: {
          'x-tenant-slug': tenant,
        },
      })
      if (response.ok) {
        const data = await response.json()
        if (data.tenantName) {
          setBusinessName(data.tenantName)
        }
        if (!data.acceptsBookings) {
          setBookingDisabled(true)
          setDisabledMessage(data.message || 'Le prenotazioni non sono al momento disponibili.')
        }
      }
    } catch (error) {
      console.error('Error checking tenant status:', error)
    }
  }

  const fetchCustomization = async (tenant: string) => {
    try {
      console.log('🎨 Fetching customization...')
      // Add cache-busting parameter to force fresh data
      const response = await fetch('/api/tenant/customization?t=' + Date.now(), {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'x-tenant-slug': tenant,
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

  const fetchServices = async (tenant: string) => {
    try {
      const response = await fetch('/api/services?isActive=true', {
        headers: {
          'x-tenant-slug': tenant,
        },
      })
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
      const response = await fetch('/api/staff?isActive=true', {
        headers: {
          'x-tenant-slug': tenantSlug,
        },
      })
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

  const handleServiceSelect = async (service: any) => {
    setSelectedService(service)
    
    // Different flow based on service category
    if (service.category === 'RESTAURANT') {
      // Restaurant: go to people selection
      setStep('people')
      return
    }
    
    if (service.category === 'BEACH') {
      // Beach: go to equipment selection
      setStep('equipment')
      return
    }
    
    // Professional: fetch staff for this service
    try {
      const response = await fetch('/api/staff?isActive=true', {
        headers: {
          'x-tenant-slug': tenantSlug,
        },
      })
      if (response.ok) {
        const data = await response.json()
        // Filter staff that offer this service
        const filteredStaff = data.staff.filter((s: any) =>
          s.staffServices.some((ss: any) => ss.serviceId === service.id)
        )
        setStaff(filteredStaff)
        
        // If no staff assigned to this service, skip staff selection
        if (filteredStaff.length === 0) {
          setSelectedStaff(null)
          setStep('datetime')
        } else {
          setStep('staff')
        }
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
      // If error, skip staff selection
      setSelectedStaff(null)
      setStep('datetime')
    }
  }

  const handleStaffSelect = (staffMember: any) => {
    setSelectedStaff(staffMember)
    setStep('datetime')
  }

  // Calculate total price
  const calculateTotalPrice = () => {
    if (!selectedService) return 0

    let total = 0
    const category = selectedService.category

    if (category === 'PROFESSIONAL') {
      // Professional: use service price
      total = selectedService.price || 0
    } else if (category === 'RESTAURANT') {
      const config = selectedService.restaurantConfig || {}
      const pricePerPerson = config.pricePerPerson || 0
      
      // Base price: price per person * number of people
      total = pricePerPerson * numberOfPeople
      
      // Add custom fields
      const customFields = config.customFields || []
      customFieldsData.forEach(fieldData => {
        const field = customFields.find((f: any) => f.name === fieldData.name)
        if (field && fieldData.selected) {
          if (field.type === 'checkbox') {
            total += field.price || 0
          } else if (field.type === 'quantity') {
            total += (field.price || 0) * (fieldData.quantity || 0)
          }
        }
      })
    } else if (category === 'BEACH') {
      const config = selectedService.beachConfig || {}
      const pricePerPerson = config.pricePerPerson || 0
      
      // Base price: price per person * number of people
      total = pricePerPerson * numberOfPeople
      
      // Add equipment prices
      if (config.umbrellas?.price) {
        total += (config.umbrellas.price || 0) * beachEquipment.umbrellas
      }
      if (config.sunbeds?.price) {
        total += (config.sunbeds.price || 0) * beachEquipment.sunbeds
      }
      if (config.deckchairs?.price) {
        total += (config.deckchairs.price || 0) * beachEquipment.deckchairs
      }
      
      // Add custom fields
      const customFields = config.customFields || []
      customFieldsData.forEach(fieldData => {
        const field = customFields.find((f: any) => f.name === fieldData.name)
        if (field && fieldData.selected) {
          if (field.type === 'checkbox') {
            total += field.price || 0
          } else if (field.type === 'quantity') {
            total += (field.price || 0) * (fieldData.quantity || 0)
          }
        }
      })
    }

    return total
  }

  // Update total price when relevant data changes
  useEffect(() => {
    setTotalPrice(calculateTotalPrice())
  }, [selectedService, numberOfPeople, beachEquipment, customFieldsData])

  const fetchAvailableSlots = async (date: string) => {
    if (!selectedService || !date) return
    
    setLoadingSlots(true)
    try {
      const params = new URLSearchParams({
        date,
        ...(selectedStaff && { staffId: selectedStaff.id }),
      })
      
      const response = await fetch(
        `/api/services/${selectedService.id}/available-slots?${params}`,
        {
          headers: {
            'x-tenant-slug': tenantSlug,
          },
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.slots || [])
        setClosedMessage(data.message || '')
      } else {
        setAvailableSlots([])
        setClosedMessage('')
      }
    } catch (error) {
      console.error('Error fetching available slots:', error)
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  // Load slots when date changes
  useEffect(() => {
    if (selectedDate && step === 'datetime') {
      fetchAvailableSlots(selectedDate)
      setSelectedTime('') // Reset selected time
    }
  }, [selectedDate, step])

  const handleDateTimeSelect = () => {
    if (selectedDate && selectedTime) {
      setStep('details')
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setErrorMessage('')
    
    try {
      const startTime = new Date(`${selectedDate}T${selectedTime}:00`)
      
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug,
        },
        body: JSON.stringify({
          serviceId: selectedService.id,
          staffId: selectedStaff?.id, // Optional: undefined if no staff selected
          startTime: startTime.toISOString(),
          customerName: customerData.name,
          customerEmail: customerData.email,
          customerPhone: `${customerData.phonePrefix} ${customerData.phone}`,
          notes: customerData.notes,
          // Category-specific data
          numberOfPeople: selectedService.category === 'RESTAURANT' || selectedService.category === 'BEACH' ? numberOfPeople : undefined,
          beachEquipment: selectedService.category === 'BEACH' ? beachEquipment : undefined,
          customFieldsData: customFieldsData.filter(f => f.selected).length > 0 ? customFieldsData.filter(f => f.selected) : undefined,
        }),
      })

      if (response.ok) {
        setSuccess(true)
        setStep('confirm')
      } else {
        const errorData = await response.json()
        
        // Handle validation errors
        if (errorData.details && Array.isArray(errorData.details)) {
          const errors = errorData.details.map((err: any) => {
            if (err.path.includes('customerEmail')) {
              return 'Email non valida. Inserisci un indirizzo email corretto (es: nome@esempio.com)'
            }
            if (err.path.includes('customerName')) {
              return 'Nome richiesto (minimo 2 caratteri)'
            }
            if (err.path.includes('customerPhone')) {
              return 'Numero di telefono obbligatorio'
            }
            return err.message
          }).join('. ')
          setErrorMessage(errors)
        } else {
          setErrorMessage(errorData.error || 'Errore durante la prenotazione. Riprova.')
        }
      }
    } catch (error) {
      console.error('Error creating appointment:', error)
      setErrorMessage('Errore di connessione. Verifica la tua connessione internet e riprova.')
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
              
              {selectedStaff && (
                <>
                  <p className="text-sm text-gray-600 mb-1">Con</p>
                  <p className="font-semibold text-gray-900 mb-3">{selectedStaff.user.name}</p>
                </>
              )}
              
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
          {businessName && (
            <p className="text-lg font-semibold text-gray-700 mb-2">{businessName}</p>
          )}
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {welcomeMessage || 'Prenota un Appuntamento'}
          </h1>
          <p className="text-gray-600">Scegli il servizio e l&apos;orario che preferisci</p>
        </div>

        {/* Progress Indicator */}
        {step !== 'confirm' && !bookingDisabled && selectedService && (
          <div className="mb-8">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between">
                {/* Step 1: Service */}
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step === 'service' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-green-100 text-green-600'
                  }`} style={step === 'service' ? { backgroundColor: brandColor } : {}}>
                    {step === 'service' ? '1' : '✓'}
                  </div>
                  <span className="text-xs mt-2 text-gray-600">Servizio</span>
                </div>
                
                <div className={`flex-1 h-1 mx-2 ${
                  ['staff', 'datetime', 'details'].includes(step) ? 'bg-green-500' : 'bg-gray-200'
                }`}></div>

                {/* Step 2: Staff (conditional) */}
                {staff.length > 0 && (
                  <>
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        step === 'staff' 
                          ? 'bg-blue-600 text-white' 
                          : ['datetime', 'details'].includes(step)
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-200 text-gray-500'
                      }`} style={step === 'staff' ? { backgroundColor: brandColor } : {}}>
                        {['datetime', 'details'].includes(step) ? '✓' : '2'}
                      </div>
                      <span className="text-xs mt-2 text-gray-600">Operatore</span>
                    </div>
                    
                    <div className={`flex-1 h-1 mx-2 ${
                      ['datetime', 'details'].includes(step) ? 'bg-green-500' : 'bg-gray-200'
                    }`}></div>
                  </>
                )}

                {/* Step 3: DateTime */}
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step === 'datetime' 
                      ? 'bg-blue-600 text-white' 
                      : step === 'details'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-200 text-gray-500'
                  }`} style={step === 'datetime' ? { backgroundColor: brandColor } : {}}>
                    {step === 'details' ? '✓' : staff.length > 0 ? '3' : '2'}
                  </div>
                  <span className="text-xs mt-2 text-gray-600">Data/Ora</span>
                </div>
                
                <div className={`flex-1 h-1 mx-2 ${
                  step === 'details' ? 'bg-green-500' : 'bg-gray-200'
                }`}></div>

                {/* Step 4: Details */}
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step === 'details' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`} style={step === 'details' ? { backgroundColor: brandColor } : {}}>
                    {staff.length > 0 ? '4' : '3'}
                  </div>
                  <span className="text-xs mt-2 text-gray-600">I Tuoi Dati</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Booking Disabled Message */}
        {bookingDisabled && (
          <Card className="mb-8 border-red-300 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-red-900 mb-2">
                  Prenotazioni Non Disponibili
                </h3>
                <p className="text-red-700 mb-4">
                  {disabledMessage}
                </p>
                <p className="text-sm text-red-600">
                  Per informazioni, contatta direttamente il fornitore del servizio.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Steps */}
        {!bookingDisabled && (
        <>
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
                          <p className="text-sm text-gray-600">
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            {service.duration} min
                          </div>
                          <p className="text-lg font-bold" style={{ color: brandColor }}>
                            {service.category === 'PROFESSIONAL' ? (
                              service.price > 0 ? formatCurrency(service.price) : 'Prezzo variabile'
                            ) : service.category === 'RESTAURANT' ? (
                              service.restaurantConfig?.pricePerPerson > 0 
                                ? `${formatCurrency(service.restaurantConfig.pricePerPerson)}/persona`
                                : 'Prezzo variabile'
                            ) : service.category === 'BEACH' ? (
                              service.beachConfig?.pricePerPerson > 0
                                ? `Da ${formatCurrency(service.beachConfig.pricePerPerson)}/persona`
                                : 'Prezzo variabile'
                            ) : (
                              formatCurrency(service.price)
                            )}
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

        {/* Step: Select Number of People (Restaurant) */}
        {step === 'people' && (
          <div>
            <Button variant="ghost" onClick={() => setStep('service')} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            <Card>
              <CardHeader>
                <CardTitle>Quante persone sarete?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base">Numero di Persone</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {Array.from({ length: selectedService?.restaurantConfig?.maxPeople || 10 }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setNumberOfPeople(num)}
                        className={`p-4 border-2 rounded-lg font-semibold transition-all ${
                          numberOfPeople === num
                            ? 'border-blue-600 bg-blue-50 text-blue-600'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={numberOfPeople === num ? { borderColor: brandColor, backgroundColor: `${brandColor}10`, color: brandColor } : {}}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Fields */}
                {selectedService?.restaurantConfig?.customFields?.length > 0 && (
                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-base">Opzioni Aggiuntive</Label>
                    {selectedService.restaurantConfig.customFields.map((field: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{field.name}</p>
                          {field.price > 0 && (
                            <p className="text-sm text-gray-600">
                              {field.type === 'checkbox' ? formatCurrency(field.price) : `${formatCurrency(field.price)} cad.`}
                            </p>
                          )}
                        </div>
                        {field.type === 'checkbox' ? (
                          <input
                            type="checkbox"
                            checked={customFieldsData.find(f => f.name === field.name)?.selected || false}
                            onChange={(e) => {
                              const existing = customFieldsData.find(f => f.name === field.name)
                              if (existing) {
                                setCustomFieldsData(customFieldsData.map(f => 
                                  f.name === field.name ? { ...f, selected: e.target.checked } : f
                                ))
                              } else {
                                setCustomFieldsData([...customFieldsData, { name: field.name, selected: e.target.checked }])
                              }
                            }}
                            className="w-5 h-5"
                          />
                        ) : (
                          <Input
                            type="number"
                            min="0"
                            value={customFieldsData.find(f => f.name === field.name)?.quantity || 0}
                            onChange={(e) => {
                              const existing = customFieldsData.find(f => f.name === field.name)
                              const quantity = parseInt(e.target.value) || 0
                              if (existing) {
                                setCustomFieldsData(customFieldsData.map(f => 
                                  f.name === field.name ? { ...f, quantity, selected: quantity > 0 } : f
                                ))
                              } else {
                                setCustomFieldsData([...customFieldsData, { name: field.name, quantity, selected: quantity > 0 }])
                              }
                            }}
                            className="w-20"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Total Price */}
                {totalPrice > 0 && (
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Totale:</span>
                      <span style={{ color: brandColor }}>{formatCurrency(totalPrice)}</span>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={() => setStep('datetime')} 
                  className="w-full"
                  style={{ backgroundColor: brandColor }}
                >
                  Continua
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step: Select Equipment (Beach) */}
        {step === 'equipment' && (
          <div>
            <Button variant="ghost" onClick={() => setStep('service')} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            <Card>
              <CardHeader>
                <CardTitle>Seleziona Attrezzatura</CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  L&apos;attrezzatura è opzionale. Puoi prenotare solo l&apos;ingresso per le persone.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Numero persone */}
                <div className="space-y-2">
                  <Label>Numero di Persone</Label>
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setNumberOfPeople(Math.max(1, numberOfPeople - 1))}
                    >
                      -
                    </Button>
                    <span className="text-2xl font-bold w-12 text-center">{numberOfPeople}</span>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setNumberOfPeople(numberOfPeople + 1)}
                    >
                      +
                    </Button>
                    {selectedService?.beachConfig?.pricePerPerson > 0 && (
                      <span className="text-sm text-gray-600">
                        {formatCurrency(selectedService.beachConfig.pricePerPerson)}/persona
                      </span>
                    )}
                  </div>
                </div>

                {selectedService?.beachConfig?.umbrellas?.available && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Ombrelloni</Label>
                      {selectedService.beachConfig.umbrellas.price > 0 && (
                        <span className="text-sm text-gray-600">{formatCurrency(selectedService.beachConfig.umbrellas.price)} cad.</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setBeachEquipment(prev => ({ ...prev, umbrellas: Math.max(0, prev.umbrellas - 1) }))}
                        disabled={beachEquipment.umbrellas === 0}
                      >
                        -
                      </Button>
                      <span className="text-2xl font-bold w-12 text-center">{beachEquipment.umbrellas}</span>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setBeachEquipment(prev => ({ ...prev, umbrellas: Math.min(selectedService.beachConfig.umbrellas.max, prev.umbrellas + 1) }))}
                        disabled={beachEquipment.umbrellas >= selectedService.beachConfig.umbrellas.max}
                      >
                        +
                      </Button>
                      <span className="text-sm text-gray-500">Max: {selectedService.beachConfig.umbrellas.max}</span>
                    </div>
                  </div>
                )}

                {selectedService?.beachConfig?.sunbeds?.available && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Lettini</Label>
                      {selectedService.beachConfig.sunbeds.price > 0 && (
                        <span className="text-sm text-gray-600">{formatCurrency(selectedService.beachConfig.sunbeds.price)} cad.</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setBeachEquipment(prev => ({ ...prev, sunbeds: Math.max(0, prev.sunbeds - 1) }))}
                        disabled={beachEquipment.sunbeds === 0}
                      >
                        -
                      </Button>
                      <span className="text-2xl font-bold w-12 text-center">{beachEquipment.sunbeds}</span>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setBeachEquipment(prev => ({ ...prev, sunbeds: Math.min(selectedService.beachConfig.sunbeds.max, prev.sunbeds + 1) }))}
                        disabled={beachEquipment.sunbeds >= selectedService.beachConfig.sunbeds.max}
                      >
                        +
                      </Button>
                      <span className="text-sm text-gray-500">Max: {selectedService.beachConfig.sunbeds.max}</span>
                    </div>
                  </div>
                )}

                {selectedService?.beachConfig?.deckchairs?.available && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Sdraio</Label>
                      {selectedService.beachConfig.deckchairs.price > 0 && (
                        <span className="text-sm text-gray-600">{formatCurrency(selectedService.beachConfig.deckchairs.price)} cad.</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setBeachEquipment(prev => ({ ...prev, deckchairs: Math.max(0, prev.deckchairs - 1) }))}
                        disabled={beachEquipment.deckchairs === 0}
                      >
                        -
                      </Button>
                      <span className="text-2xl font-bold w-12 text-center">{beachEquipment.deckchairs}</span>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setBeachEquipment(prev => ({ ...prev, deckchairs: Math.min(selectedService.beachConfig.deckchairs.max, prev.deckchairs + 1) }))}
                        disabled={beachEquipment.deckchairs >= selectedService.beachConfig.deckchairs.max}
                      >
                        +
                      </Button>
                      <span className="text-sm text-gray-500">Max: {selectedService.beachConfig.deckchairs.max}</span>
                    </div>
                  </div>
                )}

                {selectedService?.hasRestaurantOption && (
                  <div className="flex items-center gap-2 pt-4 border-t">
                    <input
                      type="checkbox"
                      id="withRestaurant"
                      checked={beachEquipment.withRestaurant}
                      onChange={(e) => setBeachEquipment(prev => ({ ...prev, withRestaurant: e.target.checked }))}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="withRestaurant" className="cursor-pointer">Vuoi anche mangiare?</Label>
                  </div>
                )}

                {/* Custom Fields */}
                {selectedService?.beachConfig?.customFields?.length > 0 && (
                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-base">Opzioni Aggiuntive</Label>
                    {selectedService.beachConfig.customFields.map((field: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{field.name}</p>
                          {field.price > 0 && (
                            <p className="text-sm text-gray-600">
                              {field.type === 'checkbox' ? formatCurrency(field.price) : `${formatCurrency(field.price)} cad.`}
                            </p>
                          )}
                        </div>
                        {field.type === 'checkbox' ? (
                          <input
                            type="checkbox"
                            checked={customFieldsData.find(f => f.name === field.name)?.selected || false}
                            onChange={(e) => {
                              const existing = customFieldsData.find(f => f.name === field.name)
                              if (existing) {
                                setCustomFieldsData(customFieldsData.map(f => 
                                  f.name === field.name ? { ...f, selected: e.target.checked } : f
                                ))
                              } else {
                                setCustomFieldsData([...customFieldsData, { name: field.name, selected: e.target.checked }])
                              }
                            }}
                            className="w-5 h-5"
                          />
                        ) : (
                          <Input
                            type="number"
                            min="0"
                            value={customFieldsData.find(f => f.name === field.name)?.quantity || 0}
                            onChange={(e) => {
                              const existing = customFieldsData.find(f => f.name === field.name)
                              const quantity = parseInt(e.target.value) || 0
                              if (existing) {
                                setCustomFieldsData(customFieldsData.map(f => 
                                  f.name === field.name ? { ...f, quantity, selected: quantity > 0 } : f
                                ))
                              } else {
                                setCustomFieldsData([...customFieldsData, { name: field.name, quantity, selected: quantity > 0 }])
                              }
                            }}
                            className="w-20"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Total Price */}
                {totalPrice > 0 && (
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Totale:</span>
                      <span style={{ color: brandColor }}>{formatCurrency(totalPrice)}</span>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={() => setStep('datetime')} 
                  className="w-full"
                  style={{ backgroundColor: brandColor }}
                >
                  Continua
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
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
            <Button 
              variant="ghost" 
              onClick={() => setStep(staff.length > 0 ? 'staff' : 'service')} 
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            <Card>
              <CardHeader>
                <CardTitle>Seleziona Data e Ora</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Seleziona una Data</Label>
                  <DatePicker
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    maxDaysAhead={60}
                  />
                </div>

                {selectedDate && (
                  <div className="space-y-2">
                    <Label>Orari Disponibili</Label>
                    {loadingSlots ? (
                      <div className="text-center py-8 text-gray-500">
                        Caricamento slot disponibili...
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="text-center py-8">
                        {closedMessage ? (
                          <>
                            <p className="text-gray-900 font-medium mb-2">🔒 {closedMessage}</p>
                            <p className="text-sm text-gray-500">Seleziona un&apos;altra data</p>
                          </>
                        ) : (
                          <>
                            <p className="text-gray-600 mb-2">Nessuno slot disponibile per questa data</p>
                            <p className="text-sm text-gray-500">Prova a selezionare un&apos;altra data</p>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2 border rounded-lg">
                        {availableSlots.map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setSelectedTime(time)}
                            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                              selectedTime === time
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                            style={
                              selectedTime === time
                                ? { borderColor: brandColor, backgroundColor: `${brandColor}10`, color: brandColor }
                                : {}
                            }
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

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
                  <Label htmlFor="phone">Telefono *</Label>
                  <div className="flex gap-2">
                    <select
                      value={customerData.phonePrefix}
                      onChange={(e) => setCustomerData({ ...customerData, phonePrefix: e.target.value })}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="+39">🇮🇹 +39</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+33">🇫🇷 +33</option>
                      <option value="+49">🇩🇪 +49</option>
                      <option value="+34">🇪🇸 +34</option>
                      <option value="+41">🇨🇭 +41</option>
                      <option value="+43">🇦🇹 +43</option>
                      <option value="+351">🇵🇹 +351</option>
                      <option value="+31">🇳🇱 +31</option>
                      <option value="+32">🇧🇪 +32</option>
                      <option value="+7">🇷🇺 +7</option>
                      <option value="+86">🇨🇳 +86</option>
                      <option value="+81">🇯🇵 +81</option>
                      <option value="+91">🇮🇳 +91</option>
                    </select>
                    <Input
                      id="phone"
                      type="tel"
                      value={customerData.phone}
                      onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                      required
                      placeholder="333 123 4567"
                      className="flex-1"
                    />
                  </div>
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

                {/* Error Message */}
                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-red-900 mb-1">Errore nella prenotazione</h4>
                        <p className="text-sm text-red-700">{errorMessage}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="bg-blue-50 rounded-lg p-4 mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Riepilogo</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Servizio:</span>
                      <span className="font-medium">{selectedService.name}</span>
                    </div>
                    {selectedStaff && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Operatore:</span>
                        <span className="font-medium">{selectedStaff.user.name}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Data e Ora:</span>
                      <span className="font-medium">
                        {formatDate(selectedDate)} - {selectedTime}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-600">Totale:</span>
                      <span className="font-bold text-lg">{totalPrice > 0 ? formatCurrency(totalPrice) : 'Prezzo variabile'}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={!customerData.name || !customerData.email || !customerData.phone}
                  className="w-full"
                  style={{ backgroundColor: brandColor, borderColor: brandColor }}
                >
                  Continua
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        </>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle className="text-center">Conferma Prenotazione</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-gray-600">
                  Verifica i dati prima di confermare la prenotazione
                </p>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Servizio</p>
                    <p className="font-semibold text-gray-900">{selectedService.name}</p>
                    <p className="text-sm text-gray-600">{selectedService.duration} minuti</p>
                  </div>

                  {selectedStaff && (
                    <div className="pt-3 border-t">
                      <p className="text-xs text-gray-500 uppercase">Operatore</p>
                      <p className="font-semibold text-gray-900">{selectedStaff.user.name}</p>
                    </div>
                  )}

                  <div className="pt-3 border-t">
                    <p className="text-xs text-gray-500 uppercase">Data e Ora</p>
                    <p className="font-semibold text-gray-900">{formatDate(selectedDate)}</p>
                    <p className="text-sm text-gray-600">{selectedTime}</p>
                  </div>

                  <div className="pt-3 border-t">
                    <p className="text-xs text-gray-500 uppercase">I Tuoi Dati</p>
                    <p className="font-semibold text-gray-900">{customerData.name}</p>
                    <p className="text-sm text-gray-600">{customerData.email}</p>
                    <p className="text-sm text-gray-600">{customerData.phonePrefix} {customerData.phone}</p>
                    {customerData.notes && (
                      <p className="text-sm text-gray-600 mt-1 italic">Note: {customerData.notes}</p>
                    )}
                  </div>

                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-gray-700">Totale</p>
                      <p className="text-2xl font-bold" style={{ color: brandColor }}>
                        {totalPrice > 0 ? formatCurrency(totalPrice) : 'Prezzo variabile'}
                      </p>
                    </div>
                  </div>
                </div>

                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">{errorMessage}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowConfirmModal(false)
                      setErrorMessage('')
                    }}
                    disabled={loading}
                    className="flex-1"
                  >
                    Modifica
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1"
                    style={{ backgroundColor: brandColor, borderColor: brandColor }}
                  >
                    {loading ? 'Invio...' : 'Conferma'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
