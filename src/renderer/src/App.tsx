import { useEffect } from 'react'
import { useStore, type View } from '@renderer/state/store'
import { Icon } from '@renderer/components/Icon'
import { platform, demoMode } from '@renderer/services/env'
import Dashboard from '@renderer/screens/Dashboard'
import Learn from '@renderer/screens/Learn'
import Lesson from '@renderer/screens/Lesson'
import Quiz from '@renderer/screens/Quiz'
import Certificate from '@renderer/screens/Certificate'
import Session from '@renderer/screens/Session'
import LiveClass from '@renderer/screens/LiveClass'
import Pricing from '@renderer/screens/Pricing'
import CoachConsole from '@renderer/screens/CoachConsole'
import Email from '@renderer/screens/Email'

const TITLES: Record<View, string> = {
  dashboard: 'Dashboard',
  learn: 'The Bold Leadership Academy',
  lesson: 'Lesson',
  quiz: 'Module check',
  certificate: 'Your certificate',
  session: 'Live session',
  liveclass: 'Live class',
  pricing: 'Enroll',
  coach: 'Command center',
  email: 'Audience & email'
}

function Sidebar(): JSX.Element {
  const { nav, role, go } = useStore()
  const items: Array<{ view: View; icon: string; label: string }> = [
    { view: 'dashboard', icon: 'home', label: 'Dashboard' },
    { view: 'learn', icon: 'book', label: 'Academy' },
    { view: 'liveclass', icon: 'video', label: 'Live class' },
    { view: 'pricing', icon: 'card', label: 'Enroll' }
  ]
  if (role === 'coach') {
    items.push({ view: 'coach', icon: 'user', label: 'Command center' })
    items.push({ view: 'email', icon: 'mail', label: 'Email' })
  }

  return (
    <aside className="side">
      <div className="brand">
        <img className="brand-mark" src="/logo.png" alt="The Bold Life" />
        <div className="brand-txt">
          The Bold Life<small>Coaching Platform</small>
        </div>
      </div>
      {items.map((it) => (
        <button
          key={it.view}
          className={'nav-i' + (nav.view === it.view ? ' active' : '')}
          onClick={() => go(it.view)}
        >
          <span className="ico">
            <Icon name={it.icon} />
          </span>
          {it.label}
        </button>
      ))}
      <div className="side-sp" />
      <button className="btn btn-solid btn-block" onClick={() => go('session')}>
        <Icon name="video" size={16} /> Start live session
      </button>
    </aside>
  )
}

function Topbar(): JSX.Element {
  const { nav, role, setRole, theme, toggleTheme } = useStore()
  return (
    <header className="top">
      <h1>{TITLES[nav.view]}</h1>
      <div className="top-sp" />
      <div className="seg" role="tablist" aria-label="Role">
        <button className={role === 'client' ? 'on' : ''} onClick={() => setRole('client')}>
          Client
        </button>
        <button className={role === 'coach' ? 'on' : ''} onClick={() => setRole('coach')}>
          Coach
        </button>
      </div>
      <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme">
        <Icon name="sun" size={16} />
      </button>
    </header>
  )
}

export default function App(): JSX.Element {
  const { nav, theme } = useStore()

  useEffect(() => {
    const root = document.documentElement
    // Sales is never dark: the Enroll / purchase screen is always light so people
    // can actually see it to buy. Everywhere else respects the user's choice —
    // for members, dark is good.
    const effective = nav.view === 'pricing' ? 'light' : theme
    if (effective) root.setAttribute('data-theme', effective)
    else root.removeAttribute('data-theme')
  }, [theme, nav.view])

  // The live session / class take the whole window — no shell chrome.
  if (nav.view === 'session') return <Session />
  if (nav.view === 'liveclass') return <LiveClass />

  return (
    <div className="app">
      <Sidebar />
      <div style={{ display: 'grid', gridTemplateRows: 'var(--top-h) 1fr', height: '100%', minWidth: 0 }}>
        <Topbar />
        <div className="main">
          {nav.view === 'dashboard' && <Dashboard />}
          {nav.view === 'learn' && <Learn />}
          {nav.view === 'lesson' && <Lesson />}
          {nav.view === 'quiz' && <Quiz />}
          {nav.view === 'certificate' && <Certificate />}
          {nav.view === 'pricing' && <Pricing />}
          {nav.view === 'coach' && <CoachConsole />}
          {nav.view === 'email' && <Email />}
          {demoMode && (
            <div style={{ position: 'fixed', bottom: 12, left: 'calc(var(--nav-w) + 16px)', zIndex: 50 }}>
              <span className="badge badge-muted" title={`Running on ${platform}`}>
                Demo mode · {platform}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
