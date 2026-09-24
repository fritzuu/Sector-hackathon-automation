import html
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from config import DASHBOARD_URL

TEMPLATE_VERSION = "v1.0.0"

STANDARD_DISCLAIMER = (
    "Pemberitahuan otomatis SIBA (Sistem Informasi Bursa dan Aset) berbasis aturan deterministik dan data resmi Sectors API. "
    "Bukan saran investasi, rekomendasi beli/jual, atau prediksi harga. "
    "Seluruh keputusan investasi merupakan tanggung jawab mandiri investor (DYOR)."
)

STATUS_LABELS = {
    "OPEN": "Kasus Baru",
    "UPDATED": "Pembaruan Kasus Material",
    "CLOSED": "Kasus Ditutup",
    "DATA_INCOMPLETE": "Data Belum Lengkap",
    "MONITORING": "Monitoring (Tidak Ada Perkembangan Baru)"
}

STATUS_ICONS = {
    "OPEN": "🚨",
    "UPDATED": "🔄",
    "CLOSED": "✅",
    "DATA_INCOMPLETE": "⚠️",
    "MONITORING": "👁️"
}

def format_case_message_html(
    symbol: str,
    status: str,
    evaluation_date: Optional[str] = None,
    facts: Optional[List[str]] = None,
    interpretations: Optional[List[str]] = None,
    unknowns: Optional[List[str]] = None,
    detail_url: Optional[str] = None
) -> str:
    """
    Format a case notification strictly following SIBA v1.0.0 deterministic template rules.
    Outputs clean Telegram-compatible HTML.
    """
    eval_date = evaluation_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    status_clean = status.upper().strip()
    status_label = STATUS_LABELS.get(status_clean, status_clean)
    icon = STATUS_ICONS.get(status_clean, "📊")

    facts_list = facts or ["Tidak ada anomali atau filing baru yang terdeteksi pada sesi ini."]
    interp_list = interpretations or ["Seluruh indikator volume dan pergerakan berada dalam rentang normal."]
    unknowns_list = unknowns or [
        "Faktor katalis eksternal, rumor pasar, dan sentimen media sosial di luar data transaksi resmi BEI tidak dipantau.",
        "Dampak fundamental jangka panjang terhadap kinerja keuangan emiten memerlukan riset laporan keuangan mandiri."
    ]

    target_url = detail_url or f"{DASHBOARD_URL}/?ticker={symbol.upper()}"

    lines = [
        f"<b>{icon} [SIBA — {html.escape(symbol.upper())}] Status: {html.escape(status_label)}</b>",
        f"<i>Sesi: {html.escape(eval_date)} | Template Versi {TEMPLATE_VERSION}</i>",
        "",
        "<b>📌 FAKTA (Terverifikasi Data Sectors API):</b>"
    ]

    for f in facts_list:
        lines.append(f"• {html.escape(f)}")

    lines.append("")
    lines.append("<b>🔍 INTERPRETASI TERBATAS (Tanpa Prediksi):</b>")
    for i in interp_list:
        lines.append(f"• {html.escape(i)}")

    lines.append("")
    lines.append("<b>❓ BELUM DIKETAHUI:</b>")
    for u in unknowns_list:
        lines.append(f"• {html.escape(u)}")

    lines.append("")
    lines.append(f"<b>⚠️ DISCLAIMER:</b>\n<i>{html.escape(STANDARD_DISCLAIMER)}</i>")
    lines.append("")
    lines.append(f'🔗 <a href="{target_url}">Lihat detail kasus di Dashboard SIBA →</a>')

    return "\n".join(lines)


def format_case_message_plain(
    symbol: str,
    status: str,
    evaluation_date: Optional[str] = None,
    facts: Optional[List[str]] = None,
    interpretations: Optional[List[str]] = None,
    unknowns: Optional[List[str]] = None
) -> str:
    """Format plain-text representation (useful for logs and console preview)."""
    eval_date = evaluation_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    status_clean = status.upper().strip()
    status_label = STATUS_LABELS.get(status_clean, status_clean)

    facts_list = facts or ["Tidak ada anomali baru yang terdeteksi."]
    interp_list = interpretations or ["Kondisi normal."]
    unknowns_list = unknowns or ["Katalis eksternal tidak dipantau."]

    lines = [
        f"[SIBA — {symbol.upper()}] Status: {status_label} ({eval_date}) [Versi {TEMPLATE_VERSION}]",
        "",
        "📌 FAKTA (Terverifikasi Data Sectors API):",
        *[f"• {f}" for f in facts_list],
        "",
        "🔍 INTERPRETASI TERBATAS (Tanpa Prediksi):",
        *[f"• {i}" for i in interp_list],
        "",
        "❓ BELUM DIKETAHUI:",
        *[f"• {u}" for u in unknowns_list],
        "",
        f"⚠️ DISCLAIMER:\n{STANDARD_DISCLAIMER}"
    ]
    return "\n".join(lines)


def create_sample_alert(ticker: str = "TLKM", status: str = "OPEN") -> Dict[str, Any]:
    """Helper to generate a deterministic sample payload matching PRD §6.3."""
    if status == "OPEN":
        return {
            "symbol": ticker,
            "status": "OPEN",
            "evaluation_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "facts": [
                f"Volume Transaksi: 245.890 lot (2.35x dibanding median 20 sesi bursa: 104.600 lot).",
                f"Divergensi Harga: Return Saham +3.10% vs IHSG +0.40% (Spread: 2.70%).",
                "Keterbukaan Informasi BEI: Belum ditemukan keterbukaan informasi baru pada tanggal evaluasi."
            ],
            "interpretations": [
                "Aktivitas volume transaksi melonjak signifikan di atas batas wajar (≥ 2.0x median 20 hari).",
                "Pergerakan harga saham menyimpang tajam dari tren indeks acuan bursa (selisih ≥ 2.0%)."
            ],
            "unknowns": [
                "Faktor katalis eksternal, rumor pasar, dan sentimen media sosial di luar data transaksi resmi BEI tidak dipantau.",
                "Dampak fundamental jangka panjang memerlukan riset laporan keuangan mandiri."
            ]
        }
    elif status == "CLOSED":
        return {
            "symbol": ticker,
            "status": "CLOSED",
            "evaluation_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "facts": [
                "Volume dan volatilitas telah kembali normal selama 2 sesi bursa berturut-turut.",
                "Selisih pergerakan terhadap IHSG berada dalam rentang wajar (< 2.0%)."
            ],
            "interpretations": [
                "Kondisi anomali yang memicu pembukaan kasus telah mereda sesuai aturan penutupan deterministik."
            ],
            "unknowns": [
                "Perkembangan sentimen dan corporate action mendatang tetap perlu dipantau secara mandiri."
            ]
        }
    else:
        return {
            "symbol": ticker,
            "status": status,
            "evaluation_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "facts": [f"Status pembaruan tercatat untuk ticker {ticker}."],
            "interpretations": ["Evaluasi berkala otomatis oleh SIBA pipeline."],
            "unknowns": ["Data eksternal di luar BEI tidak dipantau."]
        }
