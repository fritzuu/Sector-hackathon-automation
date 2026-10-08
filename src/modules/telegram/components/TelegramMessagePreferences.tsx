import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';
import { useAuthStore } from '../../auth/stores/auth.store';
import { DEFAULT_TELEGRAM_SECTIONS, normalizeTelegramSections, TELEGRAM_SECTION_OPTIONS } from '../../../engine/telegramPreferences';
import type { TelegramUserSection } from '../../../engine/telegramPreferences';
import { formatTelegramHtml, formatTelegramTickerDigest } from '../../../engine/telegramFormatter';

function previewMessage(sections: TelegramUserSection[]) {
  const date = '2026-10-07';
  const dates: string[] = [];
  const cursor = new Date(`${date}T00:00:00Z`);
  while (dates.length < 21) {
    if (![0, 6].includes(cursor.getUTCDay())) dates.unshift(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  const prices = dates.map((session, index) => ({ date: session, close: index === 20 ? 6050 : 6100, volume: index === 20 ? 162690800 : 100000000, high: 6100, low: 5975 }));
  const block = formatTelegramHtml('BBCA', 'MONITORING', { asOfDate: date, facts: [], limitedInterpretations: [] }, {
    prices,
    benchmark: [{ date: dates[19], close: 6193.17 }, { date, close: 6146.72 }],
    filings: [{ title: 'Contoh pengumuman emiten (simulasi)', publishedAt: date }],
    news: [{ title: 'Contoh berita terkait BBCA (simulasi)', summary: 'Ringkasan berita ditampilkan di bagian paling bawah.', publishedAt: date }],
    evalResult: { hasIncompleteData: false, activeTriggerCount: 0 },
    includeSections: sections, engineSummaryOnly: true, includeHeader: false, includeFooter: false,
    isMorningBriefing: true,
  });
  const message = formatTelegramTickerDigest('morning', '2026-10-08', 'BBCA', block, '07.00', undefined, { purpose: 'briefing', sessionDate: date });
  return message.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
}

export function TelegramMessagePreferences() {
  const userId = useAuthStore(state => state.currentUser?.id);
  const queryClient = useQueryClient();
  const [sections, setSections] = useState<TelegramUserSection[]>([...DEFAULT_TELEGRAM_SECTIONS]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [saveError, setSaveError] = useState('');
  const queryKey = ['telegram-preferences', userId];
  const query = useQuery({
    queryKey,
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('telegram_preferences').select('sections').eq('user_id', userId!).maybeSingle();
      if (error) throw new Error('Pengaturan Telegram belum dapat dimuat. Pastikan migrasi pengaturan sudah dipasang.');
      return normalizeTelegramSections(data?.sections);
    },
    staleTime: 30_000,
  });
  useEffect(() => {
    setSections([...DEFAULT_TELEGRAM_SECTIONS]); setDirty(false); setNotice(''); setSaveError('');
  }, [userId]);
  useEffect(() => {
    if (query.data && !dirty) setSections([...query.data]);
  }, [query.data, dirty]);

  async function save() {
    if (!userId || !sections.length || saving || !query.data) return;
    const accountId = userId;
    const chosen = [...sections];
    setSaving(true); setNotice(''); setSaveError('');
    try {
      // RLS additionally enforces ownership using the authenticated session.
      const { data, error } = await supabase.from('telegram_preferences').upsert({
        user_id: accountId, sections: chosen, updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' }).select('sections').single();
      if (error) throw error;
      const saved = normalizeTelegramSections(data.sections);
      queryClient.setQueryData(['telegram-preferences', accountId], saved);
      if (useAuthStore.getState().currentUser?.id !== accountId) return;
      setSections(saved); setDirty(false); setNotice('Pengaturan tersimpan untuk akunmu. Berlaku pada pesan yang disusun berikutnya.');
    } catch {
      if (useAuthStore.getState().currentUser?.id === accountId) setSaveError('Pengaturan gagal disimpan. Pilihanmu belum berlaku; coba simpan lagi.');
    } finally {
      if (useAuthStore.getState().currentUser?.id === accountId) setSaving(false);
    }
  }

  const unavailable = !query.data || query.isError || saving;
  return <section className="rounded-xl border border-border bg-secondary/40 p-5" aria-labelledby="telegram-preferences-title">
    <h2 id="telegram-preferences-title" className="font-semibold text-text-main">Isi pesan Telegram</h2>
    <p className="mt-2 text-sm leading-relaxed text-text-muted">Pilih bagian untuk seluruh saham di watchlist akunmu. Evaluasi tetap berjalan lengkap. Tanggal sesi, sumber data, dan disclaimer tetap disertakan.</p>
    {query.isPending && <p role="status" className="mt-4 text-sm text-text-muted">Memuat pengaturan akun...</p>}
    {query.isError && <div role="alert" className="mt-4 text-sm text-red-300">{query.error.message}<button type="button" onClick={() => void query.refetch()} className="ml-2 min-h-11 text-primary underline">Coba lagi</button></div>}
    <div className="mt-5 grid gap-6 lg:grid-cols-2">
      <div>
        <fieldset disabled={unavailable} className="space-y-2 disabled:opacity-60">
          <legend className="mb-2 text-sm font-medium text-text-main">Bagian yang dikirim</legend>
          {TELEGRAM_SECTION_OPTIONS.map(option => <label key={option.id} className="flex min-h-14 cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-secondary">
            <input type="checkbox" checked={sections.includes(option.id)} onChange={event => {
              const checked = event.target.checked;
              setSections(current => checked ? DEFAULT_TELEGRAM_SECTIONS.filter(section => section === option.id || current.includes(section)) : current.filter(section => section !== option.id));
              setDirty(true); setNotice(''); setSaveError('');
            }} className="mt-1 h-4 w-4 accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" />
            <span><span className="block text-sm font-medium text-text-main">{option.label}</span><span className="mt-1 block text-xs leading-relaxed text-text-muted">{option.description}</span></span>
          </label>)}
        </fieldset>
        <p className="mt-3 text-xs text-text-muted">Pilih minimal satu bagian. Tanpa pengaturan tersimpan, semua bagian aktif. Pesan yang sudah mengantre tetap memakai isi sebelumnya.</p>
        {!sections.length && <p role="status" className="mt-2 text-sm text-amber-300">Pilih minimal satu bagian sebelum menyimpan.</p>}
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" disabled={unavailable || !dirty || !sections.length} onClick={() => void save()} className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-bg disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{saving ? 'Menyimpan...' : 'Simpan pengaturan'}</button>
          <button type="button" disabled={unavailable} onClick={() => { setSections([...DEFAULT_TELEGRAM_SECTIONS]); setDirty(true); setNotice(''); setSaveError(''); }} className="min-h-11 rounded-lg border border-border px-4 text-sm text-text-main focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">Gunakan semua bagian</button>
        </div>
        {notice && <p role="status" className="mt-3 text-sm text-accent">{notice}</p>}
        {saveError && <p role="alert" className="mt-3 text-sm text-red-300">{saveError}</p>}
      </div>
      <div>
        <h3 className="text-sm font-medium text-text-main">Preview satu bubble saham</h3>
        <p className="mt-1 text-xs text-text-muted">Simulasi BBCA, bukan data live. Bagian tanpa data baru dapat tidak muncul pada pesan sebenarnya.</p>
        <pre className="mt-3 max-h-[560px] overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-bg p-4 font-sans text-sm leading-relaxed text-text-main">{previewMessage(sections)}</pre>
      </div>
    </div>
  </section>;
}
