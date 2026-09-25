import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'
import { GUIDES } from '@/constants/guides'

export const metadata: Metadata = {
  title: 'Buyer guides: title documents, verification and buying from abroad',
  description:
    'Plain guides to Nigerian land title documents, how to verify a title at the registry, and how to buy land in Nigeria from abroad without being defrauded.',
  alternates: { canonical: 'https://plotmarket.ng/guides' },
  openGraph: {
    title: 'Plotmarket buyer guides',
    description:
      'Nigerian land title documents explained, how to verify a title, and how to buy from abroad.',
    url: 'https://plotmarket.ng/guides',
  },
}

export default function GuidesIndexPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <p className="text-sm font-medium uppercase tracking-wide text-brand-green-600">Guides</p>
      <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
        Know the paper before you pay
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-gray-600">
        Plotmarket shows the title document on every listing. These guides explain what each
        document proves, how to confirm it at the registry, and how to buy safely from abroad.
      </p>

      <ul className="mt-10 space-y-4">
        {GUIDES.map((guide) => (
          <li key={guide.slug}>
            <Link
              href={`/guides/${guide.slug}`}
              className="group flex gap-4 rounded-xl border border-brand-cream-300 bg-white p-5 transition-colors hover:border-brand-green-400"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-green-50">
                <BookOpen className="h-5 w-5 text-brand-green-600" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-gray-900 group-hover:text-brand-green-700">
                  {guide.title}
                </h2>
                <p className="mt-1 text-sm text-gray-600">{guide.description}</p>
                <p className="mt-2 text-xs text-gray-400">
                  {guide.readingMinutes} minute read · Updated {formatDate(guide.updated)}
                </p>
              </div>
              <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-gray-300 group-hover:text-brand-green-600" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-12 rounded-xl bg-brand-cream-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900">Looking for land with the papers shown?</h2>
        <p className="mt-2 text-sm text-gray-600">
          Browse listings by state and filter on the title document the seller holds.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/land-for-sale" className="btn btn-primary">Land for sale by area</Link>
          <Link href="/properties" className="btn btn-outline">All listings</Link>
        </div>
      </div>
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
}
