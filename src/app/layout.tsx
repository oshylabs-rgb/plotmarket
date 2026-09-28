import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { CookieConsent } from '@/components/CookieConsent'
import { VisitBeacon } from '@/components/VisitBeacon'
import { CONTACT_EMAIL, CONTACT_PHONE_E164 } from '@/constants/contact'

/**
 * Self-hosted through next/font rather than a third-party stylesheet: one less
 * blocking round trip, which matters on Nigerian mobile connections.
 * Serif display over grotesque body is the "Registry" direction.
 *
 * The font files live in the repo (./fonts, latin subset from Fontsource, SIL
 * OFL) instead of next/font/google, which downloads them from Google at build
 * time; that download failing broke production builds.
 */
const display = localFont({
  src: [
    { path: './fonts/source-serif-4-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: './fonts/source-serif-4-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-display',
  display: 'swap',
  fallback: ['Georgia', 'serif'],
})

const body = localFont({
  src: [
    { path: './fonts/public-sans-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/public-sans-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './fonts/public-sans-latin-600-normal.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-body',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://plotmarket.ng'),
  title: {
    default: 'Plotmarket, Nigerian property and land listings',
    template: '%s | Plotmarket',
  },
  description:
    'Browse houses, apartments, land and commercial property across Nigeria. Listings show the title document the seller states, and who is selling.',
  openGraph: {
    title: 'Plotmarket, Nigerian property and land listings',
    description:
      'Listings show the title document the seller states, and who is selling. Inspect in 360 degrees where the seller has added it.',
    url: 'https://plotmarket.ng',
    siteName: 'Plotmarket',
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Plotmarket, Nigerian property and land listings',
    description:
      'Listings show the title document the seller states, and who is selling. Inspect in 360 degrees where the seller has added it.',
  },
  alternates: { canonical: 'https://plotmarket.ng' },
  robots: { index: true, follow: true },
}

const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Plotmarket',
  legalName: 'Oshylabs Ltd',
  url: 'https://plotmarket.ng',
  logo: 'https://plotmarket.ng/opengraph-image',
  email: CONTACT_EMAIL,
  telephone: CONTACT_PHONE_E164,
  areaServed: 'NG',
  description:
    'Nigerian land and property marketplace where listings show the seller stated title document and name the seller.',
}

const WEBSITE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Plotmarket',
  url: 'https://plotmarket.ng',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://plotmarket.ng/properties?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#12352a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-NG" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([ORGANIZATION_JSON_LD, WEBSITE_JSON_LD]) }}
        />
        {children}
        <CookieConsent />
        <VisitBeacon />
      </body>
    </html>
  )
}
