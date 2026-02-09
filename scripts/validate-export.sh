#!/bin/bash
echo "=== Export Validation ==="
COOKIE="better-auth.session_token=$1"
# JSON export
curl -s -o /tmp/export.json -w "%{http_code}" -b "$COOKIE" "http://localhost:3000/api/admin/export?format=json"
echo "JSON export: $(cat /tmp/export.json | python3 -c 'import json,sys; d=json.load(sys.stdin); print(f"OK - {len(d.get(\"data\",[]))} items")' 2>/dev/null || echo 'FAIL')"
# CSV export
curl -s -o /tmp/export.csv -w "%{http_code}" -b "$COOKIE" "http://localhost:3000/api/admin/export?format=csv"
echo "CSV export: $(head -1 /tmp/export.csv)"
# Markdown export
curl -s -o /tmp/export.md -w "%{http_code}" -b "$COOKIE" "http://localhost:3000/api/admin/export?format=markdown"
echo "Markdown export: $(wc -l < /tmp/export.md) lines"
