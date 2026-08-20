#!/usr/bin/env bash
# ============================================================================
#  بررسی سلامت اندپوینت MCP روی سایت زنده
#
#  اجرا روی سرور:
#      bash /opt/psyg/scripts/check-mcp.sh
#
#  توکن را از .env می‌خواند و هیچ‌جا چاپش نمی‌کند — فقط نتیجه‌ی هر تست.
# ============================================================================

set -uo pipefail

ENV_FILE="${ENV_FILE:-/opt/psyg/.env}"
BASE="${BASE:-https://psygstore.shop}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "✖ فایل $ENV_FILE پیدا نشد"
  exit 1
fi

TOKEN=$(grep '^PSYG_MCP_TOKEN=' "$ENV_FILE" | cut -d= -f2-)

if [[ -z "$TOKEN" ]]; then
  echo "✖ PSYG_MCP_TOKEN در $ENV_FILE خالی است"
  exit 1
fi

echo "طول توکن: ${#TOKEN} (باید ۶۴ باشد)"
echo

URL="$BASE/api/mcp/$TOKEN"
pass=0
fail=0

check() {
  local label="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    echo "  ✓ $label ($actual)"
    pass=$((pass + 1))
  else
    echo "  ✖ $label — انتظار $expected، دریافت $actual"
    fail=$((fail + 1))
  fi
}

echo "── احراز هویت ──"
check "توکن جعلی رد می‌شود" "403" \
  "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/mcp/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")"
check "بدون توکن رد می‌شود" "401" \
  "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/mcp")"
check "GET باید ۴۰۵ بدهد" "405" \
  "$(curl -s -o /dev/null -w '%{http_code}' "$URL")"

echo
echo "── پروتکل ──"

INIT_BODY='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"check","version":"1"}}}'

# حالت JSON
init_json=$(curl -s -X POST "$URL" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d "$INIT_BODY")

if grep -q '"protocolVersion"' <<<"$init_json"; then
  echo "  ✓ initialize با پاسخ JSON"
  pass=$((pass + 1))
else
  echo "  ✖ initialize با JSON شکست خورد:"
  echo "    $(head -c 200 <<<"$init_json")"
  fail=$((fail + 1))
fi

# حالت SSE — همان چیزی که کلاینت کلاد می‌خواهد
init_sse=$(curl -s -X POST "$URL" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d "$INIT_BODY")

if grep -q '^event: message' <<<"$init_sse"; then
  echo "  ✓ initialize با پاسخ SSE"
  pass=$((pass + 1))
else
  echo "  ✖ initialize با SSE شکست خورد:"
  echo "    $(head -c 200 <<<"$init_sse")"
  fail=$((fail + 1))
fi

# فهرست ابزارها
tools=$(curl -s -X POST "$URL" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}')

tool_count=$(grep -o '"name"' <<<"$tools" | wc -l)
if [[ "$tool_count" -ge 9 ]]; then
  echo "  ✓ tools/list — $tool_count ابزار"
  pass=$((pass + 1))
else
  echo "  ✖ tools/list — فقط $tool_count ابزار"
  fail=$((fail + 1))
fi

# اجرای یک ابزار
status=$(curl -s -X POST "$URL" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"site_status","arguments":{}}}')

if grep -q '"catalog"' <<<"$status"; then
  echo "  ✓ اجرای ابزار site_status"
  pass=$((pass + 1))
else
  echo "  ✖ اجرای ابزار شکست خورد:"
  echo "    $(head -c 200 <<<"$status")"
  fail=$((fail + 1))
fi

echo
echo "──────────────────────"
echo "موفق: $pass    ناموفق: $fail"

if [[ "$fail" -eq 0 ]]; then
  echo "✓ اندپوینت MCP سالم است و آماده‌ی اتصال"
  exit 0
fi

exit 1
