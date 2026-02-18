#!/usr/bin/env bash
set -euo pipefail

check() {
  local name="$1"; shift
  local url="$1"; shift

  echo -n "Checking ${name} (${url}/health)... "
  for i in $(seq 1 30); do
    if curl -sf "${url}/health" >/dev/null 2>&1; then
      echo "OK"
      return 0
    fi
    sleep 2
  done
  echo "FAILED"
  return 1
}

check "FHIR" "${FHIR_URL:-http://localhost:3101}"
check "Payment" "${PAYMENT_URL:-http://localhost:4100}"
check "Audit" "${AUDIT_URL:-http://localhost:5100}"

# Optional
if [ -n "${OID_URL:-}" ]; then check "OID" "$OID_URL"; fi
if [ -n "${DID_URL:-}" ]; then check "DID" "$DID_URL"; fi
if [ -n "${SBS_URL:-}" ]; then check "SBS" "$SBS_URL"; fi
if [ -n "${BASMA_URL:-}" ]; then check "BASMA" "$BASMA_URL"; fi
