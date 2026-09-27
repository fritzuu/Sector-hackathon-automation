import json
import argparse
import asyncio
import httpx
from datetime import datetime, timezone
from config import TELEGRAM_BOT_TOKEN, DEFAULT_CHAT_ID, is_token_valid
from formatter import (
    format_case_message_html,
    format_case_message_plain,
    create_sample_alert
)
from storage import storage

async def dispatch_via_telegram_api(chat_id: str, html_content: str):
    """Directly send HTML via Telegram Bot API."""
    if not is_token_valid():
        print("[DRY RUN - Token belum diisi di .env]")
        print("Teks yang akan dikirim:")
        print(html_content)
        return

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": html_content,
        "parse_mode": "HTML",
        "disable_web_page_preview": True
    }
    async with httpx.AsyncClient(timeout=10.0, trust_env=False) as client:
        resp = await client.post(url, json=payload)
        if resp.is_success:
            print(f"✅ Berhasil dikirim ke Chat ID {chat_id}")
        else:
            print(f"❌ Gagal mengirim ke {chat_id}: {resp.status_code} - {resp.text}")

def main():
    parser = argparse.ArgumentParser(description="SIBA Telegram Alert CLI Dispatcher")
    parser.add_argument("--ticker", "-t", type=str, help="Ticker saham IDX (contoh: TLKM, BBCA, ASII)")
    parser.add_argument("--status", "-s", type=str, default="OPEN", choices=["OPEN", "UPDATED", "CLOSED", "DATA_INCOMPLETE", "MONITORING"], help="Status kasus")
    parser.add_argument("--chat-id", "-c", type=str, help="Target chat ID penerima (opsional)")
    parser.add_argument("--sample", nargs="?", const="TLKM", default=None, help="Kirim sample alert deterministik (opsional: nama ticker, default TLKM)")
    parser.add_argument("--dry-run", action="store_true", help="Tampilkan pesan yang diformat tanpa mengirim ke API")
    parser.add_argument("--json", dest="json_payload", type=str, help="Payload JSON lengkap")
    parser.add_argument("--fact", action="append", help="Tambah baris fakta (bisa lebih dari satu)")
    parser.add_argument("--interp", action="append", help="Tambah baris interpretasi terbatas")
    parser.add_argument("--unknown", action="append", help="Tambah baris belum diketahui")

    args = parser.parse_args()

    # If --sample requested
    if args.sample is not None:
        ticker = (args.ticker or args.sample or "TLKM").upper()
        sample = create_sample_alert(ticker=ticker, status=args.status)
        ticker = sample["symbol"]
        status = sample["status"]
        date = sample["evaluation_date"]
        facts = sample["facts"]
        interps = sample["interpretations"]
        unknowns = sample["unknowns"]
    elif args.json_payload:
        data = json.loads(args.json_payload)
        ticker = data.get("symbol", "UNKNOWN").upper()
        status = data.get("status", "OPEN")
        date = data.get("evaluation_date", datetime.now(timezone.utc).strftime("%Y-%m-%d"))
        facts = data.get("facts", [])
        interps = data.get("interpretations", [])
        unknowns = data.get("unknowns", [])
    elif args.ticker:
        ticker = args.ticker.upper()
        status = args.status
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        facts = args.fact or [f"Aktivitas anomali terdeteksi pada saham {ticker}"]
        interps = args.interp or ["Parameter melewati ambang batas deterministik."]
        unknowns = args.unknown or ["Katalis eksternal dan rumor pasar tidak dipantau."]
    else:
        # Default test
        print("💡 Menjalankan alert sample TLKM secara default (gunakan --help untuk opsi lengkap).")
        sample = create_sample_alert("TLKM", "OPEN")
        ticker = sample["symbol"]
        status = sample["status"]
        date = sample["evaluation_date"]
        facts = sample["facts"]
        interps = sample["interpretations"]
        unknowns = sample["unknowns"]

    plain_output = format_case_message_plain(ticker, status, date, facts, interps, unknowns)
    html_output = format_case_message_html(ticker, status, date, facts, interps, unknowns)

    if args.dry_run:
        print("=" * 60)
        print("PREVIEW PESAN TELEGRAM (PLAIN TEXT)")
        print("=" * 60)
        print(plain_output)
        print("=" * 60)
        return

    # Determine recipients
    recipients = []
    if args.chat_id:
        recipients = [args.chat_id]
    elif DEFAULT_CHAT_ID:
        recipients = [DEFAULT_CHAT_ID]
    else:
        recipients = storage.get_all_subscribers()

    if not recipients:
        print("⚠️ Tidak ada Chat ID tujuan. Menampilkan pesan dalam mode dry-run:")
        print(plain_output)
        print("\nℹ️ Daftarkan subscriber dengan menjalankan bot dan mengetik /subscribe, atau gunakan --chat-id.")
        return

    print(f"Mengirim notifikasi {ticker} [{status}] ke {len(recipients)} penerima...")
    for cid in recipients:
        asyncio.run(dispatch_via_telegram_api(cid, html_output))

if __name__ == "__main__":
    main()
