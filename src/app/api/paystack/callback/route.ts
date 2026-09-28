import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPurchasablePlan } from '@/constants/plans'
import { chargeCoversPlan, grantPaidPlan } from '@/lib/paystack'

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

    // Only plans sold online. 'free', 'enterprise' and the legacy ids are refused.
    const plan = getPurchasablePlan(planId)
    if (!plan) {
      return NextResponse.redirect(`${dashboardSubscription}?error=invalid_metadata`)
    }
    if (!chargeCoversPlan(plan, verifyData.data.amount, verifyData.data.currency)) {
      console.error('Paystack callback: amount does not cover plan', planId, 'ref', reference)
      return NextResponse.redirect(`${dashboardSubscription}?error=amount_mismatch`)
    }

    // The service role client is used deliberately. This route is reached by a
    // redirect back from Paystack, and if the visitor's session cookie has
    // expired in the meantime an anon client would be blocked by row level
    // security and the paid-for plan would never be granted. The payment has
    // already been verified against Paystack above, so the grant is trusted.
    // The webhook records the same reference and a visitor can reload this
    // URL; grantPaidPlan is idempotent for both.
    const result = await grantPaidPlan(createAdminClient(), {
      userId,
      plan,
      amountKobo: verifyData.data.amount,
      reference,
      customerCode: customer?.customer_code || null,
    })
    if (!result.ok) {
      console.error('Paystack callback: grant failed at', result.step, result.error)
      return NextResponse.redirect(`${dashboardSubscription}?error=subscription_creation_failed`)
    }

    return NextResponse.redirect(`${dashboardSubscription}?success=true`)
  } catch (error) {
    console.error('Paystack callback error:', error)
    return NextResponse.redirect(`${dashboardSubscription}?error=verification_failed`)
  }
}
