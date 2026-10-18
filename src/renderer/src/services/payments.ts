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
    // Live path: our own stripe-checkout Edge Function creates the Checkout
    // Session (secret key server-side) and returns its URL; we redirect to it.
    const base = (import.meta.env.VITE_SUPABASE_URL as string) || ''
    const res = await fetch(`${base}/functions/v1/stripe-checkout`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ item })
    })
    const data = await res.json().catch(() => ({}) as { url?: string; id?: string; error?: string })
    if (!res.ok || !data.url) throw new Error(data.error || 'Checkout failed.')
    // Web redirects in place; the desktop app opens the system browser.
    window.location.href = data.url
    return { ok: true, ref: data.id || 'live', mode: 'live' }
  }
  // DEMO: pretend to process the card. No money moves; the entitlement unlocks.
  await new Promise((r) => setTimeout(r, 1200))
  return { ok: true, ref: 'demo_' + Math.random().toString(36).slice(2, 10), mode: 'demo' }
}

export const paymentsMode = (): 'demo' | 'live' => (stripeConfigured ? 'live' : 'demo')
