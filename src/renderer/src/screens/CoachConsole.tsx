import { useStore } from '@renderer/state/store'
import { Icon } from '@renderer/components/Icon'

// Demo roster. Production reads the coach's real clients from the data service.
const CLIENTS = [
  { name: 'Alex Rivera', level: 'Bold Practitioner', pct: 62, next: 'Coaching Conversations' },
  { name: 'Jordan Blake', level: 'Bold Foundations', pct: 100, next: 'Ready for Level 2' },
  { name: 'Sam Ortiz', level: 'Bold Leader', pct: 35, next: 'Strategic Influence' },
  { name: 'Priya Nair', level: 'Bold Foundations', pct: 20, next: 'The One-Page Clarity Map' }
]

export default function CoachConsole(): JSX.Element {
  const s = useStore()
  return (
    <div className="wrap">
      <span className="label label-accent">Coach console</span>
      <h2 className="display" style={{ fontSize: 'var(--text-3xl)', margin: '6px 0 4px' }}>
        Your clients
      </h2>
      <p className="muted">Track progress, launch a session, and keep your session recordings.</p>

      <div style={{ marginTop: 'var(--sp8)', display: 'flex', flexDirection: 'column', gap: 'var(--sp3)' }}>
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

      <hr className="sep" />
      <div className="label label-accent">Recorded sessions</div>
      {s.recordings.length === 0 ? (
        <p className="dim" style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--sp3)' }}>
          No recordings yet. Record a live session and it’ll appear here.
        </p>
      ) : (
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
      )}
    </div>
  )
}
