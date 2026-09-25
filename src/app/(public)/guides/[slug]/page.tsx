import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { GUIDES, findGuide } from '@/constants/guides'

const SITE_URL = 'https://plotmarket.ng'

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const guide = findGuide(slug)
  if (!guide) return {}
  const url = `${SITE_URL}/guides/${guide.slug}`
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: url },
    openGraph: {
      title: guide.title,
      description: guide.description,
      url,
      type: 'article',
      publishedTime: guide.updated,
      modifiedTime: guide.updated,
    },
  }
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const guide = findGuide(slug)
  if (!guide) notFound()

  const url = `${SITE_URL}/guides/${guide.slug}`
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: guide.title,
      description: guide.description,
      datePublished: guide.updated,
      dateModified: guide.updated,
      mainEntityOfPage: url,
      author: { '@type': 'Organization', name: 'Plotmarket', url: SITE_URL },
      publisher: { '@type': 'Organization', name: 'Oshylabs Ltd', url: SITE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: guide.faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE_URL}/guides` },
        { '@type': 'ListItem', position: 3, name: guide.title, item: url },
      ],
    },
  ]

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link href="/guides" className="inline-flex items-center gap-1 text-sm text-brand-green-600 hover:text-brand-green-700">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All guides
      </Link>
      <h1 className="mt-4 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">{guide.title}</h1>
      <p className="mt-4 text-lg text-gray-600">{guide.description}</p>
      <p className="mt-3 text-sm text-gray-400">
        {guide.readingMinutes} minute read · Updated{' '}
        {new Date(guide.updated).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>

      <div className="mt-10 space-y-10">
        {guide.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-semibold text-gray-900">{section.heading}</h2>
            {section.paragraphs.map((p, i) => (
              <p key={i} className="mt-3 leading-relaxed text-gray-700">{p}</p>
            ))}
            {section.bullets && (
              <ul className="mt-3 list-disc space-y-2 pl-6 text-gray-700">
                {section.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <section className="mt-12 border-t border-brand-cream-300 pt-8">
        <h2 className="text-xl font-semibold text-gray-900">Questions buyers ask</h2>
        <dl className="mt-4 space-y-6">
          {guide.faqs.map((f) => (
            <div key={f.question}>
              <dt className="font-medium text-gray-900">{f.question}</dt>
              <dd className="mt-2 leading-relaxed text-gray-700">{f.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <aside className="mt-12 rounded-xl bg-brand-green-800 p-6 text-white">
        <h2 className="text-lg font-semibold">See the papers on every listing</h2>
        <p className="mt-2 text-sm text-brand-green-100">
          Every Plotmarket listing states the title document and names the seller. Plotmarket does not
          verify titles. Confirm at the state registry before you pay.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/land-for-sale" className="btn bg-white text-brand-green-800 hover:bg-brand-cream-200">
            Land for sale by area
          </Link>
          <Link href="/register" className="btn border border-brand-green-500 text-white hover:bg-brand-green-700">
            List a property free
          </Link>
        </div>
      </aside>
    </article>
  )
}
