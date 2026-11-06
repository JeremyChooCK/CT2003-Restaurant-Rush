#!/bin/sh
# Regenerates every stage*.model.js diagram as SVG and PNG (needs Node.js; PNG needs Chrome or Edge).
cd "$(dirname "$0")"
CH="/c/Program Files/Google/Chrome/Application/chrome.exe"
[ -x "$CH" ] || CH="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
for m in stage*.model.js; do
  s=${m%.model.js}
  node render.js "$m" "$s-class-diagram.svg" || exit 1
  size=$(node -e "const m=require('./$m');console.log(m.width+','+m.height)")
  "$CH" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1.5 \
    --screenshot="$(cygpath -w "$PWD/$s-class-diagram.png")" --window-size="$size" \
    "file:///$(cygpath -m "$PWD")/$s-class-diagram.svg" 2>&1 | grep "bytes written"
done
