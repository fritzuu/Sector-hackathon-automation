import { supabase } from '../../../lib/supabaseClient';
import { fetchAuditRunsFromSupabase } from '../../../services/supabaseStorage';
import type { AutomationStatus } from './automationStatus';

export async function fetchAutomationStatus(userId: string): Promise<AutomationStatus & { setupPending?: boolean }> {
  const { data, error } = await supabase.rpc('get_automation_status');
  if (error) {
    // A deployment can temporarily precede its migration. Keep genuine old history visible.
    if (error.code === 'PGRST202' || error.code === '42883') {
      const runs = await fetchAuditRunsFromSupabase(userId);
      return {
        checked_at: new Date().toISOString(), cron_available: false, jobs: [], messages: [], setupPending: true,
        runs: runs.map((run) => ({
          id: run.runId, source: 'unknown', mode: 'workflow', checkpoint: null, status: run.status,
          started_at: run.timestamp, finished_at: run.timestamp, tickers_count: run.tickersCount,
          active_triggers_count: run.activeTriggersCount, error_code: null,
        })),
      };
    }
    throw new Error('Status otomatisasi belum dapat dimuat. Coba perbarui kembali.');
  }
  if (!data || !Array.isArray(data.jobs) || !Array.isArray(data.runs) || !Array.isArray(data.messages)) {
    throw new Error('Ringkasan otomatisasi belum tersedia dari server.');
  }
  return data as AutomationStatus;
}
