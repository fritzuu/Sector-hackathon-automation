#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# SIBA — Start bot + frontend with one command
#   ./start.sh
# ─────────────────────────────────────────────────────────────
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Colours
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

# ── Preflight checks ─────────────────────────────────────────

if [ ! -f "$ROOT/bot/.env" ]; then
  echo -e "${RED}✗ bot/.env not found.${RESET}"
  echo -e "  Run: ${CYAN}cp bot/.env.example bot/.env${RESET} and set TELEGRAM_BOT_TOKEN."
  exit 1
fi

if ! grep -q "TELEGRAM_BOT_TOKEN" "$ROOT/bot/.env" || \
   grep -q 'YOUR_TELEGRAM_BOT_TOKEN' "$ROOT/bot/.env"; then
  echo -e "${YELLOW}⚠ TELEGRAM_BOT_TOKEN looks unset in bot/.env — bot will start in dry-run mode.${RESET}"
fi

# ── Cleanup on exit ──────────────────────────────────────────

BOT_PID=""
VITE_PID=""

cleanup() {
  echo -e "\n${YELLOW}Stopping services…${RESET}"
  [ -n "$BOT_PID" ]  && kill "$BOT_PID"  2>/dev/null
  [ -n "$VITE_PID" ] && kill "$VITE_PID" 2>/dev/null
  wait 2>/dev/null
  echo -e "${GREEN}Done.${RESET}"
}
trap cleanup INT TERM EXIT

# ── Start bot ────────────────────────────────────────────────

echo -e "${CYAN}▶ Starting Telegram bot (bot/main.py)…${RESET}"
cd "$ROOT/bot"
python main.py 2>&1 | sed "s/^/${GREEN}[bot]${RESET} /" &
BOT_PID=$!

# Give the bot a moment to bind port 8088 before Vite starts
sleep 2

# ── Start Vite dev server ────────────────────────────────────

echo -e "${CYAN}▶ Starting Vite dev server…${RESET}"
cd "$ROOT"
npm run dev 2>&1 | sed "s/^/${CYAN}[web]${RESET} /" &
VITE_PID=$!

echo -e "\n${GREEN}✓ Both services running.${RESET}"
echo -e "  Frontend : ${CYAN}http://localhost:3000${RESET}"
echo -e "  Bot API  : ${CYAN}http://localhost:8088/api/health${RESET}"
echo -e "  Press ${YELLOW}Ctrl+C${RESET} to stop both.\n"

# ── Wait for either process to exit ─────────────────────────

wait -n "$BOT_PID" "$VITE_PID" 2>/dev/null || wait
