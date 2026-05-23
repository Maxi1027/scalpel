#!/bin/bash
# SCALPEL Monitor — Run brand content monitoring scan.
#
# Usage:
#   ./scripts/monitor.sh              # Scan all 15 brands
#   ./scripts/monitor.sh shein        # Scan single brand
#   ./scripts/monitor.sh --force      # Force re-analysis of all (ignore change detection)
#
# Setup cron (weekly, Monday 3am):
#   0 3 * * 1 /path/to/scripts/monitor.sh >> /path/to/data/monitor.log 2>&1

PORT=${SCALPEL_PORT:-3001}
TOKEN=${MONITOR_TOKEN:-scalpel-monitor-dev}

if [ "$1" = "--force" ]; then
  echo "🔬 SCALPEL Monitor: Force re-scanning ALL brands..."
  curl -s -X POST "http://localhost:$PORT/api/monitor" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"force_all": true}' | python3 -m json.tool 2>/dev/null || \
  curl -s -X POST "http://localhost:$PORT/api/monitor" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"force_all": true}'
elif [ -n "$1" ]; then
  echo "🔬 SCALPEL Monitor: Scanning $1..."
  curl -s -X POST "http://localhost:$PORT/api/monitor" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"brand_slug\": \"$1\"}" | python3 -m json.tool 2>/dev/null || \
  curl -s -X POST "http://localhost:$PORT/api/monitor" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"brand_slug\": \"$1\"}"
else
  echo "🔬 SCALPEL Monitor: Scanning all 15 brands..."
  curl -s -X POST "http://localhost:$PORT/api/monitor" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{}' | python3 -m json.tool 2>/dev/null || \
  curl -s -X POST "http://localhost:$PORT/api/monitor" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{}'
fi
