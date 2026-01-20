#!/bin/bash

# MASTERLINC Services Stop Script

set -e

echo "========================================="
echo "🛑 Stopping MASTERLINC Services"
echo "========================================="

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Kill services by PID files
for PID_FILE in logs/*.pid; do
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
for PORT in 8000 8001 8002 8003 8004 8005; do
    PID=$(lsof -ti:$PORT 2>/dev/null || true)
    if [ -n "$PID" ]; then
        echo -e "${GREEN}Killing process on port $PORT (PID: $PID)...${NC}"
        kill "$PID" 2>/dev/null || true
    fi
done

echo ""
echo -e "${GREEN}✅ All services stopped${NC}"
echo ""
