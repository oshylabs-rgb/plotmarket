import Link from 'next/link'
import { MapPin, Bed, Bath, Maximize, Tag } from 'lucide-react'
import { Property } from '@/types/database'
import { formatNaira, getPropertyGradient } from '@/lib/utils'

export function PropertyCard({ property }: { property: Property }) {
  const gradient = getPropertyGradient(property.type)

  return (
    <Link
      href={`/properties/${property.id}`}
      className="group block overflow-hidden rounded-xl border border-brand-cream-300 bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
    >
      {/* Image / Gradient placeholder */}
      <div className={`relative h-48 ${property.images && property.images.length > 0 ? 'bg-gray-200' : `bg-gradient-to-br ${gradient}`}`}>
        {property.images && property.images.length > 0 ? (
          <img
            src={property.images[0]}
            alt={property.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white/80">
              <Maximize className="mx-auto h-8 w-8 mb-1" />
              <span className="text-xs font-medium">
                {property.area ? `${property.area} m²` : 'View Details'}
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
        {property.is_featured && (
          <div className="absolute right-3 top-3">
            <span className="rounded-full bg-brand-green-600 px-2.5 py-0.5 text-xs font-semibold text-white">
              Featured
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-lg font-bold text-brand-green-700">
          {formatNaira(property.price)}
          {property.listing_type !== 'sale' && (
            <span className="text-sm font-normal text-gray-500">/year</span>
          )}
        </p>
        <h3 className="mt-1 font-semibold text-gray-900 group-hover:text-brand-green-600 transition-colors line-clamp-1">
          {property.title}
        </h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
          <MapPin className="h-3.5 w-3.5" />
          {property.location}, {property.state}
        </p>

        {/* Stats */}
        <div className="mt-3 flex items-center gap-4 border-t border-brand-cream-200 pt-3">
          {property.bedrooms != null && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Bed className="h-4 w-4 text-brand-green-500" />
              <span>{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms != null && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Bath className="h-4 w-4 text-brand-green-500" />
              <span>{property.bathrooms}</span>
            </div>
          )}
          {property.area != null && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Maximize className="h-4 w-4 text-brand-green-500" />
              <span>{property.area} m²</span>
            </div>
          )}
          {property.is_verified && (
            <div className="ml-auto flex items-center gap-1 text-xs text-brand-green-600">
              <Tag className="h-3 w-3" />
              Verified
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
