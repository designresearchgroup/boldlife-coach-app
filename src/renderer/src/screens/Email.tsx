import { useMemo, useState } from 'react'
import { useStore } from '@renderer/state/store'
import { Icon } from '@renderer/components/Icon'
import {
  audienceFor,
  sendBroadcast,
  emailTransportConfigured,
  TEMPLATES,
  rid,
  type Broadcast,
  type SequenceStep
} from '@renderer/services/email'

type Tab = 'broadcasts' | 'audience' | 'sequences'

export default function Email(): JSX.Element {
  const s = useStore()
  const [tab, setTab] = useState<Tab>('broadcasts')

  const tags = useMemo(
    () => Array.from(new Set(s.contacts.flatMap((c) => c.tags))).sort(),
    [s.contacts]
  )

  return (
    <div className="wrap">
      <span className="label label-accent">Audience &amp; email</span>
      <h2 className="display" style={{ fontSize: 'var(--text-3xl)', margin: '6px 0 4px' }}>
        Your newsletter &amp; automations
      </h2>
      <p className="muted">
        Own your audience. Send broadcasts, build automated sequences, and keep every contact here
        &mdash; no Kajabi, no Mailchimp.
      </p>

      {!emailTransportConfigured() && (
        <div className="em-note" style={{ marginTop: 'var(--sp5)' }}>
          <b>Sender not connected yet.</b> You can build contacts, broadcasts and sequences now.
          To actually deliver, connect your Bold Life email function
          (<code>VITE_EMAIL_FUNCTION_URL</code>) &mdash; our own sender, not a third-party ESP.
        </div>
      )}

      <div className="em-tabs" style={{ marginTop: 'var(--sp6)' }}>
        <button className={tab === 'broadcasts' ? 'on' : ''} onClick={() => setTab('broadcasts')}>
          Broadcasts
        </button>
        <button className={tab === 'audience' ? 'on' : ''} onClick={() => setTab('audience')}>
          Audience ({s.contacts.length})
        </button>
        <button className={tab === 'sequences' ? 'on' : ''} onClick={() => setTab('sequences')}>
          Sequences
        </button>
      </div>

      {tab === 'broadcasts' && <Broadcasts tags={tags} />}
      {tab === 'audience' && <Audience tags={tags} />}
      {tab === 'sequences' && <Sequences />}
    </div>
  )
}

function Broadcasts({ tags }: { tags: string[] }): JSX.Element {
  const s = useStore()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState('all')
  const [status, setStatus] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const applyTemplate = (name: string): void => {
    const t = TEMPLATES.find((x) => x.name === name)
    if (t) {
      setSubject(t.subject)
      setBody(t.body)
    }
  }

  const recipients = audienceFor(s.contacts, audience)

  const save = (sent: boolean, queued: boolean): Broadcast => {
    const b: Broadcast = {
      id: rid(),
      subject: subject.trim() || '(no subject)',
      body,
      audience,
      status: sent ? 'sent' : queued ? 'queued' : 'draft',
      at: Date.now(),
      sentAt: sent ? Date.now() : undefined,
      recipients: sent || queued ? recipients.length : undefined
    }
    s.addBroadcast(b)
    return b
  }

  const onSaveDraft = (): void => {
    if (!subject.trim() && !body.trim()) return
    save(false, false)
    setSubject('')
    setBody('')
    setStatus('Saved as draft.')
  }

  const onSend = async (): Promise<void> => {
    if (!subject.trim()) {
      setStatus('Add a subject first.')
      return
    }
    if (recipients.length === 0) {
      setStatus('No contacts in this audience yet — add some under Audience.')
      return
    }
    setSending(true)
    const res = await sendBroadcast(
      { id: '', subject, body, audience, status: 'draft', at: Date.now() },
      recipients
    )
    setSending(false)
    if (res.ok) {
      save(true, false)
      setStatus(`Sent to ${res.sent} ${res.sent === 1 ? 'contact' : 'contacts'}.`)
    } else if (!res.transport) {
      save(false, true)
      setStatus(`Queued for ${res.queued} — connect your sender to deliver.`)
    } else {
      setStatus(res.error || 'Send failed.')
      return
    }
    setSubject('')
    setBody('')
  }

  return (
    <>
      <div className="card card-pad" style={{ marginTop: 'var(--sp5)' }}>
        <div className="row between" style={{ marginBottom: 'var(--sp4)' }}>
          <strong>Compose a broadcast</strong>
          <select className="em-in" style={{ maxWidth: 200 }} defaultValue="" onChange={(e) => applyTemplate(e.target.value)}>
            <option value="">Start from a template…</option>
            {TEMPLATES.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <label className="em-lbl">Subject</label>
        <input className="em-in" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Your subject line" />
        <label className="em-lbl" style={{ marginTop: 'var(--sp4)' }}>
          Message
        </label>
        <textarea className="em-in em-area" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write to your audience… use {{name}}, {{program}}, {{coach}}" />
        <div className="row" style={{ marginTop: 'var(--sp4)', gap: 'var(--sp3)', alignItems: 'center' }}>
          <label className="em-lbl" style={{ margin: 0 }}>
            To
          </label>
          <select className="em-in" style={{ maxWidth: 220 }} value={audience} onChange={(e) => setAudience(e.target.value)}>
            <option value="all">Everyone ({s.contacts.length})</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t} ({audienceFor(s.contacts, t).length})
              </option>
            ))}
          </select>
          <span className="dim mono" style={{ fontSize: 'var(--text-xs)' }}>
            {recipients.length} recipient{recipients.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="row" style={{ marginTop: 'var(--sp5)', gap: 'var(--sp3)' }}>
          <button className="btn btn-solid btn-sm" disabled={sending} onClick={onSend}>
            <Icon name="mail" size={15} /> {sending ? 'Sending…' : 'Send'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onSaveDraft}>
            Save draft
          </button>
          {status && (
            <span className="dim" style={{ fontSize: 'var(--text-sm)' }}>
              {status}
            </span>
          )}
        </div>
      </div>

      <hr className="sep" />
      <div className="label label-accent">Sent &amp; drafts</div>
      {s.broadcasts.length === 0 ? (
        <p className="dim" style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--sp3)' }}>
          Nothing yet. Your broadcasts appear here.
        </p>
      ) : (
        <div style={{ marginTop: 'var(--sp4)', display: 'flex', flexDirection: 'column', gap: 'var(--sp2)' }}>
          {s.broadcasts.map((b) => (
            <div key={b.id} className="card card-pad row between">
              <div style={{ minWidth: 0 }}>
                <strong>{b.subject}</strong>
                <div className="dim mono" style={{ fontSize: 'var(--text-xs)', marginTop: 3 }}>
                  {b.audience === 'all' ? 'Everyone' : b.audience}
                  {b.recipients != null ? ` · ${b.recipients} recipients` : ''} · {new Date(b.at).toLocaleDateString()}
                </div>
              </div>
              <span className={'badge ' + (b.status === 'sent' ? 'badge-accent' : 'badge-muted')}>{b.status}</span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function Audience({ tags }: { tags: string[] }): JSX.Element {
  const s = useStore()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [tag, setTag] = useState('')

  const add = (): void => {
    const e = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return
    s.addContact({
      id: rid(),
      email: e,
      name: name.trim() || undefined,
      tags: tag.trim() ? [tag.trim()] : [],
      at: Date.now()
    })
    setEmail('')
    setName('')
    setTag('')
  }

  return (
    <>
      <div className="card card-pad" style={{ marginTop: 'var(--sp5)' }}>
        <strong>Add a contact</strong>
        <div className="row" style={{ marginTop: 'var(--sp4)', gap: 'var(--sp3)', flexWrap: 'wrap' }}>
          <input className="em-in" style={{ flex: 2, minWidth: 180 }} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@address.com" />
          <input className="em-in" style={{ flex: 1, minWidth: 120 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (optional)" />
          <input className="em-in" style={{ flex: 1, minWidth: 110 }} value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Tag (optional)" list="em-tags" onKeyDown={(e) => e.key === 'Enter' && add()} />
          <datalist id="em-tags">
            {tags.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
          <button className="btn btn-solid btn-sm" onClick={add}>
            Add
          </button>
        </div>
      </div>

      <hr className="sep" />
      <div className="label label-accent">Contacts ({s.contacts.length})</div>
      {s.contacts.length === 0 ? (
        <p className="dim" style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--sp3)' }}>
          No contacts yet. Add your audience above, or import them in production.
        </p>
      ) : (
        <div style={{ marginTop: 'var(--sp4)', display: 'flex', flexDirection: 'column', gap: 'var(--sp2)' }}>
          {s.contacts.map((c) => (
            <div key={c.id} className="card card-pad row between">
              <div style={{ minWidth: 0 }}>
                <strong>{c.name || c.email}</strong>
                {c.name && <span className="dim mono" style={{ fontSize: 'var(--text-xs)', marginLeft: 8 }}>{c.email}</span>}
                <div style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {c.tags.map((t) => (
                    <span key={t} className="badge badge-muted">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => s.removeContact(c.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function Sequences(): JSX.Element {
  const s = useStore()
  const [name, setName] = useState('')
  const [trigger, setTrigger] = useState<'enrolled' | 'lesson-complete' | 'manual'>('enrolled')
  const [steps, setSteps] = useState<SequenceStep[]>([{ id: rid(), waitDays: 0, subject: '', body: '' }])

  const addStep = (): void => setSteps((st) => [...st, { id: rid(), waitDays: 3, subject: '', body: '' }])
  const patchStep = (id: string, patch: Partial<SequenceStep>): void =>
    setSteps((st) => st.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  const removeStep = (id: string): void => setSteps((st) => st.filter((x) => x.id !== id))

  const save = (): void => {
    if (!name.trim()) return
    s.addSequence({
      id: rid(),
      name: name.trim(),
      trigger,
      steps: steps.filter((x) => x.subject.trim()),
      active: true,
      at: Date.now()
    })
    setName('')
    setTrigger('enrolled')
    setSteps([{ id: rid(), waitDays: 0, subject: '', body: '' }])
  }

  const triggerLabel: Record<string, string> = {
    enrolled: 'When a client enrolls',
    'lesson-complete': 'When a lesson is completed',
    manual: 'Manually started'
  }

  return (
    <>
      <div className="card card-pad" style={{ marginTop: 'var(--sp5)' }}>
        <strong>New automated sequence</strong>
        <div className="row" style={{ marginTop: 'var(--sp4)', gap: 'var(--sp3)', flexWrap: 'wrap' }}>
          <input className="em-in" style={{ flex: 2, minWidth: 180 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Sequence name (e.g. Welcome series)" />
          <select className="em-in" style={{ flex: 1, minWidth: 180 }} value={trigger} onChange={(e) => setTrigger(e.target.value as typeof trigger)}>
            <option value="enrolled">When a client enrolls</option>
            <option value="lesson-complete">When a lesson is completed</option>
            <option value="manual">Manually started</option>
          </select>
        </div>

        <div style={{ marginTop: 'var(--sp5)', display: 'flex', flexDirection: 'column', gap: 'var(--sp3)' }}>
          {steps.map((st, i) => (
            <div key={st.id} className="em-step">
              <div className="row between" style={{ marginBottom: 'var(--sp2)' }}>
                <span className="label" style={{ fontSize: 'var(--text-xs)' }}>Step {i + 1}</span>
                <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                  <span className="dim mono" style={{ fontSize: 'var(--text-xs)' }}>wait</span>
                  <input className="em-in" type="number" min={0} style={{ width: 64 }} value={st.waitDays} onChange={(e) => patchStep(st.id, { waitDays: Math.max(0, Number(e.target.value) || 0) })} />
                  <span className="dim mono" style={{ fontSize: 'var(--text-xs)' }}>days</span>
                  {steps.length > 1 && (
                    <button className="btn btn-ghost btn-sm" onClick={() => removeStep(st.id)}>
                      ✕
                    </button>
                  )}
                </div>
              </div>
              <input className="em-in" value={st.subject} onChange={(e) => patchStep(st.id, { subject: e.target.value })} placeholder="Email subject" />
              <textarea className="em-in em-area" style={{ minHeight: 70, marginTop: 'var(--sp2)' }} value={st.body} onChange={(e) => patchStep(st.id, { body: e.target.value })} placeholder="Email body…" />
            </div>
          ))}
        </div>
        <div className="row" style={{ marginTop: 'var(--sp4)', gap: 'var(--sp3)' }}>
          <button className="btn btn-ghost btn-sm" onClick={addStep}>
            + Add step
          </button>
          <button className="btn btn-solid btn-sm" onClick={save}>
            Save sequence
          </button>
        </div>
      </div>

      <hr className="sep" />
      <div className="label label-accent">Sequences ({s.sequences.length})</div>
      {s.sequences.length === 0 ? (
        <p className="dim" style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--sp3)' }}>
          No sequences yet. Build a welcome or nurture series above.
        </p>
      ) : (
        <div style={{ marginTop: 'var(--sp4)', display: 'flex', flexDirection: 'column', gap: 'var(--sp2)' }}>
          {s.sequences.map((q) => (
            <div key={q.id} className="card card-pad row between">
              <div style={{ minWidth: 0 }}>
                <strong>{q.name}</strong>
                <div className="dim mono" style={{ fontSize: 'var(--text-xs)', marginTop: 3 }}>
                  {triggerLabel[q.trigger]} · {q.steps.length} email{q.steps.length === 1 ? '' : 's'}
                </div>
              </div>
              <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                <button className={'badge ' + (q.active ? 'badge-accent' : 'badge-muted')} onClick={() => s.updateSequence(q.id, { active: !q.active })} style={{ cursor: 'pointer', border: 0 }}>
                  {q.active ? 'Active' : 'Paused'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => s.removeSequence(q.id)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
