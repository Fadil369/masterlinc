#!/bin/bash

# MASTERLINC Services Stop Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$ROOT_DIR/logs"

echo "========================================="
echo "🛑 Stopping MASTERLINC Services"
echo "========================================="

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Kill services by PID files
for PID_FILE in "$LOG_DIR"/*.pid; do
    if [ -f "$PID_FILE" ]; then
        SERVICE_NAME=$(basename "$PID_FILE" .pid)
        PID=$(cat "$PID_FILE")
        
        if kill -0 "$PID" 2>/dev/null; then
            echo -e "${GREEN}Stopping $SERVICE_NAME (PID: $PID)...${NC}"
            kill "$PID" 2>/dev/null || true
            rm "$PID_FILE"
        else
            echo -e "${RED}$SERVICE_NAME not running${NC}"
            rm "$PID_FILE"
        fi
    fi
done

# Fallback: kill by port
MASTERLINC_BASE_PORT=${MASTERLINC_BASE_PORT:-9000}
for PORT in 8000 8001 8002 8003 8004 8005 \
            $((MASTERLINC_BASE_PORT + 0)) $((MASTERLINC_BASE_PORT + 1)) $((MASTERLINC_BASE_PORT + 2)) $((MASTERLINC_BASE_PORT + 3)) $((MASTERLINC_BASE_PORT + 4)) $((MASTERLINC_BASE_PORT + 5)); do
    PID=$(lsof -ti:$PORT 2>/dev/null || true)
    if [ -n "$PID" ]; then
        echo -e "${GREEN}Killing process on port $PORT (PID: $PID)...${NC}"
        kill "$PID" 2>/dev/null || true
    fi
done

echo ""
echo -e "${GREEN}✅ All services stopped${NC}"
echo ""
