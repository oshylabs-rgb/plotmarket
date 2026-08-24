import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPlanByPlanId } from '@/constants/pricing'
import type { AccountType } from '@/types/database'

/**
 * Constant time comparison. A plain === leaks how much of the digest matched
 * through its timing, which is exactly what an attacker forging a signature
 * would measure.
 */
function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) return false

  const expected = crypto.createHmac('sha512', secret).update(body).digest('hex')
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(signature, 'utf8')
  // timingSafeEqual throws on a length mismatch, so check length first.
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

/**
 * Only plans that can actually be bought online may be granted by a webhook.
 * 'free' is not an account type and 'enterprise' is sold by hand.
 */
function resolvePurchasablePlan(planId: string): AccountType | null {
  if (planId === 'free' || planId === 'enterprise') return null
  const plan = getPlanByPlanId(planId)
  if (!plan) return null
  return plan.planId as AccountType
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-paystack-signature')

    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(rawBody)

    // Paystack calls this server to server, so the request carries no auth
    // cookies. The service role client is required, an anon key client would
    // be blocked by row level security on every write below.
    const supabase = createAdminClient()

    switch (event.event) {
      case 'charge.success': {
        const { reference, metadata, customer, amount } = event.data
        const userId = metadata?.user_id as string | undefined
        const planId = metadata?.plan_id as string | undefined

        // Not one of our subscription charges.
        if (!userId || !planId) break

        const accountType = resolvePurchasablePlan(planId)
        if (!accountType) {
          console.error('Paystack webhook: unknown plan_id', planId, 'ref', reference)
          break
        }

        // Idempotency. Paystack retries, and the callback route records the
        // same reference, so this can legitimately run more than once.
        const { data: existing, error: lookupError } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('paystack_reference', reference)
          .limit(1)

        if (lookupError) {
          console.error('Paystack webhook: subscription lookup failed', lookupError)
          return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
        }

        if (existing && existing.length > 0) break

        const { error: insertError } = await supabase.from('subscriptions').insert({
          user_id: userId,
          plan: accountType,
          amount: amount / 100,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + THIRTY_DAYS_MS).toISOString(),
          status: 'active',
          paystack_reference: reference,
          paystack_subscription_code: null,
          paystack_customer_code: customer?.customer_code || null,
          paystack_plan_code: null,
        })

        if (insertError) {
          // Returning 500 makes Paystack retry. Swallowing this would leave a
          // paying customer on the free plan with nothing in the logs.
          console.error('Paystack webhook: subscription insert failed', insertError)
          return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .update({ account_type: accountType })
          .eq('id', userId)

        if (profileError) {
          console.error('Paystack webhook: profile upgrade failed', profileError)
          return NextResponse.json({ error: 'Profile update failed' }, { status: 500 })
        }
        break
      }

      case 'subscription.create': {
        const { subscription_code, customer, plan } = event.data
        const customerCode = customer?.customer_code
        if (!customerCode) break

        const { error } = await supabase
          .from('subscriptions')
          .update({
            paystack_subscription_code: subscription_code,
            paystack_plan_code: plan?.plan_code || null,
          })
          .eq('paystack_customer_code', customerCode)
          .eq('status', 'active')

        if (error) {
          console.error('Paystack webhook: subscription.create update failed', error)
          return NextResponse.json({ error: 'Update failed' }, { status: 500 })
        }
        break
      }

      case 'subscription.disable': {
        const { subscription_code } = event.data
        if (!subscription_code) break

        // Read the owner before cancelling, so the row is still identifiable.
        const { data: sub, error: subLookupError } = await supabase
          .from('subscriptions')
          .select('id, user_id')
          .eq('paystack_subscription_code', subscription_code)
          .limit(1)

        if (subLookupError) {
          console.error('Paystack webhook: disable lookup failed', subLookupError)
          return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
        }
        if (!sub || sub.length === 0) break

        const { error: cancelError } = await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('paystack_subscription_code', subscription_code)

        if (cancelError) {
          console.error('Paystack webhook: cancel failed', cancelError)
          return NextResponse.json({ error: 'Cancel failed' }, { status: 500 })
        }

        // Only drop the account back to basic if nothing else is still active,
        // otherwise cancelling one of two plans would downgrade a paying user.
        const { data: stillActive, error: activeError } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', sub[0].user_id)
          .eq('status', 'active')
          .limit(1)

        if (activeError) {
          console.error('Paystack webhook: active check failed', activeError)
          return NextResponse.json({ error: 'Active check failed' }, { status: 500 })
        }

        if (!stillActive || stillActive.length === 0) {
          const { error: downgradeError } = await supabase
            .from('profiles')
            .update({ account_type: 'basic' as AccountType })
            .eq('id', sub[0].user_id)

          if (downgradeError) {
            console.error('Paystack webhook: downgrade failed', downgradeError)
            return NextResponse.json({ error: 'Downgrade failed' }, { status: 500 })
          }
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
