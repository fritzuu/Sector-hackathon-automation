import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory
BASE_DIR = Path(__file__).resolve().parent

# Load .env if present (bot/.env first, then root .env)
ENV_PATH = BASE_DIR / ".env"
if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)
ROOT_ENV_PATH = BASE_DIR.parent / ".env"
if ROOT_ENV_PATH.exists():
    load_dotenv(dotenv_path=ROOT_ENV_PATH)
load_dotenv()

# Settings
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
DEFAULT_CHAT_ID = os.getenv("DEFAULT_CHAT_ID", "").strip()
WEBHOOK_HOST = os.getenv("WEBHOOK_HOST", "127.0.0.1").strip()
WEBHOOK_PORT = int(os.getenv("WEBHOOK_PORT", "8088"))
WEBHOOK_SECRET_KEY = os.getenv("WEBHOOK_SECRET_KEY", "").strip()
ENABLE_REPLAY_ALERTS = os.getenv("ENABLE_REPLAY_ALERTS", "false").lower() in ("true", "1", "yes")
STORAGE_FILE = Path(os.getenv("STORAGE_FILE", str(BASE_DIR / "data" / "storage.json")))
DASHBOARD_URL = os.getenv("DASHBOARD_URL", "http://localhost:5173").rstrip("/")
SUPABASE_URL = (os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL", "")).strip()
SUPABASE_KEY = (os.getenv("SUPABASE_KEY") or os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY", "")).strip()

def mask_token(token: str) -> str:
    """Safely mask tokens to avoid leaking credentials in logs."""
    if not token or len(token) < 10:
        return "<NOT_SET>"
    return f"{token[:4]}...{token[-4:]}"

def is_token_valid() -> bool:
    """Check if a real Telegram Bot Token has been provided."""
    return bool(TELEGRAM_BOT_TOKEN and TELEGRAM_BOT_TOKEN != "YOUR_TELEGRAM_BOT_TOKEN" and ":" in TELEGRAM_BOT_TOKEN)
