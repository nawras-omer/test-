/**
 * Personal food library API — foods the user created themselves.
 *
 *   GET    /api/foods        list my custom foods (newest first)
 *   POST   /api/foods        add a custom food
 *   DELETE /api/foods/:id    remove one
 *
 * The bundled 1,000+ food database ships with the client, so this endpoint only
 * ever handles user-created rows — and like every other route it is scoped to
 * the authenticated user.
 */
import { randomUUID } from 'node:crypto'
import express from 'express'
import { db } from '../lib/store.js'
import { requireAuth } from './auth.js'
import { MAX_CUSTOM_FOODS, validateCustomFood } from '../lib/validate.js'

const router = express.Router()

router.use(requireAuth)

function fail(res, status, code, fields = {}) {
  return res.status(status).json({ error: { code, fields } })
}

/** Response projection — keeps storage internals (userId) out of the payload. */
function publicFood(food) {
  return {
    id: food.id,
    name: food.name,
    servingSize: food.servingSize ?? '',
    calories: food.calories,
    protein: food.protein ?? 0,
    carbs: food.carbs ?? 0,
    fat: food.fat ?? 0,
    createdAt: food.createdAt,
    updatedAt: food.updatedAt,
  }
}

router.get('/', async (req, res, next) => {
  try {
    const foods = await db.listCustomFoods(req.user.id)
    res.json({ foods: foods.map(publicFood) })
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { ok, errors, value } = validateCustomFood(req.body ?? {})
    if (!ok) return fail(res, 422, 'VALIDATION_FAILED', errors)

    if (await db.findCustomFoodByName(req.user.id, value.name)) {
      return fail(res, 409, 'CUSTOM_FOOD_DUPLICATE', { name: 'CUSTOM_FOOD_DUPLICATE' })
    }
    if ((await db.countCustomFoods(req.user.id)) >= MAX_CUSTOM_FOODS) {
      return fail(res, 429, 'CUSTOM_FOOD_LIMIT_REACHED', { name: 'CUSTOM_FOOD_LIMIT_REACHED' })
    }

    const now = new Date().toISOString()
    const food = await db.createCustomFood({
      id: randomUUID(),
      userId: req.user.id,
      ...value,
      createdAt: now,
      updatedAt: now,
    })

    res.status(201).json({ food: publicFood(food) })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const removed = await db.deleteCustomFood(req.user.id, req.params.id)
    if (!removed) return fail(res, 404, 'CUSTOM_FOOD_NOT_FOUND')
    res.json({ ok: true, id: removed.id })
  } catch (err) {
    next(err)
  }
})

export default router
