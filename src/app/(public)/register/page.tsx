'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, User, Phone, UserPlus, CheckCircle, Building2, Users, Briefcase } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { createClient } from '@/lib/supabase/client'
import type { UserType } from '@/types/database'

const USER_TYPES: { value: UserType; label: string; description: string; icon: typeof User }[] = [
  {
    value: 'individual',
    label: 'Individual',
    description: 'I want to buy, sell, or rent my own property',
    icon: User,
  },
  {
    value: 'agent',
    label: 'Agent',
    description: 'I am a real estate agent listing properties for clients',
    icon: Users,
  },
  {
    value: 'developer',
    label: 'Developer',
    description: 'I am a property developer listing new developments',
    icon: Building2,
  },
]

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [userType, setUserType] = useState<UserType>('individual')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
          phone,
          user_type: userType,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-brand-green-600" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Check your email</h1>
          <p className="mt-3 text-gray-600">
            We&apos;ve sent a confirmation link to <strong>{email}</strong>
          </p>
          <div className="mt-6 rounded-lg bg-brand-green-50 border border-brand-green-200 px-4 py-4 text-sm text-brand-green-800">
            <p className="font-medium">What happens next:</p>
            <p className="mt-1">Click the link in the email and you&apos;ll be logged in automatically — straight to your dashboard.</p>
          </div>
          <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-4 text-sm text-amber-800">
            <p className="font-medium">Can&apos;t find the email?</p>
            <ul className="mt-2 space-y-1 text-left list-disc list-inside">
              <li>It comes from <strong>noreply@mail.app.supabase.io</strong></li>
              <li>Check your <strong>spam/junk folder</strong></li>
              <li>It may take a minute to arrive</li>
            </ul>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            Already confirmed?{' '}
            <Link href="/login" className="font-medium text-brand-green-600 hover:text-brand-green-700">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="flex justify-center">
            <Logo />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-2 text-sm text-gray-500">
            Join Plotmarket and start listing your properties
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* User Type Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              I am a...
            </label>
            <div className="grid grid-cols-3 gap-2">
              {USER_TYPES.map((type) => {
                const Icon = type.icon
                const isSelected = userType === type.value
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setUserType(type.value)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-center transition-all ${
                      isSelected
                        ? 'border-brand-green-500 bg-brand-green-50 text-brand-green-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isSelected ? 'text-brand-green-600' : 'text-gray-400'}`} />
                    <span className="text-xs font-semibold">{type.label}</span>
                  </button>
                )
              })}
            </div>
            <p className="mt-1.5 text-xs text-gray-400">
              {USER_TYPES.find((t) => t.value === userType)?.description}
            </p>
          </div>

          <div>
            <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="input-field pl-10"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field pl-10"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 xxx xxx xxxx"
                className="input-field pl-10"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                className="input-field pl-10 pr-10"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-3 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating account...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Create Account
              </span>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-brand-green-600 hover:text-brand-green-700">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}
