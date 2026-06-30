#!/usr/bin/env bash
# trend 자동 갱신 cron을 중복 없이 설치하고, cron 실행 진입점도 함께 제공한다.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CRON_BEGIN="# BEGIN market-fit trend-refresh"
CRON_END="# END market-fit trend-refresh"
CRON_SCHEDULE="${TREND_REFRESH_CRON_SCHEDULE:-0 4 * * 1}"
LOG_FILE="${TREND_REFRESH_LOG_FILE:-$ROOT_DIR/.local/logs/trend-refresh-cron.log}"

run_refresh() {
  cd "$ROOT_DIR"

  local current_year
  local current_month
  current_year="$(date +%Y)"
  current_month="$(date +%m)"

  docker compose --env-file .env -f compose/backend-public-stack.yml run --rm trend-service sh -c \
    "python -m app.fetch --year $current_year --month $current_month && python -m app.batch"
}

install_cron() {
  mkdir -p "$(dirname "$LOG_FILE")"

  local script_path
  script_path="$ROOT_DIR/scripts/install-trend-refresh-cron.sh"

  local cron_command
  cron_command="cd $ROOT_DIR && /usr/bin/env bash $script_path run >> $LOG_FILE 2>&1"

  local current_cron
  current_cron="$(mktemp)"
  crontab -l 2>/dev/null > "$current_cron" || true

  local next_cron
  next_cron="$(mktemp)"
  awk -v begin="$CRON_BEGIN" -v end="$CRON_END" '
    $0 == begin { skip = 1; next }
    $0 == end { skip = 0; next }
    skip != 1 { print }
  ' "$current_cron" > "$next_cron"

  {
    cat "$next_cron"
    if [[ -s "$next_cron" ]]; then
      printf "\n"
    fi
    printf "%s\n" "$CRON_BEGIN"
    printf "%s %s\n" "$CRON_SCHEDULE" "$cron_command"
    printf "%s\n" "$CRON_END"
  } | crontab -

  rm -f "$current_cron" "$next_cron"

  echo "trend 자동 갱신 cron 설치 완료: $CRON_SCHEDULE"
  crontab -l | sed -n "/$CRON_BEGIN/,/$CRON_END/p"
}

case "${1:-install}" in
  install)
    install_cron
    ;;
  run)
    run_refresh
    ;;
  *)
    echo "사용법: $0 [install|run]" >&2
    exit 2
    ;;
esac
