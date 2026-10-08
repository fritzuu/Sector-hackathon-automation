export interface SchedulerJob {
  name: string;
  active: boolean;
  schedule: string;
  timezone: string;
  last_started_at: string | null;
  last_finished_at: string | null;
  last_status: string | null;
}
export interface AutomationRun {
  id: string;
  source: 'cron' | 'manual' | 'unknown';
  mode: 'workflow' | 'preview' | 'briefing' | 'evaluation';
  checkpoint: 'morning' | 'evening' | null;
  status: string;
  started_at: string;
  finished_at: string | null;
  tickers_count: number;
  active_triggers_count: number;
  error_code: string | null;
  delivery_counts?: Record<string, number> | null;
}
export interface DeliveryRecord {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  run_id: string | null;
}
export interface AutomationStatus {
  checked_at: string;
  cron_available: boolean;
  jobs: SchedulerJob[];
  runs: AutomationRun[];
  messages: DeliveryRecord[];
}

export function formatWib(value: string | null, includeDate = true): string {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Belum tercatat';
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta', ...(includeDate ? { day: 'numeric', month: 'short', year: 'numeric' } as const : {}),
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date(value)) + ' WIB';
}

export function normalizeSchedule(schedule: string): string {
  return schedule.trim().split(/\s+/).map((field) => /^\d+$/.test(field) ? String(Number(field)) : field).join(' ');
}

// Calculate only schedules the monitor can explain, using the server's configured timezone.
// Unrecognized schedules stay visible as Cron expressions instead of invented next runs.
export function nextScheduledRun(job: SchedulerJob, now = new Date()): string | null {
  if (!job.active || !['UTC', 'GMT', 'Etc/UTC', 'Etc/GMT'].includes(job.timezone)) return null;
  const schedule = normalizeSchedule(job.schedule);
  if (schedule === '* * * * *') {
    return new Date(Math.floor(now.getTime() / 60000) * 60000 + 60000).toISOString();
  }
  if (['0 0 * * 1-5', '0 1 * * 1-5'].includes(schedule)) {
    const next = new Date(now);
    next.setUTCHours(Number(schedule.split(' ')[1]), 0, 0, 0);
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    while ([0, 6].includes(next.getUTCDay())) next.setUTCDate(next.getUTCDate() + 1);
    return next.toISOString();
  }
  return null;
}

export function runStatus(run: AutomationRun, now = Date.now()): { label: string; tone: 'good' | 'warning' | 'bad' | 'neutral' } {
  if (run.status === 'RUNNING') return now - Date.parse(run.started_at) > 10 * 60000
    ? { label: 'Belum ada hasil akhir', tone: 'warning' }
    : { label: 'Sedang berjalan', tone: 'neutral' };
  if (run.status === 'SUCCESS') return { label: 'Berhasil', tone: 'good' };
  if (run.status === 'PARTIAL') return { label: 'Sebagian data tersedia', tone: 'warning' };
  if (run.status === 'INCOMPLETE') return { label: 'Data belum lengkap', tone: 'warning' };
  if (run.status === 'FAILED') return { label: 'Gagal', tone: 'bad' };
  return { label: 'Status belum dikenali', tone: 'neutral' };
}

export function summarizeDeliveryCounts(counts: Record<string, number>): string {
  const labels: Record<string, string> = {
    sent: 'terkirim', pending: 'mengantre', processing: 'diproses', failed: 'gagal', unknown: 'belum pasti',
  };
  const entries = Object.entries(counts).filter(([, count]) => count > 0);
  return entries.length ? entries.map(([status, count]) => `${count} ${labels[status] || 'status belum dikenali'}`).join(' · ')
    : 'Tidak ada pesan tercatat';
}

export function summarizeDelivery(messages: DeliveryRecord[]): string {
  const counts: Record<string, number> = {};
  for (const message of messages) counts[message.status] = (counts[message.status] || 0) + 1;
  return summarizeDeliveryCounts(counts);
}
