import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPurchasablePlan } from '@/constants/plans'
import { chargeCoversPlan, grantPaidPlan } from '@/lib/paystack'
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
        const { reference, metadata, customer, amount, currency } = event.data
        const userId = metadata?.user_id as string | undefined
        const planId = metadata?.plan_id as string | undefined

        // Not one of our subscription charges.
        if (!userId || !planId) break

        // Only plans sold online. 'free', 'enterprise' and the legacy ids are refused.
        const plan = getPurchasablePlan(planId)
        if (!plan) {
          console.error('Paystack webhook: unknown plan_id', planId, 'ref', reference)
          break
        }
        // Acknowledged with 200 so Paystack stops retrying; retrying cannot fix it.
        if (!chargeCoversPlan(plan, amount, currency)) {
          console.error('Paystack webhook: amount does not cover plan', planId, 'ref', reference)
          break
        }

        const result = await grantPaidPlan(supabase, {
          userId,
          plan,
          amountKobo: amount,
          reference,
          customerCode: customer?.customer_code || null,
        })
        if (!result.ok) {
          // Returning 500 makes Paystack retry, which is safe: every step is
          // idempotent. Swallowing this would leave a paying customer on Free.
          console.error('Paystack webhook: grant failed at', result.step, result.error)
          return NextResponse.json({ error: 'Grant failed' }, { status: 500 })
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

        // Fit the listings to whatever allowance is left (pauses the excess).
        const { error: allowanceError } = await supabase.rpc('apply_allowance', {
          p_user: sub[0].user_id,
        })
        if (allowanceError) {
          console.error('Paystack webhook: allowance after cancel failed', allowanceError)
          return NextResponse.json({ error: 'Allowance failed' }, { status: 500 })
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
