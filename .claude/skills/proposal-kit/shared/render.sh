#!/usr/bin/env bash
# Render a self-contained HTML file to an A4 PDF using headless Chrome.
# Usage: shared/render.sh <input.html> <output.pdf>
set -euo pipefail
IN="${1:?usage: render.sh <input.html> <output.pdf>}"
OUT="${2:?usage: render.sh <input.html> <output.pdf>}"

CHROME=""
for c in \
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  "/Applications/Chromium.app/Contents/MacOS/Chromium" \
  "$(command -v google-chrome || true)" \
  "$(command -v chromium || true)"; do
  if [ -n "$c" ] && [ -x "$c" ]; then CHROME="$c"; break; fi
done
if [ -z "$CHROME" ]; then
  echo "No Chrome/Chromium found. Install Chrome or use the Playwright MCP fallback." >&2
  exit 1
fi

"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$OUT" "file://$(cd "$(dirname "$IN")" && pwd)/$(basename "$IN")"
echo "Wrote $OUT"
