'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Trash2, Eye, Loader2, PauseCircle, PlayCircle, BadgeCheck } from 'lucide-react'
import { formatNaira, getStatusColor } from '@/lib/utils'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { usePlanStatus } from '@/hooks/usePlanStatus'
import { friendlyListingError, planName } from '@/constants/plans'
import type { Property, PropertyStatus } from '@/types/database'

export default function ListingsPage() {
  const { user, loading: authLoading } = useAuth()
  const [search, setSearch] = useState('')
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState('')
  const { status: plan, refresh: refreshPlan } = usePlanStatus(user?.id)

  useEffect(() => {
    if (!user) return

    const fetchListings = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setProperties(data || [])
      setLoading(false)
    }

    fetchListings()
  }, [user])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing for good? Its photos and details cannot be recovered. Pausing hides it and keeps everything.')) return

    const supabase = createClient()
    const { error } = await supabase.from('properties').delete().eq('id', id)

    if (error) {
      setActionError(error.message)
      return
    }
    setProperties((prev) => prev.filter((p) => p.id !== id))
    refreshPlan()
  }

  // Owners may pause a live or pending listing, bring a paused one back, or
  // mark a live one sold. The database checks the allowance on restore.
  const changeStatus = async (property: Property, next: PropertyStatus) => {
    setActionError('')
    const supabase = createClient()
    const { data, error } = await supabase
      .from('properties')
      .update({ status: next })
      .eq('id', property.id)
      .select()
      .single()
    if (error) {
      setActionError(friendlyListingError(error.message))
      return
    }
    setProperties((prev) => prev.map((p) => (p.id === property.id ? (data as Property) : p)))
    refreshPlan()
  }

  const filteredProperties = properties.filter((p) =>
    search ? p.title.toLowerCase().includes(search.toLowerCase()) : true
  )

  if (authLoading || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          <p className="mt-1 text-gray-500">Manage your property listings</p>
        </div>
        <Link href="/dashboard/listings/new" className="btn btn-primary">
          <Plus className="h-4 w-4" />
          Add Property
        </Link>
      </div>

      {plan && (
        <p className="mt-4 rounded-lg bg-brand-cream-50 px-4 py-3 text-sm text-gray-700">
          {planName(plan.plan)}:{' '}
          {plan.max_active === null
            ? `${plan.active_count} active listings`
            : `${plan.active_count} of ${plan.max_active} active listings in use`}
          {plan.paused_count > 0 && `, ${plan.paused_count} paused`}. Pending and live listings count;
          paused, rejected and sold ones do not. Paused listings are hidden from buyers but kept, and you
          can bring one back when a slot is free.{' '}
          <Link href="/dashboard/subscription" className="text-brand-green-700 underline">
            Plan details
          </Link>
        </p>
      )}
      {actionError && (
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </p>
      )}

      {/* Search */}
      <div className="mt-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your listings..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-x-auto rounded-xl border border-brand-cream-300 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-brand-cream-200 bg-brand-cream-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Property
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Price
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:table-cell">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Status
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 md:table-cell">
                Date
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream-200">
            {filteredProperties.map((property) => (
              <tr key={property.id} className="hover:bg-brand-cream-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-md border border-brand-cream-300 bg-brand-cream-200" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                        {property.title}
                      </p>
                      <p className="text-xs text-gray-500">{property.location}, {property.state}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold text-brand-green-700">{formatNaira(property.price)}</p>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <span className="rounded-full bg-brand-cream-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-700">
                    {property.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusColor(property.status)}`}>
                    {property.status}
                  </span>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <p className="text-sm text-gray-500">{format(new Date(property.created_at), 'MMM d, yyyy')}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/properties/${property.id}`}
                      className="rounded-lg p-2 text-gray-400 hover:bg-brand-cream-100 hover:text-brand-green-600"
                      title="View"
                      aria-label={`View ${property.title}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    {(property.status === 'approved' || property.status === 'pending') && (
                      <button
                        type="button"
                        onClick={() => changeStatus(property, 'paused')}
                        className="rounded-lg p-2 text-gray-400 hover:bg-brand-cream-100 hover:text-brand-green-600"
                        title="Pause (hide from buyers, keep everything)"
                        aria-label={`Pause ${property.title}`}
                      >
                        <PauseCircle className="h-4 w-4" />
                      </button>
                    )}
                    {property.status === 'paused' && property.paused_from && (
                      <button
                        type="button"
                        onClick={() => changeStatus(property, property.paused_from as PropertyStatus)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-brand-cream-100 hover:text-brand-green-600"
                        title="Bring back"
                        aria-label={`Bring back ${property.title}`}
                      >
                        <PlayCircle className="h-4 w-4" />
                      </button>
                    )}
                    {property.status === 'approved' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Mark this listing as sold? It will come off the site and cannot be relisted.')) {
                            changeStatus(property, 'sold')
                          }
                        }}
                        className="rounded-lg p-2 text-gray-400 hover:bg-brand-cream-100 hover:text-brand-green-600"
                        title="Mark sold"
                        aria-label={`Mark ${property.title} sold`}
                      >
                        <BadgeCheck className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(property.id)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                      aria-label={`Delete ${property.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredProperties.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-500">
              {properties.length === 0 ? 'You haven\'t listed any properties yet' : 'No listings found'}
            </p>
            <Link href="/dashboard/listings/new" className="btn btn-primary mt-4">
              Add Your First Property
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
