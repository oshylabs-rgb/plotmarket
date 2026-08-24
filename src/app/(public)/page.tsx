'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Building2, MapPin, ArrowRight, ScrollText, ShieldCheck, Lock, Rotate3d, PhoneCall } from 'lucide-react'
import { PropertyCard } from '@/components/PropertyCard'
import { formatNaira } from '@/lib/utils'
import { PRICING_PLANS } from '@/constants/pricing'
import { createClient } from '@/lib/supabase/client'
import type { Property } from '@/types/database'

const TRUST_BAR = [
  { label: 'Every listing reviewed before it goes live', icon: ShieldCheck },
  { label: 'Title documents named on every listing', icon: ScrollText },
  { label: 'Payments secured by Paystack', icon: Lock },
  { label: 'All 36 states and the FCT', icon: MapPin },
]

const FEATURES = [
  {
    icon: ScrollText,
    title: 'See the paperwork first',
    description:
      'Sellers state the title on offer, C of O, Governor’s Consent, Deed of Assignment or Excision, before you ever pick up the phone.',
  },
  {
    icon: Rotate3d,
    title: 'Walk the property from your phone',
    description:
      'Sellers can upload 360° photos and video tours. Inspect the land, the fence line and the finishing before you spend a naira on transport.',
  },
  {
    icon: PhoneCall,
    title: 'Talk to the owner directly',
    description:
      'Every listing carries the lister’s name, type and phone number. No middlemen inserted between you and the person selling.',
  },
]

export default function HomePage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    router.push(trimmed ? `/properties?q=${encodeURIComponent(trimmed)}` : '/properties')
  }

  useEffect(() => {
    const fetchFeatured = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'approved')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(8)

      setFeaturedProperties(data || [])
    }

    fetchFeatured()
  }, [])

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-brand-green-900 bg-brand-green-800">
        {/*
          Signature texture: a faint survey grid, the ruling on a registry
          plan sheet. Flat colour and one hairline grid, no colour gradient.
        */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Land and property in Nigeria,{' '}
              <span className="text-brand-gold-400">with the papers shown</span>
            </h1>
            <p className="mt-5 text-lg text-brand-green-100 sm:text-xl">
              Every listing names its title document and the person selling it. Inspect in 360° before you travel.
            </p>

            {/* Search Bar */}
            <form
              onSubmit={handleSearch}
              className="mt-8 flex items-center rounded-xl bg-white p-2 shadow-xl sm:mt-10"
            >
              <Search className="ml-3 h-5 w-5 shrink-0 text-gray-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try “3 bedroom Lekki” or “land Abuja”"
                aria-label="Search properties"
                className="min-w-0 flex-1 border-0 bg-transparent px-3 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
              <button type="submit" className="btn btn-primary shrink-0 rounded-lg px-6 py-3">
                Search
              </button>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-brand-green-200">
              <span>Popular:</span>
              {/* The value must match NIGERIAN_STATES exactly, the filter on
                  /properties compares it against the stored state verbatim. */}
              {[
                { label: 'Lagos', value: 'Lagos' },
                { label: 'Abuja', value: 'FCT Abuja' },
                { label: 'Rivers', value: 'Rivers' },
                { label: 'Oyo', value: 'Oyo' },
              ].map(({ label, value }) => (
                <Link
                  key={value}
                  href={`/properties?state=${encodeURIComponent(value)}`}
                  className="rounded-full border border-brand-green-500 px-3 py-1 hover:bg-brand-green-600 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="relative -mt-8 z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 rounded-2xl bg-white p-6 shadow-lg sm:grid-cols-2 sm:p-8 lg:grid-cols-4">
          {TRUST_BAR.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="flex items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-green-600" />
                <p className="text-sm font-medium leading-snug text-gray-700">{item.label}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Featured Properties */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Featured Properties</h2>
            <p className="mt-2 text-gray-500">Hand-picked properties for you</p>
          </div>
          <Link
            href="/properties"
            className="hidden items-center gap-1 text-sm font-medium text-brand-green-600 hover:text-brand-green-700 sm:flex"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {featuredProperties.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featuredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-brand-cream-300 bg-white py-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No properties yet</h3>
            <p className="mt-2 text-sm text-gray-500">Be the first to list a property on Plotmarket</p>
            <Link href="/register" className="btn btn-primary mt-4">
              Get Started
            </Link>
          </div>
        )}
        <div className="mt-6 text-center sm:hidden">
          <Link href="/properties" className="btn btn-outline">
            View All Properties
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-brand-cream-100 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Built for how property actually changes hands here
            </h2>
            <p className="mt-2 text-gray-500">
              Most losses happen before anyone sees a document. We put the paperwork up front.
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="rounded-xl bg-white p-6 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-green-50">
                    <Icon className="h-6 w-6 text-brand-green-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Simple, Transparent Pricing</h2>
          <p className="mt-2 text-gray-500">Start listing for free. Upgrade as you grow.</p>
        </div>
        <div className="mt-8 flex flex-wrap items-stretch justify-center gap-4">
          {PRICING_PLANS.filter((plan) =>
            ['free', 'professional', 'enterprise'].includes(plan.planId)
          ).map((plan) => (
            <div
              key={plan.planId}
              className={`rounded-xl bg-white px-6 py-4 text-center ${
                plan.highlighted
                  ? 'border-2 border-brand-gold-400 shadow-md'
                  : 'border border-brand-cream-300'
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  plan.highlighted ? 'text-brand-gold-600' : 'text-gray-500'
                }`}
              >
                {plan.highlighted ? 'Most Popular' : plan.name}
              </p>
              <p className="mt-1 text-3xl font-bold text-brand-green-700">
                {plan.price === 0 ? (plan.planId === 'free' ? 'Free' : 'Custom') : formatNaira(plan.price)}
              </p>
              <p className="text-sm text-gray-400">
                {plan.listings === -1 ? 'Unlimited listings' : `${plan.listings} listings`}
                {plan.period === '/month' ? '/month' : ''}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link href="/pricing" className="btn btn-outline">
            View All Plans
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink-900 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Selling land or property?
          </h2>
          <p className="mt-4 text-lg text-ink-200">
            List free, name your title document, add 360° photos and a video walkthrough. Serious buyers reach you directly.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              href="/register"
              className="btn bg-white px-8 py-3 text-base font-semibold text-ink-900 hover:bg-brand-cream-200"
            >
              List a property free
            </Link>
            <Link
              href="/properties"
              className="btn border border-ink-600 px-8 py-3 text-base text-white hover:bg-ink-800"
            >
              Browse properties
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
