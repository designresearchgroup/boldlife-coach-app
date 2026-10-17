// Self-contained so the renderer's web typecheck doesn't pull in Electron.
export interface ScreenSource {
  id: string
  name: string
  thumbnail: string
}

export interface BoldApi {
  isElectron: true
  platform: string
  getScreenSources: () => Promise<ScreenSource[]>
  saveRecording: (
    data: ArrayBuffer,
    suggestedName: string
  ) => Promise<{ saved: boolean; filePath?: string }>
}

declare global {
  interface Window {
    // Present only under Electron; the renderer feature-detects it.
    bold?: BoldApi
  }
}

export {}
