#!/bin/bash

BASE_URL="http://localhost:4000"

echo "🧪 Testing MasterLinc Orchestrator API"
echo "======================================="
echo ""

# Test 1: Health Check
echo "1. Health Check:"
curl -s $BASE_URL/health | python3 -m json.tool || echo "❌ Health check failed"
echo ""

# Test 2: Service List
echo "2. Service List:"
curl -s $BASE_URL/api/services | python3 -m json.tool || echo "❌ Service list failed"
echo ""

# Test 3: Statistics
echo "3. Statistics:"
curl -s $BASE_URL/api/statistics | python3 -m json.tool || echo "❌ Statistics failed"
echo ""

# Test 4: Create Patient
echo "4. Create Patient:"
curl -s -X POST $BASE_URL/api/patients \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Ahmed",
    "lastName": "Ali",
    "dateOfBirth": "1990-01-01",
    "gender": "male",
    "phone": "+966501234567",
    "email": "ahmed.ali@example.com"
  }' | python3 -m json.tool || echo "❌ Create patient failed"
echo ""

# Test 5: Start Workflow
echo "5. Start Workflow from Call:"
curl -s -X POST $BASE_URL/api/workflows/start-from-call \
  -H "Content-Type: application/json" \
  -d '{
    "callId": "test-call-001",
    "from": "+966501234567"
  }' | python3 -m json.tool || echo "❌ Start workflow failed"
echo ""

echo "✅ API tests complete!"
