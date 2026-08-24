'use client'

import { useEffect, useState } from 'react'
import { Search, Shield, ShieldOff, UserCheck, Trash2, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      setUsers(data || [])
      setLoading(false)
    }

    fetchUsers()
  }, [])

  // Checked before the table updates. Row level security denies silently, so
  // an unchecked write would show a change that never reached the database.
  const handleVerify = async (userId: string, currentlyVerified: boolean) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: !currentlyVerified })
      .eq('id', userId)
    if (error) {
      setActionError(`Could not update that account. ${error.message}`)
      return
    }
    setActionError('')
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_verified: !currentlyVerified } : u))
    )
  }

  // Deleting goes through a route handler rather than the browser client. It
  // has to remove the auth.users row, and only the service role key can do
  // that, so it can never be done from here.
  const handleDelete = async (user: Profile) => {
    const label = user.full_name || user.email
    if (
      !confirm(
        `Delete ${label}? This removes their account, their listings and their uploaded media. It cannot be undone.`
      )
    ) {
      return
    }

    setDeletingId(user.id)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) {
        setActionError(data.error || 'Could not delete that account.')
        return
      }
      setActionError('')
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
    } catch {
      setActionError('Could not reach the server. Try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredUsers = users.filter((u) =>
    search
      ? u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      : true
  )

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green-600" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
      <p className="mt-1 text-gray-500">View and manage all platform users ({users.length} total)</p>

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
      {actionError && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-danger-600 bg-danger-50 px-4 py-3 text-sm text-danger-700"
        >
          {actionError}
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-brand-cream-300 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-brand-cream-200 bg-brand-cream-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Role</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:table-cell">Type</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 lg:table-cell">Company</th>
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
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    user.user_type === 'agent'
                      ? 'bg-blue-100 text-blue-700'
                      : user.user_type === 'developer'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-brand-cream-100 text-gray-700'
                  }`}>
                    {user.user_type || 'individual'}
                  </span>
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  {user.company_name ? (
                    <span className="text-sm text-gray-700">{user.company_name}</span>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
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
                      onClick={() => handleVerify(user.id, user.is_verified)}
                      aria-label={user.is_verified ? 'Unverify account' : 'Verify account'}
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 hover:bg-brand-green-50 hover:text-brand-green-600"
                      title={user.is_verified ? 'Unverify' : 'Verify'}
                    >
                      <UserCheck className="h-4 w-4" />
                    </button>
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => handleDelete(user)}
                        disabled={deletingId === user.id}
                        aria-label="Delete account"
                        className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 hover:bg-danger-50 hover:text-danger-600 disabled:opacity-50"
                        title="Delete account"
                      >
                        {deletingId === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
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
