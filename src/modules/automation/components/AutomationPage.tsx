import { TelegramMessagePreferences } from '../../telegram/components/TelegramMessagePreferences';
import { useState } from 'react';
import { Pagination } from '../../../shared/components/Pagination';
import { usePagination } from '../../../shared/hooks/usePagination';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowUpRight, CalendarClock, Clock3, History, RefreshCw, Send, Timer } from 'lucide-react';
import { useAuthStore } from '../../auth/stores/auth.store';
import { fetchAutomationStatus } from '../lib/fetchAutomationStatus';
import { formatWib, nextScheduledRun, runStatus, summarizeDelivery, summarizeDeliveryCounts, normalizeSchedule } from '../lib/automationStatus';
import type { AutomationRun, SchedulerJob } from '../lib/automationStatus';

const panel = 'rounded-xl border border-border bg-secondary/40';
const tones = {
  good: 'border-accent/30 bg-accent/10 text-accent',
  warning: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  bad: 'border-red-400/30 bg-red-400/10 text-red-300',
  neutral: 'border-border bg-secondary text-text-muted',
};

function Badge({ label, tone = 'neutral' }: { label: string; tone?: keyof typeof tones }) {
  return <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${tones[tone]}`}>{label}</span>;
}

function SchedulerPanel({ job, name, description }: { job?: SchedulerJob; name: string; description: string }) {
  const next = job ? nextScheduledRun(job) : null;
  const daily = job && normalizeSchedule(job.schedule) === '0 0 * * 1-5' && ['UTC', 'GMT', 'Etc/UTC', 'Etc/GMT'].includes(job.timezone);
  const everyMinute = job && normalizeSchedule(job.schedule) === '* * * * *';
  const cronResult = job?.last_status;
  const resultLabel = cronResult === 'succeeded' ? 'Pemicu berhasil' : cronResult === 'failed' ? 'Pemicu gagal'
    : ['running', 'starting', 'connecting', 'sending'].includes(cronResult || '') ? 'Sedang memicu' : 'Belum ada riwayat pemicu';
  return <section className={`${panel} p-5`}>
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-primary" aria-hidden="true" /><h2 className="font-semibold text-text-main">{name}</h2></div>
      <Badge label={job ? job.active ? 'Jadwal aktif' : 'Jadwal nonaktif' : 'Belum terverifikasi'} tone={job?.active ? 'good' : 'neutral'} />
    </div>
    <p className="text-sm text-text-muted">{description}</p>
    <dl className="mt-5 space-y-3 text-sm">
      <div className="flex justify-between gap-4"><dt className="text-text-muted">Jadwal</dt><dd className="text-right text-text-main">{job && normalizeSchedule(job.schedule) === '0 1 * * 1-5' && ['UTC', 'GMT', 'Etc/UTC', 'Etc/GMT'].includes(job.timezone) ? 'Senin–Jumat · 08.00 WIB' : daily ? 'Senin–Jumat · 07.00 WIB' : everyMinute ? 'Setiap menit' : job ? `${job.schedule} (${job.timezone})` : 'Belum tersedia'}</dd></div>
      <div className="flex justify-between gap-4"><dt className="text-text-muted">Jadwal berikutnya</dt><dd className="text-right text-text-main">{next ? formatWib(next) : job && !job.active ? 'Jadwal dinonaktifkan' : 'Belum dapat ditentukan'}</dd></div>
      <div className="flex justify-between gap-4"><dt className="text-text-muted">Pemicu terakhir</dt><dd className="text-right text-text-main">{formatWib(job?.last_started_at || null)}</dd></div>
    </dl>
    <div className="mt-4 border-t border-border pt-4"><Badge label={resultLabel} tone={cronResult === 'failed' ? 'bad' : cronResult === 'succeeded' ? 'good' : 'neutral'} /></div>
  </section>;
}

function LatestRun({ run, title, hasLegacyHistory }: { run?: AutomationRun; title: string; hasLegacyHistory: boolean }) {
  const status = run ? runStatus(run) : null;
  return <div className="space-y-2">
    <p className="text-sm font-medium text-text-muted">{title}</p>
    <p className="text-base font-semibold text-text-main">{run ? formatWib(run.started_at) : 'Belum ada run dengan pemicu terkonfirmasi'}</p>
    {status ? <Badge {...status} /> : <p className="text-xs text-text-muted">{hasLegacyHistory ? 'Run lama tersedia, tetapi pemicunya belum tercatat.' : 'Belum ada dalam riwayat yang ditampilkan.'}</p>}
  </div>;
}

export function AutomationPage() {
  const userId = useAuthStore((state) => state.currentUser?.id);
  const [filter, setFilter] = useState<'all' | 'cron' | 'manual'>('all');
  const query = useQuery({
    queryKey: ['automation-status', userId],
    queryFn: () => fetchAutomationStatus(userId!),
    enabled: !!userId, refetchInterval: 30_000, staleTime: 15_000,
  });
  const data = query.data;
  const runs = data?.runs || [];
  const hasLegacyHistory = runs.some((run) => run.source !== 'cron' && run.source !== 'manual');
  const visibleRuns = runs.filter((run) => filter === 'all' || run.source === filter);
  const pagination = usePagination(visibleRuns, `${userId}:${filter}`);
  const refresh = () => { void query.refetch(); };
  const isStale = !!data && (query.isError || Date.now() - query.dataUpdatedAt > 90_000);
  const messages = data?.messages || [];

  return <div className="space-y-6 pb-6 font-sans">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-primary">Monitor eksekusi</p>
        <h1 className="text-2xl font-bold tracking-tight text-text-main sm:text-3xl">Otomatisasi</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted">Lihat jadwal pemeriksaan, bedakan run otomatis dan manual, serta pantau pengiriman Telegram akunmu.</p>
      </div>
      <button type="button" onClick={refresh} disabled={query.isFetching} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-main hover:bg-secondary disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
        <RefreshCw className={`h-4 w-4 ${query.isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />{query.isFetching ? 'Memperbarui...' : 'Perbarui status'}
      </button>
    </header>

    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted" aria-live="polite">
      <span className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />Diperbarui otomatis setiap 30 detik saat halaman dibuka</span>
      <span>{isStale ? 'Data terakhir · pembaruan tertunda' : data ? `Terakhir dicek: ${formatWib(data.checked_at)}` : 'Menunggu data server'}</span>
    </div>

    {query.isError && <div role="alert" className="rounded-lg border border-red-400/30 bg-red-400/5 p-4 text-sm text-red-200">{query.error.message}{data && ' Data terakhir tetap ditampilkan.'}</div>}
    {data && (!data.cron_available || data.setupPending) && <div role="status" className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-4 text-sm text-amber-200">Status scheduler belum tersedia dari server. Riwayat yang ada tetap ditampilkan; jadwal belum dianggap aktif.</div>}

    {query.isPending && !data ? <div className={`${panel} p-8 text-sm text-text-muted`} role="status">Memuat jadwal dan riwayat otomatisasi...</div> : <>
      <div className="grid gap-4 xl:grid-cols-2">
        <SchedulerPanel job={data?.jobs.find((job) => job.name === 'invoke-siba-workflow')} name="Rekap dan evaluasi · 07.00 WIB" description="Mengevaluasi kasus dari sesi terakhir, lalu mengirim hasil dan rekap dalam satu pesan per saham. IHSG harus berasal dari sesi yang sama." />
        <SchedulerPanel job={data?.jobs.find((job) => job.name === 'invoke-telegram-worker')} name="Pengiriman Telegram" description="Mengecek antrean pesan setiap menit. Pesan dikirim ketika ada item yang menunggu." />
      </div>
      <p className="text-xs leading-relaxed text-text-muted">Jadwal aktif berarti scheduler diaktifkan. Pemicu berhasil berarti perintah Cron selesai; hasil pemeriksaan dan pengiriman pesan tercatat terpisah di bawah.</p>

      <>{hasLegacyHistory && <div role="status" className="rounded-lg border border-border bg-secondary/30 p-4 text-sm leading-relaxed text-text-muted">Riwayat lama belum memiliki catatan pemicu otomatis atau manual. Status “Pemicu berhasil” menunjukkan perintah Cron selesai; sumber run lama tetap ditampilkan sebagai “Pemicu tidak tercatat”.</div>}</>

      <section className={`${panel} grid gap-5 p-5 sm:grid-cols-3`} aria-label="Eksekusi dan pengiriman terakhir">
        <LatestRun hasLegacyHistory={hasLegacyHistory} title="Run otomatis terbaru" run={runs.find((run) => run.source === 'cron')} />
        <LatestRun hasLegacyHistory={hasLegacyHistory} title="Run manual terbaru" run={runs.find((run) => run.source === 'manual')} />
        <div className="space-y-2"><p className="flex items-center gap-2 text-sm font-medium text-text-muted"><Send className="h-4 w-4" aria-hidden="true" />Telegram terakhir</p><p className="text-base font-semibold text-text-main">{formatWib(messages[0]?.created_at || null)}</p><p className="text-xs leading-relaxed text-text-muted">{summarizeDelivery(messages.slice(0, 1))}</p></div>
      </section>

      <TelegramMessagePreferences key={userId} />

      <section className={`${panel} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-5">
          <div><h2 className="flex items-center gap-2 font-semibold text-text-main"><History className="h-4 w-4 text-primary" aria-hidden="true" />Riwayat eksekusi</h2><p className="mt-1 text-xs text-text-muted">Maksimal 50 run terakhir akunmu. Riwayat lama tidak ditebak sumbernya.</p></div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-text-muted">Pemicu<select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="min-h-9 rounded-lg border border-border bg-secondary px-3 text-sm text-text-main focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"><option value="all">Semua</option><option value="cron">Otomatis</option><option value="manual">Manual</option></select></label>
            <Link to="/dashboard/audit" className="inline-flex min-h-9 items-center gap-1 text-xs font-medium text-primary hover:underline">Audit Trail<ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
          </div>
        </div>
        {!visibleRuns.length ? <div className="p-8 text-center text-sm text-text-muted">{query.isError ? 'Riwayat belum dapat dimuat.' : runs.length ? 'Belum ada run untuk pemicu ini.' : 'Belum ada eksekusi tercatat untuk akunmu.'}</div> : <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><caption className="sr-only">Riwayat run otomatis dan manual dalam zona waktu WIB</caption><thead className="border-b border-border text-xs text-text-muted"><tr>{['Waktu mulai', 'Pemicu', 'Pemeriksaan', 'Hasil', 'Saham', 'Telegram'].map((label) => <th scope="col" key={label} className="px-5 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-border/60">{pagination.items.map((run) => {
          const status = runStatus(run);
          const delivery = run.delivery_counts ? summarizeDeliveryCounts(run.delivery_counts) : 'Pesan belum tertaut ke run ini';
          return <tr key={run.id} className="align-top hover:bg-secondary/50">
            <td className="px-5 py-4"><time dateTime={run.started_at} className="whitespace-nowrap text-xs text-text-main">{formatWib(run.started_at)}</time><p className="mt-1 text-xs text-text-muted">{run.finished_at ? `Selesai ${formatWib(run.finished_at, false)}` : 'Waktu selesai belum tercatat'}</p></td>
            <td className="px-5 py-4"><Badge label={run.source === 'cron' ? 'Otomatis' : run.source === 'manual' ? 'Manual' : 'Pemicu tidak tercatat'} /></td>
            <td className="px-5 py-4 text-xs text-text-main">{run.mode === 'workflow' && run.checkpoint === 'morning' ? 'Rekap dan evaluasi pagi' : run.mode === 'briefing' ? 'Rekap pagi' : run.mode === 'evaluation' ? 'Evaluasi kasus' : run.mode === 'preview' ? 'Preview Telegram' : run.checkpoint === 'morning' ? 'Pemeriksaan pagi' : run.checkpoint === 'evening' ? 'Checkpoint malam (legacy)' : 'Evaluasi saham'}</td>
            <td className="px-5 py-4"><Badge {...status} />{run.error_code && <p className="mt-1 text-xs text-text-muted">{run.error_code}</p>}</td>
            <td className="px-5 py-4 text-text-main">{run.tickers_count}</td>
            <td className="max-w-64 px-5 py-4 text-xs leading-relaxed text-text-muted">{delivery}</td>
          </tr>;
        })}</tbody></table></div>}
        {visibleRuns.length > 0 && <div className="px-5 pb-5"><Pagination {...pagination} label="Halaman riwayat otomatisasi" /></div>}
      </section>
      <p className="flex items-start gap-2 text-xs leading-relaxed text-text-muted"><Timer className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />Tidak ada pesan tercatat bisa berarti tidak ada pembaruan baru. Status “belum pasti” berarti pengiriman belum terkonfirmasi; run berhasil tidak otomatis berarti pesan sudah terkirim.</p>
    </>}
  </div>;
}
