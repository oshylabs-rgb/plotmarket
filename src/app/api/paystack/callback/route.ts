import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPlanByPlanId } from '@/constants/pricing'
import type { AccountType } from '@/types/database'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get('reference') || searchParams.get('trxref')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const dashboardSubscription = `${appUrl}/dashboard/subscription`

  if (!reference) {
    return NextResponse.redirect(`${dashboardSubscription}?error=missing_reference`)
  }

  try {
    // Verify payment with Paystack
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    )

    const verifyData = await verifyResponse.json()

    if (!verifyData.status || verifyData.data.status !== 'success') {
      return NextResponse.redirect(`${dashboardSubscription}?error=payment_failed`)
    }

    const { metadata, customer } = verifyData.data
    const userId = metadata?.user_id as string
    const planId = metadata?.plan_id as string

    if (!userId || !planId) {
      return NextResponse.redirect(`${dashboardSubscription}?error=invalid_metadata`)
    }

    // Only plans that can actually be bought online may be granted here.
    const plan = getPlanByPlanId(planId)
    if (!plan || planId === 'free' || planId === 'enterprise') {
      return NextResponse.redirect(`${dashboardSubscription}?error=invalid_metadata`)
    }
    const accountType = plan.planId as AccountType

    // The service role client is used deliberately. This route is reached by a
    // redirect back from Paystack, and if the visitor's session cookie has
    // expired in the meantime an anon client would be blocked by row level
    // security and the paid-for plan would never be granted. The payment has
    // already been verified against Paystack above, so the grant is trusted.
    const supabase = createAdminClient()

    // The webhook records the same reference, and a visitor can reload this
    // URL. Without this check either would create a duplicate subscription.
    const { data: existing, error: lookupError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('paystack_reference', reference)
      .limit(1)

    if (lookupError) {
      console.error('Error looking up subscription:', lookupError)
      return NextResponse.redirect(`${dashboardSubscription}?error=subscription_creation_failed`)
    }

    if (!existing || existing.length === 0) {
      const { error: subError } = await supabase.from('subscriptions').insert({
        user_id: userId,
        plan: accountType,
        amount: verifyData.data.amount / 100, // Convert kobo back to Naira
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        paystack_reference: reference,
        paystack_subscription_code: null,
        paystack_customer_code: customer?.customer_code || null,
        paystack_plan_code: null,
      })

      if (subError) {
        console.error('Error creating subscription:', subError)
        return NextResponse.redirect(`${dashboardSubscription}?error=subscription_creation_failed`)
      }
    }

    // Update user profile account_type
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ account_type: accountType })
      .eq('id', userId)

    if (profileError) {
      console.error('Error upgrading profile:', profileError)
      return NextResponse.redirect(`${dashboardSubscription}?error=subscription_creation_failed`)
    }

    return NextResponse.redirect(`${dashboardSubscription}?success=true`)
  } catch (error) {
    console.error('Paystack callback error:', error)
    return NextResponse.redirect(`${dashboardSubscription}?error=verification_failed`)
  }
}
