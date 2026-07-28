#!/usr/bin/env bash
set -e

MODE="${1:-start}"
case "$MODE" in
  start|--install-only) ;;
  *) echo "Usage: $0 [--install-only]" >&2; exit 2 ;;
esac

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

_pid=$(ss -tlnp sport = :5173 2>/dev/null | grep -oP 'pid=\K[0-9]+' | head -1)
if [ -n "$_pid" ]; then kill -9 "$_pid" 2>/dev/null || true; fi
sleep 0.2

mkdir -p "$ROOT_DIR/logs"
ts() { date '+%Y-%m-%d %H:%M:%S'; }
LOG="$ROOT_DIR/logs/frontend.log"
PIDFILE="$ROOT_DIR/logs/frontend.pid"
trap 'ec=$?; echo "[$(ts)] failed (exit=$ec)"; tail -20 "$LOG" 2>/dev/null || true; exit $ec' ERR

SUPABASE_ENV_FILE="$ROOT_DIR/supabase/functions/.env"
if [ ! -f "$SUPABASE_ENV_FILE" ]; then
  # Fallback: workspace-level supabase directory
  SUPABASE_ENV_FILE="/workspace/supabase/functions/.env"
fi
if [ -f "$SUPABASE_ENV_FILE" ]; then
  while IFS='=' read -r _k _v || [ -n "$_k" ]; do
    case "$_k" in ''|\#*) continue ;; esac
    _v="${_v%\"}"; _v="${_v#\"}"
    _v="${_v%\'}"; _v="${_v#\'}"
    case "$_k" in
      SUPABASE_URL) export VITE_SUPABASE_URL="$_v" ;;
      SUPABASE_ANON_KEY) export VITE_SUPABASE_ANON_KEY="$_v" ;;
    esac
  done < "$SUPABASE_ENV_FILE"
fi

cd "$ROOT_DIR/frontend"
INSTALL_PERFORMED=0
DEPS_HELPER="${AUTOAGENT_FRONTEND_DEPS_HELPER:-/usr/local/bin/autoagent-frontend-deps}"
if [ -n "${AUTOAGENT_FRONTEND_NODE_MODULES_DIR:-}" ] && [ -x "$DEPS_HELPER" ]; then
  DEPS_STATUS="$("$DEPS_HELPER" 2>> "$LOG")"
  case "$DEPS_STATUS" in
    local_hit) ;;
    snapshot_hit|installed) INSTALL_PERFORMED=1 ;;
    *) echo "[$(ts)] invalid dependency helper status=$DEPS_STATUS" >> "$LOG"; exit 1 ;;
  esac
else
  INSTALL_STAMP="node_modules/.autoagent-pnpm-install.stamp"
  deps_sig() {
    { printf 'pnpm=%s\n' "$(pnpm --version)"; [ -f package.json ] && sha256sum package.json; [ -f pnpm-lock.yaml ] && sha256sum pnpm-lock.yaml; } | sha256sum | awk '{print $1}'
  }
  DEPS_SIG="$(deps_sig)"
  if [ ! -d node_modules ] || [ ! -x node_modules/.bin/vite ] || [ ! -f "$INSTALL_STAMP" ] || [ "$(cat "$INSTALL_STAMP" 2>/dev/null || true)" != "$DEPS_SIG" ]; then
    echo "[$(ts)] pnpm install start" >> "$LOG"
    pnpm install --frozen-lockfile=false --reporter=silent >> "$LOG" 2>&1
    printf '%s\n' "$(deps_sig)" > "$INSTALL_STAMP"
    INSTALL_PERFORMED=1
  else
    echo "[$(ts)] pnpm install skipped (dependency cache valid)" >> "$LOG"
  fi
fi

if [ "$MODE" = "--install-only" ]; then
  trap - ERR
  echo "[$(ts)] dependencies ready"
  exit 0
fi

if [ "$INSTALL_PERFORMED" -eq 0 ] && curl -fs -o /dev/null http://127.0.0.1:5173/; then
  trap - ERR
  echo "[$(ts)] already up"
  exit 0
fi

nohup stdbuf -oL -eL pnpm run dev -- --host 0.0.0.0 --port 5173 --strictPort </dev/null >> "$LOG" 2>&1 &
PID=$!
disown
echo "$PID" > "$PIDFILE"
trap - ERR
for i in $(seq 1 100); do
  if curl -fs -o /dev/null http://127.0.0.1:5173/; then echo "[$(ts)] up pid=$PID"; exit 0; fi
  if ! kill -0 "$PID" 2>/dev/null; then tail -20 "$LOG" || true; exit 1; fi
  sleep 0.3
done
tail -20 "$LOG" || true
exit 1
