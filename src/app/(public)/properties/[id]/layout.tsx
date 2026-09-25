import type { Metadata } from 'next'
import { createPublicClient } from '@/lib/supabase/public'
import { formatNaira } from '@/lib/utils'
import { TITLE_DOCUMENT_LABELS, type Property } from '@/types/database'

const SITE_URL = 'https://plotmarket.ng'

async function getApprovedProperty(id: string): Promise<Property | null> {
  const supabase = createPublicClient()
  if (!supabase) return null
  const { data } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .eq('status', 'approved')
    .maybeSingle()
  return (data as Property | null) ?? null
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const p = await getApprovedProperty(id)
  if (!p) {
    return { title: 'Listing', robots: { index: false, follow: true } }
  }
  const url = `${SITE_URL}/properties/${p.id}`
  const titleDoc = TITLE_DOCUMENT_LABELS[p.title_document] ?? 'Title not stated'
  const where = [p.city, p.state].filter(Boolean).join(', ')
  const title = `${p.title} in ${where}, ${formatNaira(p.price)}`
  const description = `${p.type} for ${p.listing_type} in ${where}. Title document: ${titleDoc}. Seller named on the listing. ${p.description ? p.description.slice(0, 140) : ''}`.trim()
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: p.images?.length ? [{ url: p.images[0] }] : undefined,
    },
  }
}

export default async function PropertyLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const p = await getApprovedProperty(id)
  const jsonLd = p
    ? {
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        name: p.title,
        url: `${SITE_URL}/properties/${p.id}`,
        description: p.description ?? undefined,
        datePosted: p.created_at,
        image: p.images?.length ? p.images : undefined,
        offers: {
          '@type': 'Offer',
          price: p.price,
          priceCurrency: 'NGN',
          availability: 'https://schema.org/InStock',
        },
        address: {
          '@type': 'PostalAddress',
          addressLocality: p.city ?? undefined,
          addressRegion: p.state,
          addressCountry: 'NG',
        },
        additionalProperty: [
          {
            '@type': 'PropertyValue',
            name: 'Title document',
            value: TITLE_DOCUMENT_LABELS[p.title_document] ?? 'Not stated',
          },
        ],
      }
    : null

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      {children}
    </>
  )
}
