import { supabase } from '../lib/supabaseClient.ts';
import { UserProfile } from '../data/userProfiles.ts';
import { AuditRunItem } from '../modules/cases/components/RunAuditHistory.ts';
import { CaseEvent, CaseState, RenderedTemplate } from '../types/engine.ts';

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

interface CachedWatchlist {
  watchlist: string[];
  updatedAt: string;
}

interface CachedWorkspace {
  workspace: {
    activeCases: Record<string, CaseState>;
    caseEvents: Record<string, CaseEvent[]>;
    caseTemplates: Record<string, RenderedTemplate>;
    lastRunTime: string | null;
    runIndex: number;
  };
  updatedAt: string;
}

function readCachedWatchlist(userId: string): CachedWatchlist | null {
  try {
    const raw = localStorage.getItem(`siba_watchlist_${userId}`);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedWatchlist;
    return Array.isArray(cached.watchlist) && typeof cached.updatedAt === 'string'
      ? cached
      : null;
  } catch {
    return null;
  }
}

function withFreshCachedWatchlist(
  profile: UserProfile,
  serverUpdatedAt?: string,
): UserProfile {
  const cached = readCachedWatchlist(profile.id);
  if (
    cached &&
    (!serverUpdatedAt || Date.parse(cached.updatedAt) > Date.parse(serverUpdatedAt))
  ) {
    return { ...profile, defaultWatchlist: cached.watchlist };
  }
  return profile;
}

function workspaceToRecord(workspace: UserWorkspace): CachedWorkspace['workspace'] {
  return {
    activeCases: Object.fromEntries(workspace.activeCases),
    caseEvents: Object.fromEntries(workspace.caseEvents),
    caseTemplates: Object.fromEntries(workspace.caseTemplates),
    lastRunTime: workspace.lastRunTime,
    runIndex: workspace.runIndex,
  };
}

function readCachedWorkspace(userId: string): CachedWorkspace | null {
  try {
    const raw = localStorage.getItem(`siba_workspace_${userId}`);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedWorkspace;
    if (!cached.workspace || typeof cached.updatedAt !== 'string') return null;
    return cached;
  } catch {
    return null;
  }
}

function cacheWorkspace(userId: string, workspace: UserWorkspace, updatedAt: string) {
  try {
    localStorage.setItem(
      `siba_workspace_${userId}`,
      JSON.stringify({ workspace: workspaceToRecord(workspace), updatedAt }),
    );
  } catch (err) {
    console.warn('[SupabaseStorage] Gagal menyimpan cache workspace lokal:', err);
  }
}

function workspaceFromRecord(value: CachedWorkspace['workspace']): UserWorkspace {
  return {
    activeCases: objectToMap<CaseState>(value.activeCases),
    caseEvents: objectToMap<CaseEvent[]>(value.caseEvents),
    caseTemplates: objectToMap<RenderedTemplate>(value.caseTemplates),
    lastRunTime: value.lastRunTime || null,
    runIndex: typeof value.runIndex === 'number' ? value.runIndex : 1,
  };
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

    if (!error && data) {
      const profile = withFreshCachedWatchlist(
        mapDbToUserProfile(data),
        data.updated_at,
      );
      // Update local cache
      try {
        localStorage.setItem(`siba_profile_${profile.id}`, JSON.stringify(profile));
        if (profile.email) localStorage.setItem(`siba_profile_${profile.email}`, JSON.stringify(profile));
      } catch {}
      return profile;
    }
  } catch (err) {
    console.warn('[SupabaseStorage] Network/Fetch error saat mengambil profil:', err);
  }

  // Fallback to localStorage if Supabase profiles table is missing or network unavailable
  try {
    const cached = localStorage.getItem(`siba_profile_${identifier}`);
    if (cached) {
      return withFreshCachedWatchlist(JSON.parse(cached) as UserProfile);
    }
  } catch {}

  return null;
}

export async function saveUserProfileToSupabase(
  user: UserProfile
): Promise<UserProfile> {
  if (!user.id) return user;

  // Always cache locally so same email retains data across OAuth and password logins
  try {
    localStorage.setItem(`siba_profile_${user.id}`, JSON.stringify(user));
    if (user.email) {
      localStorage.setItem(`siba_profile_${user.email}`, JSON.stringify(user));
    }
  } catch {}

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
  const updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(
      `siba_watchlist_${userId}`,
      JSON.stringify({ watchlist, updatedAt }),
    );
  } catch (err) {
    console.warn('[SupabaseStorage] Gagal menyimpan cache watchlist lokal:', err);
  }

  try {
    const raw = localStorage.getItem(`siba_profile_${userId}`);
    if (raw) {
      const p = JSON.parse(raw) as UserProfile;
      p.defaultWatchlist = watchlist;
      localStorage.setItem(`siba_profile_${userId}`, JSON.stringify(p));
      if (p.email) localStorage.setItem(`siba_profile_${p.email}`, JSON.stringify(p));
    }
  } catch {}

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

    const cached = readCachedWorkspace(userId);
    if (error || !data) {
      return cached ? workspaceFromRecord(cached.workspace) : null;
    }

    const remoteUpdatedAt = data.updated_at as string | undefined;
    if (
      cached &&
      (!remoteUpdatedAt || Date.parse(cached.updatedAt) > Date.parse(remoteUpdatedAt))
    ) {
      return workspaceFromRecord(cached.workspace);
    }

    const workspace = {
      activeCases: objectToMap<CaseState>(data.active_cases),
      caseEvents: objectToMap<CaseEvent[]>(data.case_events),
      caseTemplates: objectToMap<RenderedTemplate>(data.case_templates),
      lastRunTime: data.last_run_time || null,
      runIndex: typeof data.run_index === 'number' ? data.run_index : 1,
    };
    cacheWorkspace(userId, workspace, remoteUpdatedAt || new Date().toISOString());
    return workspace;
  } catch (err) {
    console.warn('[SupabaseStorage] Error saat mengambil workspace:', err);
    const cached = readCachedWorkspace(userId);
    return cached ? workspaceFromRecord(cached.workspace) : null;
  }
}

export async function saveUserWorkspaceToSupabase(
  userId: string,
  workspace: UserWorkspace
): Promise<boolean> {
  if (!userId) return false;
  const updatedAt = new Date().toISOString();
  cacheWorkspace(userId, workspace, updatedAt);
  try {
    const { error } = await supabase.from('user_workspaces').upsert(
      {
        user_id: userId,
        active_cases: Object.fromEntries(workspace.activeCases),
        case_events: Object.fromEntries(workspace.caseEvents),
        case_templates: Object.fromEntries(workspace.caseTemplates),
        last_run_time: workspace.lastRunTime,
        run_index: workspace.runIndex,
        updated_at: updatedAt,
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
