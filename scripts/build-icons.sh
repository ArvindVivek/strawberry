#!/usr/bin/env bash
# Renders every icon file from the two SVG sources (docs/web/seo-and-icons.md):
#   assets/icon-source.svg (full bleed) → app/apple-icon.png 180, public/icon-192.png, public/icon-512.png
#   app/icon.svg (rounded tile)         → app/favicon.ico with 16, 32 and 48 px PNGs inside
# Needs rsvg-convert (Homebrew librsvg). Re-run after changing either SVG.
set -euo pipefail
cd "$(dirname "$0")/.."
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

rsvg-convert -w 180 -h 180 assets/icon-source.svg -o app/apple-icon.png
rsvg-convert -w 192 -h 192 assets/icon-source.svg -o public/icon-192.png
rsvg-convert -w 512 -h 512 assets/icon-source.svg -o public/icon-512.png
for s in 16 32 48; do rsvg-convert -w "$s" -h "$s" app/icon.svg -o "$TMP/$s.png"; done

# An .ico is a small directory followed by the images; modern browsers accept PNG entries.
python3 - "$TMP" app/favicon.ico <<'PY'
import struct, sys
tmp, out = sys.argv[1], sys.argv[2]
images = [(s, open(f"{tmp}/{s}.png", "rb").read()) for s in (16, 32, 48)]
data = struct.pack("<HHH", 0, 1, len(images))
offset = 6 + 16 * len(images)
for size, png in images:
    data += struct.pack("<BBBBHHII", size, size, 0, 0, 1, 32, len(png), offset)
    offset += len(png)
open(out, "wb").write(data + b"".join(png for _, png in images))
PY
echo "icons: apple-icon.png, icon-192.png, icon-512.png, favicon.ico (16/32/48)"
