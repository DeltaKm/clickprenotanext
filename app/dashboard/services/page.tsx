'use client'

import { useEffect, useState } from 'react'
import { Briefcase, Plus, Clock, Edit, Trash2, Calendar, X, UtensilsCrossed, Umbrella } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; serviceId: string | null; serviceName: string }>({
    open: false,
    serviceId: null,
    serviceName: '',
  })
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    price: '0',
    category: 'PROFESSIONAL' as 'PROFESSIONAL' | 'RESTAURANT' | 'BEACH',
    availableDays: ['1', '2', '3', '4', '5'], // Lun-Ven default
    startTime: '09:00',
    endTime: '18:00',
    slotDuration: '30',
    closedDates: [] as Array<{ date: string; reason: string }>,
    // Restaurant config
    minPeople: '1',
    maxPeople: '10',
    pricePerPerson: '',
    restaurantCustomFields: [] as Array<{ name: string; price: string; type: 'checkbox' | 'quantity'; enabled: boolean }>,
    // Beach config
    beachPricePerPerson: '',
    hasUmbrellas: true,
    maxUmbrellas: '20',
    priceUmbrellas: '',
    hasSunbeds: true,
    maxSunbeds: '40',
    priceSunbeds: '',
    hasDeckchairs: true,
    maxDeckchairs: '20',
    priceDeckchairs: '',
    hasRestaurantOption: false,
    beachCustomFields: [] as Array<{ name: string; price: string; type: 'checkbox' | 'quantity'; enabled: boolean }>,
  })
  const [newClosedDate, setNewClosedDate] = useState({ date: '', reason: '' })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration: '',
      price: '',
      category: 'PROFESSIONAL',
      availableDays: ['1', '2', '3', '4', '5'],
      startTime: '09:00',
      endTime: '18:00',
      slotDuration: '30',
      closedDates: [],
      minPeople: '1',
      maxPeople: '10',
      pricePerPerson: '',
      restaurantCustomFields: [],
      beachPricePerPerson: '',
      hasUmbrellas: true,
      maxUmbrellas: '20',
      priceUmbrellas: '',
      hasSunbeds: true,
      maxSunbeds: '40',
      priceSunbeds: '',
      hasDeckchairs: true,
      maxDeckchairs: '20',
      priceDeckchairs: '',
      hasRestaurantOption: false,
      beachCustomFields: [],
    })
  }

  const daysOfWeek = [
    { value: '0', label: 'Domenica' },
    { value: '1', label: 'Lunedì' },
    { value: '2', label: 'Martedì' },
    { value: '3', label: 'Mercoledì' },
    { value: '4', label: 'Giovedì' },
    { value: '5', label: 'Venerdì' },
    { value: '6', label: 'Sabato' },
  ]

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day]
    }))
  }

  // Restaurant custom fields
  const addRestaurantCustomField = () => {
    setFormData(prev => ({
      ...prev,
      restaurantCustomFields: [...prev.restaurantCustomFields, { name: '', price: '', type: 'checkbox', enabled: true }]
    }))
  }

  const updateRestaurantCustomField = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      restaurantCustomFields: prev.restaurantCustomFields.map((f, i) => 
        i === index ? { ...f, [field]: value } : f
      )
    }))
  }

  const removeRestaurantCustomField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      restaurantCustomFields: prev.restaurantCustomFields.filter((_, i) => i !== index)
    }))
  }

  // Beach custom fields
  const addBeachCustomField = () => {
    setFormData(prev => ({
      ...prev,
      beachCustomFields: [...prev.beachCustomFields, { name: '', price: '', type: 'checkbox', enabled: true }]
    }))
  }

  const updateBeachCustomField = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      beachCustomFields: prev.beachCustomFields.map((f, i) => 
        i === index ? { ...f, [field]: value } : f
      )
    }))
  }

  const removeBeachCustomField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      beachCustomFields: prev.beachCustomFields.filter((_, i) => i !== index)
    }))
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/services', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setServices(data.services)
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('accessToken')
      const url = editingId ? `/api/services/${editingId}` : '/api/services'
      const method = editingId ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          duration: parseInt(formData.duration),
          price: formData.price ? parseFloat(formData.price) : 0,
          category: formData.category,
          availableDays: formData.availableDays,
          startTime: formData.startTime,
          endTime: formData.endTime,
          slotDuration: parseInt(formData.slotDuration),
          closedDates: formData.closedDates,
          // Restaurant config
          restaurantConfig: formData.category === 'RESTAURANT' ? {
            minPeople: parseInt(formData.minPeople),
            maxPeople: parseInt(formData.maxPeople),
            pricePerPerson: formData.pricePerPerson ? parseFloat(formData.pricePerPerson) : 0,
            customFields: formData.restaurantCustomFields.map(f => ({
              name: f.name,
              price: parseFloat(f.price) || 0,
              type: f.type,
              enabled: f.enabled,
            })),
          } : null,
          // Beach config
          beachConfig: formData.category === 'BEACH' ? {
            pricePerPerson: formData.beachPricePerPerson ? parseFloat(formData.beachPricePerPerson) : 0,
            umbrellas: { 
              available: formData.hasUmbrellas, 
              max: parseInt(formData.maxUmbrellas),
              price: formData.priceUmbrellas ? parseFloat(formData.priceUmbrellas) : 0,
            },
            sunbeds: { 
              available: formData.hasSunbeds, 
              max: parseInt(formData.maxSunbeds),
              price: formData.priceSunbeds ? parseFloat(formData.priceSunbeds) : 0,
            },
            deckchairs: { 
              available: formData.hasDeckchairs, 
              max: parseInt(formData.maxDeckchairs),
              price: formData.priceDeckchairs ? parseFloat(formData.priceDeckchairs) : 0,
            },
            customFields: formData.beachCustomFields.map(f => ({
              name: f.name,
              price: parseFloat(f.price) || 0,
              type: f.type,
              enabled: f.enabled,
            })),
          } : null,
          hasRestaurantOption: formData.category === 'BEACH' ? formData.hasRestaurantOption : false,
        }),
      })

      if (response.ok) {
        resetForm()
        setShowForm(false)
        setEditingId(null)
        setErrorMessage('')
        fetchServices()
      } else {
        const errorData = await response.json()
        if (errorData.details && Array.isArray(errorData.details)) {
          const errors = errorData.details.map((err: any) => {
            if (err.path.includes('duration')) {
              return 'Durata non valida (minimo 5 minuti, massimo 480 minuti - 8 ore)'
            }
            if (err.path.includes('price')) {
              return 'Prezzo non valido'
            }
            if (err.path.includes('name')) {
              return 'Nome servizio richiesto (minimo 2 caratteri)'
            }
            return err.message
          }).join('. ')
          setErrorMessage(errors)
        } else {
          setErrorMessage(errorData.error || 'Errore durante il salvataggio del servizio')
        }
      }
    } catch (error) {
      console.error('Error saving service:', error)
      setErrorMessage('Errore di connessione. Riprova.')
    }
  }

  const handleEdit = (service: any) => {
    setEditingId(service.id)
    const restaurantConfig = service.restaurantConfig || {}
    const beachConfig = service.beachConfig || {}
    setFormData({
      name: service.name,
      description: service.description || '',
      duration: service.duration.toString(),
      price: service.price.toString(),
      category: service.category || 'PROFESSIONAL',
      availableDays: service.availableDays || ['1', '2', '3', '4', '5'],
      startTime: service.startTime || '09:00',
      endTime: service.endTime || '18:00',
      slotDuration: (service.slotDuration || 30).toString(),
      closedDates: service.closedDates || [],
      minPeople: (restaurantConfig.minPeople || 1).toString(),
      maxPeople: (restaurantConfig.maxPeople || 10).toString(),
      pricePerPerson: (restaurantConfig.pricePerPerson || '').toString(),
      restaurantCustomFields: restaurantConfig.customFields || [],
      beachPricePerPerson: (beachConfig.pricePerPerson || '').toString(),
      hasUmbrellas: beachConfig.umbrellas?.available ?? true,
      maxUmbrellas: (beachConfig.umbrellas?.max || 20).toString(),
      priceUmbrellas: (beachConfig.umbrellas?.price || '').toString(),
      hasSunbeds: beachConfig.sunbeds?.available ?? true,
      maxSunbeds: (beachConfig.sunbeds?.max || 40).toString(),
      priceSunbeds: (beachConfig.sunbeds?.price || '').toString(),
      hasDeckchairs: beachConfig.deckchairs?.available ?? true,
      maxDeckchairs: (beachConfig.deckchairs?.max || 20).toString(),
      priceDeckchairs: (beachConfig.deckchairs?.price || '').toString(),
      hasRestaurantOption: service.hasRestaurantOption || false,
      beachCustomFields: beachConfig.customFields || [],
    })
    setShowForm(true)
  }

  const handleDeleteClick = (service: any) => {
    setDeleteDialog({
      open: true,
      serviceId: service.id,
      serviceName: service.name,
    })
  }

  const handleDelete = async () => {
    if (!deleteDialog.serviceId) return
    
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/services/${deleteDialog.serviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchServices()
      }
    } catch (error) {
      console.error('Error deleting service:', error)
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
          <h1 className="text-3xl font-bold text-gray-900">Servizi</h1>
          <p className="text-gray-600 mt-1">Gestisci i servizi offerti</p>
        </div>
        <Button onClick={() => {
          setEditingId(null)
          resetForm()
          /*setFormData({
            name: '',
            description: '',
            duration: '',
            price: '',
            category: 'PROFESSIONAL',
            availableDays: ['1', '2', '3', '4', '5'],
            startTime: '09:00',
            endTime: '18:00',
            slotDuration: '30',
            closedDates: [],
            minPeople: '1',
            maxPeople: '10',
            hasUmbrellas: true,
            maxUmbrellas: '20',
            hasSunbeds: true,
            maxSunbeds: '40',
            hasDeckchairs: true,
            maxDeckchairs: '20',
            hasRestaurantOption: false,
          })*/
          setShowForm(!showForm)
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Servizio
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Modifica Servizio' : 'Crea Nuovo Servizio'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                  <p className="text-sm">{errorMessage}</p>
                </div>
              )}
              
              {/* Category Selection */}
              <div className="space-y-2">
                <Label htmlFor="category">Tipologia Servizio</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as any })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleziona una tipologia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROFESSIONAL">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-purple-600" />
                        <span>Professionisti (Parrucchieri, Estetisti, ecc.)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="RESTAURANT">
                      <div className="flex items-center gap-2">
                        <UtensilsCrossed className="h-4 w-4 text-orange-600" />
                        <span>Ristorazione (Ristoranti, Pizzerie)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="BEACH">
                      <div className="flex items-center gap-2">
                        <Umbrella className="h-4 w-4 text-blue-600" />
                        <span>Stabilimento Balneare</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Servizio</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                {/* Mostra prezzo solo per PROFESSIONAL */}
                {formData.category === 'PROFESSIONAL' && (
                  <div className="space-y-2">
                    <Label htmlFor="price">
                      Prezzo (€)
                      <span className="text-sm text-gray-500 ml-2">(Lascia 0 per &quot;Da concordare&quot;)</span>
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Durata (minuti)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrizione</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Restaurant Configuration */}
              {formData.category === 'RESTAURANT' && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Configurazione Ristorante</h3>
                  
                  {/* Prezzo per persona */}
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="pricePerPerson">
                      Prezzo per Persona (€) 
                      <span className="text-sm text-gray-500 ml-2">(Lascia 0 per &quot;Prezzo da concordare&quot;)</span>
                    </Label>
                    <Input
                      id="pricePerPerson"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.pricePerPerson}
                      onChange={(e) => setFormData({ ...formData, pricePerPerson: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minPeople">Numero Minimo Persone</Label>
                      <Input
                        id="minPeople"
                        type="number"
                        min="1"
                        value={formData.minPeople}
                        onChange={(e) => setFormData({ ...formData, minPeople: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxPeople">Numero Massimo Persone</Label>
                      <Input
                        id="maxPeople"
                        type="number"
                        min="1"
                        value={formData.maxPeople}
                        onChange={(e) => setFormData({ ...formData, maxPeople: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Custom Fields */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-semibold">Campi Personalizzati (opzionali)</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={addRestaurantCustomField}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Aggiungi Campo
                      </Button>
                    </div>
                    {formData.restaurantCustomFields.map((field, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <Input
                          placeholder="Nome (es: Menu bambini)"
                          value={field.name}
                          onChange={(e) => updateRestaurantCustomField(index, 'name', e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Prezzo €"
                          value={field.price}
                          onChange={(e) => updateRestaurantCustomField(index, 'price', e.target.value)}
                          className="w-28"
                        />
                        <select
                          value={field.type}
                          onChange={(e) => updateRestaurantCustomField(index, 'type', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="checkbox">Sì/No</option>
                          <option value="quantity">Quantità</option>
                        </select>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeRestaurantCustomField(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Beach Configuration */}
              {formData.category === 'BEACH' && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Configurazione Stabilimento</h3>
                  
                  {/* Prezzo per persona */}
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="beachPricePerPerson">
                      Prezzo per Persona (€)
                      <span className="text-sm text-gray-500 ml-2">(Lascia 0 per &quot;Prezzo da concordare&quot;)</span>
                    </Label>
                    <Input
                      id="beachPricePerPerson"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.beachPricePerPerson}
                      onChange={(e) => setFormData({ ...formData, beachPricePerPerson: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="hasUmbrellas"
                        checked={formData.hasUmbrellas}
                        onChange={(e) => setFormData({ ...formData, hasUmbrellas: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="hasUmbrellas" className="flex-1">Ombrelloni disponibili</Label>
                      {formData.hasUmbrellas && (
                        <>
                          <Input
                            type="number"
                            min="1"
                            value={formData.maxUmbrellas}
                            onChange={(e) => setFormData({ ...formData, maxUmbrellas: e.target.value })}
                            className="w-20"
                            placeholder="Max"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.priceUmbrellas}
                            onChange={(e) => setFormData({ ...formData, priceUmbrellas: e.target.value })}
                            className="w-24"
                            placeholder="Prezzo €"
                          />
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="hasSunbeds"
                        checked={formData.hasSunbeds}
                        onChange={(e) => setFormData({ ...formData, hasSunbeds: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="hasSunbeds" className="flex-1">Lettini disponibili</Label>
                      {formData.hasSunbeds && (
                        <>
                          <Input
                            type="number"
                            min="1"
                            value={formData.maxSunbeds}
                            onChange={(e) => setFormData({ ...formData, maxSunbeds: e.target.value })}
                            className="w-20"
                            placeholder="Max"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.priceSunbeds}
                            onChange={(e) => setFormData({ ...formData, priceSunbeds: e.target.value })}
                            className="w-24"
                            placeholder="Prezzo €"
                          />
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="hasDeckchairs"
                        checked={formData.hasDeckchairs}
                        onChange={(e) => setFormData({ ...formData, hasDeckchairs: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="hasDeckchairs" className="flex-1">Sdraio disponibili</Label>
                      {formData.hasDeckchairs && (
                        <>
                          <Input
                            type="number"
                            min="1"
                            value={formData.maxDeckchairs}
                            onChange={(e) => setFormData({ ...formData, maxDeckchairs: e.target.value })}
                            className="w-20"
                            placeholder="Max"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.priceDeckchairs}
                            onChange={(e) => setFormData({ ...formData, priceDeckchairs: e.target.value })}
                            className="w-24"
                            placeholder="Prezzo €"
                          />
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t">
                      <input
                        type="checkbox"
                        id="hasRestaurantOption"
                        checked={formData.hasRestaurantOption}
                        onChange={(e) => setFormData({ ...formData, hasRestaurantOption: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="hasRestaurantOption">Offri anche servizio ristorazione</Label>
                    </div>

                    {/* Custom Fields */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm font-semibold">Campi Personalizzati (opzionali)</Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={addBeachCustomField}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Aggiungi Campo
                        </Button>
                      </div>
                      {formData.beachCustomFields.map((field, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <Input
                            placeholder="Nome (es: Cabina, Gazebo)"
                            value={field.name}
                            onChange={(e) => updateBeachCustomField(index, 'name', e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Prezzo €"
                            value={field.price}
                            onChange={(e) => updateBeachCustomField(index, 'price', e.target.value)}
                            className="w-28"
                          />
                          <select
                            value={field.type}
                            onChange={(e) => updateBeachCustomField(index, 'type', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="checkbox">Sì/No</option>
                            <option value="quantity">Quantità</option>
                          </select>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeBeachCustomField(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Availability Settings */}
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold text-gray-900 mb-4">Disponibilità</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Giorni Disponibili</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {daysOfWeek.map((day) => (
                        <label
                          key={day.value}
                          className={`flex items-center justify-center p-2 border rounded cursor-pointer transition-colors ${
                            formData.availableDays.includes(day.value)
                              ? 'bg-blue-50 border-blue-500 text-blue-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.availableDays.includes(day.value)}
                            onChange={() => toggleDay(day.value)}
                            className="sr-only"
                          />
                          <span className="text-sm font-medium">{day.label.slice(0, 3)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Orario Inizio</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">Orario Fine</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slotDuration">Slot (minuti)</Label>
                      <Input
                        id="slotDuration"
                        type="number"
                        min="15"
                        step="15"
                        value={formData.slotDuration}
                        onChange={(e) => setFormData({ ...formData, slotDuration: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Gli slot definiscono ogni quanto tempo è possibile prenotare. Es: slot di 30 minuti = prenotazioni ogni mezz&apos;ora.
                  </p>
                </div>
              </div>

              {/* Closed Dates Section */}
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold text-gray-900 mb-4">Chiusure Eccezionali</h3>
                
                <div className="space-y-4">
                  {/* Add New Closed Date */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1 space-y-2">
                      <Label htmlFor="closedDate">Data</Label>
                      <Input
                        id="closedDate"
                        type="date"
                        value={newClosedDate.date}
                        onChange={(e) => setNewClosedDate({ ...newClosedDate, date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="col-span-1 space-y-2">
                      <Label htmlFor="closedReason">Motivo</Label>
                      <Input
                        id="closedReason"
                        value={newClosedDate.reason}
                        onChange={(e) => setNewClosedDate({ ...newClosedDate, reason: e.target.value })}
                        placeholder="Es: Natale, Ferie..."
                      />
                    </div>
                    <div className="col-span-1 flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (newClosedDate.date) {
                            setFormData({
                              ...formData,
                              closedDates: [...formData.closedDates, { ...newClosedDate }]
                            })
                            setNewClosedDate({ date: '', reason: '' })
                          }
                        }}
                        disabled={!newClosedDate.date}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Aggiungi
                      </Button>
                    </div>
                  </div>

                  {/* List of Closed Dates */}
                  {formData.closedDates.length > 0 && (
                    <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                      {formData.closedDates.map((closed, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {new Date(closed.date).toLocaleDateString('it-IT', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </p>
                              {closed.reason && (
                                <p className="text-xs text-gray-600">{closed.reason}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                closedDates: formData.closedDates.filter((_, i) => i !== index)
                              })
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500">
                    Aggiungi date specifiche in cui il servizio non sarà disponibile (festività, ferie, ecc.)
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">{editingId ? 'Salva Modifiche' : 'Crea Servizio'}</Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                }}>
                  Annulla
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  service.category === 'RESTAURANT' ? 'bg-orange-100' :
                  service.category === 'BEACH' ? 'bg-blue-100' :
                  'bg-purple-100'
                }`}>
                  {service.category === 'RESTAURANT' ? (
                    <UtensilsCrossed className={`h-6 w-6 ${service.category === 'RESTAURANT' ? 'text-orange-600' : ''}`} />
                  ) : service.category === 'BEACH' ? (
                    <Umbrella className="h-6 w-6 text-blue-600" />
                  ) : (
                    <Briefcase className="h-6 w-6 text-purple-600" />
                  )}
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    service.category === 'RESTAURANT' ? 'bg-orange-100 text-orange-800' :
                    service.category === 'BEACH' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {service.category === 'RESTAURANT' ? 'Ristorante' :
                     service.category === 'BEACH' ? 'Stabilimento' :
                     'Professionale'}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    service.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {service.isActive ? 'Attivo' : 'Inattivo'}
                  </span>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {service.name}
              </h3>
              
              {service.description && (
                <p className="text-sm text-gray-600 mb-4">
                  {service.description}
                </p>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    {service.duration} min
                  </div>
                  <div className="text-right">
                    {service.category === 'PROFESSIONAL' ? (
                      <p className="text-xl font-bold text-gray-900">
                        {service.price > 0 ? formatCurrency(service.price) : 'Da concordare'}
                      </p>
                    ) : service.category === 'RESTAURANT' ? (
                      <div>
                        <p className="text-xs text-gray-500">Da</p>
                        <p className="text-lg font-bold text-gray-900">
                          {service.restaurantConfig?.pricePerPerson > 0 
                            ? `${formatCurrency(service.restaurantConfig.pricePerPerson)}/pers`
                            : 'Prezzo variabile'}
                        </p>
                      </div>
                    ) : service.category === 'BEACH' ? (
                      <div>
                        <p className="text-xs text-gray-500">Da</p>
                        <p className="text-lg font-bold text-gray-900">
                          {service.beachConfig?.pricePerPerson > 0 
                            ? `${formatCurrency(service.beachConfig.pricePerPerson)}/pers`
                            : 'Prezzo variabile'}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(service.price)}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(service)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Modifica
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(service)}
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Elimina
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {services.length === 0 && !showForm && (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Nessun servizio disponibile</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crea il primo servizio
            </Button>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        onConfirm={handleDelete}
        title="Elimina Servizio"
        description={`Sei sicuro di voler eliminare il servizio "${deleteDialog.serviceName}"? Questa azione non può essere annullata.`}
        confirmText="Elimina"
        cancelText="Annulla"
      />
    </div>
  )
}
