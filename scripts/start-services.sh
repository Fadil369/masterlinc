#!/bin/bash

# MASTERLINC Services Startup Script
# Starts all backend services for development/testing

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$ROOT_DIR/logs"

# Prefer the repo virtualenv if present
if [ -x "$ROOT_DIR/.venv/bin/python" ]; then
    PYTHON="$ROOT_DIR/.venv/bin/python"
    PIP="$ROOT_DIR/.venv/bin/pip"
else
    PYTHON="python3"
    PIP="pip"
fi

echo "========================================="
echo "🚀 Starting MASTERLINC Services"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Python is available
if ! command -v "$PYTHON" &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Installing dependencies...${NC}"

# NOTE: SBS services in this workspace already use ports 8000-8003.
# To avoid collisions, this script runs MASTERLINC agent services on 9000-9006 by default.
# Override with: MASTERLINC_BASE_PORT=8000 (or any free base), INSTALL_DEPS=1.

MASTERLINC_BASE_PORT=${MASTERLINC_BASE_PORT:-9000}
INSTALL_DEPS=${INSTALL_DEPS:-0}

# Comma-separated list of services to start (defaults to all).
# Example (fast workflow run):
#   SERVICES=claimlinc-api,policylinc-api MASTERLINC_BASE_PORT=9000 ./scripts/start-services.sh
SERVICES=${SERVICES:-"masterlinc-api,claimlinc-api,doctorlinc-api,policylinc-api,audit-service,authlinc-api"}

# Function to start a service
start_service() {
    SERVICE_NAME=$1
    SERVICE_PORT=$2
    SERVICE_DIR="$ROOT_DIR/services/${SERVICE_NAME}"
    
    if [ ! -d "$SERVICE_DIR" ]; then
        echo -e "${RED}❌ Service directory not found: $SERVICE_DIR${NC}"
        return 1
    fi
    
    echo -e "${GREEN}▶️  Starting $SERVICE_NAME on port $SERVICE_PORT...${NC}"
    
    pushd "$SERVICE_DIR" >/dev/null
    
    # Install requirements if needed
    if [ -f "requirements.txt" ]; then
        if [ "$INSTALL_DEPS" = "1" ]; then
            set +e
            "$PIP" install -q -r requirements.txt
            PIP_STATUS=$?
            set -e
            if [ "$PIP_STATUS" -ne 0 ]; then
                echo -e "${YELLOW}⚠${NC} Dependency install failed for $SERVICE_NAME (pip resolver conflict)."
                echo -e "${YELLOW}⚠${NC} Continuing startup; set INSTALL_DEPS=0 to skip installs."
            fi
        fi
    fi
    
    # Start service in background
    PORT="$SERVICE_PORT" "$PYTHON" -m uvicorn main:app --host 0.0.0.0 --port "$SERVICE_PORT" > "${LOG_DIR}/${SERVICE_NAME}.log" 2>&1 &
    SERVICE_PID=$!
    
    echo "$SERVICE_PID" > "${LOG_DIR}/${SERVICE_NAME}.pid"
    echo -e "${GREEN}✅ $SERVICE_NAME started (PID: $SERVICE_PID)${NC}"
    
    popd >/dev/null
}

# Create logs directory
mkdir -p "$LOG_DIR"

# Stop any previously running MASTERLINC services (best-effort)
"$SCRIPT_DIR/stop-services.sh" >/dev/null 2>&1 || true

# Start services
echo ""
echo -e "${YELLOW}🔧 Starting backend services...${NC}"
echo ""

get_port_for_service() {
    case "$1" in
        masterlinc-api) echo $((MASTERLINC_BASE_PORT + 0)) ;;
        claimlinc-api)  echo $((MASTERLINC_BASE_PORT + 1)) ;;
        doctorlinc-api) echo $((MASTERLINC_BASE_PORT + 2)) ;;
        policylinc-api) echo $((MASTERLINC_BASE_PORT + 3)) ;;
        audit-service)  echo $((MASTERLINC_BASE_PORT + 4)) ;;
        authlinc-api)   echo $((MASTERLINC_BASE_PORT + 5)) ;;
        *) echo "" ;;
    esac
}

IFS=',' read -r -a SERVICES_TO_START <<< "$SERVICES"
for SERVICE in "${SERVICES_TO_START[@]}"; do
    SERVICE_PORT=$(get_port_for_service "$SERVICE")
    if [ -z "$SERVICE_PORT" ]; then
        echo -e "${YELLOW}⚠${NC} Unknown service '${SERVICE}', skipping"
        continue
    fi
    start_service "$SERVICE" "$SERVICE_PORT"
    sleep 2
done

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ All services started successfully!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Service Status:"
echo "---------------"
echo "MasterLinc API:     http://localhost:$((MASTERLINC_BASE_PORT + 0))"
echo "ClaimLinc API:      http://localhost:$((MASTERLINC_BASE_PORT + 1))"
echo "DoctorLinc API:     http://localhost:$((MASTERLINC_BASE_PORT + 2))"
echo "PolicyLinc API:     http://localhost:$((MASTERLINC_BASE_PORT + 3))"
echo "Audit Service:      http://localhost:$((MASTERLINC_BASE_PORT + 4))"
echo "AuthLinc API:       http://localhost:$((MASTERLINC_BASE_PORT + 5))"
echo ""
echo "API Documentation:"
echo "------------------"
echo "ClaimLinc Docs:     http://localhost:$((MASTERLINC_BASE_PORT + 1))/api/v1/docs"
echo "PolicyLinc Docs:    http://localhost:$((MASTERLINC_BASE_PORT + 3))/api/v1/docs"
echo "DoctorLinc Docs:    http://localhost:$((MASTERLINC_BASE_PORT + 2))/api/v1/docs"
echo "AuthLinc Docs:      http://localhost:$((MASTERLINC_BASE_PORT + 5))/api/v1/docs"
echo "MasterLinc Docs:    http://localhost:$((MASTERLINC_BASE_PORT + 0))/api/v1/docs"
echo ""
echo "Logs directory:     ./logs/"
echo ""
echo -e "${YELLOW}💡 To stop services, run: ./scripts/stop-services.sh${NC}"
echo -e "${YELLOW}💡 To view logs: tail -f logs/<service-name>.log${NC}"
echo ""

# Wait a few seconds and check health
echo "Checking service health..."
sleep 5

for PORT in $((MASTERLINC_BASE_PORT + 0)) $((MASTERLINC_BASE_PORT + 1)) $((MASTERLINC_BASE_PORT + 2)) $((MASTERLINC_BASE_PORT + 3)) $((MASTERLINC_BASE_PORT + 4)) $((MASTERLINC_BASE_PORT + 5)); do
    if curl -s http://localhost:$PORT/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Port $PORT responding"
    else
        echo -e "${YELLOW}⚠${NC} Port $PORT not responding yet (may still be starting)"
    fi
done

echo ""
echo -e "${GREEN}🎉 MASTERLINC is ready!${NC}"
echo ""
