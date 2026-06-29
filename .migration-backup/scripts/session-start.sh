#!/usr/bin/env bash
# Fast, idempotent session warm-up for Claude Code web sessions:
# bring Postgres up and ensure the Prisma engines/client exist. Heavy work
# (npm install, seed) lives in dev-setup.sh — run that on a fresh clone.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 0

pg_ctlcluster 16 main start 2>/dev/null || service postgresql start 2>/dev/null || true

# Fetch Prisma engines only if missing (the proxy resets Prisma's own downloader).
if [ -d node_modules/@prisma/engines-version ] && [ ! -f node_modules/@prisma/engines/libquery_engine-debian-openssl-3.0.x.so.node ]; then
  CA="${NODE_EXTRA_CA_CERTS:-/root/.ccr/ca-bundle.crt}"
  HASH=$(grep -oE "[0-9a-f]{40}" node_modules/@prisma/engines-version/index.js | head -1)
  BASE="https://binaries.prisma.sh/all_commits/${HASH}/debian-openssl-3.0.x"
  mkdir -p node_modules/@prisma/engines
  curl -fsSL --cacert "$CA" "$BASE/libquery_engine.so.node.gz" -o /tmp/qe.gz 2>/dev/null && gunzip -f /tmp/qe.gz && mv /tmp/qe node_modules/@prisma/engines/libquery_engine-debian-openssl-3.0.x.so.node
  curl -fsSL --cacert "$CA" "$BASE/schema-engine.gz" -o /tmp/se.gz 2>/dev/null && gunzip -f /tmp/se.gz && mv /tmp/se node_modules/@prisma/engines/schema-engine-debian-openssl-3.0.x && chmod +x node_modules/@prisma/engines/schema-engine-debian-openssl-3.0.x
fi

exit 0
