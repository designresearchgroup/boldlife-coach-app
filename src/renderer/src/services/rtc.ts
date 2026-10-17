// @ts-nocheck
/* rtc.ts · dependency-free full-mesh WebRTC over Supabase Realtime.
   Ported verbatim from the Custom Image instructor app (customimage-rtc.js) —
   our own live-class engine, no third-party video SaaS (no Daily/Zoom).

   createRoom({ sb, channelName, selfId, displayName, isStaff, iceServers,
                localStream }) -> room

   Signaling: Supabase Realtime `broadcast` (SDP/ICE, chat, hand, control,
   breakout) + `presence` (roster + peer discovery). One RTCPeerConnection per
   remote peer (mesh, intended for small cohorts, <= ~6).

   Media: `localStream` is owned by the caller (getUserMedia + permissions).
   Mic/cam toggles flip track.enabled. Screen share swaps the video track via
   sender.replaceTrack (no renegotiation). Glare: perfect negotiation.

   Callbacks (assign on the returned object; plain functions):
     onPeerJoined(id, meta) onPeerLeft(id) onTrack(id, stream)
     onRosterChange(list)   onChat(id,name,text,ts) onHand(id,raised)
     onControl(id,action,payload) onBreakout(targetIdx|null)
     onConnState(id,state)  onLocalVideo(track) onError(kind,err) onNetState(s)
*/
export function createRoom(opts: any): any {
  var sb = opts.sb
  var channelName = opts.channelName
  var selfId = opts.selfId
  var displayName = opts.displayName || 'Guest'
  var isStaff = !!opts.isStaff
  var iceServers = opts.iceServers || []
  var localStream = opts.localStream || null

  var channel = null
  var peers = {} // peerId -> { pc, makingOffer, ignoreOffer, polite }
  var roster = {} // peerId -> presence meta
  var handRaised = false
  var joined = false

  var camTrack = localStream ? localStream.getVideoTracks()[0] || null : null
  var currentVideoTrack = camTrack // what we're sending (camera or screen)
  var screenStream = null

  var api = {
    onPeerJoined: null,
    onPeerLeft: null,
    onTrack: null,
    onRosterChange: null,
    onChat: null,
    onHand: null,
    onControl: null,
    onBreakout: null,
    onConnState: null,
    onLocalVideo: null,
    onError: null,
    onNetState: null
  }
  var netState = 'connecting'
  var reconnectTimer = null
  var reconnectTries = 0
  function setNet(s) {
    if (s !== netState) {
      netState = s
      emit('onNetState', s)
    }
  }
  function emit(name) {
    var fn = api[name]
    if (typeof fn === 'function') {
      try {
        fn.apply(null, [].slice.call(arguments, 1))
      } catch (e) {
        /* swallow */
      }
    }
  }

  function audioTrack() {
    return localStream ? localStream.getAudioTracks()[0] || null : null
  }

  // ---- peer connections ----
  function newPeer(peerId) {
    if (peers[peerId]) return peers[peerId]
    var pc = new RTCPeerConnection({ iceServers: iceServers })
    var st = { pc: pc, makingOffer: false, ignoreOffer: false, polite: selfId > peerId }
    peers[peerId] = st

    var haveAudio = false,
      haveVideo = false
    if (localStream) {
      if (audioTrack()) {
        pc.addTrack(audioTrack(), localStream)
        haveAudio = true
      }
      if (currentVideoTrack) {
        pc.addTrack(currentVideoTrack, localStream)
        haveVideo = true
      }
    }
    if (!haveAudio) pc.addTransceiver('audio', { direction: 'recvonly' })
    if (!haveVideo) pc.addTransceiver('video', { direction: 'recvonly' })

    pc.onicecandidate = function (e) {
      if (e.candidate) signal(peerId, { kind: 'ice', data: e.candidate })
    }
    pc.ontrack = function (e) {
      emit('onTrack', peerId, e.streams[0])
    }
    pc.onconnectionstatechange = function () {
      var cs = pc.connectionState
      emit('onConnState', peerId, cs)
      if (cs === 'connected') {
        if (st.recoTimer) {
          clearTimeout(st.recoTimer)
          st.recoTimer = null
        }
        st.recoTries = 0
      } else if (cs === 'failed') {
        escalateRecovery(peerId)
      }
    }
    pc.oniceconnectionstatechange = function () {
      var ics = pc.iceConnectionState
      if (ics === 'disconnected') {
        if (!st.recoTimer) {
          st.recoTimer = setTimeout(function () {
            st.recoTimer = null
            if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
              escalateRecovery(peerId)
            }
          }, 3500)
        }
      } else if (ics === 'failed') {
        escalateRecovery(peerId)
      } else if (ics === 'connected' || ics === 'completed') {
        if (st.recoTimer) {
          clearTimeout(st.recoTimer)
          st.recoTimer = null
        }
        st.recoTries = 0
      }
    }
    pc.onnegotiationneeded = async function () {
      try {
        st.makingOffer = true
        await pc.setLocalDescription()
        signal(peerId, { kind: 'desc', data: pc.localDescription })
      } catch (err) {
        emit('onError', 'negotiation', err)
      } finally {
        st.makingOffer = false
      }
    }
    emit('onPeerJoined', peerId, roster[peerId] || {})
    return st
  }

  function closePeer(peerId) {
    var st = peers[peerId]
    if (!st) return
    if (st.recoTimer) {
      clearTimeout(st.recoTimer)
      st.recoTimer = null
    }
    try {
      st.pc.close()
    } catch (e) {}
    delete peers[peerId]
  }

  function escalateRecovery(peerId) {
    var st = peers[peerId]
    if (!st) return
    st.recoTries = (st.recoTries || 0) + 1
    if (st.recoTries <= 2) {
      try {
        st.pc.restartIce && st.pc.restartIce()
      } catch (e) {}
      if (!st.polite) {
        try {
          st.makingOffer = true
          st.pc
            .setLocalDescription({ iceRestart: true })
            .then(function () {
              signal(peerId, { kind: 'desc', data: st.pc.localDescription })
            })
            .catch(function () {})
            .then(function () {
              st.makingOffer = false
            })
        } catch (e) {
          st.makingOffer = false
        }
      }
    } else if (roster[peerId]) {
      st.recoTries = 0
      if (!st.polite) {
        closePeer(peerId)
        newPeer(peerId)
      }
    }
  }

  function signal(to, msg) {
    if (!channel) return
    var payload = { to: to, from: selfId, kind: msg.kind, data: msg.data }
    channel.send({ type: 'broadcast', event: 'signal', payload: payload })
  }

  async function onSignal(payload) {
    if (!payload || payload.to !== selfId) return
    var peerId = payload.from
    var st = peers[peerId] || newPeer(peerId)
    var pc = st.pc
    try {
      if (payload.kind === 'desc') {
        var desc = payload.data
        var collision = desc.type === 'offer' && (st.makingOffer || pc.signalingState !== 'stable')
        st.ignoreOffer = !st.polite && collision
        if (st.ignoreOffer) return
        await pc.setRemoteDescription(desc)
        if (desc.type === 'offer') {
          await pc.setLocalDescription()
          signal(peerId, { kind: 'desc', data: pc.localDescription })
        }
      } else if (payload.kind === 'ice') {
        try {
          await pc.addIceCandidate(payload.data)
        } catch (err) {
          if (!st.ignoreOffer) throw err
        }
      }
    } catch (err) {
      emit('onError', 'signal', err)
    }
  }

  // ---- presence: roster + discovery ----
  function onPresenceSync() {
    var state = channel.presenceState()
    var present = {}
    Object.keys(state).forEach(function (key) {
      ;(state[key] || []).forEach(function (m) {
        if (m && m.id) present[m.id] = m
      })
    })
    roster = present

    Object.keys(present).forEach(function (pid) {
      if (pid !== selfId && !peers[pid]) newPeer(pid)
    })
    Object.keys(peers).forEach(function (pid) {
      if (!present[pid]) {
        closePeer(pid)
        emit('onPeerLeft', pid)
      }
    })
    emit('onRosterChange', rosterList())
  }

  function rosterList() {
    return Object.keys(roster).map(function (pid) {
      var m = roster[pid] || {}
      return { id: pid, name: m.name || 'Guest', isStaff: !!m.isStaff, hand: !!m.hand, self: pid === selfId }
    })
  }

  function trackSelf() {
    if (channel) channel.track({ id: selfId, name: displayName, isStaff: isStaff, hand: handRaised })
  }

  // ---- lifecycle ----
  function wireChannel() {
    channel = sb.channel(channelName, {
      config: { presence: { key: selfId }, broadcast: { self: false } }
    })

    channel.on('broadcast', { event: 'signal' }, function (m) {
      onSignal(m.payload)
    })
    channel.on('broadcast', { event: 'chat' }, function (m) {
      var p = m.payload
      if (p && p.from !== selfId) emit('onChat', p.from, p.name, p.text, p.ts)
    })
    channel.on('broadcast', { event: 'hand' }, function (m) {
      var p = m.payload
      if (p) emit('onHand', p.from, p.raised)
    })
    channel.on('broadcast', { event: 'ctrl' }, function (m) {
      var p = m.payload
      if (!p) return
      var meta = roster[p.from]
      if (meta && meta.isStaff) emit('onControl', p.from, p.action, p.payload)
    })
    channel.on('broadcast', { event: 'breakout' }, function (m) {
      var p = m.payload
      if (!p) return
      var meta = roster[p.from]
      if (!(meta && meta.isStaff)) return
      var map = p.map || {}
      var target = map[selfId]
      emit('onBreakout', target === undefined || target === null || target === 'main' ? null : target)
    })
    channel.on('presence', { event: 'sync' }, onPresenceSync)
  }

  function subscribeChannel(onFirst) {
    channel.subscribe(function (status) {
      if (status === 'SUBSCRIBED') {
        reconnectTries = 0
        setNet('connected')
        trackSelf()
        Object.keys(peers).forEach(function (pid) {
          var st = peers[pid]
          var cs = st && st.pc && st.pc.connectionState
          if (cs === 'failed' || cs === 'disconnected') escalateRecovery(pid)
        })
        if (onFirst) {
          onFirst()
          onFirst = null
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        if (joined) scheduleReconnect()
      }
    })
  }

  function scheduleReconnect() {
    if (!joined || reconnectTimer) return
    setNet('reconnecting')
    var delay = Math.min(1000 * Math.pow(2, reconnectTries), 15000)
    reconnectTries++
    reconnectTimer = setTimeout(function () {
      reconnectTimer = null
      if (!joined) return
      try {
        if (channel) sb.removeChannel(channel)
      } catch (e) {}
      wireChannel()
      subscribeChannel(null)
    }, delay)
  }

  function onOnline() {
    if (joined) {
      reconnectTries = 0
      scheduleReconnect()
    }
  }
  function onOffline() {
    if (joined) setNet('offline')
  }

  async function join() {
    if (joined) return
    joined = true
    setNet('connecting')
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('online', onOnline)
      window.addEventListener('offline', onOffline)
    }
    wireChannel()
    await new Promise(function (resolve) {
      subscribeChannel(resolve)
    })
  }

  function leave() {
    joined = false
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (typeof window !== 'undefined' && window.removeEventListener) {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
    Object.keys(peers).forEach(closePeer)
    if (channel) {
      try {
        channel.untrack()
      } catch (e) {}
      try {
        sb.removeChannel(channel)
      } catch (e) {}
      channel = null
    }
    roster = {}
  }

  // ---- media controls ----
  function setMicEnabled(on) {
    var t = audioTrack()
    if (t) t.enabled = !!on
  }
  function setCamEnabled(on) {
    var t = localStream && localStream.getVideoTracks()[0]
    if (t) t.enabled = !!on
  }

  function replaceVideoTrack(track) {
    currentVideoTrack = track || null
    Object.keys(peers).forEach(function (pid) {
      var senders = peers[pid].pc.getSenders()
      var vs = senders.filter(function (s) {
        return s.track && s.track.kind === 'video'
      })[0]
      if (vs && track) {
        try {
          vs.replaceTrack(track)
        } catch (e) {}
      }
    })
    emit('onLocalVideo', track)
  }

  async function startScreenShare() {
    try {
      screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      var screenTrack = screenStream.getVideoTracks()[0]
      replaceVideoTrack(screenTrack)
      screenTrack.onended = function () {
        stopScreenShare()
      }
      return true
    } catch (err) {
      emit('onError', 'screenshare', err)
      return false
    }
  }
  function stopScreenShare() {
    if (screenStream) {
      screenStream.getTracks().forEach(function (t) {
        try {
          t.stop()
        } catch (e) {}
      })
      screenStream = null
    }
    replaceVideoTrack(camTrack)
  }

  // ---- data / signals ----
  function sendChat(text) {
    if (!channel) return
    channel.send({
      type: 'broadcast',
      event: 'chat',
      payload: { from: selfId, name: displayName, text: text, ts: Date.now() }
    })
  }
  function raiseHand(on) {
    handRaised = !!on
    trackSelf()
    if (channel)
      channel.send({ type: 'broadcast', event: 'hand', payload: { from: selfId, raised: handRaised } })
  }
  function broadcastControl(obj) {
    if (!isStaff || !channel) return
    channel.send({
      type: 'broadcast',
      event: 'ctrl',
      payload: { from: selfId, action: obj.action, payload: obj.payload }
    })
  }
  function assignBreakout(map) {
    if (!isStaff || !channel) return
    channel.send({ type: 'broadcast', event: 'breakout', payload: { from: selfId, map: map } })
  }

  var room = {
    join: join,
    leave: leave,
    destroy: leave,
    setMicEnabled: setMicEnabled,
    setCamEnabled: setCamEnabled,
    startScreenShare: startScreenShare,
    stopScreenShare: stopScreenShare,
    sendChat: sendChat,
    raiseHand: raiseHand,
    broadcastControl: broadcastControl,
    assignBreakout: assignBreakout,
    roster: rosterList,
    netState: function () {
      return netState
    }
  }
  Object.keys(api).forEach(function (k) {
    Object.defineProperty(room, k, {
      get: function () {
        return api[k]
      },
      set: function (v) {
        api[k] = v
      }
    })
  })
  return room
}
