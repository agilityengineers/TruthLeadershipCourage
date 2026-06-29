# TLC Leadership Platform — The Wisdom Tri

A multi-tenant leadership-development portal for **The Wisdom Tri**. It carries a
leader from a public sales page → a diagnostic assessment → enrollment → a
participant portal that serves them **before, during, and after** a six-month
cohort, with operational dashboards for **trainers** and **admins**, a four-tier
access hierarchy, and a full communications layer.

Built as a **series**: one reusable `Program` (TLC) with many `Cohort`s. Every
date, price, session, seat, and trainer is data on a cohort — admins launch the
next cohort by **cloning**, never a code change.

> The original design handoff lives in [`docs/DESIGN_HANDOFF.md`](docs/DESIGN_HANDOFF.md)
> and the visual prototype in [`docs/TLC Platform.dc.html`](docs/TLC%20Platform.dc.html).

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| UI | Tailwind CSS 3 + shadcn-style primitives, design tokens from the handoff |
| Fonts | Newsreader (display) · Public Sans (UI) via `next/font` |
| Auth | Auth.js (NextAuth v5), credentials + JWT; env-gated OIDC SSO |
| DB / ORM | PostgreSQL + Prisma |
| Payments | Stripe + ThriveCart webhooks (backend only — no card UI in product) |
| Email | SendGrid (transactional + segmented broadcast) |
| Calendar | `.ics` export + Google Calendar links |

## Quick start

```bash
bash scripts/dev-setup.sh   # starts Postgres, installs deps, fetches Prisma
                            # engines, generates client, pushes schema, seeds
npm run dev                 # http://localhost:3000
```

Manual setup: copy `.env.example` → `.env`, set `DATABASE_URL` + `AUTH_SECRET`,
then `npm install && npx prisma db push && npm run db:seed && npm run dev`.

### Demo logins (password `password123`)

| Role | Email | Lands on |
|---|---|---|
| Admin (Tier 4) | `admin@thewisdomtri.com` | `/admin` |
| Trainer (Tier 4) | `tri@thewisdomtri.com` | `/trainer` |
| Participant (Tier 2) | `jordan@acme.test` | `/portal` |
| Company Viewer (Tier 3) | `viewer@acme.test` | `/company` |

## Surfaces

- **`/`** — public StoryBrand/Hero's-Journey sales page. Single CTA: *Start the Assessment*.
- **`/assessment`** — diagnostic quiz (DB-backed, admin-managed). Mirrors low scores back as TLC benefits.
- **`/enroll`** — cohort/seat select, shipping capture, backend-applied coupons, waitlist.
- **`/portal`** — participant portal. Before / During / After derived from cohort dates (`?phase=` to preview). Materials, progress, workbook + shipment tracker, library, coaching (+reschedule, .ics), messages, account/privacy.
- **`/trainer`** — cohort overview KPIs, participants & progress, resource manager, events, messages.
- **`/admin`** — companies, cohorts (+clone), participants, trainers, **assessment builder**, resources & events, analytics, communications (SendGrid), billing reconciliation (+refunds).
- **`/company`** — Tier-3 read-only company-viewer dashboard.

## Architecture notes

- **Tenancy & RBAC** — `src/lib/rbac.ts` (capability matrix) + `src/lib/scope.ts`
  (Prisma `where` fragments per principal). Every list query is tenant-scoped;
  `src/lib/session.ts` gates routes by role/capability.
- **Series model** — `src/server/admin-actions.ts#cloneCohort` copies a cohort's
  config + events (date-shifted) into the next dated instance.
- **Payments are backend-only** — `src/server/fulfillment.ts` is the
  processor-agnostic path (paid → activate seat → ship workbook → welcome email →
  wire chat). Stripe and ThriveCart webhooks both call it. No card UI anywhere in
  the product.
- **Assessment** — `Question` rows scoped to the program's `Assessment`. The
  admin builder writes the same table the live `/assessment` reads
  (`revalidatePath` keeps it instant).
- **Governance** — `ConsentRecord` + `AuditLog`; GDPR export at `/api/me/export`,
  consent + erasure in `/portal/settings`. UI built on accessible Radix
  primitives (WCAG-minded focus/contrast/semantics).

## Scripts

```bash
npm run dev          # dev server
npm run build        # prisma generate + next build
npm run db:seed      # seed demo data
npm run typecheck    # tsc --noEmit
```

## Data model

See [`prisma/schema.prisma`](prisma/schema.prisma): Company · User · Role ·
Membership · Program · Cohort · Module · Event · Resource · Assessment ·
Question · AssessmentResponse · Enrollment · Seat · Payment · Coupon · Refund ·
Shipment · WaitlistEntry · ModuleProgress · CoachingBooking · Certificate ·
Thread · Message · EmailTemplate · EmailCampaign · Notification · ConsentRecord ·
AuditLog.
