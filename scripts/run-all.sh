#!/usr/bin/env bash
set -euo pipefail

BLUE='\033[0;34m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

MODE="${MODE:-local}"   # local | staging

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

banner() {
  echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║      MasterLinc - Deploy, Test & Record Suite              ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "Mode: ${YELLOW}${MODE}${NC}"
  echo ""
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo -e "${RED}Missing command:${NC} $1"; exit 1; }
}

ensure_frontend_env() {
  local env_file="apps/healthcare/.env.local"
  if [ ! -f "$env_file" ]; then
    echo "Creating $env_file from example..."
    cp apps/healthcare/.env.local.example "$env_file"
    # Use our local ports for registries
    perl -i -pe 's|VITE_OID_URL=.*|VITE_OID_URL=http://localhost:3201|g; s|VITE_DID_URL=.*|VITE_DID_URL=http://localhost:3202|g' "$env_file" 2>/dev/null || true
  fi
}

start_local_stack() {
  echo -e "${YELLOW}━━━ Step 1: Starting local Docker services (db + core + oid/did) ━━━${NC}"
  require_cmd docker
  docker compose up -d postgres redis fhir-server payment-gateway audit-logger oid-registry did-registry
  echo -e "${GREEN}✓ Docker services started${NC}\n"

  echo -e "${YELLOW}━━━ Step 2: Starting workers (SBS + BASMA) with Wrangler ━━━${NC}"
  if command -v wrangler >/dev/null 2>&1; then
    :
  fi

  # SBS
  (cd apps/workers/sbs && npm run dev -- --port 8787) &
  SBS_PID=$!

  # BASMA voice
  (cd apps/workers/voice && npm run dev -- --port 8788) &
  BASMA_PID=$!

  echo -e "${GREEN}✓ Workers started${NC} (SBS pid=$SBS_PID, BASMA pid=$BASMA_PID)\n"

  echo -e "${YELLOW}━━━ Step 3: Health checks ━━━${NC}"
  chmod +x scripts/health-checks.sh || true
  FHIR_URL=http://localhost:3101 PAYMENT_URL=http://localhost:4100 AUDIT_URL=http://localhost:5100 \
  OID_URL=http://localhost:3201 DID_URL=http://localhost:3202 \
  SBS_URL=http://localhost:8787 BASMA_URL=http://localhost:8788 \
  ./scripts/health-checks.sh

  echo -e "${YELLOW}━━━ Step 4: Start Healthcare UI (requires Node 20) ━━━${NC}"
  ensure_frontend_env
  echo "If you are on Node 24, run: ./scripts/use-node20.sh"

  (cd apps/healthcare && npm install --legacy-peer-deps && npm run dev -- --host 0.0.0.0 --port 5173) &
  UI_PID=$!

  echo -e "${GREEN}✓ UI started${NC} (pid=$UI_PID)"

  echo ""
  echo "Open: http://localhost:5173"
  echo "Backend URLs:"
  echo "  FHIR:   http://localhost:3101"
  echo "  Pay:   http://localhost:4100"
  echo "  Audit: http://localhost:5100"
  echo "  OID:   http://localhost:3201"
  echo "  DID:   http://localhost:3202"
  echo "  SBS:   http://localhost:8787"
  echo "  BASMA: http://localhost:8788"

  echo ""
  echo -e "${GREEN}All systems running.${NC} Press Ctrl+C to stop UI + workers (docker stays)."

  wait $SBS_PID $BASMA_PID $UI_PID
}

run_staging() {
  echo -e "${YELLOW}━━━ Staging: using deploy-staging.sh ━━━${NC}"
  ./scripts/deploy-staging.sh
}

banner

case "$MODE" in
  local) start_local_stack ;;
  staging) run_staging ;;
  *) echo "Unknown MODE=$MODE (use local|staging)"; exit 1 ;;
esac
