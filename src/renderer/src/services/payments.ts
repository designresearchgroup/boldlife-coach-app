// Monetization. Demo mode simulates a successful Stripe Checkout round-trip so
// enrollment works end to end with no account. Production redirects to Stripe
// Checkout (or opens it in the system browser under Electron) behind this call.
import { stripeConfigured } from './env'

export interface CheckoutItem {
  id: string
  name: string
  price: number // USD, whole dollars
}

export interface CheckoutResult {
  ok: boolean
  ref: string
  mode: 'demo' | 'live'
}

export async function checkout(item: CheckoutItem): Promise<CheckoutResult> {
  if (stripeConfigured) {
    // Production path (wired when VITE_STRIPE_PUBLISHABLE_KEY is set): create a
    // Checkout Session server-side and redirect. Intentionally not reachable in
    // demo builds.
    throw new Error('Live Stripe checkout is not configured in this build.')
  }
  // DEMO: pretend to process the card. No money moves; the entitlement unlocks.
  await new Promise((r) => setTimeout(r, 1200))
  return { ok: true, ref: 'demo_' + Math.random().toString(36).slice(2, 10), mode: 'demo' }
}

export const paymentsMode = (): 'demo' | 'live' => (stripeConfigured ? 'live' : 'demo')
