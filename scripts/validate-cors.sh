#!/bin/bash
echo "=== CORS Validation ==="
# Preflight
echo "--- Preflight OPTIONS ---"
curl -s -D- -X OPTIONS http://localhost:3000/api/resources \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: GET" \
  -H "x-api-key: test-key" 2>/dev/null | head -15
echo ""
# API key request with CORS
echo "--- GET with API key ---"
curl -s -D- "http://localhost:3000/api/resources?limit=1" \
  -H "Origin: https://example.com" \
  -H "x-api-key: test-key" 2>/dev/null | head -15
