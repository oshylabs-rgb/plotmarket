'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Check, CreditCard, Calendar, Loader2, CheckCircle, XCircle, Building2, Info } from 'lucide-react'
import { format } from 'date-fns'
import { BUSINESS_PLAN, LISTING_LIMITS, PILOT_DAYS, PILOT_EXPIRY_TERMS, PUBLIC_PLANS, planName } from '@/constants/plans'
import { NIGERIAN_STATES } from '@/constants/states'
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_HREF } from '@/constants/contact'
import { formatNaira } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { usePlanStatus } from '@/hooks/usePlanStatus'

const PAYMENT_ERRORS: Record<string, string> = {
  payment_failed: 'The payment did not go through, so nothing was charged and your plan has not changed.',
  missing_reference: 'We could not match that payment. Nothing has changed. If you were charged, email us with the Paystack receipt.',
  invalid_metadata: 'We could not match that payment to a plan. If you were charged, email us with the Paystack receipt.',
  amount_mismatch: 'The amount paid does not match the plan price, so the plan was not activated. Email us with the Paystack receipt.',
  subscription_creation_failed: 'Your payment was received but we could not switch your plan on. It will retry automatically; if it has not changed within an hour, email us.',
  verification_failed: 'We could not confirm the payment with Paystack. If you were charged, it will be applied automatically once Paystack confirms it.',
}

const businessCopy = PUBLIC_PLANS.find((p) => p.key === 'professional')!
const pilotCopy = PUBLIC_PLANS.find((p) => p.key === 'pilot')!

function PlanContent() {
  const { user, profile, loading: authLoading } = useAuth()
  const { status, loading: planLoading, error: planError, refresh } = usePlanStatus(user?.id)
  const searchParams = useSearchParams()
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')

  const successParam = searchParams.get('success')
  const errorParam = searchParams.get('error')

  const handleBuyBusiness = async () => {
    setPaying(true)
    setPayError('')
    try {
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: BUSINESS_PLAN.planId }),
      })
      const data = await response.json()
      if (data.authorization_url) {
        window.location.assign(data.authorization_url)
        return
      }
      setPayError(data.error || 'Could not start the payment. Nothing was charged.')
    } catch {
      setPayError('Could not reach the payment page. Nothing was charged. Please try again.')
    }
    setPaying(false)
  }

  if (authLoading || planLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green-600" />
      </div>
    )
  }

  if (!status) {
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        We could not load your plan. {planError}
      </div>
    )
  }

  const limitLabel =
    status.max_active === null ? 'No limit' : `${status.active_count} of ${status.max_active} active listings`
  const showBusinessOffer = status.plan !== 'enterprise'

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Plan</h1>
      <p className="mt-1 text-gray-500">What you can list, and what happens next.</p>

      {successParam === 'true' && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>Payment received. Business is active, and any listings paused for the old limit are live again.</span>
        </div>
      )}
      {errorParam && (
        <div role="alert" className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <XCircle className="h-5 w-5 shrink-0" />
          <span>{PAYMENT_ERRORS[errorParam] ?? 'Something went wrong with the payment. Nothing has changed.'}</span>
        </div>
      )}

      {/* Current plan */}
      <section className="mt-6 rounded-xl border-2 border-brand-green-400 bg-brand-green-50 p-6" aria-labelledby="current-plan">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-brand-green-600" />
          <h2 id="current-plan" className="text-lg font-semibold text-brand-green-800">Current plan</h2>
        </div>
        <p className="mt-2 text-2xl font-bold text-brand-green-700">{planName(status.plan)}</p>
        <p className="mt-1 text-sm text-brand-green-700">{limitLabel}</p>
        {status.paused_count > 0 && (
          <p className="mt-1 text-sm text-brand-green-700">
            {status.paused_count} paused {status.paused_count === 1 ? 'listing is' : 'listings are'} hidden
            from buyers but kept. <Link href="/dashboard/listings" className="underline">Manage listings</Link>
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-brand-green-700">
          {status.paid_until && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {planName(status.paid_plan)} paid until {format(new Date(status.paid_until), 'd MMM yyyy')}
            </span>
          )}
          {status.plan === 'pilot' && status.pilot_ends_at && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Pilot ends {format(new Date(status.pilot_ends_at), "d MMM yyyy, HH:mm")}
            </span>
          )}
        </div>
        {status.paid_until && (
          <p className="mt-3 text-sm text-brand-green-700">
            Paid plans do not renew or charge you automatically. Pay again before the end date to extend by{' '}
            {BUSINESS_PLAN.periodDays} days from that date.
          </p>
        )}
        {status.plan === 'pilot' && (
          <p className="mt-3 text-sm text-brand-green-700">
            Pilot listings must be in {status.pilot_project_name}, {status.pilot_project_state}. {PILOT_EXPIRY_TERMS}
          </p>
        )}
      </section>

      {/* Business */}
      {showBusinessOffer && (
        <section className="mt-8 rounded-xl border border-brand-gold-400 bg-white p-6 shadow-sm" aria-labelledby="business-plan">
          <h2 id="business-plan" className="text-lg font-semibold text-gray-900">{BUSINESS_PLAN.name}</h2>
          <p className="mt-1">
            <span className="text-2xl font-bold text-brand-green-700">{formatNaira(BUSINESS_PLAN.price)}</span>
            <span className="text-sm text-gray-500"> per {BUSINESS_PLAN.periodDays} days</span>
          </p>
          <ul className="mt-4 space-y-2">
            {businessCopy.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-500" />
                {feature}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-gray-500">
            Paystack processes the card or transfer for this plan fee only. Plotmarket does not take, hold or
            protect payments for property.
          </p>
          {payError && (
            <p role="alert" className="mt-3 text-sm text-red-600">{payError}</p>
          )}
          <button
            type="button"
            className="btn btn-secondary mt-4 w-full sm:w-auto"
            disabled={paying}
            onClick={handleBuyBusiness}
          >
            {paying ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Opening Paystack...
              </span>
            ) : status.paid_until ? (
              `Extend by ${BUSINESS_PLAN.periodDays} days`
            ) : (
              `Pay ${formatNaira(BUSINESS_PLAN.price)} for ${BUSINESS_PLAN.periodDays} days`
            )}
          </button>
        </section>
      )}

      {/* Founding Developer Pilot */}
      {status.plan !== 'enterprise' && (
        <PilotSection
          userId={user!.id}
          defaultCompany={profile?.company_name ?? ''}
          defaultCac={profile?.cac_number ?? ''}
          pilotStatus={status.pilot_status}
          pilotEndsAt={status.pilot_ends_at}
          projectName={status.pilot_project_name}
          onRequested={refresh}
        />
      )}

      <p className="mt-10 text-sm text-gray-500">
        Larger volumes?{' '}
        <a href={`mailto:${CONTACT_EMAIL}?subject=Plotmarket%20volume%20listing`} className="text-brand-green-700 underline">
          Talk to us
        </a>{' '}
        or call{' '}
        <a href={CONTACT_PHONE_HREF} className="tabular whitespace-nowrap text-brand-green-700 underline">
          {CONTACT_PHONE}
        </a>
        .
      </p>
    </div>
  )
}

function PilotSection({
  userId,
  defaultCompany,
  defaultCac,
  pilotStatus,
  pilotEndsAt,
  projectName,
  onRequested,
}: {
  userId: string
  defaultCompany: string
  defaultCac: string
  pilotStatus: string | null
  pilotEndsAt: string | null
  projectName: string | null
  onRequested: () => void
}) {
  const [form, setForm] = useState({
    company_name: defaultCompany,
    cac_number: defaultCac,
    project_name: '',
    project_state: '',
    project_area: '',
  })
  const [accepted, setAccepted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accepted) {
      setError('Please confirm you have read what happens when the pilot ends.')
      return
    }
    setSaving(true)
    setError('')
    const { error: insertError } = await createClient()
      .from('pilots')
      .insert({ user_id: userId, ...form, project_area: form.project_area || null })
    setSaving(false)
    if (insertError) {
      setError(
        insertError.code === '23505'
          ? 'This account or company has already had a pilot request. Email us if you think that is wrong.'
          : insertError.message
      )
      return
    }
    onRequested()
  }

  const update = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  return (
    <section id="pilot" className="mt-8 rounded-xl border border-brand-cream-300 bg-white p-6 shadow-sm" aria-labelledby="pilot-heading">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-brand-green-600" />
        <h2 id="pilot-heading" className="text-lg font-semibold text-gray-900">{pilotCopy.name}</h2>
      </div>
      <p className="mt-2 text-sm text-gray-600">{pilotCopy.summary}</p>

      {pilotStatus === 'requested' && (
        <p className="mt-4 rounded-lg bg-brand-gold-50 px-4 py-3 text-sm text-brand-gold-800">
          Request received for {projectName}. We review every request by hand and will email you. Nothing
          changes on your account until a pilot is approved.
        </p>
      )}
      {pilotStatus === 'active' && pilotEndsAt && (
        <p className="mt-4 rounded-lg bg-brand-green-50 px-4 py-3 text-sm text-brand-green-800">
          Your pilot for {projectName} is active until {format(new Date(pilotEndsAt), "d MMM yyyy, HH:mm")}.
        </p>
      )}
      {(pilotStatus === 'expired' || pilotStatus === 'revoked') && (
        <p className="mt-4 rounded-lg bg-brand-cream-100 px-4 py-3 text-sm text-gray-700">
          Your pilot {pilotStatus === 'expired' ? 'ended' : 'was ended'}
          {pilotEndsAt ? ` on ${format(new Date(pilotEndsAt), 'd MMM yyyy')}` : ''}. Each company can have one pilot.
          Your listings and data are kept; upgrade to Business to bring paused listings back.
        </p>
      )}
      {pilotStatus === 'rejected' && (
        <p className="mt-4 rounded-lg bg-brand-cream-100 px-4 py-3 text-sm text-gray-700">
          Your pilot request was not approved this time. You can keep listing on Free Starter or Business.
        </p>
      )}

      {!pilotStatus && (
        <form onSubmit={submit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-gray-700">
              Company name
              <input name="company_name" value={form.company_name} onChange={update} className="input-field mt-1" required />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              CAC registration number
              <input name="cac_number" value={form.cac_number} onChange={update} className="input-field mt-1" required />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Estate or project name
              <input name="project_name" value={form.project_name} onChange={update} className="input-field mt-1" required />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              State
              <select name="project_state" value={form.project_state} onChange={update} className="input-field mt-1" required>
                <option value="">Select state</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
              Area (optional)
              <input name="project_area" value={form.project_area} onChange={update} className="input-field mt-1" placeholder="e.g. Sangotedo" />
            </label>
          </div>

          <div className="rounded-lg bg-brand-cream-50 p-4 text-sm text-gray-700">
            <p className="flex items-start gap-2 font-medium text-gray-900">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-600" />
              What happens when the pilot ends
            </p>
            <p className="mt-2">{PILOT_EXPIRY_TERMS}</p>
            <p className="mt-2">
              The pilot covers up to {LISTING_LIMITS.pilot} active listings in the one estate you name here, for{' '}
              {PILOT_DAYS} days from the day we approve it. It includes one
              assisted setup session with our team. Each company can have one pilot.
            </p>
            <label className="mt-3 flex items-start gap-2">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1" />
              <span>I have read what happens when the pilot ends.</span>
            </label>
          </div>

          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Sending...' : 'Request a pilot'}
          </button>
        </form>
      )}
    </section>
  )
}

export default function PlanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-green-600" />
        </div>
      }
    >
      <PlanContent />
    </Suspense>
  )
}
