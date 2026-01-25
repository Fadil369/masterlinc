#!/bin/bash
# Deploy BrainSAIT Public API Services

set -e

echo "🚀 Deploying BrainSAIT Public API Services"
echo "=========================================="
echo ""

# Check if running as root for nginx
if [ "$EUID" -eq 0 ]; then
    SUDO=""
else
    SUDO="sudo"
fi

# 1. Update MasterLinc Coordinator Environment
echo "📝 Updating environment variables..."
cat > ~/.masterlinc.env << EOF
# MasterLinc Coordinator
NODE_ENV=production
PORT=4000

# Orthanc Configuration
ORTHANC_URL=http://localhost:8042
ORTHANC_USER=orthanc
ORTHANC_PASSWORD=orthanc

# OHIF Viewer
OHIF_URL=http://localhost:3000

# AI Configuration
SYNTHETIC_API_KEY=${SYNTHETIC_API_KEY:-sk-877e7388e05641a0bf71fad8cefe0a20}
DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY:-sk-877e7388e05641a0bf71fad8cefe0a20}

# 3CX Configuration (if available)
PBX_FQDN=${PBX_FQDN:-1593.3cx.cloud}
PBX_USERNAME=${PBX_USERNAME}
PBX_PASSWORD=${PBX_PASSWORD}

# Public Access
PUBLIC_API_URL=${PUBLIC_API_URL:-https://api.brainsait.com}
CORS_ORIGIN=${CORS_ORIGIN:-*}
EOF

source ~/.masterlinc.env

# 2. Configure Nginx (if available)
echo ""
echo "🌐 Configuring Nginx..."

if command -v nginx &> /dev/null; then
    # Copy nginx config
    $SUDO cp ~/nginx-brainsait-api.conf /etc/nginx/sites-available/brainsait-api 2>/dev/null || {
        echo "⚠️  Nginx config directory not found, skipping nginx setup"
    }
    
    # Enable site
    $SUDO ln -sf /etc/nginx/sites-available/brainsait-api /etc/nginx/sites-enabled/brainsait-api 2>/dev/null || true
    
    # Test nginx config
    if $SUDO nginx -t 2>/dev/null; then
        echo "✅ Nginx configuration valid"
        $SUDO systemctl reload nginx 2>/dev/null || $SUDO nginx -s reload 2>/dev/null || true
    else
        echo "⚠️  Nginx configuration test failed, skipping reload"
    fi
else
    echo "⚠️  Nginx not installed, services will run on localhost only"
fi

# 3. Stop old processes
echo ""
echo "🛑 Stopping old processes..."
pkill -f "masterlinc-coordinator" 2>/dev/null || true
sleep 2

# 4. Start MasterLinc Coordinator
echo ""
echo "🚀 Starting MasterLinc Coordinator..."
cd ~/masterlinc/packages/masterlinc-coordinator

# Start as background service
nohup node dist/index.js > ~/logs/masterlinc-coordinator.log 2>&1 &
COORDINATOR_PID=$!

echo "   PID: $COORDINATOR_PID"
echo "   Logs: ~/logs/masterlinc-coordinator.log"

# Wait for startup
sleep 5

# 5. Health Checks
echo ""
echo "🏥 Running Health Checks..."

# Check MasterLinc
if curl -s http://localhost:4000/health | jq -r '.status' | grep -q "healthy"; then
    echo "   ✅ MasterLinc Coordinator: Running"
else
    echo "   ❌ MasterLinc Coordinator: Failed"
fi

# Check Orthanc
if curl -s -u orthanc:orthanc http://localhost:8042/system > /dev/null 2>&1; then
    echo "   ✅ Orthanc PACS: Running"
else
    echo "   ❌ Orthanc PACS: Not accessible"
fi

# Check OHIF
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "   ✅ OHIF Viewer: Running"
else
    echo "   ❌ OHIF Viewer: Not accessible"
fi

# 6. Public Access Info
echo ""
echo "🌍 Public Access Configuration"
echo "=============================="

# Check if we have Cloudflare Tunnel
if command -v cloudflared &> /dev/null; then
    echo "✅ Cloudflare Tunnel detected"
    echo "   Configure tunnel to forward to localhost:4000"
    echo "   Example: cloudflared tunnel route dns <tunnel> api.brainsait.com"
fi

# Check if we have Tailscale
if command -v tailscale &> /dev/null; then
    TAILSCALE_IP=$(tailscale ip -4 2>/dev/null || echo "Not connected")
    echo "✅ Tailscale detected"
    echo "   Tailscale IP: $TAILSCALE_IP"
    echo "   Access via: http://$TAILSCALE_IP:4000"
fi

# Check if Nginx is configured
if [ -f /etc/nginx/sites-enabled/brainsait-api ]; then
    echo "✅ Nginx reverse proxy configured"
    echo "   Update server_name in /etc/nginx/sites-available/brainsait-api"
fi

echo ""
echo "📊 Service Endpoints"
echo "==================="
echo "Local Access:"
echo "  • MasterLinc API:  http://localhost:4000"
echo "  • Orthanc PACS:    http://localhost:8042"
echo "  • OHIF Viewer:     http://localhost:3000"
echo ""
echo "API Endpoints:"
echo "  • Health:          GET  /health"
echo "  • Process Command: POST /api/process"
echo "  • RadioLinc Triage: POST /api/radiolinc/triage"
echo ""
echo "Example API Call:"
echo '  curl -X POST http://localhost:4000/api/process \'
echo '    -H "Content-Type: application/json" \'
echo '    -d '"'"'{"source":"test","command":"health"}'"'"
echo ""
echo "✅ Deployment Complete!"
echo ""
echo "📝 Next Steps:"
echo "  1. Configure your domain DNS to point to this server"
echo "  2. Set up SSL certificates: sudo certbot --nginx"
echo "  3. Update nginx server_name with your domain"
echo "  4. Test public API access"
echo "  5. Configure Cloudflare Tunnel or Tailscale for secure access"
