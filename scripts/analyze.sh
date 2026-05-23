#!/bin/bash
# SCALPEL CLI — Trigger AI analysis via the running dev server.
#
# Usage:
#   ./scripts/analyze.sh shein
#   ./scripts/analyze.sh anta
#   ./scripts/analyze.sh bosideng
#
# Requires: dev server running on port 3000 or 3001

PORT=${SCALPEL_PORT:-3001}
BRAND=$1

if [ -z "$BRAND" ]; then
  echo "Usage: ./scripts/analyze.sh <shein|anta|bosideng>"
  exit 1
fi

echo "🔬 Sending analysis request for: $BRAND"
curl -s -X POST "http://localhost:$PORT/api/analyze" \
  -H "Content-Type: application/json" \
  -d "{\"brand_slug\": \"$BRAND\"}" | python3 -m json.tool 2>/dev/null || \
curl -s -X POST "http://localhost:$PORT/api/analyze" \
  -H "Content-Type: application/json" \
  -d "{\"brand_slug\": \"$BRAND\"}"
