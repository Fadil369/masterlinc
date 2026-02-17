#!/bin/bash
# ===============================================
# Phase 1 Build and Deployment Verification
# BrainSAIT MasterLinc Platform
# ===============================================

set -e

echo "🏥 BrainSAIT Phase 1 Verification Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to check service health
check_service() {
    local name=$1
    local url=$2
    local port=$3
    
    echo -n "Checking $name ($url)... "
    
    if curl -s -f -m 5 "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ ONLINE${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ OFFLINE${NC}"
        ((FAILED++))
        return 1
    fi
}

# Function to check port
check_port() {
    local name=$1
    local port=$2
    
    echo -n "Checking port $port ($name)... "
    
    if nc -z localhost $port 2>/dev/null; then
        echo -e "${GREEN}✓ LISTENING${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${YELLOW}⚠ NOT LISTENING${NC}"
        ((WARNINGS++))
        return 1
    fi
}

# Function to check database
check_database() {
    local db_url=$1
    
    echo -n "Checking PostgreSQL database... "
    
    # Check if postgres is accessible
    if command -v psql &> /dev/null; then
        if psql "${db_url}" -c '\dt' > /dev/null 2>&1; then
            echo -e "${GREEN}✓ CONNECTED${NC}"
            ((PASSED++))
            
            # Verify tables exist
            echo "  Verifying database schema..."
            local tables=("patients" "oid_registry" "did_registry" "appointments" "data_provenance")
            for table in "${tables[@]}"; do
                echo -n "    - $table: "
                if psql "${db_url}" -c "SELECT 1 FROM $table LIMIT 1" > /dev/null 2>&1; then
                    echo -e "${GREEN}✓${NC}"
                else
                    echo -e "${YELLOW}⚠ NOT FOUND${NC}"
                    ((WARNINGS++))
                fi
            done
            return 0
        fi
    fi
    
    echo -e "${YELLOW}⚠ CANNOT VERIFY${NC}"
    ((WARNINGS++))
    return 1
}

# Function to check file exists
check_file() {
    local file=$1
    local description=$2
    
    echo -n "Checking $description... "
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ EXISTS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ MISSING${NC}"
        ((FAILED++))
        return 1
    fi
}

# Function to check directory
check_directory() {
    local dir=$1
    local description=$2
    
    echo -n "Checking $description... "
    
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓ EXISTS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ MISSING${NC}"
        ((FAILED++))
        return 1
    fi
}

echo "1. INFRASTRUCTURE FILES"
echo "----------------------"
check_file "infrastructure/database/brainsait-schema.sql" "BrainSAIT database schema"
check_file "infrastructure/init.sql" "Database initialization script"
check_file "docker-compose.production.yml" "Production Docker Compose"
check_file "docker-compose.lite.yml" "Lite Docker Compose"
echo ""

echo "2. SERVICE DIRECTORIES"
echo "---------------------"
check_directory "services/oid-registry" "OID Registry service"
check_directory "services/did-registry" "DID Registry service"
check_directory "packages/masterlinc-orchestrator" "MasterLinc Orchestrator"
check_directory "packages/3cx-mcp" "3CX MCP Server"
echo ""

echo "3. SERVICE IMPLEMENTATIONS"
echo "-------------------------"
check_file "services/oid-registry/src/index.ts" "OID Registry implementation"
check_file "services/did-registry/src/index.ts" "DID Registry implementation"
check_file "packages/masterlinc-orchestrator/src/index.ts" "Orchestrator implementation"
echo ""

echo "4. DOCKER SETUP"
echo "--------------"
if command -v docker &> /dev/null; then
    echo -n "Docker installed... "
    echo -e "${GREEN}✓${NC}"
    ((PASSED++))
    
    if command -v docker-compose &> /dev/null; then
        echo -n "Docker Compose installed... "
        echo -e "${GREEN}✓${NC}"
        ((PASSED++))
    else
        echo -n "Docker Compose installed... "
        echo -e "${YELLOW}⚠ NOT FOUND${NC}"
        ((WARNINGS++))
    fi
else
    echo -n "Docker installed... "
    echo -e "${YELLOW}⚠ NOT FOUND${NC}"
    ((WARNINGS++))
fi
echo ""

echo "5. RUNTIME SERVICES (Optional - may not be running)"
echo "---------------------------------------------------"
check_port "PostgreSQL" 5432 || check_port "PostgreSQL (alt)" 5433 || true
check_port "Redis" 6379 || true
check_port "OID Registry" 3001 || true
check_port "DID Registry" 3002 || true
check_port "Orchestrator" 3001 || check_port "Orchestrator (alt)" 4000 || true
echo ""

echo "6. DATABASE SCHEMA VALIDATION"
echo "-----------------------------"
# Check if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
    check_database "$DATABASE_URL"
else
    echo -e "${YELLOW}⚠ DATABASE_URL not set - skipping database checks${NC}"
    ((WARNINGS++))
fi
echo ""

echo "7. CONFIGURATION FILES"
echo "---------------------"
check_file "package.json" "Root package.json"
check_file "services/oid-registry/package.json" "OID Registry package.json"
check_file "services/did-registry/package.json" "DID Registry package.json"
echo ""

echo "=========================================="
echo "VERIFICATION SUMMARY"
echo "=========================================="
echo -e "Passed:   ${GREEN}$PASSED${NC}"
echo -e "Failed:   ${RED}$FAILED${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ Phase 1 infrastructure is properly configured!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Start services: docker-compose -f docker-compose.production.yml up -d"
    echo "2. Run health checks: npm run health-check"
    echo "3. Review documentation in docs/"
    exit 0
else
    echo -e "${RED}✗ Phase 1 verification failed with $FAILED errors${NC}"
    echo ""
    echo "Please review the failed checks above and:"
    echo "1. Ensure all required files are present"
    echo "2. Check service configurations"
    echo "3. Review documentation for missing components"
    exit 1
fi
