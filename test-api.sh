#!/bin/bash

echo "🔍 ทดสอบ API Endpoint..."
echo ""

API_URL="${NEXT_PUBLIC_API_BASE_URL:-http://localhost:8080}"

echo "API Base URL: $API_URL"
echo ""

echo "📡 ทดสอบ GET /api/public/fruits"
echo "----------------------------------------"
curl -v "$API_URL/api/public/fruits" 2>&1 | head -30
echo ""
echo ""

echo "✅ ถ้าเห็นข้อมูล JSON แสดงว่า API ทำงานถูกต้อง"
echo "❌ ถ้าเห็น connection refused แสดงว่า backend ยังไม่รัน"

