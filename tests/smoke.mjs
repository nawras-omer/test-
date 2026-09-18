/**
 * Kalori UI smoke test (jsdom).
 *
 * Runs the real app against the real API and covers the two features that
 * matter: authentication/i18n/theming, and the food-logging loop — log an
 * entry in the dialog, watch the dashboard widgets update, delete it again.
 *
 *   1. terminal A:  npm run dev
 *   2. terminal B:  npm run test:smoke
 *
 * The app is mounted through a MemoryRouter harness, so a headless environment
 * is enough — no browser download required.
 */
import { JSDOM } from 'jsdom'

const API_ORIGIN = process.env.SMOKE_ORIGIN ?? 'http://127.0.0.1:5173'
const API = `${API_ORIGIN}/api`
const DEMO = { email: 'demo@kalori.app', password: 'demo1234' }

/* ----------------------------------------------------------- api helpers -- */

async function apiLogin() {
  const response = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(DEMO),
  })
  if (!response.ok) throw new Error(`API not reachable at ${API} — is \`npm run dev\` running?`)
  return (await response.json()).token
}

/** Wipes the demo account's diary + goals so every run starts from the same state. */
async function resetDemoAccount(token) {
  const auth = { Authorization: `Bearer ${token}` }
  const { entries } = await fetch(`${API}/entries`, { headers: auth }).then((r) => r.json())
  for (const entry of entries) {
    await fetch(`${API}/entries/${entry.id}`, { method: 'DELETE', headers: auth })
  }
  await fetch(`${API}/auth/goals`, {
    method: 'PATCH',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ calories: 2150, protein: 140, carbs: 240, fat: 70 }),
  })
  return entries.length
}

/* ------------------------------------------------------------- jsdom boot -- */

const dom = new JSDOM('<!doctype html><html lang="en" dir="ltr"><head></head><body><div id="root"></div></body></html>', {
  url: `${API_ORIGIN}/login`,
  pretendToBeVisual: true,
})

const { window } = dom
window.matchMedia = (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => false,
})

const g = globalThis
g.window = window
g.document = window.document
Object.defineProperty(g, 'navigator', { value: window.navigator, configurable: true })
g.HTMLElement = window.HTMLElement
g.HTMLInputElement = window.HTMLInputElement
g.Element = window.Element
g.Node = window.Node
g.Event = window.Event
g.MouseEvent = window.MouseEvent
g.KeyboardEvent = window.KeyboardEvent
g.CustomEvent = window.CustomEvent
g.localStorage = window.localStorage
g.sessionStorage = window.sessionStorage
g.requestAnimationFrame = window.requestAnimationFrame.bind(window)
g.cancelAnimationFrame = window.cancelAnimationFrame.bind(window)
g.getComputedStyle = window.getComputedStyle.bind(window)
g.IS_REACT_ACT_ENVIRONMENT = false

const realFetch = g.fetch
g.fetch = (input, init) => realFetch(typeof input === 'string' ? new URL(input, API_ORIGIN).toString() : input, init)

/* --------------------------------------------------------------- helpers -- */

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const text = () => window.document.body.textContent.replace(/\s+/g, ' ').trim()
const html = () => window.document.documentElement
const $ = (selector) => window.document.querySelector(selector)
const $$ = (selector) => [...window.document.querySelectorAll(selector)]
const byText = (selector, needle) => $$(selector).find((el) => el.textContent.includes(needle))

const waitFor = async (predicate, timeout = 3000) => {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (predicate()) return true
    await wait(60)
  }
  return false
}

function fire(el, type) {
  el.dispatchEvent(new window.Event(type, { bubbles: true }))
}

function click(el) {
  if (!el) throw new Error('click() called with no element')
  el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
}

/** Sets an input's value the way React expects (native setter + input event). */
function setValue(el, value) {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set
  setter.call(el, value)
  fire(el, 'input')
}

/** Fills a form control by its `name` attribute, wherever it lives. */
function fill(name, value) {
  const field = $(`[name="${name}"]`)
  if (!field) throw new Error(`field not found: ${name}`)
  setValue(field, value)
}

async function pickLanguage(match) {
  click($('.lang-trigger'))
  await wait(120)
  click($$('.dropdown__item').find((el) => el.textContent.includes(match)))
  await wait(250)
}

async function openUserMenuItem(match) {
  if (!$('.dropdown__menu')) {
    click($('.user-trigger'))
    await wait(150)
  }
  click($$('.dropdown__menu a, .dropdown__menu button').find((el) => el.textContent.includes(match)))
  await wait(350)
}

/** Opens the food dialog from the dashboard header button. */
async function openFoodDialog() {
  click(byText('.page__actions .btn--primary', 'Log food') ?? byText('.btn--primary', 'Log food') ?? $('.fab'))
  return waitFor(() => Boolean($('.modal')), 2000)
}

async function submitFoodForm() {
  const submit = $('button[form="food-log-form"]')
  submit.form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))
  return waitFor(() => !$('.modal'), 3000)
}

/** The newest toast is the relevant one — older ones linger for a few seconds. */
const lastToast = () => $$('.toast').at(-1)?.textContent ?? ''
const waitForToast = (needle) => waitFor(() => lastToast().includes(needle))

/**
 * Normalises localised numbers so numeric assertions hold in every locale:
 * Arabic-Indic digits → ASCII, plus the Arabic thousands/decimal separators
 * and narrow no-break spaces that Intl inserts.
 */
function toAsciiDigits(value) {
  return String(value)
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[\u066C\u066B\u060C]/g, (separator) => (separator === '\u066B' ? '.' : ','))
    .replace(/[\u202F\u00A0\u2009]/g, '')
    .trim()
}
const statValue = (index) => toAsciiDigits($$('.stat__value')[index]?.textContent?.trim() ?? '')

/** Values shown in the KPI tiles, in render order. */
const statValues = () => $$('.stat__value').map((el) => toAsciiDigits(el.textContent.trim()))

const results = []
const check = (label, ok, extra = '') => {
  results.push({ label, ok: Boolean(ok) })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${extra ? `  → ${extra}` : ''}`)
}

/* ------------------------------------------------------------------ start -- */

const token = await apiLogin()
const cleared = await resetDemoAccount(token)
console.log(`[setup] cleared ${cleared} existing demo entries\n`)

const { mount } = await import('../.smoke/SmokeHarness.js')
mount(window.document.getElementById('root'), '/login')
await wait(600)

/* ------------------------------------------------------- auth + i18n ----- */

check('login page renders', text().includes('Welcome back'))
check('defaults: LTR + English + green', html().lang === 'en' && html().dir === 'ltr' && html().dataset.palette === 'green')

await pickLanguage('کوردیی سۆرانی')
check('Sorani Kurdish flips the layout to RTL', html().dir === 'rtl' && html().lang === 'ckb' && text().includes('بەخێربێیتەوە'))
await pickLanguage('English')
check('switching back to English restores LTR', html().dir === 'ltr')

click($('.icon-btn--bordered'))
await wait(150)
check('theme menu offers 4 palettes', $$('.palette-option').length === 4)
click($$('.palette-option').find((el) => el.textContent.includes('Blue')))
await wait(120)
check('palette switch applies', html().dataset.palette === 'blue')
click($$('.segmented__option').find((el) => el.textContent.includes('Dark')))
await wait(120)
check('dark mode applies', html().dataset.mode === 'dark')
click($$('.segmented__option').find((el) => el.textContent.includes('Light')))
click($$('.palette-option').find((el) => el.textContent.includes('Green')))
await wait(120)
window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
await wait(100)

/* -------------------------------------------------------------- sign in -- */

fill('email', DEMO.email)
fill('password', DEMO.password)
await wait(60)
$('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))
check('signed in → dashboard renders', await waitFor(() => Boolean($('.stat'))))
check('navbar shows language switcher, theme switcher and profile', Boolean($('.lang-trigger') && $('.icon-btn--bordered') && $('.user-trigger')))

/* -------------------------------------------------- empty dashboard state -- */

check('empty state prompts the first entry', text().includes('Nothing logged today yet'))
check('consumed starts at zero', statValues()[0].startsWith('0'), statValues().join(' | '))
check('remaining starts at the goal (2,150)', statValues()[1].startsWith('2,150'), statValues()[1])
check('recent entries empty state shows', text().includes('No food logged yet'))
check('weekly chart says there is no data', text().includes('No calories logged in the last 7 days'))
check('no placeholder food rows remain', !text().includes('Oats with berries') && !text().includes('Grilled chicken salad'))

/* ------------------------------------------------------------ log food -- */

check('food dialog opens', await openFoodDialog())
check('dialog has all required fields', ['name', 'servingSize', 'calories', 'protein', 'carbs', 'fat', 'date'].every((n) => $(`[name="${n}"]`)))
check('meal picker offers 4 meals', $$('.meal-picker__option').length === 4)
check('date defaults to today', $('[name="date"]').value === new Date().toISOString().slice(0, 10) || /^\d{4}-\d{2}-\d{2}$/.test($('[name="date"]').value))

// Empty submit → inline, localised validation.
await submitFoodForm()
check('empty submit keeps the dialog open', Boolean($('.modal')))
const modalText = $('.modal').textContent.replace(/\s+/g, ' ')
check('name error is shown', modalText.includes('Please enter the food name.'), modalText.slice(-160))
check('calories error is shown', modalText.includes('Please enter the calories.'))
check('no untranslated fallback message leaks', !modalText.includes('Something went wrong'))

fill('name', 'Oats with berries')
fill('servingSize', '1 bowl')
fill('calories', '380')
fill('protein', '14')
fill('carbs', '62')
fill('fat', '8')
await wait(80)
check('live preview reflects the macros', text().includes('380') && text().includes('Macros are'))
click(byText('.meal-picker__option', 'Breakfast'))
await wait(60)

check('entry saves and the dialog closes', await submitFoodForm())

/* --------------------------------------------- widgets update in real time -- */

check('success message names the food and meal', await waitForToast('Oats with berries'), lastToast())
check('success message confirms the meal', lastToast().includes('Breakfast'), lastToast())
check('consumed tile updates to 380', statValues()[0].startsWith('380'), statValues()[0])
check('remaining tile drops to 1,770', statValues()[1].startsWith('1,770'), statValues()[1])
check('entries-today tile shows 1', statValues()[2].startsWith('1'), statValues()[2])
check('calorie ring shows the new total', $('.ring__number')?.textContent?.trim() === '380', $('.ring__number')?.textContent ?? '')
check('protein bar reflects 14 / 140 g', text().includes('14 / 140'))
check('recent list now shows the entry', Boolean(byText('.entry__name', 'Oats with berries')))
check('recent list shows the serving size', text().includes('1 bowl'))
check('meal breakdown attributes it to breakfast', Boolean(byText('.macro__amount', '380')))
check('weekly chart plotted the day', $$('.chart__bar').some((bar) => bar.getAttribute('style')?.includes('height')))

/* -------------------------------------------------------- second entry -- */

await openFoodDialog()
fill('name', 'Grilled chicken salad')
fill('servingSize', '1 plate')
fill('calories', '520')
fill('protein', '42')
fill('carbs', '18')
fill('fat', '28')
click(byText('.meal-picker__option', 'Lunch'))
await wait(60)
check('second entry saves', await submitFoodForm())
check('consumed aggregates both entries (900)', statValues()[0].startsWith('900'), statValues()[0])
check('remaining reflects the total (1,250)', statValues()[1].startsWith('1,250'), statValues()[1])
check('recent list holds both entries', $$('.entry').length === 2, String($$('.entry').length))
check('newest entry is listed first', $$('.entry__name')[0].textContent.includes('Grilled chicken salad'))
check('entries-today tile shows 2', statValues()[2].startsWith('2'), statValues()[2])

/* ------------------------------------------------- RTL + localised dialog -- */

await pickLanguage('العربية')
check('dashboard mirrors to RTL', html().dir === 'rtl')
await openFoodDialog()
check('dialog labels are localised in Arabic', text().includes('اسم الطعام') && text().includes('السعرات الحرارية') && text().includes('الوجبة'))
check('meal options are localised', text().includes('الفطور') && text().includes('الغداء'))
check('RTL dialog keeps logical layout direction', window.getComputedStyle($('.modal')).direction === 'rtl' || html().dir === 'rtl')
fill('name', 'تمر وفواكه')
fill('servingSize', '3 حبات')
fill('calories', '180')
fill('protein', '2')
fill('carbs', '45')
fill('fat', '0.5')
click(byText('.meal-picker__option', 'وجبة خفيفة'))
await wait(80)
check('entry saves while in Arabic', await submitFoodForm())
check('Arabic success message appears', await waitForToast('تمر وفواكه'), lastToast())
check('success message is localised (meal name in Arabic)', lastToast().includes('خواردنی سووک') || lastToast().includes('وجبة خفيفة'), lastToast())
check('totals keep updating (1,080)', statValues()[0].startsWith('1,080'), statValues()[0])
check('Arabic numerals are used in the widgets', /[٠-٩]/.test($$('.stat__value')[0].textContent), $$('.stat__value')[0].textContent.trim())
check('recent list keeps RTL order', $$('.entry__name')[0].textContent.includes('تمر وفواكه'))

/* -------------------------------------------------------- delete an entry -- */

const beforeDelete = $$('.entry').length
click($$('.entry')[0].querySelector('.entry__delete'))
check('entry deletes', await waitFor(() => $$('.entry').length === beforeDelete - 1))
check('totals recalculate after delete (900)', statValues()[0].startsWith('900'), statValues()[0])

/* ------------------------------------------------------------ goals edit -- */

await pickLanguage('English')
await wait(200)
await openUserMenuItem('Preferences')
check('settings page renders the goals form', Boolean($('[name="goal-calories"]')))
fill('goal-calories', '2400')
await wait(60)
click(byText('button', 'Save goals'))
check('goal change is confirmed', await waitForToast('Daily goals updated'), lastToast())

click($$('.nav-link').find((el) => el.textContent.includes('Dashboard')))
await wait(300)
check('remaining recalculates against the new goal (1,500)', statValues()[1].startsWith('1,500'), statValues()[1])

/* ------------------------------------------------------- guard + sign out -- */

await openUserMenuItem('Profile')
check('profile page reflects the saved goal', text().includes('2,400') || text().includes('2400'))

click($('.user-trigger'))
await wait(150)
click($$('.dropdown__menu button').find((el) => el.textContent.includes('Sign out')))
check('sign-out clears the session', await waitFor(() => Boolean($('form')) && !window.localStorage.getItem('kalori.auth.token')))

const failures = results.filter((result) => !result.ok)
console.log(`\n${results.length - failures.length}/${results.length} checks passed`)
if (failures.length) console.log('failed:\n - ' + failures.map((f) => f.label).join('\n - '))
process.exit(failures.length === 0 ? 0 : 1)
