import type { PricingPlan } from '@/constants/pricing'

/**
 * Paystack amounts are in kobo. Anyone holding the public key can start a
 * transaction with any amount and any metadata, so a successful charge only
 * proves that someone paid something. A plan is granted only when the charge
 * was in naira and covers the plan price.
 */
export function chargeCoversPlan(
  plan: PricingPlan,
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
