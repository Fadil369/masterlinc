#!/usr/bin/env bash
set -euo pipefail

if ! command -v nvm >/dev/null 2>&1; then
  echo "nvm not found. Install nvm first: https://github.com/nvm-sh/nvm" >&2
  exit 1
fi

echo "Switching to Node 20 (required for Vite/Rollup native bindings on macOS)..."

nvm install 20
nvm use 20

node -v
npm -v

echo "✅ Node 20 active. Now run:" 
echo "  cd apps/healthcare && npm install --legacy-peer-deps && npm run dev"
