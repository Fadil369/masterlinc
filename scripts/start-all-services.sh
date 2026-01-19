#!/bin/bash
# MASTERLINC + SBS Integration Startup Script

set -e

echo "🚀 Starting MASTERLINC + SBS Integration Services..."
echo "=================================================="

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check service health
check_service() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=0
    
    echo -ne "${BLUE}Checking $service_name on port $port...${NC}"
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "http://localhost:$port" > /dev/null 2>&1 || \
           curl -s "http://localhost:$port/health" > /dev/null 2>&1 || \
           nc -z localhost $port > /dev/null 2>&1; then
            echo -e " ${GREEN}✓ Ready${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 2
        echo -ne "."
    done
    
    echo -e " ${YELLOW}⚠ Timeout (may still be starting)${NC}"
    return 1
}

# Step 1: Start MASTERLINC Infrastructure
echo -e "\n${BLUE}Step 1: Starting MASTERLINC Infrastructure${NC}"
echo "-------------------------------------------"
cd /workspaces/masterlinc

if docker compose -f infrastructure/docker/docker-compose.yml ps | grep -q "Up"; then
    echo -e "${GREEN}✓ MASTERLINC infrastructure already running${NC}"
else
    docker compose -f infrastructure/docker/docker-compose.yml up -d
    sleep 5
    check_service "PostgreSQL" 5432
    check_service "Redis" 6379
fi

# Step 2: Start MASTERLINC Backend
echo -e "\n${BLUE}Step 2: Starting MASTERLINC Backend API${NC}"
echo "----------------------------------------"
cd /workspaces/masterlinc/apps/backend

# Check if already running
if lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Port 3000 already in use, skipping backend start${NC}"
else
    if [ ! -d "node_modules" ]; then
        echo "Installing backend dependencies..."
        npm install > /dev/null 2>&1
    fi
    
    export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/masterlinc"
    export REDIS_URL="redis://localhost:6379"
    
    nohup npm run dev > /tmp/masterlinc-backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > /tmp/masterlinc-backend.pid
    echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
    check_service "Backend API" 3000
fi

# Step 3: Start SBS Services
echo -e "\n${BLUE}Step 3: Starting SBS Integration Services${NC}"
echo "------------------------------------------"
cd /workspaces/sbs

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo -e "${YELLOW}⚠ Please configure .env with your credentials${NC}"
fi

# Start SBS services
if docker compose ps | grep -q "Up"; then
    echo -e "${GREEN}✓ SBS services already running${NC}"
else
    docker compose up -d
    sleep 10
    
    echo "Checking SBS services..."
    check_service "Normalizer Service" 8000
    check_service "Signer Service" 8001
    check_service "Financial Rules Engine" 8002
    check_service "NPHIES Bridge" 8003
fi

# Step 4: Start MASTERLINC Frontend (optional)
echo -e "\n${BLUE}Step 4: Starting MASTERLINC Frontend (optional)${NC}"
echo "------------------------------------------------"
cd /workspaces/masterlinc/apps/web

if lsof -ti:5173 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Port 5173 already in use, skipping frontend${NC}"
else
    if [ ! -d "node_modules" ]; then
        echo "Installing frontend dependencies..."
        npm install > /dev/null 2>&1
    fi
    
    nohup npm run dev > /tmp/masterlinc-frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > /tmp/masterlinc-frontend.pid
    echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
    check_service "Frontend" 5173
fi

# Summary
echo -e "\n${GREEN}=================================================="
echo "✅ All Services Started Successfully!"
echo "==================================================${NC}"
echo ""
echo "📊 Service Status:"
echo "─────────────────"
echo "MASTERLINC Infrastructure:"
echo "  • PostgreSQL:     http://localhost:5432"
echo "  • Redis:          http://localhost:6379"
echo ""
echo "MASTERLINC Services:"
echo "  • Backend API:    http://localhost:3000"
echo "  • Frontend:       http://localhost:5173"
echo ""
echo "SBS Integration Services:"
echo "  • Normalizer:     http://localhost:8000"
echo "  • Signer:         http://localhost:8001"
echo "  • Financial:      http://localhost:8002"
echo "  • NPHIES Bridge:  http://localhost:8003"
echo "  • SBS Postgres:   http://localhost:5432 (shared)"
echo ""
echo "📝 Logs:"
echo "─────────"
echo "  • Backend:  tail -f /tmp/masterlinc-backend.log"
echo "  • Frontend: tail -f /tmp/masterlinc-frontend.log"
echo "  • Docker:   docker compose logs -f"
echo ""
echo "🛑 To stop all services:"
echo "─────────────────────────"
echo "  • MASTERLINC: cd /workspaces/masterlinc && ./scripts/stop-all.sh"
echo "  • SBS:        cd /workspaces/sbs && docker compose down"
echo ""
echo "🔗 Integration Ready!"
echo "Your agents can now work with both MASTERLINC and SBS services."
