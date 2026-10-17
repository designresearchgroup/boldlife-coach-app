import { contextBridge, ipcRenderer } from 'electron'

export interface ScreenSource {
  id: string
  name: string
  thumbnail: string
}

// The only surface the renderer gets onto the main process. Everything is a
// narrow, named call — no raw ipcRenderer, no node access in the renderer.
const bold = {
  isElectron: true as const,
  platform: process.platform,
  getScreenSources: (): Promise<ScreenSource[]> => ipcRenderer.invoke('screen:getSources'),
  saveRecording: (
    data: ArrayBuffer,
    suggestedName: string
  ): Promise<{ saved: boolean; filePath?: string }> =>
    ipcRenderer.invoke('recording:save', data, suggestedName)
}

contextBridge.exposeInMainWorld('bold', bold)

export type BoldApi = typeof bold
