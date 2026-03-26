import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import type { AccountType } from '@/types/database'

function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) return false
  const hash = crypto.createHmac('sha512', secret).update(body).digest('hex')
  return hash === signature
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-paystack-signature')

    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(rawBody)

    // Create a Supabase client for webhook processing
    // Webhooks are server-to-server, so we use service-level auth via the server client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignored in webhook context
            }
          },
        },
      }
    )

    switch (event.event) {
      case 'charge.success': {
        const { reference, metadata, customer, amount } = event.data
        const userId = metadata?.user_id as string
        const planId = metadata?.plan_id as string

        if (!userId || !planId) break

        const accountType = planId as AccountType
        const startDate = new Date().toISOString()
        const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

        // Check if subscription already exists for this reference (idempotency)
        const { data: existing } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('paystack_reference', reference)
          .limit(1)

        if (!existing || existing.length === 0) {
          await supabase.from('subscriptions').insert({
            user_id: userId,
            plan: accountType,
            amount: amount / 100,
            start_date: startDate,
            end_date: endDate,
            status: 'active',
            paystack_reference: reference,
            paystack_subscription_code: null,
            paystack_customer_code: customer?.customer_code || null,
            paystack_plan_code: null,
          })

          await supabase
            .from('profiles')
            .update({ account_type: accountType })
            .eq('id', userId)
        }
        break
      }

      case 'subscription.create': {
        const { subscription_code, customer, plan } = event.data
        const customerCode = customer?.customer_code

        if (customerCode) {
          // Update existing subscription with subscription code
          await supabase
            .from('subscriptions')
            .update({
              paystack_subscription_code: subscription_code,
              paystack_plan_code: plan?.plan_code || null,
            })
            .eq('paystack_customer_code', customerCode)
            .eq('status', 'active')
        }
        break
      }

      case 'subscription.disable': {
        const { subscription_code } = event.data

        if (subscription_code) {
          await supabase
            .from('subscriptions')
            .update({ status: 'cancelled' })
            .eq('paystack_subscription_code', subscription_code)

          // Also reset profile account_type to basic
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('paystack_subscription_code', subscription_code)
            .limit(1)

          if (sub && sub.length > 0) {
            await supabase
              .from('profiles')
              .update({ account_type: 'basic' as AccountType })
              .eq('id', sub[0].user_id)
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
