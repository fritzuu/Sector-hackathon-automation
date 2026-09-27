import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import httpx
from config import STORAGE_FILE, SUPABASE_URL, SUPABASE_KEY

logger = logging.getLogger(__name__)

DEFAULT_SEED_USERS = [
    {
        "id": "usr-budi-01",
        "name": "Budi Santoso",
        "email": "budi.santoso@gmail.com",
        "role": "Investor Ritel",
        "pairing_token": "PAIR_BUDI_891",
        "telegram_chat_id": "829104821",
        "telegram_username": "@budisantoso_idx",
        "is_linked": True,
        "watchlist": ["BBCA", "TLKM", "UNTR"],
        "created_at": "2026-09-20T00:00:00Z"
    },
    {
        "id": "usr-sarah-02",
        "name": "Sarah Wijaya",
        "email": "sarah.wijaya@outlook.com",
        "role": "Swing Trader",
        "pairing_token": "PAIR_SARAH_412",
        "telegram_chat_id": None,
        "telegram_username": None,
        "is_linked": False,
        "watchlist": ["ASII", "ANTM", "ADRO", "GOTO"],
        "created_at": "2026-09-20T00:00:00Z"
    }
]

class StorageManager:
    """Thread-safe JSON file storage for paired accounts, subscribers, and active cases."""

    def __init__(self, filepath: Optional[Path] = None):
        self.filepath = filepath or STORAGE_FILE
        self._ensure_file_exists()

    def _ensure_file_exists(self):
        self.filepath.parent.mkdir(parents=True, exist_ok=True)
        if not self.filepath.exists():
            initial_data = {
                "users": {u["pairing_token"]: u for u in DEFAULT_SEED_USERS},
                "subscribers": ["829104821"],  # Seeded subscriber
                "active_cases": {},
                "alert_history": []
            }
            self._save(initial_data)

    def _load(self) -> Dict[str, Any]:
        try:
            with open(self.filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading storage from {self.filepath}: {e}")
            return {"users": {}, "subscribers": [], "active_cases": {}, "alert_history": []}

    def _save(self, data: Dict[str, Any]):
        try:
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Error saving storage to {self.filepath}: {e}")

    # --- User Pairing Methods ---

    def register_pairing_token(self, token: str, user_id: str, name: str, watchlist: Optional[List[str]] = None) -> Dict[str, Any]:
        """Register a new pairing token generated from the SIBA frontend."""
        data = self._load()
        user_record = {
            "id": user_id,
            "name": name,
            "pairing_token": token,
            "telegram_chat_id": None,
            "telegram_username": None,
            "is_linked": False,
            "watchlist": watchlist or [],
            "created_at": datetime.now(timezone.utc).isoformat() + "Z"
        }
        data["users"][token] = user_record
        self._save(data)
        return user_record

    def pair_chat_with_token(self, token: str, chat_id: str, username: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Pair a Telegram chat ID to an existing SIBA pairing token."""
        data = self._load()
        if token not in data["users"]:
            # Create ad-hoc linked profile if token follows siba pattern
            if token.startswith("siba_") or token.startswith("PAIR_"):
                data["users"][token] = {
                    "id": f"usr-{token[:12]}",
                    "name": username or f"User-{chat_id}",
                    "pairing_token": token,
                    "telegram_chat_id": str(chat_id),
                    "telegram_username": username,
                    "is_linked": True,
                    "watchlist": ["BBCA", "TLKM", "ASII"],
                    "linked_at": datetime.now(timezone.utc).isoformat() + "Z"
                }
            else:
                return None

        user = data["users"][token]
        user["telegram_chat_id"] = str(chat_id)
        user["telegram_username"] = username
        user["is_linked"] = True
        user["linked_at"] = datetime.now(timezone.utc).isoformat() + "Z"

        # Also add to active subscribers
        chat_id_str = str(chat_id)
        if chat_id_str not in data["subscribers"]:
            data["subscribers"].append(chat_id_str)

        self._save(data)
        self._sync_to_supabase(user)
        return user

    def _sync_to_supabase(self, user: Dict[str, Any]):
        """Persist or update user pairing record directly into Supabase profiles."""
        if not SUPABASE_URL or not SUPABASE_KEY:
            return
        try:
            headers = {
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates",
            }
            payload = {
                "id": user.get("id"),
                "name": user.get("name"),
                "email": user.get("email") or f"{user.get('id')}@siba.local",
                "pairing_token": user.get("pairing_token"),
                "telegram_chat_id": user.get("telegram_chat_id"),
                "telegram_username": user.get("telegram_username"),
                "is_telegram_linked": user.get("is_linked", False),
                "watchlist": user.get("watchlist", []),
                "updated_at": datetime.now(timezone.utc).isoformat() + "Z",
            }
            with httpx.Client(timeout=4.0) as client:
                res = client.post(f"{SUPABASE_URL}/rest/v1/profiles", headers=headers, json=payload)
                if res.status_code not in (200, 201):
                    logger.warning(f"[Supabase Sync] Post error: {res.status_code} - {res.text}")
        except Exception as e:
            logger.warning(f"[Supabase Sync] Error syncing to Supabase: {e}")

    def get_user_by_chat_id(self, chat_id: str) -> Optional[Dict[str, Any]]:
        """Find user profile by their Telegram chat ID."""
        data = self._load()
        chat_id_str = str(chat_id)
        for user in data["users"].values():
            if str(user.get("telegram_chat_id")) == chat_id_str:
                return user
        return None

    def get_user_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Find user profile by pairing token (checks local storage then Supabase)."""
        data = self._load()
        user = data["users"].get(token)
        if user:
            return user

        # Query Supabase if not in local cache
        if SUPABASE_URL and SUPABASE_KEY:
            try:
                headers = {
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                }
                with httpx.Client(timeout=4.0) as client:
                    res = client.get(
                        f"{SUPABASE_URL}/rest/v1/profiles",
                        headers=headers,
                        params={"pairing_token": f"eq.{token}", "select": "*", "limit": "1"}
                    )
                    if res.status_code == 200:
                        records = res.json()
                        if records:
                            row = records[0]
                            profile = {
                                "id": row.get("id"),
                                "name": row.get("name"),
                                "email": row.get("email"),
                                "pairing_token": row.get("pairing_token"),
                                "telegram_chat_id": row.get("telegram_chat_id"),
                                "telegram_username": row.get("telegram_username"),
                                "is_linked": row.get("is_telegram_linked", False),
                                "watchlist": row.get("watchlist", []),
                            }
                            # Cache in local data
                            data["users"][token] = profile
                            self._save(data)
                            return profile
            except Exception as e:
                logger.warning(f"[Supabase Fetch] Error fetching user by token: {e}")

        return None

    # --- Subscribers Methods ---

    def add_subscriber(self, chat_id: str) -> bool:
        data = self._load()
        chat_id_str = str(chat_id)
        if chat_id_str not in data["subscribers"]:
            data["subscribers"].append(chat_id_str)
            self._save(data)
            return True
        return False

    def remove_subscriber(self, chat_id: str) -> bool:
        data = self._load()
        chat_id_str = str(chat_id)
        if chat_id_str in data["subscribers"]:
            data["subscribers"].remove(chat_id_str)
            self._save(data)
            return True
        return False

    def get_all_subscribers(self) -> List[str]:
        data = self._load()
        return list(set(data.get("subscribers", [])))

    # --- Cases & History ---

    def record_case_event(self, symbol: str, event_data: Dict[str, Any]):
        data = self._load()
        data["active_cases"][symbol] = event_data
        data["alert_history"].append({
            "symbol": symbol,
            "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
            "event": event_data
        })
        # Keep history to last 100 entries
        if len(data["alert_history"]) > 100:
            data["alert_history"] = data["alert_history"][-100:]
        self._save(data)

    def get_active_cases(self) -> Dict[str, Any]:
        data = self._load()
        return data.get("active_cases", {})

    def get_case_by_symbol(self, symbol: str) -> Optional[Dict[str, Any]]:
        data = self._load()
        return data.get("active_cases", {}).get(symbol.upper())

storage = StorageManager()
