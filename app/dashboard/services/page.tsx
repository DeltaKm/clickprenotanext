'use client'

import { useEffect, useState } from 'react'
import { Briefcase, Plus, Clock, Edit, Trash2, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    price: '',
    availableDays: ['1', '2', '3', '4', '5'], // Lun-Ven default
    startTime: '09:00',
    endTime: '18:00',
    slotDuration: '30',
    closedDates: [] as Array<{ date: string; reason: string }>,
  })
  const [newClosedDate, setNewClosedDate] = useState({ date: '', reason: '' })

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
          price: parseFloat(formData.price),
          availableDays: formData.availableDays,
          startTime: formData.startTime,
          endTime: formData.endTime,
          slotDuration: parseInt(formData.slotDuration),
          closedDates: formData.closedDates,
        }),
      })

      if (response.ok) {
        setFormData({ 
          name: '', 
          description: '', 
          duration: '', 
          price: '',
          availableDays: ['1', '2', '3', '4', '5'],
          startTime: '09:00',
          endTime: '18:00',
          slotDuration: '30',
          closedDates: [],
        })
        setShowForm(false)
        setEditingId(null)
        fetchServices()
      }
    } catch (error) {
      console.error('Error saving service:', error)
    }
  }

  const handleEdit = (service: any) => {
    setEditingId(service.id)
    setFormData({
      name: service.name,
      description: service.description || '',
      duration: service.duration.toString(),
      price: service.price.toString(),
      availableDays: service.availableDays || ['1', '2', '3', '4', '5'],
      startTime: service.startTime || '09:00',
      endTime: service.endTime || '18:00',
      slotDuration: (service.slotDuration || 30).toString(),
      closedDates: service.closedDates || [],
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo servizio?')) return
    
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/services/${id}`, {
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
          setFormData({
            name: '',
            description: '',
            duration: '',
            price: '',
            availableDays: ['1', '2', '3', '4', '5'],
            startTime: '09:00',
            endTime: '18:00',
            slotDuration: '30',
            closedDates: [],
          })
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Servizio</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Prezzo (€)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
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
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  service.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {service.isActive ? 'Attivo' : 'Inattivo'}
                </span>
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
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(service.price)}
                  </p>
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
                    onClick={() => handleDelete(service.id)}
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
    </div>
  )
}
