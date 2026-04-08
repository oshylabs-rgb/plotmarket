import type { Metadata } from 'next'
import './globals.css'
import { CookieConsent } from '@/components/CookieConsent'

export const metadata: Metadata = {
  title: 'Plotmarket - Find Your Perfect Property in Nigeria',
  description:
    'Nigeria\'s premier property listing platform. Browse houses, apartments, land, and commercial properties across all 36 states.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=general-sans@300,400,500,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">
        {children}
        <CookieConsent />
      </body>
    </html>
  )
}
