import type { CSSProperties } from 'react'
import {
  useStore,
  levelPct,
  levelCertified,
  moduleComplete,
  quizPassed,
  hasAccess,
  type State
} from '@renderer/state/store'
import { PROGRAM, type Level, type Module } from '@renderer/data/curriculum'
import { Icon } from '@renderer/components/Icon'

export default function Learn(): JSX.Element {
  const s = useStore()

  return (
    <div className="wrap">
      <span className="label label-accent">The Bold Leadership Academy</span>
      <h2 className="display" style={{ fontSize: 'var(--text-3xl)', margin: '6px 0 4px' }}>
        {PROGRAM.name}
      </h2>
      <p className="muted" style={{ maxWidth: '62ch' }}>{PROGRAM.subtitle}</p>

      <div style={{ marginTop: 'var(--sp8)', display: 'flex', flexDirection: 'column', gap: 'var(--sp6)' }}>
        {PROGRAM.levels.map((level) => (
          <LevelBlock key={level.id} level={level} state={s} />
        ))}
      </div>
    </div>
  )
}

function LevelBlock({ level, state }: { level: Level; state: State }): JSX.Element {
  const pct = levelPct(state, level)
  const certified = levelCertified(state, level)
  const access = hasAccess(state, level)

  return (
    <div className="card card-pad">
      <div className="row between" style={{ alignItems: 'flex-start' }}>
        <div className="row" style={{ gap: 'var(--sp4)', alignItems: 'flex-start' }}>
          <div className={'ring' + (certified ? ' gold' : '')} style={{ '--p': pct, width: 60, height: 60 } as CSSProperties}>
            <div className="ring-in" style={{ width: 46, height: 46, fontSize: 'var(--text-sm)' }}>
              L{level.n}
            </div>
          </div>
          <div>
            <div className="row" style={{ gap: 'var(--sp3)' }}>
              <h3 style={{ fontSize: 'var(--text-xl)' }}>{level.name}</h3>
              {certified && (
                <span className="badge badge-gold">
                  <Icon name="award" size={12} /> Certified
                </span>
              )}
              {level.paid && !access && <span className="badge badge-muted">Locked</span>}
            </div>
            <p className="dim" style={{ fontSize: 'var(--text-sm)', marginTop: 4, maxWidth: '56ch' }}>
              {level.tagline}
            </p>
          </div>
        </div>
        {certified && (
          <button className="btn btn-gold btn-sm" onClick={() => state.go('certificate', { levelId: level.id })}>
            <Icon name="award" size={14} /> Certificate
          </button>
        )}
      </div>

      <div className="bar gold" style={{ marginTop: 'var(--sp4)' }}>
        <span style={{ width: pct + '%' }} />
      </div>

      {!access ? (
        <div className="banner" style={{ marginTop: 'var(--sp5)' }}>
          <Icon name="card" size={16} />
          <span>This level is part of the full Academy.</span>
          <button className="btn btn-solid btn-sm" style={{ marginLeft: 'auto' }} onClick={() => state.go('pricing')}>
            Unlock
          </button>
        </div>
      ) : (
        <div style={{ marginTop: 'var(--sp5)', display: 'flex', flexDirection: 'column', gap: 'var(--sp4)' }}>
          {level.modules.map((m) => (
            <ModuleBlock key={m.id} level={level} module={m} state={state} />
          ))}
        </div>
      )}
    </div>
  )
}

function ModuleBlock({
  level,
  module,
  state
}: {
  level: Level
  module: Module
  state: State
}): JSX.Element {
  const done = moduleComplete(state, module)
  const lessonsDone = module.lessons.every((l) => state.completedLessons[l.id])
  const passed = quizPassed(state, module.id)

  return (
    <div style={{ border: '1px solid var(--bd)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
      <div className="row between" style={{ padding: 'var(--sp4) var(--sp5)', background: 'var(--bg2)' }}>
        <div>
          <div className="row" style={{ gap: 'var(--sp3)' }}>
            <strong style={{ fontSize: 'var(--text-md)' }}>{module.title}</strong>
            {done && <span className="badge badge-ok"><Icon name="check" size={12} /> Complete</span>}
          </div>
          <p className="dim" style={{ fontSize: 'var(--text-sm)', marginTop: 3 }}>{module.blurb}</p>
        </div>
      </div>

      <div style={{ padding: 'var(--sp3)', display: 'flex', flexDirection: 'column', gap: 'var(--sp2)' }}>
        {module.lessons.map((l) => {
          const complete = !!state.completedLessons[l.id]
          return (
            <div
              key={l.id}
              className={'item' + (complete ? ' done' : '')}
              onClick={() => state.go('lesson', { levelId: level.id, moduleId: module.id, lessonId: l.id })}
            >
              <span className="check">{complete ? <Icon name="check" size={13} /> : ''}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 'var(--fw-medium)' as unknown as number }}>{l.title}</div>
                <div className="dim mono" style={{ fontSize: 'var(--text-xs)' }}>{l.minutes} min</div>
              </div>
              <Icon name="arrow" size={16} />
            </div>
          )
        })}

        <div
          className={'item' + (passed ? ' done' : '') + (lessonsDone ? '' : ' locked')}
          onClick={() => lessonsDone && state.go('quiz', { levelId: level.id, moduleId: module.id })}
        >
          <span className="check">{passed ? <Icon name="check" size={13} /> : <Icon name="award" size={13} />}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 'var(--fw-medium)' as unknown as number }}>
              Module check {passed ? `· passed (${state.quizScores[module.id]}%)` : ''}
            </div>
            <div className="dim mono" style={{ fontSize: 'var(--text-xs)' }}>
              {lessonsDone ? 'Pass to complete this module' : 'Finish the lessons to unlock'}
            </div>
          </div>
          {lessonsDone && <Icon name="arrow" size={16} />}
        </div>
      </div>
    </div>
  )
}
