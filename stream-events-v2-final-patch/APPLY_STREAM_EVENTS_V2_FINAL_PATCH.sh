#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$(pwd)}"
PATCH_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

copy_file() {
  local rel="$1"
  mkdir -p "$ROOT/$(dirname "$rel")"
  cp "$PATCH_DIR/$rel" "$ROOT/$rel"
}

while IFS= read -r rel; do
  [[ -z "$rel" || "$rel" == \#* ]] && continue
  copy_file "$rel"
done < "$PATCH_DIR/PATCH_FILE_LIST.txt"

while IFS= read -r rel; do
  [[ -z "$rel" || "$rel" == \#* ]] && continue
  rm -f "$ROOT/$rel"
done < "$PATCH_DIR/DELETE_FILES.txt"

echo "[stream-events-v2-final-patch] applied to $ROOT"
