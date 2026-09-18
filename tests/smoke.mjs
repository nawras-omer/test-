/**
 * Kalori UI smoke test (jsdom).
 *
 * Exercises the running app against the real API: language switching (EN/AR/CKB
 * + RTL), palette/colour-mode switching, sign-up validation, sign-in, the
 * dashboard, preference sync and sign-out.
 *
 *   1. terminal A:  npm run dev
 *   2. terminal B:  npm run test:smoke
 *
 * The app is mounted in jsdom through a MemoryRouter harness, so a headless
 * environment is enough — no browser download required.
 */
import { JSDOM } from 'jsdom'

const API_ORIGIN = process.env.SMOKE_ORIGIN ?? 'http://127.0.0.1:5173'

const dom = new JSDOM('<!doctype html><html lang="en" dir="ltr"><head></head><body><div id="root"></div></body></html>', {
  url: API_ORIGIN + '/login',
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
g.fetch = (input, init) => {
  const url = typeof input === 'string' ? new URL(input, API_ORIGIN).toString() : input
  return realFetch(url, init)
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const text = () => window.document.body.textContent.replace(/\s+/g, ' ').trim()
const html = () => window.document.documentElement
const $ = (sel) => window.document.querySelector(sel)
const $$ = (sel) => [...window.document.querySelectorAll(sel)]
const waitFor = async (predicate, timeout = 2500) => {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (predicate()) return true
    await wait(60)
  }
  return false
}

function setValue(el, value) {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set
  setter.call(el, value)
  el.dispatchEvent(new window.Event('input', { bubbles: true }))
}

function click(el) {
  if (!el) throw new Error('click() called with no element')
  el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
}

async function pickLanguage(match) {
  click($('.lang-trigger'))
  await wait(120)
  const option = $$('.dropdown__item').find((el) => el.textContent.includes(match))
  click(option)
  await wait(220)
}

async function openUserMenuItem(match) {
  if (!$('.dropdown__menu')) {
    click($('.user-trigger'))
    await wait(120)
  }
  const item = $$('.dropdown__item, .dropdown__menu a').find((el) => el.textContent.includes(match))
  click(item)
  await wait(300)
}

const results = []
const check = (label, ok, extra = '') => {
  results.push({ label, ok: Boolean(ok) })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${extra ? `  → ${extra}` : ''}`)
}

const { mount } = await import('../.smoke/SmokeHarness.js')
mount(window.document.getElementById('root'), '/login')
await wait(600)

/* ------------------------------------------------------- login screen -- */
check('login page renders', text().includes('Welcome back'))
check('email + password fields present', $$('input[type="password"]').length === 1 && $$('input').length >= 2)
check('defaults: LTR + English + green palette', html().lang === 'en' && html().dir === 'ltr' && html().dataset.palette === 'green')
check('a colour mode is applied to <html>', html().dataset.mode === 'light' || html().dataset.mode === 'dark', html().dataset.mode)
check('demo credentials advertised', text().includes('demo@kalori.app'))
check('signup link available', Boolean($('a[href="/signup"]')))

/* -------------------------------------------------- language switcher -- */
check('language switcher button exists', Boolean($('.lang-trigger')))
click($('.lang-trigger'))
await wait(120)
check(
  'language menu lists all three languages as endonyms',
  ['English', 'العربية', 'کوردیی سۆرانی'].every((label) => $$('.dropdown__item').some((el) => el.textContent.includes(label))),
)
click($$('.dropdown__item').find((el) => el.textContent.includes('العربية')))
await wait(220)
check('Arabic flips html dir=rtl + lang=ar', html().dir === 'rtl' && html().lang === 'ar', `${html().dir}/${html().lang}`)
check('copy translated to Arabic', text().includes('أهلًا بعودتك'))
check('choice persisted in localStorage', window.localStorage.getItem('kalori.locale') === 'ar')

await pickLanguage('کوردیی سۆرانی')
check('Sorani Kurdish renders (RTL + script)', text().includes('بەخێربێیتەوە') && html().dir === 'rtl' && html().lang === 'ckb')

await pickLanguage('English')
check('switching back to English restores dir=ltr', html().dir === 'ltr' && html().lang === 'en')

/* ------------------------------------------------------- signup screen -- */
$$('a[href="/signup"]')[0].dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
await wait(300)
check('signup page renders', text().includes('Create your account') && $$('input').length === 4)
setValue($$('input')[2], 'abc12345')
await wait(80)
check('password strength meter reacts', text().includes('Password strength'))

/* -------------------------------------------------------- theme switcher -- */
click($('a[href="/login"]'))
await wait(250)
click($('.icon-btn--bordered'))
await wait(120)
const paletteButtons = $$('.palette-option')
check('theme menu renders 4 palettes', paletteButtons.length === 4, String(paletteButtons.length))
click(paletteButtons.find((el) => el.textContent.includes('Purple')))
await wait(120)
check('palette switch updates <html data-palette>', html().dataset.palette === 'purple', html().dataset.palette)
click($$('.segmented__option').find((el) => el.textContent.includes('Dark')))
await wait(120)
check('dark mode updates <html data-mode>', html().dataset.mode === 'dark', html().dataset.mode)
check('theme persisted to localStorage', (window.localStorage.getItem('kalori.theme') ?? '').includes('purple'))
check(
  'swatch preview keeps its own palette colours',
  ($('.palette-option__swatch')?.getAttribute('style') ?? '').includes('--swatch-gradient'),
)
click($$('.segmented__option').find((el) => el.textContent.includes('Light')))
await wait(80)
click($$('.palette-option').find((el) => el.textContent.includes('Green')))
await wait(120)
window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
await wait(80)
check('Escape closes the theme menu', !$('.dropdown__menu'))
check('defaults restored (green + light)', html().dataset.palette === 'green' && html().dataset.mode === 'light')

/* ------------------------------------------------------------ sign-in -- */
const [emailInput, passwordInput] = $$('input')
setValue(emailInput, 'demo@kalori.app')
setValue(passwordInput, 'demo1234')
await wait(60)
$('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))
const onDashboard = await waitFor(() => Boolean($('.stat')))
check('signed in → dashboard renders', onDashboard)
check('session token stored', Boolean(window.localStorage.getItem('kalori.auth.token')))
check('navbar shows the wordmark', text().includes('Kalori'))
check('navbar shows navigation links', ['Dashboard', 'Diary', 'Meals', 'Progress'].every((l) => text().includes(l)))
check('navbar shows the user profile', Boolean($('.user-trigger')) && text().includes('Demo User'))
check('greeting is personalised', /Good (morning|afternoon|evening), Demo/.test(text()), text().slice(0, 48))
check('four KPI cards render', $$('.stat').length === 4, String($$('.stat').length))
check('calorie ring renders with a progress arc', Boolean($('.ring__value')))
check('macro bars render', $$('.bar__fill').length >= 3, String($$('.bar__fill').length))
check('meal rows use localised placeholder data', text().includes('Oats with berries') && text().includes('Grilled chicken salad'))
check('weekly chart renders 7 columns', $$('.chart__col').length === 7, String($$('.chart__col').length))
check('placeholder disclaimer visible', text().includes('Placeholder data'))
check('welcome toast shown', Boolean($('.toast')))

/* ------------------------------------------------ RTL while signed in -- */
await pickLanguage('العربية')
check('dashboard mirrors to RTL', html().dir === 'rtl')
check('dashboard copy translated', text().includes('الرئيسية') && text().includes('الوجبات'))
check(
  'numbers formatted through Intl for the locale',
  /[0-9٠-٩]/.test($('.stat__value')?.textContent ?? ''),
  $('.stat__value')?.textContent?.trim(),
)

await pickLanguage('کوردیی سۆرانی')
check('dashboard renders in Sorani Kurdish', text().includes('داشبۆرد') && text().includes('ژەمەکان'))

/* -------------------------------------- preference sync (signed in) -- */
await wait(1100) // debounced PATCH
const token = window.localStorage.getItem('kalori.auth.token')
const me = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json())
check('language choice synced to the API', me.user.preferences.language === 'ckb', me.user.preferences.language)

/* ------------------------------------------ secondary pages + theme -- */
await pickLanguage('English')
await wait(200)
await openUserMenuItem('Preferences')
check(
  'settings page renders live theme controls (4 palettes + light/dark)',
  $$('.palette-option').length >= 4 && $$('.segmented__option').length === 2,
  `${$$('.palette-option').length} options / ${$$('.segmented__option').length} modes`,
)
check('settings page renders language controls', $$('.palette-option').length >= 3 && text().includes('Sorani Kurdish'))

await openUserMenuItem('Profile')
check('profile page shows account details', text().includes('demo@kalori.app') && text().includes('Demo User'))
check('profile shows member-since date', text().includes('Member since'))

click($$('.nav-link').find((el) => el.textContent.includes('Diary')))
await wait(250)
check('placeholder page is honest about scope', text().includes('Food diary') && text().includes('Coming soon'))

/* ------------------------------------------------------------- sign out -- */
await wait(120)
click($('.user-trigger'))
await wait(150)
click($$('.dropdown__item').find((el) => el.textContent.includes('Sign out')))
const backToLogin = await waitFor(() => Boolean($('form')) && !window.localStorage.getItem('kalori.auth.token'))
check('sign-out clears the session and returns to login', backToLogin)

/* --------------------------------------------- second visit (refresh) -- */
const secondRoot = window.document.createElement('div')
window.document.body.appendChild(secondRoot)
mount(secondRoot, '/')
await wait(500)
check('visiting a private route without a session redirects to /login', text().includes('Welcome back'))

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
if (failed.length) console.log('failed:', failed.map((f) => f.label).join(' | '))
process.exit(failed.length === 0 ? 0 : 1)
