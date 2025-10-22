'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Mail, Building2, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'business' | 'email'>('business')
  
  const [businessData, setBusinessData] = useState({
    name: '',
    slug: '',
    businessEmail: '',
    businessPhone: '',
    brandColor: '#2563eb',
    logo: '',
    welcomeMessage: '',
  })

  const [emailTemplates, setEmailTemplates] = useState({
    bookingRequest: {
      subject: '',
      message: '',
    },
    bookingConfirmation: {
      subject: '',
      message: '',
      instructions: '',
    },
    bookingRejection: {
      subject: '',
      message: '',
    },
    ownerNotification: {
      subject: '',
      message: '',
    },
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/tenant/settings', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setBusinessData({
          name: data.name || '',
          slug: data.slug || '',
          businessEmail: data.businessEmail || '',
          businessPhone: data.businessPhone || '',
          brandColor: data.brandColor || '#2563eb',
          logo: data.logo || '',
          welcomeMessage: data.welcomeMessage || '',
        })

        if (data.emailTemplates) {
          setEmailTemplates(data.emailTemplates)
        }
      }
    } catch (error) {
      console.error('Load settings error:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveBusinessSettings = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/tenant/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(businessData),
      })

      if (response.ok) {
        alert('✅ Impostazioni salvate con successo!')
      } else {
        const error = await response.json()
        alert(`Errore: ${error.error}`)
      }
    } catch (error) {
      console.error('Save settings error:', error)
      alert('Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  const saveEmailTemplates = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/tenant/email-templates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(emailTemplates),
      })

      if (response.ok) {
        alert('✅ Template email salvati con successo!')
      } else {
        const error = await response.json()
        alert(`Errore: ${error.error}`)
      }
    } catch (error) {
      console.error('Save email templates error:', error)
      alert('Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="h-8 w-8" />
          Impostazioni Azienda
        </h1>
        <p className="text-gray-600 mt-2">
          Gestisci le impostazioni del tuo business e personalizza le email
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('business')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'business'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Building2 className="h-4 w-4 inline mr-2" />
          Informazioni Business
        </button>
        <button
          onClick={() => setActiveTab('email')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'email'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Mail className="h-4 w-4 inline mr-2" />
          Template Email
        </button>
      </div>

      {/* Business Settings Tab */}
      {activeTab === 'business' && (
        <Card>
          <CardHeader>
            <CardTitle>Informazioni Business</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome Business *</Label>
                  <Input
                    id="name"
                    value={businessData.name}
                    onChange={(e) => setBusinessData({ ...businessData, name: e.target.value })}
                    placeholder="Il Mio Business"
                  />
                </div>

                <div>
                  <Label htmlFor="slug">Slug (URL) *</Label>
                  <Input
                    id="slug"
                    value={businessData.slug}
                    onChange={(e) => setBusinessData({ ...businessData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    placeholder="il-mio-business"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL: /book/{businessData.slug || 'il-mio-business'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="businessEmail">Email Contatto</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={businessData.businessEmail}
                    onChange={(e) => setBusinessData({ ...businessData, businessEmail: e.target.value })}
                    placeholder="info@business.it"
                  />
                </div>

                <div>
                  <Label htmlFor="businessPhone">Telefono</Label>
                  <Input
                    id="businessPhone"
                    value={businessData.businessPhone}
                    onChange={(e) => setBusinessData({ ...businessData, businessPhone: e.target.value })}
                    placeholder="+39 123 456 7890"
                  />
                </div>

                <div>
                  <Label htmlFor="brandColor">Colore Brand</Label>
                  <div className="flex gap-2">
                    <Input
                      id="brandColor"
                      type="color"
                      value={businessData.brandColor}
                      onChange={(e) => setBusinessData({ ...businessData, brandColor: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={businessData.brandColor}
                      onChange={(e) => setBusinessData({ ...businessData, brandColor: e.target.value })}
                      placeholder="#2563eb"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="logo">URL Logo</Label>
                  <Input
                    id="logo"
                    value={businessData.logo}
                    onChange={(e) => setBusinessData({ ...businessData, logo: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="welcomeMessage">Messaggio di Benvenuto</Label>
                <Textarea
                  id="welcomeMessage"
                  value={businessData.welcomeMessage}
                  onChange={(e) => setBusinessData({ ...businessData, welcomeMessage: e.target.value })}
                  placeholder="Benvenuto nel nostro sistema di prenotazione..."
                  rows={3}
                />
              </div>

              <Button
                onClick={saveBusinessSettings}
                disabled={saving}
                className="w-full md:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvataggio...' : 'Salva Impostazioni'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Templates Tab */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Richiesta Prenotazione (Cliente)</CardTitle>
              <p className="text-sm text-gray-600">
                Email inviata al cliente quando effettua una richiesta di prenotazione
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="req-subject">Oggetto</Label>
                <Input
                  id="req-subject"
                  value={emailTemplates.bookingRequest.subject}
                  onChange={(e) => setEmailTemplates({
                    ...emailTemplates,
                    bookingRequest: { ...emailTemplates.bookingRequest, subject: e.target.value }
                  })}
                  placeholder="Richiesta di prenotazione ricevuta"
                />
              </div>
              <div>
                <Label htmlFor="req-message">Messaggio</Label>
                <Textarea
                  id="req-message"
                  value={emailTemplates.bookingRequest.message}
                  onChange={(e) => setEmailTemplates({
                    ...emailTemplates,
                    bookingRequest: { ...emailTemplates.bookingRequest, message: e.target.value }
                  })}
                  placeholder="Grazie per la tua richiesta..."
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Variabili disponibili: {'{'}{'{'} businessName{'}'}{'}'}, {'{'}{'{'}customerName{'}'}{'}'}, {'{'}{'{'}serviceName{'}'}{'}'}, {'{'}{'{'}bookingDate{'}'}{'}'}, {'{'}{'{'}bookingTime{'}'}{'}'}, {'{'}{'{'}totalPrice{'}'}{'}'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Conferma Prenotazione (Cliente)</CardTitle>
              <p className="text-sm text-gray-600">
                Email inviata al cliente quando la prenotazione viene confermata
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="conf-subject">Oggetto</Label>
                <Input
                  id="conf-subject"
                  value={emailTemplates.bookingConfirmation.subject}
                  onChange={(e) => setEmailTemplates({
                    ...emailTemplates,
                    bookingConfirmation: { ...emailTemplates.bookingConfirmation, subject: e.target.value }
                  })}
                  placeholder="Prenotazione confermata! ✅"
                />
              </div>
              <div>
                <Label htmlFor="conf-message">Messaggio</Label>
                <Textarea
                  id="conf-message"
                  value={emailTemplates.bookingConfirmation.message}
                  onChange={(e) => setEmailTemplates({
                    ...emailTemplates,
                    bookingConfirmation: { ...emailTemplates.bookingConfirmation, message: e.target.value }
                  })}
                  placeholder="La tua prenotazione è stata confermata..."
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="conf-instructions">Istruzioni Aggiuntive</Label>
                <Textarea
                  id="conf-instructions"
                  value={emailTemplates.bookingConfirmation.instructions}
                  onChange={(e) => setEmailTemplates({
                    ...emailTemplates,
                    bookingConfirmation: { ...emailTemplates.bookingConfirmation, instructions: e.target.value }
                  })}
                  placeholder="Come arrivare, cosa portare, ecc..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Rifiuto Prenotazione (Cliente)</CardTitle>
              <p className="text-sm text-gray-600">
                Email inviata al cliente quando la prenotazione viene rifiutata
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="rej-subject">Oggetto</Label>
                <Input
                  id="rej-subject"
                  value={emailTemplates.bookingRejection.subject}
                  onChange={(e) => setEmailTemplates({
                    ...emailTemplates,
                    bookingRejection: { ...emailTemplates.bookingRejection, subject: e.target.value }
                  })}
                  placeholder="Prenotazione non disponibile"
                />
              </div>
              <div>
                <Label htmlFor="rej-message">Messaggio</Label>
                <Textarea
                  id="rej-message"
                  value={emailTemplates.bookingRejection.message}
                  onChange={(e) => setEmailTemplates({
                    ...emailTemplates,
                    bookingRejection: { ...emailTemplates.bookingRejection, message: e.target.value }
                  })}
                  placeholder="Ci dispiace, ma la prenotazione non è disponibile..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Notifica Owner</CardTitle>
              <p className="text-sm text-gray-600">
                Email inviata a te quando ricevi una nuova prenotazione
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="owner-subject">Oggetto</Label>
                <Input
                  id="owner-subject"
                  value={emailTemplates.ownerNotification.subject}
                  onChange={(e) => setEmailTemplates({
                    ...emailTemplates,
                    ownerNotification: { ...emailTemplates.ownerNotification, subject: e.target.value }
                  })}
                  placeholder="Nuova prenotazione ricevuta"
                />
              </div>
              <div>
                <Label htmlFor="owner-message">Messaggio</Label>
                <Textarea
                  id="owner-message"
                  value={emailTemplates.ownerNotification.message}
                  onChange={(e) => setEmailTemplates({
                    ...emailTemplates,
                    ownerNotification: { ...emailTemplates.ownerNotification, message: e.target.value }
                  })}
                  placeholder="Hai ricevuto una nuova richiesta di prenotazione..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={saveEmailTemplates}
            disabled={saving}
            className="w-full md:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvataggio...' : 'Salva Template Email'}
          </Button>
        </div>
      )}
    </div>
  )
}
