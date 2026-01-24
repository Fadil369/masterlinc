#!/bin/bash
# Cloud Agent Delegation Script
# This script handles delegating tasks to cloud agents

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/../config/cloud-agent-delegation.yaml"

echo -e "${GREEN}🚀 MasterLinc Cloud Agent Delegation${NC}"
echo "========================================"
echo ""

# Check if configuration file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}✗ Configuration file not found: $CONFIG_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Configuration loaded${NC}"

# Function to check agent health
check_agent_health() {
    local agent_name=$1
    local agent_url=$2
    
    echo -n "Checking ${agent_name}... "
    
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "${agent_url}/health" 2>/dev/null || echo "000")
    
    if [ "$status_code" = "200" ]; then
        echo -e "${GREEN}✓ HEALTHY${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ UNAVAILABLE (${status_code})${NC}"
        return 1
    fi
}

# Check cloud agent endpoints
echo ""
echo "📊 Cloud Agent Health Check"
echo "----------------------------"

MASTERLINC_URL="${MASTERLINC_URL:-http://localhost:8000}"
CLAIMLINC_URL="${CLAIMLINC_URL:-http://localhost:8001}"
DOCTORLINC_URL="${DOCTORLINC_URL:-http://localhost:8002}"
POLICYLINC_URL="${POLICYLINC_URL:-http://localhost:8003}"
DEVLINC_URL="${DEVLINC_URL:-http://localhost:8004}"
AUTHLINC_URL="${AUTHLINC_URL:-http://localhost:8005}"

HEALTHY_COUNT=0
TOTAL_COUNT=6

check_agent_health "MasterLinc Orchestrator" "$MASTERLINC_URL" && HEALTHY_COUNT=$((HEALTHY_COUNT + 1))
check_agent_health "ClaimLinc Agent" "$CLAIMLINC_URL" && HEALTHY_COUNT=$((HEALTHY_COUNT + 1))
check_agent_health "DoctorLinc Agent" "$DOCTORLINC_URL" && HEALTHY_COUNT=$((HEALTHY_COUNT + 1))
check_agent_health "PolicyLinc Agent" "$POLICYLINC_URL" && HEALTHY_COUNT=$((HEALTHY_COUNT + 1))
check_agent_health "DevLinc Agent" "$DEVLINC_URL" && HEALTHY_COUNT=$((HEALTHY_COUNT + 1))
check_agent_health "AuthLinc Agent" "$AUTHLINC_URL" && HEALTHY_COUNT=$((HEALTHY_COUNT + 1))

echo ""
echo "Summary: ${HEALTHY_COUNT}/${TOTAL_COUNT} agents healthy"

# Delegate task based on argument
if [ $# -gt 0 ]; then
    TASK_TYPE=$1
    echo ""
    echo -e "${GREEN}📋 Delegating Task: ${TASK_TYPE}${NC}"
    echo "----------------------------"
    
    case $TASK_TYPE in
        "build")
            echo "→ Delegating build task to DevLinc Agent..."
            curl -X POST "${DEVLINC_URL}/api/v1/tasks/build" \
                -H "Content-Type: application/json" \
                -d '{"action": "build", "trigger": "manual"}' || true
            ;;
        "test")
            echo "→ Delegating test task to DevLinc Agent..."
            curl -X POST "${DEVLINC_URL}/api/v1/tasks/test" \
                -H "Content-Type: application/json" \
                -d '{"action": "test", "trigger": "manual"}' || true
            ;;
        "deploy")
            echo "→ Delegating deployment task to MasterLinc Orchestrator..."
            curl -X POST "${MASTERLINC_URL}/api/v1/workflows/deploy" \
                -H "Content-Type: application/json" \
                -d '{"action": "deploy", "environment": "staging"}' || true
            ;;
        "health")
            echo "→ All health checks completed above"
            ;;
        *)
            echo -e "${YELLOW}⚠ Unknown task type: ${TASK_TYPE}${NC}"
            echo "Available task types: build, test, deploy, health"
            exit 1
            ;;
    esac
fi

echo ""
if [ $HEALTHY_COUNT -eq $TOTAL_COUNT ]; then
    echo -e "${GREEN}✓ All agents ready for delegation${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Some agents unavailable - delegation may be limited${NC}"
    exit 0
fi
