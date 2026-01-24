#!/bin/bash
# Integration test script for MasterLinc services
# Tests the APIs of all agent services

set -e

BASE_URL="${BASE_URL:-http://localhost}"
TIMEOUT=5

echo "🧪 MasterLinc Integration Tests"
echo "================================"

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass_count=0
fail_count=0

test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    
    printf "Testing %-40s" "$name..."
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        echo -e " ${GREEN}✓ PASS${NC} (HTTP $response)"
        ((pass_count++))
        return 0
    else
        echo -e " ${RED}✗ FAIL${NC} (Expected $expected_status, got $response)"
        ((fail_count++))
        return 1
    fi
}

test_post_endpoint() {
    local name="$1"
    local url="$2"
    local data="$3"
    local expected_status="${4:-200}"
    
    printf "Testing %-40s" "$name..."
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$data" \
        "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        echo -e " ${GREEN}✓ PASS${NC} (HTTP $response)"
        ((pass_count++))
        return 0
    else
        echo -e " ${RED}✗ FAIL${NC} (Expected $expected_status, got $response)"
        ((fail_count++))
        return 1
    fi
}

echo ""
echo "📋 Health Check Tests"
echo "---------------------"

# MasterLinc API Health
test_endpoint "MasterLinc API Health" "${BASE_URL}:8000/health"

# ClaimLinc API Health
test_endpoint "ClaimLinc API Health" "${BASE_URL}:8001/health"

# DoctorLinc API Health
test_endpoint "DoctorLinc API Health" "${BASE_URL}:8002/health"

# PolicyLinc API Health
test_endpoint "PolicyLinc API Health" "${BASE_URL}:8003/health"

# DevLinc API Health
test_endpoint "DevLinc API Health" "${BASE_URL}:8004/health"

# AuthLinc API Health
test_endpoint "AuthLinc API Health" "${BASE_URL}:8005/health"

# Audit Service Health
test_endpoint "Audit Service Health" "${BASE_URL}:8006/health"

echo ""
echo "📋 API Endpoint Tests"
echo "---------------------"

# MasterLinc - List Agents
test_endpoint "MasterLinc List Agents" "${BASE_URL}:8000/api/v1/agents"

# MasterLinc - Delegate Task
test_post_endpoint "MasterLinc Delegate Task" \
    "${BASE_URL}:8000/api/v1/delegate" \
    '{"task_description":"Test task","priority":5}' \
    "201"

# ClaimLinc - Validate Claim
test_post_endpoint "ClaimLinc Validate Claim" \
    "${BASE_URL}:8001/api/v1/validate" \
    '{"claim_resource":{"resourceType":"Claim"},"validation_level":"basic"}' \
    "200"

# ClaimLinc - Analyze Rejection
test_post_endpoint "ClaimLinc Analyze Rejection" \
    "${BASE_URL}:8001/api/v1/analyze" \
    '{"claim_id":"CLM001","rejection_code":"REJ001"}' \
    "200"

# PolicyLinc - Check Eligibility
test_post_endpoint "PolicyLinc Check Eligibility" \
    "${BASE_URL}:8003/api/v1/eligibility/check" \
    '{"patient_id":"PAT001","payer_id":"PAY001"}' \
    "200"

# PolicyLinc - Verify Coverage
test_post_endpoint "PolicyLinc Verify Coverage" \
    "${BASE_URL}:8003/api/v1/coverage/verify" \
    '{"patient_id":"PAT001","service_code":"99213"}' \
    "200"

# DoctorLinc - Diagnose
test_post_endpoint "DoctorLinc Diagnose" \
    "${BASE_URL}:8002/api/v1/diagnose" \
    '{"symptoms":["headache","fever"]}' \
    "200"

echo ""
echo "================================"
echo "📊 Test Results Summary"
echo "================================"
echo -e "Passed: ${GREEN}${pass_count}${NC}"
echo -e "Failed: ${RED}${fail_count}${NC}"
echo ""

if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Ensure all services are running.${NC}"
    exit 1
fi
