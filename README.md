# Kalori — multilingual calorie tracker (foundation)

A health-focused calorie tracking app foundation with **working authentication**, a
**three-language runtime switch** (English · العربية · کوردیی سۆرانی) with full **RTL
mirroring**, and a **customisable theme system** (4 palettes × light/dark) driven entirely by
CSS variables.

Everything below the navbar is deliberately **placeholder data** — this release is the
shell, the design system, the i18n layer and the auth flow. No food logging yet.

---

## Quick start

```bash
npm install
npm run dev          # Vite on :5173  +  Express auth API on :5174
```

Open <http://localhost:5173> and sign in with the seeded demo account:

| Email            | Password   |
| ---------------- | ---------- |
| `demo@kalori.app` | `demo1234` |

Or create a new account from `/signup`.

### Other scripts

| Script               | What it does                                                        |
| -------------------- | ------------------------------------------------------------------- |
| `npm run dev`        | Web dev server + API, both with file watching                        |
| `npm run build`      | Type-check (`tsc -b`) then build the client to `dist/`               |
| `npm run preview`    | Serve the built client + API locally                                 |
| `npm start`          | API only (add `SERVE_STATIC=1` to also serve `dist/` from one port)  |
| `npm run typecheck`  | Type-check only                                                     |
| `npm run test:smoke` | Headless UI smoke test (needs `npm run dev` running)                 |

---

## What works today

**Authentication (real)**

- Sign up / sign in / sign out, JWT sessions (7 days), bcrypt password hashing
- Server-side validation with stable error **codes** (translated in the UI), duplicate-email
  detection, attempt rate limiting (20 per 10 min per IP+route), no account enumeration
- Session restore on refresh (`GET /api/auth/me`), protected/public route guards
- Language, palette and colour mode are stored per user and follow them across devices

**Language switching (real)**

- English, Arabic and Sorani Kurdish, switchable at runtime from the navbar or `/settings`
- `<html lang>`/`dir` update instantly: the entire layout mirrors for `ar` and `ckb` because
  every stylesheet uses CSS **logical properties** (`inline-start`, `border-start`, …)
- Arabic/Kurdish switch to the Noto Kufi Arabic typeface automatically; numbers and dates go
  through `Intl` so digits, dates and weekday labels localise too
- Choice persisted in `localStorage`, with browser-language detection as the initial default

**Theming (real)**

- 4 palettes — Green (default), Blue, Purple, Warm — plus light/dark, applied by two
  attributes on `<html>`: `data-palette` and `data-mode`
- All colours resolve from semantic CSS variables (`--primary`, `--surface`, `--text`, …), so
  one attribute flip restyles the whole UI — in LTR and RTL alike
- Palette swatches preview their own colours even while another palette is active

**Dashboard & rest of the shell (placeholder data)**

- Navbar: logo, nav links, language switcher, theme switcher, user profile menu, mobile menu
- Dashboard: greeting, 4 KPI tiles, animated calorie ring, macro bars, meal log, 7-day chart,
  water tracker, streak, tip of the day, quick actions
- `/diary`, `/meals`, `/progress` are honest "coming soon" screens; `/settings` and `/profile`
  are real (theme + language + account info)
- Buttons that will later open real flows acknowledge the click with a toast instead of
  looking broken

**Mobile**

- Responsive from 320 px up: navbar collapses to a burger menu at ≤960 px, auth split-screen
  collapses at ≤1000 px, dashboards reflow to a single column, 44 px minimum touch targets

---

## Project structure

```
server/                     Express auth API (no framework, no ORM)
  index.js                  app wiring, /api/health, optional static hosting
  routes/auth.js            signup · login · me · logout · preferences (+ rate limiter)
  lib/auth.js               bcrypt + JWT helpers, publicUser() projection
  lib/validate.js           validation returning error *codes*, preference allow-list
  lib/store.js              tiny atomic JSON store (swap for Postgres/Prisma later)
  seed.js                   idempotent demo account
  data/users.json           dev "database" (git-ignored, created on first run)

client/
  index.html                <html lang dir data-palette data-mode> shell + fonts
  src/main.tsx              provider tree: Theme → I18n → Toast → Auth → Router
  src/App.tsx               route map
  src/types.ts              shared domain types (Locale, Palette, User, ApiErrorCode …)
  src/i18n/                 en.ts (key source of truth) · ar.ts · ckb.ts · index.tsx (provider)
  src/lib/                  api.ts · auth.tsx · theme.tsx · errors.ts · format.ts · validation.ts
  src/components/           layout/ (navbar, switchers, user menu) · ui/ · dashboard/ · auth/
  src/pages/                Login · Signup · Dashboard · Settings · Profile · placeholders
  src/data/placeholder.ts   all sample numbers in one file — delete when real data lands
  src/styles/               tokens.css · base.css · layout.css · components.css
  src/dev/SmokeHarness.tsx  mount harness used only by the smoke test
tests/smoke.mjs             headless end-to-end UI checks
```

---

## Design system

`client/src/styles/tokens.css` is the single source of truth. It has three layers:

1. **Palette** — `[data-palette]` sets only raw HSL channels (`--brand-h/s/l`, `--accent-*`,
   `--tint-*`, `--gradient-from/to`).
2. **Mode** — `[data-mode]` maps those channels to semantic tokens and tunes lightness
   (`--primary`, `--primary-soft`, `--surface`, `--text`, `--border`, `--shadow-*`, `--ring`, …).
3. **Components** — `components.css` / `layout.css` only ever read semantic tokens, never raw
   hues. `var(--swatch-gradient)`, `var(--fill)` and `var(--dot)` are set per-element inline
   for data-driven colours (palette swatches, macro bars, chart legends).

Adding a palette = adding one `:root[data-palette='…']` block plus an entry in
`PALETTES` (`client/src/lib/theme.tsx`). Adding a language = one dictionary file plus an entry
in `LOCALES` (`client/src/i18n/index.tsx`).

### Internationalisation contract

- `en.ts` is the key source of truth: `TranslationKey` is derived from it and every other
  dictionary is typed as `Record<TranslationKey, string>` — a missing or misspelled key fails
  type-checking rather than silently falling back to English.
- Interpolation uses `{{name}}` placeholders: `t('dashboard.greeting.morning', { name })`.
- API errors are codes; `lib/errors.ts` maps them to `errors.<CODE>` translation keys, so no
  English ever leaks into an Arabic or Kurdish screen.

---

## API

Base URL `/api` (the browser always calls its own origin; Vite proxies `/api` → `:5174`, so
the same code works behind any reverse proxy or preview host).

| Method  | Path                     | Auth   | Notes                                                   |
| ------- | ------------------------ | ------ | ------------------------------------------------------- |
| `GET`   | `/api/health`            | –      | liveness probe                                          |
| `POST`  | `/api/auth/signup`       | –      | `{ name, email, password, confirmPassword? }` → 201     |
| `POST`  | `/api/auth/login`        | –      | `{ email, password }` → `{ token, user }`               |
| `GET`   | `/api/auth/me`           | Bearer | current user                                            |
| `PATCH` | `/api/auth/preferences`  | Bearer | `{ language?, palette?, colorMode? }`                   |
| `POST`  | `/api/auth/logout`       | –      | stateless; the client drops the token                   |

Errors are always `{ "error": { "code": "…", "fields": { "field": "CODE" } } }`.
Codes: `VALIDATION_FAILED`, `EMAIL_TAKEN`, `INVALID_CREDENTIALS`, `UNAUTHENTICATED`,
`RATE_LIMITED`, `NOT_FOUND`, `SERVER_ERROR`, plus per-field codes
(`NAME_REQUIRED`, `EMAIL_INVALID`, `PASSWORD_TOO_SHORT`, `PASSWORD_TOO_WEAK`,
`PASSWORD_MISMATCH`, …).

Password rule: at least 8 characters with at least one letter and one digit.

### Environment

Copy `.env.example` → `.env` and adjust as needed:
`PORT`, `HOST`, `JWT_SECRET`, `TOKEN_TTL`, `BCRYPT_ROUNDS`, `DATA_DIR`, `API_TARGET`, `SERVE_STATIC`.

> **Before deploying:** set a real `JWT_SECRET` (the dev fallback is intentionally loud about
> being insecure), move the token into an httpOnly + Secure cookie with refresh-token rotation
> and CSRF protection, and replace the JSON store with a real database. `client/src/lib/api.ts`
> and `server/lib/store.js` are the only two files that need to change.

---

## Testing

```bash
npm run dev          # terminal 1
npm run test:smoke   # terminal 2 — 47 end-to-end checks
```

The smoke test mounts the real app in jsdom against the live API and asserts the behaviours
this foundation promises: trilingual switching with `dir` flips and persistence, palette and
colour-mode switching, sign-up validation and password strength, sign-in, the dashboard
rendering its localised placeholder data, preference sync back to the API, guarded routes and
sign-out. No browser download needed.

---

## Roadmap (next slices)

1. **Food logging** — search/openfoodfacts, barcode scan, portion editor, meal builder
2. **Real dashboard data** — replace `src/data/placeholder.ts` with `/api/dashboard`
3. **Goals & profile** — calorie/macro targets, units, weight log, onboarding wizard
4. **Progress** — weight trends, weekly reports, streaks from real logs
5. **Production hardening** — Postgres, httpOnly cookies, refresh tokens, observability, PWA
