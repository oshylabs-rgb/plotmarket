'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { NIGERIAN_STATES } from '@/constants/states'

const PROPERTY_TYPES = ['house', 'apartment', 'land', 'commercial', 'development']
const LISTING_TYPES = ['sale', 'rent', 'lease']

export default function NewListingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // In production, this would call Supabase to insert the property
    await new Promise((r) => setTimeout(r, 1000))
    router.push('/dashboard/listings')
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
      <p className="mt-1 text-gray-500">Fill in the details to list your property</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
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
