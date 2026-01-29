#!/bin/bash
# MasterLinc Production Deployment Script
set -e

echo "🚀 MasterLinc Production Deployment"
echo "===================================="

# Check for required env file
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production not found"
    echo "   Copy .env.production.example to .env.production and configure"
    exit 1
fi

# Load environment
export $(grep -v '^#' .env.production | xargs)

# Create network if not exists
docker network create brainsait-net 2>/dev/null || true

# Build and deploy
echo "📦 Building containers..."
docker compose -f docker-compose.production.yml build

echo "🔄 Starting services..."
docker compose -f docker-compose.production.yml up -d

# Wait for health
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Health check
echo "🏥 Running health checks..."
for service in orchestrator coordinator; do
    if docker compose -f docker-compose.production.yml ps $service | grep -q "healthy"; then
        echo "  ✅ $service is healthy"
    else
        echo "  ⚠️ $service may still be starting"
    fi
done

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Services:"
echo "  - Orchestrator: http://localhost:3001"
echo "  - Coordinator:  http://localhost:3002"
echo "  - PostgreSQL:   localhost:5432"
echo "  - Redis:        localhost:6379"
echo ""
echo "Logs: docker compose -f docker-compose.production.yml logs -f"
