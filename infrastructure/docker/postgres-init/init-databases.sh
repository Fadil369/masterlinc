#!/bin/bash
set -e

# Create multiple databases
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create FHIR database
    CREATE DATABASE fhir;
    
    -- Create Audit database
    CREATE DATABASE audit;
    
    -- Create Kong database (for API Gateway)
    CREATE DATABASE kong;
    
    -- Grant privileges
    GRANT ALL PRIVILEGES ON DATABASE fhir TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE audit TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE kong TO $POSTGRES_USER;
EOSQL

echo "Databases created successfully"
