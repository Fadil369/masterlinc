#!/bin/bash

# MasterLinc Staging Deployment Script
# This script deploys all services to staging environment

set -e

echo "🚀 Starting MasterLinc Staging Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load staging environment
if [ -f .env.staging ]; then
    export $(cat .env.staging | grep -v '^#' | xargs)
    echo -e "${GREEN}✓${NC} Loaded staging environment variables"
else
    echo -e "${RED}✗${NC} .env.staging file not found!"
    exit 1
fi

# Function to check if service is healthy
check_health() {
    local service_url=$1
    local max_attempts=30
    local attempt=1
    
    echo -n "Checking health of $service_url... "
    
    while [ $attempt -le $max_attempts ]; do
        if curl -sf "$service_url/health" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Healthy${NC}"
            return 0
        fi
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}✗ Failed${NC}"
    return 1
}

# 1. Build Docker images
echo -e "\n${YELLOW}Step 1:${NC} Building Docker images..."
docker compose -f docker-compose.staging.yml build
echo -e "${GREEN}✓${NC} Docker images built successfully"

# 2. Start databases first
echo -e "\n${YELLOW}Step 2:${NC} Starting databases..."
docker compose -f docker-compose.staging.yml up -d postgres redis
sleep 10
echo -e "${GREEN}✓${NC} Databases started"

# 3. Run database migrations
echo -e "\n${YELLOW}Step 3:${NC} Running database migrations..."
docker compose -f docker-compose.staging.yml run --rm fhir-server npm run migrate || echo "Migration skipped"
docker compose -f docker-compose.staging.yml run --rm payment-gateway npm run migrate || echo "Migration skipped"
docker compose -f docker-compose.staging.yml run --rm audit-logger npm run migrate || echo "Migration skipped"
echo -e "${GREEN}✓${NC} Migrations completed"

# 4. Start all services
echo -e "\n${YELLOW}Step 4:${NC} Starting all services..."
docker compose -f docker-compose.staging.yml up -d
echo -e "${GREEN}✓${NC} All services started"

# 5. Health checks
echo -e "\n${YELLOW}Step 5:${NC} Running health checks..."
sleep 15

check_health "$FHIR_SERVER_URL" || exit 1
check_health "$PAYMENT_GATEWAY_URL" || exit 1
check_health "$AUDIT_LOGGER_URL" || exit 1
check_health "$EPRESCRIPTION_URL" || exit 1
check_health "$TELEHEALTH_URL" || exit 1
check_health "$LAB_INTERFACE_URL" || exit 1
check_health "$PHARMACY_URL" || exit 1

echo -e "\n${GREEN}✓${NC} All health checks passed!"

# 6. Load demo data
echo -e "\n${YELLOW}Step 6:${NC} Loading demo data..."
node scripts/seed-demo-data.js --env staging
echo -e "${GREEN}✓${NC} Demo data loaded"

# 7. Run smoke tests
echo -e "\n${YELLOW}Step 7:${NC} Running smoke tests..."
npm run test:smoke -- --env staging
echo -e "${GREEN}✓${NC} Smoke tests passed"

# Summary
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Staging Deployment Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📊 Service URLs:"
echo "  FHIR Server:      $FHIR_SERVER_URL"
echo "  Payment Gateway:  $PAYMENT_GATEWAY_URL"
echo "  Audit Logger:     $AUDIT_LOGGER_URL"
echo "  E-Prescription:   $EPRESCRIPTION_URL"
echo "  Telehealth:       $TELEHEALTH_URL"
echo "  Lab Interface:    $LAB_INTERFACE_URL"
echo "  Pharmacy:         $PHARMACY_URL"
echo "  Healthcare App:   $HEALTHCARE_APP_URL"
echo ""
echo "🔍 View logs: docker-compose -f docker-compose.staging.yml logs -f"
echo "🛑 Stop services: docker-compose -f docker-compose.staging.yml down"
echo ""
echo -e "${GREEN}Happy testing! 🎉${NC}"
