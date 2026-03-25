'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Building2, Users, MapPin, TrendingUp, ArrowRight, Star, Shield, Clock } from 'lucide-react'
import { PropertyCard } from '@/components/PropertyCard'
import { formatNaira } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Property } from '@/types/database'

const STATS = [
  { label: 'Properties', value: '10,000+', icon: Building2 },
  { label: 'Agents', value: '5,000+', icon: Users },
  { label: 'States', value: '36', icon: MapPin },
  { label: 'Transactions', value: '₦50B+', icon: TrendingUp },
]

const FEATURES = [
  {
    icon: Shield,
    title: 'Verified Listings',
    description: 'Every property is vetted by our team to ensure authenticity and accuracy.',
  },
  {
    icon: Clock,
    title: 'Fast & Easy',
    description: 'List your property in minutes and reach thousands of potential buyers.',
  },
  {
    icon: Star,
    title: 'Premium Exposure',
    description: 'Featured listings get up to 10x more views and inquiries.',
  },
]

export default function HomePage() {
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([])

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
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-green-800 via-brand-green-700 to-brand-green-600">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(240,196,53,0.3),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(240,196,53,0.2),transparent_50%)]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Find Your Perfect{' '}
              <span className="text-brand-gold-400">Property</span> in Nigeria
            </h1>
            <p className="mt-5 text-lg text-brand-green-100 sm:text-xl">
              Browse thousands of verified properties across all 36 states. Whether you&apos;re buying, renting, or investing — your next home starts here.
            </p>

            {/* Search Bar */}
            <div className="mt-8 flex items-center rounded-xl bg-white p-2 shadow-xl sm:mt-10">
              <Search className="ml-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by location, property type, or keyword..."
                className="flex-1 border-0 bg-transparent px-3 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
              <Link
                href="/properties"
                className="btn btn-primary rounded-lg px-6 py-3"
              >
                Search
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-brand-green-200">
              <span>Popular:</span>
              {['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan'].map((city) => (
                <Link
                  key={city}
                  href={`/properties?state=${city}`}
                  className="rounded-full border border-brand-green-500 px-3 py-1 hover:bg-brand-green-600 transition-colors"
                >
                  {city}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative -mt-8 z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 rounded-2xl bg-white p-6 shadow-lg sm:grid-cols-4 sm:p-8">
          {STATS.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="text-center">
                <Icon className="mx-auto h-6 w-6 text-brand-gold-500" />
                <p className="mt-2 text-2xl font-bold text-brand-green-700 sm:text-3xl">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500">{stat.label}</p>
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
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Why Choose Plotmarket</h2>
            <p className="mt-2 text-gray-500">
              The trusted platform for Nigerian real estate
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
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <div className="rounded-xl border border-brand-cream-300 bg-white px-6 py-4 text-center">
            <p className="text-sm font-medium text-gray-500">Starting from</p>
            <p className="mt-1 text-3xl font-bold text-brand-green-700">Free</p>
            <p className="text-sm text-gray-400">5 listings included</p>
          </div>
          <div className="rounded-xl border-2 border-brand-gold-400 bg-white px-6 py-4 text-center shadow-md">
            <p className="text-sm font-medium text-brand-gold-600">Most Popular</p>
            <p className="mt-1 text-3xl font-bold text-brand-green-700">{formatNaira(50000)}</p>
            <p className="text-sm text-gray-400">50 listings/month</p>
          </div>
          <div className="rounded-xl border border-brand-cream-300 bg-white px-6 py-4 text-center">
            <p className="text-sm font-medium text-gray-500">Enterprise</p>
            <p className="mt-1 text-3xl font-bold text-brand-green-700">{formatNaira(250000)}</p>
            <p className="text-sm text-gray-400">Unlimited + white-label</p>
          </div>
        </div>
        <div className="mt-6 text-center">
          <Link href="/pricing" className="btn btn-outline">
            View All Plans
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-brand-green-700 to-brand-green-600 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to List Your Property?
          </h2>
          <p className="mt-4 text-lg text-brand-green-100">
            Join thousands of agents and property owners who trust Plotmarket to reach qualified buyers and tenants.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/register" className="btn bg-brand-gold-400 text-brand-green-900 hover:bg-brand-gold-500 px-8 py-3 text-base font-semibold">
              Get Started Free
            </Link>
            <Link href="/properties" className="btn border border-white text-white hover:bg-brand-green-600 px-8 py-3 text-base">
              Browse Properties
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
