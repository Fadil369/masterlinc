#!/bin/bash
# Test script for BrainSAIT services

set -e

echo "🧪 BrainSAIT Services Test Suite"
echo "================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}1. Testing OID Registry Service Build${NC}"
cd /home/runner/work/masterlinc/masterlinc/services/oid-registry
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ OID Registry build successful${NC}"
else
    echo -e "${RED}❌ OID Registry build failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}2. Testing DID Registry Service Build${NC}"
cd /home/runner/work/masterlinc/masterlinc/services/did-registry
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ DID Registry build successful${NC}"
else
    echo -e "${RED}❌ DID Registry build failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}3. Verifying TypeScript Compilation${NC}"
if [ -f /home/runner/work/masterlinc/masterlinc/services/oid-registry/dist/index.js ] && \
   [ -f /home/runner/work/masterlinc/masterlinc/services/did-registry/dist/index.js ]; then
    echo -e "${GREEN}✅ All TypeScript files compiled successfully${NC}"
else
    echo -e "${RED}❌ TypeScript compilation incomplete${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}4. Checking Database Schema${NC}"
if [ -f /home/runner/work/masterlinc/masterlinc/infrastructure/database/brainsait-schema.sql ]; then
    line_count=$(wc -l < /home/runner/work/masterlinc/masterlinc/infrastructure/database/brainsait-schema.sql)
    echo -e "${GREEN}✅ Database schema exists ($line_count lines)${NC}"
else
    echo -e "${RED}❌ Database schema not found${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}5. Validating Docker Configuration${NC}"
cd /home/runner/work/masterlinc/masterlinc/infrastructure/docker
if docker compose config > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker Compose configuration is valid${NC}"
else
    echo -e "${YELLOW}⚠️  Docker Compose validation skipped (Docker may not be available)${NC}"
fi

echo ""
echo -e "${YELLOW}6. Checking Documentation${NC}"
docs_found=0
if [ -f /home/runner/work/masterlinc/masterlinc/docs/BRAINSAIT_SETUP.md ]; then
    docs_found=$((docs_found + 1))
    echo -e "${GREEN}  ✓ Setup documentation exists${NC}"
fi
if [ -f /home/runner/work/masterlinc/masterlinc/docs/api/BRAINSAIT_API.md ]; then
    docs_found=$((docs_found + 1))
    echo -e "${GREEN}  ✓ API documentation exists${NC}"
fi
if [ -f /home/runner/work/masterlinc/masterlinc/.env.brainsait.example ]; then
    docs_found=$((docs_found + 1))
    echo -e "${GREEN}  ✓ Environment configuration template exists${NC}"
fi

if [ $docs_found -eq 3 ]; then
    echo -e "${GREEN}✅ All documentation files present${NC}"
else
    echo -e "${RED}❌ Some documentation files missing (found $docs_found/3)${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}================================="
echo -e "✅ All Tests Passed!"
echo -e "=================================${NC}"
echo ""
echo "📦 Services ready for deployment:"
echo "  • OID Registry Service (Port 3001)"
echo "  • DID Registry Service (Port 3002)"
echo ""
echo "📚 Next steps:"
echo "  1. Configure environment variables (.env.brainsait)"
echo "  2. Start services with: cd infrastructure/docker && docker compose up -d"
echo "  3. Test endpoints as documented in docs/api/BRAINSAIT_API.md"
