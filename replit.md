# TLC — Truth · Leadership · Courage

The Wisdom Tri's flagship six-month leadership program platform: a participant
portal, trainer workspace, admin console, and company-viewer dashboard, backed by
a persistent Postgres database through a typed REST API.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (binds `PORT`, default 8080)
- `pnpm --filter @workspace/tlc-platform run dev` — run the web app (Vite; proxies `/api` → API server)
- `pnpm --filter @workspace/db run push` — push the Drizzle schema to Postgres
- `pnpm --filter @workspace/db run seed` — seed demo content (idempotent; safe to re-run)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks (`@workspace/api-client-react`) and Zod schemas (`@workspace/api-zod`) from `lib/api-spec/openapi.yaml`
- `pnpm run typecheck` — full typecheck across all packages
- Required env: `DATABASE_URL` — Postgres connection string. For the Vite dev proxy set `API_PROXY_TARGET` (defaults to `http://localhost:8080`).

### Demo logins (shared password: `password123`)

- `admin@thewisdomtri.com` — ADMIN
- `tri@thewisdomtri.com` — TRAINER
- `jordan@acme.test` — PARTICIPANT
- `viewer@acme.test` — COMPANY_VIEWER

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Web: Vite + React 19 + wouter + @tanstack/react-query
- API: Express 5 (`artifacts/api-server`)
- DB: PostgreSQL + Drizzle ORM (`lib/db`)
- Validation: Zod, `drizzle-zod`
- API codegen: Orval (OpenAPI → react-query client + zod), from `lib/api-spec/openapi.yaml`
- Build: esbuild (API bundle), Vite (web)

## Where things live

- DB schema (source of truth): `lib/db/src/schema/*` — one Drizzle table per file (+ relations, drizzle-zod schemas, types).
- Seed: `lib/db/src/seed.ts` (ports the former in-memory demo store, same stable IDs).
- API contract (source of truth): `lib/api-spec/openapi.yaml`. Regenerate clients after editing.
- API server: `artifacts/api-server/src/routes/*` (one file per domain), `src/lib/*` (db, principal/auth, rbac, scope, services).
- Web app: `artifacts/tlc-platform/src` — pages under `app/*`, data fetched via generated hooks from `@workspace/api-client-react`.

## Architecture decisions

- **Session:** the server validates credentials, mints a `session` row, and returns a bearer token. The web app persists it in localStorage and attaches it to every API request; the server rebuilds the principal per request. Accounts created through the admin console carry a real scrypt password hash (`lib/password.ts`); seeded/legacy demo accounts have a null hash and continue to sign in with the shared demo password (`password123`). Only `status === "active"` accounts may log in.
- **User management:** admins (capability `user:manage`) manage all platform users at `/admin/users` — create (with an initial password or an emailed-style invite link), edit role/status/company, and delete. Guardrails: `SUPER_ADMIN` creation/edits are gated to super admins, an admin cannot change their own role/status, the last active admin cannot be demoted/deactivated/deleted, and users linked to real content (enrollments, messages, etc.) can't be hard-deleted (deactivate instead). Invite links are single-use `verification_token` rows; the public `/invite?token=…` page sets the password and activates the account.
- **RBAC + tenant scoping enforced server-side:** `lib/rbac.ts` capabilities + `lib/scope.ts` Drizzle `where` fragments (e.g. a company viewer can only read their own company's rows). The browser no longer holds the data.
- **Payments & email are simulated stubs:** they persist state (payment → PAID, campaign → sent) without external calls.
- **Reads return the same nested shapes** the old in-memory layer produced, so the UI was rewired with minimal churn (queries for reads, mutations + `invalidateQueries` for writes).

## Gotchas

- After changing `openapi.yaml`, run the codegen script before typechecking the web app.
- Dates cross the wire as ISO strings; `formatDate`/`daysUntil`/`derivePhase`/`currentWeek` already accept `Date | string`.
- On a fresh database run `push` then `seed` (wired into `scripts/post-merge.sh`).
