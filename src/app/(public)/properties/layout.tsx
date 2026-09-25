import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Land and property for sale in Nigeria with title documents shown',
  description:
    'Search houses, apartments, land and commercial property across all 36 states and the FCT. Filter by title document: C of O, Governor’s Consent, Deed of Assignment, Excision, Gazette. Every listing names the seller.',
  alternates: { canonical: 'https://plotmarket.ng/properties' },
  openGraph: {
    title: 'Land and property for sale in Nigeria with title documents shown',
    description: 'Filter by title document and see the seller’s name on every listing.',
    url: 'https://plotmarket.ng/properties',
  },
}

export default function PropertiesLayout({ children }: { children: React.ReactNode }) {
  return children
}
