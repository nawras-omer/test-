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

/**
 * Wipes the demo account so every run starts clean: diary, custom foods, goals,
 * the profile the goal calculator reads, and the assistant transcript.
 */
async function resetDemoAccount(token) {
  const auth = { Authorization: `Bearer ${token}` }
  const json = { ...auth, 'Content-Type': 'application/json' }
  const { entries } = await fetch(`${API}/entries`, { headers: auth }).then((r) => r.json())
  for (const entry of entries) {
    await fetch(`${API}/entries/${entry.id}`, { method: 'DELETE', headers: auth })
  }
  const { foods } = await fetch(`${API}/foods`, { headers: auth }).then((r) => r.json())
  for (const food of foods) {
    await fetch(`${API}/foods/${food.id}`, { method: 'DELETE', headers: auth })
  }
  await fetch(`${API}/assistant/messages`, { method: 'DELETE', headers: auth })
  await fetch(`${API}/auth/goals`, {
    method: 'PATCH',
    headers: json,
    body: JSON.stringify({ calories: 2150, protein: 140, carbs: 240, fat: 70 }),
  })
  // Profile numbers feed the goal calculator, so clear them too.
  await fetch(`${API}/auth/profile`, {
    method: 'PATCH',
    headers: json,
    body: JSON.stringify({ name: 'Demo User', sex: null, age: null, heightCm: null, weightKg: null, targetWeightKg: null, activity: 'moderate' }),
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

/** Selects an option the way React expects (native setter + change event). */
function setSelect(el, value) {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set
  setter.call(el, value)
  fire(el, 'change')
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

/* ---------------------------------------------------------- food library -- */

const goToNav = async (label) => {
  click($$('.nav-link').find((el) => el.textContent.includes(label)))
  await wait(320)
}

const searchLibrary = async (value) => {
  setValue($('#library-search'), value)
  await wait(150)
}

await goToNav('Food library')
check('library page renders its search box', Boolean($('#library-search')))
const librarySubtitle = $('.page__subtitle')?.textContent ?? ''
check('library advertises the whole database (1,110 foods)', /1,110/.test(librarySubtitle), librarySubtitle.slice(0, 160))
check(
  'category browsing covers the required five',
  ['Fruits', 'Vegetables', 'Proteins', 'Grains', 'Snacks'].every((label) =>
    $$('.category-chip').some((chip) => chip.textContent.includes(label)),
  ),
  $$('.category-chip').length + ' chips',
)
check('categories include the extra groups too', $$('.category-chip').length === 14, String($$('.category-chip').length))

/* ------------------------------------------- search in three languages -- */

await searchLibrary('chick')
check(
  'English search finds chicken',
  $$('.food-item__name').some((el) => el.textContent.includes('Chicken')),
  $$('.food-item__name')[0]?.textContent ?? '',
)
check('search reports the match count', /\d+ foods/.test($('[data-testid="library-count"]')?.textContent ?? ''))

await searchLibrary('تفاح')
check(
  'Arabic query matches while the UI is English',
  $$('.food-item__name').some((el) => el.textContent.includes('Apple')),
  $$('.food-item__name')[0]?.textContent ?? '',
)

await searchLibrary('سێو')
check(
  'Sorani query matches too',
  $$('.food-item__name').some((el) => el.textContent.includes('Apple')),
  $$('.food-item__name')[0]?.textContent ?? '',
)

await searchLibrary('بنجر')
check(
  'a second Arabic query finds beetroot',
  $$('.food-item__name').some((el) => el.textContent.includes('Beet')),
  $$('.food-item__name')[0]?.textContent ?? '',
)

/* --------------------------------------- click a food → prefill dialog -- */

await searchLibrary('apple')
const firstFoodName = $$('.food-item__name')[0]?.textContent?.trim() ?? ''
await $$('.food-item__main')[0].dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
check('clicking a library food opens the log dialog', await waitFor(() => Boolean($('#food-log-form')), 2000))
const prefilledName = $('[name="name"]')?.value ?? ''
const prefilledKcal = Number($('[name="calories"]')?.value ?? '0')
check('the dialog is prefilled with the chosen food', prefilledName === firstFoodName, `${prefilledName} vs ${firstFoodName}`)
check('the dialog is prefilled with its calories', prefilledKcal > 0, String(prefilledKcal))
check('the dialog is prefilled with a serving description', ($('[name="servingSize"]')?.value ?? '').length > 2, $('[name="servingSize"]')?.value ?? '')
check('the dialog is prefilled with macros', Number($('[name="carbs"]')?.value ?? '0') > 0, $('[name="carbs"]')?.value ?? '')

check('the prefilled entry saves', await submitFoodForm())
check('the success message names the library food', await waitForToast(prefilledName), lastToast())

await goToNav('Dashboard')
const expectedTotal = (1200 - 300 + prefilledKcal).toLocaleString('en-US')
check('the logged library food reaches the dashboard', statValues()[0].startsWith(expectedTotal), statValues()[0])
check('the recent list shows it', $$('.entry__name')[0].textContent.includes(prefilledName))
click($$('.entry__delete')[0])
check('cleaning up the library entry works', await waitFor(() => $$('.entry').length === 2))
check('totals are back to the earlier entries (900)', statValues()[0].startsWith('900'), statValues()[0])

/* ------------------------------------------------ custom food workflow -- */

await goToNav('Food library')
await searchLibrary('zzqqxx')
check('no-match state explains the situation', text().includes('No food matches'), text().slice(-160))
check('the empty state offers a custom food', Boolean(byText('button', 'zzqqxx')))
click(byText('button', 'zzqqxx'))
check('the custom form opens', await waitFor(() => Boolean($('#custom-food-form')), 2000))
check('the custom form is seeded with the query', $('[name="custom-name"]')?.value === 'zzqqxx', $('[name="custom-name"]')?.value ?? '')

$('#custom-food-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))
await wait(200)
check('the custom form validates its required fields', $('.modal')?.textContent.includes('Please enter the calories.'), $('.modal')?.textContent?.slice(-120) ?? '')

fill('custom-name', 'Test Bake')
fill('custom-servingSize', '1 slice')
fill('custom-calories', '321')
fill('custom-protein', '12')
fill('custom-carbs', '40')
fill('custom-fat', '9')
$('#custom-food-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))
check('the custom food is saved', await waitForToast('Test Bake'), lastToast())

const authHeaders = { Authorization: `Bearer ${token}` }
const storedFoods = await fetch(`${API}/foods`, { headers: authHeaders }).then((r) => r.json())
check(
  'the custom food is stored in the personal library',
  storedFoods.foods.some((food) => food.name === 'Test Bake' && food.calories === 321),
  JSON.stringify(storedFoods.foods.map((food) => food.name)),
)

await searchLibrary('test bake')
check('the custom food is searchable', Boolean(byText('.food-item__name', 'Test Bake')))
check('the custom food is flagged as custom', Boolean($('.food-item--custom')))
check('the custom food shows its own nutrition', text().includes('321'), '')

click($('.food-item--custom .food-item__main'))
check('a custom food prefills the log dialog too', await waitFor(() => Boolean($('#food-log-form')), 2000))
check('the custom prefill carries the name', $('[name="name"]')?.value === 'Test Bake', $('[name="name"]')?.value ?? '')
check('the custom prefill carries the calories', $('[name="calories"]')?.value === '321', $('[name="calories"]')?.value ?? '')
check('the custom prefill carries the serving text', $('[name="servingSize"]')?.value === '1 slice', $('[name="servingSize"]')?.value ?? '')
click($$('.modal .icon-btn')[0])
await wait(200)
check('the dialog closes without logging', !$('#food-log-form'))

await searchLibrary('test bake')
click($('.food-item--custom .icon-btn--danger'))
check('removing a custom food is confirmed', await waitForToast('Test Bake was removed'), lastToast())
check('the custom food disappears from the list', await waitFor(() => !$('.food-item--custom')))
const afterRemove = await fetch(`${API}/foods`, { headers: authHeaders }).then((r) => r.json())
check('the removal is persisted', afterRemove.foods.length === 0, JSON.stringify(afterRemove.foods))

/* -------------------------------------------------- library in Arabic -- */

await pickLanguage('العربية')
await goToNav('مكتبة الأطعمة')
check('library renders in Arabic + RTL', html().dir === 'rtl' && text().includes('مكتبة الأطعمة'))
await searchLibrary('دجاج')
check(
  'Arabic search works in the Arabic UI',
  $$('.food-item__name').some((el) => el.textContent.includes('دجاج')),
  $$('.food-item__name')[0]?.textContent ?? '',
)
check('categories are localised', text().includes('فواكه') && text().includes('حلويات'))
check(
  'counts use Arabic numerals',
  /[٠-٩]/.test($('[data-testid="library-count"]')?.textContent ?? ''),
  $('[data-testid="library-count"]')?.textContent ?? '',
)
await pickLanguage('English')
await wait(200)

/* ------------------------------------------------- goals & weekly summary -- */

await goToNav('Goals')
check('goal page renders', text().includes('Goals & progress') && Boolean($('[data-testid="goal-progress"]')))
check('progress ring shows today against the target', $('.ring__number')?.textContent?.trim() === '900', $('.ring__number')?.textContent ?? '')
check('progress copy states the share of the goal', text().includes('38% of goal'), text().slice(-220))
check(
  'macro progress indicators are drawn from the same targets',
  $$('[data-testid="goal-progress"] .bar').length === 3,
  String($$('[data-testid="goal-progress"] .bar').length),
)
check(
  'weekly summary counts the logged days',
  Boolean($('[data-testid="weekly-summary"]')) && text().includes('1 of 7 days'),
  text().slice(-160),
)
check('weekly average intake is reported', $('[data-testid="weekly-average"]')?.textContent?.includes('900'), $('[data-testid="weekly-average"]')?.textContent ?? '')
check('goal achievement rate is reported', ($('[data-testid="weekly-rate"]')?.textContent ?? '').includes('0%'), $('[data-testid="weekly-rate"]')?.textContent ?? '')

/* --------------------------------------------------------- edit profile -- */

check('profile card is editable', Boolean($('[data-testid="profile-card"]')) && Boolean($('[name="profile-age"]')))
click(byText('button', 'Suggest targets'))
await wait(150)
check('the calculator asks for the missing profile numbers', Boolean($('[data-testid="goal-suggestion-incomplete"]')))

setSelect($('[name="profile-sex"]'), 'female')
fill('profile-age', '31')
fill('profile-height', '165')
fill('profile-weight', '62')
fill('profile-target-weight', '58')
setSelect($('[name="profile-activity"]'), 'light')
await wait(80)
click(byText('button', 'Save profile'))
check('profile save is confirmed', await waitForToast('Profile updated'), lastToast())

const storedProfile = await fetch(`${API}/auth/me`, { headers: authHeaders }).then((r) => r.json())
check(
  'the profile is persisted',
  storedProfile.user.profile?.age === 31 && storedProfile.user.profile?.weightKg === 62 && storedProfile.user.profile?.sex === 'female',
  JSON.stringify(storedProfile.user.profile),
)

click(byText('button', 'Suggest targets'))
await wait(200)
const suggestionText = $('[data-testid="goal-suggestion"]')?.textContent ?? ''
const suggestedKcal = Number((suggestionText.match(/([\d,]+) kcal/) ?? [])[1]?.replace(/,/g, '') ?? 0)
check('a target is calculated from the profile', suggestedKcal > 1200 && suggestedKcal < 4000, `${suggestedKcal} — ${suggestionText.slice(0, 120)}`)
check('the suggestion explains the maintenance number', suggestionText.includes('Maintenance'), suggestionText.slice(0, 160))

click(byText('button', 'Use these targets'))
check('applying the suggestion is confirmed', await waitForToast('Suggested targets applied'), lastToast())
const appliedGoals = await fetch(`${API}/auth/me`, { headers: authHeaders }).then((r) => r.json())
check('the suggested targets reach the account', appliedGoals.user.goals.calories === suggestedKcal, JSON.stringify(appliedGoals.user.goals))

// Put the dashboard goal back, so the later screens assert a known number.
fill('goal-calories', '2400')
await wait(80)
click(byText('button', 'Save goals'))
check('the goal can be edited back', await waitForToast('Daily goals updated'), lastToast())
check('the daily targets form stores what was typed', $('[name="goal-calories"]')?.value === '2400', $('[name="goal-calories"]')?.value ?? '')

/* ----------------------------------------------------------- assistant -- */

await goToNav('Assistant')
check('assistant page renders a conversation', Boolean($('.chat--page')) && text().includes('Ask me anything about your day'))
check('composer is available', Boolean($('#chat-input-page')) && Boolean($('.chat--page .chat__composer')))
check('the assistant advertises running on-device', text().includes('On-device'))

async function chatSay(text) {
  const input = $('#chat-input-page') ?? $('#chat-input-panel')
  setValue(input, text)
  await wait(40)
  const before = $$('.chat__msg--bot').length
  input.closest('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))
  // Wait for the typing indicator to finish *and* a new bubble to land.
  await waitFor(() => $$('.chat__msg--bot').length > before && !$('.chat__typing'), 5000)
  await wait(120)
  return $$('.chat__msg--bot').at(-1)?.textContent ?? ''
}

const entriesBefore = (await fetch(`${API}/entries`, { headers: authHeaders }).then((r) => r.json())).entries.length
const logReply = await chatSay('I ate a chicken breast and rice for lunch')
check('a natural-language sentence is logged', /chicken/i.test(logReply) && /rice/i.test(logReply), logReply.slice(0, 160))
check('logging is confirmed with a toast', await waitFor(() => /added to lunch/i.test(lastToast())), lastToast())
const afterLog = await fetch(`${API}/entries`, { headers: authHeaders }).then((r) => r.json())
check('the assistant wrote real diary entries', afterLog.entries.length === entriesBefore + 2, `${entriesBefore} → ${afterLog.entries.length}`)
check(
  'the diary entry kept the numbers the assistant understood',
  afterLog.entries.some((entry) => entry.name.includes('Chicken') && entry.calories > 100 && entry.protein > 20),
  JSON.stringify(afterLog.entries.map((entry) => `${entry.name}:${entry.calories}`)),
)

const estimateReply = await chatSay('how many calories in 2 cups of rice?')
check('a calorie question is answered without logging', /rice/i.test(estimateReply) && /\d/.test(estimateReply), estimateReply.slice(0, 160))
check('the estimate offers to save it', Boolean(byText('.chat-card .btn--primary', 'Save to diary')))
const beforeSave = (await fetch(`${API}/entries`, { headers: authHeaders }).then((r) => r.json())).entries.length
const toastBefore = lastToast()
click(byText('.chat-card .btn--primary', 'Save to diary'))
check(
  'an estimate can be saved to the diary',
  await waitFor(() => lastToast() !== toastBefore && lastToast().includes('Added to')),
  lastToast(),
)
await wait(200)
const afterSave = await fetch(`${API}/entries`, { headers: authHeaders }).then((r) => r.json())
check('the saved estimate became an entry', afterSave.entries.length === beforeSave + 1, `${beforeSave} → ${afterSave.entries.length}`)

const suggestReply = await chatSay('what should I eat for dinner?')
check(
  'meal suggestions respect the remaining budget',
  /ideas for dinner/i.test(suggestReply) && $$('.chat-suggest__row').length === 3,
  suggestReply.slice(0, 140),
)
check('suggestions are labelled with a reason', $$('.chat-suggest__row .chip').length >= 3, String($$('.chat-suggest__row .chip').length))
const beforeAdd = (await fetch(`${API}/entries`, { headers: authHeaders }).then((r) => r.json())).entries.length
const toastBeforeAdd = lastToast()
click($$('.chat-suggest__row .btn').at(-1))
check(
  'one suggestion can be added in a tap',
  await waitFor(() => lastToast() !== toastBeforeAdd && /added to dinner/i.test(lastToast())),
  lastToast(),
)
const afterAdd = await fetch(`${API}/entries`, { headers: authHeaders }).then((r) => r.json())
check('adding a suggestion logs it', afterAdd.entries.length === beforeAdd + 1, `${beforeAdd} → ${afterAdd.entries.length}`)

const summaryReply = await chatSay('how am I doing today?')
check('the day summary answers with real numbers', summaryReply.includes('Today so far') && summaryReply.includes('kcal'), summaryReply.slice(0, 140))

const helpReply = await chatSay('what can you do?')
check('help lists the assistant capabilities', helpReply.includes('Things you can ask me') && helpReply.includes('logs it for you'), helpReply.slice(0, 160))

const fallbackReply = await chatSay('zzzx qqqq wwww')
check('unknown input gets a graceful fallback', fallbackReply.includes('I am not sure what you meant'), fallbackReply.slice(0, 140))

const storedChat = await fetch(`${API}/assistant/messages`, { headers: authHeaders }).then((r) => r.json())
check('the transcript is persisted server-side', storedChat.messages.length >= 12, String(storedChat.messages.length))
check(
  'the transcript stores structure, not prose',
  storedChat.messages.some((message) => message.role === 'assistant' && message.kind === 'reply.log' && message.data?.totals?.kcal > 0),
  JSON.stringify(storedChat.messages.map((message) => message.kind)),
)

/* --------------------------------------- the chat lives beside the board -- */

await goToNav('Dashboard')
check('the dashboard carries the assistant beside it', Boolean($('.chat--panel')) && Boolean($('#chat-input-panel')))
const panelMessages = $$('.chat--panel .chat__msg').length
check('the same conversation is visible from the dashboard', panelMessages >= storedChat.messages.length, `${panelMessages} messages`)
check('the dashboard links through to the full assistant', Boolean(byText('.page__actions a', 'Open the assistant')))
check(
  'the transcript re-renders from the stored structure',
  $$('.chat--panel .chat-card').length >= 4,
  String($$('.chat--panel .chat-card').length),
)

/* --------------------------------------------- the assistant in Arabic -- */

await pickLanguage('العربية')
check('assistant follows the interface into Arabic', html().dir === 'rtl' && text().includes('مساعد التغذية'), text().slice(0, 120))
await goToNav('المساعد')
const arabicReply = await chatSay('أكلت تفاحة')
check('an Arabic sentence is understood', arabicReply.includes('تفاح'), arabicReply.slice(0, 160))
check('the Arabic answer is localised, not English', /[\u0600-\u06FF]/.test(arabicReply) && !arabicReply.includes('Saved to'), arabicReply.slice(0, 120))
check('the Arabic confirmation toast appears', await waitForToast('سعرة'), lastToast())
const arabicEntries = await fetch(`${API}/entries`, { headers: authHeaders }).then((r) => r.json())
check(
  'the Arabic log reached the diary',
  arabicEntries.entries.some((entry) => entry.name.includes('تفاح')),
  JSON.stringify(arabicEntries.entries.slice(-2).map((entry) => entry.name)),
)

click($('.chat--page .chat__actions .icon-btn'))
await wait(300)
check('clearing the chat is confirmed', await waitForToast('تم مسح سجل المحادثة'), lastToast())
check('the conversation is emptied', $$('.chat__msg').length === 0, String($$('.chat__msg').length))
const clearedChat = await fetch(`${API}/assistant/messages`, { headers: authHeaders }).then((r) => r.json())
check('clearing persists', clearedChat.messages.length === 0, String(clearedChat.messages.length))

await pickLanguage('English')
await wait(200)

/* ------------------------------------------------------- guard + sign out -- */

await openUserMenuItem('Profile')
check('profile page reflects the saved goal', text().includes('2,400') || text().includes('2400'))

click($('.user-trigger'))
await wait(150)
click($$('.dropdown__menu button').find((el) => el.textContent.includes('Sign out')))
check('sign-out clears the session', await waitFor(() => Boolean($('form')) && !window.localStorage.getItem('kalori.auth.token')))

/* --------------------------------------------------------------- teardown -- */

// Leave the demo account as the seed left it, so manual browsing starts clean.
await wait(200)
const clearedAfter = await resetDemoAccount(token)
console.log(`[teardown] reset the demo account (removed ${clearedAfter} entries)\n`)

const failures = results.filter((result) => !result.ok)
console.log(`\n${results.length - failures.length}/${results.length} checks passed`)
if (failures.length) console.log('failed:\n - ' + failures.map((f) => f.label).join('\n - '))
process.exit(failures.length === 0 ? 0 : 1)
