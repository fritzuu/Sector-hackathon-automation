/**
 * SIBA Telegram Bridge Service
 *
 * Delegates alert delivery and chat pairing to the local Telebot server
 * (bot/main.py — aiohttp webhook receiver on port 8088).
 *
 * Architecture:
 *   Browser → POST /bot-api/api/alert
 *                   ↓  (Vite proxy during dev)
 *             http://127.0.0.1:8088/api/alert
 *                   ↓
 *             Telebot → Telegram Bot API → User's chat
 *
 * Start the bot with:  cd bot && python main.py
 * The bot token lives only in bot/.env — never in the browser bundle.
 *
 * Pairing flow:
 *   1. Frontend generates a token and calls registerPairingToken()
 *   2. User sends /start <token> to the bot in Telegram
 *   3. Frontend polls checkPairingStatus() until linked === true
 *   4. Returns the real chat_id and username for persistent storage
 */

export interface CaseAlertPayload {
  symbol: string;
  status: 'OPEN' | 'UPDATED' | 'CLOSED' | 'DATA_INCOMPLETE' | 'MONITORING';
  evaluation_date?: string;
  facts?: string[];
  interpretations?: string[];
  unknowns?: string[];
  target_chat_id?: string;
  is_replay?: boolean;
  detail_url?: string;
}

// Vite proxy target: /bot-api → http://127.0.0.1:8088
const BOT_BASE = '/bot-api';

// ── Internal helper ──────────────────────────────────────────────────────────

async function botFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${BOT_BASE}${path}`, init);
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Check if the Telebot bridge server is running and healthy.
 */
export async function checkBotHealth(): Promise<{ online: boolean; botName?: string }> {
  try {
    const res = await botFetch('/api/health');
    if (!res.ok) return { online: false };
    const data = await res.json();
    return { online: true, botName: data.masked_token };
  } catch {
    return { online: false };
  }
}

/**
 * Register a pairing token with the bot server so it can be matched when
 * the user sends /start <token> in Telegram.
 */
export async function registerPairingToken(
  token: string,
  userId: string,
  name: string,
  watchlist: string[] = []
): Promise<boolean> {
  try {
    const res = await botFetch('/api/pair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, user_id: userId, name, watchlist }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Poll whether the user has completed pairing (/start <token> sent in Telegram).
 * Call this every few seconds after showing the pairing modal.
 */
export async function checkPairingStatus(
  token: string
): Promise<{ linked: boolean; chatId?: string; username?: string }> {
  try {
    const res = await botFetch(`/api/pair/status?token=${encodeURIComponent(token)}`);
    if (!res.ok) return { linked: false };
    const data = await res.json();
    return {
      linked: Boolean(data.linked),
      chatId: data.chat_id,
      username: data.username,
    };
  } catch {
    return { linked: false };
  }
}

/**
 * Dispatch a deterministic case event alert to the user's Telegram chat.
 * The bot server handles HTML formatting, deduplication, and delivery.
 * MONITORING events are skipped server-side (PRD §6.4).
 */
export async function dispatchCaseAlert(
  payload: CaseAlertPayload
): Promise<{ success: boolean; result?: any }> {
  try {
    const res = await botFetch('/api/alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return { success: res.ok && data.status !== 'error', result: data };
  } catch (err) {
    return { success: false, result: err };
  }
}
