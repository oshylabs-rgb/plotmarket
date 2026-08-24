import Link from 'next/link'
import { MapPin, Bed, Bath, Maximize, ShieldCheck, Rotate3d, ScrollText } from 'lucide-react'
import { TITLE_DOCUMENT_LABELS, type Property } from '@/types/database'
import { formatNaira, getPropertyGradient } from '@/lib/utils'

/** Short forms for the card, where the full label will not fit. */
const SHORT_TITLE_LABELS: Record<string, string> = {
  c_of_o: 'C of O',
  governors_consent: 'Gov. Consent',
  deed_of_assignment: 'Deed',
  excision: 'Excision',
  gazette: 'Gazette',
  registered_survey: 'Reg. Survey',
  allocation_letter: 'Allocation',
  family_receipt: 'Family Receipt',
}

export function PropertyCard({ property }: { property: Property }) {
  const gradient = getPropertyGradient(property.type)
  const has360 =
    (property.images_360?.length ?? 0) > 0 || (property.videos_360?.length ?? 0) > 0
  const titleLabel =
    property.title_document && property.title_document !== 'unknown'
      ? SHORT_TITLE_LABELS[property.title_document] ??
        TITLE_DOCUMENT_LABELS[property.title_document]
      : null

  return (
    <Link
      href={`/properties/${property.id}`}
      className="group block overflow-hidden rounded-lg border border-brand-cream-300 bg-white transition-colors hover:border-brand-green-400"
    >
      {/* Image / Gradient placeholder */}
      <div
        className={`relative h-48 ${
          property.images && property.images.length > 0 ? 'bg-brand-cream-200' : gradient
        }`}
      >
        {property.images && property.images.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={property.images[0]}
            alt={property.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-ink-600">
              <Maximize className="mx-auto mb-1 h-7 w-7" />
              <span className="text-xs font-medium">
                {property.area ? `${property.area} m²` : 'No photo yet'}
              </span>
            </div>
          </div>
        )}
        {/* Badges */}
        <div className="absolute left-3 top-3 flex gap-2">
          <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold capitalize text-gray-800">
            {property.type}
          </span>
          <span className="rounded-full bg-brand-gold-400 px-2.5 py-0.5 text-xs font-semibold capitalize text-brand-green-900">
            For {property.listing_type}
          </span>
        </div>
        <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
          {property.is_featured && (
            <span className="rounded-full bg-brand-green-600 px-2.5 py-0.5 text-xs font-semibold text-white">
              Featured
            </span>
          )}
          {has360 && (
            <span className="flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-0.5 text-xs font-semibold text-white">
              <Rotate3d className="h-3 w-3" />
              360° tour
            </span>
          )}
        </div>

        {titleLabel && (
          <span className="stamp stamp-stated absolute bottom-3 left-3">
            <ScrollText className="h-3 w-3" />
            {titleLabel}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <p data-price className="text-lg font-semibold text-ink-900">
          {formatNaira(property.price)}
          {property.listing_type !== 'sale' && (
            <span className="text-sm font-normal text-ink-500">/year</span>
          )}
        </p>
        <h3 className="mt-1 line-clamp-1 font-sans font-semibold text-ink-800 transition-colors group-hover:text-brand-green-600">
          {property.title}
        </h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-ink-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {[property.location, property.state].filter(Boolean).join(', ')}
          </span>
        </p>

        {/* Stats */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-brand-cream-300 pt-3">
          {property.bedrooms != null && (
            <div className="flex items-center gap-1 text-sm text-ink-600">
              <Bed className="h-4 w-4 text-ink-400" />
              <span className="tabular">{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms != null && (
            <div className="flex items-center gap-1 text-sm text-ink-600">
              <Bath className="h-4 w-4 text-ink-400" />
              <span className="tabular">{property.bathrooms}</span>
            </div>
          )}
          {property.area != null && (
            <div className="flex items-center gap-1 text-sm text-ink-600">
              <Maximize className="h-4 w-4 text-ink-400" />
              <span className="tabular">{property.area} m²</span>
            </div>
          )}
          {property.is_verified && (
            <div className="ml-auto flex items-center gap-1 text-xs font-medium text-brand-green-600">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
