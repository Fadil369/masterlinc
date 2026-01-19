#!/bin/bash
# postStartCommand.sh - Runs every time the container starts

set -e

echo "🔄 Running post-start setup..."

# Check if services are needed
if command -v docker &> /dev/null; then
    echo "🐳 Docker is available"
    
    # Start PostgreSQL if docker-compose is available
    if [ -f "docker-compose.agents.yml" ]; then
        echo "   Docker Compose configuration found"
    fi
fi

# Git configuration
git config --global --add safe.directory /workspaces/masterlinc || true

# Display helpful information
echo ""
echo "✅ Container is ready!"
echo ""
echo "📂 Workspace: /workspaces/masterlinc"
echo ""
echo "🌐 GitHub Pages Development:"
echo "   - Content location: public/"
echo "   - Preview command: npm run frontend:dev"
echo "   - Local preview: http://localhost:8000"
echo ""
echo "🔧 Available ports:"
echo "   - 3000: Main dev server"
echo "   - 4000: Backend API"
echo "   - 5000: Vite preview"
echo "   - 8000: GitHub Pages preview"
echo "   - 8080: FHIR Server"
echo ""
