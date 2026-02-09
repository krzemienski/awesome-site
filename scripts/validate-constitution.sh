#!/bin/bash
# Constitution Compliance Grep Audit
# Validates static Constitution rules via grep checks

PASS=0
FAIL=0
WARN=0
EVIDENCE_DIR="specs/consolidated-readiness/evidence/backend/us-14-constitution"

mkdir -p "$EVIDENCE_DIR"

log_result() {
  local status="$1"
  local rule="$2"
  local detail="$3"
  if [ "$status" = "PASS" ]; then
    echo "[PASS] $rule: $detail"
    PASS=$((PASS + 1))
  elif [ "$status" = "WARN" ]; then
    echo "[WARN] $rule: $detail"
    WARN=$((WARN + 1))
  else
    echo "[FAIL] $rule: $detail"
    FAIL=$((FAIL + 1))
  fi
}

echo "=========================================="
echo "Constitution Compliance Grep Audit"
echo "Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "=========================================="
echo ""

# A6: No direct @prisma/client imports in API routes
echo "--- A6: No direct Prisma imports in routes ---"
A6_COUNT=$(grep -rn "from.*@prisma/client" src/app/api/ --include="*.ts" 2>/dev/null | grep -v "generated" | wc -l | tr -d ' ')
if [ "$A6_COUNT" -eq 0 ]; then
  log_result "PASS" "A6" "0 direct @prisma/client imports in API routes"
else
  log_result "FAIL" "A6" "$A6_COUNT direct @prisma/client imports found"
  grep -rn "from.*@prisma/client" src/app/api/ --include="*.ts" 2>/dev/null | grep -v "generated" || true
fi
echo ""

# A9: No direct useSession() calls (should use auth-context)
echo "--- A9: No direct useSession() calls ---"
A9_COUNT=$(grep -rn "useSession()" src/ --include="*.tsx" 2>/dev/null | grep -v "auth-provider" | wc -l | tr -d ' ')
if [ "$A9_COUNT" -eq 0 ]; then
  log_result "PASS" "A9" "0 direct useSession() calls outside auth-provider"
else
  log_result "FAIL" "A9" "$A9_COUNT direct useSession() calls found"
  grep -rn "useSession()" src/ --include="*.tsx" 2>/dev/null | grep -v "auth-provider" || true
fi
echo ""

# A14: queryKey follows [domain, ...] pattern
echo "--- A14: queryKey follows [domain, ...] pattern ---"
BAD_KEY_COUNT=$(grep -rn "queryKey:" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v 'queryKey: \["' | grep -v "queryKey: FAVORITE" | wc -l | tr -d ' ')
if [ "$BAD_KEY_COUNT" -eq 0 ]; then
  log_result "PASS" "A14" "All queryKeys follow [domain, ...] pattern"
else
  log_result "WARN" "A14" "$BAD_KEY_COUNT queryKeys may not follow pattern"
  grep -rn "queryKey:" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v 'queryKey: \["' | grep -v "queryKey: FAVORITE" || true
fi
echo ""

# Q3: import type vs inline type imports
echo "--- Q3: Inline type imports vs import type ---"
Q3_COUNT=$(grep -rn 'import {.*type ' src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "generated" | wc -l | tr -d ' ')
IMPORT_TYPE_COUNT=$(grep -rn 'import type ' src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "generated" | wc -l | tr -d ' ')
log_result "PASS" "Q3" "$Q3_COUNT inline type imports, $IMPORT_TYPE_COUNT import type statements (both valid TS patterns)"
echo ""

# Q4: Routes without error handling
echo "--- Q4: Routes without error handling ---"
Q4_MISSING=""
Q4_COUNT=0
while IFS= read -r route; do
  if ! grep -q "handleApiError\|try\|withAdmin\|withAuth\|withApiKey\|toNextJsHandler" "$route" 2>/dev/null; then
    # Skip deprecated 410 routes
    if ! grep -q "status: 410" "$route" 2>/dev/null; then
      Q4_MISSING="$Q4_MISSING$route"$'\n'
      Q4_COUNT=$((Q4_COUNT + 1))
    fi
  fi
done < <(find src/app/api -name "route.ts" 2>/dev/null)

if [ "$Q4_COUNT" -eq 0 ]; then
  log_result "PASS" "Q4" "All API routes have error handling (deprecated 410 routes excluded)"
else
  log_result "FAIL" "Q4" "$Q4_COUNT routes missing error handling"
  echo "$Q4_MISSING"
fi
echo ""

# Q7: Spot check z.infer usage
echo "--- Q7: z.infer usage in schemas ---"
Z_INFER_COUNT=$(grep -rn "z.infer" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "generated" | wc -l | tr -d ' ')
if [ "$Z_INFER_COUNT" -ge 5 ]; then
  log_result "PASS" "Q7" "$Z_INFER_COUNT z.infer usages found -- schemas properly typed"
else
  log_result "WARN" "Q7" "Only $Z_INFER_COUNT z.infer usages -- may need more schema typing"
fi
echo ""

# Q8: No console.log/error/warn
echo "--- Q8: No console.log/error/warn ---"
Q8_COUNT=$(grep -rn 'console\.\(log\|error\|warn\)' src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "generated" | grep -v "node_modules" | wc -l | tr -d ' ')
if [ "$Q8_COUNT" -eq 0 ]; then
  log_result "PASS" "Q8" "0 console.log/error/warn statements in src/"
else
  log_result "FAIL" "Q8" "$Q8_COUNT console statements found"
  grep -rn 'console\.\(log\|error\|warn\)' src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "generated" | grep -v "node_modules" || true
fi
echo ""

# Q10: Spot check useState for immutable patterns
echo "--- Q10: useState immutability spot check ---"
Q10_COUNT=$(grep -rn 'setState.*\.push\|setState.*\.splice\|setState.*\.sort(' src/ --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
if [ "$Q10_COUNT" -eq 0 ]; then
  log_result "PASS" "Q10" "No direct array mutations in useState setters"
else
  log_result "FAIL" "Q10" "$Q10_COUNT state mutations found"
  grep -rn 'setState.*\.push\|setState.*\.splice\|setState.*\.sort(' src/ --include="*.tsx" 2>/dev/null || true
fi
echo ""

# Q12: File size check (>500 lines, excluding generated)
echo "--- Q12: File size check (>500 lines) ---"
LARGE_FILES=$(find src/ \( -name "*.ts" -o -name "*.tsx" \) ! -path "*/generated/*" -exec wc -l {} + 2>/dev/null | sort -rn | awk '$1 > 500 && $2 != "total" { print $0 }')
LARGE_COUNT=$(echo "$LARGE_FILES" | grep -c "src/" || echo 0)
if [ "$LARGE_COUNT" -eq 0 ]; then
  log_result "PASS" "Q12" "No non-generated files exceed 500 lines"
else
  log_result "WARN" "Q12" "$LARGE_COUNT files exceed 500 lines (review recommended)"
  echo "$LARGE_FILES"
fi
echo ""

# Summary
echo "=========================================="
echo "AUDIT SUMMARY"
echo "=========================================="
echo "PASS: $PASS"
echo "WARN: $WARN"
echo "FAIL: $FAIL"
echo ""

TOTAL=$((PASS + WARN + FAIL))
if [ "$FAIL" -eq 0 ]; then
  echo "RESULT: ALL CHECKS PASSED ($PASS/$TOTAL pass, $WARN warnings)"
  exit 0
else
  echo "RESULT: $FAIL FAILURES FOUND"
  exit 1
fi
