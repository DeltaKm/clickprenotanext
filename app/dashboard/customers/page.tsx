'use client'

import { useEffect, useState } from 'react'
import { UserCircle, Mail, Phone, Plus, Edit, Trash2, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    phonePrefix: '+39',
  })
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; customerId: string | null; customerName: string }>({
    open: false,
    customerId: null,
    customerName: '',
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/customers', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('accessToken')
      const url = editingId ? `/api/customers/${editingId}` : '/api/customers'
      const method = editingId ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setFormData({ name: '', email: '', phone: '', phonePrefix: '+39' })
        setShowForm(false)
        setEditingId(null)
        setErrorMessage('')
        fetchCustomers()
      } else {
        const errorData = await response.json()
        if (errorData.details && Array.isArray(errorData.details)) {
          const errors = errorData.details.map((err: any) => {
            if (err.path.includes('email')) {
              return 'Email non valida'
            }
            if (err.path.includes('name')) {
              return 'Nome richiesto (minimo 2 caratteri)'
            }
            if (err.path.includes('phone')) {
              return 'Telefono non valido (massimo 20 caratteri)'
            }
            return err.message
          }).join('. ')
          setErrorMessage(errors)
        } else {
          setErrorMessage(errorData.error || 'Errore durante il salvataggio del cliente')
        }
      }
    } catch (error) {
      console.error('Error saving customer:', error)
      setErrorMessage('Errore di connessione. Riprova.')
    }
  }

  const handleEdit = (customer: any) => {
    setEditingId(customer.id)
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      phonePrefix: customer.phonePrefix || '+39',
    })
    setShowForm(true)
  }

  const handleDeleteClick = (customer: any) => {
    setDeleteDialog({
      open: true,
      customerId: customer.id,
      customerName: customer.name,
    })
  }

  const handleDelete = async () => {
    if (!deleteDialog.customerId) return
    
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/customers/${deleteDialog.customerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchCustomers()
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(search.toLowerCase()) ||
    customer.email.toLowerCase().includes(search.toLowerCase())
  )

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
          <h1 className="text-3xl font-bold text-gray-900">Clienti</h1>
          <p className="text-gray-600 mt-1">Gestisci i tuoi clienti</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Cliente
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{editingId ? 'Modifica Cliente' : 'Nuovo Cliente'}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  setFormData({ name: '', email: '', phone: '', phonePrefix: '+39' })
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                  <p className="text-sm">{errorMessage}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
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

              <div className="space-y-2">
                <Label htmlFor="phone">Telefono (opzionale)</Label>
                <div className="flex gap-2">
                  <Input
                    className="w-24"
                    value={formData.phonePrefix}
                    onChange={(e) => setFormData({ ...formData, phonePrefix: e.target.value })}
                  />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="3331234567"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                    setFormData({ name: '', email: '', phone: '', phonePrefix: '+39' })
                  }}
                >
                  Annulla
                </Button>
                <Button type="submit">
                  {editingId ? 'Salva' : 'Crea Cliente'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="Cerca per nome o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Customers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {customer.name}
                  </h3>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4 flex-shrink-0" />
                        <span>{customer.phonePrefix} {customer.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(customer)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Modifica
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteClick(customer)}
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Elimina
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <UserCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nessun cliente trovato</p>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        onConfirm={handleDelete}
        title="Elimina Cliente"
        description={`Sei sicuro di voler eliminare "${deleteDialog.customerName}"? Questa azione non può essere annullata.`}
        confirmText="Elimina"
        cancelText="Annulla"
      />
    </div>
  )
}
