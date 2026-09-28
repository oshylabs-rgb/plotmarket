import type { SupabaseClient } from '@supabase/supabase-js'
import type { PurchasablePlan } from '@/constants/plans'

/**
 * Paystack amounts are in kobo. Anyone holding the public key can start a
 * transaction with any amount and any metadata, so a successful charge only
 * proves that someone paid something. A plan is granted only when the charge
 * was in naira and covers the plan price.
 */
export function chargeCoversPlan(
  plan: PurchasablePlan,
  amountKobo: unknown,
  currency: unknown
): boolean {
  return (
    currency === 'NGN' &&
    typeof amountKobo === 'number' &&
    Number.isFinite(amountKobo) &&
    amountKobo >= plan.price * 100
  )
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Record a verified payment and give the seller the plan. Called by both the
 * webhook and the browser callback with the service role client, and safe to
 * run any number of times for the same reference: Paystack retries, and the
 * callback and webhook race each other.
 *
 * A payment made while a period is still running starts when that period
 * ends, so paying early extends rather than overlaps.
 */
export async function grantPaidPlan(
  supabase: SupabaseClient,
  args: {
    userId: string
    plan: PurchasablePlan
    amountKobo: number
    reference: string
    customerCode: string | null
  }
): Promise<{ ok: true } | { ok: false; step: string; error: unknown }> {
  const { userId, plan, amountKobo, reference, customerCode } = args

  const { data: existing, error: lookupError } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('paystack_reference', reference)
    .limit(1)
  if (lookupError) return { ok: false, step: 'lookup', error: lookupError }

  if (!existing || existing.length === 0) {
    const { data: current, error: currentError } = await supabase
      .from('subscriptions')
      .select('end_date')
      .eq('user_id', userId)
      .eq('plan', plan.planId)
      .eq('status', 'active')
      .gt('end_date', new Date().toISOString())
      .order('end_date', { ascending: false })
      .limit(1)
    if (currentError) return { ok: false, step: 'current', error: currentError }

    const start = current?.[0]?.end_date ? new Date(current[0].end_date) : new Date()
    const end = new Date(start.getTime() + plan.periodDays * DAY_MS)

    const { error: insertError } = await supabase.from('subscriptions').insert({
      user_id: userId,
      plan: plan.planId,
      amount: amountKobo / 100,
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      status: 'active',
      paystack_reference: reference,
      paystack_subscription_code: null,
      paystack_customer_code: customerCode,
      paystack_plan_code: null,
    })
    // 23505: the other of callback/webhook recorded it first. That is success.
    if (insertError && (insertError as { code?: string }).code !== '23505') {
      return { ok: false, step: 'insert', error: insertError }
    }
  }

  // Display cache only; entitlements come from the subscription row.
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ account_type: plan.planId })
    .eq('id', userId)
  if (profileError) return { ok: false, step: 'profile', error: profileError }

  // Bring back listings that were paused for being over the old allowance.
  const { error: allowanceError } = await supabase.rpc('apply_allowance', { p_user: userId })
  if (allowanceError) return { ok: false, step: 'allowance', error: allowanceError }

  return { ok: true }
}
