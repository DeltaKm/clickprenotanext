import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useAuthCheck() {
  const router = useRouter()

  useEffect(() => {
    // Check auth status on mount and periodically
    const checkAuth = () => {
      const token = localStorage.getItem('accessToken')
      
      if (!token) {
        // No token, redirect to login
        router.push('/login')
        return
      }

      // Decode JWT to check expiration (simple check without library)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const expiresAt = payload.exp * 1000 // Convert to milliseconds
        const now = Date.now()

        if (now >= expiresAt) {
          // Token expired, logout
          console.log('Token expired, logging out...')
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          router.push('/login')
        }
      } catch (error) {
        // Invalid token format
        console.error('Invalid token:', error)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        router.push('/login')
      }
    }

    // Check immediately
    checkAuth()

    // Check every 5 minutes
    const interval = setInterval(checkAuth, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [router])
}

// Intercept fetch to handle 401 errors globally
export function setupAuthInterceptor() {
  const originalFetch = window.fetch

  window.fetch = async (...args) => {
    const response = await originalFetch(...args)

    // If 401 Unauthorized, logout
    if (response.status === 401) {
      const url = args[0]
      
      // Don't logout on login/register endpoints
      if (typeof url === 'string' && !url.includes('/api/auth/login') && !url.includes('/api/auth/register')) {
        console.log('401 Unauthorized, logging out...')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }

    return response
  }
}
