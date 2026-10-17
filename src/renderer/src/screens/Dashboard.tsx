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
}

function findNext(completed: Record<string, boolean>, ent: Record<string, boolean>): Next | null {
  for (const level of PROGRAM.levels) {
    if (!hasAccess({ completedLessons: completed, quizScores: {}, entitlements: ent }, level)) continue
    for (const module of level.modules) {
      for (const lesson of module.lessons) {
        if (!completed[lesson.id]) return { level, module, lesson }
      }
    }
  }
  return null
}

export default function Dashboard(): JSX.Element {
  const s = useStore()
  const pct = academyPct(s)
  const certs = certifiedLevels(s)
  const next = findNext(s.completedLessons, s.entitlements)
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
        Keep moving through the Academy, and jump into a live session whenever you’re ready.
      </p>

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
          <div className="label label-accent">Continue learning</div>
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
                Resume lesson <Icon name="arrow" size={16} />
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
            {s.role === 'coach' ? 'Start a session with a client' : 'Meet with your coach'}
          </h3>
          <p className="dim" style={{ fontSize: 'var(--text-sm)' }}>
            1:1 video, screen share, and recording — right inside the app.
          </p>
          <button className="btn btn-solid" style={{ marginTop: 'var(--sp5)' }} onClick={() => go('session')}>
            <Icon name="video" size={16} /> Enter session
          </button>
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
