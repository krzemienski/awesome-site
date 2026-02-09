#!/bin/bash
echo "=== API Versioning Validation ==="
echo "--- /api/resources ---"
R1=$(curl -s "http://localhost:3000/api/resources?limit=1" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('meta',{}).get('total','N/A'))")
echo "Direct: total=$R1"
echo "--- /api/v1/resources ---"
R2=$(curl -s -D- "http://localhost:3000/api/v1/resources?limit=1" 2>/dev/null)
echo "Headers: $(echo "$R2" | grep -i 'x-api-version')"
BODY=$(echo "$R2" | tail -1)
R2_TOTAL=$(echo "$BODY" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('meta',{}).get('total','N/A'))" 2>/dev/null)
echo "Versioned: total=$R2_TOTAL"
if [ "$R1" = "$R2_TOTAL" ]; then echo "PASS: Responses match"; else echo "FAIL: Mismatch $R1 vs $R2_TOTAL"; fi
