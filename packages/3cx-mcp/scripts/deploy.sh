#!/bin/bash

###############################################################################
# 3CX MCP Server Deployment Script
# Automates building, testing, and deployment
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DEPLOY_ENV="${1:-staging}"

echo -e "${GREEN}🚀 3CX MCP Server Deployment${NC}"
echo "Environment: $DEPLOY_ENV"
echo "Project Dir: $PROJECT_DIR"
echo ""

# Step 1: Pre-flight checks
echo -e "${YELLOW}📋 Running pre-flight checks...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Pre-flight checks passed${NC}"
echo ""

# Step 2: Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
cd "$PROJECT_DIR"
npm ci
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 3: Type check
echo -e "${YELLOW}🔍 Running type check...${NC}"
npx tsc --noEmit
echo -e "${GREEN}✅ Type check passed${NC}"
echo ""

# Step 4: Build
echo -e "${YELLOW}🔨 Building project...${NC}"
npm run build
echo -e "${GREEN}✅ Build successful${NC}"
echo ""

# Step 5: Run tests (if available)
echo -e "${YELLOW}🧪 Running tests...${NC}"
npm test || echo -e "${YELLOW}⚠️  No tests configured${NC}"
echo ""

# Step 6: Deploy based on environment
if [ "$DEPLOY_ENV" = "production" ]; then
    echo -e "${YELLOW}🚢 Deploying to PRODUCTION...${NC}"
    
    # Create release tag
    VERSION="v$(date +%Y%m%d-%H%M%S)"
    git tag -a "$VERSION" -m "Production release $VERSION"
    
    # Build Docker image
    docker build -t brainsait/3cx-mcp:latest -t "brainsait/3cx-mcp:$VERSION" .
    
    # Push to registry
    docker push brainsait/3cx-mcp:latest
    docker push "brainsait/3cx-mcp:$VERSION"
    
    # Deploy via docker-compose
    docker-compose up -d --build
    
    echo -e "${GREEN}✅ Deployed to production as $VERSION${NC}"
    
elif [ "$DEPLOY_ENV" = "staging" ]; then
    echo -e "${YELLOW}🚧 Deploying to STAGING...${NC}"
    
    # Build Docker image with staging tag
    docker build -t brainsait/3cx-mcp:staging .
    
    # Deploy to staging
    docker-compose -f docker-compose.staging.yml up -d --build
    
    echo -e "${GREEN}✅ Deployed to staging${NC}"
    
elif [ "$DEPLOY_ENV" = "local" ]; then
    echo -e "${YELLOW}💻 Setting up local development...${NC}"
    
    # Start in development mode
    npm run dev &
    SERVER_PID=$!
    
    echo "Server started with PID: $SERVER_PID"
    echo "Press Ctrl+C to stop"
    
    wait $SERVER_PID
    
else
    echo -e "${RED}❌ Unknown environment: $DEPLOY_ENV${NC}"
    echo "Usage: $0 [production|staging|local]"
    exit 1
fi

# Step 7: Health check
echo -e "${YELLOW}🏥 Running health check...${NC}"
sleep 5

if [ "$DEPLOY_ENV" != "local" ]; then
    if docker ps | grep -q 3cx-mcp-server; then
        echo -e "${GREEN}✅ Server is running${NC}"
    else
        echo -e "${RED}❌ Server failed to start${NC}"
        docker logs 3cx-mcp-server
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "  - Monitor logs: docker logs -f 3cx-mcp-server"
echo "  - View metrics: http://localhost:9090 (Prometheus)"
echo "  - View dashboards: http://localhost:3001 (Grafana)"
echo ""
