'use client'

import { CreditCard } from 'lucide-react'
import { MOCK_SUBSCRIPTIONS, MOCK_PROFILES } from '@/constants/mock-data'
import { formatNaira, getStatusColor } from '@/lib/utils'
import { format } from 'date-fns'

export default function AdminSubscriptionsPage() {
  const getUser = (id: string) => MOCK_PROFILES.find((p) => p.id === id)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
      <p className="mt-1 text-gray-500">View and manage all user subscriptions</p>

      {/* Summary Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-brand-cream-300 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-brand-green-600">
            <CreditCard className="h-5 w-5" />
            <span className="text-sm font-medium">Active</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {MOCK_SUBSCRIPTIONS.filter((s) => s.status === 'active').length}
          </p>
        </div>
        <div className="rounded-xl border border-brand-cream-300 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <CreditCard className="h-5 w-5" />
            <span className="text-sm font-medium">Expired</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {MOCK_SUBSCRIPTIONS.filter((s) => s.status === 'expired').length}
          </p>
        </div>
        <div className="rounded-xl border border-brand-cream-300 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-brand-gold-600">
            <CreditCard className="h-5 w-5" />
            <span className="text-sm font-medium">Monthly Revenue</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatNaira(
              MOCK_SUBSCRIPTIONS.filter((s) => s.status === 'active').reduce((sum, s) => sum + s.amount, 0)
            )}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-x-auto rounded-xl border border-brand-cream-300 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-brand-cream-200 bg-brand-cream-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Plan</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Amount</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 md:table-cell">Start Date</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 md:table-cell">End Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream-200">
            {MOCK_SUBSCRIPTIONS.map((sub) => {
              const user = getUser(sub.user_id)
              return (
                <tr key={sub.id} className="hover:bg-brand-cream-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-green-100 text-sm font-semibold text-brand-green-700">
                        {user?.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-brand-green-100 px-2.5 py-0.5 text-xs font-medium capitalize text-brand-green-700">
                      {sub.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-brand-green-700">{formatNaira(sub.amount)}</p>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <p className="text-sm text-gray-500">{format(new Date(sub.start_date), 'MMM d, yyyy')}</p>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <p className="text-sm text-gray-500">{format(new Date(sub.end_date), 'MMM d, yyyy')}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusColor(sub.status)}`}>
                      {sub.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
