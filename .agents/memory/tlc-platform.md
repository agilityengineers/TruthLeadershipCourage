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
