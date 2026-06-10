#!/usr/bin/env bash
set -euo pipefail

PATCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${1:-$(pwd)}"

copy_file() {
  local rel="$1"
  mkdir -p "${REPO_ROOT}/$(dirname "$rel")"
  cp "${PATCH_ROOT}/${rel}" "${REPO_ROOT}/${rel}"
}

while IFS= read -r rel; do
  [[ -z "$rel" ]] && continue
  [[ "$rel" == "APPLY_STREAM_EVENTS_V2_PATCH.sh" ]] && continue
  [[ "$rel" == "DELETE_FILES.txt" ]] && continue
  [[ "$rel" == "PATCH_FILE_LIST.txt" ]] && continue
  [[ ! -f "${PATCH_ROOT}/${rel}" ]] && continue
  copy_file "$rel"
done < "${PATCH_ROOT}/PATCH_FILE_LIST.txt"

while IFS= read -r rel; do
  [[ -z "$rel" ]] && continue
  rm -f "${REPO_ROOT}/${rel}"
done < "${PATCH_ROOT}/DELETE_FILES.txt"

cat <<MSG
Stream Events V2 patch applied.

Next checks:
  cd ${REPO_ROOT}/backend/services/agent-service
  uv sync
  uv run pytest tests/unit_tests/test_chat_runtime_context.py tests/unit_tests/test_stream_mode_contract.py

  cd ${REPO_ROOT}/frontend
  npm install
  npm run typecheck
  npm run lint
MSG
