#!/bin/bash
# Claim Submission Workflow Test Script
# Tests complete claim processing through MASTERLINC agents and SBS services

set -e

echo "================================================================================"
echo "🏥 CLAIM SUBMISSION WORKFLOW TEST"
echo "================================================================================"
echo ""
echo "Test Date: $(date)"
echo "Purpose: End-to-end claim processing simulation"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Keep this script fast even when some services are down
CURL_CONNECT_TIMEOUT=${CURL_CONNECT_TIMEOUT:-1}
CURL_MAX_TIME=${CURL_MAX_TIME:-3}

# Test claim data
CLAIM_ID="CLM_$(date +%s)"
PATIENT_ID="PAT_12345"
PROVIDER_ID="PRV_67890"
SERVICE_CODE="99213"
AMOUNT="150.00"

# Agents run on 900x by default to avoid SBS ports 8000-8003.
AGENT_BASE_PORT=${MASTERLINC_BASE_PORT:-9000}
CLAIMLINC_BASE="http://localhost:$((AGENT_BASE_PORT + 1))"
POLICYLINC_BASE="http://localhost:$((AGENT_BASE_PORT + 3))"

# SBS uses facility_id in most endpoints
FACILITY_ID=${FACILITY_ID:-1}

# SBS financial rules engine expects item coding.system to match this value.
SBS_CODING_SYSTEM=${SBS_CODING_SYSTEM:-http://sbs.sa/coding/services}

echo "================================================================================"
echo "📋 TEST CLAIM DETAILS"
echo "================================================================================"
echo "Claim ID: $CLAIM_ID"
echo "Patient ID: $PATIENT_ID"
echo "Provider ID: $PROVIDER_ID"
echo "Service Code: $SERVICE_CODE"
echo "Amount: $AMOUNT SAR"
echo ""

# Function to check service health
check_service() {
    local name=$1
    local url=$2
  local response=$(curl -s --connect-timeout "$CURL_CONNECT_TIMEOUT" --max-time "$CURL_MAX_TIME" -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✓${NC} $name: Healthy (HTTP $response)"
        return 0
    elif [ "$response" = "404" ] || [ "$response" = "503" ]; then
        echo -e "${YELLOW}⚠${NC} $name: Responding but endpoint needs work (HTTP $response)"
        return 1
    else
        echo -e "${RED}✗${NC} $name: Not responding (HTTP $response)"
        return 2
    fi
}

# Function to make API call with error handling
api_call() {
    local method=$1
    local url=$2
    local data=$3
    local description=$4
    
    echo ""
    echo -e "${BLUE}→${NC} $description"
    echo "  URL: $url"
    echo "  Method: $method"
    
    if [ -n "$data" ]; then
        echo "  Payload: $data"
    fi
    
    local response=$(curl -s --connect-timeout "$CURL_CONNECT_TIMEOUT" --max-time "$CURL_MAX_TIME" -X "$method" \
        -H "Content-Type: application/json" \
        -d "$data" \
        -w "\n%{http_code}" \
        "$url" 2>&1)
    
    local http_code=$(echo "$response" | tail -n 1)
    local body=$(echo "$response" | head -n -1)

    # Export for callers that want to parse responses.
    API_CALL_HTTP_CODE="$http_code"
    API_CALL_BODY="$body"
    
    echo "  Response Code: $http_code"
    echo "  Response Body: ${body:0:200}..."
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✓${NC} Success"
        return 0
    else
        echo -e "${RED}✗${NC} Failed"
        return 1
    fi
}

echo "================================================================================"
echo "🔍 STEP 1: HEALTH CHECK - Verify All Services"
echo "================================================================================"
echo ""

# Check all services
check_service "Frontend" "http://localhost:5173" || true
check_service "MasterLinc API" "http://localhost:$((AGENT_BASE_PORT + 0))/health" || true
check_service "ClaimLinc API" "${CLAIMLINC_BASE}/health" || true
check_service "PolicyLinc API" "${POLICYLINC_BASE}/health" || true
check_service "SBS Normalizer" "http://localhost:8000/health" || true
check_service "SBS Signer" "http://localhost:8001/health" || true
check_service "SBS Financial Rules" "http://localhost:8002/health" || true
check_service "SBS NPHIES Bridge" "http://localhost:8003/health" || true

echo ""
echo "================================================================================"
echo "🚀 STEP 2: SUBMIT CLAIM - ClaimLinc Agent"
echo "================================================================================"

STEP2_OK=0
STEP3_OK=0
STEP4_OK=0
STEP5_OK=0
STEP6_OK=0
STEP7_OK=0
STEP8_OK=0

CLAIM_PAYLOAD=$(cat <<EOF
{
  "patient_id": "$PATIENT_ID",
  "provider_id": "$PROVIDER_ID",
  "service_code": "$SERVICE_CODE",
  "amount": $AMOUNT,
  "diagnosis_codes": [],
  "service_date": "$(date -I)",
  "notes": "workflow_test"
}
EOF
)

# Submit claim to ClaimLinc agent (capture claim_id when available)
echo ""
echo -e "${BLUE}→${NC} Submit claim to ClaimLinc"
echo "  URL: ${CLAIMLINC_BASE}/api/v1/claims/submit"
echo "  Method: POST"
echo "  Payload: $CLAIM_PAYLOAD"

SUBMIT_RESPONSE=$(curl -s -X "POST" \
  -H "Content-Type: application/json" \
  -d "$CLAIM_PAYLOAD" \
  -w "\n%{http_code}" \
  "${CLAIMLINC_BASE}/api/v1/claims/submit" 2>&1 || true)

SUBMIT_HTTP_CODE=$(echo "$SUBMIT_RESPONSE" | tail -n 1)
SUBMIT_BODY=$(echo "$SUBMIT_RESPONSE" | head -n -1)

echo "  Response Code: $SUBMIT_HTTP_CODE"
echo "  Response Body: ${SUBMIT_BODY:0:200}..."

if [ "$SUBMIT_HTTP_CODE" = "201" ] || [ "$SUBMIT_HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓${NC} Success"
  STEP2_OK=1
  if command -v jq >/dev/null 2>&1; then
    NEW_CLAIM_ID=$(echo "$SUBMIT_BODY" | jq -r '.claim_id // .claimId // empty' 2>/dev/null || true)
    if [ -n "$NEW_CLAIM_ID" ]; then
      CLAIM_ID="$NEW_CLAIM_ID"
      echo -e "${GREEN}✓${NC} Using claim_id from ClaimLinc: $CLAIM_ID"
    fi
  fi
else
  echo -e "${YELLOW}⚠${NC} ClaimLinc API not available, simulating workflow..."
fi

echo ""
echo "================================================================================"
echo "🔄 STEP 3: NORMALIZE CLAIM - SBS Normalizer Service"
echo "================================================================================"

NORMALIZE_PAYLOAD=$(cat <<EOF
{
  "facility_id": $FACILITY_ID,
  "internal_code": "$SERVICE_CODE",
  "description": "Office visit, established patient, level 3"
}
EOF
)

# Try to normalize claim codes
if api_call "POST" "http://localhost:8000/normalize" "$NORMALIZE_PAYLOAD" "Normalize claim codes (AI translation)"; then
  STEP3_OK=1
else
  echo -e "${YELLOW}⚠${NC} Normalizer returned an error (often missing mapping), using mock normalized code"
    NORMALIZED_CODE="CHI_99213_EQUIV"
fi

# If normalizer succeeded and jq is available, try extracting the mapped code
if [ -z "${NORMALIZED_CODE:-}" ] && command -v jq >/dev/null 2>&1; then
  NORMALIZED_CODE=$(curl -s --connect-timeout "$CURL_CONNECT_TIMEOUT" --max-time "$CURL_MAX_TIME" \
    -X POST -H "Content-Type: application/json" -d "$NORMALIZE_PAYLOAD" \
    "http://localhost:8000/normalize" | jq -r '.sbs_mapped_code // empty' 2>/dev/null || true)
fi

echo ""
echo "================================================================================"
echo "💰 STEP 4: APPLY FINANCIAL RULES - SBS Financial Rules Engine"
echo "================================================================================"

RULES_PAYLOAD=$(cat <<EOF
{
  "claim": {
    "resourceType": "Claim",
    "facility_id": $FACILITY_ID,
    "id": "$CLAIM_ID",
    "patient": {"reference": "Patient/$PATIENT_ID"},
    "provider": {"reference": "Practitioner/$PROVIDER_ID"},
    "item": [
      {
        "sequence": 1,
        "productOrService": {"coding": [{"system": "$SBS_CODING_SYSTEM", "code": "${NORMALIZED_CODE:-$SERVICE_CODE}"}]},
        "unitPrice": {"value": $AMOUNT, "currency": "SAR"},
        "quantity": {"value": 1}
      }
    ]
  }
}
EOF
)

# Try to apply financial rules
if api_call "POST" "http://localhost:8002/validate" "$RULES_PAYLOAD" "Apply CHI financial rules"; then
  STEP4_OK=1
else
  echo -e "${YELLOW}⚠${NC} Financial Rules returned an error (often missing facility config), assuming approval"
    APPROVED="true"
    APPROVED_AMOUNT="$AMOUNT"
fi

echo ""
echo "================================================================================"
echo "🔏 STEP 5: SIGN DOCUMENT - SBS Signer Service"
echo "================================================================================"

SIGN_PAYLOAD=$(cat <<EOF
{
  "payload": {
    "resourceType": "Claim",
    "facility_id": $FACILITY_ID,
    "id": "$CLAIM_ID",
    "patient": {"reference": "Patient/$PATIENT_ID"},
    "provider": {"reference": "Practitioner/$PROVIDER_ID"},
    "item": [
      {
        "sequence": 1,
        "productOrService": {"coding": [{"system": "$SBS_CODING_SYSTEM", "code": "${NORMALIZED_CODE:-$SERVICE_CODE}"}]},
        "unitPrice": {"value": $AMOUNT, "currency": "SAR"},
        "quantity": {"value": 1}
      }
    ]
  },
  "facility_id": $FACILITY_ID
}
EOF
)

# Try to sign document
if api_call "POST" "http://localhost:8001/sign" "$SIGN_PAYLOAD" "Sign claim document digitally"; then
  STEP5_OK=1
  if command -v jq >/dev/null 2>&1; then
    SIGNATURE=$(echo "$API_CALL_BODY" | jq -r '.signature // empty' 2>/dev/null || true)
  fi
  if [ -z "${SIGNATURE:-}" ]; then
    echo -e "${YELLOW}⚠${NC} Signer succeeded but signature could not be parsed, using mock signature"
    SIGNATURE="MOCK_SIG_$(date +%s | sha256sum | head -c 32)"
  fi
else
  echo -e "${YELLOW}⚠${NC} Signer error (often certificate/DB config), generating mock signature"
  SIGNATURE="MOCK_SIG_$(date +%s | sha256sum | head -c 32)"
fi

echo ""
echo "================================================================================"
echo "🏥 STEP 6: SUBMIT TO NPHIES - SBS NPHIES Bridge"
echo "================================================================================"

NPHIES_PAYLOAD=$(cat <<EOF
{
  "facility_id": $FACILITY_ID,
  "fhir_payload": {
    "resourceType": "Claim",
    "facility_id": $FACILITY_ID,
    "id": "$CLAIM_ID",
    "patient": {"reference": "Patient/$PATIENT_ID"},
    "provider": {"reference": "Practitioner/$PROVIDER_ID"},
    "item": [
      {
        "sequence": 1,
        "productOrService": {"coding": [{"system": "$SBS_CODING_SYSTEM", "code": "${NORMALIZED_CODE:-$SERVICE_CODE}"}]},
        "unitPrice": {"value": $AMOUNT, "currency": "SAR"},
        "quantity": {"value": 1}
      }
    ]
  },
  "signature": "${SIGNATURE:-MOCK_SIGNATURE}",
  "resource_type": "Claim"
}
EOF
)

# Try to submit to NPHIES
OLD_CURL_MAX_TIME="$CURL_MAX_TIME"
CURL_MAX_TIME=${CURL_MAX_TIME_NPHIES:-12}
if api_call "POST" "http://localhost:8003/submit-claim" "$NPHIES_PAYLOAD" "Submit to NPHIES healthcare platform"; then
  STEP6_OK=1
  if command -v jq >/dev/null 2>&1; then
    NPHIES_STATUS=$(echo "$API_CALL_BODY" | jq -r '.status // empty' 2>/dev/null || true)
    if [ "$NPHIES_STATUS" = "error" ]; then
      STEP6_OK=0
      echo -e "${YELLOW}⚠${NC} NPHIES bridge responded but reported status=error (likely API key/network)"
    fi
  fi
else
    echo -e "${YELLOW}⚠${NC} NPHIES Bridge not ready, workflow completed locally"
fi
CURL_MAX_TIME="$OLD_CURL_MAX_TIME"

echo ""
echo "================================================================================"
echo "📊 STEP 7: CHECK CLAIM STATUS - ClaimLinc Agent"
echo "================================================================================"

# Try to check claim status
if api_call "GET" "${CLAIMLINC_BASE}/api/v1/claims/$CLAIM_ID" "" "Check claim detail/status"; then
  STEP7_OK=1
else
    echo -e "${YELLOW}⚠${NC} Status endpoint not available"
fi

echo ""
echo "================================================================================"
echo "🔍 STEP 8: VALIDATE POLICY - PolicyLinc Agent"
echo "================================================================================"

POLICY_PAYLOAD=$(cat <<EOF
{
  "policy_number": "POL-${PATIENT_ID}",
  "patient_id": "$PATIENT_ID",
  "service_code": "$SERVICE_CODE",
  "amount": $AMOUNT,
  "service_date": "$(date -I)"
}
EOF
)

# Try to validate policy
if api_call "POST" "${POLICYLINC_BASE}/api/v1/policies/validate" "$POLICY_PAYLOAD" "Validate patient policy coverage"; then
  STEP8_OK=1
else
    echo -e "${YELLOW}⚠${NC} PolicyLinc not available"
fi

echo ""
echo "================================================================================"
echo "📈 WORKFLOW MONITORING - Check Service Logs"
echo "================================================================================"

echo ""
echo "SBS Services Container Status:"
cd /workspaces/sbs && docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Cannot access SBS containers"

echo ""
echo "================================================================================"
echo "📋 WORKFLOW SUMMARY"
echo "================================================================================"
echo ""
echo "Claim ID: $CLAIM_ID"
echo "Submission Time: $(date)"
echo ""
echo "Workflow Steps:"
echo "  1. ✓ Health Check - Services verified"
if [ "$STEP2_OK" = "1" ]; then echo "  2. ✓ Claim Submission - Completed (ClaimLinc)"; else echo "  2. ⚠ Claim Submission - Failed (ClaimLinc)"; fi
if [ "$STEP3_OK" = "1" ]; then echo "  3. ✓ Code Normalization - Completed (SBS Normalizer)"; else echo "  3. ⚠ Code Normalization - Failed (SBS Normalizer)"; fi
if [ "$STEP4_OK" = "1" ]; then echo "  4. ✓ Financial Rules - Completed (SBS Financial Rules)"; else echo "  4. ⚠ Financial Rules - Failed (SBS Financial Rules)"; fi
if [ "$STEP5_OK" = "1" ]; then echo "  5. ✓ Document Signing - Completed (SBS Signer)"; else echo "  5. ⚠ Document Signing - Failed (SBS Signer)"; fi
if [ "$STEP6_OK" = "1" ]; then echo "  6. ✓ NPHIES Submission - Completed (SBS NPHIES Bridge)"; else echo "  6. ⚠ NPHIES Submission - Reported error (SBS NPHIES Bridge)"; fi
if [ "$STEP7_OK" = "1" ]; then echo "  7. ✓ Status Check - Completed (ClaimLinc)"; else echo "  7. ⚠ Status Check - Failed (ClaimLinc)"; fi
if [ "$STEP8_OK" = "1" ]; then echo "  8. ✓ Policy Validation - Completed (PolicyLinc)"; else echo "  8. ⚠ Policy Validation - Failed (PolicyLinc)"; fi
echo ""
echo "================================================================================"
echo "🎯 ISSUES DETECTED"
echo "================================================================================"
echo ""
ISSUES=0
if [ "$STEP2_OK" != "1" ] || [ "$STEP7_OK" != "1" ]; then
  ISSUES=1
  echo "- ClaimLinc not fully reachable on port $((AGENT_BASE_PORT + 1))"
fi
if [ "$STEP8_OK" != "1" ]; then
  ISSUES=1
  echo "- PolicyLinc not reachable on port $((AGENT_BASE_PORT + 3))"
fi
if [ "$STEP3_OK" != "1" ]; then
  ISSUES=1
  echo "- SBS normalizer failed (check SBS DB mappings/facility)"
fi
if [ "$STEP4_OK" != "1" ]; then
  ISSUES=1
  echo "- SBS financial rules failed (check facility tier/pricing rules)"
fi
if [ "$STEP5_OK" != "1" ]; then
  ISSUES=1
  echo "- SBS signer failed (check facility certificates/DB connectivity)"
fi
if [ "$STEP6_OK" != "1" ]; then
  ISSUES=1
  echo "- NPHIES submission failed or returned status=error (check NPHIES API key/network/base URL)"
fi
if [ "$ISSUES" = "0" ]; then
  echo "None detected (local workflow succeeded)."
fi
echo ""
echo "================================================================================"
echo "💡 RECOMMENDATIONS"
echo "================================================================================"
echo ""
echo "Immediate Actions:"
echo "  1. Re-run this test: MASTERLINC_BASE_PORT=$AGENT_BASE_PORT FACILITY_ID=$FACILITY_ID ./scripts/test-claim-workflow.sh"
echo "  2. If agent startup fails due to pip conflicts, start with INSTALL_DEPS=0 (default)"
echo "  3. If Step 6 reports status=error, configure SBS NPHIES (API key / base URL / outbound network)"
echo ""
echo "Frontend Integration:"
echo "  1. Keep browser harness endpoints aligned with this script's payloads (coding.system + resource_type)"
echo "  2. Add retry/backoff for SBS calls (Normalizer/Signer/NPHIES)"
echo ""
echo "================================================================================"
echo "📝 TEST COMPLETE"
echo "================================================================================"
echo ""
echo "Test Log: /tmp/claim_workflow_test_$(date +%Y%m%d_%H%M%S).log"
echo "Next Steps: Review issues above and implement fixes"
echo ""
