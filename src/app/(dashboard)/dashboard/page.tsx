'use client'

import { useEffect, useState } from 'react'
import { Building2, MessageSquare, CreditCard, TrendingUp, Eye, Clock, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { formatNaira } from '@/lib/utils'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { OnboardingTour } from '@/components/OnboardingTour'
import type { Property, Inquiry, Subscription } from '@/types/database'

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      const supabase = createClient()

      const [propertiesRes, inquiriesRes, subscriptionRes] = await Promise.all([
        supabase
          .from('properties')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('inquiries')
          .select('*')
          .eq('receiver_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1),
      ])

      setProperties(propertiesRes.data || [])
      setInquiries(inquiriesRes.data || [])
      setSubscription(subscriptionRes.data?.[0] || null)
      setLoading(false)
    }

    fetchData()
  }, [user])

  if (authLoading || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green-600" />
      </div>
    )
  }

  const stats = [
    {
      label: 'My Listings',
      value: properties.length.toString(),
      icon: Building2,
      color: 'bg-brand-green-50 text-brand-green-600',
      href: '/dashboard/listings',
    },
    {
      label: 'Inquiries',
      value: inquiries.length.toString(),
      icon: MessageSquare,
      color: 'bg-blue-50 text-blue-600',
      href: '/dashboard/inquiries',
    },
    {
      label: 'Subscription',
      value: subscription ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1) : 'Basic (Free)',
      icon: CreditCard,
      color: 'bg-brand-gold-50 text-brand-gold-600',
      href: '/dashboard/subscription',
    },
    {
      label: 'Active Listings',
      value: properties.filter((p) => p.status === 'approved').length.toString(),
      icon: Eye,
      color: 'bg-purple-50 text-purple-600',
      href: '/dashboard/listings',
    },
  ]

  return (
    <div>
      <OnboardingTour />
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-500">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}! Here&apos;s an overview of your account.
        </p>
      </div>

      {/* Stats Cards */}
      <div id="tour-stats" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-xl border border-brand-cream-300 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Recent Listings */}
        <div id="tour-listings" className="rounded-xl border border-brand-cream-300 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Listings</h2>
            <Link href="/dashboard/listings" className="text-sm font-medium text-brand-green-600 hover:text-brand-green-700">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {properties.length > 0 ? (
              properties.slice(0, 3).map((property) => (
                <div key={property.id} className="flex items-center gap-3 rounded-lg bg-brand-cream-50 p-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-green-500 to-brand-green-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{property.title}</p>
                    <p className="text-xs text-gray-500">{formatNaira(property.price)}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                      property.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : property.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {property.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-400">No listings yet</p>
                <Link href="/dashboard/listings/new" className="btn btn-primary mt-3 text-sm">
                  Add Your First Property
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Inquiries */}
        <div id="tour-inquiries" className="rounded-xl border border-brand-cream-300 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Inquiries</h2>
            <Link href="/dashboard/inquiries" className="text-sm font-medium text-brand-green-600 hover:text-brand-green-700">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {inquiries.length > 0 ? (
              inquiries.slice(0, 3).map((inquiry) => (
                <div key={inquiry.id} className="rounded-lg bg-brand-cream-50 p-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        inquiry.status === 'unread'
                          ? 'bg-blue-100 text-blue-700'
                          : inquiry.status === 'replied'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {inquiry.status}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      {format(new Date(inquiry.created_at), 'MMM d')}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{inquiry.message}</p>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">No inquiries yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div id="tour-actions" className="mt-8 rounded-xl border border-brand-cream-300 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/dashboard/listings/new" className="btn btn-primary">
            <Building2 className="h-4 w-4" />
            Add New Property
          </Link>
          <Link href="/dashboard/subscription" className="btn btn-secondary">
            <TrendingUp className="h-4 w-4" />
            Upgrade Plan
          </Link>
          <Link href="/dashboard/profile" className="btn btn-outline">
            Edit Profile
          </Link>
        </div>
      </div>
    </div>
  )
}
