#!/usr/bin/env bash
set -euo pipefail

if [ -z "${AMIGO_API_KEY:-}" ]; then
  echo "Error: Set AMIGO_API_KEY, AMIGO_API_KEY_ID, AMIGO_USER_ID, AMIGO_ORG_ID env vars"
  exit 1
fi

echo "=== Amigo TypeScript SDK Benchmarks ==="
echo ""
echo "--- Token Refresh ---"
npx tsx benchmarks/token-refresh.bench.ts
echo ""
echo "--- Concurrent Requests ---"
npx tsx benchmarks/concurrent-requests.bench.ts
echo ""
echo "=== Done ==="
