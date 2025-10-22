'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Users, Briefcase, UserCircle, LogOut, LayoutDashboard, Link as LinkIcon, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthCheck, setupAuthInterceptor } from '@/lib/useAuth'
import { whitelabel } from '@/lib/whitelabel'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Check auth status
  useAuthCheck()

  useEffect(() => {
    // Setup auth interceptor
    setupAuthInterceptor()
    
    // Check authentication
    const accessToken = localStorage.getItem('accessToken')
    const userData = localStorage.getItem('user')

    if (!accessToken || !userData) {
      router.push('/login')
      return
    }

    const parsedUser = JSON.parse(userData)
    
    // Redirect Super Admin to their dashboard
    if (parsedUser.role === 'SUPER_ADMIN') {
      router.push('/super-admin')
      return
    }
    
    // Redirect Admin to their dashboard
    if (parsedUser.role === 'ADMIN') {
      router.push('/admin')
      return
    }

    setUser(parsedUser)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    )
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Link Prenotazione', href: '/dashboard/booking-link', icon: LinkIcon },
    { name: 'Appuntamenti', href: '/dashboard/appointments', icon: Calendar },
    { name: 'Servizi', href: '/dashboard/services', icon: Briefcase },
    { name: 'Staff', href: '/dashboard/staff', icon: Users },
    { name: 'Clienti', href: '/dashboard/customers', icon: UserCircle },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-50 flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-bold text-gray-900">{whitelabel.appName}</span>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-white border-r z-40 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo - Hidden on mobile */}
          <div className="hidden lg:block p-6 border-b">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">{whitelabel.appName}</span>
            </Link>
          </div>
          {/* Mobile spacing */}
          <div className="lg:hidden h-16"></div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Esci
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:pl-64 pt-16 lg:pt-0">
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
