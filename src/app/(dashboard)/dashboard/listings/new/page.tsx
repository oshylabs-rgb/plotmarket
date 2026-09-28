'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, AlertCircle, CheckCircle, Loader2, ArrowUpCircle } from 'lucide-react'
import Link from 'next/link'
import { NIGERIAN_STATES } from '@/constants/states'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { friendlyListingError, planName } from '@/constants/plans'
import { usePlanStatus } from '@/hooks/usePlanStatus'
import { MediaUpload, type MediaUploadResult } from '@/components/MediaUpload'
import { TITLE_DOCUMENT_LABELS, type TitleDocumentType } from '@/types/database'

const PROPERTY_TYPES = ['house', 'apartment', 'land', 'commercial', 'development']
const LISTING_TYPES = ['sale', 'rent', 'lease']
const TITLE_DOCUMENTS = Object.keys(TITLE_DOCUMENT_LABELS) as TitleDocumentType[]

export default function NewListingPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [uploadPropertyId] = useState(() => crypto.randomUUID())
  const [media, setMedia] = useState<MediaUploadResult>({
    images: [],
    videos: [],
    images360: [],
    videos360: [],
  })
  const [mediaBusy, setMediaBusy] = useState(false)
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
    title_document: 'unknown',
  })

  // The server enforces the allowance; this only decides what to show.
  const { status: plan, loading: planLoading } = usePlanStatus(user?.id)
  const atLimit = !!plan && plan.max_active !== null && plan.active_count >= plan.max_active
  const isPilot = plan?.plan === 'pilot'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('You must be logged in to create a listing')
      return
    }

    if (mediaBusy) {
      setError('Your photos are still uploading. Give it a moment, then save.')
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
      estate_name: isPilot ? plan?.pilot_project_name : null,
      title: form.title,
      description: form.description,
      type: form.type,
      listing_type: form.listing_type,
      price: parseInt(form.price),
      location: form.location || null,
      state: isPilot && plan?.pilot_project_state ? plan.pilot_project_state : form.state,
      city: form.city || null,
      bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
      bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
      area: form.area ? parseInt(form.area) : null,
      images: media.images,
      videos: media.videos,
      images_360: media.images360,
      videos_360: media.videos360,
      title_document: form.title_document,
      features: featuresArray,
    })

    if (insertError) {
      setError(friendlyListingError(insertError.message))
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard/listings')
      }, 1500)
    }
  }

  if (authLoading || planLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green-600" />
      </div>
    )
  }

  // Show upgrade prompt if at listing limit
  if (atLimit && plan) {
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
            <h2 className="mt-4 text-xl font-bold text-gray-900">All your active listing slots are in use</h2>
            <p className="mt-2 text-gray-600">
              {planName(plan.plan)} allows {plan.max_active} active listings and you have{' '}
              {plan.active_count}.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Pause or mark sold a listing you no longer need, or see what a bigger plan allows.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/dashboard/listings" className="btn btn-outline">
                Manage listings
              </Link>
              <Link href="/dashboard/subscription" className="btn btn-primary">
                See plans
              </Link>
            </div>
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
        <p className="mt-1 text-gray-500">
          Submitted for review. We check listings before they go live; that is not a check of ownership or title.
        </p>
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
        {plan && plan.max_active !== null && (
          <span className="ml-2 text-xs text-gray-400">
            ({plan.active_count} of {plan.max_active} active listings used)
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
            <h2 className="text-lg font-semibold text-gray-900">Photos, videos and 360° tours</h2>
            <p className="mt-1 text-sm text-gray-500">
              Listings with photos get far more serious enquiries. The first photo is the cover.
            </p>
            <div className="mt-4">
              <MediaUpload
                userId={user.id}
                propertyId={uploadPropertyId}
                onChange={setMedia}
                onBusyChange={setMediaBusy}
              />
            </div>
          </div>
        )}

        {/* Title / documentation */}
        <div className="rounded-xl border border-brand-cream-300 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Title document</h2>
          <p className="mt-1 text-sm text-gray-500">
            Buyers filter on this. Listings that state a title get taken seriously.
          </p>
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              What title is available for this property?
            </label>
            <select
              name="title_document"
              value={form.title_document}
              onChange={handleChange}
              className="input-field"
            >
              {TITLE_DOCUMENTS.map((doc) => (
                <option key={doc} value={doc}>
                  {TITLE_DOCUMENT_LABELS[doc]}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gray-500">
              Buyers see this as the title-document type stated by you. State only what you genuinely
              hold. Plotmarket does not verify title documents, and knowingly misstating one can expose
              you to liability under the Land Use Act.
            </p>
          </div>
        </div>

        {/* Location */}
        <div className="rounded-xl border border-brand-cream-300 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Location</h2>
          {isPilot && (
            <p className="mt-1 text-sm text-gray-500">
              Founding Developer Pilot listings go in your nominated estate, {plan?.pilot_project_name}.
            </p>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="state" className="mb-1 block text-sm font-medium text-gray-700">State</label>
              {isPilot && plan?.pilot_project_state ? (
                <input id="state" value={plan.pilot_project_state} readOnly className="input-field bg-brand-cream-50" />
              ) : (
                <select id="state" name="state" value={form.state} onChange={handleChange} className="input-field" required>
                  <option value="">Select State</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
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
            disabled={loading || mediaBusy}
            className="btn btn-primary disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : mediaBusy ? 'Waiting for uploads...' : 'Save Property'}
          </button>
          <Link href="/dashboard/listings" className="btn btn-outline">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
