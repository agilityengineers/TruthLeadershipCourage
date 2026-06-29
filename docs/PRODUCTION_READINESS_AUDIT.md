# TLC Leadership Platform — Production-Readiness Audit

**Audited:** 2026-06-29 · **Branch:** `claude/production-readiness-audit-ckanyo`
**Target host:** Replit Deployments (pre-import review) · **Scope:** read-only gap analysis

---

## 1. Executive Summary

**Verdict: NOT READY for Replit production deploy — 6 Blockers, 9 High, 11 Medium, several Low.**

- **No Replit configuration exists.** There is no `.replit`, no `replit.nix`, no deployment/run config. The repo cannot be imported and run on Replit without authoring these from scratch. (Blocker)
- **No database is provisioned and there are no migrations.** The schema is applied via `prisma db push` (no `prisma/migrations/` history). Replit provides no Postgres unless you add one; `DATABASE_URL` must be set to a real Postgres (Replit Postgres / Neon) and a migration strategy chosen. (Blocker)
- **The payment flow is incomplete.** Enrollment creates a `PENDING` payment, but **nothing in the codebase ever creates a Stripe Checkout Session** (or any charge) carrying the `metadata.enrollmentId` the webhook depends on. Revenue cannot be collected through the product as written. (Blocker for revenue)
- **Both payment webhooks can be spoofed.** Stripe falls back to unverified `JSON.parse` when `STRIPE_WEBHOOK_SECRET` is unset; ThriveCart skips its secret check whenever the payload omits the secret field. Either lets an unauthenticated caller mark enrollments paid and ship physical workbooks for free. (Blocker / Security)
- **Webhook fulfillment is not idempotent for side effects.** `fulfillEnrollment` re-sends the welcome email and re-creates a notification on every delivery; webhook retries → duplicate emails. (High)
- **Secrets are not provisioned for Replit.** `AUTH_SECRET`, `DATABASE_URL`, Stripe/SendGrid/ThriveCart keys all need to be added to Replit Secrets; `.env` is git-ignored and `.env.example` is missing a few keys actually read by code (`AUTH_OKTA_*`, `NODE_EXTRA_CA_CERTS`). (High)
- **No rate limiting anywhere.** Public unauthenticated entry points — credential login, assessment submit, enrollment create — have no throttling or bot protection. (High)
- **No tests, no CI, no error/loading boundaries.** Zero test files; no `error.tsx`/`loading.tsx`/`not-found.tsx`/`global-error.tsx` in `src/app`; `npm run lint` is wired to `next lint` but ESLint is not installed/configured. (High/Medium)
- **A few user-facing dead ends:** a non-functional "Open digital workbook" button, `href="#"` fallbacks on join-session and library links, demo passwords printed on the login page, and a stub `book-a-call` page. (Medium)
- **What's solid:** clean App Router architecture; Zod validation on every server action; coherent RBAC (`rbac.ts`) + tenant scoping (`scope.ts`) applied in layouts and queries; no hardcoded secrets; processor-agnostic fulfillment design; GDPR export/consent/audit plumbing present.

---

## 2. Architecture Map

| Layer | Technology |
|---|---|
| Framework | Next.js 15.5 (App Router, RSC) + React 19 + TypeScript 5.7 (strict) |
| Mutations | **Server Actions** (`src/server/*.ts`, `"use server"`) — the primary "API" |
| HTTP routes | 5 route handlers under `src/app/api/*` (auth, 2 webhooks, calendar, GDPR export) |
| UI | Tailwind 3 + Radix primitives (shadcn-style) in `src/components/ui` |
| Auth | Auth.js / NextAuth v5 beta, JWT strategy, Credentials + env-gated Okta OIDC |
| DB / ORM | PostgreSQL + Prisma 6.19 (32 models) |
| Payments | Stripe + ThriveCart **webhooks only** (no in-product card UI) |
| Email | SendGrid (`@sendgrid/mail`), dev-mode console fallback |
| Calendar | Hand-rolled `.ics` generation (`src/lib/ics.ts`) |
| Package mgr | npm (`package-lock.json`) |

**Structure**
- `src/app/` — route segments: public (`/`, `/assessment`, `/enroll`, `/book-a-call`, `/login`) and gated dashboards (`/portal`, `/trainer`, `/admin`, `/company`), each with a `layout.tsx` enforcing role.
- `src/server/` — 17 server-action / data modules (enrollment, billing, chat, coaching, progress, email, admin, assessment, fulfillment, portal-data, chat-data…).
- `src/lib/` — infra: `db.ts` (Prisma singleton), `rbac.ts` (capability matrix), `scope.ts` (tenant `where` fragments), `session.ts` (route guards), `stripe.ts`, `email.ts`, `audit.ts`, `notifications.ts`, `coupon.ts`, `cohort.ts`, `certificate.ts`, `ics.ts`, `assessment.ts`, `utils.ts`.
- `src/middleware.ts` — edge cookie gate for protected prefixes.
- `prisma/` — `schema.prisma` (+ `seed.ts`). **No `migrations/` directory.**
- `scripts/` — `dev-setup.sh`, `session-start.sh` (sandbox/Prisma-engine helpers, **not** Replit-aware).
- `.claude/settings.json` — SessionStart hook only.

**Third-party integrations:** Stripe, ThriveCart, SendGrid, Okta (optional OIDC), PostgreSQL. No AI APIs.

---

## 3. Replit Import Checklist

Everything below must be created or configured **before/at import** to run on Replit.

### 3.1 Files to create (do not exist today)
1. **`.replit`** — entrypoint, run command, deployment block. Minimum:
   ```toml
   run = "npm run start"
   [deployment]
   build = ["sh", "-c", "npm install && npm run build"]
   run = ["sh", "-c", "npm run start -- -p $PORT -H 0.0.0.0"]
   [[ports]]
   localPort = 3000
   externalPort = 80
   ```
   Notes: `next start` already binds `0.0.0.0` and honors `PORT`, but pass `-p $PORT -H 0.0.0.0` explicitly to be safe. Choose **Reserved VM** deployment (this app is a long-running server with a Prisma singleton; Autoscale will fan out connections — see §5 Database).
2. **`replit.nix`** — provide Node 20+ toolchain and OpenSSL for Prisma:
   ```nix
   { pkgs }: { deps = [ pkgs.nodejs_20 pkgs.openssl ]; }
   ```
3. *(Optional)* `.node-version` / engines pin so Replit selects Node ≥ 18.18 (Next 15 requirement).

### 3.2 Replit Secrets to set (none are committed; `.env` is git-ignored)
| Secret | Required? | Notes |
|---|---|---|
| `DATABASE_URL` | **Yes** | Point at Replit Postgres or Neon. Include pooled connection params for serverless safety. |
| `AUTH_SECRET` | **Yes** | `openssl rand -base64 32`. App will not sign JWTs without it. |
| `AUTH_URL` | Recommended | Set to the deployed `https://…replit.app` URL. `trustHost:true` is set, so host is auto-detected, but set this for correct callback URLs. |
| `NEXT_PUBLIC_APP_URL` | Recommended | Used as the public base URL; set to the deployment URL. |
| `STRIPE_SECRET_KEY` | If using Stripe | Live vs test separation is **not** enforced in code — pick deliberately. |
| `STRIPE_WEBHOOK_SECRET` | **Yes if Stripe** | Without it the webhook accepts **unsigned** payloads (see §5 Security). |
| `THRIVECART_WEBHOOK_SECRET` | If using ThriveCart | See spoofing gap in §5. |
| `SENDGRID_API_KEY` | For real email | Absent → emails are logged, not sent (silent in prod). |
| `SENDGRID_FROM_EMAIL` / `SENDGRID_FROM_NAME` | Recommended | Must be a SendGrid-verified sender. |
| `AUTH_OKTA_ID` / `AUTH_OKTA_SECRET` / `AUTH_OKTA_ISSUER` | Only if SSO | Read by `src/auth.ts:18-19`; **missing from `.env.example`**. |

### 3.3 Build / runtime adjustments for Replit
4. **Prisma engine target.** `schema.prisma:8` sets `binaryTargets = ["native","debian-openssl-3.0.x"]`. Confirm Replit's runtime OpenSSL matches; if the deploy image differs you may need `rhel-openssl-3.0.x` or `linux-musl-openssl-3.0.x`. `npm run build` runs `prisma generate`, which needs outbound access to fetch engines (Replit allows this).
5. **Drop the sandbox scripts from the Replit path.** `scripts/dev-setup.sh` and `scripts/session-start.sh` assume this Claude sandbox (local Postgres via `pg_ctlcluster`, proxy CA at `/root/.ccr/ca-bundle.crt`, manual Prisma-engine curl). They will not work on Replit and must not be wired into the Replit run command. The `.claude/settings.json` SessionStart hook is Claude-web-only and harmless but irrelevant on Replit.
6. **Database bootstrap on first deploy.** Run `prisma migrate deploy` (after you create migrations — see §5) **or** `prisma db push`, then optionally `npm run db:seed`. Decide whether to seed demo data in production (the seed creates demo users with password `password123` — **do not seed prod**, or change passwords).
7. **Remove `NODE_EXTRA_CA_CERTS` assumptions.** `dev-setup.sh` writes it into `.env`; it must not leak into the Replit environment.

### 3.4 Post-import verification
8. Confirm `npm run build` succeeds on Replit (node_modules is currently absent; build was not runnable in this audit).
9. Register the production webhook URLs in the Stripe and ThriveCart dashboards (`/api/webhooks/stripe`, `/api/webhooks/thrivecart`) and copy the signing secrets into Secrets.

---

## 4. Backend ↔ Frontend Wiring Matrix

The product's real API surface is **Server Actions**, not HTTP routes. Matrix covers both.

### 4.1 HTTP route handlers
| Route | Method | Frontend caller | Status |
|---|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | `login-form.tsx` via `signIn` (`auth-actions.ts:17`); `middleware.ts` cookie gate | ✅ Wired |
| `/api/me/export` | GET | `portal/settings/page.tsx:43` (`<a href>`) | ✅ Wired |
| `/api/calendar/[cohort]` | GET | `portal/coaching/page.tsx:65,99` (`<a href>`) | ✅ Wired |
| `/api/webhooks/stripe` | POST | External (Stripe) — no in-product caller **by design** | ⚠️ External; primary path has **no producer** (no checkout creator) |
| `/api/webhooks/thrivecart` | POST | External (ThriveCart) — no in-product caller **by design** | ⚠️ External; secret check bypassable |

### 4.2 Server Actions
| Action (`src/server/…`) | Frontend caller (file:line) | Status |
|---|---|---|
| `loginAction` / `logoutAction` | `login/login-form.tsx:5`; `brand/sign-out.tsx:4` | ✅ Wired |
| `ssoLoginAction` | `login/page.tsx:32` | ✅ Wired (no-op unless Okta env set) |
| `submitAssessment` | `assessment/assessment-flow.tsx:9` | ✅ Wired |
| `createEnrollment` | `enroll/enroll-form.tsx:5` | ✅ Wired |
| `setConsent`, `requestAccountDeletion` | `portal/account-actions.tsx:6,46` | ✅ Wired |
| `markAllNotificationsRead` | `notifications/bell.tsx:7` | ✅ Wired |
| `sendMessage` | `chat/chat-view.tsx:9` | ✅ Wired |
| `markThreadRead` | `portal/messages/page.tsx:19`, `trainer/messages/page.tsx:19` | ✅ Wired |
| `rescheduleBooking` | `portal/reschedule-dialog.tsx:16` | ✅ Wired |
| `markWeekCompleteAction` | `portal/page.tsx:403` | ✅ Wired (authz concern — §5) |
| `createResource`, `setResourceStatus` | `trainer/resource-manager.tsx:20` | ✅ Wired |
| `createEvent` | `trainer/event-manager.tsx:19` | ✅ Wired |
| `addQuestion`/`updateQuestion`/`deleteQuestion` | `admin/assessment-builder.tsx:18` | ✅ Wired |
| `sendCampaign` | `admin/email-composer.tsx:11` | ✅ Wired |
| `refundPayment` | `admin/refund-button.tsx:16` | ✅ Wired |
| `createCompany`, `cloneCohort`, `purchaseSeats` | `admin/admin-dialogs.tsx:16` | ✅ Wired |
| `fulfillEnrollment` | both webhooks (`fulfillment.ts`) | ✅ Wired (internal) |
| `evaluateCoupon` | `enrollment-actions.ts:104` | ✅ Wired (internal) |
| `getParticipantContext`, `deriveJourney` | portal pages | ✅ Wired |
| `getThreadsForUser`, `getThread` | messages pages | ✅ Wired |

### 4.3 Orphaned components
- **Orphaned backend (no caller):** **None.** Every server action and the export/calendar routes have a frontend caller. The two webhook routes have no in-product caller — that is intentional (external processors).
- **Orphaned frontend calls (caller → missing/broken backend):** **None broken at the route level.** However:
  - **Missing producer:** the Stripe webhook expects a Checkout Session with `metadata.enrollmentId` (`api/webhooks/stripe/route.ts:36`), but no code path creates one anywhere in the repo (`grep` for `checkout`/`paymentIntent`/`redirectToCheckout` finds only the webhook and refund). The payment→fulfillment loop has no in-product trigger. (§5 Integrations)
  - **Dead UI targets:** `portal/workbook/page.tsx:52` "Open digital workbook" button has no `href`/`onClick`; `portal/page.tsx:237` join link uses `href="#"` when `joinUrl` is null; `portal/library/page.tsx:73` link uses `href="#"` when `fileKey` is null.

---

## 5. Gap Inventory

### A. Replit configuration
- **A1 — Blocker.** No `.replit` / `replit.nix` / deployment config (repo root). App cannot run on Replit unconfigured. See §3.1.
- **A2 — Medium.** `scripts/dev-setup.sh`, `scripts/session-start.sh` hardcode this sandbox (`/root/.ccr/ca-bundle.crt`, `pg_ctlcluster 16`, manual Prisma engine curl). Non-portable to Replit; must be excluded from the run path.

### B. Environment & secrets
- **B1 — High.** Required runtime secrets unprovisioned for Replit (`DATABASE_URL`, `AUTH_SECRET`, Stripe/SendGrid/ThriveCart). See §3.2.
- **B2 — Medium.** `.env.example` omits env vars the code actually reads: `AUTH_OKTA_ID/SECRET/ISSUER` (`auth.ts:18-19,25-28`) are listed but `NODE_EXTRA_CA_CERTS`/`PRISMA_*` (written by `dev-setup.sh`) are undocumented; conversely no harm but inconsistent. Reconcile `.env.example` with actual reads.
- **B3 — Low.** Default sender `tri.nguyen@thewisdomtri.com` hardcoded as fallback in `email.ts:4` and `.env.example:23`; ensure it is a SendGrid-verified sender or mail silently fails in prod.

### C. Database
- **C1 — Blocker.** No migration history (`prisma/` has only `schema.prisma` + `seed.ts`). Production relies on `prisma db push`, which gives no auditable schema versioning or safe rollouts. Generate an initial migration (`prisma migrate dev`) and deploy with `prisma migrate deploy`.
- **C2 — High.** Connection pooling not addressed for serverless/Autoscale. `lib/db.ts` caches a singleton only in non-production. On Replit Autoscale (multiple instances) this exhausts Postgres connections; use a pooled `DATABASE_URL` (PgBouncer/Neon pooled) or deploy as Reserved VM.
- **C3 — Medium.** Seed creates demo accounts with password `password123` and a `$0` private cohort (`seed.ts:15,195`). Must not run against production, or credentials become a backdoor.
- **C4 — Low.** No backup strategy documented. Decide on managed Postgres backups before launch.

### D. Authentication & authorization
- **D1 — High.** No rate limiting / lockout on credential login (`auth.ts:34-54`, `auth-actions.ts`). Brute-force exposed.
- **D2 — Medium.** `markWeekCompleteAction` (`progress-actions.ts:8-41`) lets a **participant mark their own weeks complete**, which auto-issues a completion **Certificate** (line 35-36). A participant can self-complete all 24 weeks instantly and mint a certificate. Confirm this is intended self-pacing vs. trainer-gated. (See Clarifying Q.)
- **D3 — Medium.** `getParticipantContext` includes `PENDING` enrollments (`portal-data.ts:7`), so an unpaid enrollee who can authenticate sees full portal content before payment clears.
- **D4 — Low.** Middleware (`middleware.ts:16-18`) only checks for the *presence* of a session cookie, not validity (documented as intentional; real checks happen in layouts via `requireRole`). Acceptable, but an expired/forged cookie passes the edge gate and is caught only at the layout. Keep the layout guards authoritative.

### E. Security
- **E1 — Blocker.** **Stripe webhook signature bypass.** `api/webhooks/stripe/route.ts:22` falls back to `JSON.parse(body)` when `STRIPE_WEBHOOK_SECRET` or the signature is missing — an unauthenticated POST of `{type:"checkout.session.completed", data:{object:{metadata:{enrollmentId}}}}` fulfills an enrollment (marks paid, ships workbook). Must hard-require the secret in production and reject unsigned requests.
- **E2 — Blocker.** **ThriveCart webhook secret bypass.** `api/webhooks/thrivecart/route.ts:24` only verifies when `data["thrivecart_secret"]` is present (`secret && data["thrivecart_secret"] && …`). Omitting the field skips the check entirely → unauthenticated fulfillment by `enrollmentId` or buyer email. Require the secret unconditionally.
- **E3 — High.** No rate limiting on public unauthenticated server actions: `submitAssessment` (`assessment-actions.ts:18`) and `createEnrollment` (`enrollment-actions.ts:36`) create DB rows (users, seats, payments, consent) with no throttle/captcha → spam/resource-exhaustion and junk user/seat creation.
- **E4 — Medium.** Demo credentials printed in the UI: `login/page.tsx:49` shows real demo emails; README documents `password123`. Remove from production build.
- **E5 — Low.** No security headers / CSP configured in `next.config.ts`. Consider a baseline CSP and `Strict-Transport-Security` for prod. (Next/Server Actions provide same-origin protection by default.)
- **E6 — Low.** `audit()` records `ip` but no caller passes it (`audit.ts`); audit logs will lack source IP. Optional hardening.

### F. Integrations (payments / email)
- **F1 — Blocker (revenue).** No charge initiation exists. `createEnrollment` records a `PENDING` payment but never creates a Stripe Checkout Session / Payment Link / Payment Intent with `metadata.enrollmentId`. The confirmation page (`enroll/confirmation/page.tsx:31`) says "We'll email you to confirm payment," implying an out-of-band/manual ThriveCart flow — but that integration is not wired or documented. As-is, no automated path moves a payment from `PENDING` → `PAID`. Confirm intended mechanism (hosted ThriveCart cart? Stripe Payment Link? admin manual?).
- **F2 — High.** `fulfillEnrollment` side effects are not idempotent. DB writes are guarded, but the **welcome email** (`fulfillment.ts:94`) and **notification** (`fulfillment.ts:103`) fire on *every* call. Stripe/ThriveCart retries or duplicate events → duplicate emails/notifications. Gate on a state transition (e.g., only on `PENDING→ACTIVE`) or persist processed event IDs.
- **F3 — Medium.** No test/live key separation or guardrail. `stripe.ts:10` instantiates from whatever `STRIPE_SECRET_KEY` is present; nothing prevents a test key in prod or vice-versa.
- **F4 — Medium.** SendGrid silently no-ops when `SENDGRID_API_KEY` is absent (`email.ts:26-29`) — in production this means welcome/broadcast emails vanish into logs with no alert. Add a startup check or health signal.
- **F5 — Low.** Refund path only calls Stripe when `externalId` starts with `pi_` (`billing-actions.ts:29`); ThriveCart/manual refunds are recorded locally but not executed upstream. Confirm acceptable.

### G. Error handling & logging
- **G1 — High.** No error/loading boundaries: no `error.tsx`, `global-error.tsx`, `loading.tsx`, or `not-found.tsx` anywhere in `src/app`. Any thrown server-component error (e.g., DB unreachable) renders Next's default error with no recovery UI; data fetches show no skeletons.
- **G2 — Medium.** Webhook handlers return `500` with raw error messages (`stripe/route.ts:55`, `thrivecart/route.ts:58`) — leaks internal error text to callers. Log server-side, return generic.
- **G3 — Low.** No structured logging/observability (only `console.*`). Fine for MVP; note for ops.

### H. Frontend completeness
- **H1 — Medium.** Dead button: `portal/workbook/page.tsx:52` "Open digital workbook" has no handler/href.
- **H2 — Medium.** `href="#"` fallbacks: join-session link `portal/page.tsx:237` (when `joinUrl` null) and library link `portal/library/page.tsx:73` (when `fileKey` null) — render as clickable no-ops. Hide/disable when target is absent.
- **H3 — Low.** "Coming soon" placeholder shown to participants when a pillar has no library resources (`portal/library/page.tsx:58`).
- **H4 — Low.** `book-a-call/page.tsx` is a marketing stub — no scheduler/embed/form; CTAs only loop back to `/assessment` and `/`. Confirm whether a real booking integration is expected.
- **H5 — Low.** `chat-view.tsx` lacks some a11y affordances (no `aria-label` on send, no `role="status"` on the message log); forms elsewhere use proper `<Label htmlFor>`.

### I. Performance
- **I1 — Medium.** `fulfillEnrollment` seeds module progress with a loop of 24 sequential `create`s inside the transaction (`fulfillment.ts:77-86`) — should be a single `createMany`. Low volume, but N round-trips per fulfillment.
- **I2 — Low.** List pages cap at `take: 100` (e.g., `admin/billing/page.tsx:23`, participants) with no pagination UI — acceptable now, will silently truncate at scale.
- **I3 — Low.** Schema indexing is generally good (FKs + lookup fields indexed); `Payment.externalId` is indexed (used by `charge.refunded` updateMany). No obvious N+1 in the data-access modules (Prisma `include` used).

### J. Testing
- **J1 — High.** Zero automated tests (no `*.test.*`/`*.spec.*`, no runner). Critical untested paths: webhook signature handling, fulfillment idempotency, RBAC/tenant scoping, coupon math, enrollment capacity/waitlist.

### K. Build & deploy
- **K1 — High.** `npm run lint` → `next lint`, but ESLint is **not installed/configured** (no `eslint` dep, no `.eslintrc`/`eslint.config.*`). Lint step will prompt/fail in CI. Either add ESLint config + dep or remove the script.
- **K2 — Medium.** Build not verified in this audit (`node_modules` absent). Run `npm install && npm run typecheck && npm run build` before import; `tsconfig` is `strict`, so latent type errors would surface at build.
- **K3 — Low.** No CI (`.github` absent) and no Dockerfile. Optional for Replit but recommended for repeatable deploys.

---

## 6. Remediation Plan (ordered; blockers first)

> Effort: **S** ≈ <½ day · **M** ≈ ½–2 days · **L** ≈ >2 days.

**Phase 0 — Make it deployable on Replit (do before import)**
1. **A1 — Create `.replit` + `replit.nix`.** (S) Files: new `.replit`, `replit.nix`. Use §3.1 templates; choose Reserved VM. *Accept:* repo imports and `Run` starts `next start` on `0.0.0.0:$PORT`.
2. **B1/B2 — Provision Secrets + fix `.env.example`.** (S) Add all §3.2 secrets to Replit; reconcile `.env.example` with actual `process.env` reads. *Accept:* app boots with no "missing env" runtime errors; `.env.example` lists exactly what code reads.
3. **C1 — Introduce migrations.** (M) Run `prisma migrate dev --name init` locally against a real Postgres; commit `prisma/migrations/`; deploy via `prisma migrate deploy`. *Accept:* fresh DB provisioned purely from migrations; `db push` removed from the prod path.
4. **C2 — Pooled DB / Reserved VM.** (S) Use a pooled `DATABASE_URL` or pin Reserved VM. *Accept:* sustained load doesn't exhaust connections.

**Phase 1 — Security blockers**
5. **E1 — Hard-require Stripe signature.** (S) `api/webhooks/stripe/route.ts`: if `!secret || !sig` → `400`; never `JSON.parse` fallback in prod. *Accept:* unsigned POST is rejected; signed events fulfill.
6. **E2 — Require ThriveCart secret unconditionally.** (S) `api/webhooks/thrivecart/route.ts:24`: when `secret` is set, reject if `data["thrivecart_secret"] !== secret` (don't gate on field presence). *Accept:* missing/mismatched secret → `401`.
7. **F1 — Implement (or document) charge initiation.** (M/L) Decide mechanism (Stripe Checkout Session / Payment Link with `metadata.enrollmentId`, or wired ThriveCart cart). Add the producer so `PENDING → PAID` actually happens; update `enroll/confirmation` copy accordingly. *Accept:* a real purchase drives a webhook that fulfills the enrollment end-to-end. **Blocked on Clarifying Q1.**

**Phase 2 — Correctness & robustness**
8. **F2 — Idempotent fulfillment.** (S) Only send welcome email + notification on the `PENDING→ACTIVE` transition (check prior status), or record processed event IDs. *Accept:* replaying a webhook sends no duplicate email.
9. **D1/E3 — Rate limit public/auth entry points.** (M) Add throttling (IP-based) to login, `submitAssessment`, `createEnrollment`. *Accept:* burst requests are limited; brute-force is slowed.
10. **G1 — Add error/loading/not-found boundaries.** (M) Add `app/error.tsx`, `app/global-error.tsx`, segment `loading.tsx`/`not-found.tsx`. *Accept:* DB-down renders a friendly error; navigation shows loading states.
11. **D2/D3 — Gate completion & PENDING access.** (S) Confirm intent (Q2); if trainer-gated, restrict `markWeekCompleteAction` to staff and/or exclude `PENDING` from portal content. *Accept:* matches intended policy.

**Phase 3 — Hygiene & launch readiness**
12. **K1 — Fix lint.** (S) Add `eslint` + `eslint-config-next` + config, or drop the `lint` script. *Accept:* `npm run lint` runs clean.
13. **K2 — Verify build/typecheck.** (S) `npm install && npm run typecheck && npm run build` green on Replit. *Accept:* clean prod build.
14. **C3/E4 — De-risk demo data/creds.** (S) Don't seed prod (or rotate to strong passwords); remove demo creds from `login/page.tsx:49`. *Accept:* no known-password accounts in prod.
15. **H1/H2/H3 — Fix dead UI.** (S) Wire or remove the workbook button; hide `#` links when target absent; replace "Coming soon" with a real empty state. *Accept:* no clickable no-ops.
16. **F4 — Email health check.** (S) Warn/health-signal when `SENDGRID_API_KEY` missing in prod. *Accept:* prod surfaces missing-key instead of silent drop.
17. **I1 — `createMany` for module progress.** (S) *Accept:* one insert instead of 24.
18. **J1 — Seed critical-path tests.** (M/L) Webhook auth, fulfillment idempotency, RBAC/scope, coupon math. *Accept:* CI runs a meaningful smoke suite.
19. **A2 — Quarantine sandbox scripts.** (S) Ensure `scripts/*.sh` aren't in the Replit run path. *Accept:* deploy doesn't invoke them.

---

## 7. Clarifying Questions

1. **Payment trigger (blocks F1).** What is the intended way a participant actually pays? Options seen: (a) a hosted **ThriveCart** cart configured outside the repo that posts to the webhook; (b) a Stripe **Checkout Session / Payment Link** that should be generated by the app (not implemented); (c) **admin-manual** marking. The confirmation page says "we'll email you to confirm payment." Which is canonical, and should the app generate the checkout link?
2. **Self-serve week completion (D2).** Is a participant marking their own week complete — and thereby auto-minting a certificate — intended (self-paced), or should completion be trainer/attendance-gated?
3. **PENDING portal access (D3).** Should an enrollee see portal content before payment clears, or should access wait for `ACTIVE`?
4. **`book-a-call` (H4).** Is a real scheduler (Calendly/Google) expected here, or is the marketing stub intentional for launch?
5. **Seeding prod (C3).** Should any seed data exist in production, or start empty? If demo data is wanted, what credentials policy?
6. **Deployment type (C2/A1).** Reserved VM (recommended for the Prisma singleton + webhooks) or Autoscale? This determines the pooling requirement.
7. **Okta SSO.** Is corporate OIDC in scope for first launch, or remain dormant (env-gated) for now?

---

## 8. Recommended Next Step

**Before importing, get an answer to Clarifying Q1 (the payment trigger) and Q6 (Reserved VM vs Autoscale)** — both shape the deploy config and the single biggest functional gap. In parallel, the safe first mechanical action is to **author `.replit` + `replit.nix`, create the initial Prisma migration, and stage the Replit Secrets** (Phase 0, items 1–4). That makes the repo importable and runnable, after which the security-blocker fixes (Stripe/ThriveCart webhook verification) should land before any real traffic.
