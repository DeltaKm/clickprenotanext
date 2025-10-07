import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { whitelabel } from '@/lib/whitelabel'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: `${whitelabel.appName} - ${whitelabel.appDescription}`,
    template: `%s | ${whitelabel.appName}`,
  },
  description: whitelabel.metadata.description,
  keywords: whitelabel.metadata.keywords,
  authors: [{ name: whitelabel.companyName }],
  creator: whitelabel.companyName,
  publisher: whitelabel.companyName,
  applicationName: whitelabel.appName,
  openGraph: {
    title: whitelabel.appName,
    description: whitelabel.appDescription,
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="it">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
