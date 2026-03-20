'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Edit, Trash2, Eye, MoreVertical } from 'lucide-react'
import { MOCK_PROPERTIES } from '@/constants/mock-data'
import { formatNaira, getStatusColor } from '@/lib/utils'
import { format } from 'date-fns'

export default function ListingsPage() {
  const [search, setSearch] = useState('')
  const properties = MOCK_PROPERTIES.filter((p) => p.user_id === 'u1')

  const filteredProperties = properties.filter((p) =>
    search ? p.title.toLowerCase().includes(search.toLowerCase()) : true
  )

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
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-green-500 to-brand-green-400 shrink-0" />
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
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button
                      className="rounded-lg p-2 text-gray-400 hover:bg-brand-cream-100 hover:text-brand-green-600"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
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
          <div className="py-12 text-center">
            <p className="text-gray-500">No listings found</p>
            <Link href="/dashboard/listings/new" className="btn btn-primary mt-4">
              Add Your First Property
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
