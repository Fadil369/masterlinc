#!/bin/bash
# Stop all MASTERLINC and SBS services

set -e

echo "🛑 Stopping MASTERLINC + SBS Services..."

# Stop MASTERLINC backend
if [ -f /tmp/masterlinc-backend.pid ]; then
    BACKEND_PID=$(cat /tmp/masterlinc-backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "Stopping MASTERLINC Backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        rm /tmp/masterlinc-backend.pid
    fi
fi

# Stop MASTERLINC frontend
if [ -f /tmp/masterlinc-frontend.pid ]; then
    FRONTEND_PID=$(cat /tmp/masterlinc-frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "Stopping MASTERLINC Frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        rm /tmp/masterlinc-frontend.pid
    fi
fi

# Stop Docker services
echo "Stopping MASTERLINC Docker services..."
cd /workspaces/masterlinc && docker compose -f infrastructure/docker/docker-compose.yml down

echo "Stopping SBS Docker services..."
cd /workspaces/sbs && docker compose down

echo "✅ All services stopped"
