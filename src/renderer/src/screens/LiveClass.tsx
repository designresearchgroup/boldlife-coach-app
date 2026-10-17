import { useEffect, useRef, useState } from 'react'
import { useStore } from '@renderer/state/store'
import { Icon } from '@renderer/components/Icon'
import { getCamera, canScreenShare } from '@renderer/services/video'
import { createRoom } from '@renderer/services/rtc'
import { getSupabase, liveConfigured, iceServers } from '@renderer/services/live'

// A video tile that binds a MediaStream to its <video> element.
function Tile({
  stream,
  name,
  self,
  hand,
  staff
}: {
  stream: MediaStream | null
  name: string
  self: boolean
  hand: boolean
  staff: boolean
}): JSX.Element {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream
  }, [stream])
  const initial = (name || '?').trim().charAt(0).toUpperCase()
  const hasVideo = !!stream && stream.getVideoTracks().some((t) => t.enabled && t.readyState === 'live')
  return (
    <div className={'lc-tile' + (self ? ' self' : '') + (hasVideo ? '' : ' camoff')}>
      <video ref={ref} autoPlay playsInline muted={self} />
      <div className="lc-avatar">
        <div className="lc-circle">{initial}</div>
      </div>
      <div className="lc-name">
        {hand && <span className="lc-hand">✋</span>}
        {name}
        {staff && <span className="lc-staff">Host</span>}
        {self && ' (you)'}
      </div>
    </div>
  )
}

interface RemoteTile {
  id: string
  name: string
  stream: MediaStream | null
  staff: boolean
  hand: boolean
}
interface ChatLine {
  id: string
  who: string
  text: string
  self: boolean
}

export default function LiveClass(): JSX.Element {
  const s = useStore()
  const roomRef = useRef<ReturnType<typeof createRoom> | null>(null)
  const localRef = useRef<MediaStream | null>(null)
  const selfId = useRef<string>(rid())

  const [local, setLocal] = useState<MediaStream | null>(null)
  const [remotes, setRemotes] = useState<RemoteTile[]>([])
  const [hands, setHands] = useState<Record<string, boolean>>({})
  const [chat, setChat] = useState<ChatLine[]>([])
  const [input, setInput] = useState('')
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [handUp, setHandUp] = useState(false)
  const [net, setNet] = useState<string>(liveConfigured() ? 'connecting' : 'local')
  const [tab, setTab] = useState<'chat' | 'people'>('people')
  const [err, setErr] = useState<string | null>(null)
  const chatEnd = useRef<HTMLDivElement>(null)

  const isStaff = s.role === 'coach'
  const myName = isStaff ? 'Coach' : s.learnerName || 'You'

  useEffect(() => {
    let mounted = true
    getCamera()
      .then((stream) => {
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        localRef.current = stream
        setLocal(stream)
        connect(stream)
      })
      .catch(() => setErr('Camera/mic unavailable or not permitted.'))
    return (): void => {
      mounted = false
      teardown()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat])

  function connect(stream: MediaStream): void {
    const sb = getSupabase()
    if (!sb) {
      setNet('local')
      return
    }
    const room = createRoom({
      sb,
      channelName: 'boldlife-live-class',
      selfId: selfId.current,
      displayName: myName,
      isStaff,
      iceServers,
      localStream: stream
    })
    roomRef.current = room
    room.onTrack = (pid: string, s2: MediaStream): void => {
      setRemotes((list) =>
        list.some((t) => t.id === pid)
          ? list.map((t) => (t.id === pid ? { ...t, stream: s2 } : t))
          : [...list, { id: pid, name: 'Guest', stream: s2, staff: false, hand: false }]
      )
    }
    room.onPeerLeft = (pid: string): void => setRemotes((list) => list.filter((t) => t.id !== pid))
    room.onRosterChange = (
      roster: Array<{ id: string; name: string; isStaff: boolean; hand: boolean; self: boolean }>
    ): void => {
      setRemotes((list) =>
        list.map((t) => {
          const r = roster.find((x) => x.id === t.id)
          return r ? { ...t, name: r.name, staff: r.isStaff, hand: r.hand } : t
        })
      )
    }
    room.onHand = (pid: string, raised: boolean): void =>
      setHands((h) => ({ ...h, [pid]: raised }))
    room.onChat = (pid: string, name: string, text: string): void =>
      setChat((c) => [...c, { id: rid(), who: name, text, self: false }])
    room.onNetState = (st: string): void => setNet(st)
    void room.join()
  }

  function teardown(): void {
    try {
      roomRef.current?.leave()
    } catch {
      /* ignore */
    }
    roomRef.current = null
    localRef.current?.getTracks().forEach((t) => t.stop())
  }

  const toggleMic = (): void => {
    const on = !micOn
    localRef.current?.getAudioTracks().forEach((t) => (t.enabled = on))
    roomRef.current?.setMicEnabled(on)
    setMicOn(on)
  }
  const toggleCam = (): void => {
    const on = !camOn
    localRef.current?.getVideoTracks().forEach((t) => (t.enabled = on))
    roomRef.current?.setCamEnabled(on)
    setCamOn(on)
  }
  const toggleShare = async (): Promise<void> => {
    const room = roomRef.current
    if (!room) {
      setErr('Screen share goes live to the class once a Supabase project is connected.')
      return
    }
    if (sharing) {
      room.stopScreenShare()
      setSharing(false)
    } else {
      const ok = await room.startScreenShare()
      if (ok) setSharing(true)
    }
  }
  const toggleHand = (): void => {
    const up = !handUp
    roomRef.current?.raiseHand(up)
    setHandUp(up)
  }
  const send = (): void => {
    const text = input.trim()
    if (!text) return
    roomRef.current?.sendChat(text)
    setChat((c) => [...c, { id: rid(), who: myName, text, self: true }])
    setInput('')
  }
  const leave = (): void => {
    teardown()
    s.go('dashboard')
  }

  const peopleCount = remotes.length + 1
  const netLabel: Record<string, string> = {
    connecting: 'Connecting…',
    connected: 'Live',
    reconnecting: 'Reconnecting…',
    offline: 'Offline',
    local: 'Local preview'
  }

  return (
    <div className="lc">
      <div className="lc-top">
        <div className="lc-title">
          Live class
          <span className={'lc-net ' + net}>
            <b /> {netLabel[net] || net}
          </span>
        </div>
        <div className="lc-top-r">
          <span className="lc-count">
            <Icon name="user" size={14} /> {peopleCount}
          </span>
          <button className="btn btn-sm end" onClick={leave}>
            <Icon name="phone" size={15} /> Leave
          </button>
        </div>
      </div>

      <div className="lc-body">
        <div className="lc-grid">
          <Tile stream={local} name={myName} self hand={handUp} staff={isStaff} />
          {remotes.map((t) => (
            <Tile key={t.id} stream={t.stream} name={t.name} self={false} hand={!!hands[t.id] || t.hand} staff={t.staff} />
          ))}
          {err && <div className="lc-err">{err}</div>}
        </div>

        <div className="lc-panel">
          <div className="lc-tabs">
            <button className={tab === 'people' ? 'on' : ''} onClick={() => setTab('people')}>
              People ({peopleCount})
            </button>
            <button className={tab === 'chat' ? 'on' : ''} onClick={() => setTab('chat')}>
              Chat
            </button>
          </div>
          {tab === 'people' ? (
            <div className="lc-plist">
              <div className="lc-prow">
                <span>{myName} (you)</span>
                {isStaff && <span className="lc-staff">Host</span>}
                {handUp && <span>✋</span>}
              </div>
              {remotes.map((t) => (
                <div key={t.id} className="lc-prow">
                  <span>{t.name}</span>
                  {t.staff && <span className="lc-staff">Host</span>}
                  {(hands[t.id] || t.hand) && <span>✋</span>}
                </div>
              ))}
            </div>
          ) : (
            <div className="lc-chat">
              <div className="lc-chatlog">
                {chat.length === 0 && <div className="lc-muted">No messages yet.</div>}
                {chat.map((m) => (
                  <div key={m.id} className="lc-cmsg">
                    <span className="who">{m.self ? 'You' : m.who}</span>
                    {m.text}
                  </div>
                ))}
                <div ref={chatEnd} />
              </div>
              <div className="lc-chatin">
                <input
                  value={input}
                  placeholder="Message the class…"
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                />
                <button className="btn btn-sm btn-solid" onClick={send}>
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {net === 'local' && (
        <div className="lc-note">
          Local preview — you see your own camera. Connect a Bold Life Supabase project
          (<code>VITE_SUPABASE_URL</code> / <code>VITE_SUPABASE_ANON_KEY</code>) to go live with the class.
        </div>
      )}

      <div className="controls lc-controls">
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
            <button className={sharing ? 'on' : ''} onClick={toggleShare} title="Share screen">
              <Icon name="screen" size={19} />
            </button>
            <span>{sharing ? 'Stop share' : 'Share'}</span>
          </div>
        )}
        <div className="ctrl">
          <button className={handUp ? 'on' : ''} onClick={toggleHand} title="Raise hand">
            <span style={{ fontSize: 18, lineHeight: 1 }}>✋</span>
          </button>
          <span>{handUp ? 'Lower' : 'Hand'}</span>
        </div>
        <div className="ctrl">
          <button className="end" onClick={leave} title="Leave class">
            <Icon name="phone" size={19} />
          </button>
          <span>Leave</span>
        </div>
      </div>
    </div>
  )
}

function rid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
