#!/usr/bin/env bash
# Reproducible local setup for the TLC platform.
# Handles the one environment quirk: this sandbox's egress proxy resets Prisma's
# engine-binary CDN, so we install with --ignore-scripts and fetch the engines
# for the detected target via curl, then generate the client.
set -euo pipefail
cd "$(dirname "$0")/.."

CA="${NODE_EXTRA_CA_CERTS:-/root/.ccr/ca-bundle.crt}"
CURL_CA=()
[ -f "$CA" ] && CURL_CA=(--cacert "$CA")

echo "==> Starting PostgreSQL"
if command -v pg_ctlcluster >/dev/null 2>&1; then
  pg_ctlcluster 16 main start 2>/dev/null || service postgresql start 2>/dev/null || true
fi
su - postgres -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname='tlc'\" | grep -q 1 || psql -c \"CREATE DATABASE tlc;\"" 2>/dev/null || true
su - postgres -c "psql -c \"ALTER USER postgres PASSWORD 'postgres';\"" 2>/dev/null || true

echo "==> Installing dependencies (scripts deferred)"
npm install --no-audit --no-fund --ignore-scripts

echo "==> Fetching Prisma engines for this platform"
HASH=$(grep -oE "[0-9a-f]{40}" node_modules/@prisma/engines-version/index.js | head -1)
TGT=debian-openssl-3.0.x
BASE="https://binaries.prisma.sh/all_commits/${HASH}/${TGT}"
DEST=node_modules/@prisma/engines
mkdir -p "$DEST"
if [ ! -f "$DEST/libquery_engine-${TGT}.so.node" ]; then
  curl -fsSL "${CURL_CA[@]}" "$BASE/libquery_engine.so.node.gz" -o /tmp/qe.gz && gunzip -f /tmp/qe.gz && mv /tmp/qe "$DEST/libquery_engine-${TGT}.so.node"
fi
if [ ! -f "$DEST/schema-engine-${TGT}" ]; then
  curl -fsSL "${CURL_CA[@]}" "$BASE/schema-engine.gz" -o /tmp/se.gz && gunzip -f /tmp/se.gz && mv /tmp/se "$DEST/schema-engine-${TGT}" && chmod +x "$DEST/schema-engine-${TGT}"
fi

echo "==> Writing .env (if missing)"
if [ ! -f .env ]; then
  cat > .env <<ENV
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tlc?schema=public"
AUTH_SECRET="$(openssl rand -base64 32 2>/dev/null || echo dev-secret-change-me)"
AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
SENDGRID_FROM_EMAIL="tri.nguyen@thewisdomtri.com"
SENDGRID_FROM_NAME="The Wisdom Tri"
NODE_EXTRA_CA_CERTS="$CA"
PRISMA_QUERY_ENGINE_LIBRARY="$PWD/node_modules/@prisma/engines/libquery_engine-${TGT}.so.node"
PRISMA_SCHEMA_ENGINE_BINARY="$PWD/node_modules/@prisma/engines/schema-engine-${TGT}"
ENV
fi

set -a; . ./.env; set +a
echo "==> Generating Prisma client + pushing schema + seeding"
npx prisma generate
cp -n "$DEST/libquery_engine-${TGT}.so.node" node_modules/.prisma/client/ 2>/dev/null || true
npx prisma db push --skip-generate
npx tsx prisma/seed.ts

echo "==> Done. Run: npm run dev"
