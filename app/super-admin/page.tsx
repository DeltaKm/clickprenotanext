'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Users, Building2, LogOut, Plus, Edit, Trash2, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Stats {
  totalAdmins: number
  activeAdmins: number
  totalLicenses: number
  usedLicenses: number
  totalTenants: number
}

interface LicensePackage {
  id: string
  quantity: number
  used: number
  durationMonths: number
  createdAt: string
}

interface Admin {
  id: string
  email: string
  name: string
  isActive: boolean
  totalLicenses: number
  usedLicenses: number
  licenseExpiresAt: string | null
  createdAt: string
  licensePackages: LicensePackage[]
}

export default function SuperAdminPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    totalLicenses: '10',
    licenseMonths: '12',
  })
  const [formLoading, setFormLoading] = useState(false)
  const [editingPackage, setEditingPackage] = useState<{packageId: string, quantity: number, duration: number} | null>(null)

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
      
      if (user.role !== 'SUPER_ADMIN') {
        alert('Accesso negato - Solo Super Admin')
        router.push('/dashboard')
        return
      }

      const response = await fetch('/api/super-admin/stats', {
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
        await loadAdmins()
      }
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadAdmins = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/super-admin/admins', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setAdmins(data)
      }
    } catch (error) {
      console.error('Load admins error:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const openCreateDialog = () => {
    setEditingAdmin(null)
    setFormData({
      email: '',
      name: '',
      password: '',
      confirmPassword: '',
      totalLicenses: '10',
      licenseMonths: '12',
    })
    setShowDialog(true)
  }

  const openEditDialog = (admin: Admin) => {
    setEditingAdmin(admin)
    setFormData({
      email: admin.email,
      name: admin.name,
      password: '',
      confirmPassword: '',
      totalLicenses: '10',
      licenseMonths: '12',
    })
    setShowDialog(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      if (formData.password && formData.password !== formData.confirmPassword) {
        alert('Le password non corrispondono')
        setFormLoading(false)
        return
      }

      const token = localStorage.getItem('accessToken')
      
      if (editingAdmin) {
        const updateData: any = {
          email: formData.email,
          name: formData.name,
          totalLicenses: parseInt(formData.totalLicenses),
          licenseMonths: parseInt(formData.licenseMonths),
        }
        
        if (formData.password) {
          updateData.password = formData.password
        }

        const response = await fetch(`/api/super-admin/admins/${editingAdmin.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to update admin')
        }
      } else {
        if (!formData.password) {
          alert('La password è obbligatoria')
          setFormLoading(false)
          return
        }

        const response = await fetch('/api/super-admin/admins', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: formData.email,
            name: formData.name,
            password: formData.password,
            totalLicenses: parseInt(formData.totalLicenses),
            licenseMonths: parseInt(formData.licenseMonths),
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create admin')
        }
      }

      setShowDialog(false)
      await loadAdmins()
      await checkAuth()
    } catch (error: any) {
      alert(error.message || 'Errore durante il salvataggio')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (adminId: string, adminName: string) => {
    if (!confirm(`Sei sicuro di voler eliminare l'admin "${adminName}"? Tutte le sue attività saranno eliminate.`)) {
      return
    }

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/super-admin/admins?adminId=${adminId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to delete admin')

      await loadAdmins()
      await checkAuth()
    } catch (error) {
      alert('Errore durante l\'eliminazione')
    }
  }

  const toggleAdminStatus = async (adminId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/super-admin/admins', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          adminId,
          isActive: !currentStatus,
        }),
      })

      if (response.ok) {
        await loadAdmins()
        await checkAuth()
      }
    } catch (error) {
      console.error('Toggle admin error:', error)
    }
  }

  const handleDeletePackage = async (packageId: string, used: number) => {
    if (used > 0) {
      alert(`Impossibile eliminare: ${used} licenze sono in uso`)
      return
    }

    if (!confirm('Sei sicuro di voler eliminare questo pacchetto?')) {
      return
    }

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/super-admin/admins/packages/${packageId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      await loadAdmins()
      await checkAuth()
    } catch (error: any) {
      alert(error.message || 'Errore durante l\'eliminazione')
    }
  }

  const handleUpdatePackage = async (packageId: string, quantity: number, duration: number) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/super-admin/admins/packages/${packageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quantity,
          durationMonths: duration,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      setEditingPackage(null)
      await loadAdmins()
      await checkAuth()
    } catch (error: any) {
      alert(error.message || 'Errore durante l\'aggiornamento')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Verifica accesso Super Admin...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-8 w-8" />
                <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
              </div>
              <p className="text-purple-100">Gestione Admin e Licenze</p>
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
        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Totale Admin
              </CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalAdmins || 0}</div>
              <p className="text-xs text-green-600 mt-1">
                {stats?.activeAdmins || 0} attivi
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Licenze Totali
              </CardTitle>
              <Calendar className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalLicenses || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Assegnate agli admin</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Licenze Usate
              </CardTitle>
              <Building2 className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.usedLicenses || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Attività create</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Licenze Disponibili
              </CardTitle>
              <Calendar className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {(stats?.totalLicenses || 0) - (stats?.usedLicenses || 0)}
              </div>
              <p className="text-xs text-blue-600 mt-1">Ancora disponibili</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Totale Attività
              </CardTitle>
              <Building2 className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalTenants || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Su tutta la piattaforma</p>
            </CardContent>
          </Card>
        </div>

        {/* Admins List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestione Admin
              </CardTitle>
              <Button
                onClick={openCreateDialog}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi Admin
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {admins.map((admin) => {
                return (
                  <div
                    key={admin.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{admin.name}</h3>
                          <Badge variant={admin.isActive ? 'default' : 'secondary'}>
                            {admin.isActive ? 'Attivo' : 'Disattivato'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">
                          Email: <span className="font-mono">{admin.email}</span>
                        </p>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Licenze Totali</p>
                            <p className="font-semibold text-lg">{admin.totalLicenses}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Licenze Usate</p>
                            <p className="font-semibold text-lg text-blue-600">{admin.usedLicenses}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Disponibili</p>
                            <p className="font-semibold text-lg text-green-600">
                              {admin.totalLicenses - admin.usedLicenses}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-gray-400 mt-3">
                          Creato: {new Date(admin.createdAt).toLocaleDateString('it-IT')}
                        </p>

                        {/* License Packages */}
                        {admin.licensePackages.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm font-medium text-gray-700 mb-2">Pacchetti Licenze:</p>
                            <div className="space-y-2">
                              {admin.licensePackages.map((pkg) => {
                                const isEditing = editingPackage?.packageId === pkg.id
                                
                                return (
                                  <div key={pkg.id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                                    {isEditing ? (
                                      <div className="flex items-center gap-2 flex-1">
                                        <input
                                          type="number"
                                          min={pkg.used}
                                          value={editingPackage.quantity}
                                          onChange={(e) => setEditingPackage({...editingPackage, quantity: parseInt(e.target.value)})}
                                          className="w-20 px-2 py-1 border rounded"
                                          placeholder="Quantità"
                                        />
                                        <span className="text-xs text-gray-500">licenze</span>
                                        <input
                                          type="number"
                                          min="1"
                                          value={editingPackage.duration}
                                          onChange={(e) => setEditingPackage({...editingPackage, duration: parseInt(e.target.value)})}
                                          className="w-20 px-2 py-1 border rounded"
                                          placeholder="Durata"
                                        />
                                        <span className="text-xs text-gray-500">mesi</span>
                                        <Button
                                          size="sm"
                                          onClick={() => handleUpdatePackage(pkg.id, editingPackage.quantity, editingPackage.duration)}
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          Salva
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setEditingPackage(null)}
                                        >
                                          Annulla
                                        </Button>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="flex gap-4 flex-1">
                                          <span className="text-gray-600">
                                            {pkg.quantity} licenze ({pkg.used} usate, {pkg.quantity - pkg.used} disponibili)
                                          </span>
                                          <span className="text-blue-600 font-medium">
                                            Durata: {pkg.durationMonths} {pkg.durationMonths === 1 ? 'mese' : 'mesi'}
                                          </span>
                                          <span className="text-gray-500 text-xs">
                                            Creato: {new Date(pkg.createdAt).toLocaleDateString('it-IT')}
                                          </span>
                                        </div>
                                        <div className="flex gap-1">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setEditingPackage({packageId: pkg.id, quantity: pkg.quantity, duration: pkg.durationMonths})}
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleDeletePackage(pkg.id, pkg.used)}
                                            disabled={pkg.used > 0}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(admin)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Modifica
                        </Button>
                        <Button
                          variant={admin.isActive ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => toggleAdminStatus(admin.id, admin.isActive)}
                        >
                          {admin.isActive ? 'Disattiva' : 'Attiva'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(admin.id, admin.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}

              {admins.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nessun admin trovato
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog per Creare/Modificare Admin */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAdmin ? 'Modifica Admin / Aggiungi Pacchetto Licenze' : 'Nuovo Admin'}
            </DialogTitle>
            <DialogDescription>
              {editingAdmin 
                ? 'Modifica i dettagli dell\'admin o aggiungi un nuovo pacchetto di licenze' 
                : 'Crea un nuovo admin con il primo pacchetto di licenze'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="es: Mario Rossi"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="es: mario@esempio.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">
                Password {editingAdmin && '(lascia vuoto per non modificare)'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimo 8 caratteri"
                required={!editingAdmin}
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
                required={!editingAdmin || !!formData.password}
                minLength={8}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalLicenses">Numero Licenze</Label>
                <Input
                  id="totalLicenses"
                  type="number"
                  min="1"
                  value={formData.totalLicenses}
                  onChange={(e) => setFormData({ ...formData, totalLicenses: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="licenseMonths">Durata (Mesi)</Label>
                <Input
                  id="licenseMonths"
                  type="number"
                  min="1"
                  value={formData.licenseMonths}
                  onChange={(e) => setFormData({ ...formData, licenseMonths: e.target.value })}
                  required
                />
              </div>
            </div>

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
                {formLoading ? 'Salvataggio...' : editingAdmin ? 'Salva' : 'Crea Admin'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
