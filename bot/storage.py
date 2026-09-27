import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import httpx
from config import STORAGE_FILE, SUPABASE_URL, SUPABASE_KEY

logger = logging.getLogger(__name__)


class StorageManager:
    """Local cache plus Supabase RPC for per-account pairing."""

    def __init__(self, filepath: Optional[Path] = None):
        self.filepath = filepath or STORAGE_FILE
        self._ensure_file_exists()

    def _ensure_file_exists(self):
        self.filepath.parent.mkdir(parents=True, exist_ok=True)
        if not self.filepath.exists():
            self._save({
                "users": {},
                "subscribers": [],
                "active_cases": {},
                "alert_history": []
            })

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

    def _supabase_headers(self) -> Dict[str, str]:
        return {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
        }

    def _rpc(self, fn_name: str, payload: Dict[str, Any]) -> Optional[Any]:
        if not SUPABASE_URL or not SUPABASE_KEY:
            return None
        try:
            with httpx.Client(timeout=6.0, trust_env=False) as client:
                res = client.post(
                    f"{SUPABASE_URL}/rest/v1/rpc/{fn_name}",
                    headers=self._supabase_headers(),
                    json=payload,
                )
                if res.status_code not in (200, 201):
                    logger.warning(f"[Supabase RPC] {fn_name} {res.status_code}: {res.text}")
                    return None
                return res.json()
        except Exception as e:
            logger.warning(f"[Supabase RPC] {fn_name} error: {e}")
            return None

    def register_pairing_token(self, token: str, user_id: str, name: str, watchlist: Optional[List[str]] = None) -> Dict[str, Any]:
        data = self._load()
        user_record = {
            "id": user_id,
            "name": name,
            "pairing_token": token,
            "telegram_chat_id": None,
            "telegram_username": None,
            "is_linked": False,
            "watchlist": watchlist or [],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        data["users"][token] = user_record
        self._save(data)
        return user_record

    def pair_chat_with_token(self, token: str, chat_id: str, username: Optional[str] = None) -> Optional[Dict[str, Any]]:
        rpc_result = self._rpc("link_telegram_account", {
            "p_token": token,
            "p_chat_id": str(chat_id),
            "p_username": username,
        })
        if isinstance(rpc_result, dict) and rpc_result.get("ok"):
            profile = {
                "id": rpc_result.get("id"),
                "name": rpc_result.get("name"),
                "pairing_token": token,
                "telegram_chat_id": rpc_result.get("telegram_chat_id") or str(chat_id),
                "telegram_username": rpc_result.get("telegram_username") or username,
                "is_linked": True,
                "watchlist": rpc_result.get("watchlist") or [],
            }
            data = self._load()
            data["users"][token] = profile
            chat_id_str = str(chat_id)
            if chat_id_str not in data["subscribers"]:
                data["subscribers"].append(chat_id_str)
            self._save(data)
            return profile
        return None

    def get_user_by_chat_id(self, chat_id: str) -> Optional[Dict[str, Any]]:
        chat_id_str = str(chat_id)
        rpc_result = self._rpc("get_profile_by_chat_id", {"p_chat_id": chat_id_str})
        if isinstance(rpc_result, dict) and rpc_result.get("ok"):
            return {
                "id": rpc_result.get("id"),
                "name": rpc_result.get("name"),
                "pairing_token": rpc_result.get("pairing_token"),
                "telegram_chat_id": rpc_result.get("telegram_chat_id"),
                "telegram_username": rpc_result.get("telegram_username"),
                "is_linked": rpc_result.get("is_linked", True),
                "watchlist": rpc_result.get("watchlist") or [],
            }

        data = self._load()
        for user in data["users"].values():
            if str(user.get("telegram_chat_id")) == chat_id_str:
                return user
        return None

    def get_user_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        data = self._load()
        user = data["users"].get(token)
        if user:
            return user

        rpc_result = self._rpc("get_profile_by_pairing_token", {"p_token": token})
        if isinstance(rpc_result, dict) and rpc_result.get("ok"):
            profile = {
                "id": rpc_result.get("id"),
                "name": rpc_result.get("name"),
                "pairing_token": token,
                "telegram_chat_id": rpc_result.get("telegram_chat_id"),
                "telegram_username": rpc_result.get("telegram_username"),
                "is_linked": rpc_result.get("is_linked", False),
                "watchlist": rpc_result.get("watchlist") or [],
            }
            data["users"][token] = profile
            self._save(data)
            return profile
        return None

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

    def record_case_event(self, symbol: str, event_data: Dict[str, Any]):
        data = self._load()
        data["active_cases"][symbol] = event_data
        data["alert_history"].append({
            "symbol": symbol,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event": event_data
        })
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
