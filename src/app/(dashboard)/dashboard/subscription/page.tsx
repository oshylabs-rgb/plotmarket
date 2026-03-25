'use client'

import { useEffect, useState } from 'react'
import { Check, Star, CreditCard, Calendar, AlertCircle, Loader2 } from 'lucide-react'
import { PRICING_PLANS } from '@/constants/pricing'
import { formatNaira } from '@/lib/utils'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import type { Subscription } from '@/types/database'

export default function SubscriptionPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchSubscription = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      setSubscription(data?.[0] || null)
      setLoading(false)
    }

    fetchSubscription()
  }, [user])

  if (authLoading || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green-600" />
      </div>
    )
  }

  const currentPlanName = subscription?.plan || profile?.account_type || 'basic'

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
      <p className="mt-1 text-gray-500">Manage your subscription and billing</p>

      {/* Current Plan */}
      {subscription ? (
        <div className="mt-6 rounded-xl border-2 border-brand-green-400 bg-brand-green-50 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-brand-green-600" />
                <h2 className="text-lg font-semibold text-brand-green-800">Current Plan</h2>
              </div>
              <p className="mt-2 text-2xl font-bold capitalize text-brand-green-700">
                {subscription.plan}
              </p>
              <p className="mt-1 text-sm text-brand-green-600">
                {formatNaira(subscription.amount)}/month
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${
              subscription.status === 'active'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {subscription.status}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-brand-green-600">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Started: {format(new Date(subscription.start_date), 'MMM d, yyyy')}
            </span>
            <span className="flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Renews: {format(new Date(subscription.end_date), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border-2 border-brand-cream-300 bg-brand-cream-50 p-6">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-800">Free Plan</h2>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            You are currently on the free Basic plan with up to 5 listings.
          </p>
        </div>
      )}

      {/* Upgrade Options */}
      <h2 className="mt-10 text-xl font-semibold text-gray-900">
        {currentPlanName === 'enterprise' ? 'Your Plan' : 'Upgrade Your Plan'}
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRICING_PLANS.filter((p) => p.name.toLowerCase() !== 'basic').map((plan) => {
          const isCurrent = plan.name.toLowerCase() === currentPlanName
          return (
            <div
              key={plan.name}
              className={`relative rounded-xl border p-5 ${
                isCurrent
                  ? 'border-brand-green-400 bg-brand-green-50'
                  : plan.highlighted
                  ? 'border-brand-gold-400 bg-white shadow-md'
                  : 'border-brand-cream-300 bg-white'
              }`}
            >
              {plan.highlighted && !isCurrent && (
                <span className="absolute -top-2.5 left-4 rounded-full bg-brand-gold-400 px-2.5 py-0.5 text-xs font-bold text-brand-green-900">
                  <Star className="inline h-3 w-3" /> Popular
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-2.5 left-4 rounded-full bg-brand-green-600 px-2.5 py-0.5 text-xs font-bold text-white">
                  Current Plan
                </span>
              )}
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <p className="mt-1">
                <span className="text-2xl font-bold text-brand-green-700">{formatNaira(plan.price)}</span>
                <span className="text-sm text-gray-500">{plan.period}</span>
              </p>
              <ul className="mt-4 space-y-2">
                {plan.features.slice(0, 4).map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                className={`btn mt-4 w-full ${
                  isCurrent
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : plan.highlighted
                    ? 'btn-secondary'
                    : 'btn-outline'
                }`}
                disabled={isCurrent}
              >
                {isCurrent ? 'Current Plan' : 'Upgrade'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
