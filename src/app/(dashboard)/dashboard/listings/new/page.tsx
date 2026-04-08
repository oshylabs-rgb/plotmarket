'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, AlertCircle, CheckCircle, Loader2, ArrowUpCircle } from 'lucide-react'
import Link from 'next/link'
import { NIGERIAN_STATES } from '@/constants/states'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { getListingLimit } from '@/constants/pricing'
import { MediaUpload } from '@/components/MediaUpload'

const PROPERTY_TYPES = ['house', 'apartment', 'land', 'commercial', 'development']
const LISTING_TYPES = ['sale', 'rent', 'lease']

export default function NewListingPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [uploadPropertyId] = useState(() => crypto.randomUUID())
  const [mediaImages, setMediaImages] = useState<string[]>([])
  const [mediaVideos, setMediaVideos] = useState<string[]>([])
  const [limitCheck, setLimitCheck] = useState<{
    checking: boolean
    atLimit: boolean
    current: number
    max: number
  }>({ checking: true, atLimit: false, current: 0, max: 3 })

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'house',
    listing_type: 'sale',
    price: '',
    location: '',
    state: '',
    city: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    features: '',
  })

  // Check listing limits
  useEffect(() => {
    if (!user || !profile) return

    const checkListingLimit = async () => {
      const supabase = createClient()

      // Get user's current property count
      const { count } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // Determine plan — map 'basic' account_type to 'free' planId
      const planId = profile.account_type === 'basic' ? 'free' : profile.account_type
      const maxListings = getListingLimit(planId)

      const currentCount = count ?? 0
      // -1 means unlimited
      const atLimit = maxListings !== -1 && currentCount >= maxListings

      setLimitCheck({
        checking: false,
        atLimit,
        current: currentCount,
        max: maxListings,
      })
    }

    checkListingLimit()
  }, [user, profile])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('You must be logged in to create a listing')
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()

    const featuresArray = form.features
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean)

    const { error: insertError } = await supabase.from('properties').insert({
      user_id: user.id,
      title: form.title,
      description: form.description,
      type: form.type,
      listing_type: form.listing_type,
      price: parseInt(form.price),
      location: form.location || null,
      state: form.state,
      city: form.city || null,
      bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
      bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
      area: form.area ? parseInt(form.area) : null,
      images: mediaImages,
      videos: mediaVideos,
      features: featuresArray,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard/listings')
      }, 1500)
    }
  }

  if (authLoading || limitCheck.checking) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green-600" />
      </div>
    )
  }

  // Show upgrade prompt if at listing limit
  if (limitCheck.atLimit) {
    return (
      <div>
        <Link
          href="/dashboard/listings"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-brand-green-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to listings
        </Link>

        <div className="mx-auto max-w-lg text-center">
          <div className="rounded-xl border-2 border-brand-gold-400 bg-brand-cream-50 p-8">
            <ArrowUpCircle className="mx-auto h-12 w-12 text-brand-gold-500" />
            <h2 className="mt-4 text-xl font-bold text-gray-900">Listing Limit Reached</h2>
            <p className="mt-2 text-gray-600">
              You&apos;ve used {limitCheck.current} of {limitCheck.max} listings available on your
              current plan.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Upgrade your plan to add more property listings.
            </p>
            <Link href="/dashboard/subscription" className="btn btn-primary mt-6 inline-block">
              Upgrade Plan
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex h-64 flex-col items-center justify-center">
        <CheckCircle className="h-12 w-12 text-brand-green-500" />
        <h2 className="mt-4 text-xl font-bold text-gray-900">Property Listed!</h2>
        <p className="mt-1 text-gray-500">Your property has been submitted for review.</p>
        <p className="mt-1 text-sm text-gray-400">Redirecting to your listings...</p>
      </div>
    )
  }

  return (
    <div>
      <Link
        href="/dashboard/listings"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-brand-green-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to listings
      </Link>

      <h1 className="text-2xl font-bold text-gray-900">Add New Property</h1>
      <p className="mt-1 text-gray-500">
        Fill in the details to list your property
        {limitCheck.max !== -1 && (
          <span className="ml-2 text-xs text-gray-400">
            ({limitCheck.current}/{limitCheck.max} listings used)
          </span>
        )}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="rounded-xl border border-brand-cream-300 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Property Title</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g., 4 Bedroom Detached Duplex"
                className="input-field"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Describe the property in detail..."
                className="input-field resize-none"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Property Type</label>
              <select name="type" value={form.type} onChange={handleChange} className="input-field">
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Listing Type</label>
              <select name="listing_type" value={form.listing_type} onChange={handleChange} className="input-field">
                {LISTING_TYPES.map((t) => (
                  <option key={t} value={t}>For {t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Price (₦)</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="e.g., 50000000"
                className="input-field"
                required
              />
            </div>
          </div>
        </div>

        {/* Media Upload */}
        {user && (
          <div className="rounded-xl border border-brand-cream-300 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Photos & Videos</h2>
            <p className="mt-1 text-sm text-gray-500">
              Upload images and videos of your property. The first image will be the cover photo.
            </p>
            <div className="mt-4">
              <MediaUpload
                userId={user.id}
                propertyId={uploadPropertyId}
                onUploadComplete={(images, videos) => {
                  setMediaImages(images)
                  setMediaVideos(videos)
                }}
              />
            </div>
          </div>
        )}

        {/* Location */}
        <div className="rounded-xl border border-brand-cream-300 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Location</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">State</label>
              <select name="state" value={form.state} onChange={handleChange} className="input-field" required>
                <option value="">Select State</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="e.g., Ikeja"
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Address / Area</label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g., Lekki Phase 1"
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="rounded-xl border border-brand-cream-300 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Property Details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Bedrooms</label>
              <input
                type="number"
                name="bedrooms"
                value={form.bedrooms}
                onChange={handleChange}
                placeholder="e.g., 4"
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Bathrooms</label>
              <input
                type="number"
                name="bathrooms"
                value={form.bathrooms}
                onChange={handleChange}
                placeholder="e.g., 5"
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Area (m²)</label>
              <input
                type="number"
                name="area"
                value={form.area}
                onChange={handleChange}
                placeholder="e.g., 350"
                className="input-field"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Features (comma separated)
              </label>
              <input
                type="text"
                name="features"
                value={form.features}
                onChange={handleChange}
                placeholder="e.g., Swimming Pool, CCTV, Fitted Kitchen"
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : 'Save Property'}
          </button>
          <Link href="/dashboard/listings" className="btn btn-outline">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
