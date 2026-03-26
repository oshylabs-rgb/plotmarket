import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

    const supabase = await createClient()

    // Calculate subscription dates (1 month from now)
    const startDate = new Date().toISOString()
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    // Map planId to AccountType
    const accountType = planId as AccountType

    // Create or update subscription
    const { error: subError } = await supabase.from('subscriptions').insert({
      user_id: userId,
      plan: accountType,
      amount: verifyData.data.amount / 100, // Convert kobo back to Naira
      start_date: startDate,
      end_date: endDate,
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

    // Update user profile account_type
    await supabase
      .from('profiles')
      .update({ account_type: accountType })
      .eq('id', userId)

    return NextResponse.redirect(`${dashboardSubscription}?success=true`)
  } catch (error) {
    console.error('Paystack callback error:', error)
    return NextResponse.redirect(`${dashboardSubscription}?error=verification_failed`)
  }
}
