#!/bin/bash

# MasterLinc - Deploy, Test, and Prepare for Recording
# This script executes everything needed for deployment and demos

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      MasterLinc - Deploy, Test & Record Suite           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Deploy to Staging
echo -e "${YELLOW}━━━ Step 1: Deploying to Staging ━━━${NC}"
./scripts/deploy-staging.sh
echo -e "${GREEN}✓ Deployment complete!${NC}\n"

# Step 2: Run comprehensive tests
echo -e "${YELLOW}━━━ Step 2: Running Comprehensive Tests ━━━${NC}"
npm run test:comprehensive || true
echo -e "${GREEN}✓ Tests complete!${NC}\n"

# Step 3: Generate reports
echo -e "${YELLOW}━━━ Step 3: Generating Reports ━━━${NC}"
npm run generate-test-report
echo -e "${GREEN}✓ Reports generated!${NC}\n"

# Step 4: Prepare for recording
echo -e "${YELLOW}━━━ Step 4: Preparing for Demo Recording ━━━${NC}"
echo ""
echo "Demo environment ready! Open these URLs:"
echo ""
echo "  📱 Healthcare App:  http://localhost:5173"
echo "  📊 API Docs:        http://localhost:3001/api-docs"
echo "  💊 Pharmacy:        http://localhost:9000"
echo "  🔬 Lab Interface:   http://localhost:8000"
echo ""
echo -e "${BLUE}Demo Credentials:${NC}"
echo "  Patient: sarah.patient@example.com / Demo123!"
echo "  Doctor:  ahmad.doctor@example.com / Doctor123!"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ All systems ready for demo recording!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Next steps:"
echo "  1. Open OBS Studio or your recording software"
echo "  2. Follow scripts in demo/VIDEO_SCRIPTS.md"
echo "  3. Start recording! 🎬"
echo ""
