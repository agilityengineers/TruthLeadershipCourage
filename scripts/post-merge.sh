#!/bin/bash
set -e
pnpm install --frozen-lockfile
# Push the Drizzle schema and (idempotently) seed the demo content so a fresh
# database has the four demo logins and sample cohorts/enrollments.
pnpm --filter @workspace/db push
pnpm --filter @workspace/db seed
