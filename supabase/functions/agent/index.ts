// The Bold Life agent — Supabase Edge Function (Deno).
// Her AI, on our own infra: the client calls this, this calls the foundation
// model (Anthropic) with the model key held here as a secret. The end user never
// sees "Claude" — it answers as The Bold Life assistant, in her voice.
//
// POST body: { skill?, prompt?, ask?, context? }  ->  { text }
// Secrets (set on the project): ANTHROPIC_API_KEY, optional AGENT_MODEL.

const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? ''
const MODEL = Deno.env.get('AGENT_MODEL') ?? 'claude-3-5-sonnet-20241022'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, authorization'
}

function sys(ctx: Record<string, unknown>): string {
  const coach = (ctx?.coach as string) || 'the coach'
  const program = (ctx?.program as string) || 'the coaching program'
  return [
    `You are the AI assistant for The Bold Life, a coaching business run by ${coach}.`,
    `You are HER assistant — warm, direct, encouraging, in a bold women-led voice. Never mention Claude, Anthropic, or that you are a general AI; you are "The Bold Life assistant."`,
    `You run the back office of a coaching business: find clients, market the skill, handle intake, schedule classes, write newsletters, and draft follow-ups.`,
    `Context: program = ${program}; clients = ${ctx?.clients ?? 'unknown'}; audience = ${ctx?.audience ?? 'unknown'}.`,
    `Be concrete and ready-to-use. When asked to write, write in her voice, short and human. Never invent client names, numbers, or results.`
  ].join(' ')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)
  if (!ANTHROPIC_KEY) return json({ error: 'agent not configured (ANTHROPIC_API_KEY missing)' }, 500)

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad json' }, 400)
  }
  const ctx = (body.context as Record<string, unknown>) || {}
  const task = (body.prompt as string) || (body.ask as string) || ''
  if (!task) return json({ error: 'nothing to do' }, 400)

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        system: sys(ctx),
        messages: [{ role: 'user', content: task }]
      })
    })
    if (!res.ok) {
      const t = await res.text()
      return json({ error: `model error ${res.status}`, detail: t.slice(0, 300) }, 502)
    }
    const data = await res.json()
    const text = (data?.content?.[0]?.text as string) || ''
    return json({ text })
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
