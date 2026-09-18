/**
 * Food-log API. Every route is scoped to the authenticated user, so one account
 * can never read or mutate another account's diary.
 *
 *   GET    /api/entries?from&to&limit   list entries (date window + limit)
 *   POST   /api/entries                 create an entry
 *   GET    /api/entries/:id             single entry
 *   DELETE /api/entries/:id             delete an entry
 */
import { randomUUID } from 'node:crypto'
import express from 'express'
import { db } from '../lib/store.js'
import { requireAuth } from './auth.js'
import { MAX_ENTRIES_PER_DAY, validateEntryQuery, validateFoodEntry } from '../lib/validate.js'

const router = express.Router()

router.use(requireAuth)

function fail(res, status, code, fields = {}) {
  return res.status(status).json({ error: { code, fields } })
}

/** Response projection — keeps storage internals (userId) out of the payload. */
function publicEntry(entry) {
  return {
    id: entry.id,
    name: entry.name,
    servingSize: entry.servingSize ?? '',
    calories: entry.calories,
    protein: entry.protein ?? 0,
    carbs: entry.carbs ?? 0,
    fat: entry.fat ?? 0,
    mealType: entry.mealType,
    date: entry.date,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  }
}

router.get('/', async (req, res, next) => {
  try {
    const { ok, errors, value } = validateEntryQuery(req.query)
    if (!ok) return fail(res, 422, 'VALIDATION_FAILED', errors)

    const entries = await db.listEntries(req.user.id, value)
    res.json({ entries: entries.map(publicEntry) })
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { ok, errors, value } = validateFoodEntry(req.body ?? {})
    if (!ok) return fail(res, 422, 'VALIDATION_FAILED', errors)

    const todayCount = await db.countEntries(req.user.id, value.date)
    if (todayCount >= MAX_ENTRIES_PER_DAY) {
      return fail(res, 429, 'ENTRY_LIMIT_REACHED', { date: 'ENTRY_LIMIT_REACHED' })
    }

    const now = new Date().toISOString()
    const entry = await db.createEntry({
      id: randomUUID(),
      userId: req.user.id,
      ...value,
      createdAt: now,
      updatedAt: now,
    })

    res.status(201).json({ entry: publicEntry(entry) })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const entry = await db.findEntry(req.user.id, req.params.id)
    if (!entry) return fail(res, 404, 'ENTRY_NOT_FOUND')
    res.json({ entry: publicEntry(entry) })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const removed = await db.deleteEntry(req.user.id, req.params.id)
    if (!removed) return fail(res, 404, 'ENTRY_NOT_FOUND')
    res.json({ ok: true, id: removed.id })
  } catch (err) {
    next(err)
  }
})

export default router
