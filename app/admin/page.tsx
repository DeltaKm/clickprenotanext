'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Users, Building2, Calendar, UserCheck, CheckCircle, XCircle, LogOut, Plus, Edit, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface LicenseInfo {
  total: number
  used: number
  available: number
  packages: Array<{
    id: string
    quantity: number
    used: number
    durationMonths: number
    createdAt: string
  }>
}

interface Stats {
  totalTenants: number
  activeTenants: number
  inactiveTenants: number
  totalUsers: number
  totalAppointments: number
  totalCustomers: number
  recentAziende: any[]
  licenses: LicenseInfo
}

interface Azienda {
  id: string
  slug: string
  name: string
  isActive: boolean
  expiresAt: string | null
  createdAt: string
  _count: {
    users: number
    appointments: number
    customers: number
    services: number
  }
  users: Array<{
    id: string
    email: string
    name: string
    role: string
  }>
}

export default function AdminPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [aziende, setAziende] = useState<Azienda[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingAzienda, setEditingAzienda] = useState<Azienda | null>(null)
  const [formData, setFormData] = useState({
    slug: '',
    name: '',
    ownerEmail: '',
    ownerName: '',
    ownerPassword: '',
    confirmPassword: '',
    packageId: '',
    licenseQuantity: 1,
  })
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const userData = localStorage.getItem('user')
      
      if (!token || !userData) {
        router.push('/login')
        return
      }

      const user = JSON.parse(userData)
      
      // Check if user is Admin
      if (user.role !== 'ADMIN') {
        alert('Accesso negato - Solo Admin')
        router.push('/dashboard')
        return
      }

      // Verify admin access by trying to fetch stats
      const response = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.status === 403 || response.status === 401) {
        alert('Accesso negato - Solo Super Admin')
        router.push('/login')
        return
      }

      if (response.ok) {
        const data = await response.json()
        setStats(data)
        await loadAziende()
      }
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadAziende = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/admin/tenants', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setAziende(data)
      }
    } catch (error) {
      console.error('Load aziende error:', error)
    }
  }

  const toggleAziendaStatus = async (tenantId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/admin/tenants', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenantId,
          isActive: !currentStatus,
        }),
      })

      if (response.ok) {
        await loadAziende()
        await checkAuth() // Reload stats
      }
    } catch (error) {
      console.error('Toggle tenant error:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const openCreateDialog = () => {
    setEditingAzienda(null)
    const firstPackage = stats?.licenses.packages.find(pkg => pkg.quantity > pkg.used)
    setFormData({
      slug: '',
      name: '',
      ownerEmail: '',
      ownerName: '',
      ownerPassword: '',
      confirmPassword: '',
      packageId: firstPackage?.id || '', // Preseleziono primo pacchetto disponibile
      licenseQuantity: 1,
    })
    setShowDialog(true)
  }

  const openEditDialog = (azienda: Azienda) => {
    setEditingAzienda(azienda)
    setFormData({
      slug: azienda.slug,
      name: azienda.name,
      ownerEmail: azienda.users[0]?.email || '',
      ownerName: azienda.users[0]?.name || '',
      ownerPassword: '',
      confirmPassword: '',
      packageId: '', // Vuoto di default in modifica
      licenseQuantity: 1,
    })
    setShowDialog(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      // Validazione password
      if (formData.ownerPassword && formData.ownerPassword !== formData.confirmPassword) {
        alert('Le password non corrispondono')
        setFormLoading(false)
        return
      }

      const token = localStorage.getItem('accessToken')
      
      if (editingAzienda) {
        // Update existing tenant - tutti i campi
        const updateData: any = {
          slug: formData.slug,
          name: formData.name,
          ownerEmail: formData.ownerEmail,
          ownerName: formData.ownerName,
        }
        
        // Aggiungi password solo se compilata
        if (formData.ownerPassword) {
          updateData.ownerPassword = formData.ownerPassword
        }

        // Aggiungi licenze SOLO se packageId è selezionato (non vuoto)
        if (formData.packageId) {
          updateData.packageId = formData.packageId
          updateData.licenseQuantity = formData.licenseQuantity
        }

        const response = await fetch(`/api/admin/tenants/${editingAzienda.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to update tenant')
        }
      } else {
        // Create new tenant
        if (!formData.ownerPassword) {
          alert('La password è obbligatoria')
          setFormLoading(false)
          return
        }

        const response = await fetch('/api/admin/tenants', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            slug: formData.slug,
            name: formData.name,
            ownerEmail: formData.ownerEmail,
            ownerName: formData.ownerName,
            ownerPassword: formData.ownerPassword,
            packageId: formData.packageId,
            licenseQuantity: formData.licenseQuantity,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create tenant')
        }
      }

      setShowDialog(false)
      await loadAziende()
      await checkAuth()
    } catch (error: any) {
      alert(error.message || 'Errore durante il salvataggio')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (tenantId: string, aziendaName: string) => {
    if (!confirm(`Sei sicuro di voler eliminare "${aziendaName}"? Questa azione eliminerà tutti i dati associati e non può essere annullata.`)) {
      return
    }

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/admin/tenants?tenantId=${tenantId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to delete azienda')

      await loadAziende()
      await checkAuth()
    } catch (error) {
      alert('Errore durante l\'eliminazione')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Verifica accesso Admin...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-8 w-8" />
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              </div>
              <p className="text-purple-100">Gestione delle tue attività</p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="bg-white/10 hover:bg-white/20 text-white border-white/30"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* License Info Banner */}
        {stats?.licenses && (
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Le Tue Licenze</h3>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-sm text-gray-600">Totali</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.licenses.total}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Usate</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.licenses.used}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Disponibili</p>
                      <p className="text-2xl font-bold text-green-600">{stats.licenses.available}</p>
                    </div>
                  </div>
                </div>
                {stats.licenses.available === 0 && (
                  <Badge variant="destructive" className="text-sm">
                    Nessuna licenza disponibile
                  </Badge>
                )}
              </div>
              
              {/* License Packages Details */}
              {stats.licenses.packages.length > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Dettaglio Pacchetti:</p>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {stats.licenses.packages.map((pkg) => {
                      return (
                        <div 
                          key={pkg.id} 
                          className="p-3 rounded-lg border bg-white border-gray-200"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-sm font-medium">
                              {pkg.quantity} licenze
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {pkg.durationMonths} {pkg.durationMonths === 1 ? 'mese' : 'mesi'}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600">
                            {pkg.used} usate • {pkg.quantity - pkg.used} disponibili
                          </p>
                          <p className="text-xs mt-1 text-gray-500">
                            Creato: {new Date(pkg.createdAt).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Totale Aziende
              </CardTitle>
              <Building2 className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalTenants || 0}</div>
              <p className="text-xs text-green-600 mt-1">
                {stats?.activeTenants || 0} attive
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Totale Utenti
              </CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Su tutti i tenant</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Appuntamenti
              </CardTitle>
              <Calendar className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalAppointments || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Totale piattaforma</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Clienti
              </CardTitle>
              <UserCheck className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalCustomers || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Totale registrati</p>
            </CardContent>
          </Card>
        </div>

        {/* Aziende List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Gestione Aziende
              </CardTitle>
              <Button
                onClick={openCreateDialog}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi Azienda
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {aziende.map((azienda) => (
                <div
                  key={azienda.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{azienda.name}</h3>
                        <Badge variant={azienda.isActive ? 'default' : 'secondary'}>
                          {azienda.isActive ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Attivo
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              Disattivato
                            </span>
                          )}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        Slug: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{azienda.slug}</span>
                      </p>

                      {azienda.users.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700">Owner:</p>
                          {azienda.users.map((user, idx) => (
                            <p key={idx} className="text-sm text-gray-600">
                              {user.name} ({user.email})
                            </p>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>👥 {azienda._count.users} utenti</span>
                        <span>📅 {azienda._count.appointments} appuntamenti</span>
                        <span>👤 {azienda._count.customers} clienti</span>
                        <span>🛠️ {azienda._count.services} servizi</span>
                      </div>

                      {azienda.expiresAt && (
                        <p className="text-xs text-orange-600 mt-2 font-medium">
                          Scade: {new Date(azienda.expiresAt).toLocaleDateString('it-IT')}
                        </p>
                      )}

                      <p className="text-xs text-gray-400 mt-2">
                        Creato: {new Date(azienda.createdAt).toLocaleDateString('it-IT')}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(azienda)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Modifica
                      </Button>
                      <Button
                        variant={azienda.isActive ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => toggleAziendaStatus(azienda.id, azienda.isActive)}
                      >
                        {azienda.isActive ? 'Disattiva' : 'Attiva'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(azienda.id, azienda.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {aziende.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nessuna azienda trovata
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog per Creare/Modificare Azienda */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAzienda ? 'Modifica Azienda' : 'Nuova Azienda'}
            </DialogTitle>
            <DialogDescription>
              {editingAzienda 
                ? 'Modifica i dettagli dell\'azienda' 
                : 'Crea una nuova azienda con il suo owner'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="es: salone-mario"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Solo lettere minuscole, numeri e trattini
              </p>
            </div>

            <div>
              <Label htmlFor="name">Nome Azienda</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="es: Salone Mario"
                required
              />
            </div>

            <div>
              <Label htmlFor="ownerName">Nome Owner</Label>
              <Input
                id="ownerName"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                placeholder="es: Mario Rossi"
                required
              />
            </div>

            <div>
              <Label htmlFor="ownerEmail">Email Owner</Label>
              <Input
                id="ownerEmail"
                type="email"
                value={formData.ownerEmail}
                onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                placeholder="es: mario@esempio.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="ownerPassword">
                Password Owner {editingAzienda && '(lascia vuoto per non modificare)'}
              </Label>
              <Input
                id="ownerPassword"
                type="password"
                value={formData.ownerPassword}
                onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                placeholder="Minimo 8 caratteri"
                required={!editingAzienda}
                minLength={8}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Conferma Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Ripeti la password"
                required={!editingAzienda || !!formData.ownerPassword}
                minLength={8}
              />
            </div>

            {stats?.licenses && (
              <>
                <div className="pt-4 border-t">
                  <Label htmlFor="packageId">
                    Pacchetto Licenze (opzionale)
                  </Label>
                  <select
                    id="packageId"
                    value={formData.packageId}
                    onChange={(e) => setFormData({ ...formData, packageId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">
                      {editingAzienda ? 'Non aggiungere licenze' : 'Nessuna licenza'}
                    </option>
                    {stats.licenses.packages
                      .filter(pkg => pkg.quantity > pkg.used)
                      .map(pkg => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.durationMonths} {pkg.durationMonths === 1 ? 'mese' : 'mesi'} - 
                          {pkg.quantity - pkg.used} licenze disponibili
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {editingAzienda 
                      ? 'Seleziona un pacchetto per estendere la scadenza dell\'azienda'
                      : 'Lascia "Nessuna licenza" per creare un\'azienda demo senza scadenza'}
                  </p>
                </div>

                {formData.packageId && (() => {
                  const selectedPackage = stats.licenses.packages.find(p => p.id === formData.packageId);
                  const maxLicenses = selectedPackage ? selectedPackage.quantity - selectedPackage.used : 1;
                  
                  return (
                    <div>
                      <Label htmlFor="licenseQuantity">Numero Licenze da Usare</Label>
                      <Input
                        id="licenseQuantity"
                        type="number"
                        min="1"
                        max={maxLicenses}
                        value={formData.licenseQuantity}
                        onChange={(e) => setFormData({ ...formData, licenseQuantity: parseInt(e.target.value) || 1 })}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedPackage && (
                          <>
                            {editingAzienda ? 'Estensione: ' : 'Durata totale: '}
                            {formData.licenseQuantity * selectedPackage.durationMonths} mesi
                            {' '}({formData.licenseQuantity} licenze × {selectedPackage.durationMonths} mesi)
                            {editingAzienda && editingAzienda.expiresAt && (
                              <>
                                <br />
                                Nuova scadenza: {new Date(
                                  new Date(editingAzienda.expiresAt).getTime() + 
                                  (formData.licenseQuantity * selectedPackage.durationMonths * 30 * 24 * 60 * 60 * 1000)
                                ).toLocaleDateString('it-IT')}
                              </>
                            )}
                        </>
                      )}
                    </p>
                  </div>
                  );
                })()}
              </>
            )}

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={formLoading}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? 'Salvataggio...' : editingAzienda ? 'Salva' : 'Crea Azienda'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
