// The Bold Life checkout — Supabase Edge Function (Deno).
// Creates a Stripe Checkout Session server-side (the secret key is held here, as a
// project secret) and returns its URL for the client to redirect to. Our own infra;
// the Stripe secret never touches the client.
//
// POST body: { item: { id, name, price }, success_url?, cancel_url?, mode? }
//   price is whole USD; mode 'payment' (one-time, default) or 'subscription'.
// Secret (set on the project): STRIPE_SECRET_KEY.

const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? ''

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, authorization'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)
  if (!STRIPE_KEY) return json({ error: 'checkout not configured (STRIPE_SECRET_KEY missing)' }, 500)

  let body: {
    item?: { id?: string; name?: string; price?: number }
    success_url?: string
    cancel_url?: string
    mode?: string
    interval?: string
  } = {}
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad json' }, 400)
  }
  const item = body.item || {}
  const price = Math.round(Number(item.price) * 100)
  if (!item.name || !price || price < 50) return json({ error: 'need item name + price' }, 400)
  const mode = body.mode === 'subscription' ? 'subscription' : 'payment'

  // Stripe's API is form-encoded.
  const form = new URLSearchParams()
  form.set('mode', mode)
  form.set('success_url', body.success_url || 'https://designresearchgroup.github.io/boldlife-coach-app/?enrolled=1')
  form.set('cancel_url', body.cancel_url || 'https://designresearchgroup.github.io/boldlife-coach-app/')
  form.set('line_items[0][quantity]', '1')
  form.set('line_items[0][price_data][currency]', 'usd')
  form.set('line_items[0][price_data][product_data][name]', item.name)
  form.set('line_items[0][price_data][unit_amount]', String(price))
  if (mode === 'subscription') {
    form.set('line_items[0][price_data][recurring][interval]', body.interval === 'year' ? 'year' : 'month')
  }

  try {
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_KEY}`,
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: form.toString()
    })
    const data = await res.json()
    if (!res.ok) return json({ error: data?.error?.message || `stripe ${res.status}` }, 502)
    return json({ url: data.url, id: data.id })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, 'content-type': 'application/json' }
  })
}
