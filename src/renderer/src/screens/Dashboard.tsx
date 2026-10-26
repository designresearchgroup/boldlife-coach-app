import type { CSSProperties } from 'react'
import {
  useStore,
  academyPct,
  certifiedLevels,
  hasAccess,
  type View
} from '@renderer/state/store'
import { PROGRAM, type Level, type Module, type Lesson } from '@renderer/data/curriculum'
import { Icon } from '@renderer/components/Icon'

interface Next {
  level: Level
  module: Module
  lesson: Lesson
  resuming: boolean
}

function findNext(
  completed: Record<string, boolean>,
  ent: Record<string, boolean>,
  pos: Record<string, number>
): Next | null {
  const accessible: Next[] = []
  for (const level of PROGRAM.levels) {
    if (!hasAccess({ completedLessons: completed, quizScores: {}, entitlements: ent }, level)) continue
    for (const module of level.modules) {
      for (const lesson of module.lessons) {
        if (!completed[lesson.id]) accessible.push({ level, module, lesson, resuming: false })
      }
    }
  }
  // Prefer a lesson already in progress (true resume); else the first untouched one.
  const started = accessible.find((n) => (pos[n.lesson.id] ?? 0) > 0)
  if (started) return { ...started, resuming: true }
  return accessible[0] ?? null
}

export default function Dashboard(): JSX.Element {
  const s = useStore()
  const pct = academyPct(s)
  const certs = certifiedLevels(s)
  const next = findNext(s.completedLessons, s.entitlements, s.lessonPos)
  const enrolled = !!s.entitlements['academy']
  const go = (v: View, p?: Record<string, string>): void => s.go(v, p)

  return (
    <div className="wrap">
      <span className="label label-accent">Welcome back</span>
      <h2 className="display" style={{ fontSize: 'var(--text-3xl)', margin: '6px 0 4px' }}>
        {greeting()}, {s.learnerName.split(' ')[0]}.
      </h2>
      <p className="muted" style={{ maxWidth: '60ch' }}>
        You’re on the {s.role === 'coach' ? 'coach' : 'client'} side of the Bold Life platform.
        Keep moving through the Academy, join a live class, or jump into a 1:1 session whenever you’re ready.
      </p>

      {!s.onboarded && (
        <div className="banner" style={{ marginTop: 'var(--sp6)' }}>
          <Icon name="card" size={16} />
          <span>Finish setting up your Bold Life Coach platform — your brand, your plan, and you’re live.</span>
          <button className="btn btn-solid btn-sm" style={{ marginLeft: 'auto' }} onClick={() => go('onboarding')}>
            Get set up
          </button>
        </div>
      )}

      <div className="grid g3" style={{ marginTop: 'var(--sp8)' }}>
        <div className="card card-pad">
          <div className="row between">
            <div>
              <div className="label">Academy progress</div>
              <div className="stat-v" style={{ marginTop: 6 }}>
                {pct}
                <span style={{ fontSize: 'var(--text-xl)', color: 'var(--t3)' }}>%</span>
              </div>
            </div>
            <div className="ring" style={{ '--p': pct } as CSSProperties}>
              <div className="ring-in">{pct}%</div>
            </div>
          </div>
          <div className="bar" style={{ marginTop: 'var(--sp4)' }}>
            <span style={{ width: pct + '%' }} />
          </div>
        </div>

        <div className="card card-pad">
          <div className="label">Levels certified</div>
          <div className="stat-v" style={{ marginTop: 6 }}>
            {certs.length}
            <span style={{ fontSize: 'var(--text-xl)', color: 'var(--t3)' }}> / {PROGRAM.levels.length}</span>
          </div>
          <div className="row" style={{ gap: 6, marginTop: 'var(--sp4)', flexWrap: 'wrap' }}>
            {PROGRAM.levels.map((l) => (
              <span
                key={l.id}
                className={'badge ' + (certs.includes(l) ? 'badge-gold' : 'badge-muted')}
              >
                {certs.includes(l) ? <Icon name="award" size={12} /> : null} L{l.n}
              </span>
            ))}
          </div>
        </div>

        <div className="card card-pad">
          <div className="label">Recorded sessions</div>
          <div className="stat-v" style={{ marginTop: 6 }}>{s.recordings.length}</div>
          <p className="dim" style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--sp3)' }}>
            Record any live session to keep for review or to sell as a replay.
          </p>
        </div>
      </div>

      {!enrolled && (
        <div className="banner" style={{ marginTop: 'var(--sp6)' }}>
          <Icon name="award" size={16} />
          <span>
            Foundations is free. Unlock Levels 2 &amp; 3, certification, and unlimited live sessions
            with the full Academy.
          </span>
          <button className="btn btn-gold btn-sm" style={{ marginLeft: 'auto' }} onClick={() => go('pricing')}>
            See plans
          </button>
        </div>
      )}

      <div className="grid g2" style={{ marginTop: 'var(--sp6)' }}>
        <div className="card card-pad">
          <div className="label label-accent">{next?.resuming ? 'Pick up where you left off' : 'Up next'}</div>
          {next ? (
            <>
              <h3 style={{ fontSize: 'var(--text-xl)', margin: '10px 0 2px' }}>{next.lesson.title}</h3>
              <p className="dim" style={{ fontSize: 'var(--text-sm)' }}>
                {next.level.name} · {next.module.title} · {next.lesson.minutes} min
              </p>
              <button
                className="btn btn-solid"
                style={{ marginTop: 'var(--sp5)' }}
                onClick={() =>
                  go('lesson', { levelId: next.level.id, moduleId: next.module.id, lessonId: next.lesson.id })
                }
              >
                {next.resuming ? 'Resume lesson' : 'Start lesson'} <Icon name="arrow" size={16} />
              </button>
            </>
          ) : (
            <>
              <h3 style={{ fontSize: 'var(--text-xl)', margin: '10px 0 2px' }}>
                You’ve completed every available lesson. 🎉
              </h3>
              <p className="dim" style={{ fontSize: 'var(--text-sm)' }}>
                {enrolled ? 'Review your certificates below.' : 'Enroll to unlock the next levels.'}
              </p>
              <button className="btn btn-outline" style={{ marginTop: 'var(--sp5)' }} onClick={() => go('learn')}>
                Open the Academy
              </button>
            </>
          )}
        </div>

        <div className="card card-pad">
          <div className="label label-accent">Live coaching</div>
          <h3 style={{ fontSize: 'var(--text-xl)', margin: '10px 0 2px' }}>
            {s.role === 'coach' ? 'Go live with your people' : 'Meet live'}
          </h3>
          <p className="dim" style={{ fontSize: 'var(--text-sm)' }}>
            A 1:1 room or a full live class — video, screen share, and recording, right inside the app.
          </p>
          <div className="row" style={{ marginTop: 'var(--sp5)', gap: 'var(--sp3)', flexWrap: 'wrap' }}>
            <button className="btn btn-solid" onClick={() => go('session')}>
              <Icon name="video" size={16} /> 1:1 session
            </button>
            <button className="btn btn-ghost" onClick={() => go('liveclass')}>
              <Icon name="user" size={16} /> Live class
            </button>
          </div>
        </div>
      </div>

      {certs.length > 0 && (
        <>
          <hr className="sep" />
          <div className="label label-accent">Your certifications</div>
          <div className="grid g3" style={{ marginTop: 'var(--sp4)' }}>
            {certs.map((l) => (
              <div key={l.id} className="card card-pad card-hover" onClick={() => go('certificate', { levelId: l.id })}>
                <Icon name="award" size={22} />
                <h3 style={{ fontSize: 'var(--text-lg)', margin: '8px 0 2px' }}>{l.name}</h3>
                <p className="dim" style={{ fontSize: 'var(--text-sm)' }}>Certified · view certificate</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
