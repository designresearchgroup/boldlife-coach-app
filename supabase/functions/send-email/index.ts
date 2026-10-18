// The Bold Life sender — Supabase Edge Function (Deno).
// Our own email infra: sends broadcasts through Resend (the transport key is a
// secret here, never a third-party marketing SaaS). The client posts a subject,
// body and recipients; this fans out the sends.
//
// POST body: { subject, body, to: [{ email, name? }] }  ->  { sent, failed }
// Secrets (set on the project): RESEND_API_KEY, optional BOLD_FROM.

const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
// For real delivery to any address, verify theboldlifecoaching.com in Resend and
// set BOLD_FROM to e.g. "The Bold Life <hello@theboldlifecoaching.com>". Until
// then Resend's sandbox sender works for testing to your own verified address.
const FROM = Deno.env.get('BOLD_FROM') ?? 'The Bold Life <onboarding@resend.dev>'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, authorization'
}

function esc(s: string): string {
  return String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string))
}

// Plain-text body -> a simple on-brand HTML email.
function html(subject: string, body: string): string {
  const paras = esc(body)
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;line-height:1.6">${p.replace(/\n/g, '<br>')}</p>`)
    .join('')
  return `<!doctype html><html><body style="margin:0;background:#f7f3f0;padding:24px;font-family:Georgia,serif;color:#1b1512">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e7ded7;padding:32px">
    <div style="font-family:Arial,sans-serif;font-weight:800;letter-spacing:.02em;color:#DC343B;margin-bottom:20px">THE BOLD LIFE</div>
    <h1 style="font-family:Arial,sans-serif;font-size:20px;margin:0 0 18px">${esc(subject)}</h1>
    ${paras}
  </div></body></html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)
  if (!RESEND_KEY) return json({ error: 'sender not configured (RESEND_API_KEY missing)' }, 500)

  let body: { subject?: string; body?: string; to?: Array<{ email: string; name?: string }> } = {}
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad json' }, 400)
  }
  const subject = (body.subject || '').trim()
  const to = Array.isArray(body.to) ? body.to : []
  if (!subject || to.length === 0) return json({ error: 'need subject and recipients' }, 400)

  const content = html(subject, body.body || '')
  let sent = 0
  const failed: string[] = []
  for (const r of to) {
    if (!r?.email) continue
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({ from: FROM, to: [r.email], reply_to: 'Jamesyn@theboldlifecoaching.com', subject, html: content })
      })
      if (res.ok) sent++
      else failed.push(r.email)
    } catch {
      failed.push(r.email)
    }
  }
  return json({ sent, failed })
})

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, 'content-type': 'application/json' }
  })
}
