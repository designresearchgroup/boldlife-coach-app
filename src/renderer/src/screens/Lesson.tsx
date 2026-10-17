import { useStore, quizPassed } from '@renderer/state/store'
import { findLevel, findModule, findLesson, lessonVideo } from '@renderer/data/curriculum'
import { Icon } from '@renderer/components/Icon'
import { VideoPlayer } from '@renderer/components/VideoPlayer'

export default function Lesson(): JSX.Element {
  const s = useStore()
  const level = findLevel(s.nav.levelId)
  const module = findModule(s.nav.moduleId)
  const lesson = findLesson(s.nav.lessonId)

  if (!level || !module || !lesson) {
    return (
      <div className="wrap">
        <p className="muted">Lesson not found.</p>
        <button className="btn btn-outline" onClick={() => s.go('learn')}>Back to the Academy</button>
      </div>
    )
  }

  const idx = module.lessons.findIndex((l) => l.id === lesson.id)
  const nextLesson = module.lessons[idx + 1]
  const complete = !!s.completedLessons[lesson.id]

  const finish = (): void => {
    s.completeLesson(lesson.id)
    if (nextLesson) {
      s.go('lesson', { levelId: level.id, moduleId: module.id, lessonId: nextLesson.id })
    } else if (!quizPassed(s, module.id)) {
      s.go('quiz', { levelId: level.id, moduleId: module.id })
    } else {
      s.go('learn')
    }
  }

  return (
    <div className="wrap" style={{ maxWidth: 860 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => s.go('learn')} style={{ paddingLeft: 0 }}>
        <Icon name="back" size={16} /> {level.name} · {module.title}
      </button>

      {/* Recorded video curriculum — the lesson plays here. */}
      <div style={{ margin: '12px 0 var(--sp6)' }}>
        <VideoPlayer
          key={lesson.id}
          src={lessonVideo(lesson)}
          poster={lesson.poster}
          resumeAt={s.lessonPos[lesson.id] ?? 0}
          onProgress={(sec) => s.setLessonPos(lesson.id, sec)}
          onEnded={() => s.completeLesson(lesson.id)}
        />
      </div>

      <h2 className="display" style={{ fontSize: 'var(--text-3xl)', margin: '0 0 6px' }}>
        {lesson.title}
      </h2>
      <div className="label" style={{ marginBottom: 'var(--sp5)' }}>
        Lesson {idx + 1} of {module.lessons.length} · {lesson.minutes} min
        {complete ? ' · ✓ completed' : ''}
      </div>

      <span className="label label-accent">Lesson notes</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp5)', marginTop: 'var(--sp3)' }}>
        {lesson.body.map((p, i) => (
          <p key={i} style={{ fontSize: 'var(--text-lg)', lineHeight: 'var(--lh-relaxed)', color: 'var(--t2)' }}>
            {p}
          </p>
        ))}
      </div>

      <hr className="sep" />
      <div className="row between">
        <span className="dim mono" style={{ fontSize: 'var(--text-xs)' }}>
          {complete ? 'Completed' : 'Finishes automatically when the video ends — or mark it done'}
        </span>
        <button className="btn btn-solid" onClick={finish}>
          {nextLesson ? 'Next lesson' : quizPassed(s, module.id) ? 'Done' : 'Take the check'}
          <Icon name="arrow" size={16} />
        </button>
      </div>
    </div>
  )
}
