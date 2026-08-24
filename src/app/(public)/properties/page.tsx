'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X, Loader2, Rotate3d } from 'lucide-react'
import { PropertyCard } from '@/components/PropertyCard'
import { NIGERIAN_STATES } from '@/constants/states'
import { PropertyType, ListingType, TITLE_DOCUMENT_LABELS, type TitleDocumentType } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import type { Property } from '@/types/database'

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'development', label: 'Development' },
]

const LISTING_TYPES: { value: ListingType; label: string }[] = [
  { value: 'sale', label: 'For Sale' },
  { value: 'rent', label: 'For Rent' },
  { value: 'lease', label: 'For Lease' },
]

const TITLE_DOCUMENTS = Object.keys(TITLE_DOCUMENT_LABELS).filter(
  (d) => d !== 'unknown'
) as TitleDocumentType[]

function PropertiesBrowser() {
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [type, setType] = useState<string>(searchParams.get('type') ?? '')
  const [listingType, setListingType] = useState<string>('')
  const [state, setState] = useState<string>(searchParams.get('state') ?? '')
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [bedrooms, setBedrooms] = useState<string>('')
  const [titleDocument, setTitleDocument] = useState<string>('')
  const [only360, setOnly360] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProperties = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'approved')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })

      setProperties(data || [])
      setLoading(false)
    }

    fetchProperties()
  }, [])

  const filteredProperties = properties.filter((p) => {
    if (search) {
      const needle = search.toLowerCase()
      const haystack = [p.title, p.location, p.city, p.state, p.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      // Every word in the query must appear somewhere, so "3 bedroom lekki" works.
      if (!needle.split(/\s+/).every((word) => haystack.includes(word))) return false
    }
    if (type && p.type !== type) return false
    if (listingType && p.listing_type !== listingType) return false
    if (state && p.state !== state) return false
    if (minPrice && p.price < Number(minPrice)) return false
    if (maxPrice && p.price > Number(maxPrice)) return false
    // Bedrooms is presented as "N+", so match on at-least.
    if (bedrooms && (p.bedrooms ?? 0) < Number(bedrooms)) return false
    if (titleDocument && p.title_document !== titleDocument) return false
    if (only360 && (p.images_360?.length ?? 0) === 0 && (p.videos_360?.length ?? 0) === 0)
      return false
    return true
  })

  const clearFilters = () => {
    setSearch('')
    setType('')
    setListingType('')
    setState('')
    setMinPrice('')
    setMaxPrice('')
    setBedrooms('')
    setTitleDocument('')
    setOnly360(false)
  }

  const hasFilters =
    type || listingType || state || minPrice || maxPrice || bedrooms || titleDocument || only360

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-green-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Browse properties</h1>
        <p className="mt-2 text-gray-500">
          Filter by title document to see only listings with the paperwork you will accept.
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Try “3 bedroom Lekki” or “land Abuja”"
            aria-label="Search properties"
            className="input-field pl-10"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn ${showFilters ? 'btn-primary' : 'btn-outline'} flex items-center gap-2`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 rounded-xl border border-brand-cream-300 bg-white p-4 shadow-sm sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="input-field">
                <option value="">All Types</option>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Listing</label>
              <select value={listingType} onChange={(e) => setListingType(e.target.value)} className="input-field">
                <option value="">All Listings</option>
                {LISTING_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">State</label>
              <select value={state} onChange={(e) => setState(e.target.value)} className="input-field">
                <option value="">All States</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Min Price (₦)</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Max Price (₦)</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="No limit"
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Bedrooms</label>
              <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="input-field">
                <option value="">Any</option>
                {[1, 2, 3, 4, 5, 6].map((b) => (
                  <option key={b} value={b}>{b}+</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Title document</label>
              <select
                value={titleDocument}
                onChange={(e) => setTitleDocument(e.target.value)}
                className="input-field"
              >
                <option value="">Any title</option>
                {TITLE_DOCUMENTS.map((doc) => (
                  <option key={doc} value={doc}>
                    {TITLE_DOCUMENT_LABELS[doc]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-brand-cream-400 bg-white px-3 py-2.5 text-sm text-gray-700 hover:border-brand-green-300">
                <input
                  type="checkbox"
                  checked={only360}
                  onChange={(e) => setOnly360(e.target.checked)}
                  className="h-4 w-4 accent-brand-green-600"
                />
                <Rotate3d className="h-4 w-4 text-brand-green-600" />
                Has 360° tour
              </label>
            </div>
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4" /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      <p className="mb-4 text-sm text-gray-500">
        {filteredProperties.length} propert{filteredProperties.length === 1 ? 'y' : 'ies'} found
      </p>

      {/* Property Grid */}
      {filteredProperties.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-brand-cream-300 bg-white py-16 text-center">
          <Search className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No properties found</h3>
          <p className="mt-2 text-sm text-gray-500">
            {properties.length === 0
              ? 'No properties have been listed yet. Be the first!'
              : 'Try adjusting your search or filters to find what you\'re looking for.'}
          </p>
          {hasFilters && (
            <button onClick={clearFilters} className="btn btn-outline mt-4">
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * useSearchParams requires a Suspense boundary, otherwise the App Router
 * prerender step fails the build.
 */
export default function PropertiesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-green-600" />
          </div>
        </div>
      }
    >
      <PropertiesBrowser />
    </Suspense>
  )
}
