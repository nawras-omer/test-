# Kalori — multilingual calorie tracker

A health-focused calorie tracker with **working authentication**, a **working food log**, a
**three-language runtime switch** (English · العربية · کوردیی سۆرانی) with full **RTL
mirroring**, and a **customisable theme system** (4 palettes × light/dark) driven entirely by
CSS variables.

Log a food and everything on the dashboard updates immediately: calories consumed, calories
remaining, macro bars, the meal breakdown, the seven-day chart and the recent-entries list.

---

## Quick start

```bash
npm install
npm run dev          # Vite on :5173  +  Express API on :5174
```

Open <http://localhost:5173> and sign in with the seeded demo account:

| Email             | Password   |
| ----------------- | ---------- |
| `demo@kalori.app` | `demo1234` |

Or create a new account from `/signup` — new accounts start with a 2,150 kcal / 140 g protein
/ 240 g carbs / 70 g fat daily goal that can be edited in **Settings**.

### Other scripts

| Script               | What it does                                                       |
| -------------------- | ------------------------------------------------------------------ |
| `npm run dev`        | Web dev server + API, both with file watching                       |
| `npm run build`      | Type-check (`tsc -b`) then build the client to `dist/`              |
| `npm run preview`    | Serve the built client + API locally                                |
| `npm start`          | API only (add `SERVE_STATIC=1` to also serve `dist/` from one port) |
| `npm run typecheck`  | Type-check only                                                     |
| `npm run test:smoke` | Headless UI smoke test (needs `npm run dev` running)                |

---

## What works today

### Food logging

- One dialog for everything: **food name, serving size, calories, protein, carbs, fat, meal
  type and date** — openable from the dashboard header, the calorie card, the meal breakdown
  and the floating action button on phones.
- **Saving updates the dashboard in real time.** The diary store patches its in-memory state
  from the server's canonical response, so the ring, stat tiles, macro bars, meal split,
  weekly chart and recent list all recalculate in the same render pass — no refetch, no stale
  numbers. The new row flashes and a success toast names the food and its meal.
- Entries can be deleted from the recent list; totals recalculate immediately.
- The meal defaults to whatever time of day it is, the date defaults to today, and a live
  summary shows the entry's macros (plus how many kcal they account for).
- Validation runs client-side *and* server-side with the same error codes, and the messages
  are translated, so the same field shows the same sentence in all three languages.

### Dashboard widgets

| Widget              | Data                                                                    |
| ------------------- | ----------------------------------------------------------------------- |
| Calorie ring        | Consumed vs the daily goal, with the remaining budget (turns red when over) |
| Stat tiles          | Calories consumed, calories remaining, entries logged today              |
| Macro bars          | Protein / carbs / fat against today's targets, with grams left           |
| Meal breakdown      | Today's calories split across breakfast, lunch, dinner and snacks        |
| Recent entries      | The five most recent foods, with serving, time, macros and delete        |
| Weekly chart        | Calories per day for the last seven days vs the goal line                |

Empty states are real: with nothing logged, the dashboard explains what will appear and
invites the first entry.

### Authentication

- Sign up / sign in / sign out, JWT sessions (7 days), bcrypt password hashing
- Server-side validation with stable error **codes**, duplicate-email detection, attempt rate
  limiting (20 per 10 min per IP+route), no account enumeration
- Session restore on refresh (`GET /api/auth/me`), protected/public route guards,
  "keep me signed in" choosing localStorage vs sessionStorage
- Language, palette, colour mode **and goals** are stored per user and follow them across devices

### Language switching

- English, Arabic and Sorani Kurdish, switchable at runtime from the navbar or `/settings`
- `<html lang>`/`dir` update instantly: the entire layout mirrors for `ar` and `ckb` because
  every stylesheet uses CSS **logical properties** — including the dialog, which becomes a
  bottom sheet on phones and still mirrors correctly in RTL
- Arabic/Kurdish switch to the Noto Kufi Arabic typeface; numbers and dates go through `Intl`,
  so `1,080 kcal` renders as `١٬٠٨٠ سعرة`
- Choice persisted in `localStorage`, with browser-language detection as the initial default

### Theming

- 4 palettes — Green (default), Blue, Purple, Warm — plus light/dark, applied by two
  attributes on `<html>`: `data-palette` and `data-mode`
- All colours resolve from semantic CSS variables (`--primary`, `--surface`, `--text`, …), so
  one attribute flip restyles the whole UI — dialog and charts included — in LTR and RTL alike

### Mobile

- Responsive from 320 px up: navbar collapses to a burger menu at ≤960 px, auth split-screen
  collapses at ≤1000 px, the food dialog becomes a bottom sheet at ≤640 px, charts and forms
  reflow to one/two columns, and the primary action is a thumb-reachable FAB

---

## Project structure

```
server/                     Express API (no framework, no ORM)
  index.js                  app wiring, /api/health, optional static hosting
  routes/auth.js            signup · login · me · logout · preferences · goals
  routes/entries.js         food-log CRUD, scoped to the authenticated user
  lib/auth.js               bcrypt + JWT helpers, publicUser() projection
  lib/validate.js           validation returning error *codes*, allow-lists, limits
  lib/store.js              atomic JSON store (users + entries); swap for Postgres later
  seed.js                   idempotent demo account
  data/users.json           dev "database" (git-ignored, created on first run)

client/
  index.html                <html lang dir data-palette data-mode> shell + fonts
  src/main.tsx              provider tree: Theme → I18n → Toast → Auth → Entries → FoodLog
  src/App.tsx               route map
  src/types.ts              shared domain types (FoodEntry, UserGoals, ApiErrorCode …)
  src/i18n/                 en.ts (key source of truth) · ar.ts · ckb.ts · index.tsx
  src/lib/
    api.ts                  typed fetch wrapper (auth + entries endpoints)
    auth.tsx                session + preferences + goals
    entries.tsx             diary store: 7-day window + recent list, add/remove/refresh
    food.ts                 date-key maths, totals, goal maths (pure functions)
    theme.tsx               palettes, colour mode, CSS-variable application
    errors.ts               API error code → translation key
    validation.ts           client mirrors of the server rules
  src/components/
    dashboard/              StatCards · CalorieCard · MacroCard · MealBreakdownCard
                            RecentEntriesCard · WeeklyChartCard
    food/                   FoodLogModal · FoodLogProvider (one dialog app-wide)
    settings/               GoalsCard
    ui/                     Modal · Field · ProgressRing · Dropdown · Toast · Icons …
    layout/ auth/ routes/   navbar, switchers, guards, auth screens
  src/styles/               tokens.css · base.css · layout.css · components.css
tests/smoke.mjs             headless end-to-end UI checks (59)
```

---

## Design system

`client/src/styles/tokens.css` is the single source of truth. It has three layers:

1. **Palette** — `[data-palette]` sets only raw HSL channels (`--brand-h/s/l`, `--accent-*`,
   `--tint-*`, `--gradient-from/to`).
2. **Mode** — `[data-mode]` maps those channels to semantic tokens and tunes lightness
   (`--primary`, `--primary-soft`, `--surface`, `--text`, `--border`, `--shadow-*`, `--ring`, …).
3. **Components** — `components.css` / `layout.css` only read semantic tokens, never raw hues.
   `var(--fill)`, `var(--dot)` and `var(--swatch-gradient)` are set per element inline for
   data-driven colours (macro bars, meal split, palette swatches).

Adding a palette = one `:root[data-palette='…']` block plus an entry in `PALETTES`
(`client/src/lib/theme.tsx`). Adding a language = one dictionary file plus an entry in
`LOCALES` (`client/src/i18n/index.tsx`).

### Internationalisation contract

- `en.ts` is the key source of truth: `TranslationKey` is derived from it and every other
  dictionary is typed as `Record<TranslationKey, string>` — a missing or misspelled key fails
  type-checking rather than silently falling back to English.
- Interpolation uses `{{name}}` placeholders: `t('food.added', { name, meal })`.
- API errors are codes; `lib/errors.ts` maps them to `errors.<CODE>` keys, so no English leaks
  into an Arabic or Kurdish screen (the smoke test asserts this).

---

## API

Base URL `/api` (the browser always calls its own origin; Vite proxies `/api` → `:5174`, so the
same code works behind any reverse proxy or preview host).

| Method   | Path                    | Auth   | Notes                                                    |
| -------- | ----------------------- | ------ | -------------------------------------------------------- |
| `GET`    | `/api/health`           | –      | liveness probe                                           |
| `POST`   | `/api/auth/signup`      | –      | → 201 `{ token, user }`                                  |
| `POST`   | `/api/auth/login`       | –      | `{ email, password }`                                    |
| `GET`    | `/api/auth/me`          | Bearer | current user                                             |
| `PATCH`  | `/api/auth/preferences` | Bearer | `{ language?, palette?, colorMode? }`                    |
| `PATCH`  | `/api/auth/goals`       | Bearer | `{ calories?, protein?, carbs?, fat? }`                  |
| `POST`   | `/api/auth/logout`      | –      | stateless; the client drops the token                    |
| `GET`    | `/api/entries`          | Bearer | `?from&to&limit` — date window, newest first             |
| `POST`   | `/api/entries`          | Bearer | create an entry → 201                                    |
| `GET`    | `/api/entries/:id`      | Bearer | single entry                                             |
| `DELETE` | `/api/entries/:id`      | Bearer | delete an entry                                          |

Errors are always `{ "error": { "code": "…", "fields": { "field": "CODE" } } }`.

Auth codes: `VALIDATION_FAILED`, `EMAIL_TAKEN`, `INVALID_CREDENTIALS`, `UNAUTHENTICATED`,
`RATE_LIMITED`, `NOT_FOUND`, `SERVER_ERROR`.
Entry codes: `FOOD_NAME_REQUIRED`, `FOOD_NAME_TOO_LONG`, `SERVING_TOO_LONG`,
`CALORIES_REQUIRED`, `CALORIES_INVALID`, `CALORIES_RANGE`, `MACRO_INVALID`, `MACRO_RANGE`,
`MEAL_TYPE_REQUIRED`, `MEAL_TYPE_INVALID`, `DATE_REQUIRED`, `DATE_INVALID`, `DATE_IN_FUTURE`,
`DATE_TOO_OLD`, `ENTRY_NOT_FOUND`, `ENTRY_LIMIT_REACHED` (100 entries/day).
Goal codes: `GOAL_REQUIRED`, `GOAL_INVALID`, `GOAL_RANGE`.

Rules: passwords need 8+ characters with a letter and a digit; entries need a name and
calories (macros default to 0) within 0–20,000 kcal and 0–2,000 g; dates may be up to two
years back and never in the future; goals are 800–20,000 kcal and 0–2,000 g.

### Environment

Copy `.env.example` → `.env` and adjust as needed:
`PORT`, `HOST`, `JWT_SECRET`, `TOKEN_TTL`, `BCRYPT_ROUNDS`, `DATA_DIR`, `API_TARGET`, `SERVE_STATIC`.

> **Before deploying:** set a real `JWT_SECRET`, move the token into an httpOnly + Secure
> cookie with refresh-token rotation and CSRF protection, and replace the JSON store with a
> real database. `client/src/lib/api.ts` and `server/lib/store.js` are the only two files that
> need to change.

---

## Testing

```bash
npm run dev          # terminal 1
npm run test:smoke   # terminal 2 — 59 end-to-end checks
```

The smoke test mounts the real app in jsdom against the live API and asserts the behaviour
this app promises. It wipes the demo account's diary first, then checks, among other things:

- login, signed-in dashboard shell, guarded routes, sign-out
- trilingual switching with `dir` flips and persistence; localised dialog labels in Arabic
- palette and colour-mode switching
- the food dialog: field coverage, empty-submit validation messages, live macro preview
- logging a breakfast and a lunch entry and watching the **stat tiles, ring, macro bars, meal
  breakdown, weekly chart and recent list update**, with the success toast
- logging in Arabic (Arabic-Indic numerals render correctly), deleting an entry, editing goals
  and seeing "remaining" recalculate

No browser download needed.

---

## Roadmap (next slices)

1. **Diary view** — day-by-day list with edit, duplicate and copy-yesterday
2. **Food database** — search, barcode scan, portion editor, saved meals and recipes
3. **Progress** — weight log, trends, weekly/monthly reports, streaks
4. **Extras** — water tracking, workouts and calories burned, reminders, PWA

Until those land, `/diary`, `/meals` and `/progress` are honest "coming soon" screens listing
what is planned; nothing in them is fake data.
