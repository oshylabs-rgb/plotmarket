'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, MapPin, Bed, Bath, Maximize, Tag, Shield, Star, User, Phone, Mail, MessageSquare } from 'lucide-react'
import { MOCK_PROPERTIES, MOCK_PROFILES } from '@/constants/mock-data'
import { formatNaira, getPropertyGradient } from '@/lib/utils'
import { useState } from 'react'

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const property = MOCK_PROPERTIES.find((p) => p.id === id)
  const agent = property ? MOCK_PROFILES.find((a) => a.id === property.user_id) : null
  const [inquiryMessage, setInquiryMessage] = useState('')
  const [inquirySent, setInquirySent] = useState(false)

  if (!property) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Property Not Found</h1>
        <p className="mt-2 text-gray-500">The property you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/properties" className="btn btn-primary mt-6">
          Browse Properties
        </Link>
      </div>
    )
  }

  const gradient = getPropertyGradient(property.type)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back */}
      <Link
        href="/properties"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-brand-green-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to properties
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Image / Gradient */}
          <div className={`relative h-64 overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} sm:h-80 lg:h-96`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white/80">
                <Maximize className="mx-auto h-16 w-16 mb-2" />
                <span className="text-lg font-medium">
                  {property.area ? `${property.area} m²` : 'Property Image'}
                </span>
              </div>
            </div>
            <div className="absolute left-4 top-4 flex gap-2">
              <span className="rounded-full bg-white/90 px-3 py-1 text-sm font-semibold capitalize text-gray-800">
                {property.type}
              </span>
              <span className="rounded-full bg-brand-gold-400 px-3 py-1 text-sm font-semibold capitalize text-brand-green-900">
                For {property.listing_type}
              </span>
            </div>
            {property.is_featured && (
              <span className="absolute right-4 top-4 rounded-full bg-brand-green-600 px-3 py-1 text-sm font-semibold text-white">
                Featured
              </span>
            )}
          </div>

          {/* Price & Title */}
          <div className="mt-6">
            <p className="text-3xl font-bold text-brand-green-700">
              {formatNaira(property.price)}
              {property.listing_type !== 'sale' && (
                <span className="text-base font-normal text-gray-500">/year</span>
              )}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">{property.title}</h1>
            <p className="mt-1 flex items-center gap-1 text-gray-500">
              <MapPin className="h-4 w-4" />
              {property.location}, {property.city}, {property.state}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 flex flex-wrap gap-4">
            {property.bedrooms != null && (
              <div className="flex items-center gap-2 rounded-lg bg-brand-cream-100 px-4 py-2.5">
                <Bed className="h-5 w-5 text-brand-green-500" />
                <span className="font-medium">{property.bedrooms} Bedrooms</span>
              </div>
            )}
            {property.bathrooms != null && (
              <div className="flex items-center gap-2 rounded-lg bg-brand-cream-100 px-4 py-2.5">
                <Bath className="h-5 w-5 text-brand-green-500" />
                <span className="font-medium">{property.bathrooms} Bathrooms</span>
              </div>
            )}
            {property.area != null && (
              <div className="flex items-center gap-2 rounded-lg bg-brand-cream-100 px-4 py-2.5">
                <Maximize className="h-5 w-5 text-brand-green-500" />
                <span className="font-medium">{property.area} m²</span>
              </div>
            )}
            {property.is_verified && (
              <div className="flex items-center gap-2 rounded-lg bg-brand-green-50 px-4 py-2.5">
                <Shield className="h-5 w-5 text-brand-green-600" />
                <span className="font-medium text-brand-green-700">Verified</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900">Description</h2>
            <p className="mt-3 leading-relaxed text-gray-600">{property.description}</p>
          </div>

          {/* Features */}
          {property.features.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900">Features & Amenities</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {property.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2 rounded-lg bg-brand-cream-50 px-3 py-2 text-sm"
                  >
                    <Star className="h-4 w-4 text-brand-gold-500" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Property Details */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900">Property Details</h2>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-brand-cream-300 p-3">
                <p className="text-sm text-gray-500">Property Type</p>
                <p className="font-medium capitalize">{property.type}</p>
              </div>
              <div className="rounded-lg border border-brand-cream-300 p-3">
                <p className="text-sm text-gray-500">Listing Type</p>
                <p className="font-medium capitalize">For {property.listing_type}</p>
              </div>
              <div className="rounded-lg border border-brand-cream-300 p-3">
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{property.state}</p>
              </div>
              <div className="rounded-lg border border-brand-cream-300 p-3">
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium capitalize">{property.status}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Agent Card */}
          {agent && (
            <div className="rounded-xl border border-brand-cream-300 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Listed By</h3>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-green-100">
                  <User className="h-6 w-6 text-brand-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{agent.full_name}</p>
                  <p className="text-sm text-gray-500 capitalize">{agent.account_type} Agent</p>
                </div>
              </div>
              {agent.is_verified && (
                <div className="mt-3 flex items-center gap-1 text-sm text-brand-green-600">
                  <Shield className="h-4 w-4" />
                  Verified Agent
                </div>
              )}
              <div className="mt-4 space-y-2">
                <a
                  href={`tel:${agent.phone}`}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-green-600"
                >
                  <Phone className="h-4 w-4" />
                  {agent.phone}
                </a>
                <a
                  href={`mailto:${agent.email}`}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-green-600"
                >
                  <Mail className="h-4 w-4" />
                  {agent.email}
                </a>
              </div>
            </div>
          )}

          {/* Inquiry Form */}
          <div className="rounded-xl border border-brand-cream-300 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <MessageSquare className="h-5 w-5 text-brand-green-600" />
              Send Inquiry
            </h3>
            {inquirySent ? (
              <div className="mt-4 rounded-lg bg-brand-green-50 p-4 text-center">
                <Shield className="mx-auto h-8 w-8 text-brand-green-500" />
                <p className="mt-2 font-medium text-brand-green-700">Inquiry Sent!</p>
                <p className="text-sm text-brand-green-600">
                  The agent will get back to you shortly.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  setInquirySent(true)
                }}
                className="mt-4 space-y-3"
              >
                <textarea
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  rows={4}
                  placeholder="I'm interested in this property. Please provide more details..."
                  className="input-field resize-none"
                  required
                />
                <button type="submit" className="btn btn-primary w-full">
                  Send Inquiry
                </button>
                <p className="text-center text-xs text-gray-400">
                  You must be logged in to send inquiries
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
