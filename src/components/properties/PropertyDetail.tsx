'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, MapPin, Bed, Bath, Maximize, Shield, Star, User, Phone, Mail, MessageSquare, AlertCircle, ChevronLeft, ChevronRight, Film, Rotate3d, ScrollText } from 'lucide-react'
import { formatNaira, getPropertyGradient } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Viewer360 } from '@/components/Viewer360'
import { TITLE_DOCUMENT_LABELS, type Property, type Profile } from '@/types/database'

/**
 * Client half of the listing page. The listing and its seller arrive from the
 * Server Component page; this component keeps the gallery, 360 viewer and
 * inquiry form interactive.
 */
export function PropertyDetail({ property, agent }: { property: Property; agent: Profile | null }) {
  const { user } = useAuth()
  const [currentImage, setCurrentImage] = useState(0)
  const [inquiryMessage, setInquiryMessage] = useState('')
  const [inquirySent, setInquirySent] = useState(false)
  const [inquiryError, setInquiryError] = useState('')

  const handleInquiry = async (e: React.FormEvent) => {
    e.preventDefault()
    setInquiryError('')

    if (!user) {
      setInquiryError('You must be logged in to send an inquiry')
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from('inquiries').insert({
      property_id: property.id,
      sender_id: user.id,
      receiver_id: property.user_id,
      message: inquiryMessage,
    })

    if (error) {
      // Row level security refuses enquiries about listings that are no longer live.
      setInquiryError(
        error.code === '42501'
          ? 'This listing is no longer taking enquiries.'
          : error.message
      )
    } else {
      setInquirySent(true)
    }
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

      {property.is_demo && (
        <div role="note" className="mb-6 rounded-lg border border-ink-900 bg-ink-900 px-4 py-3 text-sm text-white">
          <strong>Demo listing, not for sale.</strong> Plotmarket created this sample to show how a listing
          looks. The property, price and contact details are not real, and it cannot receive enquiries.
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Image Gallery / Gradient Fallback */}
          {property.images && property.images.length > 0 ? (
            <div className="relative h-64 overflow-hidden rounded-2xl bg-gray-200 sm:h-80 lg:h-96">
              <img
                src={property.images[currentImage]}
                alt={`${property.title} - Image ${currentImage + 1}`}
                className="h-full w-full object-cover"
              />
              {/* Prev/Next arrows */}
              {property.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentImage((prev) =>
                        prev === 0 ? property.images.length - 1 : prev - 1
                      )
                    }
                    aria-label="Previous photo"
                    className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentImage((prev) =>
                        prev === property.images.length - 1 ? 0 : prev + 1
                      )
                    }
                    aria-label="Next photo"
                    className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
              {/* Image counter */}
              <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
                {currentImage + 1} / {property.images.length}
              </div>
              {/* Badges */}
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
              {/* Thumbnail strip */}
              {property.images.length > 1 && (
                <div className="absolute bottom-3 left-3 flex gap-1.5">
                  {property.images.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentImage(idx)}
                      className={`h-2 w-2 rounded-full transition-all ${
                        idx === currentImage ? 'bg-white scale-125' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className={`relative h-64 overflow-hidden rounded-2xl ${gradient} sm:h-80 lg:h-96`}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-ink-400">
                  <Maximize className="mx-auto mb-2 h-14 w-14" />
                  <span className="text-lg font-medium">
                    {property.area ? `${property.area} m²` : 'No photo provided'}
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
          )}

          {/* 360° tours */}
          {((property.images_360?.length ?? 0) > 0 || (property.videos_360?.length ?? 0) > 0) && (
            <div className="mt-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Rotate3d className="h-5 w-5 text-brand-green-600" />
                360° tour
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Drag to look around. Inspect the property before you travel to see it.
              </p>
              <div className="mt-3 space-y-4">
                {(property.videos_360 ?? []).map((url) => (
                  <Viewer360 key={url} src={url} type="video" className="h-72 sm:h-96" />
                ))}
                {(property.images_360 ?? []).map((url) => (
                  <Viewer360 key={url} src={url} type="image" className="h-72 sm:h-96" />
                ))}
              </div>
            </div>
          )}

          {/* Video Section */}
          {property.videos && property.videos.length > 0 && (
            <div className="mt-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Film className="h-5 w-5 text-brand-green-600" />
                Property Videos
              </h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {property.videos.map((videoUrl, idx) => (
                  <div key={idx} className="overflow-hidden rounded-xl border border-brand-cream-300">
                    <video
                      src={videoUrl}
                      controls
                      playsInline
                      className="w-full"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          </div>

          {/* Title document */}
          <div className="mt-8 rounded-xl border border-brand-cream-300 bg-white p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <ScrollText className="h-5 w-5 text-brand-green-600" />
              Title document
            </h2>
            {property.title_document && property.title_document !== 'unknown' ? (
              <>
                <p className="mt-2 text-lg font-semibold text-brand-green-700">
                  {TITLE_DOCUMENT_LABELS[property.title_document]}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Title-document type stated by the seller. Plotmarket does not verify title documents
                  or ownership. Always confirm at the relevant state land registry, and instruct your
                  own solicitor, before you pay any money.
                </p>
              </>
            ) : (
              <div className="mt-2 flex items-start gap-2 rounded-lg bg-brand-gold-50 px-3 py-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold-600" />
                <p className="text-sm text-brand-gold-800">
                  The seller has not stated a title document. Ask what title is available and
                  verify it at the state land registry before paying anything.
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900">Description</h2>
            <p className="mt-3 leading-relaxed text-gray-600">{property.description}</p>
          </div>

          {/* Features */}
          {property.features && property.features.length > 0 && (
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
                  <p className="text-sm text-gray-500 capitalize">
                    {agent.user_type || 'Individual'}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Name and phone as given by the seller. Plotmarket reviews listings before they go live;
                it does not verify the seller&apos;s identity, ownership or title.
              </p>
              <div className="mt-4 space-y-2">
                <a
                  href={`tel:${agent.phone}`}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-green-600"
                >
                  <Phone className="h-4 w-4" />
                  {agent.phone || 'Not provided'}
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
            {property.is_demo ? (
              <p className="mt-4 text-sm text-gray-500">
                Enquiries are closed: this is a demo listing, not a real property.
              </p>
            ) : inquirySent ? (
              <div className="mt-4 rounded-lg bg-brand-green-50 p-4 text-center">
                <Shield className="mx-auto h-8 w-8 text-brand-green-500" />
                <p className="mt-2 font-medium text-brand-green-700">Inquiry Sent!</p>
                <p className="text-sm text-brand-green-600">
                  Your message is in the seller&apos;s Plotmarket inbox. They reply to you directly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleInquiry} className="mt-4 space-y-3">
                {inquiryError && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {inquiryError}
                  </div>
                )}
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
                {!user && (
                  <p className="text-center text-xs text-gray-400">
                    <Link href="/login" className="text-brand-green-600 hover:underline">
                      Sign in
                    </Link>{' '}
                    to send inquiries
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
