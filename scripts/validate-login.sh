#!/bin/bash
echo "=== Login Validation ==="
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
echo "HTTP Status: $HTTP_CODE"
echo "Response: $BODY" | head -5
if [ "$HTTP_CODE" = "200" ]; then echo "PASS"; else echo "FAIL"; fi
