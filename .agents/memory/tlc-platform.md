---
name: TLC Leadership Platform artifact
description: Durable quirks for the migrated TLC app and its workflow registration
---

# TLC Leadership Platform (artifacts/tlc-platform)

Next.js → Vite/React migration, lives at `artifacts/tlc-platform`, serves at preview path `/`.

**Workflow gets stripped by git operations.** After any rebase/abort/merge that moves HEAD, the
`artifacts/tlc-platform: web` workflow config can disappear (restart fails with
`RUN_COMMAND_NOT_FOUND`). Fix: re-register the artifact by copying
`.replit-artifact/artifact.toml` to a temp `.edit.toml` and calling `verifyAndReplaceArtifactToml`,
then `restart_workflow("artifacts/tlc-platform: web")`. This recreates the workflow.

**GitHub updates target the OLD pre-migration code.** `origin/main` sits at the pre-migration
baseline; its update commits (font/copy refresh, new `src/app/organizations/page.tsx`) are in the
old Next.js structure at repo root, NOT in `artifacts/tlc-platform`. Merging syncs git history but
those content changes must be PORTED into the migrated Vite app to actually appear in the preview.

**Porting old Next.js content into the Vite app — conventions.** When a PR's content was written
against the pre-migration `src/...` Next.js tree, port it by adapting: `next/image` → plain `<img>`
(drop `priority`); `next/link` → `wouter` `Link`; `export const metadata`/page `<title>` → edit
`artifacts/tlc-platform/index.html`; `next/font` → load fonts via the Google Fonts `<link>` in
`index.html` plus CSS tokens in `index.css` (Tailwind v4 `@theme`, e.g. `--app-font-display`,
`--app-font-eyebrow`). New routes go in `App.tsx` as `<Route>` + a file under `src/app/.../page.tsx`.
If a file was deleted by an earlier `git rm` during a merge, recover its post-PR content with
`git show <commit>:<oldpath>`. Cross-page nav anchors: on landing use bare `#hash` (scroll in place);
off-landing use `${import.meta.env.BASE_URL}#hash` so it routes home then scrolls (base-path safe).
**Why:** keeps the preview faithful to the PR while respecting Vite/wouter conventions and base path.

**The Drizzle backend is non-functional immediately after a merge — it needs manual bring-up.**
Merging the backend PR only lands code; the Postgres DB starts with ZERO tables and the running
api-server is a stale build. To make it work: (1) `pnpm install` (workspace deps like `drizzle-orm`
may be unlinked, causing `drizzle-kit` "please install required packages: 'drizzle-orm'"),
(2) `pnpm --filter @workspace/db run push-force` (non-interactive schema push to empty DB),
(3) `pnpm --filter @workspace/db run seed` (idempotent, seeds demo content with stable IDs),
(4) `restart_workflow("artifacts/api-server: API Server")` so it rebuilds with the current routes.
**Why:** without this the frontend gets 404s / empty data even though all backend code is present.
Each account signs in with its own scrypt password hash (no shared demo password); seeded demo accounts have a null hash and must set a password via the admin invite / set-password flow first. Sessions/consent/etc. persist as rows in Postgres.
