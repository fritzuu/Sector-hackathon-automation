// I/O boundary for per-account execution telemetry. All writes use the server client.
export class WorkflowMonitor {
  private runs = new Map<string, { id: string; status: string; triggers: number }>();
  constructor(private client: any) {}

  async start(users: { id: string; watchlist?: string[] }[], source: 'cron' | 'manual', mode: string, checkpoint: string) {
    const startedAt = new Date().toISOString();
    const rows = users.map((user) => {
      const id = crypto.randomUUID();
      this.runs.set(user.id, { id, status: 'SUCCESS', triggers: 0 });
      return { id, user_id: user.id, source, mode, checkpoint, status: 'RUNNING', started_at: startedAt, tickers_count: user.watchlist?.length || 0 };
    });
    const { error } = await this.client.from('automation_runs').insert(rows);
    if (error) { this.runs.clear(); throw new Error('Automation tracking unavailable'); }
  }

  id(userId: string) { return this.runs.get(userId)?.id; }
  result(userId: string, status: string, triggers = 0) {
    const run = this.runs.get(userId);
    if (run) { run.status = status; run.triggers = triggers; }
  }

  async finish(httpStatus: number) {
    const finishedAt = new Date().toISOString();
    for (const run of this.runs.values()) {
      const { error } = await this.client.from('automation_runs').update({
        status: httpStatus >= 400 ? 'FAILED' : run.status,
        finished_at: finishedAt,
        active_triggers_count: run.triggers,
        error_code: httpStatus >= 400 ? `HTTP_${httpStatus}` : null,
      }).eq('id', run.id);
      if (error) throw new Error('Automation result could not be recorded');
    }
  }
}

export function workflowSource(url: string): 'cron' | 'manual' {
  return new URL(url).searchParams.get('trigger_source') === 'cron' ? 'cron' : 'manual';
}
