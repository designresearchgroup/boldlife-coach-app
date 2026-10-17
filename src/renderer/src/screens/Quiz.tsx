import { useState } from 'react'
import { useStore, levelCertified } from '@renderer/state/store'
import { findLevel, findModule, PASS_MARK } from '@renderer/data/curriculum'
import { Icon } from '@renderer/components/Icon'

export default function Quiz(): JSX.Element {
  const s = useStore()
  const level = findLevel(s.nav.levelId)
  const module = findModule(s.nav.moduleId)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)

  if (!level || !module) {
    return (
      <div className="wrap">
        <p className="muted">Check not found.</p>
        <button className="btn btn-outline" onClick={() => s.go('learn')}>Back to the Academy</button>
      </div>
    )
  }

  const total = module.quiz.length
  const correct = module.quiz.filter((q) => answers[q.id] === q.answer).length
  const score = total ? Math.round((correct / total) * 100) : 0
  const passed = score >= PASS_MARK
  const allAnswered = module.quiz.every((q) => answers[q.id] !== undefined)

  const submit = (): void => {
    setSubmitted(true)
    s.recordQuiz(module.id, score)
  }
  const retry = (): void => {
    setAnswers({})
    setSubmitted(false)
  }

  const nowCertified = submitted && passed && levelCertified(s, level)

  return (
    <div className="wrap" style={{ maxWidth: 720 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => s.go('learn')} style={{ paddingLeft: 0 }}>
        <Icon name="back" size={16} /> {level.name} · {module.title}
      </button>
      <h2 className="display" style={{ fontSize: 'var(--text-2xl)', margin: '10px 0 4px' }}>
        Module check
      </h2>
      <p className="dim" style={{ fontSize: 'var(--text-sm)' }}>
        Score {PASS_MARK}% or higher to complete this module.
      </p>

      <div style={{ marginTop: 'var(--sp6)', display: 'flex', flexDirection: 'column', gap: 'var(--sp6)' }}>
        {module.quiz.map((q, qi) => (
          <div key={q.id}>
            <div style={{ fontWeight: 'var(--fw-semi)' as unknown as number, marginBottom: 'var(--sp3)' }}>
              {qi + 1}. {q.q}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp2)' }}>
              {q.options.map((opt, oi) => {
                let cls = 'opt'
                if (!submitted && answers[q.id] === oi) cls += ' sel'
                if (submitted && oi === q.answer) cls += ' correct'
                if (submitted && answers[q.id] === oi && oi !== q.answer) cls += ' wrong'
                return (
                  <label key={oi} className={cls}>
                    <input
                      type="radio"
                      name={q.id}
                      disabled={submitted}
                      checked={answers[q.id] === oi}
                      onChange={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <span>{opt}</span>
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <hr className="sep" />

      {!submitted ? (
        <div className="row between">
          <span className="dim mono" style={{ fontSize: 'var(--text-xs)' }}>
            {allAnswered ? 'Ready to submit' : 'Answer every question to submit'}
          </span>
          <button className="btn btn-solid" disabled={!allAnswered} onClick={submit}>
            Submit check
          </button>
        </div>
      ) : (
        <div className="card card-pad" style={{ textAlign: 'center' }}>
          {passed ? <Icon name="award" size={30} /> : <Icon name="rec" size={28} />}
          <h3 style={{ fontSize: 'var(--text-2xl)', margin: '10px 0 4px' }}>
            {passed ? 'Passed!' : 'Not quite'} — {score}%
          </h3>
          <p className="muted">
            {passed
              ? 'This module is complete.'
              : `You need ${PASS_MARK}%. Review the lessons and try again.`}
          </p>
          {nowCertified && (
            <div className="banner" style={{ marginTop: 'var(--sp4)', justifyContent: 'center' }}>
              <Icon name="award" size={16} /> You’ve certified <strong>&nbsp;{level.name}</strong>!
            </div>
          )}
          <div className="row" style={{ justifyContent: 'center', gap: 'var(--sp3)', marginTop: 'var(--sp5)' }}>
            {passed ? (
              <>
                <button className="btn btn-solid" onClick={() => s.go('learn')}>
                  Back to the Academy
                </button>
                {nowCertified && (
                  <button className="btn btn-gold" onClick={() => s.go('certificate', { levelId: level.id })}>
                    View certificate
                  </button>
                )}
              </>
            ) : (
              <button className="btn btn-solid" onClick={retry}>
                Try again
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
