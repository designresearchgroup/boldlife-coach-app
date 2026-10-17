import { useEffect, useRef, useState } from 'react'
import { useStore } from '@renderer/state/store'
import { Icon } from '@renderer/components/Icon'
import {
  getCamera,
  captureScreen,
  listScreenSources,
  canScreenShare,
  SessionRecorder,
  saveRecording,
  type ScreenSource
} from '@renderer/services/video'
import { coachOpener, coachReply, chatMode, type ChatMessage } from '@renderer/services/chat'
import { isElectron } from '@renderer/services/env'

export default function Session(): JSX.Element {
  const s = useStore()
  const stageRef = useRef<HTMLVideoElement>(null)
  const selfRef = useRef<HTMLVideoElement>(null)
  const recorderRef = useRef<SessionRecorder>(new SessionRecorder())

  const [cam, setCam] = useState<MediaStream | null>(null)
  const [screen, setScreen] = useState<MediaStream | null>(null)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [recording, setRecording] = useState(false)
  const [mediaError, setMediaError] = useState<string | null>(null)

  const [picker, setPicker] = useState<ScreenSource[] | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const chatEnd = useRef<HTMLDivElement>(null)

  // Start the camera and greet.
  useEffect(() => {
    let mounted = true
    getCamera()
      .then((stream) => {
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        setCam(stream)
      })
      .catch(() => setMediaError('Camera/mic unavailable or not permitted — chat still works.'))
    setMessages([
      { id: id(), from: 'coach', who: 'Coach', text: coachOpener(), at: Date.now() }
    ])
    return (): void => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Attach streams to the video elements.
  useEffect(() => {
    if (selfRef.current) selfRef.current.srcObject = cam
  }, [cam, sharing])
  useEffect(() => {
    if (stageRef.current) stageRef.current.srcObject = sharing ? screen : cam
  }, [sharing, screen, cam, camOn])

  // Clean up every track when the room closes.
  useEffect(() => {
    return (): void => {
      cam?.getTracks().forEach((t) => t.stop())
      screen?.getTracks().forEach((t) => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cam, screen])

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const toggleMic = (): void => {
    if (!cam) return
    const on = !micOn
    cam.getAudioTracks().forEach((t) => (t.enabled = on))
    setMicOn(on)
  }
  const toggleCam = (): void => {
    if (!cam) return
    const on = !camOn
    cam.getVideoTracks().forEach((t) => (t.enabled = on))
    setCamOn(on)
  }

  const startShareWeb = async (): Promise<void> => {
    try {
      const stream = await captureScreen()
      attachScreen(stream)
    } catch {
      /* user cancelled */
    }
  }
  const openShare = async (): Promise<void> => {
    if (sharing) {
      stopShare()
      return
    }
    if (isElectron) {
      const sources = await listScreenSources()
      setPicker(sources)
    } else {
      void startShareWeb()
    }
  }
  const pickSource = async (src: ScreenSource): Promise<void> => {
    setPicker(null)
    try {
      const stream = await captureScreen(src.id)
      attachScreen(stream)
    } catch {
      setMediaError('Could not capture that screen.')
    }
  }
  const attachScreen = (stream: MediaStream): void => {
    setScreen(stream)
    setSharing(true)
    // If the user stops sharing from the OS, reflect it in the UI.
    stream.getVideoTracks()[0]?.addEventListener('ended', stopShare)
  }
  const stopShare = (): void => {
    setScreen((cur) => {
      cur?.getTracks().forEach((t) => t.stop())
      return null
    })
    setSharing(false)
  }

  const toggleRecord = async (): Promise<void> => {
    if (recording) {
      const blob = await recorderRef.current.stop()
      setRecording(false)
      const name = `bold-session-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.webm`
      const res = await saveRecording(blob, name)
      if (res.saved) {
        s.addRecording({ id: id(), name, at: Date.now(), savedPath: res.filePath })
      }
      return
    }
    // Record whatever is on the stage, plus mic audio.
    const videoTrack = (sharing ? screen : cam)?.getVideoTracks()[0]
    const audioTrack = cam?.getAudioTracks()[0]
    if (!videoTrack) {
      setMediaError('Nothing to record — enable your camera or share your screen first.')
      return
    }
    const mix = new MediaStream()
    mix.addTrack(videoTrack)
    if (audioTrack) mix.addTrack(audioTrack)
    recorderRef.current.start(mix)
    setRecording(true)
  }

  const end = async (): Promise<void> => {
    if (recording) await toggleRecord()
    cam?.getTracks().forEach((t) => t.stop())
    screen?.getTracks().forEach((t) => t.stop())
    s.go('dashboard')
  }

  const send = (): void => {
    const text = input.trim()
    if (!text) return
    setMessages((m) => [...m, { id: id(), from: 'me', who: 'You', text, at: Date.now() }])
    setInput('')
    window.setTimeout(() => {
      setMessages((m) => [...m, { id: id(), from: 'coach', who: 'Coach', text: coachReply(text), at: Date.now() }])
    }, 900)
  }

  const stageEmpty = !sharing && !camOn

  return (
    <div className="room">
      <div className="stage">
        {recording && (
          <div className="rec-dot">
            <b /> REC
          </div>
        )}
        {stageEmpty ? (
          <div className="stage-empty">
            {mediaError ?? 'Camera is off. Turn it on, or share your screen to begin.'}
          </div>
        ) : (
          <video ref={stageRef} autoPlay playsInline muted={!sharing} />
        )}
        {sharing && (
          <div className="selfcam">
            <video ref={selfRef} autoPlay playsInline muted />
          </div>
        )}
        {!sharing && (
          <div
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              fontFamily: 'var(--mono)',
              fontSize: 12,
              color: '#bbb',
              background: 'rgba(0,0,0,.5)',
              padding: '5px 10px',
              borderRadius: 999
            }}
          >
            {chatMode() === 'demo' ? 'Demo · your coach joins here when live' : 'Connected'}
          </div>
        )}
      </div>

      <div className="chat">
        <div className="chat-h">Session chat</div>
        <div className="chat-body">
          {messages.map((m) => (
            <div key={m.id} className={'msg ' + (m.from === 'me' ? 'me' : 'them')}>
              <span className="who">{m.who}</span>
              {m.text}
            </div>
          ))}
          <div ref={chatEnd} />
        </div>
        <div className="chat-in">
          <input
            value={input}
            placeholder="Message…"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button className="btn btn-solid btn-sm" onClick={send}>
            Send
          </button>
        </div>
      </div>

      <div className="controls">
        <div className="ctrl">
          <button className={micOn ? 'on' : ''} onClick={toggleMic} title="Microphone">
            <Icon name="mic" size={19} />
          </button>
          <span>{micOn ? 'Mic on' : 'Muted'}</span>
        </div>
        <div className="ctrl">
          <button className={camOn ? 'on' : ''} onClick={toggleCam} title="Camera">
            <Icon name="video" size={19} />
          </button>
          <span>{camOn ? 'Cam on' : 'Cam off'}</span>
        </div>
        {canScreenShare() && (
          <div className="ctrl">
            <button className={sharing ? 'on' : ''} onClick={openShare} title="Share screen">
              <Icon name="screen" size={19} />
            </button>
            <span>{sharing ? 'Stop share' : 'Share'}</span>
          </div>
        )}
        <div className="ctrl">
          <button className={recording ? 'rec' : ''} onClick={toggleRecord} title="Record">
            <Icon name={recording ? 'stop' : 'rec'} size={recording ? 16 : 19} />
          </button>
          <span>{recording ? 'Stop' : 'Record'}</span>
        </div>
        <div className="ctrl">
          <button className="end" onClick={end} title="End session">
            <Icon name="phone" size={19} />
          </button>
          <span>End</span>
        </div>
      </div>

      {picker && (
        <div className="modal-bg" onClick={() => setPicker(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="display" style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--sp5)' }}>
              Share a screen or window
            </h3>
            {picker.length === 0 ? (
              <p className="muted">No sources available.</p>
            ) : (
              <div className="srcgrid">
                {picker.map((src) => (
                  <div key={src.id} className="src" onClick={() => pickSource(src)}>
                    <img src={src.thumbnail} alt="" />
                    <span>{src.name}</span>
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 'var(--sp5)' }} onClick={() => setPicker(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function id(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
