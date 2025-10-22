'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Users, Building2, Calendar, UserCheck, CheckCircle, XCircle, LogOut, Plus, Edit, Trash2, Mail, User, Wrench, Power, PowerOff, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useToast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'

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
  const { toast } = useToast()
  const [stats, setStats] = useState<Stats | null>(null)
  const [aziende, setAziende] = useState<Azienda[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; tenantId: string | null; tenantName: string }>({ open: false, tenantId: null, tenantName: '' })
  const [toggleDialog, setToggleDialog] = useState<{ open: boolean; tenantId: string | null; tenantName: string; currentStatus: boolean }>({ open: false, tenantId: null, tenantName: '', currentStatus: false })
  const [toggleLoading, setToggleLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [newTenantData, setNewTenantData] = useState<Azienda | null>(null)
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
  const [tenantEmailConfig, setTenantEmailConfig] = useState({
    host: '',
    port: '587',
    secure: false,
    user: '',
    pass: '',
    from: '',
    fromName: '',
  })
  const [showTenantEmailConfig, setShowTenantEmailConfig] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [showEmailConfig, setShowEmailConfig] = useState(false)
  const [emailConfig, setEmailConfig] = useState({
    host: '',
    port: '587',
    secure: false,
    user: '',
    pass: '',
    from: '',
    fromName: '',
  })
  const [emailConfigLoading, setEmailConfigLoading] = useState(false)
  const [showEmailTemplates, setShowEmailTemplates] = useState(false)
  const [emailTemplates, setEmailTemplates] = useState({
    bookingRequest: {
      subject: 'Richiesta di Prenotazione Ricevuta',
      body: 'Ciao {{customerName}},\n\nGrazie per la tua richiesta di prenotazione!\n\nServizio: {{serviceName}}\nData: {{date}}\nOra: {{time}}\nPrezzo: {{price}}\n\nRiceverai una conferma a breve.',
    },
    bookingConfirmation: {
      subject: 'Conferma Prenotazione - {{serviceName}}',
      body: 'Ciao {{customerName}},\n\nLa tua prenotazione è confermata!\n\nServizio: {{serviceName}}\nData: {{date}}\nOra: {{time}}\nPrezzo: {{price}}\n\nGrazie per averci scelto!',
    },
    bookingRejection: {
      subject: 'Prenotazione Annullata',
      body: 'Ciao {{customerName}},\n\nCi dispiace informarti che la tua prenotazione è stata annullata.\n\nServizio: {{serviceName}}\nData: {{date}}\nOra: {{time}}\n\nPer ulteriori informazioni, contattaci.',
    },
    ownerNotification: {
      subject: 'Nuova Prenotazione - {{serviceName}}',
      body: 'Hai ricevuto una nuova prenotazione:\n\nCliente: {{customerName}}\nEmail: {{customerEmail}}\nServizio: {{serviceName}}\nData: {{date}}\nOra: {{time}}',
    },
  })
  const [emailTemplatesLoading, setEmailTemplatesLoading] = useState(false)

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

  const loadEmailConfig = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/admin/email-config', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.emailConfig) {
          setEmailConfig(data.emailConfig)
        }
      }
    } catch (error) {
      console.error('Load email config error:', error)
    }
  }

  const saveEmailConfig = async () => {
    if (!emailConfig.host || !emailConfig.user || !emailConfig.pass || !emailConfig.from || !emailConfig.fromName) {
      alert('Compila tutti i campi obbligatori')
      return
    }

    setEmailConfigLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/admin/email-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(emailConfig),
      })

      if (response.ok) {
        toast({
          variant: 'success',
          title: (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>Configurazione Salvata</span>
            </div>
          ) as any,
          description: 'La configurazione email è stata salvata con successo!',
        })
        setShowEmailConfig(false)
      } else {
        const error = await response.json()
        toast({
          variant: 'destructive',
          title: (
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              <span>Errore</span>
            </div>
          ) as any,
          description: error.error || 'Impossibile salvare la configurazione',
        })
      }
    } catch (error) {
      console.error('Save email config error:', error)
      toast({
        variant: 'destructive',
        title: (
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            <span>Errore</span>
          </div>
        ) as any,
        description: 'Errore durante il salvataggio',
      })
    } finally {
      setEmailConfigLoading(false)
    }
  }

  const loadEmailTemplates = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/tenant/email-templates', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.emailTemplates) {
          // Merge con i valori di default per evitare undefined
          setEmailTemplates({
            bookingRequest: {
              subject: data.emailTemplates.bookingRequest?.subject || 'Richiesta di Prenotazione Ricevuta',
              body: data.emailTemplates.bookingRequest?.body || 'Ciao {{customerName}},\n\nGrazie per la tua richiesta di prenotazione!\n\nServizio: {{serviceName}}\nData: {{date}}\nOra: {{time}}\nPrezzo: {{price}}\n\nRiceverai una conferma a breve.',
            },
            bookingConfirmation: {
              subject: data.emailTemplates.bookingConfirmation?.subject || 'Conferma Prenotazione - {{serviceName}}',
              body: data.emailTemplates.bookingConfirmation?.body || 'Ciao {{customerName}},\n\nLa tua prenotazione è confermata!\n\nServizio: {{serviceName}}\nData: {{date}}\nOra: {{time}}\nPrezzo: {{price}}\n\nGrazie per averci scelto!',
            },
            bookingRejection: {
              subject: data.emailTemplates.bookingRejection?.subject || 'Prenotazione Annullata',
              body: data.emailTemplates.bookingRejection?.body || 'Ciao {{customerName}},\n\nCi dispiace informarti che la tua prenotazione è stata annullata.\n\nServizio: {{serviceName}}\nData: {{date}}\nOra: {{time}}\n\nPer ulteriori informazioni, contattaci.',
            },
            ownerNotification: {
              subject: data.emailTemplates.ownerNotification?.subject || 'Nuova Prenotazione - {{serviceName}}',
              body: data.emailTemplates.ownerNotification?.body || 'Hai ricevuto una nuova prenotazione:\n\nCliente: {{customerName}}\nEmail: {{customerEmail}}\nServizio: {{serviceName}}\nData: {{date}}\nOra: {{time}}',
            },
          })
        }
      }
    } catch (error) {
      console.error('Load email templates error:', error)
    }
  }

  const saveEmailTemplates = async () => {
    setEmailTemplatesLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/tenant/email-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ emailTemplates }),
      })

      if (response.ok) {
        toast({
          variant: 'success',
          title: (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Template Salvati</span>
            </div>
          ) as any,
          description: 'I template email sono stati salvati con successo!',
        })
      } else {
        const error = await response.json()
        toast({
          variant: 'destructive',
          title: (
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              <span>Errore</span>
            </div>
          ) as any,
          description: error.error || 'Impossibile salvare i template',
        })
      }
    } catch (error) {
      console.error('Save email templates error:', error)
      toast({
        variant: 'destructive',
        title: (
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            <span>Errore</span>
          </div>
        ) as any,
        description: 'Errore durante il salvataggio',
      })
    } finally {
      setEmailTemplatesLoading(false)
    }
  }

  const openToggleDialog = (tenantId: string, tenantName: string, currentStatus: boolean) => {
    setToggleDialog({ open: true, tenantId, tenantName, currentStatus })
  }

  const toggleAziendaStatus = async () => {
    if (!toggleDialog.tenantId) return

    setToggleLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/admin/tenants', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenantId: toggleDialog.tenantId,
          isActive: !toggleDialog.currentStatus,
        }),
      })

      if (response.ok) {
        const newStatus = !toggleDialog.currentStatus
        toast({
          variant: newStatus ? 'success' : 'default',
          title: (
            <div className="flex items-center gap-2">
              {newStatus ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <span>{newStatus ? 'Azienda Attivata' : 'Azienda Disattivata'}</span>
            </div>
          ) as any,
          description: newStatus 
            ? 'L\'azienda è stata attivata con successo. Gli utenti possono ora accedere.' 
            : 'L\'azienda è stata disattivata. Gli utenti non potranno più accedere fino alla riattivazione.',
        })
        setToggleDialog({ open: false, tenantId: null, tenantName: '', currentStatus: false })
        await loadAziende()
        await checkAuth() // Reload stats
      } else {
        const error = await response.json()
        toast({
          variant: 'destructive',
          title: (
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              <span>Errore</span>
            </div>
          ) as any,
          description: error.error || 'Impossibile modificare lo stato dell\'azienda',
        })
      }
    } catch (error) {
      console.error('Toggle tenant error:', error)
      toast({
        variant: 'destructive',
        title: (
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            <span>Errore</span>
          </div>
        ) as any,
        description: 'Errore durante la modifica dello stato',
      })
    } finally {
      setToggleLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const openCreateDialog = () => {
    setNewTenantData(null)
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
    setTenantEmailConfig({
      host: '',
      port: '587',
      secure: false,
      user: '',
      pass: '',
      from: '',
      fromName: '',
    })
    setShowTenantEmailConfig(false)
    setShowCreateModal(true)
  }

  const openEditDialog = async (azienda: Azienda) => {
    setNewTenantData(azienda)
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
    
    // Carica configurazione email del tenant
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/admin/tenants/${azienda.id}/email-config`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        if (data.emailConfig) {
          setTenantEmailConfig(data.emailConfig)
          setShowTenantEmailConfig(false)
        }
      }
    } catch (error) {
      console.error('Error loading tenant email config:', error)
    }
    
    setShowCreateModal(true)
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
      
      if (newTenantData) {
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
        
        // Aggiungi configurazione email
        // Se i campi sono vuoti, invia null per rimuovere la config personalizzata
        if (tenantEmailConfig.host && tenantEmailConfig.user && tenantEmailConfig.from) {
          updateData.emailConfig = tenantEmailConfig
        } else if (!tenantEmailConfig.host && !tenantEmailConfig.user) {
          // Campi vuoti = rimuovi configurazione personalizzata
          updateData.emailConfig = null
        }

        const response = await fetch(`/api/admin/tenants/${newTenantData.id}`, {
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

        const createData: any = {
          slug: formData.slug,
          name: formData.name,
          ownerEmail: formData.ownerEmail,
          ownerName: formData.ownerName,
          ownerPassword: formData.ownerPassword,
          packageId: formData.packageId,
          licenseQuantity: formData.licenseQuantity,
        }
        
        // Aggiungi configurazione email se compilata
        if (tenantEmailConfig.host && tenantEmailConfig.user && tenantEmailConfig.from) {
          createData.emailConfig = tenantEmailConfig
        }
        
        const response = await fetch('/api/admin/tenants', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(createData),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create tenant')
        }
      }

      setShowCreateModal(false)
      await loadAziende()
      await checkAuth()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: (
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            <span>Errore</span>
          </div>
        ) as any,
        description: error.message || 'Errore durante il salvataggio',
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteClick = (tenant: any) => {
    setDeleteDialog({ open: true, tenantId: tenant.id, tenantName: tenant.aziendaName })
  }

  const handleDelete = async () => {
    if (!deleteDialog.tenantId) return

    setDeleteLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/admin/tenants/${deleteDialog.tenantId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to delete azienda')

      toast({
        variant: 'success',
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span>Azienda Eliminata</span>
          </div>
        ) as any,
        description: 'L\'azienda e tutti i dati associati sono stati eliminati definitivamente.',
      })
      setDeleteDialog({ open: false, tenantId: null, tenantName: '' })
      await loadAziende()
      await checkAuth()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: (
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            <span>Errore</span>
          </div>
        ) as any,
        description: 'Errore durante l\'eliminazione dell\'azienda',
      })
    } finally {
      setDeleteLoading(false)
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8" />
                <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
              </div>
              <p className="text-purple-100 text-sm sm:text-base">Gestione delle tue attività</p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 w-full sm:w-auto"
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="w-full">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Le Tue Licenze</h3>
                  <div className="grid grid-cols-3 gap-3 sm:gap-6">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Totali</p>
                      <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.licenses.total}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Usate</p>
                      <p className="text-xl sm:text-2xl font-bold text-purple-600">{stats.licenses.used}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Disponibili</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.licenses.available}</p>
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

        {/* Email Configuration Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configurazione Email SMTP
              </CardTitle>
              <Button
                onClick={() => {
                  loadEmailConfig()
                  setShowEmailConfig(!showEmailConfig)
                }}
                variant="outline"
              >
                {showEmailConfig ? 'Nascondi' : 'Configura'}
              </Button>
            </div>
          </CardHeader>
          {showEmailConfig && (
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Configura il server SMTP per l&apos;invio delle email. Questa configurazione verrà applicata a tutti i tuoi business.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtp-host">Host SMTP *</Label>
                    <Input
                      id="smtp-host"
                      placeholder="smtp.aruba.it"
                      value={emailConfig.host}
                      onChange={(e) => setEmailConfig({ ...emailConfig, host: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Es: smtp.aruba.it, smtp.gmail.com</p>
                  </div>

                  <div>
                    <Label htmlFor="smtp-port">Porta *</Label>
                    <Input
                      id="smtp-port"
                      type="number"
                      placeholder="587"
                      value={emailConfig.port}
                      onChange={(e) => setEmailConfig({ ...emailConfig, port: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Comune: 587 (TLS), 465 (SSL)</p>
                  </div>

                  <div>
                    <Label htmlFor="smtp-user">Username *</Label>
                    <Input
                      id="smtp-user"
                      placeholder="noreply@tuodominio.it"
                      value={emailConfig.user}
                      onChange={(e) => setEmailConfig({ ...emailConfig, user: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="smtp-pass">Password *</Label>
                    <Input
                      id="smtp-pass"
                      type="password"
                      placeholder="••••••••"
                      value={emailConfig.pass}
                      onChange={(e) => setEmailConfig({ ...emailConfig, pass: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="smtp-from">Email Mittente *</Label>
                    <Input
                      id="smtp-from"
                      type="email"
                      placeholder="noreply@tuodominio.it"
                      value={emailConfig.from}
                      onChange={(e) => setEmailConfig({ ...emailConfig, from: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="smtp-fromName">Nome Mittente *</Label>
                    <Input
                      id="smtp-fromName"
                      placeholder="Il Tuo Business"
                      value={emailConfig.fromName}
                      onChange={(e) => setEmailConfig({ ...emailConfig, fromName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="smtp-secure"
                    checked={emailConfig.secure}
                    onChange={(e) => setEmailConfig({ ...emailConfig, secure: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="smtp-secure" className="cursor-pointer">
                    Usa SSL/TLS (consigliato per porta 465)
                  </Label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={saveEmailConfig}
                    disabled={emailConfigLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {emailConfigLoading ? 'Salvataggio...' : 'Salva Configurazione'}
                  </Button>
                  <Button
                    onClick={() => setShowEmailConfig(false)}
                    variant="outline"
                  >
                    Annulla
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Email Templates Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Template Email
              </CardTitle>
              <Button
                onClick={() => {
                  loadEmailTemplates()
                  setShowEmailTemplates(!showEmailTemplates)
                }}
                variant="outline"
              >
                {showEmailTemplates ? 'Nascondi' : 'Personalizza'}
              </Button>
            </div>
          </CardHeader>
          {showEmailTemplates && (
            <CardContent>
              <div className="space-y-6">
                <p className="text-sm text-gray-600 mb-4">
                  Personalizza i messaggi email inviati ai clienti. Usa le variabili tra doppie parentesi graffe per inserire dati dinamici.
                </p>

                {/* Email Richiesta Prenotazione */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Email di Richiesta Prenotazione (Inviata Subito)
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="request-subject">Oggetto</Label>
                      <Input
                        id="request-subject"
                        placeholder="Richiesta di Prenotazione Ricevuta"
                        value={emailTemplates.bookingRequest.subject}
                        onChange={(e) => setEmailTemplates({
                          ...emailTemplates,
                          bookingRequest: {
                            ...emailTemplates.bookingRequest,
                            subject: e.target.value
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="request-body">Messaggio</Label>
                      <Textarea
                        id="request-body"
                        rows={8}
                        placeholder="Ciao {{customerName}},..."
                        value={emailTemplates.bookingRequest.body}
                        onChange={(e) => setEmailTemplates({
                          ...emailTemplates,
                          bookingRequest: {
                            ...emailTemplates.bookingRequest,
                            body: e.target.value
                          }
                        })}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        <strong>Variabili disponibili:</strong> {'{{customerName}}'}, {'{{serviceName}}'}, {'{{date}}'}, {'{{time}}'}, {'{{price}}'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email Conferma Cliente */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Email di Conferma al Cliente
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="confirm-subject">Oggetto</Label>
                      <Input
                        id="confirm-subject"
                        placeholder="Conferma Prenotazione - {{serviceName}}"
                        value={emailTemplates.bookingConfirmation.subject}
                        onChange={(e) => setEmailTemplates({
                          ...emailTemplates,
                          bookingConfirmation: {
                            ...emailTemplates.bookingConfirmation,
                            subject: e.target.value
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirm-body">Messaggio</Label>
                      <Textarea
                        id="confirm-body"
                        rows={8}
                        placeholder="Ciao {{customerName}},..."
                        value={emailTemplates.bookingConfirmation.body}
                        onChange={(e) => setEmailTemplates({
                          ...emailTemplates,
                          bookingConfirmation: {
                            ...emailTemplates.bookingConfirmation,
                            body: e.target.value
                          }
                        })}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        <strong>Variabili disponibili:</strong> {'{{customerName}}'}, {'{{serviceName}}'}, {'{{date}}'}, {'{{time}}'}, {'{{price}}'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email Cancellazione/Rifiuto */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Email di Cancellazione Prenotazione
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="rejection-subject">Oggetto</Label>
                      <Input
                        id="rejection-subject"
                        placeholder="Prenotazione Annullata"
                        value={emailTemplates.bookingRejection.subject}
                        onChange={(e) => setEmailTemplates({
                          ...emailTemplates,
                          bookingRejection: {
                            ...emailTemplates.bookingRejection,
                            subject: e.target.value
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="rejection-body">Messaggio</Label>
                      <Textarea
                        id="rejection-body"
                        rows={8}
                        placeholder="Ciao {{customerName}},..."
                        value={emailTemplates.bookingRejection.body}
                        onChange={(e) => setEmailTemplates({
                          ...emailTemplates,
                          bookingRejection: {
                            ...emailTemplates.bookingRejection,
                            body: e.target.value
                          }
                        })}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        <strong>Variabili disponibili:</strong> {'{{customerName}}'}, {'{{serviceName}}'}, {'{{date}}'}, {'{{time}}'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email Notifica Proprietario */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Email di Notifica al Proprietario
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="owner-subject">Oggetto</Label>
                      <Input
                        id="owner-subject"
                        placeholder="Nuova Prenotazione - {{serviceName}}"
                        value={emailTemplates.ownerNotification.subject}
                        onChange={(e) => setEmailTemplates({
                          ...emailTemplates,
                          ownerNotification: {
                            ...emailTemplates.ownerNotification,
                            subject: e.target.value
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="owner-body">Messaggio</Label>
                      <Textarea
                        id="owner-body"
                        rows={8}
                        placeholder="Hai ricevuto una nuova prenotazione..."
                        value={emailTemplates.ownerNotification.body}
                        onChange={(e) => setEmailTemplates({
                          ...emailTemplates,
                          ownerNotification: {
                            ...emailTemplates.ownerNotification,
                            body: e.target.value
                          }
                        })}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        <strong>Variabili disponibili:</strong> {'{{customerName}}'}, {'{{customerEmail}}'}, {'{{serviceName}}'}, {'{{date}}'}, {'{{time}}'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={saveEmailTemplates}
                    disabled={emailTemplatesLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {emailTemplatesLoading ? 'Salvataggio...' : 'Salva Template'}
                  </Button>
                  <Button
                    onClick={() => setShowEmailTemplates(false)}
                    variant="outline"
                  >
                    Annulla
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Building2 className="h-5 w-5" />
                Gestione Aziende
              </CardTitle>
              <Button
                onClick={openCreateDialog}
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
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
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-base sm:text-lg">{azienda.name}</h3>
                        <Badge variant={azienda.isActive ? 'default' : 'secondary'} className="text-xs">
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

                      <div className="grid grid-cols-2 sm:flex sm:gap-4 gap-2 text-xs sm:text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {azienda._count.users} utenti
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {azienda._count.appointments} appuntamenti
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {azienda._count.customers} clienti
                        </span>
                        <span className="flex items-center gap-1">
                          <Wrench className="h-3.5 w-3.5" />
                          {azienda._count.services} servizi
                        </span>
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

                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(azienda)}
                        className="flex-1 sm:flex-none"
                      >
                        <Edit className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Modifica</span>
                      </Button>
                      <Button
                        variant={azienda.isActive ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => openToggleDialog(azienda.id, azienda.name, azienda.isActive)}
                        className="flex-1 sm:flex-none text-xs sm:text-sm"
                      >
                        {azienda.isActive ? 'Disattiva' : 'Attiva'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(azienda)}
                        className="w-10 sm:w-auto"
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
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newTenantData ? 'Modifica Azienda' : 'Nuova Azienda'}
            </DialogTitle>
            <DialogDescription>
              {newTenantData 
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
                Password Owner
              </Label>
              <Input
                id="ownerPassword"
                type="password"
                value={formData.ownerPassword}
                onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                placeholder={newTenantData ? "Lascia vuoto per non modificare" : "Minimo 8 caratteri"}
                className="placeholder:text-xs"
                required={!newTenantData}
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
                required={!newTenantData || !!formData.ownerPassword}
                minLength={8}
              />
            </div>

            {/* Configurazione Email SMTP per Tenant */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base font-semibold">Configurazione Email SMTP (Opzionale)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTenantEmailConfig(!showTenantEmailConfig)}
                >
                  {showTenantEmailConfig ? 'Nascondi' : 'Configura'}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Configura SMTP specifico per questa azienda. Se non configurato, userà le impostazioni globali dell&apos;Admin.
              </p>

              {/* Pulsante per applicare config globale */}
              {showTenantEmailConfig && tenantEmailConfig.host && (
                <div className="mb-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTenantEmailConfig({
                        host: '',
                        port: '587',
                        secure: false,
                        user: '',
                        pass: '',
                        from: '',
                        fromName: '',
                      })
                    }}
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rimuovi Configurazione Personalizzata (Usa Globale)
                  </Button>
                </div>
              )}
              
              {showTenantEmailConfig && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="tenant-smtp-host" className="text-sm">Host SMTP</Label>
                      <Input
                        id="tenant-smtp-host"
                        placeholder="smtp.aruba.it"
                        value={tenantEmailConfig.host}
                        onChange={(e) => setTenantEmailConfig({ ...tenantEmailConfig, host: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="tenant-smtp-port" className="text-sm">Porta</Label>
                      <Input
                        id="tenant-smtp-port"
                        type="number"
                        placeholder="587"
                        value={tenantEmailConfig.port}
                        onChange={(e) => setTenantEmailConfig({ ...tenantEmailConfig, port: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="tenant-smtp-user" className="text-sm">Username</Label>
                      <Input
                        id="tenant-smtp-user"
                        placeholder="noreply@dominio.it"
                        value={tenantEmailConfig.user}
                        onChange={(e) => setTenantEmailConfig({ ...tenantEmailConfig, user: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="tenant-smtp-pass" className="text-sm">Password</Label>
                      <Input
                        id="tenant-smtp-pass"
                        type="password"
                        placeholder="••••••••"
                        value={tenantEmailConfig.pass}
                        onChange={(e) => setTenantEmailConfig({ ...tenantEmailConfig, pass: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="tenant-smtp-from" className="text-sm">Email Mittente</Label>
                      <Input
                        id="tenant-smtp-from"
                        type="email"
                        placeholder="noreply@dominio.it"
                        value={tenantEmailConfig.from}
                        onChange={(e) => setTenantEmailConfig({ ...tenantEmailConfig, from: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="tenant-smtp-fromName" className="text-sm">Nome Mittente</Label>
                      <Input
                        id="tenant-smtp-fromName"
                        placeholder="Nome Azienda"
                        value={tenantEmailConfig.fromName}
                        onChange={(e) => setTenantEmailConfig({ ...tenantEmailConfig, fromName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="tenant-smtp-secure"
                      checked={tenantEmailConfig.secure}
                      onChange={(e) => setTenantEmailConfig({ ...tenantEmailConfig, secure: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="tenant-smtp-secure" className="cursor-pointer text-sm">
                      Usa SSL/TLS (porta 465)
                    </Label>
                  </div>
                </div>
              )}
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
                      {newTenantData ? 'Non aggiungere licenze' : 'Nessuna licenza'}
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
                    {newTenantData 
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
                            {newTenantData ? 'Estensione: ' : 'Durata totale: '}
                            {formData.licenseQuantity * selectedPackage.durationMonths} mesi
                            {' '}({formData.licenseQuantity} licenze × {selectedPackage.durationMonths} mesi)
                            {newTenantData && newTenantData.expiresAt && (
                              <>
                                <br />
                                Nuova scadenza: {new Date(
                                  new Date(newTenantData.expiresAt).getTime() + 
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
                onClick={() => setShowCreateModal(false)}
                disabled={formLoading}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? 'Salvataggio...' : newTenantData ? 'Salva' : 'Crea Azienda'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Conferma Attiva/Disattiva */}
      <ConfirmDialog
        open={toggleDialog.open}
        onOpenChange={(open) => setToggleDialog({ ...toggleDialog, open })}
        onConfirm={toggleAziendaStatus}
        title={toggleDialog.currentStatus ? 'Disattiva Azienda' : 'Attiva Azienda'}
        description={
          toggleDialog.currentStatus
            ? `Sei sicuro di voler disattivare "${toggleDialog.tenantName}"?\n\nGli utenti di questa azienda non potranno più accedere al sistema fino alla riattivazione.`
            : `Sei sicuro di voler attivare "${toggleDialog.tenantName}"?\n\nGli utenti di questa azienda potranno accedere nuovamente al sistema.`
        }
        confirmText={toggleLoading ? 'Elaborazione...' : (toggleDialog.currentStatus ? 'Disattiva' : 'Attiva')}
        cancelText="Annulla"
        variant={toggleDialog.currentStatus ? 'destructive' : 'success'}
        icon={toggleDialog.currentStatus ? PowerOff : Power}
        isLoading={toggleLoading}
      />

      {/* Dialog Conferma Eliminazione */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        onConfirm={handleDelete}
        title="Elimina Azienda"
        description={`Sei sicuro di voler eliminare "${deleteDialog.tenantName}"?\n\nQuesta azione eliminerà PERMANENTEMENTE:\n• Tutti gli utenti\n• Tutti gli appuntamenti\n• Tutti i clienti\n• Tutti i servizi\n• Tutte le configurazioni\n\nQuesta azione NON può essere annullata!`}
        confirmText={deleteLoading ? 'Eliminazione...' : 'Elimina Definitivamente'}
        cancelText="Annulla"
        variant="destructive"
        icon={AlertTriangle}
        isLoading={deleteLoading}
      />
      <Toaster />
    </div>
  )
}
