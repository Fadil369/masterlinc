#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${NOTION_BRIDGE_URL:-http://localhost:7400}"

curl -sf "${BASE_URL}/health" | cat

# Requires NOTION_TOKEN configured in services/notion-bridge/.env
curl -sf "${BASE_URL}/api/notion/databases" | head -c 200 | cat

echo "\n✅ Notion bridge basic smoke test passed."
