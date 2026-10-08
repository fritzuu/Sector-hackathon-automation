import { describe, expect, it } from 'vitest';
import { nextScheduledRun, runStatus, summarizeDelivery, formatWib } from '../src/modules/automation/lib/automationStatus';
import type { SchedulerJob, AutomationRun } from '../src/modules/automation/lib/automationStatus';
import { workflowSource, WorkflowMonitor } from '../supabase/functions/siba-workflow/monitor.ts';

const job = { active: true, schedule: '0 0 * * 1-5', timezone: 'GMT' } as SchedulerJob;
const run = { id: 'run', source: 'cron', status: 'RUNNING', started_at: '2026-10-08T00:00:00Z' } as AutomationRun;

describe('automation monitoring', () => {
  it('calculates weekday Cron boundaries in UTC and displays WIB', () => {
    expect(nextScheduledRun(job, new Date('2026-10-09T00:00:00Z'))).toBe('2026-10-12T00:00:00.000Z');
    expect(nextScheduledRun(job, new Date('2026-10-08T23:59:00Z'))).toBe('2026-10-09T00:00:00.000Z');
    expect(nextScheduledRun({ ...job, schedule: '00 00 * * 1-5' }, new Date('2026-10-09T00:00:00Z'))).toBe('2026-10-12T00:00:00.000Z');
    expect(formatWib('2026-10-08T00:00:00Z', false)).toBe('07.00 WIB');
  });
  it('does not invent next runs for disabled or unsupported schedules/timezones', () => {
    expect(nextScheduledRun({ ...job, active: false })).toBeNull();
    expect(nextScheduledRun({ ...job, schedule: '0 15 * * *' })).toBeNull();
    expect(nextScheduledRun({ ...job, timezone: 'Asia/Jakarta' })).toBeNull();
    expect(nextScheduledRun({ ...job, schedule: '* * * * *' }, new Date('2026-10-08T00:00:59Z'))).toBe('2026-10-08T00:01:00.000Z');
  });
  it('keeps interrupted runs uncertain instead of claiming failure or success', () => {
    expect(runStatus(run, Date.parse('2026-10-08T00:02:00Z')).label).toBe('Sedang berjalan');
    expect(runStatus(run, Date.parse('2026-10-08T00:11:00Z')).label).toBe('Belum ada hasil akhir');
    expect(runStatus({ ...run, status: 'PARTIAL' }).tone).toBe('warning');
  });
  it('distinguishes confirmed delivery from unknown outcomes and empty queues', () => {
    expect(summarizeDelivery([])).toBe('Tidak ada pesan tercatat');
    expect(summarizeDelivery([{ status: 'sent' }, { status: 'unknown' }] as any)).toBe('1 terkirim · 1 belum pasti');
  });
  it('records manual invocations separately from the marked Cron URL', () => {
    expect(workflowSource('https://example.com/workflow')).toBe('manual');
    expect(workflowSource('https://example.com/workflow?trigger_source=cron')).toBe('cron');
  });
  it('records unsuccessful requests as failed, per account, without storing secrets', async () => {
    const inserted: any[] = [];
    const updates: any[] = [];
    const client = { from: () => ({
      insert: async (rows: any[]) => { inserted.push(...rows); return { error: null }; },
      update: (row: any) => ({ eq: async (_key: string, id: string) => { updates.push({ ...row, id }); return { error: null }; } }),
    }) };
    const monitor = new WorkflowMonitor(client);
    await monitor.start([{ id: 'account-a', watchlist: ['BBCA'] }, { id: 'account-b', watchlist: [] }], 'cron', 'workflow', 'morning');
    expect(inserted.map((row) => row.status)).toEqual(['RUNNING', 'RUNNING']);
    expect(monitor.id('account-a')).not.toBe(monitor.id('account-b'));
    await monitor.finish(500);
    expect(updates.every((row) => row.status === 'FAILED' && row.error_code === 'HTTP_500' && row.finished_at)).toBe(true);
  });
  it('records no execution for rejected authentication or failed monitoring initialization', async () => {
    let writes = 0;
    const monitor = new WorkflowMonitor({ from: () => ({ insert: async () => { writes++; return { error: 'unavailable' }; } }) });
    await monitor.finish(401);
    expect(writes).toBe(0);
    await expect(monitor.start([{ id: 'account' }], 'manual', 'preview', 'evening')).rejects.toThrow();
    expect(monitor.id('account')).toBeUndefined();
  });
});
