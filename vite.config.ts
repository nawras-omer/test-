import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

const API_TARGET = process.env.API_TARGET ?? 'http://127.0.0.1:5174'

// The browser only ever talks to this Vite origin: `/api/*` is proxied to the
// Express auth server on the server side, so the app works unchanged behind a
// preview proxy / reverse proxy in production too.
const proxy = {
  '/api': {
    target: API_TARGET,
    changeOrigin: true,
    secure: false,
  },
}

export default defineConfig({
  root: 'client',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./client/src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    // Allow tunnel/preview hosts (e.g. *.e2b.app) to reach the dev server.
    allowedHosts: true,
    proxy,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: false,
    allowedHosts: true,
    proxy,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: false,
  },
})
