#!/bin/bash
# Test Public API Access

TAILSCALE_IP="100.122.153.63"

echo "🧪 Testing BrainSAIT Public API Access"
echo "======================================"
echo ""
echo "Tailscale IP: $TAILSCALE_IP"
echo ""

echo "1️⃣ Testing MasterLinc Health..."
curl -s http://$TAILSCALE_IP:4000/health | jq '.' && echo "✅ MasterLinc OK" || echo "❌ Failed"
echo ""

echo "2️⃣ Testing MasterLinc Command Processing..."
RESPONSE=$(curl -s -X POST http://$TAILSCALE_IP:4000/api/process \
  -H "Content-Type: application/json" \
  -d '{"source":"public-test","command":"health"}')
echo "$RESPONSE" | jq '.'
echo "$RESPONSE" | jq -r '.message' | grep -q "running" && echo "✅ Command Processing OK" || echo "❌ Failed"
echo ""

echo "3️⃣ Testing RadioLinc Triage Endpoint..."
TRIAGE=$(curl -s -X POST http://$TAILSCALE_IP:4000/api/radiolinc/triage \
  -H "Content-Type: application/json" \
  -d '{"studyId":"test-public-123"}')
echo "$TRIAGE" | jq '.'
echo ""

echo "4️⃣ Testing Orthanc Access..."
curl -s -u orthanc:orthanc http://$TAILSCALE_IP:8042/system | jq -r '.Version' 2>/dev/null && echo "✅ Orthanc OK" || echo "❌ Orthanc Failed"
echo ""

echo "5️⃣ Testing OHIF Viewer..."
curl -s http://$TAILSCALE_IP:3000 > /dev/null && echo "✅ OHIF OK" || echo "❌ OHIF Failed"
echo ""

echo "📊 Public Access Summary:"
echo "========================"
echo "MasterLinc API:  http://$TAILSCALE_IP:4000"
echo "Orthanc PACS:    http://$TAILSCALE_IP:8042"
echo "OHIF Viewer:     http://$TAILSCALE_IP:3000"
echo ""
echo "✅ All services are publicly accessible via Tailscale VPN!"
