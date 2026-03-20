'use client'

import { useState } from 'react'
import { User, Mail, Phone, Lock, Save, Shield } from 'lucide-react'
import { MOCK_PROFILES } from '@/constants/mock-data'

export default function ProfilePage() {
  const profile = MOCK_PROFILES[0] // Mock: current user
  const [form, setForm] = useState({
    full_name: profile.full_name || '',
    phone: profile.phone || '',
  })
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new_password: '',
    confirm: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await new Promise((r) => setTimeout(r, 1000))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
      <p className="mt-1 text-gray-500">Manage your account settings</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="rounded-xl border border-brand-cream-300 bg-white p-6 shadow-sm">
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-green-100">
              <User className="h-10 w-10 text-brand-green-600" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">{profile.full_name}</h2>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="rounded-full bg-brand-green-100 px-2.5 py-0.5 text-xs font-medium capitalize text-brand-green-700">
                {profile.account_type}
              </span>
              {profile.is_verified && (
                <span className="flex items-center gap-1 text-xs text-brand-green-600">
                  <Shield className="h-3 w-3" /> Verified
                </span>
              )}
            </div>
          </div>
          <div className="mt-6 space-y-3 border-t border-brand-cream-200 pt-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4 text-gray-400" />
              {profile.email}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4 text-gray-400" />
              {profile.phone}
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="rounded-xl border border-brand-cream-300 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>

            {saved && (
              <div className="mt-4 rounded-lg bg-brand-green-50 px-4 py-3 text-sm text-brand-green-700">
                Profile updated successfully!
              </div>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="input-field bg-gray-50 text-gray-400"
                />
                <p className="mt-1 text-xs text-gray-400">Email cannot be changed</p>
              </div>
            </div>

            <button type="submit" disabled={saving} className="btn btn-primary mt-6 disabled:opacity-50">
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>

          {/* Password */}
          <form className="rounded-xl border border-brand-cream-300 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Lock className="h-5 w-5" />
              Change Password
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Current Password</label>
                <input
                  type="password"
                  name="current"
                  value={passwordForm.current}
                  onChange={handlePasswordChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">New Password</label>
                <input
                  type="password"
                  name="new_password"
                  value={passwordForm.new_password}
                  onChange={handlePasswordChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Confirm New Password</label>
                <input
                  type="password"
                  name="confirm"
                  value={passwordForm.confirm}
                  onChange={handlePasswordChange}
                  className="input-field"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-outline mt-6">
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
