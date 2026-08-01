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

**Live deployment of this app: https://tsns.vercel.app/** (Vercel). It is the
**custom rebuild** of the existing production site at **https://www.tsns.ca/**
(a Google Sites site — see §2). ⚠️ The payment API is **not working on Vercel**
today — see §7 (Deployment) and §10 (Known Gaps).

> There are **three** surfaces to keep straight:
> - **www.tsns.ca** — current production, Google Sites (payments redirect to
>   `tsns-payment.square.site`).
> - **tsns.vercel.app** — live deployment of *this* repo (Vercel); frontend OK,
>   but the payment backend **404s** — the function is Cloudflare-format and was
>   never ported to Vercel.
> - **Cloudflare Pages project `tsns-ca-website`** (`wrangler.toml`) — the
>   *original/intended* target where the payment function actually runs (and via
>   local `npm run dev:api`), but not the active public deployment.

---

## 2. Live Site Reference — www.tsns.ca

The **currently live** production site at https://www.tsns.ca/ is what this repo
is being built to replace. It defines the content, features, and payment
behavior the new app must reach parity with — read this before scoping new work.

### Platform

- **Google Sites**, served on a custom domain (`tsns.ca`).
  - Telling signals: assets from `www.gstatic.com/_/atari/_/...` ("atari" is
    Google Sites' internal codebase), Google Fonts (Oswald / Open Sans), no CMS
    generator tag, "Report abuse" links in the footer.
- Built in Google's drag-and-drop editor — **not custom code**, so it is *not* a
  source for this repo. Content lives in the Google Sites account and must be
  **migrated by hand** into the React pages.

### Visual design (live)

- Dark teal/navy header, all-caps nav bar.
- Full-bleed hero photo (Bosphorus / Istanbul imagery) with the bilingual
  tagline **"Bridging Cultures / Building Communities"** and
  **"Welcome to our Society!"**.
- Three CTA cards: **New Comers – Yeni Gelenler**, **Membership – Uyelik**,
  **More Details**.
- Footer: *"© 2023 The Turkish Society of Nova Scotia. All rights reserved."*

### Live site structure (full nav)

| Section | Pages |
| --- | --- |
| Home | `/home` |
| About | `/about` → Our Mission, **Bylaws–Tuzuk**, Membership and Our Board, **Documents**, **Photos** |
| Announcements–Events | `/announcements-events` (static bilingual text, e.g. AGM Jun 2026) |
| NewComers | `/newcomers` → Settlement Partnerships |
| Sponsors | `/sponsors` → Nikki Jafari (Scotiabank), MediTerra Kitchen & Grocery, Bosphorus Construction, Remax / Deirdre Goulding |
| Contact | `/contact` |
| Membership and Tickets | `/membership-and-tickets` |

### How the live site takes payments today (IMPORTANT)

The current site does **not** process cards itself — it funnels to external
services:

1. **Square Online Checkout (hosted)** — a `MEMBERSHIP and TICKET PAYMENT`
   button links to **`https://tsns-payment.square.site/`**, a Square-hosted
   checkout that handles **both** membership dues and event tickets (e.g. the
   *"102 Years of the Turkish Republic Celebration"* reception).
2. **Google Form + e-transfer** — renewals also go through a Google Form with
   **Interac e-transfer to `info@tsns.ca`**.

> **This is the core motivation for the rebuild.** The repo re-implements the
> Square flow **natively** (Web Payments SDK in `PaymentModal.jsx` →
> `/api/create-payment` Pages Function → Square `/v2/payments`), so members pay
> **in-app** instead of being redirected off-site to `tsns-payment.square.site`.
> Benefits: keeps users on `tsns.ca`, lets the org capture name/email/phone
> directly, and removes dependence on the hosted Square Online page.

### Live → Repo migration / parity map

| Live-site feature | Repo status | Notes |
| --- | --- | --- |
| Home hero ("Bridging Cultures…") | ⚠️ partial | `Home.jsx` hero uses only `welcome`; live has the full bilingual slogan |
| About → Mission / Board | ⚠️ partial | `About.jsx` is a single text block; no mission/board sections |
| About → Bylaws–Tuzuk | ❌ missing | — |
| About → Documents | ❌ missing | — |
| About → Photos | ❌ missing | — |
| Announcements–Events | ❌ placeholder | nav link is `href="#"`; no events page |
| NewComers + Settlement Partnerships | ❌ placeholder | nav link is `href="#"` |
| Sponsors directory | ❌ placeholder | nav link is `href="#"` |
| Contact | ⚠️ partial | repo has socials + email table; live adds **YouTube** and a Facebook *group* URL |
| Membership payment | ✅ rebuilt natively | Square flow in-app; live redirects to `tsns-payment.square.site` |
| Event ticket sales | ❌ missing | live sells tickets via Square Online; repo has no ticketing |
| Google Form renewals / e-transfer | ❌ not replicated | — |

### Social channels (live, for `Contact.jsx` parity)

Facebook (group), Instagram, **YouTube**, LinkedIn, Linktree. The repo's
`Contact.jsx` lists Instagram, Facebook (page), LinkedIn, Linktree — **YouTube
is missing**, and its Facebook URL points at the page, not the live group.

---

## 3. Tech Stack

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

## 4. Repository Structure

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

## 5. Architecture

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

> 🚨 **CRITICAL — the backend is broken on the live Vercel deployment.**
> `functions/api/create-payment.js` is written for **Cloudflare Pages
> Functions** (`export async function onRequestPost({ request, env })`). The app
> is deployed on **Vercel**, which neither scans `functions/` nor understands
> the `onRequestPost` / `env` signature (there is no `api/` dir and no
> `vercel.json`). Verified: `POST https://tsns.vercel.app/api/create-payment` →
> **HTTP 404**. So the in-app card flow cannot complete in production —
> `PaymentModal` shows *"Your card could not be charged."* The function only
> runs under `npm run dev:api` (local Wrangler) or on Cloudflare Pages. Fixes:
> (a) port to a Vercel `api/create-payment.js` default Web-Request handler
> reading `process.env`, or (b) deploy the app to Cloudflare Pages. See §7/§10.

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

## 6. Development

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

## 7. Deployment

- **Active host: Vercel** → the repo's build is live at
  **https://tsns.vercel.app/**. Vercel auto-detects the Vite framework, runs
  `npm run build`, and serves `dist/` as a static SPA.
- **Original/intended host: Cloudflare Pages** — `wrangler.toml` (project
  `tsns-ca-website`) and the `dev:api` script target Pages, where
  `functions/api/create-payment.js` *would* deploy as a serverless function.
  This is currently the only place that function actually runs (local or Pages).
- **⚠️ Hosting mismatch (live bug).** The payment function is Cloudflare-format
  but the app ships on Vercel, so `/api/create-payment` is **404 on Vercel**
  (verified). Payments cannot complete on the live deployment until resolved.
- Client env on Vercel is set to **`VITE_SQUARE_ENV=production`** (the
  production Square Web SDK URL is baked into the bundle).
- There is **no `.github/workflows`** and no `vercel.json` — CI/CD is the host's
  git integration (Vercel, optionally Cloudflare Pages), not GitHub Actions. The
  `8630462 "Empty commit: trigger CI"` commit reflects this auto-deploy model.
- Secrets live in the host dashboard env vars (Vercel project settings), **not**
  in this repo. The server-side `SQUARE_ACCESS_TOKEN` only matters where the
  function actually executes (local `.dev.vars` / Cloudflare) — Vercel doesn't
  run it.

**To fix the payment deployment, pick one:**

1. **Stay on Vercel** → add `api/create-payment.js` (Vercel convention) porting
   the logic to a default Web-Request handler that reads `process.env`, and set
   `SQUARE_*` in Vercel env. (`functions/` can then be removed.)
2. **Move to Cloudflare Pages** → the existing function works as-is; point the
   `tsns.ca` (or a sub-) domain at Pages instead of Vercel.

### Domain: `tsns.ca` — ownership & migration plan

- **Registered at GoDaddy; plan: transfer the registration to Cloudflare
  Registrar.** (`.ca` transfers to Cloudflare became available Jul 26, 2025.)
- **Two independent moves — don't conflate them:**
  1. *DNS / nameserver move* (GoDaddy NS → Cloudflare NS): minutes, **no
     downtime** if records are copied first. This is what routes `tsns.ca` to the
     new app, and it's a prerequisite for the registrar transfer.
  2. *Registrar transfer* (GoDaddy → Cloudflare): `.ca` typically **5–7 days**
     (CIRA); Cloudflare's stated max is 10 days. Runs in the background with
     **no downtime** — purely a billing/ownership move. It does **not** block
     development or launch.
- **`.ca` specifics:** the auth code is **registry-issued by CIRA** (request at
  cira.ca, sent to the registrant email on file) — not just a registrar code.
  Eligibility: >30 days since registration, and not within the **60-day lock**
  that follows a registrant change.
- **Safety rule:** before switching nameservers, snapshot all GoDaddy DNS
  records and recreate them in Cloudflare — **especially MX records** (the
  Contact-page mailboxes like `info@tsns.ca` / `events@tsns.ca`) and the Google
  Sites record, so the live site and email stay up during the move.
- **Recommended sequence:** (A) add `tsns.ca` to Cloudflare and switch
  nameservers, keeping the Google Sites record live; (B) start the registrar
  transfer in the background; (C) develop the new design; (D) on launch, flip
  the DNS record to the app host in Cloudflare — no registrar action needed.
- **Open decision (ties into the host choice above):** whether the domain should
  point at Vercel or at Cloudflare Pages (the latter also fixes the payment
  function with no code change). Decide before launch.
- **Live DNS confirmed (queried + GoDaddy export, 2026-08-01):**
  - **Email = Google Workspace** — MX → `aspmx` + `alt1–4.aspmx.l.google.com`,
    priorities **1 / 5 / 5 / 10 / 10**. The Contact-page mailboxes
    (`info@`/`events@`/`partners@`/`community@tsns.ca`) are real Gmail inboxes —
    these MX records are the #1 thing the migration must preserve.
  - **Website = Google Sites** — apex `A` ×4 → `216.239.32.21`, `.34.21`,
    `.36.21`, `.38.21`; `www` CNAME → `ghs.googlehosted.com`.
  - One `TXT` = `google-site-verification=2PLW2MD7lzySzz3ZhCeYVomlGfgfqpb4s0dlU5BLGkk`.
  - **No SPF / DKIM / DMARC / MTA-STS published today** (optional deliverability
    hardening — not part of the move; don't add mid-migration).
  - Nameservers currently GoDaddy (`ns37/ns38.domaincontrol.com`).
- **Migration gotchas (so they're not re-learned next time):**
  - In Cloudflare, **do NOT enable Email Routing** — it overwrites the Google MX
    records and breaks mail. Keep the 5 Google MX records verbatim.
  - Do **not** manually add `NS`/`SOA` — Cloudflare manages those automatically.
  - Set the Google Sites `A`/`CNAME` records to **DNS-only (gray cloud)** to
    mirror GoDaddy's current (un-proxied) behavior.

---

## 8. Design System (`src/index.css`)

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

## 9. Current State (as of 2026-08-01)

Built and working:

- ✅ Site shell: header, responsive desktop/mobile nav, footer.
- ✅ Bilingual nav labels (EN/TR) with persistence.
- ✅ Home, About, Contact content pages.
- ✅ Membership form with client-side validation.
- ✅ Square card-payment flow — works **locally** / on Cloudflare (tokenize →
  server charge → confirmation). ❌ **Broken on the live Vercel deployment**
  (`/api/create-payment` → 404); see §7.
- ✅ Server payment function with sandbox/production switching + idempotency
  (Cloudflare Pages Functions format — needs porting for Vercel).

In progress / not done:

- 🚨 **Payment backend not deployed on Vercel** — `/api/create-payment` 404s on
  tsns.vercel.app; the Cloudflare-format function must be ported or the app
  moved to Cloudflare Pages (highest priority).
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

## 10. Known Gaps & Tech Debt

1. **🚨 Hosting/runtime mismatch — payments broken in production (highest priority).**
   The payment function is Cloudflare Pages format (`onRequestPost`/`env` in
   `functions/api/`) but the app is deployed on **Vercel**, which returns 404
   for `/api/create-payment`. Card payments cannot complete on tsns.vercel.app
   until the function is ported to Vercel or the app is moved to Cloudflare
   Pages (see §7).
2. **Inline styles everywhere** — `App.jsx` (mobile menu), `MembershipForm`,
   `PaymentModal`, `ConfirmationPage`, `About`, `Contact` lean heavily on inline
   styles and magic hex values instead of `index.css` tokens/classes. Hard to
   theme and maintain.
3. **Partial i18n** — only the nav shell uses `t()`. Page bodies and the entire
   membership flow are English-only.
4. **No member database** — even when payments work, nothing is stored about the
   member beyond the ephemeral confirmation screen. Square is the only record.
5. **No tests, no linting, no TypeScript** — no guardrails beyond Vite's build.
6. **Placeholder routes** — Events / Newcomers / Sponsors / Search.
7. **Accessibility** — the About dropdown is keyboard-handled, but other
   interactive elements (hamburger, buttons) lack full ARIA/keyboard coverage.

---

## 11. Git Workflow

- **Default branch:** `main`.
- **Active branch:** `feat/apple-pay` (Apple Pay prep, unmerged).
- Commits are conventional-ish but informal. Recent history shows feature work
  (`Integrate Square payments…`, `Added About and Contact`) and small fixes
  (`fixed hamburger menu positioning…`, `mobile view fixes`).
- Git user: Burak Teke.

---

## 12. Conventions to Follow

- **JSX + function components** with hooks; no class components.
- **New UI should use the CSS variables** (`var(--primary)`, etc.) from
  `index.css`, not raw hex codes.
- **Keep secrets server-side.** Anything sensitive goes in `.dev.vars` /
  Cloudflare env and is read inside `functions/`, never prefixed with `VITE_`.
- **Run `npm run dev:api`** (not `npm run dev`) when testing payment or API
  behavior locally.
- **Update this file** when adding pages, env vars, dependencies, or changing
  the deploy target.
