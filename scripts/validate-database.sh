#!/bin/bash
# ===============================================
# Database Schema Validation Script
# Validates Phase 1 database schema completeness
# ===============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🗄️  BrainSAIT Database Schema Validation"
echo "========================================"
echo ""

# Check for DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not set. Using default.${NC}"
    DATABASE_URL="postgresql://masterlinc:MasterLinc2026Secure!@localhost:5432/masterlinc"
fi

echo "Database: $DATABASE_URL"
echo ""

# Function to check table exists
check_table() {
    local table=$1
    local description=$2
    
    echo -n "Checking table '$table' ($description)... "
    
    if psql "$DATABASE_URL" -tAc "SELECT 1 FROM information_schema.tables WHERE table_name='$table'" | grep -q 1; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗ MISSING${NC}"
        return 1
    fi
}

# Function to check column exists
check_column() {
    local table=$1
    local column=$2
    
    echo -n "  - Column '$column'... "
    
    if psql "$DATABASE_URL" -tAc "SELECT 1 FROM information_schema.columns WHERE table_name='$table' AND column_name='$column'" | grep -q 1; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗ MISSING${NC}"
        return 1
    fi
}

# Function to check index exists
check_index() {
    local index=$1
    
    echo -n "  - Index '$index'... "
    
    if psql "$DATABASE_URL" -tAc "SELECT 1 FROM pg_indexes WHERE indexname='$index'" | grep -q 1; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ MISSING${NC}"
        return 1
    fi
}

PASSED=0
FAILED=0

echo "1. CORE TABLES"
echo "-------------"

# Patients table
if check_table "patients" "Patient demographics and identifiers"; then
    check_column "patients" "patient_id"
    check_column "patients" "national_id"
    check_column "patients" "oid_identifier"
    check_column "patients" "did_identifier"
    check_column "patients" "full_name"
    check_index "idx_patients_oid"
    check_index "idx_patients_did"
    ((PASSED++))
else
    ((FAILED++))
fi

# OID Registry
if check_table "oid_registry" "OID service registry"; then
    check_column "oid_registry" "oid"
    check_column "oid_registry" "oid_branch"
    check_column "oid_registry" "service_name"
    check_column "oid_registry" "service_type"
    check_index "idx_oid_branch"
    check_index "idx_service_name"
    ((PASSED++))
else
    ((FAILED++))
fi

# DID Registry
if check_table "did_registry" "DID identity registry"; then
    check_column "did_registry" "did"
    check_column "did_registry" "did_document"
    check_column "did_registry" "oid_identifier"
    check_column "did_registry" "public_key_multibase"
    check_index "idx_did_status"
    ((PASSED++))
else
    ((FAILED++))
fi

# DID-OID Mapping
if check_table "did_oid_mapping" "DID to OID mappings"; then
    check_column "did_oid_mapping" "mapping_id"
    check_column "did_oid_mapping" "did"
    check_column "did_oid_mapping" "oid"
    check_index "idx_oid_mapping"
    ((PASSED++))
else
    ((FAILED++))
fi

echo ""
echo "2. CLINICAL TABLES"
echo "-----------------"

# Appointments
if check_table "appointments" "Appointment scheduling"; then
    check_column "appointments" "appointment_id"
    check_column "appointments" "patient_id"
    check_column "appointments" "provider_id"
    check_column "appointments" "triage_level"
    check_index "idx_appointments_patient"
    ((PASSED++))
else
    ((FAILED++))
fi

# Data Provenance
if check_table "data_provenance" "Audit trail and data lineage"; then
    check_column "data_provenance" "provenance_id"
    check_column "data_provenance" "service_oid"
    check_column "data_provenance" "patient_oid"
    check_column "data_provenance" "digital_signature"
    check_index "idx_provenance_service_oid"
    ((PASSED++))
else
    ((FAILED++))
fi

echo ""
echo "3. OPERATIONAL TABLES"
echo "--------------------"

# Claims
if check_table "claims" "SBS claims management"; then
    check_column "claims" "claim_id"
    check_column "claims" "patient_oid"
    check_column "claims" "provider_oid"
    check_column "claims" "nphies_id"
    check_index "idx_claims_patient"
    ((PASSED++))
else
    ((FAILED++))
fi

# Workflows
if check_table "workflows" "Workflow orchestration"; then
    check_column "workflows" "workflow_id"
    check_column "workflows" "name"
    check_column "workflows" "status"
    check_column "workflows" "steps"
    check_index "idx_workflows_status"
    ((PASSED++))
else
    ((FAILED++))
fi

# Service Registry
if check_table "service_registry" "Service discovery"; then
    check_column "service_registry" "service_id"
    check_column "service_registry" "name"
    check_column "service_registry" "url"
    check_column "service_registry" "status"
    ((PASSED++))
else
    ((FAILED++))
fi

# Events
if check_table "events" "Event sourcing and audit"; then
    check_column "events" "event_type"
    check_column "events" "source"
    check_column "events" "payload"
    check_index "idx_events_type"
    check_index "idx_events_correlation"
    ((PASSED++))
else
    ((FAILED++))
fi

echo ""
echo "4. DATA INTEGRITY"
echo "----------------"

# Check for foreign key constraints
echo -n "Checking foreign key constraints... "
FK_COUNT=$(psql "$DATABASE_URL" -tAc "
    SELECT COUNT(*) 
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
    AND table_schema = 'public'
")
echo -e "${GREEN}$FK_COUNT constraints${NC}"

# Check for NOT NULL constraints
echo -n "Checking NOT NULL constraints... "
NN_COUNT=$(psql "$DATABASE_URL" -tAc "
    SELECT COUNT(*) 
    FROM information_schema.columns 
    WHERE is_nullable = 'NO' 
    AND table_schema = 'public'
")
echo -e "${GREEN}$NN_COUNT columns${NC}"

# Check for CHECK constraints
echo -n "Checking CHECK constraints... "
CK_COUNT=$(psql "$DATABASE_URL" -tAc "
    SELECT COUNT(*) 
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'CHECK' 
    AND table_schema = 'public'
")
echo -e "${GREEN}$CK_COUNT constraints${NC}"

echo ""
echo "5. SAMPLE DATA"
echo "-------------"

# Count records in each table
for table in patients oid_registry did_registry appointments claims workflows service_registry events; do
    echo -n "$table: "
    COUNT=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM $table" 2>/dev/null || echo "0")
    echo -e "${GREEN}$COUNT records${NC}"
done

echo ""
echo "======================================"
echo "VALIDATION SUMMARY"
echo "======================================"
echo -e "Tables verified: ${GREEN}$PASSED${NC}"
echo -e "Tables missing:  ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ Database schema is complete and valid!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Verify services can connect: npm run health-check"
    echo "2. Run integration tests: npm test"
    echo "3. Review data provenance: psql \$DATABASE_URL -c 'SELECT * FROM data_provenance LIMIT 10;'"
    exit 0
else
    echo -e "${RED}✗ Database schema validation failed!${NC}"
    echo ""
    echo "Missing tables detected. To fix:"
    echo "1. Run initialization: psql \$DATABASE_URL < infrastructure/init.sql"
    echo "2. Apply BrainSAIT schema: psql \$DATABASE_URL < infrastructure/database/brainsait-schema.sql"
    echo "3. Re-run this validation: ./scripts/validate-database.sh"
    exit 1
fi
