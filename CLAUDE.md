# CLAUDE.md

> Central reference for the **Turkish Society of Nova Scotia (TSNS)** website.
> This file is the living source of truth for the project — update it whenever
> the architecture, conventions, or setup change. Claude reads this file at the
> start of every session.

---

## 1. Project Overview

Public website and membership-payment platform for the **Turkish Society of
Nova Scotia (TSNS)**, a community organization active in Nova Scotia and the
broader Atlantic Canada region since 2007.

The site is a small **React SPA** that:

- Presents the organization (Home, About, Contact).
- Accepts **membership dues** through **Square** card payments (CAD).
- Serves **English / Turkish** via a hand-rolled i18n layer.

Deployed on **Cloudflare Pages** (project name `tsns-ca-website`) with
**Cloudflare Pages Functions** providing the serverless payment API.

---

## 2. Tech Stack

| Layer        | Choice                                                        |
| ------------ | ------------------------------------------------------------ |
| UI framework | React 18 (`react`, `react-dom`)                              |
| Build tool   | Vite 5 (JSX, **no TypeScript**, no `vite.config` — defaults) |
| Routing      | `react-router-dom` v7 (`BrowserRouter`)                      |
| Styling      | Plain CSS (`src/index.css`) + heavy use of inline styles     |
| i18n         | Custom (`src/i18n.js`) — no library                          |
| Hosting      | Cloudflare Pages                                             |
| Serverless   | Cloudflare Pages Functions (`functions/`)                    |
| Payments     | Square Web Payments SDK (frontend) + Square Payments API (backend) |
| Runtime      | Wrangler 3 (local dev for Pages Functions)                   |

No test framework, no linter config, no TypeScript. Dependencies are minimal
(see `package.json`).

---

## 3. Repository Structure

```
.
├── index.html                  # Vite entry; mounts /src/main.jsx
├── package.json                # Scripts + deps
├── wrangler.toml               # Cloudflare Pages project config (name, compat date)
├── .env.example                # Template for required env vars (see §6)
├── functions/                  # Cloudflare Pages Functions (serverless API)
│   └── api/
│       └── create-payment.js   # POST /api/create-payment → Square /v2/payments
├── public/                     # Static assets served as-is
│   ├── tsns.jpeg               # Header logo
│   └── bogaz.jpg               # Home hero background
└── src/
    ├── main.jsx                # React root (createRoot + StrictMode)
    ├── App.jsx                 # Layout shell: header, nav, mobile menu, routes
    ├── i18n.js                 # en/tr translations, detection, persistence
    ├── index.css               # Design tokens + global/responsive styles
    ├── components/
    │   ├── MembershipForm.jsx  # Name/email/phone/amount form with validation
    │   └── PaymentModal.jsx    # Square SDK card form + tokenize → /api/create-payment
    └── pages/
        ├── Home.jsx            # Hero (Bogaz bg) + footer
        ├── About.jsx           # Org description
        ├── Contact.jsx         # Social links + department email table
        ├── Membership.jsx      # Orchestrates form → modal → confirmation
        └── ConfirmationPage.jsx # Post-payment thank-you (reads sessionStorage)
```

---

## 4. Architecture

### Routing (`src/App.jsx`)

A single `<BrowserRouter>` wraps `AppContent`, which renders the persistent
header/nav and a `<Routes>` block:

| Path            | Component         | Bilingual? |
| --------------- | ----------------- | ---------- |
| `/`             | `Home`            | ✅ (labels) |
| `/about`        | `About`           | label only (body is EN) |
| `/contact`      | `Contact`         | label only (body is EN) |
| `/membership`   | `Membership`      | ❌ hardcoded EN |
| `/confirmation` | `ConfirmationPage`| ❌ hardcoded EN |

The header renders a **desktop nav** (Home, About dropdown, Member, Events,
Contact) plus a **hamburger drawer** for mobile (`@media max-width: 720px` hides
`.nav` and shows the drawer). The About dropdown is keyboard-accessible
(`Enter`/`Space`/`ArrowDown`, `Escape` to close, outside-click to dismiss).

> ⚠️ Several nav links are still placeholders: **Events**, **Newcomers**,
> **Sponsors** point to `href="#"`, and the **Search** button only shows an
> alert ("coming soon").

### i18n (`src/i18n.js`)

- Supported languages: `["en", "tr"]`.
- Initial language: `localStorage["lang"]` → browser language (`tr` if the
  browser locale starts with `tr`) → `en`.
- `t(lang, key, vars)` looks up the key (falls back to `en`, then the key
  itself) and interpolates `{var}` placeholders (e.g. `copyright` uses `{year}`).
- State lives in `AppContent`; the selected `lang` is passed as a prop to each
  page. (Pages that ignore it stay English.)

### Payments — the critical flow

```
MembershipForm                 PaymentModal (browser)            Pages Function               Square
  (user data)                    Square Web SDK                     /api/create-payment          /v2/payments
      │                              │                                  │                           │
      │  onSubmit(data)              │                                  │                           │
      ├─────────────────────────────►│                                  │                           │
      │                              │  payments.card().attach()        │                           │
      │                              │  (hosted, PCI-scoped iframe)     │                           │
      │                              │  card.tokenize() ─────────────► sourceId (token)            │
      │                              │  POST { sourceId, amountCents,   │                           │
      │                              │        currency, buyer }         │                           │
      │                              ├─────────────────────────────────►│  POST /v2/payments        │
      │                              │                                  │  Bearer SQUARE_ACCESS_TOKEN
      │                              │                                  ├──────────────────────────►│
      │                              │                                  │◄──────────────────────────┤ payment
      │                              │◄─────────────────────────────────┤ { paymentId, status,      │
      │  onConfirm(paymentResult)    │                                  │   receiptUrl }            │
      ◄──────────────────────────────┤                                  │                           │
```

Key security properties:

- **Card data never touches our code.** The Square SDK renders an iframe and
  returns only a one-time `sourceId` token.
- **The secret `SQUARE_ACCESS_TOKEN` lives only on the server** (Cloudflare env,
  exposed via the Function's `env`). The browser only holds the public
  `VITE_SQUARE_APPLICATION_ID`.
- The Function forces **CAD**, rejects amounts under $1.00, and generates an
  **idempotency key** (`crypto.randomUUID()` when the client doesn't supply one)
  so a retried request can't double-charge.

After a successful payment, `Membership` stores `{ ...formData, payment }` in
**`sessionStorage["membershipData"]`** and navigates to `/confirmation`, which
reads it back. There is **no backend persistence of members** yet — the
confirmation is purely client-side.

---

## 5. Development

### Commands

```bash
npm install        # install deps
npm run dev        # Vite dev server only (no /api support)
npm run dev:api    # Wrangler Pages dev proxying to Vite (USE THIS for payment work)
npm run build      # production build → dist/
npm run preview    # preview the built dist/
```

**Use `npm run dev:api` when working on anything payment-related** — it boots
the local Cloudflare runtime so `/api/create-payment` resolves. Plain
`npm run dev` will 404 on API calls.

### Environment variables

Copy `.env.example` → `.env` (frontend Vite vars) **and** `.dev.vars` (server
vars for Wrangler). Both sets are required for the payment flow:

| Variable (server / `.dev.vars`)       | Purpose                                  |
| ------------------------------------- | ---------------------------------------- |
| `SQUARE_ACCESS_TOKEN`                 | Secret — calls Square API (server only)  |
| `SQUARE_LOCATION_ID`                  | Square location for the charge           |
| `SQUARE_ENV`                          | `sandbox` \| `production`                |

| Variable (client / `.env`, `VITE_` prefix) | Purpose                              |
| ------------------------------------------ | ------------------------------------ |
| `VITE_SQUARE_APPLICATION_ID`               | Public app id for the Web SDK        |
| `VITE_SQUARE_LOCATION_ID`                  | Location id for the Web SDK          |
| `VITE_SQUARE_ENV`                          | `sandbox` \| `production`            |

Both `.env` and `.dev.vars` are gitignored. **Never commit secrets.**

### Square sandbox test card (non-production)

```
4111 1111 1111 1111   ·   any future expiry   ·   any CVV   ·   postal 12345
```

---

## 6. Deployment

- **Host:** Cloudflare Pages, project `tsns-ca-website` (`wrangler.toml`).
- **Build command:** `npm run build`; **output dir:** `dist/` (Vite default).
- Pages Functions in `functions/` are deployed automatically alongside the
  static build — no extra step.
- The commit `8630462 "Empty commit: trigger CI"` indicates Pages auto-builds on
  push to `main`. There is **no `.github/workflows`** directory — CI/CD is the
  Cloudflare Pages integration, not GitHub Actions.
- Production Square env vars are configured in the Cloudflare dashboard
  (Settings → Environment variables), not in this repo.

---

## 7. Design System (`src/index.css`)

CSS custom properties (design tokens):

```css
--primary:      #16466A;  /* TSNS navy — main brand color */
--secondary:    #EFEFEF;  /* page background */
--turkish-red:  #E30A17;  /* accent / error color (Turkish flag red) */
--ns-yellow:    #FFD200;  /* Nova Scotia yellow (logo border) */
--text:         #0f172a;  /* slate-900 body text */
--muted:        #64748b;  /* slate-500 secondary text */
--card:         #ffffff;
```

- Layout utility `.container` (max-width 1100px).
- Buttons via `.btn`, `.btn.primary`, `.btn.ghost`.
- Responsive breakpoint at **720px** flips desktop nav → hamburger drawer.
- **Convention drift:** the membership pages and many components use hard-coded
  inline styles (e.g. `#16466A`, `#E30A17`, `#64748b`) instead of the tokens.
  Prefer the CSS variables when adding new UI.

---

## 8. Current State (as of 2026-08-01)

Built and working:

- ✅ Site shell: header, responsive desktop/mobile nav, footer.
- ✅ Bilingual nav labels (EN/TR) with persistence.
- ✅ Home, About, Contact content pages.
- ✅ Membership form with client-side validation.
- ✅ Square card-payment flow (tokenize → server charge → confirmation).
- ✅ Cloudflare Pages Function with sandbox/production switching and idempotency.

In progress / not done:

- 🚧 **Apple Pay** — `feat/apple-pay` branch modifies `PaymentModal.jsx`
  (preparations only; not merged).
- ❌ **Events** page (nav link is a placeholder).
- ❌ **Newcomers / Sponsors** sub-pages (placeholder links).
- ❌ **Search** (button only; alerts "coming soon").
- ❌ **Member persistence** — no DB/backend record of paid members; confirmation
  data lives only in `sessionStorage`.
- ❌ **i18n coverage** — Membership, About, Contact, Confirmation bodies are
  English-only.

---

## 9. Known Gaps & Tech Debt

1. **Inline styles everywhere** — `App.jsx` (mobile menu), `MembershipForm`,
   `PaymentModal`, `ConfirmationPage`, `About`, `Contact` lean heavily on inline
   styles and magic hex values instead of `index.css` tokens/classes. Hard to
   theme and maintain.
2. **Partial i18n** — only the nav shell uses `t()`. Page bodies and the entire
   membership flow are English-only.
3. **No member database** — payments succeed but nothing is stored about the
   member beyond the ephemeral confirmation screen. Square is the only record.
4. **No tests, no linting, no TypeScript** — no guardrails beyond Vite's build.
5. **Placeholder routes** — Events / Newcomers / Sponsors / Search.
6. **Accessibility** — the About dropdown is keyboard-handled, but other
   interactive elements (hamburger, buttons) lack full ARIA/keyboard coverage.

---

## 10. Git Workflow

- **Default branch:** `main`.
- **Active branch:** `feat/apple-pay` (Apple Pay prep, unmerged).
- Commits are conventional-ish but informal. Recent history shows feature work
  (`Integrate Square payments…`, `Added About and Contact`) and small fixes
  (`fixed hamburger menu positioning…`, `mobile view fixes`).
- Git user: Burak Teke.

---

## 11. Conventions to Follow

- **JSX + function components** with hooks; no class components.
- **New UI should use the CSS variables** (`var(--primary)`, etc.) from
  `index.css`, not raw hex codes.
- **Keep secrets server-side.** Anything sensitive goes in `.dev.vars` /
  Cloudflare env and is read inside `functions/`, never prefixed with `VITE_`.
- **Run `npm run dev:api`** (not `npm run dev`) when testing payment or API
  behavior locally.
- **Update this file** when adding pages, env vars, dependencies, or changing
  the deploy target.
