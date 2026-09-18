/**
 * Seeds a demo account so the sign-in screen can be previewed instantly:
 *   demo@kalori.app / demo1234
 * Idempotent — safe to run on every boot (`node server/seed.js` also works).
 */
import { DEFAULT_GOALS, DEFAULT_PREFERENCES, db } from './lib/store.js'
import { hashPassword } from './lib/auth.js'

export const DEMO_EMAIL = 'demo@kalori.app'
export const DEMO_PASSWORD = 'demo1234'

export async function seedDemoUser() {
  const existing = await db.findByEmail(DEMO_EMAIL)
  if (existing) return existing

  const now = new Date().toISOString()
  const user = await db.createUser({
    id: 'demo-user-0001',
    name: 'Demo User',
    email: DEMO_EMAIL,
    passwordHash: await hashPassword(DEMO_PASSWORD),
    preferences: { ...DEFAULT_PREFERENCES },
    goals: { ...DEFAULT_GOALS },
    createdAt: now,
    updatedAt: now,
    demo: true,
  })
  console.log(`[seed] created demo account ${DEMO_EMAIL} / ${DEMO_PASSWORD}`)
  return user
}

// Allow `node server/seed.js`
if (import.meta.url === `file://${process.argv[1]}`) {
  await seedDemoUser()
  console.log('[seed] done')
}
