// Live-session media. Camera, screen share and recording are REAL here — they
// use the browser/Electron media APIs and work with no external service. Remote
// peering (two+ people in different places) is our own WebRTC mesh over Supabase
// Realtime — see services/rtc.ts + the Live Class screen. No third-party video SaaS.
// Mirrors the preload's ScreenSource shape without importing the preload module
// (which would pull Electron into the renderer's web typecheck).
export interface ScreenSource {
  id: string
  name: string
  thumbnail: string
}

export const canScreenShare = (): boolean =>
  !!(window.bold || (navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices))

export async function getCamera(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: true
  })
}

export async function getMic(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({ audio: true })
}

// Electron: list real screens/windows so we can show a picker.
export async function listScreenSources(): Promise<ScreenSource[]> {
  if (window.bold) return window.bold.getScreenSources()
  return []
}

// Electron captures a chosen source by id; the browser uses the native picker.
export async function captureScreen(sourceId?: string): Promise<MediaStream> {
  if (window.bold && sourceId) {
    // Electron's desktopCapturer path uses the legacy mandatory constraints.
    return navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: sourceId
        }
      }
    } as unknown as MediaStreamConstraints)
  }
  return navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
}

function pickMime(): string {
  const prefs = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
  for (const m of prefs) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) return m
  }
  return 'video/webm'
}

// Records whatever stream it is handed (the shared screen, or the camera) plus
// mixed-in mic audio, and hands back a WebM blob on stop.
export class SessionRecorder {
  private rec?: MediaRecorder
  private chunks: BlobPart[] = []

  start(stream: MediaStream): void {
    this.chunks = []
    this.rec = new MediaRecorder(stream, { mimeType: pickMime() })
    this.rec.ondataavailable = (e): void => {
      if (e.data && e.data.size > 0) this.chunks.push(e.data)
    }
    this.rec.start(1000)
  }

  get active(): boolean {
    return !!this.rec && this.rec.state === 'recording'
  }

  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.rec) return resolve(new Blob())
      this.rec.onstop = (): void => resolve(new Blob(this.chunks, { type: 'video/webm' }))
      this.rec.stop()
    })
  }
}

// Save a recording. Electron writes it to a chosen path on disk; the browser
// downloads it. Production also uploads to storage behind this same call.
export async function saveRecording(
  blob: Blob,
  name: string
): Promise<{ saved: boolean; filePath?: string }> {
  const buf = await blob.arrayBuffer()
  if (window.bold) return window.bold.saveRecording(buf, name)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
  return { saved: true }
}
