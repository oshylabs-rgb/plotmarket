import type { Metadata, Viewport } from 'next'
import { Source_Serif_4, Public_Sans } from 'next/font/google'
import './globals.css'
import { CookieConsent } from '@/components/CookieConsent'

/**
 * Self-hosted through next/font rather than a third-party stylesheet: one less
 * blocking round trip, which matters on Nigerian mobile connections.
 * Serif display over grotesque body is the "Registry" direction.
 */
const display = Source_Serif_4({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
  display: 'swap',
})

const body = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://plotmarket.ng'),
  title: {
    default: 'Plotmarket, Nigerian property and land listings',
    template: '%s | Plotmarket',
  },
  description:
    'Browse houses, apartments, land and commercial property across Nigeria. Every listing states its title document and the person selling it.',
  openGraph: {
    title: 'Plotmarket, Nigerian property and land listings',
    description:
      'Every listing states its title document and the person selling it. Inspect in 360 degrees before you travel.',
    url: 'https://plotmarket.ng',
    siteName: 'Plotmarket',
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Plotmarket, Nigerian property and land listings',
    description:
      'Every listing states its title document and the person selling it. Inspect in 360 degrees before you travel.',
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
  email: 'arnold.oshenye@oshylabs.eu',
  areaServed: 'NG',
  description:
    'Nigerian land and property marketplace where every listing states its title document and names the seller.',
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
      </body>
    </html>
  )
}
