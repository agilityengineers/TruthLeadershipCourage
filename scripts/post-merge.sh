#!/bin/bash
set -e
pnpm install --frozen-lockfile
# Push the Drizzle schema and (idempotently) seed the demo content so a fresh
# database has the four demo logins and sample cohorts/enrollments.
pnpm --filter @workspace/db push
pnpm --filter @workspace/db seed
# Idempotently roll changed section defaults (removed nav link, repointed About
# Tri buttons, dropped Stripe line) onto already-seeded rows — skips any section
# an admin has customized. Safe to run every deploy.
pnpm --filter @workspace/db run backfill-content
