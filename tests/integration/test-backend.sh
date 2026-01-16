#!/bin/bash
# Integration test script for MASTERLINC backend services

set -euo pipefail

echo "🚀 MASTERLINC Backend Integration Tests"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Base URLs
MASTERLINC_URL="${MASTERLINC_URL:-http://localhost:8000}"
CLAIMLINC_URL="${CLAIMLINC_URL:-http://localhost:8001}"
FHIR_URL="${FHIR_URL:-http://localhost:8080/fhir}"

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    
    TESTS_RUN=$((TESTS_RUN + 1))
    echo -n "Testing ${name}... "
    
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "${url}" 2>/dev/null || echo "000")
    
    if [ "$status_code" = "200" ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (${status_code})"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

echo "📊 Health Check Tests"
echo "--------------------"
test_endpoint "MasterLinc Health" "${MASTERLINC_URL}/health"
test_endpoint "ClaimLinc Health" "${CLAIMLINC_URL}/health"
echo ""

echo "📊 Test Summary"
echo "=============="
echo "Tests Run:    ${TESTS_RUN}"
echo -e "Tests Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Tests Failed: ${RED}${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
