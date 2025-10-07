'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { whitelabel } from '@/lib/whitelabel'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    tenantSlug: '',
    tenantName: '',
    email: '',
    password: '',
    name: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Store tokens
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Si è verificato un errore')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Calendar className="h-10 w-10 text-blue-600" />
            <span className="text-3xl font-bold text-gray-900">{whitelabel.appName}</span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Crea il tuo account</CardTitle>
            <CardDescription>
              Inizia a gestire le tue prenotazioni in pochi minuti
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="tenantSlug">Slug Business (URL)</Label>
                <Input
                  id="tenantSlug"
                  name="tenantSlug"
                  type="text"
                  placeholder="mio-salone"
                  value={formData.tenantSlug}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  pattern="[a-z0-9][a-z0-9-]{1,28}[a-z0-9]"
                  title="Solo lettere minuscole, numeri e trattini"
                />
                <p className="text-xs text-gray-500">
                  Il tuo sito sarà: {formData.tenantSlug || 'slug'}.localhost:3000
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenantName">Nome Business</Label>
                <Input
                  id="tenantName"
                  name="tenantName"
                  type="text"
                  placeholder="Salone Bellezza"
                  value={formData.tenantName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Il tuo nome</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Mario Rossi"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="nome@esempio.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  minLength={8}
                />
                <p className="text-xs text-gray-500">Minimo 8 caratteri</p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Registrazione in corso...' : 'Crea Account'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">Hai già un account? </span>
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Accedi
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
