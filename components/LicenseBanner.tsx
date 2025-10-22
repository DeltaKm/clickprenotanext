import { AlertTriangle, Clock, CheckCircle } from 'lucide-react'
import { LicenseStatus } from '@/lib/hooks/useLicenseStatus'

interface LicenseBannerProps {
  licenseStatus: LicenseStatus
}

export function LicenseBanner({ licenseStatus }: LicenseBannerProps) {
  const { isExpired, expiresAt, daysRemaining, isDemo } = licenseStatus

  // Demo account - no expiration
  if (isDemo) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">Account Demo</h3>
            <p className="text-sm text-blue-700 mt-1">
              Questo è un account demo senza scadenza. Perfetto per testare tutte le funzionalità!
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Expired license or no license
  if (isExpired) {
    const hasNeverHadLicense = !expiresAt
    
    return (
      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 text-lg">
              {hasNeverHadLicense ? 'Nessuna Licenza Attiva' : 'Licenza Scaduta'}
            </h3>
            <p className="text-sm text-red-700 mt-1">
              {hasNeverHadLicense ? (
                <>
                  Questo account non ha una licenza attiva. Per utilizzare tutte le funzionalità,
                  è necessario acquistare una licenza.
                </>
              ) : (
                <>
                  La tua licenza è scaduta il{' '}
                  <strong>{new Date(expiresAt).toLocaleDateString('it-IT')}</strong>.
                </>
              )}
            </p>
            <p className="text-sm text-red-700 mt-2">
              Puoi visualizzare i tuoi dati ma non puoi creare nuovi appuntamenti o clienti.
              Contatta l&apos;amministratore per {hasNeverHadLicense ? 'acquistare' : 'rinnovare'} la licenza.
            </p>
            <div className="mt-3">
              <a
                href="mailto:admin@clickprenota.com?subject=Richiesta Licenza"
                className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Contatta l&apos;Amministratore
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // License expiring soon (less than 30 days)
  if (daysRemaining !== null && daysRemaining <= 30) {
    return (
      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900">Licenza in Scadenza</h3>
            <p className="text-sm text-yellow-700 mt-1">
              La tua licenza scadrà tra <strong>{daysRemaining} giorni</strong> il{' '}
              <strong>{expiresAt ? new Date(expiresAt).toLocaleDateString('it-IT') : 'N/A'}</strong>.
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              Contatta l&apos;amministratore per rinnovare la licenza prima della scadenza.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Active license with more than 30 days - no banner needed
  // The dashboard shows a dedicated widget for active licenses
  return null
}
