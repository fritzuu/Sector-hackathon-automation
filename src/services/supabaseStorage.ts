import { supabase } from '../lib/supabaseClient.js';
import { UserProfile } from '../data/userProfiles.js';
import { AuditRunItem } from '../modules/cases/components/RunAuditHistory.js';

export interface DbProfileRow {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role?: string;
  pairing_token?: string;
  telegram_chat_id?: string | null;
  telegram_username?: string | null;
  is_telegram_linked?: boolean;
  watchlist?: string[];
  created_at?: string;
  updated_at?: string;
}

function mapDbToUserProfile(row: DbProfileRow): UserProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar || '',
    role: (row.role as UserProfile['role']) || 'Investor Ritel',
    pairingToken: row.pairing_token || '',
    telegramChatId: row.telegram_chat_id || null,
    telegramUsername: row.telegram_username || null,
    isTelegramLinked: !!row.is_telegram_linked,
    defaultWatchlist: Array.isArray(row.watchlist) ? row.watchlist : ['BBCA', 'TLKM', 'UNTR'],
  };
}

function mapUserProfileToDb(user: UserProfile): DbProfileRow {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar || '',
    role: user.role,
    pairing_token: user.pairingToken,
    telegram_chat_id: user.telegramChatId || null,
    telegram_username: user.telegramUsername || null,
    is_telegram_linked: user.isTelegramLinked,
    watchlist: (user as any).watchlist || user.defaultWatchlist,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Fetch a user profile from Supabase by email or id
 */
export async function fetchUserProfileFromSupabase(
  identifier: string
): Promise<UserProfile | null> {
  try {
    const isEmail = identifier.includes('@');
    const query = supabase
      .from('profiles')
      .select('*')
      .limit(1);

    const { data, error } = isEmail
      ? await query.eq('email', identifier).maybeSingle()
      : await query.eq('id', identifier).maybeSingle();

    if (error) {
      console.warn('[SupabaseStorage] Gagal mengambil profil:', error.message);
      return null;
    }

    if (data) {
      return mapDbToUserProfile(data);
    }
    return null;
  } catch (err) {
    console.warn('[SupabaseStorage] Network/Fetch error saat mengambil profil:', err);
    return null;
  }
}

/**
 * Upsert user profile to Supabase
 */
export async function saveUserProfileToSupabase(
  user: UserProfile
): Promise<UserProfile> {
  try {
    const dbPayload = mapUserProfileToDb(user);
    const { data, error } = await supabase
      .from('profiles')
      .upsert(dbPayload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[SupabaseStorage] Gagal menyimpan profil ke Supabase:', error.message);
      return user;
    }

    if (data) {
      return mapDbToUserProfile(data);
    }
  } catch (err) {
    console.warn('[SupabaseStorage] Error saat menyimpan profil:', err);
  }
  return user;
}

/**
 * Update user watchlist in Supabase
 */
export async function syncWatchlistToSupabase(
  userId: string,
  watchlist: string[]
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        watchlist,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.warn('[SupabaseStorage] Gagal memperbarui watchlist di Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[SupabaseStorage] Error saat memperbarui watchlist:', err);
    return false;
  }
}

/**
 * Update Telegram pairing status in Supabase
 */
export async function syncTelegramLinkToSupabase(
  userId: string,
  chatId: string | null,
  username: string | null,
  isLinked: boolean
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        telegram_chat_id: chatId,
        telegram_username: username,
        is_telegram_linked: isLinked,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.warn('[SupabaseStorage] Gagal memperbarui Telegram link di Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[SupabaseStorage] Error saat memperbarui Telegram link:', err);
    return false;
  }
}

/**
 * Save audit run history record to Supabase
 */
export async function saveAuditRunToSupabase(
  run: AuditRunItem,
  userId?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('audit_runs')
      .insert({
        id: run.runId,
        user_id: userId || null,
        timestamp: run.timestamp,
        tickers_count: run.tickersCount,
        active_triggers_count: run.activeTriggersCount,
        status: run.status,
        duration_ms: run.durationMs,
      });

    if (error) {
      console.warn('[SupabaseStorage] Gagal menyimpan audit run ke Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[SupabaseStorage] Error saat menyimpan audit run:', err);
    return false;
  }
}

/**
 * Fetch audit run history from Supabase
 */
export async function fetchAuditRunsFromSupabase(): Promise<AuditRunItem[]> {
  try {
    const { data, error } = await supabase
      .from('audit_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !data) {
      return [];
    }

    return data.map((row: any) => ({
      runId: row.id,
      timestamp: row.timestamp,
      tickersCount: row.tickers_count,
      activeTriggersCount: row.active_triggers_count,
      status: (row.status as AuditRunItem['status']) || 'SUCCESS',
      durationMs: row.duration_ms,
    }));
  } catch {
    return [];
  }
}
