#!/usr/bin/env bash
set -euo pipefail

# Starts local integration dependencies for the Healthcare UI:
# - OID Registry (docker)
# - DID Registry (docker)
# - SBS Worker (wrangler dev)
# - BASMA Voice Worker (wrangler dev)
#
# Requirements:
# - Docker Desktop running
# - Node 20 (recommended): nvm use 20
# - Wrangler installed in workspaces (npm i already done)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Starting OID/DID registries (Docker Compose)"
cd "$ROOT_DIR"

docker compose up -d postgres redis oid-registry did-registry

echo "==> Starting SBS worker (wrangler dev) on :8787"
(cd apps/workers/sbs && npm run dev -- --port 8787) &
SBS_PID=$!

echo "==> Starting BASMA voice worker (wrangler dev) on :8788"
(cd apps/workers/voice && npm run dev -- --port 8788) &
BASMA_PID=$!

echo "\nPIDs: SBS=$SBS_PID  BASMA=$BASMA_PID"
echo "\nSet these env vars for the frontend (apps/healthcare/.env.local):"
echo "  VITE_SBS_URL=http://localhost:8787"
echo "  VITE_BASMA_URL=http://localhost:8788"
echo "  VITE_OID_URL=http://localhost:3201"
echo "  VITE_DID_URL=http://localhost:3202"

echo "\nHealth checks:"
echo "  curl http://localhost:3201/health"
echo "  curl http://localhost:3202/health"
echo "  curl http://localhost:8787/health"
echo "  curl http://localhost:8788/health"

echo "\nPress Ctrl+C to stop wrangler workers (docker containers will keep running)."
wait $SBS_PID $BASMA_PID
