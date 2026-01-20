#!/bin/bash

# MASTERLINC Services Startup Script
# Starts all backend services for development/testing

set -e

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
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Installing dependencies...${NC}"

# Function to start a service
start_service() {
    SERVICE_NAME=$1
    SERVICE_PORT=$2
    SERVICE_DIR="services/${SERVICE_NAME}"
    
    if [ ! -d "$SERVICE_DIR" ]; then
        echo -e "${RED}❌ Service directory not found: $SERVICE_DIR${NC}"
        return 1
    fi
    
    echo -e "${GREEN}▶️  Starting $SERVICE_NAME on port $SERVICE_PORT...${NC}"
    
    cd "$SERVICE_DIR"
    
    # Install requirements if needed
    if [ -f "requirements.txt" ]; then
        pip install -q -r requirements.txt 2>/dev/null || true
    fi
    
    # Start service in background
    python3 main.py > "../../logs/${SERVICE_NAME}.log" 2>&1 &
    SERVICE_PID=$!
    
    echo "$SERVICE_PID" > "../../logs/${SERVICE_NAME}.pid"
    echo -e "${GREEN}✅ $SERVICE_NAME started (PID: $SERVICE_PID)${NC}"
    
    cd ../..
}

# Create logs directory
mkdir -p logs

# Start services
echo ""
echo -e "${YELLOW}🔧 Starting backend services...${NC}"
echo ""

start_service "authlinc-api" 8005
sleep 2

start_service "masterlinc-api" 8000
sleep 2

start_service "claimlinc-api" 8001
sleep 2

start_service "policylinc-api" 8003
sleep 2

start_service "doctorlinc-api" 8002
sleep 2

start_service "audit-service" 8004
sleep 2

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ All services started successfully!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Service Status:"
echo "---------------"
echo "AuthLinc API:       http://localhost:8005"
echo "MasterLinc API:     http://localhost:8000"
echo "ClaimLinc API:      http://localhost:8001"
echo "PolicyLinc API:     http://localhost:8003"
echo "DoctorLinc API:     http://localhost:8002"
echo "Audit Service:      http://localhost:8004"
echo ""
echo "API Documentation:"
echo "------------------"
echo "ClaimLinc Docs:     http://localhost:8001/api/v1/docs"
echo "PolicyLinc Docs:    http://localhost:8003/api/v1/docs"
echo "DoctorLinc Docs:    http://localhost:8002/api/v1/docs"
echo "AuthLinc Docs:      http://localhost:8005/api/v1/docs"
echo "MasterLinc Docs:    http://localhost:8000/api/v1/docs"
echo ""
echo "Logs directory:     ./logs/"
echo ""
echo -e "${YELLOW}💡 To stop services, run: ./scripts/stop-services.sh${NC}"
echo -e "${YELLOW}💡 To view logs: tail -f logs/<service-name>.log${NC}"
echo ""

# Wait a few seconds and check health
echo "Checking service health..."
sleep 5

for PORT in 8000 8001 8002 8003 8004 8005; do
    if curl -s http://localhost:$PORT/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Port $PORT responding"
    else
        echo -e "${YELLOW}⚠${NC} Port $PORT not responding yet (may still be starting)"
    fi
done

echo ""
echo -e "${GREEN}🎉 MASTERLINC is ready!${NC}"
echo ""
