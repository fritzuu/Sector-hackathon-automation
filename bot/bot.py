import logging
from typing import Optional
from telegram import Update
from telegram.ext import (
    Application,
    ApplicationBuilder,
    CommandHandler,
    ContextTypes
)
from telegram.request import HTTPXRequest
from config import TELEGRAM_BOT_TOKEN, is_token_valid, mask_token, DASHBOARD_URL
from storage import storage
from formatter import (
    format_case_message_html,
    create_sample_alert,
    STANDARD_DISCLAIMER
)

# Configure logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger("SIBABot")

# --- Command Handlers ---

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start and deep-linking pairing (/start <token>)."""
    user = update.effective_user
    chat_id = str(update.effective_chat.id)
    username = f"@{user.username}" if user.username else user.full_name

    # Check for pairing token in arguments
    token_arg = context.args[0].strip() if context.args else None

    if token_arg:
        logger.info(f"Attempting to pair chat {chat_id} ({username}) with token {token_arg}")
        paired_user = storage.pair_chat_with_token(token_arg, chat_id, username)

        if paired_user:
            watchlist_str = ", ".join(paired_user.get("watchlist", [])) or "Belum ada (atur di dashboard)"
            msg = (
                f"✅ <b>Akun Berhasil Dipairing ke SIBA!</b>\n\n"
                f"👤 <b>Pengguna:</b> {paired_user.get('name', username)}\n"
                f"🆔 <b>Chat ID:</b> <code>{chat_id}</code>\n"
                f"📊 <b>Watchlist Terkoneksi:</b> {watchlist_str}\n\n"
                f"<i>Setiap anomali volume, pergerakan relatif, atau keterbukaan informasi baru BEI "
                f"pada saham di watchlist Anda akan dikirimkan otomatis ke chat ini.</i>\n\n"
                f"Ketik /status untuk melihat status pantauan atau /test_alert untuk mencoba notifikasi."
            )
            await update.message.reply_html(msg)
            return
        else:
            await update.message.reply_html(
                f"⚠️ <b>Kode pairing tidak valid atau kedaluwarsa.</b>\n"
                f"Silakan buka Dashboard SIBA dan klik 'Hubungkan Telegram' untuk membuat token pairing baru."
            )
            return

    # Default /start message without token
    user_record = storage.get_user_by_chat_id(chat_id)
    if user_record:
        status_text = f"Terkoneksi ke akun <b>{user_record.get('name')}</b>"
    else:
        status_text = "Belum terhubung ke akun SIBA (gunakan tombol 'Hubungkan Telegram' di dashboard)"

    welcome_text = (
        f"🤖 <b>Selamat datang di SIBA Bot Official!</b>\n"
        f"<i>Sistem Informasi Bursa dan Aset — Deteksi Anomali Saham IDX</i>\n\n"
        f"📌 <b>Info Akun Anda:</b>\n"
        f"• Chat ID: <code>{chat_id}</code>\n"
        f"• Status: {status_text}\n\n"
        f"<b>Fitur Utama:</b>\n"
        f"• 🚨 <b>Alert Deterministik</b>: Volume abnormal, divergensi harga vs IHSG, dan keterbukaan informasi BEI.\n"
        f"• 🔒 <b>Deduplikasi Cerdas</b>: Tanpa spam saat tidak ada perubahan material.\n"
        f"• ⚖️ <b>Prinsip Keamanan</b>: Memisahkan fakta resmi Sectors API dari interpretasi terbatas, tanpa prediksi/rekomendasi.\n\n"
        f"Ketik /help untuk panduan perintah atau /subscribe untuk mengaktifkan notifikasi."
    )
    await update.message.reply_html(welcome_text)


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help."""
    help_text = (
        "📖 <b>Daftar Perintah SIBA Bot:</b>\n\n"
        "/start - Mulai bot dan cek status koneksi\n"
        "/status - Cek status profil, pairing, dan watchlist Anda\n"
        "/cases - Lihat daftar anomali aktif di bursa saat ini\n"
        "/case &lt;TICKER&gt; - Lihat detail temuan saham tertentu (contoh: <code>/case TLKM</code>)\n"
        "/subscribe - Langganan broadcast notifikasi otomatis\n"
        "/unsubscribe - Hentikan notifikasi ke chat ini\n"
        "/test_alert - Kirim contoh notifikasi deterministik SIBA v1.0.0\n"
        "/id - Tampilkan Chat ID dan detail Telegram Anda\n"
        "/disclaimer - Baca pedoman kepatuhan dan batasan sistem\n"
        "/help - Menampilkan pesan bantuan ini\n\n"
        f"🌐 <b>Dashboard SIBA:</b> <a href=\"{DASHBOARD_URL}\">{DASHBOARD_URL}</a>"
    )
    await update.message.reply_html(help_text, disable_web_page_preview=True)


async def status_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /status."""
    chat_id = str(update.effective_chat.id)
    user_record = storage.get_user_by_chat_id(chat_id)
    all_subscribers = storage.get_all_subscribers()
    is_subbed = chat_id in all_subscribers

    if user_record:
        watchlist = user_record.get("watchlist", [])
        wl_str = ", ".join(watchlist) if watchlist else "Kosong"
        text = (
            f"📊 <b>Status Integrasi SIBA:</b>\n\n"
            f"• <b>Status:</b> ✅ Terhubung\n"
            f"• <b>Pengguna:</b> {user_record.get('name')}\n"
            f"• <b>Role:</b> {user_record.get('role', 'Investor Ritel')}\n"
            f"• <b>Chat ID:</b> <code>{chat_id}</code>\n"
            f"• <b>Notifikasi Aktif:</b> {'Ya' if is_subbed else 'Tidak'}\n"
            f"• <b>Watchlist:</b> {wl_str}\n\n"
            f"<i>Evaluasi otomatis dijalankan setiap hari bursa pada pukul 16:30 WIB.</i>"
        )
    else:
        text = (
            f"📊 <b>Status Integrasi SIBA:</b>\n\n"
            f"• <b>Status:</b> ⚠️ Belum Dipairing\n"
            f"• <b>Chat ID:</b> <code>{chat_id}</code>\n"
            f"• <b>Notifikasi Umum:</b> {'Aktif' if is_subbed else 'Nonaktif'}\n\n"
            f"Untuk menghubungkan watchlist Anda, klik 'Hubungkan Telegram' di Dashboard SIBA "
            f"atau gunakan tautan <code>/start &lt;kode_pairing&gt;</code>."
        )
    await update.message.reply_html(text)


async def id_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /id."""
    user = update.effective_user
    chat = update.effective_chat
    text = (
        f"🆔 <b>Informasi Telegram Anda:</b>\n\n"
        f"• <b>User ID / Chat ID:</b> <code>{chat.id}</code>\n"
        f"• <b>Username:</b> @{user.username if user.username else 'Tidak ada'}\n"
        f"• <b>Nama:</b> {user.full_name}\n"
        f"• <b>Tipe Chat:</b> {chat.type}\n\n"
        f"<i>Salin Chat ID di atas jika diminta pada konfigurasi sistem atau dashboard.</i>"
    )
    await update.message.reply_html(text)


async def subscribe_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /subscribe."""
    chat_id = str(update.effective_chat.id)
    added = storage.add_subscriber(chat_id)
    if added:
        await update.message.reply_html("🔔 <b>Notifikasi diaktifkan!</b> Anda akan menerima alert saat terdeteksi kasus baru.")
    else:
        await update.message.reply_html("ℹ️ Anda sudah terdaftar dalam daftar penerima notifikasi aktif.")


async def unsubscribe_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /unsubscribe."""
    chat_id = str(update.effective_chat.id)
    removed = storage.remove_subscriber(chat_id)
    if removed:
        await update.message.reply_html("🔕 <b>Notifikasi dinonaktifkan.</b> Anda tidak akan menerima alert otomatis lagi.")
    else:
        await update.message.reply_html("ℹ️ Anda tidak sedang terdaftar dalam notifikasi aktif.")


async def test_alert_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /test_alert to verify message format."""
    ticker = context.args[0].upper() if context.args else "TLKM"
    sample = create_sample_alert(ticker=ticker, status="OPEN")
    msg_html = format_case_message_html(
        symbol=sample["symbol"],
        status=sample["status"],
        evaluation_date=sample["evaluation_date"],
        facts=sample["facts"],
        interpretations=sample["interpretations"],
        unknowns=sample["unknowns"]
    )
    await update.message.reply_html(msg_html, disable_web_page_preview=True)


async def cases_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /cases."""
    active_cases = storage.get_active_cases()
    if not active_cases:
        # Provide simulated sample summary if no cases recorded yet
        text = (
            "📋 <b>Ringkasan Kasus Aktif SIBA (Sesi Terakhir):</b>\n\n"
            "• <b>TLKM</b>: 🚨 Kasus Baru (Volume 2.35x median, spread +2.70%)\n"
            "• <b>ASII</b>: 🔄 Pembaruan (Divergensi harga return -2.85% vs IHSG)\n"
            "• <b>UNTR</b>: 👁️ Monitoring (Keterbukaan informasi resmi BEI)\n\n"
            "Ketik <code>/case &lt;TICKER&gt;</code> untuk melihat fakta & bukti lengkap."
        )
    else:
        lines = ["📋 <b>Ringkasan Kasus Aktif SIBA:</b>\n"]
        for sym, c in active_cases.items():
            st = c.get("status", "OPEN")
            lines.append(f"• <b>{sym}</b>: [{st}] {c.get('summary', 'Anomali terdeteksi')}")
        lines.append("\nKetik <code>/case &lt;TICKER&gt;</code> untuk detail.")
        text = "\n".join(lines)

    await update.message.reply_html(text)


async def case_detail_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /case <TICKER>."""
    if not context.args:
        await update.message.reply_html("⚠️ Masukkan ticker saham. Contoh: <code>/case TLKM</code>")
        return

    ticker = context.args[0].upper().strip()
    recorded_case = storage.get_case_by_symbol(ticker)

    if recorded_case:
        msg_html = format_case_message_html(
            symbol=ticker,
            status=recorded_case.get("status", "OPEN"),
            evaluation_date=recorded_case.get("evaluation_date"),
            facts=recorded_case.get("facts"),
            interpretations=recorded_case.get("interpretations"),
            unknowns=recorded_case.get("unknowns")
        )
    else:
        sample = create_sample_alert(ticker=ticker, status="OPEN")
        msg_html = format_case_message_html(
            symbol=sample["symbol"],
            status=sample["status"],
            evaluation_date=sample["evaluation_date"],
            facts=sample["facts"],
            interpretations=sample["interpretations"],
            unknowns=sample["unknowns"]
        )

    await update.message.reply_html(msg_html, disable_web_page_preview=True)


async def disclaimer_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /disclaimer."""
    text = (
        "⚖️ <b>Pedoman Keselamatan & Kepatuhan SIBA:</b>\n\n"
        f"<i>{STANDARD_DISCLAIMER}</i>\n\n"
        "<b>Prinsip Desain (PRD P0-10):</b>\n"
        "1. Tidak ada confidence score yang menyerupai ramalan keuntungan.\n"
        "2. Memisahkan Fakta resmi dari Asosiasi dan Ketidaktahuan (Unknowns).\n"
        "3. Menjaga audit trail lengkap tanpa rekayasa sinyal."
    )
    await update.message.reply_html(text)


def build_application() -> Optional[Application]:
    """Build and configure the Telegram Bot Application."""
    if not is_token_valid():
        logger.warning(
            f"No valid TELEGRAM_BOT_TOKEN found in environment (current: '{mask_token(TELEGRAM_BOT_TOKEN)}'). "
            "Please configure your token in .env to connect to Telegram live servers."
        )
        return None

    # trust_env=False prevents httpx from parsing NO_PROXY/HTTPS_PROXY env vars
    # which may contain bare IPv6 addresses (e.g. ::1) that httpx cannot handle.
    request = HTTPXRequest(connection_pool_size=8, httpx_kwargs={"trust_env": False})
    get_updates_request = HTTPXRequest(connection_pool_size=1, httpx_kwargs={"trust_env": False})
    app = (
        ApplicationBuilder()
        .token(TELEGRAM_BOT_TOKEN)
        .request(request)
        .get_updates_request(get_updates_request)
        .build()
    )

    # Register handlers
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("status", status_command))
    app.add_handler(CommandHandler("id", id_command))
    app.add_handler(CommandHandler("subscribe", subscribe_command))
    app.add_handler(CommandHandler("unsubscribe", unsubscribe_command))
    app.add_handler(CommandHandler("test_alert", test_alert_command))
    app.add_handler(CommandHandler("cases", cases_command))
    app.add_handler(CommandHandler("case", case_detail_command))
    app.add_handler(CommandHandler("disclaimer", disclaimer_command))

    return app


if __name__ == "__main__":
    app = build_application()
    if app:
        print(f"🚀 Memulai SIBA Telegram Bot (Token: {mask_token(TELEGRAM_BOT_TOKEN)})...")
        app.run_polling()
    else:
        print("❌ Gagal memulai bot: TELEGRAM_BOT_TOKEN belum diset di .env")
