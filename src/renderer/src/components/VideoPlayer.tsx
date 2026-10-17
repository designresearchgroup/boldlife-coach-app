import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Icon } from '@renderer/components/Icon'

const RATES = [1, 1.25, 1.5, 2, 0.75]

function fmt(t: number): string {
  if (!isFinite(t) || t < 0) t = 0
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export interface VideoPlayerProps {
  src: string
  poster?: string
  /** Seconds to resume from (set once, on load). */
  resumeAt?: number
  /** Called ~every few seconds with the current position, for resume/progress. */
  onProgress?: (seconds: number) => void
  /** Called when playback reaches the end. */
  onEnded?: () => void
}

export function VideoPlayer({
  src,
  poster,
  resumeAt = 0,
  onProgress,
  onEnded
}: VideoPlayerProps): JSX.Element {
  const wrapRef = useRef<HTMLDivElement>(null)
  const vidRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [ended, setEnded] = useState(false)
  const [cur, setCur] = useState(0)
  const [dur, setDur] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [muted, setMuted] = useState(false)
  const [rate, setRate] = useState(1)
  const [full, setFull] = useState(false)
  const [uiOn, setUiOn] = useState(true)
  const hideTimer = useRef<ReturnType<typeof setTimeout>>()
  const lastSave = useRef(0)
  const resumed = useRef(false)

  // Keep video rate in sync.
  useEffect(() => {
    if (vidRef.current) vidRef.current.playbackRate = rate
  }, [rate])

  // Track fullscreen changes (incl. Esc).
  useEffect(() => {
    const onFs = (): void => setFull(document.fullscreenElement === wrapRef.current)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  const toggle = (): void => {
    const v = vidRef.current
    if (!v) return
    if (v.paused) void v.play()
    else v.pause()
  }
  const seek = (to: number): void => {
    const v = vidRef.current
    if (!v || !isFinite(to)) return
    v.currentTime = Math.max(0, Math.min(to, v.duration || 0))
    setEnded(false)
  }
  const nudge = (d: number): void => seek((vidRef.current?.currentTime ?? 0) + d)

  const showUi = (): void => {
    setUiOn(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      if (vidRef.current && !vidRef.current.paused) setUiOn(false)
    }, 2600)
  }

  const cycleRate = (): void => {
    const i = RATES.indexOf(rate)
    setRate(RATES[(i + 1) % RATES.length])
  }

  const toggleFull = (): void => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void wrapRef.current?.requestFullscreen?.()
  }

  const onKey = (e: React.KeyboardEvent): void => {
    if (e.key === ' ' || e.key === 'k') {
      e.preventDefault()
      toggle()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      nudge(5)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      nudge(-5)
    } else if (e.key === 'f') {
      toggleFull()
    } else if (e.key === 'm') {
      setMuted((m) => !m)
    }
    showUi()
  }

  const pct = dur ? (cur / dur) * 100 : 0
  const bufPct = dur ? (buffered / dur) * 100 : 0

  return (
    <div
      ref={wrapRef}
      className={'vp' + (uiOn || !playing ? ' ui' : '') + (full ? ' full' : '')}
      tabIndex={0}
      role="group"
      aria-label="Video player"
      onKeyDown={onKey}
      onMouseMove={showUi}
      onClick={(e) => {
        // Click the video area (not the control bar) to play/pause.
        if ((e.target as HTMLElement).closest('.vp-bar')) return
        toggle()
      }}
    >
      <video
        ref={vidRef}
        className="vp-video"
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        onLoadedMetadata={(e) => {
          const v = e.currentTarget
          setDur(v.duration || 0)
          v.playbackRate = rate
          if (!resumed.current && resumeAt > 2 && resumeAt < (v.duration || 0) - 5) {
            v.currentTime = resumeAt
          }
          resumed.current = true
        }}
        onPlay={() => {
          setPlaying(true)
          setEnded(false)
          showUi()
        }}
        onPause={() => {
          setPlaying(false)
          setUiOn(true)
        }}
        onTimeUpdate={(e) => {
          const v = e.currentTarget
          setCur(v.currentTime)
          if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1))
          if (onProgress && v.currentTime - lastSave.current > 4) {
            lastSave.current = v.currentTime
            onProgress(v.currentTime)
          }
        }}
        onEnded={(e) => {
          setPlaying(false)
          setEnded(true)
          setUiOn(true)
          onProgress?.(e.currentTarget.duration || 0)
          onEnded?.()
        }}
      />

      {/* Center play / replay */}
      {!playing && (
        <button
          className="vp-big"
          onClick={(e) => {
            e.stopPropagation()
            if (ended) seek(0)
            toggle()
          }}
          aria-label={ended ? 'Replay' : 'Play'}
        >
          <Icon name={ended ? 'replay' : 'play'} size={30} />
        </button>
      )}

      {/* Control bar */}
      <div className="vp-bar" onClick={(e) => e.stopPropagation()}>
        <div className="vp-scrub">
          <div className="vp-track">
            <span className="vp-buf" style={{ width: bufPct + '%' }} />
            <span className="vp-fill" style={{ width: pct + '%' }} />
          </div>
          <input
            type="range"
            className="vp-range"
            min={0}
            max={dur || 0}
            step="any"
            value={cur}
            onChange={(e) => seek(parseFloat(e.target.value))}
            aria-label="Seek"
          />
        </div>
        <div className="vp-ctrls">
          <button className="vp-b" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
            <Icon name={playing ? 'pause' : 'play'} size={18} />
          </button>
          <button className="vp-b" onClick={() => setMuted((m) => !m)} aria-label={muted ? 'Unmute' : 'Mute'}>
            <Icon name={muted ? 'mute' : 'volume'} size={18} />
          </button>
          <span className="vp-time mono">
            {fmt(cur)} <span className="vp-dim">/ {fmt(dur)}</span>
          </span>
          <div className="vp-sp" />
          <button className="vp-b vp-rate" onClick={cycleRate} aria-label="Playback speed">
            {rate}&times;
          </button>
          <button className="vp-b" onClick={toggleFull} aria-label="Fullscreen">
            <Icon name="expand" size={18} />
          </button>
        </div>
      </div>
      {/* muted is applied via prop below */}
      <MutedSync vidRef={vidRef} muted={muted} />
    </div>
  )
}

// Keep the <video>.muted DOM property in sync (it isn't a React-controlled attr).
function MutedSync({
  vidRef,
  muted
}: {
  vidRef: React.RefObject<HTMLVideoElement>
  muted: boolean
}): null {
  useEffect(() => {
    if (vidRef.current) vidRef.current.muted = muted
  }, [muted, vidRef])
  return null
}

export const vpInlineFallback: CSSProperties = { background: '#000' }
