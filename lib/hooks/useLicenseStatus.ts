import { useEffect, useState } from 'react'

export interface LicenseStatus {
  isExpired: boolean
  expiresAt: Date | null
  daysRemaining: number | null
  isDemo: boolean
}

export function useLicenseStatus() {
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus>({
    isExpired: false,
    expiresAt: null,
    daysRemaining: null,
    isDemo: false,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLicenseStatus()
  }, [])

  const fetchLicenseStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/tenant/license-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setLicenseStatus(data)
      }
    } catch (error) {
      console.error('Error fetching license status:', error)
    } finally {
      setLoading(false)
    }
  }

  return { licenseStatus, loading, refetch: fetchLicenseStatus }
}
