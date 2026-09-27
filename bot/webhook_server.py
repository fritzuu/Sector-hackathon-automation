import logging
import httpx
from aiohttp import web
from typing import Dict, Any
from config import (
    TELEGRAM_BOT_TOKEN,
    DEFAULT_CHAT_ID,
    WEBHOOK_HOST,
    WEBHOOK_PORT,
    WEBHOOK_SECRET_KEY,
    ENABLE_REPLAY_ALERTS,
    is_token_valid,
    mask_token
)
from storage import storage
from formatter import (
    format_case_message_html,
    format_case_message_plain
)

logger = logging.getLogger("SIBAWebhook")

async def send_telegram_message(chat_id: str, html_text: str) -> Dict[str, Any]:
    """Send an HTML message to Telegram API using httpx."""
    if not is_token_valid():
        logger.info(f"[DRY RUN / NO TOKEN] Simulated send to chat {chat_id}:\n{html_text[:120]}...")
        return {"ok": True, "dry_run": True, "chat_id": chat_id}

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": html_text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.post(url, json=payload)
            data = resp.json()
            if not resp.is_success:
                logger.error(f"Failed to send to Telegram chat {chat_id}: {resp.status_code} - {data}")
            return data
        except Exception as e:
            logger.error(f"Exception calling Telegram API: {e}")
            return {"ok": False, "error": str(e)}


async def handle_health(request: web.Request) -> web.Response:
    """GET /api/health"""
    return web.json_response({
        "status": "healthy",
        "service": "SIBA Telegram Automation Bridge",
        "version": "1.0.0",
        "bot_token_configured": is_token_valid(),
        "masked_token": mask_token(TELEGRAM_BOT_TOKEN),
        "subscribers_count": len(storage.get_all_subscribers()),
        "replay_alerts_enabled": ENABLE_REPLAY_ALERTS
    })


async def handle_pair_register(request: web.Request) -> web.Response:
    """POST /api/pair - Register pairing token created on web UI."""
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "Invalid JSON body"}, status=400)

    token = body.get("token")
    user_id = body.get("user_id", f"usr-{token[:8] if token else 'unknown'}")
    name = body.get("name", "User")
    watchlist = body.get("watchlist", [])

    if not token:
        return web.json_response({"error": "Missing 'token'"}, status=400)

    record = storage.register_pairing_token(token, user_id, name, watchlist)
    return web.json_response({"status": "registered", "user": record})


async def handle_pair_status(request: web.Request) -> web.Response:
    """GET /api/pair/status?token=... - Poll status of a pairing token."""
    token = request.query.get("token")
    if not token:
        return web.json_response({"error": "Query param 'token' is required"}, status=400)

    user = storage.get_user_by_token(token)
    if not user:
        return web.json_response({"found": False, "linked": False}, status=404)

    return web.json_response({
        "found": True,
        "linked": user.get("is_linked", False),
        "chat_id": user.get("telegram_chat_id"),
        "username": user.get("telegram_username"),
        "user_name": user.get("name")
    })


async def handle_send_alert(request: web.Request) -> web.Response:
    """POST /api/alert - Dispatch case alert to Telegram."""
    # Optional Secret Key validation
    if WEBHOOK_SECRET_KEY:
        auth_header = request.headers.get("Authorization", "")
        if auth_header != f"Bearer {WEBHOOK_SECRET_KEY}":
            return web.json_response({"error": "Unauthorized"}, status=401)

    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "Invalid JSON body"}, status=400)

    symbol = data.get("symbol", "").upper().strip()
    status = data.get("status", "OPEN").upper().strip()
    is_replay = data.get("is_replay", False)

    if not symbol:
        return web.json_response({"error": "Missing required field 'symbol'"}, status=400)

    # PRD P0-09 Guardrail: Replay isolation
    if is_replay and not ENABLE_REPLAY_ALERTS:
        logger.info(f"Ignored alert for {symbol} because it is a historical replay (PRD P0-09 guardrail)")
        return web.json_response({
            "status": "ignored",
            "reason": "Replay data is strictly isolated from production Telegram alerts (PRD P0-09)"
        })

    # Deduplication Guard: Do not re-send on unchanged MONITORING status
    if status == "MONITORING":
        logger.info(f"Skipped notification for {symbol} with MONITORING status (no material change)")
        return web.json_response({
            "status": "skipped",
            "reason": "Monitoring status contains no material changes (deduplication)"
        })

    evaluation_date = data.get("evaluation_date")
    facts = data.get("facts")
    interpretations = data.get("interpretations")
    unknowns = data.get("unknowns")
    detail_url = data.get("detail_url")

    # Render HTML message
    html_msg = format_case_message_html(
        symbol=symbol,
        status=status,
        evaluation_date=evaluation_date,
        facts=facts,
        interpretations=interpretations,
        unknowns=unknowns,
        detail_url=detail_url
    )

    # Record case in persistent store
    storage.record_case_event(symbol, {
        "status": status,
        "evaluation_date": evaluation_date,
        "facts": facts,
        "interpretations": interpretations,
        "unknowns": unknowns
    })

    # Determine recipients
    target_chat_id = data.get("target_chat_id")
    recipients = []

    if target_chat_id:
        recipients = [str(target_chat_id)]
    else:
        # Check if users have this symbol in their watchlist
        data_store = storage._load()
        matched_users = [
            u.get("telegram_chat_id")
            for u in data_store.get("users", {}).values()
            if u.get("is_linked") and u.get("telegram_chat_id") and (
                symbol in u.get("watchlist", []) or not u.get("watchlist")
            )
        ]
        recipients = list(set([str(cid) for cid in matched_users if cid]))

        # If no specific watchlist match, broadcast to subscribers or default chat
        if not recipients:
            subscribers = storage.get_all_subscribers()
            if subscribers:
                recipients = subscribers
            elif DEFAULT_CHAT_ID:
                recipients = [DEFAULT_CHAT_ID]

    if not recipients:
        logger.warning(f"No recipients found for alert {symbol}. Register a subscriber or set DEFAULT_CHAT_ID.")
        return web.json_response({
            "status": "warning",
            "message": "Alert formatted and recorded, but no active Telegram subscribers to receive it.",
            "formatted_preview": format_case_message_plain(symbol, status, evaluation_date, facts, interpretations, unknowns)
        })

    # Dispatch to all target recipients
    results = []
    for cid in recipients:
        res = await send_telegram_message(cid, html_msg)
        results.append({"chat_id": cid, "result": res})

    return web.json_response({
        "status": "dispatched",
        "symbol": symbol,
        "case_status": status,
        "recipients_count": len(recipients),
        "results": results
    })


def create_webhook_app() -> web.Application:
    """Create and configure the aiohttp web application."""
    app = web.Application()
    app.router.add_get("/api/health", handle_health)
    app.router.add_post("/api/alert", handle_send_alert)
    app.router.add_post("/api/pair", handle_pair_register)
    app.router.add_get("/api/pair/status", handle_pair_status)
    return app


if __name__ == "__main__":
    app = create_webhook_app()
    print(f"🚀 Menjalankan Webhook Server di http://{WEBHOOK_HOST}:{WEBHOOK_PORT}...")
    web.run_app(app, host=WEBHOOK_HOST, port=WEBHOOK_PORT)
