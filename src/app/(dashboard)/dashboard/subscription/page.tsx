'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check, Star, CreditCard, Calendar, AlertCircle, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { PRICING_PLANS } from '@/constants/pricing'
import { formatNaira } from '@/lib/utils'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import type { Subscription } from '@/types/database'

function SubscriptionContent() {
  const { user, profile, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribingPlan, setSubscribingPlan] = useState<string | null>(null)

  const successParam = searchParams.get('success')
  const errorParam = searchParams.get('error')

  useEffect(() => {
    if (!user) return

    const fetchSubscription = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)

      setSubscription(data?.[0] || null)
      setLoading(false)
    }

    fetchSubscription()
  }, [user])

  const handleSubscribe = async (planId: string) => {
    if (!user) return
    setSubscribingPlan(planId)

    try {
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })

      const data = await response.json()

      if (data.authorization_url) {
        // Redirect to Paystack checkout
        window.location.href = data.authorization_url
      } else {
        alert(data.error || 'Failed to initialize payment')
        setSubscribingPlan(null)
      }
    } catch {
      alert('An error occurred. Please try again.')
      setSubscribingPlan(null)
    }
  }

  const handleCancelSubscription = async () => {
    if (!subscription) return
    if (!confirm('Are you sure you want to cancel your subscription?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', subscription.id)

    if (!error) {
      await supabase
        .from('profiles')
        .update({ account_type: 'basic' })
        .eq('id', user!.id)

      setSubscription(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green-600" />
      </div>
    )
  }

  const currentPlanId = subscription?.plan || profile?.account_type || 'basic'

  // Map old 'basic' account type to 'free' planId for comparison
  const currentPlanKey = currentPlanId === 'basic' ? 'free' : currentPlanId

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
      <p className="mt-1 text-gray-500">Manage your subscription and billing</p>

      {/* Success Banner */}
      {successParam === 'true' && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>Payment successful! Your subscription is now active.</span>
        </div>
      )}

      {/* Error Banner */}
      {errorParam && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <XCircle className="h-5 w-5 shrink-0" />
          <span>
            {errorParam === 'payment_failed'
              ? 'Payment failed. Please try again.'
              : errorParam === 'missing_reference'
              ? 'Payment reference missing. Please contact support.'
              : errorParam === 'invalid_metadata'
              ? 'Invalid payment data. Please contact support.'
              : errorParam === 'subscription_creation_failed'
              ? 'Payment was received but subscription setup failed. Please contact support.'
              : `An error occurred: ${errorParam}`}
          </span>
        </div>
      )}

      {/* Current Plan */}
      {subscription && subscription.status === 'active' ? (
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
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium capitalize text-green-700">
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
          <button
            onClick={handleCancelSubscription}
            className="mt-4 text-sm text-red-600 hover:text-red-700 underline"
          >
            Cancel Subscription
          </button>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border-2 border-brand-cream-300 bg-brand-cream-50 p-6">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-800">Free Plan</h2>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            You are currently on the free plan with up to 3 listings.
          </p>
        </div>
      )}

      {/* Upgrade Options */}
      <h2 className="mt-10 text-xl font-semibold text-gray-900">
        {currentPlanKey === 'enterprise' ? 'Your Plan' : 'Upgrade Your Plan'}
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRICING_PLANS.filter((p) => p.planId !== 'free').map((plan) => {
          const isCurrent = plan.planId === currentPlanKey
          const isEnterprise = plan.planId === 'enterprise'
          const isSubscribing = subscribingPlan === plan.planId

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
                {isEnterprise ? (
                  <span className="text-2xl font-bold text-brand-green-700">Custom</span>
                ) : (
                  <>
                    <span className="text-2xl font-bold text-brand-green-700">
                      {formatNaira(plan.price)}
                    </span>
                    <span className="text-sm text-gray-500">{plan.period}</span>
                  </>
                )}
              </p>
              <ul className="mt-4 space-y-2">
                {plan.features.slice(0, 4).map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              {isEnterprise ? (
                <a
                  href="mailto:sales@plotmarket.ng"
                  className="btn btn-outline mt-4 w-full text-center"
                >
                  Contact Sales
                </a>
              ) : (
                <button
                  className={`btn mt-4 w-full ${
                    isCurrent
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : plan.highlighted
                      ? 'btn-secondary'
                      : 'btn-outline'
                  }`}
                  disabled={isCurrent || isSubscribing}
                  onClick={() => handleSubscribe(plan.planId)}
                >
                  {isSubscribing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redirecting...
                    </span>
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : (
                    'Subscribe'
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-green-600" />
        </div>
      }
    >
      <SubscriptionContent />
    </Suspense>
  )
}
