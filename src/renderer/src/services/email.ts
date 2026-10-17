// Email / newsletter engine — our own send infra, no third-party ESP.
// Contacts, broadcasts and sequences are stored in the app (and sync to our own
// Supabase in production). Actual delivery goes through OUR Supabase Edge Function
// (VITE_EMAIL_FUNCTION_URL), which holds the transport secret (e.g. SES/Resend)
// server-side — never a marketing SaaS like Mailchimp/ConvertKit. Unconfigured,
// broadcasts queue locally and the UI says the transport isn't connected yet.

export interface Contact {
  id: string
  email: string
  name?: string
  tags: string[]
  at: number
}

export interface Broadcast {
  id: string
  subject: string
  body: string
  audience: string // 'all' or a tag
  status: 'draft' | 'sent' | 'queued'
  at: number
  sentAt?: number
  recipients?: number
}

export interface SequenceStep {
  id: string
  waitDays: number
  subject: string
  body: string
}

export interface Sequence {
  id: string
  name: string
  trigger: 'enrolled' | 'lesson-complete' | 'manual'
  steps: SequenceStep[]
  active: boolean
  at: number
}

const FUNCTION_URL = (import.meta.env.VITE_EMAIL_FUNCTION_URL as string | undefined) || ''

export const emailTransportConfigured = (): boolean => !!FUNCTION_URL

export function audienceFor(contacts: Contact[], audience: string): Contact[] {
  if (!audience || audience === 'all') return contacts
  return contacts.filter((c) => c.tags.includes(audience))
}

export interface SendResult {
  ok: boolean
  sent: number
  queued: number
  transport: boolean
  error?: string
}

// Send a broadcast to its audience through our own Edge Function. With no
// transport configured it reports the recipients as queued (honest: nothing left
// the building) so the UI can prompt to connect the sender.
export async function sendBroadcast(b: Broadcast, recipients: Contact[]): Promise<SendResult> {
  if (!emailTransportConfigured()) {
    return { ok: false, sent: 0, queued: recipients.length, transport: false }
  }
  try {
    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        subject: b.subject,
        body: b.body,
        to: recipients.map((c) => ({ email: c.email, name: c.name || '' }))
      })
    })
    if (!res.ok) return { ok: false, sent: 0, queued: recipients.length, transport: true, error: 'send failed (' + res.status + ')' }
    return { ok: true, sent: recipients.length, queued: 0, transport: true }
  } catch (e) {
    return { ok: false, sent: 0, queued: recipients.length, transport: true, error: String(e) }
  }
}

// Starter content so a coach isn't staring at a blank box.
export const TEMPLATES: Array<{ name: string; subject: string; body: string }> = [
  {
    name: 'Welcome',
    subject: 'Welcome to {{program}} 💛',
    body:
      'Hi {{name}},\n\nI am so glad you are here. Over the next few weeks we will build real momentum together — one bold step at a time.\n\nYour first lesson is waiting inside the app. Jump in whenever you are ready.\n\n— {{coach}}'
  },
  {
    name: 'Weekly newsletter',
    subject: 'This week in {{program}}',
    body:
      'Hi {{name}},\n\nHere is what is new this week:\n\n• A new lesson is live\n• One bold action to try\n• A reminder that you are exactly where you need to be\n\nSee you inside,\n{{coach}}'
  },
  {
    name: 'Re-engage',
    subject: 'Still with me?',
    body:
      'Hi {{name}},\n\nIt has been a minute. No guilt — life happens. Your next lesson takes ten minutes and picks up right where you left off.\n\nWhenever you are ready,\n{{coach}}'
  }
]

export function rid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
