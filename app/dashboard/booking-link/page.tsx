'use client'

import { useEffect, useState } from 'react'
import { Link as LinkIcon, Copy, ExternalLink, QrCode, Share2, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function BookingLinkPage() {
  const [bookingLink, setBookingLink] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [shortLink, setShortLink] = useState('')
  
  // Customization
  const [brandColor, setBrandColor] = useState('#2563eb')
  const [logo, setLogo] = useState('')
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [saving, setSaving] = useState(false)
  
  // Analytics
  const [analytics, setAnalytics] = useState({
    totalVisits: 0,
    totalBookings: 0,
    conversionRate: 0,
    newCustomers: 0,
  })

  useEffect(() => {
    // Get booking link
    const host = window.location.host
    const protocol = window.location.protocol
    const link = `${protocol}//${host}/book`
    setBookingLink(link)
    
    // Generate QR Code using QR Server API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}`
    setQrCodeUrl(qrUrl)
    
    // Simulate short link (in production, use a URL shortener service)
    setShortLink(link)
    
    // Load customization and analytics
    loadCustomization()
    loadAnalytics()
  }, [])

  const loadCustomization = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/tenant/customization', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.customization) {
          setBrandColor(data.customization.brandColor || '#2563eb')
          setLogo(data.customization.logo || '')
          setWelcomeMessage(data.customization.welcomeMessage || '')
        }
      }
    } catch (error) {
      console.error('Error loading customization:', error)
    }
  }

  const resetToDefaults = () => {
    setBrandColor('#2563eb')
    setLogo('')
    setWelcomeMessage('')
  }

  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/analytics/booking-link?days=30', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.analytics) {
          setAnalytics(data.analytics)
        }
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    }
  }

  const saveCustomization = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/tenant/customization', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandColor,
          logo: logo || null,
          welcomeMessage: welcomeMessage || null,
        }),
      })
      
      if (response.ok) {
        alert('✅ Personalizzazione salvata con successo!\n\n💡 Suggerimento: Apri il form di prenotazione in una nuova scheda incognito per vedere subito le modifiche (evita problemi di cache).')
        // Reload customization to show updated preview
        loadCustomization()
      } else {
        const error = await response.json()
        alert('❌ Errore nel salvataggio: ' + (error.error || 'Errore sconosciuto'))
      }
    } catch (error) {
      console.error('Error saving customization:', error)
      alert('Errore nel salvataggio')
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bookingLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadQRCode = () => {
    const link = document.createElement('a')
    link.href = qrCodeUrl
    link.download = 'qr-code-prenotazioni.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Prenota un appuntamento',
          text: 'Prenota facilmente il tuo appuntamento online',
          url: bookingLink,
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      copyToClipboard()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Link di Prenotazione</h1>
        <p className="text-gray-600 mt-1">
          Condividi il tuo link di prenotazione con i clienti
        </p>
      </div>

      {/* Main Link Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Il Tuo Link Pubblico
          </CardTitle>
          <CardDescription>
            I clienti possono prenotare direttamente senza registrarsi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Link Completo</Label>
            <div className="flex gap-2">
              <Input
                value={bookingLink}
                readOnly
                className="font-mono text-sm"
              />
              <Button onClick={copyToClipboard} variant="outline" className="gap-2 whitespace-nowrap">
                <Copy className="h-4 w-4" />
                {copied ? 'Copiato!' : 'Copia'}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="default" className="gap-2">
              <a href={bookingLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Apri in Nuova Scheda
              </a>
            </Button>
            <Button onClick={shareLink} variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              Condividi
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* QR Code Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code
            </CardTitle>
            <CardDescription>
              Stampa o condividi il QR code per facilitare le prenotazioni
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              {qrCodeUrl ? (
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code Prenotazioni"
                    className="w-64 h-64"
                  />
                </div>
              ) : (
                <div className="w-64 h-64 bg-gray-100 rounded-lg animate-pulse" />
              )}
            </div>
            <Button onClick={downloadQRCode} variant="outline" className="w-full gap-2">
              <Download className="h-4 w-4" />
              Scarica QR Code
            </Button>
          </CardContent>
        </Card>

        {/* Usage Tips Card */}
        <Card>
          <CardHeader>
            <CardTitle>Come Usare il Link</CardTitle>
            <CardDescription>
              Suggerimenti per massimizzare le prenotazioni
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">1.</span>
                <span>
                  <strong>Sito Web:</strong> Aggiungi il link nella homepage o nella sezione contatti
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">2.</span>
                <span>
                  <strong>Social Media:</strong> Condividi su Facebook, Instagram, WhatsApp
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">3.</span>
                <span>
                  <strong>Email:</strong> Includi il link nella firma email
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">4.</span>
                <span>
                  <strong>QR Code:</strong> Stampa e posiziona in negozio/studio
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">5.</span>
                <span>
                  <strong>Google My Business:</strong> Aggiungi come link di prenotazione
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Embed Code Card */}
      <Card>
        <CardHeader>
          <CardTitle>Codice da Incorporare</CardTitle>
          <CardDescription>
            Copia questo codice per aggiungere un pulsante al tuo sito web
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>HTML Button</Label>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
              <code>{`<a href="${bookingLink}" 
   target="_blank" 
   style="display: inline-block; padding: 12px 24px; 
          background: #2563eb; color: white; 
          text-decoration: none; border-radius: 8px; 
          font-weight: 600;">
  Prenota Ora
</a>`}</code>
            </div>
          </div>

          <div className="space-y-2">
            <Label>iFrame (Incorpora il form completo)</Label>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
              <code>{`<iframe 
  src="${bookingLink}" 
  width="100%" 
  height="800" 
  frameborder="0">
</iframe>`}</code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customization Card */}
      <Card>
        <CardHeader>
          <CardTitle>Personalizzazione Form</CardTitle>
          <CardDescription>
            Personalizza l&apos;aspetto del tuo form di prenotazione
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brandColor">Colore Principale</Label>
              <div className="flex gap-2">
                <Input
                  id="brandColor"
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  placeholder="#2563eb"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">URL Logo (opzionale)</Label>
              <Input
                id="logo"
                type="url"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="welcomeMessage">Messaggio di Benvenuto (opzionale)</Label>
            <Input
              id="welcomeMessage"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Benvenuto! Prenota il tuo appuntamento..."
              maxLength={200}
            />
            <p className="text-xs text-gray-500">
              {welcomeMessage.length}/200 caratteri
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={saveCustomization} disabled={saving}>
              {saving ? 'Salvataggio...' : 'Salva Personalizzazione'}
            </Button>
            <Button variant="outline" onClick={resetToDefaults}>
              Ripristina Default
            </Button>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <p className="text-sm font-medium text-gray-700 mb-2">Anteprima:</p>
            <div 
              className="p-4 rounded-lg text-white text-center"
              style={{ backgroundColor: brandColor }}
            >
              {logo && (
                <img src={logo} alt="Logo" className="h-12 mx-auto mb-2" />
              )}
              <p className="font-semibold">
                {welcomeMessage || 'Prenota un Appuntamento'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiche Link (Ultimi 30 giorni)</CardTitle>
          <CardDescription>
            Monitora le performance del tuo link di prenotazione
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">
                {analytics.totalVisits}
              </div>
              <div className="text-sm text-gray-600 mt-1">Visite Stimate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">
                {analytics.totalBookings}
              </div>
              <div className="text-sm text-gray-600 mt-1">Prenotazioni</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">
                {analytics.conversionRate}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Conversione</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">
                {analytics.newCustomers}
              </div>
              <div className="text-sm text-gray-600 mt-1">Nuovi Clienti</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center mt-4">
            * Le visite sono stimate basandosi sulle prenotazioni effettive
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
