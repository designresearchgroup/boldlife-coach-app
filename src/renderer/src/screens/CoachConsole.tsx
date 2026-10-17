import { useState } from 'react'
import { useStore } from '@renderer/state/store'
import { Icon } from '@renderer/components/Icon'
import { SKILLS, runAgent, askAgent, agentConfigured, type Skill, type AgentResult } from '@renderer/services/agent'
import { emailTransportConfigured } from '@renderer/services/email'
import { liveConfigured } from '@renderer/services/live'

// Demo roster. Production reads the coach's real clients from the data service.
const CLIENTS = [
  { name: 'Alex Rivera', level: 'Bold Practitioner', pct: 62, next: 'Coaching Conversations' },
  { name: 'Jordan Blake', level: 'Bold Foundations', pct: 100, next: 'Ready for Level 2' },
  { name: 'Sam Ortiz', level: 'Bold Leader', pct: 35, next: 'Strategic Influence' },
  { name: 'Priya Nair', level: 'Bold Foundations', pct: 20, next: 'The One-Page Clarity Map' }
]

const stripeConfigured = !!(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined)

export default function CoachConsole(): JSX.Element {
  const s = useStore()
  const [ask, setAsk] = useState('')
  const [result, setResult] = useState<{ title: string; res: AgentResult } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const ctx = {
    coach: 'Jamesyn',
    program: 'The Bold Leadership Academy',
    clients: CLIENTS.length,
    audience: s.contacts.length
  }
  const sentCount = s.broadcasts.filter((b) => b.status === 'sent').length

  const doSkill = async (skill: Skill): Promise<void> => {
    setBusy(skill.id)
    const res = await runAgent(skill, ctx)
    setBusy(null)
    setResult({ title: skill.title, res })
  }
  const doAsk = async (): Promise<void> => {
    const q = ask.trim()
    if (!q) return
    setBusy('ask')
    const res = await askAgent(q, ctx)
    setBusy(null)
    setResult({ title: 'Your agent', res })
    setAsk('')
  }

  const connections = [
    { label: 'Agent (AI)', ok: agentConfigured(), env: 'VITE_AGENT_URL' },
    { label: 'Email sender', ok: emailTransportConfigured(), env: 'VITE_EMAIL_FUNCTION_URL' },
    { label: 'Live classes', ok: liveConfigured(), env: 'VITE_SUPABASE_URL' },
    { label: 'Payments', ok: stripeConfigured, env: 'VITE_STRIPE_PUBLISHABLE_KEY' }
  ]

  return (
    <div className="wrap">
      <span className="label label-accent">Command center</span>
      <h2 className="display" style={{ fontSize: 'var(--text-3xl)', margin: '6px 0 4px' }}>
        Your coaching-business agent
      </h2>
      <p className="muted">
        One place to run everything. Your agent finds clients, markets what you teach, handles intake,
        schedules classes, and drafts the follow-up &mdash; in your voice, on your data.
      </p>

      {/* agent command box */}
      <div className="card card-pad" style={{ marginTop: 'var(--sp6)' }}>
        <div className="row between" style={{ marginBottom: 'var(--sp3)' }}>
          <strong>Ask your agent</strong>
          <span className={'badge ' + (agentConfigured() ? 'badge-accent' : 'badge-muted')}>
            {agentConfigured() ? 'Connected' : 'Plan mode'}
          </span>
        </div>
        <textarea
          className="em-in em-area"
          style={{ minHeight: 70 }}
          value={ask}
          onChange={(e) => setAsk(e.target.value)}
          placeholder="e.g. Find me 10 new clients this month, or draft a class on confident negotiation"
        />
        <div className="row" style={{ marginTop: 'var(--sp3)' }}>
          <button className="btn btn-solid btn-sm" disabled={busy === 'ask'} onClick={doAsk}>
            {busy === 'ask' ? 'Thinking…' : 'Run'}
          </button>
          {!agentConfigured() && (
            <span className="dim" style={{ fontSize: 'var(--text-sm)' }}>
              Plan mode — connect the agent (<code>VITE_AGENT_URL</code>) to run tasks for real.
            </span>
          )}
        </div>
      </div>

      {/* overview */}
      <div className="ac-stats">
        <Stat n={CLIENTS.length} label="Clients" />
        <Stat n={s.contacts.length} label="Audience" />
        <Stat n={sentCount} label="Broadcasts sent" />
        <Stat n={s.recordings.length} label="Recordings" />
      </div>

      {/* skills */}
      <div className="label label-accent" style={{ marginTop: 'var(--sp7)' }}>
        What your agent does
      </div>
      <div className="ac-skills">
        {SKILLS.map((sk) => (
          <div key={sk.id} className="card card-pad ac-skill">
            <strong>{sk.title}</strong>
            <p className="dim" style={{ fontSize: 'var(--text-sm)', margin: '6px 0 14px', flex: 1 }}>
              {sk.blurb}
            </p>
            <div className="row" style={{ gap: 'var(--sp2)' }}>
              <button className="btn btn-solid btn-sm" disabled={busy === sk.id} onClick={() => doSkill(sk)}>
                {busy === sk.id ? 'Working…' : 'Run'}
              </button>
              {sk.route && (
                <button className="btn btn-ghost btn-sm" onClick={() => s.go(sk.route!)}>
                  Open
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* agent result */}
      {result && (
        <div className="card card-pad ac-result">
          <div className="row between" style={{ marginBottom: 'var(--sp3)' }}>
            <strong>{result.title}</strong>
            <span className={'badge ' + (result.res.live ? 'badge-accent' : 'badge-muted')}>
              {result.res.live ? 'Agent' : 'Plan'}
            </span>
          </div>
          <pre className="ac-out">{result.res.text}</pre>
        </div>
      )}

      {/* connections */}
      <div className="label label-accent" style={{ marginTop: 'var(--sp7)' }}>
        Connections
      </div>
      <p className="dim" style={{ fontSize: 'var(--text-sm)', marginTop: 4 }}>
        What&rsquo;s wired up. Everything runs on your own infrastructure &mdash; no third-party SaaS.
      </p>
      <div style={{ marginTop: 'var(--sp3)', display: 'flex', flexDirection: 'column', gap: 'var(--sp2)' }}>
        {connections.map((c) => (
          <div key={c.label} className="card card-pad row between">
            <div>
              <strong>{c.label}</strong>
              <span className="dim mono" style={{ fontSize: 'var(--text-xs)', marginLeft: 10 }}>
                {c.env}
              </span>
            </div>
            <span className={'badge ' + (c.ok ? 'badge-accent' : 'badge-muted')}>
              {c.ok ? 'Connected' : 'Not connected'}
            </span>
          </div>
        ))}
      </div>

      {/* clients */}
      <div className="label label-accent" style={{ marginTop: 'var(--sp7)' }}>
        Your clients
      </div>
      <div style={{ marginTop: 'var(--sp3)', display: 'flex', flexDirection: 'column', gap: 'var(--sp2)' }}>
        {CLIENTS.map((c) => (
          <div key={c.name} className="card card-pad row between">
            <div style={{ minWidth: 0 }}>
              <div className="row" style={{ gap: 'var(--sp3)' }}>
                <strong>{c.name}</strong>
                <span className="badge badge-muted">{c.level}</span>
              </div>
              <div className="dim" style={{ fontSize: 'var(--text-sm)', marginTop: 4 }}>Next: {c.next}</div>
              <div className="bar" style={{ marginTop: 'var(--sp3)', maxWidth: 260 }}>
                <span style={{ width: c.pct + '%' }} />
              </div>
            </div>
            <button className="btn btn-solid btn-sm" onClick={() => s.go('session')}>
              <Icon name="video" size={15} /> Start session
            </button>
          </div>
        ))}
      </div>

      {s.recordings.length > 0 && (
        <>
          <hr className="sep" />
          <div className="label label-accent">Recorded sessions</div>
          <div style={{ marginTop: 'var(--sp4)', display: 'flex', flexDirection: 'column', gap: 'var(--sp2)' }}>
            {s.recordings.map((r) => (
              <div key={r.id} className="item" style={{ cursor: 'default' }}>
                <span className="check done" style={{ background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff' }}>
                  <Icon name="video" size={13} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500 }}>{r.name}</div>
                  <div className="dim mono" style={{ fontSize: 'var(--text-xs)' }}>
                    {new Date(r.at).toLocaleString()} {r.savedPath ? '· saved to disk' : '· downloaded'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Stat({ n, label }: { n: number; label: string }): JSX.Element {
  return (
    <div className="card card-pad ac-stat">
      <div className="ac-statn">{n}</div>
      <div className="dim mono" style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
        {label}
      </div>
    </div>
  )
}
