'use client'

import { useState } from 'react'
import { Search, Shield, ShieldOff, UserCheck, UserX } from 'lucide-react'
import { MOCK_PROFILES } from '@/constants/mock-data'
import { format } from 'date-fns'

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')

  const filteredUsers = MOCK_PROFILES.filter((u) =>
    search
      ? u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      : true
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
      <p className="mt-1 text-gray-500">View and manage all platform users</p>

      {/* Search */}
      <div className="mt-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users by name or email..."
          className="input-field pl-10"
        />
      </div>

      {/* Users Table */}
      <div className="mt-6 overflow-x-auto rounded-xl border border-brand-cream-300 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-brand-cream-200 bg-brand-cream-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Role</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:table-cell">Plan</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 md:table-cell">Verified</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 md:table-cell">Joined</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-brand-cream-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-green-100 text-sm font-semibold text-brand-green-700">
                      {user.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <span className="rounded-full bg-brand-green-100 px-2.5 py-0.5 text-xs font-medium capitalize text-brand-green-700">
                    {user.account_type}
                  </span>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  {user.is_verified ? (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <Shield className="h-4 w-4" /> Yes
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm text-gray-400">
                      <ShieldOff className="h-4 w-4" /> No
                    </span>
                  )}
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <p className="text-sm text-gray-500">{format(new Date(user.created_at), 'MMM d, yyyy')}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      className="rounded-lg p-2 text-gray-400 hover:bg-brand-green-50 hover:text-brand-green-600"
                      title={user.is_verified ? 'Unverify' : 'Verify'}
                    >
                      <UserCheck className="h-4 w-4" />
                    </button>
                    <button
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title="Ban User"
                    >
                      <UserX className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="py-12 text-center text-gray-500">No users found</div>
        )}
      </div>
    </div>
  )
}
