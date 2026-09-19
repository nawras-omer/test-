/**
 * Assistant API.
 *
 *   GET    /api/assistant/status           is an LLM provider configured?
 *   GET    /api/assistant/messages?limit   the saved transcript (oldest first)
 *   POST   /api/assistant/messages         persist one message
 *   DELETE /api/assistant/messages         clear the transcript
 *   POST   /api/assistant/respond          ask the LLM (503 when unconfigured)
 *
 * Messages are stored as *structure* — a role plus a `kind` and a small JSON
 * payload — never as rendered prose, so the history re-renders in whichever of
 * the three languages the user switches to.
 *
 * The rule engine that answers nutrition questions, suggests meals and parses
 * "I ate a chicken breast and rice" runs in the browser against the bundled
 * food database (instant, offline, no key). This endpoint only persists what
 * happened, and optionally proxies the open-ended questions to an LLM.
 */
import { randomUUID } from 'node:crypto'
import express from 'express'
import { db } from '../lib/store.js'
import { requireAuth } from './auth.js'
import { validateAssistantMessage } from '../lib/validate.js'
import { complete, isConfigured, providerInfo } from '../lib/assistant/llm.js'

const router = express.Router()

router.use(requireAuth)

function fail(res, status, code, fields = {}) {
  return res.status(status).json({ error: { code, fields } })
}

function publicMessage(message) {
  return {
    id: message.id,
    role: message.role,
    text: message.text ?? '',
    kind: message.kind ?? 'text',
    data: message.data ?? null,
    createdAt: message.createdAt,
  }
}

router.get('/status', (_req, res) => {
  res.json({ llm: isConfigured(), provider: providerInfo() })
})

router.get('/messages', async (req, res, next) => {
  try {
    const limit = req.query.limit === undefined ? undefined : Number(req.query.limit)
    if (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 200)) {
      return fail(res, 422, 'VALIDATION_FAILED', { limit: 'LIMIT_INVALID' })
    }
    const messages = await db.listMessages(req.user.id, limit)
    res.json({ messages: messages.map(publicMessage) })
  } catch (err) {
    next(err)
  }
})

router.post('/messages', async (req, res, next) => {
  try {
    const { ok, errors, value } = validateAssistantMessage(req.body ?? {})
    if (!ok) return fail(res, 422, 'VALIDATION_FAILED', errors)

    const message = await db.createMessage({
      id: randomUUID(),
      userId: req.user.id,
      ...value,
      createdAt: new Date().toISOString(),
    })
    res.status(201).json({ message: publicMessage(message) })
  } catch (err) {
    next(err)
  }
})

router.delete('/messages', async (req, res, next) => {
  try {
    const removed = await db.clearMessages(req.user.id)
    res.json({ ok: true, removed })
  } catch (err) {
    next(err)
  }
})

/** Open-ended questions. Only available when an LLM provider is configured. */
router.post('/respond', async (req, res, next) => {
  try {
    if (!isConfigured()) return fail(res, 503, 'ASSISTANT_UNAVAILABLE')

    const messages = Array.isArray(req.body?.messages) ? req.body.messages : []
    const locale = ['en', 'ar', 'ckb'].includes(req.body?.locale) ? req.body.locale : 'en'
    const context = typeof req.body?.context === 'object' ? req.body.context : null

    const result = await complete({ messages, locale, context })
    if (!result) return fail(res, 502, 'ASSISTANT_UNAVAILABLE')

    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
