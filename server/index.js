import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import { seedDemoUser } from './seed.js'
import { storeFile } from './lib/store.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT ?? 5174)
const HOST = process.env.HOST ?? '0.0.0.0'

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1) // behind the dev/preview proxy

app.use(cors())
app.use(express.json({ limit: '64kb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'kalori-api', time: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)

// Optional: serve the production build from this process too
// (`npm run build && SERVE_STATIC=1 npm start`).
const distDir = path.resolve(__dirname, '..', 'dist')
if (process.env.SERVE_STATIC === '1' || (process.env.NODE_ENV === 'production' && fs.existsSync(distDir))) {
  app.use(express.static(distDir))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.use('/api', (_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', fields: {} } }))

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity
app.use((err, _req, res, _next) => {
  console.error('[api] unhandled error:', err)
  res.status(500).json({ error: { code: 'SERVER_ERROR', fields: {} } })
})

await seedDemoUser()

app.listen(PORT, HOST, () => {
  console.log(`[api] Kalori auth API listening on http://${HOST}:${PORT}`)
  console.log(`[api] user store: ${storeFile}`)
})
