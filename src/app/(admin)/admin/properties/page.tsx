'use client'

import { useEffect, useState } from 'react'
import { Search, CheckCircle, XCircle, Star, Trash2, Eye, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { formatNaira, getStatusColor } from '@/lib/utils'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import type { Property } from '@/types/database'

export default function AdminPropertiesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProperties = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })

      setProperties(data || [])
      setLoading(false)
    }

    fetchProperties()
  }, [])

  const handleStatusChange = async (id: string, status: string) => {
    const supabase = createClient()
    await supabase.from('properties').update({ status }).eq('id', id)
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: status as Property['status'] } : p))
    )
  }

  const handleToggleFeatured = async (id: string, currentlyFeatured: boolean) => {
    const supabase = createClient()
    await supabase.from('properties').update({ is_featured: !currentlyFeatured }).eq('id', id)
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_featured: !currentlyFeatured } : p))
    )
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return
    const supabase = createClient()
    await supabase.from('properties').delete().eq('id', id)
    setProperties((prev) => prev.filter((p) => p.id !== id))
  }

  const filteredProperties = properties.filter((p) => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter && p.status !== statusFilter) return false
    return true
  })

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green-600" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Properties Management</h1>
      <p className="mt-1 text-gray-500">Review and manage all property listings ({properties.length} total)</p>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search properties..."
            className="input-field pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-auto"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="sold">Sold</option>
        </select>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-x-auto rounded-xl border border-brand-cream-300 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-brand-cream-200 bg-brand-cream-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Property</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Price</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:table-cell">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 md:table-cell">Featured</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 md:table-cell">Date</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream-200">
            {filteredProperties.map((property) => (
              <tr key={property.id} className="hover:bg-brand-cream-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-green-500 to-brand-green-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{property.title}</p>
                      <p className="text-xs text-gray-500">{property.state}</p>
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
                  {property.is_featured ? (
                    <Star className="h-4 w-4 fill-brand-gold-400 text-brand-gold-400" />
                  ) : (
                    <Star className="h-4 w-4 text-gray-300" />
                  )}
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
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    {property.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(property.id, 'approved')}
                          className="rounded-lg p-2 text-gray-400 hover:bg-green-50 hover:text-green-600"
                          title="Approve"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(property.id, 'rejected')}
                          className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          title="Reject"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleToggleFeatured(property.id, property.is_featured)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-brand-gold-50 hover:text-brand-gold-600"
                      title="Toggle Featured"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(property.id)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title="Delete"
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
          <div className="py-12 text-center text-gray-500">No properties found</div>
        )}
      </div>
    </div>
  )
}
