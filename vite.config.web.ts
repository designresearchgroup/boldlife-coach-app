import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Standalone web build/dev of the renderer only — used to preview and test the
// UI in a plain browser (no Electron). Features that need the desktop (screen
// capture, save-to-disk) feature-detect `window.bold` and degrade gracefully.
export default defineConfig({
  root: 'src/renderer',
  base: './',
  resolve: {
    alias: { '@renderer': resolve(__dirname, 'src/renderer/src') }
  },
  plugins: [react()],
  server: { port: 5199, strictPort: true, host: true },
  build: { outDir: resolve(__dirname, 'dist-web'), emptyOutDir: true }
})
