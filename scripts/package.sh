#!/bin/sh
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
version="$(python3 -c "import json; print(json.load(open('$root/manifest.json'))['version'])")"
stage="$root/dist/pkg"
out="$root/dist/anya-$version.zip"

rm -rf "$stage" "$out"
mkdir -p "$stage/icons" "$stage/shared"

cp "$root/manifest.json" \
   "$root/background.js" \
   "$root/content.js" \
   "$root/intercept.js" \
   "$root/offscreen.html" \
   "$root/offscreen.js" \
   "$root/popup.html" \
   "$root/popup.css" \
   "$root/popup.js" \
   "$root/LICENSE" \
   "$stage"

cp "$root/icons/"*.png "$root/icons/mark.svg" "$stage/icons/"
cp "$root/shared/"*.js "$stage/shared/"

# ZIP must have manifest.json at the root, not inside a folder.
(cd "$stage" && zip -r -X "$out" .)
rm -rf "$stage"

python3 - <<PY
import zipfile
z = zipfile.ZipFile("$out")
names = z.namelist()
assert "manifest.json" in names, names[:10]
print("Wrote $out")
print("\n".join(sorted(names)))
PY
