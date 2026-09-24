# SIBA Telegram Bot

Python bot server for SIBA — handles `/start` deep-link pairing, alert delivery, and the webhook bridge used by the Vite frontend.

## Quick start

```bash
cd bot

# 1. Copy env template and fill in your bot token
cp .env.example .env
# Edit .env: set TELEGRAM_BOT_TOKEN=<your token from @BotFather>

# 2. Install deps (only first time)
pip install -r requirements.txt

# 3. Run (bot polling + webhook server on port 8088)
python main.py
```

The bot and webhook server start together. Leave this terminal running while you use the frontend (`npm run dev` in the project root).

## Pairing flow

1. Open the SIBA dashboard → click **Hubungkan Telegram**
2. Click **Mulai Pairing Otomatis** (registers your token with the server)
3. Copy the `/start <token>` command shown in the modal
4. Open Telegram → find `@<your_bot_username>` → send the command
5. The modal auto-detects the link (polls every 3 s) and closes itself

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | ✅ | Token from @BotFather |
| `DEFAULT_CHAT_ID` | optional | Fallback chat to receive alerts without a linked user |
| `WEBHOOK_HOST` | optional | Bind host (default `127.0.0.1`) |
| `WEBHOOK_PORT` | optional | Bind port (default `8088`) |
| `WEBHOOK_SECRET_KEY` | optional | Bearer token for `/api/alert` (leave empty locally) |
| `ENABLE_REPLAY_ALERTS` | optional | Allow replay runs to send Telegram messages (default `false`) |
| `DASHBOARD_URL` | optional | Base URL shown in alert links (default `http://localhost:5173`) |

## Bot commands

| Command | Description |
|---|---|
| `/start <token>` | Pair your chat to a SIBA account |
| `/status` | Show your pairing and watchlist status |
| `/cases` | List current active anomaly cases |
| `/case <TICKER>` | Get full detail for one ticker |
| `/test_alert [TICKER]` | Send a sample deterministic alert |
| `/id` | Show your Telegram Chat ID |
| `/subscribe` / `/unsubscribe` | Opt in/out of broadcasts |
| `/disclaimer` | Read the safety & compliance notice |
| `/help` | Full command list |

## Webhook API (called by the Vite frontend via proxy)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Liveness check |
| `POST` | `/api/alert` | Dispatch a case alert to Telegram |
| `POST` | `/api/pair` | Register a pairing token |
| `GET` | `/api/pair/status?token=…` | Poll pairing completion |
