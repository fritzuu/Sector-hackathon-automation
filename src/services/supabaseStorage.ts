import { supabase } from '../lib/supabaseClient.js';
import { UserProfile } from '../data/userProfiles.js';
import { AuditRunItem } from '../modules/cases/components/RunAuditHistory.js';
import { CaseEvent, CaseState, RenderedTemplate } from '../types/engine.js';

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

export interface UserWorkspace {
  activeCases: Map<string, CaseState>;
  caseEvents: Map<string, CaseEvent[]>;
  caseTemplates: Map<string, RenderedTemplate>;
  lastRunTime: string | null;
  runIndex: number;
}

function mapDbToUserProfile(row: DbProfileRow): UserProfile {
  const watchlist = Array.isArray(row.watchlist) ? row.watchlist : [];
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
    defaultWatchlist: watchlist,
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
    watchlist: user.defaultWatchlist || [],
    updated_at: new Date().toISOString(),
  };
}

function objectToMap<T>(value: unknown): Map<string, T> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return new Map();
  }
  return new Map(Object.entries(value as Record<string, T>));
}

export async function fetchUserProfileFromSupabase(
  identifier: string
): Promise<UserProfile | null> {
  if (!identifier) return null;
  try {
    const isEmail = identifier.includes('@');
    const query = supabase.from('profiles').select('*').limit(1);

    const { data, error } = isEmail
      ? await query.eq('email', identifier).maybeSingle()
      : await query.eq('id', identifier).maybeSingle();

    if (error) {
      console.warn('[SupabaseStorage] Gagal mengambil profil:', error.message);
      return null;
    }

    return data ? mapDbToUserProfile(data) : null;
  } catch (err) {
    console.warn('[SupabaseStorage] Network/Fetch error saat mengambil profil:', err);
    return null;
  }
}

export async function saveUserProfileToSupabase(
  user: UserProfile
): Promise<UserProfile> {
  if (!user.id) return user;
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

export async function saveAuditRunToSupabase(
  run: AuditRunItem,
  userId: string
): Promise<boolean> {
  if (!userId) return false;
  try {
    const { error } = await supabase.from('audit_runs').upsert(
      {
        user_id: userId,
        run_id: run.runId,
        timestamp: run.timestamp,
        tickers_count: run.tickersCount,
        active_triggers_count: run.activeTriggersCount,
        status: run.status,
        duration_ms: run.durationMs,
      },
      { onConflict: 'user_id,run_id' }
    );

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

export async function fetchAuditRunsFromSupabase(
  userId: string
): Promise<AuditRunItem[]> {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('audit_runs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !data) {
      return [];
    }

    return data.map((row: { run_id?: string; id?: string; timestamp: string; tickers_count: number; active_triggers_count: number; status: string; duration_ms: number }) => ({
      runId: row.run_id || row.id || '',
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

export async function fetchUserWorkspaceFromSupabase(
  userId: string
): Promise<UserWorkspace | null> {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('user_workspaces')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      activeCases: objectToMap<CaseState>(data.active_cases),
      caseEvents: objectToMap<CaseEvent[]>(data.case_events),
      caseTemplates: objectToMap<RenderedTemplate>(data.case_templates),
      lastRunTime: data.last_run_time || null,
      runIndex: typeof data.run_index === 'number' ? data.run_index : 1,
    };
  } catch (err) {
    console.warn('[SupabaseStorage] Error saat mengambil workspace:', err);
    return null;
  }
}

export async function saveUserWorkspaceToSupabase(
  userId: string,
  workspace: UserWorkspace
): Promise<boolean> {
  if (!userId) return false;
  try {
    const { error } = await supabase.from('user_workspaces').upsert(
      {
        user_id: userId,
        active_cases: Object.fromEntries(workspace.activeCases),
        case_events: Object.fromEntries(workspace.caseEvents),
        case_templates: Object.fromEntries(workspace.caseTemplates),
        last_run_time: workspace.lastRunTime,
        run_index: workspace.runIndex,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      console.warn('[SupabaseStorage] Gagal menyimpan workspace:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[SupabaseStorage] Error saat menyimpan workspace:', err);
    return false;
  }
}
