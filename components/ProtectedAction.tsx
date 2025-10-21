import { ReactNode } from 'react'
import { LicenseStatus } from '@/lib/hooks/useLicenseStatus'

interface ProtectedActionProps {
  licenseStatus: LicenseStatus
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Wrapper component that disables actions when license is expired
 * Shows a tooltip or disabled state instead
 */
export function ProtectedAction({ licenseStatus, children, fallback }: ProtectedActionProps) {
  if (licenseStatus.isExpired) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    // Default: show disabled version with tooltip
    return (
      <div 
        className="relative inline-block cursor-not-allowed opacity-50"
        title="Licenza scaduta - Rinnova per usare questa funzione"
      >
        <div className="pointer-events-none">
          {children}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
