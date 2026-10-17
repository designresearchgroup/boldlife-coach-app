import { useStore, levelCertified, certifiedLevels } from '@renderer/state/store'
import { findLevel, PROGRAM } from '@renderer/data/curriculum'
import { Icon } from '@renderer/components/Icon'

export default function Certificate(): JSX.Element {
  const s = useStore()
  const picked = findLevel(s.nav.levelId)
  const level = picked && levelCertified(s, picked) ? picked : certifiedLevels(s)[0]

  if (!level) {
    return (
      <div className="wrap">
        <p className="muted">No certificate yet — complete a level to earn one.</p>
        <button className="btn btn-outline" onClick={() => s.go('learn')}>Back to the Academy</button>
      </div>
    )
  }

  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="wrap" style={{ maxWidth: 820 }}>
      <div className="row between" style={{ marginBottom: 'var(--sp5)' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => s.go('learn')} style={{ paddingLeft: 0 }}>
          <Icon name="back" size={16} /> Academy
        </button>
        <button className="btn btn-gold btn-sm" onClick={() => window.print()}>
          Save / print
        </button>
      </div>

      <div className="cert">
        <div className="cert-seal">
          <Icon name="award" size={34} />
        </div>
        <div className="label label-accent">The Bold Leadership Academy</div>
        <h2 className="display" style={{ fontSize: 'var(--text-2xl)', margin: '10px 0 var(--sp6)' }}>
          Certificate of Completion
        </h2>
        <p className="dim" style={{ fontSize: 'var(--text-sm)' }}>This certifies that</p>
        <p className="display" style={{ fontSize: 'var(--text-4xl)', color: 'var(--accent)', margin: '6px 0' }}>
          {s.learnerName}
        </p>
        <p className="muted" style={{ maxWidth: '52ch', margin: '0 auto' }}>
          has successfully completed every module and assessment for
        </p>
        <p className="display" style={{ fontSize: 'var(--text-2xl)', margin: '8px 0 var(--sp8)' }}>
          Level {level.n} — {level.name}
        </p>
        <div className="row" style={{ justifyContent: 'center', gap: 'var(--sp10)', flexWrap: 'wrap' }}>
          <div>
            <div className="mono" style={{ fontSize: 'var(--text-sm)' }}>{date}</div>
            <div className="label" style={{ marginTop: 4 }}>Date</div>
          </div>
          <div>
            <div className="display" style={{ fontSize: 'var(--text-lg)' }}>The Bold Life Coach</div>
            <div className="label" style={{ marginTop: 4 }}>Issued by · {PROGRAM.name}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
