'use client'

import { useEffect, useState } from 'react'
import { Users, Plus, Mail, Briefcase, Trash2, Edit } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: '',
    serviceIds: [] as string[],
  })
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    fetchStaff()
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
        setServices(data.services.filter((s: any) => s.isActive))
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/staff', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStaff(data.staff)
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    
    // Validate passwords only if provided (for edit, password is optional)
    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        setPasswordError('Le password non corrispondono')
        return
      }
      
      if (formData.password.length < 8) {
        setPasswordError('La password deve essere di almeno 8 caratteri')
        return
      }
    } else if (!editingId) {
      // Password required for new staff
      setPasswordError('La password è obbligatoria')
      return
    }
    
    try {
      const token = localStorage.getItem('accessToken')
      const url = editingId ? `/api/staff/${editingId}` : '/api/staff'
      const method = editingId ? 'PUT' : 'POST'
      
      const body: any = {
        name: formData.name,
        email: formData.email,
        bio: formData.bio,
        serviceIds: formData.serviceIds,
      }
      
      // Only include password if provided
      if (formData.password) {
        body.password = formData.password
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setFormData({ 
          name: '', 
          email: '', 
          password: '', 
          confirmPassword: '',
          bio: '',
          serviceIds: [],
        })
        setShowForm(false)
        setEditingId(null)
        fetchStaff()
      } else {
        const data = await response.json()
        setPasswordError(data.error || 'Errore durante la creazione')
      }
    } catch (error) {
      console.error('Error saving staff:', error)
      setPasswordError('Errore durante la creazione')
    }
  }

  const toggleService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter(id => id !== serviceId)
        : [...prev.serviceIds, serviceId]
    }))
  }

  const handleEdit = (member: any) => {
    setEditingId(member.id)
    setFormData({
      name: member.user.name,
      email: member.user.email,
      password: '',
      confirmPassword: '',
      bio: member.bio || '',
      serviceIds: member.staffServices.map((ss: any) => ss.serviceId),
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo membro dello staff?')) return
    
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/staff/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchStaff()
      }
    } catch (error) {
      console.error('Error deleting staff:', error)
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
          <h1 className="text-3xl font-bold text-gray-900">Staff</h1>
          <p className="text-gray-600 mt-1">Gestisci il tuo team</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Staff
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Modifica Membro Staff' : 'Aggiungi Membro Staff'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingId ? "Lascia vuoto per non modificare" : "Minimo 8 caratteri"}
                    className="placeholder:text-xs"
                    required={!editingId}
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Conferma Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required={!editingId}
                    minLength={8}
                  />
                </div>
              </div>

              {passwordError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {passwordError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Input
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Breve descrizione..."
                />
              </div>

              <div className="space-y-2">
                <Label>Servizi Assegnati</Label>
                <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                  {services.length === 0 ? (
                    <p className="text-sm text-gray-500">Nessun servizio disponibile</p>
                  ) : (
                    services.map((service) => (
                      <label
                        key={service.id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.serviceIds.includes(service.id)}
                          onChange={() => toggleService(service.id)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm">{service.name}</span>
                        <span className="text-xs text-gray-500 ml-auto">
                          {service.duration}min - €{service.price}
                        </span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Seleziona i servizi che questo membro dello staff può eseguire
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit">{editingId ? 'Salva Modifiche' : 'Crea Staff'}</Button>
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

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((member) => (
          <Card key={member.id}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-blue-600">
                    {member.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {member.user.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{member.user.email}</span>
                  </div>
                </div>
              </div>

              {member.bio && (
                <p className="text-sm text-gray-600 mb-4">
                  {member.bio}
                </p>
              )}

              {member.staffServices.length > 0 && (
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Briefcase className="h-4 w-4" />
                    <span className="font-medium">Servizi:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {member.staffServices.map((ss: any) => (
                      <span
                        key={ss.id}
                        className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                      >
                        {ss.service.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t space-y-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  member.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {member.isActive ? 'Attivo' : 'Inattivo'}
                </span>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(member)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Modifica
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(member.id)}
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

      {staff.length === 0 && !showForm && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Nessuno staff disponibile</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi il primo membro
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
