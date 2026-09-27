import asyncio
import logging
import signal
from aiohttp import web
from config import (
    TELEGRAM_BOT_TOKEN,
    WEBHOOK_HOST,
    WEBHOOK_PORT,
    is_token_valid,
    mask_token
)
from bot import build_application
from webhook_server import create_webhook_app

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger("SIBAMain")

async def run_services():
    # Setup webhook server runner
    webhook_app = create_webhook_app()
    runner = web.AppRunner(webhook_app)
    await runner.setup()
    site = web.TCPSite(runner, WEBHOOK_HOST, WEBHOOK_PORT)
    await site.start()
    logger.info(f"🌐 SIBA Webhook Receiver aktif di http://{WEBHOOK_HOST}:{WEBHOOK_PORT}")

    stop_event = asyncio.Event()

    # Graceful shutdown handler
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, lambda: stop_event.set())
        except (NotImplementedError, RuntimeError):
            pass

    if is_token_valid():
        bot_app = build_application()
        logger.info(f"🤖 Memulai SIBA Telegram Bot Polling (Token: {mask_token(TELEGRAM_BOT_TOKEN)})...")
        async with bot_app:
            await bot_app.initialize()
            await bot_app.start()
            await bot_app.updater.start_polling()
            logger.info("✅ SIBA Bot & Webhook berhasil berjalan bersamaan!")
            await stop_event.wait()
            logger.info("Menghentikan bot updater...")
            await bot_app.updater.stop()
            await bot_app.stop()
    else:
        logger.warning(
            "⚠️ TELEGRAM_BOT_TOKEN belum dikonfigurasi di .env. "
            "Webhook server tetap aktif untuk menerima data dari Sector-hackathon-automation."
        )
        await stop_event.wait()

    # Cleanup webhook runner
    await runner.cleanup()
    logger.info("Layanan dihentikan dengan aman.")

def main():
    try:
        asyncio.run(run_services())
    except (KeyboardInterrupt, SystemExit):
        print("\n👋 Layanan SIBA Telebot dimatikan.")

if __name__ == "__main__":
    main()
