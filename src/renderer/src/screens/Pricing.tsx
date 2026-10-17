import { useState } from 'react'
import { useStore } from '@renderer/state/store'
import { ENTITLEMENT_ACADEMY } from '@renderer/data/curriculum'
import { checkout, paymentsMode, type CheckoutItem } from '@renderer/services/payments'
import { Icon } from '@renderer/components/Icon'

const ACADEMY: CheckoutItem = { id: 'academy', name: 'The Bold Leadership Academy', price: 1200 }

export default function Pricing(): JSX.Element {
  const s = useStore()
  const enrolled = !!s.entitlements[ENTITLEMENT_ACADEMY]
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const enroll = async (): Promise<void> => {
    setBusy(true)
    try {
      const res = await checkout(ACADEMY)
      if (res.ok) {
        s.enroll(ENTITLEMENT_ACADEMY)
        setDone(true)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="wrap">
      <span className="label label-accent">Enroll</span>
      <h2 className="display" style={{ fontSize: 'var(--text-3xl)', margin: '6px 0 4px' }}>
        Invest in becoming bold.
      </h2>
      <p className="muted" style={{ maxWidth: '58ch' }}>
        Start free. Go all in when you’re ready — self-paced modules, certification, and live 1:1
        coaching, all in one place.
      </p>
      {paymentsMode() === 'demo' && (
        <div className="banner" style={{ marginTop: 'var(--sp5)' }}>
          <Icon name="card" size={16} />
          <span>Demo checkout — no card is charged. Enrolling unlocks everything instantly.</span>
        </div>
      )}

      <div className="grid g3" style={{ marginTop: 'var(--sp8)', alignItems: 'stretch' }}>
        <div className="card card-pad tier">
          <div className="label">Foundations</div>
          <div className="price-v" style={{ marginTop: 6 }}>Free</div>
          <p className="dim" style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--sp3)' }}>
            Level 1 of the Academy, on the house.
          </p>
          <ul className="ticks">
            <li>Clarity &amp; decision modules</li>
            <li>Module checks</li>
            <li>Level 1 certificate</li>
          </ul>
          <button className="btn btn-outline btn-block" style={{ marginTop: 'var(--sp6)' }} onClick={() => s.go('learn')}>
            Start free
          </button>
        </div>

        <div className="card card-pad tier featured">
          <div className="row between">
            <div className="label label-accent">Full Academy</div>
            <span className="badge badge-accent">Most popular</span>
          </div>
          <div className="price-v" style={{ marginTop: 6 }}>
            ${ACADEMY.price.toLocaleString()} <small>one-time</small>
          </div>
          <p className="dim" style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--sp3)' }}>
            Everything, including live coaching.
          </p>
          <ul className="ticks">
            <li>All three levels + certificates</li>
            <li>Unlimited 1:1 live sessions</li>
            <li>Screen share &amp; session recordings</li>
            <li>Coaching conversations &amp; influence tracks</li>
          </ul>
          {enrolled ? (
            <button className="btn btn-gold btn-block" style={{ marginTop: 'var(--sp6)' }} disabled>
              <Icon name="check" size={16} /> Enrolled
            </button>
          ) : (
            <button className="btn btn-solid btn-block" style={{ marginTop: 'var(--sp6)' }} disabled={busy} onClick={enroll}>
              {busy ? 'Processing…' : 'Enroll now'}
            </button>
          )}
        </div>

        <div className="card card-pad tier">
          <div className="label">Executive 1:1</div>
          <div className="price-v" style={{ marginTop: 6 }}>Custom</div>
          <p className="dim" style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--sp3)' }}>
            Private engagement for leaders and teams.
          </p>
          <ul className="ticks">
            <li>Dedicated coaching cadence</li>
            <li>Tailored curriculum</li>
            <li>Team cohorts &amp; reporting</li>
          </ul>
          <a className="btn btn-outline btn-block" style={{ marginTop: 'var(--sp6)' }} href="mailto:hello@theboldlifecoach.com?subject=Executive%201:1%20inquiry">
            Contact
          </a>
        </div>
      </div>

      {done && (
        <div className="modal-bg" onClick={() => setDone(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <div className="cert-seal" style={{ margin: '0 auto var(--sp4)' }}>
              <Icon name="check" size={32} />
            </div>
            <h3 className="display" style={{ fontSize: 'var(--text-2xl)' }}>You’re in.</h3>
            <p className="muted" style={{ marginTop: 'var(--sp3)' }}>
              The full Bold Leadership Academy is unlocked — every level and live coaching.
            </p>
            <button className="btn btn-solid" style={{ marginTop: 'var(--sp6)' }} onClick={() => s.go('learn')}>
              Go to the Academy
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
