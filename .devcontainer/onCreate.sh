#!/bin/bash
# onCreate.sh - Runs when the devcontainer is created

set -e

echo "🚀 Setting up MASTERLINC development environment..."

# Install dependencies
if [ -f "package.json" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Setup backend if exists
if [ -d "backend" ]; then
    echo "🔧 Setting up backend..."
    cd backend
    if [ -f "package.json" ]; then
        npm install
    fi
    cd ..
fi

# Setup Python services if exist
if [ -d "services" ]; then
    echo "🐍 Setting up Python services..."
    for service_dir in services/*/; do
        if [ -f "${service_dir}requirements.txt" ]; then
            echo "Installing dependencies for ${service_dir}..."
            # Use --user flag to install in user space instead of global
            pip install --user -r "${service_dir}requirements.txt"
        fi
    done
fi

# Create .env if not exists
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
fi

# Start GitHub Pages preview server in background for development
if [ -d "public" ]; then
    echo "🌐 GitHub Pages content found in public/ directory"
    echo "   Run 'npm run frontend:dev' to preview GitHub Pages site locally"
fi

echo "✅ Development environment setup complete!"
echo ""
echo "🎯 Quick commands:"
echo "   npm run dev              - Start frontend dev server"
echo "   npm run backend:dev      - Start backend API server"
echo "   npm run frontend:dev     - Preview GitHub Pages site (public/)"
echo "   npm run setup            - Full project setup"
echo ""
