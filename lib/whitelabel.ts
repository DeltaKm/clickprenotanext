/**
 * Whitelabel Configuration
 * Centralizes all branding and company information
 */

export const whitelabel = {
  // App Information
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'BookingSaaS',
  appDescription: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Sistema di prenotazioni online',
  
  // Company Information
  companyName: process.env.NEXT_PUBLIC_COMPANY_NAME || 'La Tua Azienda',
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@example.com',
  
  // URLs
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  baseDomain: process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3000',
  
  // Metadata for SEO
  metadata: {
    title: process.env.NEXT_PUBLIC_APP_NAME || 'BookingSaaS',
    description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Sistema di prenotazioni online per la tua attività',
    keywords: 'prenotazioni, booking, appuntamenti, calendario',
  },
  
  // Footer
  get footer() {
    return {
      copyright: `© ${new Date().getFullYear()} ${this.companyName}. Tutti i diritti riservati.`,
      links: [
        { label: 'Privacy Policy', href: '#' },
        { label: 'Termini di Servizio', href: '##' },
        { label: 'Contatti', href: '###' },
      ],
    }
  },
}

// Helper function to get full page title
export function getPageTitle(pageTitle?: string): string {
  if (pageTitle) {
    return `${pageTitle} | ${whitelabel.appName}`
  }
  return whitelabel.appName
}
