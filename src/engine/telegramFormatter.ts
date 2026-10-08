export interface TelegramForeignFlow {
  buy: number;
  sell: number;
  net: number;
  accumulatedNet5Days?: number;
}

export interface TelegramNewsItem {
  title: string;
  summary?: string;
  source?: string;
  url?: string;
  publishedAt?: string;
}

export interface TelegramAgendaItem {
  title: string;
  eventDate: string;
  daysLeft?: number;
  location?: string;
  detail?: string;
}

export interface TelegramFinancials {
  period: string;
  revenue?: string;
  assets?: string;
  cash?: string;
}

export type TelegramFormatterSection =
  | 'price'
  | 'benchmark'
  | 'foreignFlow'
  | 'news'
  | 'filings'
  | 'agenda'
  | 'financials'
  | 'volume'
  | 'engine';

export interface TelegramFormatterContext {
  prices?: any[];
  benchmark?: any[];
  filings?: any[];
  foreignFlow?: TelegramForeignFlow;
  news?: TelegramNewsItem[];
  agenda?: TelegramAgendaItem[];
  financials?: TelegramFinancials;
  evalResult?: any;
  event?: any;
  dashboardUrl?: string;
  wibTime?: string;
  isMorningBriefing?: boolean;
  includeSections?: TelegramFormatterSection[];
  includeHeader?: boolean;
  includeFooter?: boolean;
}

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatIndonesianDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const raw = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const parts = raw.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (monthIdx >= 0 && monthIdx < 12 && !isNaN(day)) {
        return `${day} ${INDONESIAN_MONTHS[monthIdx]} ${year}`;
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return `${d.getDate()} ${INDONESIAN_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    }
  } catch {
    // fallback to original
  }
  return dateStr;
}

export function formatRupiahScale(amount: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0';
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000_000) {
    const val = abs / 1_000_000_000_000;
    return `${val.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} triliun`;
  }
  if (abs >= 1_000_000_000) {
    const val = abs / 1_000_000_000;
    return `${val.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} miliar`;
  }
  if (abs >= 1_000_000) {
    const val = abs / 1_000_000;
    return `${val.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} juta`;
  }
  return abs.toLocaleString('id-ID');
}

export function formatTelegramHtml(
  symbol: string,
  status: string,
  template: any,
  context: TelegramFormatterContext = {}
): string {
  const cleanSymbol = symbol.toUpperCase().replace('.JK', '');
  const dashboardUrl =
    context.dashboardUrl ||
    ((globalThis as any).Deno ? (globalThis as any).Deno.env.get('DASHBOARD_URL') : null) ||
    'https://siba.investor.id';

  const isMorning = !!context.isMorningBriefing;
  const includesSection = (section: TelegramFormatterSection) =>
    !context.includeSections || context.includeSections.includes(section);
  const asOfDate = template?.asOfDate || '';
  const dateFormatted = formatIndonesianDate(asOfDate);

  // Determine current WIB time string
  let wibTime = context.wibTime;
  if (!wibTime) {
    const now = new Date();
    const utcMs = now.getTime();
    const wibDate = new Date(utcMs + 7 * 60 * 60 * 1000);
    const hh = String(wibDate.getUTCHours()).padStart(2, '0');
    const mm = String(wibDate.getUTCMinutes()).padStart(2, '0');
    wibTime = `${hh}.${mm}`;
  }

  const sections: string[] = [];

  // ==========================================
  // 1. HEADER (Format 2 Aesthetics)
  // ==========================================
  const headerIcon = isMorning ? '☀️' : '🌙';
  const headerTitle = isMorning ? 'Pembaruan Pagi' : 'Update Watchlist';
  
  // Status badge to preserve SIBA audit visibility
  const statusBadge =
    status === 'OPEN'
      ? ' 🚨 <i>[Kasus Baru]</i>'
      : status === 'UPDATED'
      ? ' 🔄 <i>[Perkembangan]</i>'
      : status === 'CLOSED'
      ? ' ✅ <i>[Selesai]</i>'
      : status === 'DATA_INCOMPLETE'
      ? ' ⚠️ <i>[Data Belum Lengkap]</i>'
      : '';

  if (context.includeHeader !== false) {
    sections.push(
      `<b>${headerIcon} ${headerTitle} — ${escapeHtml(cleanSymbol)}</b>${statusBadge}\n` +
      `📅 ${dateFormatted || escapeHtml(asOfDate)}`
    );
  }

  // Extract prices
  const prices = context.prices || [];
  const latestPrice = prices.length > 0 ? prices[prices.length - 1] : null;
  const prevPrice = prices.length > 1 ? prices[prices.length - 2] : null;

  // ==========================================
  // 2. HARGA PENUTUPAN
  // ==========================================
  if (includesSection('price') && latestPrice) {
    const close = Number(latestPrice.close);
    const prevClose = prevPrice ? Number(prevPrice.close) : null;
    let changeText = '';

    if (prevClose !== null && prevClose > 0) {
      const diff = close - prevClose;
      const pct = (diff / prevClose) * 100;
      const dir = diff > 0 ? 'naik' : diff < 0 ? 'turun' : 'stagnan';
      const sign = diff > 0 ? '+' : '';
      changeText = ` · ${dir} ${sign}${pct.toFixed(2)}%`;
    }

    let priceLines = `💵 <b>Harga penutupan — ${dateFormatted || escapeHtml(latestPrice.date)}</b>\n`;
    priceLines += `<b>Rp${close.toLocaleString('id-ID')}</b>${changeText}`;

    if (prevClose !== null) {
      const prevDateFormatted = prevPrice?.date ? formatIndonesianDate(prevPrice.date) : 'sesi sebelumnya';
      priceLines += `\nPenutupan ${prevDateFormatted}: Rp${prevClose.toLocaleString('id-ID')}.`;
    }

    if (latestPrice.low !== undefined && latestPrice.high !== undefined) {
      priceLines += `\nRentang harga sesi ini: Rp${Number(latestPrice.low).toLocaleString('id-ID')}–Rp${Number(latestPrice.high).toLocaleString('id-ID')}.`;
    }

    sections.push(priceLines);
  }

  const benchmark = context.benchmark || [];
  const latestIHSG = benchmark.length > 0 ? benchmark[benchmark.length - 1] : null;
  const prevIHSG = benchmark.length > 1 ? benchmark[benchmark.length - 2] : null;

  // ==========================================
  // 4. ALIRAN DANA ASING (FOREIGN FLOW - Modular)
  // ==========================================
  if (includesSection('foreignFlow') && context.foreignFlow) {
    const ff = context.foreignFlow;
    const netType = ff.net >= 0 ? 'Net buy' : 'Net sell';
    let ffBlock = `🌏 <b>Aliran dana asing — ${dateFormatted}</b>\n`;
    ffBlock += `Pembelian: Rp${formatRupiahScale(ff.buy)}\n`;
    ffBlock += `Penjualan: Rp${formatRupiahScale(ff.sell)}\n`;
    ffBlock += `<b>${netType}: Rp${formatRupiahScale(Math.abs(ff.net))}</b>`;
    if (ff.accumulatedNet5Days !== undefined) {
      const accNetType = ff.accumulatedNet5Days >= 0 ? 'net buy' : 'net sell';
      ffBlock += `\n\nTotal lima sesi terakhir: ${accNetType} Rp${formatRupiahScale(Math.abs(ff.accumulatedNet5Days))}.`;
    }
    sections.push(ffBlock);
  }

  // ==========================================
  // 5. BERITA TERKAIT (NEWS - Modular)
  // ==========================================
  if (includesSection('news') && context.news && context.news.length > 0) {
    // Maximum 3 articles as per PDF Hal 2
    const topNews = context.news.slice(0, 3);
    const newsLines: string[] = [`📰 <b>Berita terkait ${escapeHtml(cleanSymbol)} — ${dateFormatted}</b>`];
    for (const item of topNews) {
      let itemText = `<b>${escapeHtml(item.title)}</b>`;
      if (item.summary) {
        itemText += `\n${escapeHtml(item.summary)}`;
      }
      if (item.url) {
        const sourceName = item.source ? escapeHtml(item.source) : 'Baca Berita';
        itemText += `\n🔗 <a href="${escapeHtml(item.url)}">${sourceName}</a>`;
      }
      newsLines.push(itemText);
    }
    sections.push(newsLines.join('\n\n'));
  }

  // ==========================================
  // 6. KETERBUKAAN INFORMASI / FILING (Modular)
  // ==========================================
  const filings = context.filings || [];
  // Also check if template has filing facts
  const hasFilingRule = template?.facts?.some((f: string) => f.toLowerCase().includes('keterbukaan'));

  const includeFilings = context.includeSections
    ? includesSection('filings')
    : includesSection('filings') && hasFilingRule;
  if (includeFilings && filings.length > 0) {
    const recentFilings = filings.slice(0, 2);
    const filingLines: string[] = ['📑 <b>Catatan kepemilikan &amp; keterbukaan terbaru</b>'];
    for (const f of recentFilings) {
      let card = `<b>${escapeHtml(f.title || 'Pengumuman Resmi Emiten')}</b>`;
      if (f.holderName) {
        card += `\n• Pemegang saham: ${escapeHtml(f.holderName)}`;
      }
      if (f.transactionType) {
        card += `\n• Jenis aksi: ${escapeHtml(f.transactionType)}`;
      }
      if (f.transactionValue || f.amount) {
        const valStr = f.transactionValue ? `Rp${formatRupiahScale(Number(f.transactionValue))}` : `${Number(f.amount).toLocaleString('id-ID')} lembar`;
        card += `\n• Nilai/Jumlah: ${valStr}`;
      }
      if (f.publishedAt) {
        card += `\n• Tanggal pengumuman: ${formatIndonesianDate(f.publishedAt)}`;
      }
      if (f.sourceUrl) {
        card += `\n🔗 <a href="${escapeHtml(f.sourceUrl)}">Dokumen Keterbukaan BEI</a>`;
      }
      filingLines.push(card);
    }
    sections.push(filingLines.join('\n\n'));
  }

  // ==========================================
  // 7. AGENDA PERUSAHAAN (Modular)
  // ==========================================
  if (includesSection('agenda') && context.agenda && context.agenda.length > 0) {
    const topAgenda = context.agenda[0];
    let agendaBlock = `📅 <b>Agenda perusahaan</b>\n`;
    agendaBlock += `<b>${escapeHtml(topAgenda.title)}</b> tercatat pada <b>${formatIndonesianDate(topAgenda.eventDate)}</b>`;
    if (topAgenda.daysLeft !== undefined) {
      agendaBlock += `, ${topAgenda.daysLeft} hari lagi.`;
    } else {
      agendaBlock += `.`;
    }
    if (topAgenda.detail) {
      agendaBlock += `\n${escapeHtml(topAgenda.detail)}`;
    }
    sections.push(agendaBlock);
  }

  // ==========================================
  // 8. LAPORAN KEUANGAN TERAKHIR (Modular)
  // ==========================================
  if (includesSection('financials') && context.financials) {
    const fin = context.financials;
    let finBlock = `📑 <b>Laporan keuangan terbaru yang tersedia</b>\n`;
    finBlock += `Periode laporan: ${escapeHtml(fin.period)}\n`;
    if (fin.revenue) finBlock += `\n• Pendapatan: ${escapeHtml(fin.revenue)}`;
    if (fin.assets) finBlock += `\n• Total aset: ${escapeHtml(fin.assets)}`;
    if (fin.cash) finBlock += `\n• Kas &amp; setara kas: ${escapeHtml(fin.cash)}`;
    sections.push(finBlock);
  }

  // ==========================================
  // 9. PERBANDINGAN PASAR / IHSG
  // ==========================================
  if (includesSection('benchmark') && latestIHSG) {
    const ihsgPrice = Number(latestIHSG.close ?? latestIHSG.price ?? 0);
    const ihsgPriceText = ihsgPrice.toLocaleString('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const ihsgDate = escapeHtml(formatIndonesianDate(latestIHSG.date));

    if (latestPrice && latestIHSG.date === latestPrice.date) {
      const prevIhsgPrice = prevIHSG
        ? Number(prevIHSG.close ?? prevIHSG.price ?? ihsgPrice)
        : ihsgPrice;
      const ihsgDiff = prevIhsgPrice > 0
        ? ((ihsgPrice - prevIhsgPrice) / prevIhsgPrice) * 100
        : 0;
      const ihsgSign = ihsgDiff > 0 ? '+' : '';
      let ihsgBlock = `📊 <b>IHSG</b>\n`;
      ihsgBlock += `IHSG sesi ${ihsgDate}: <b>${ihsgPriceText}</b> (${ihsgSign}${ihsgDiff.toFixed(2)}%)`;

      if (prevPrice) {
        const stockClose = Number(latestPrice.close);
        const stockPrevClose = Number(prevPrice.close);
        const stockPct = stockPrevClose > 0
          ? ((stockClose - stockPrevClose) / stockPrevClose) * 100
          : 0;
        const spread = stockPct - ihsgDiff;
        const relStrength = spread >= 0 ? 'lebih kuat' : 'lebih lemah';
        const spreadSign = spread >= 0 ? '+' : '';
        ihsgBlock += `\nKinerja vs IHSG: ${relStrength} ${spreadSign}${spread.toFixed(2)} poin persentase.`;
      }

      sections.push(ihsgBlock);
    } else if (latestPrice) {
      sections.push(
        `📊 <b>IHSG</b>\n` +
        `Data terakhir tersedia untuk ${ihsgDate}: <b>${ihsgPriceText}</b>.\n` +
        `Perbandingan dengan ${escapeHtml(cleanSymbol)} sesi ${escapeHtml(formatIndonesianDate(latestPrice.date))} belum ditampilkan karena tanggal data berbeda.`
      );
    } else {
      sections.push(`📊 <b>IHSG</b>\nData terakhir tersedia untuk ${ihsgDate}: <b>${ihsgPriceText}</b>.`);
    }
  } else if (includesSection('benchmark') && latestPrice) {
    sections.push(
      `📊 <b>IHSG</b>\nData IHSG belum tersedia; perbandingan performa belum ditampilkan.`
    );
  }

  // ==========================================
  // 10. SOROTAN VOLUME
  // ==========================================
  if (includesSection('volume') && latestPrice && latestPrice.volume !== undefined && latestPrice.volume !== null) {
    const volume = Number(latestPrice.volume);
    const volumeEvidence = context.evalResult?.ruleResults?.find(
      (result: any) => result.ruleId === 'ABNORMAL_VOLUME'
    )?.evidence;
    let volumeBlock =
      `👀 <b>Sorotan volume</b>\n` +
      `Volume sesi ${escapeHtml(formatIndonesianDate(latestPrice.date))}: <b>${volume.toLocaleString('id-ID')}</b>`;

    if (volumeEvidence) {
      const median = Number(volumeEvidence.medianVolume20Days);
      const multiplier = Number(volumeEvidence.multiplier);
      const threshold = Number(volumeEvidence.threshold);
      if (volumeEvidence.tradingDaysEvaluated >= 20 && median > 0 && Number.isFinite(multiplier)) {
        volumeBlock +=
          `\nRasio terhadap median 20 sesi: ${multiplier.toLocaleString('id-ID', { maximumFractionDigits: 2 })}x ` +
          `(batas deteksi ≥ ${threshold.toLocaleString('id-ID', { maximumFractionDigits: 2 })}x).`;
      } else {
        volumeBlock += '\nPerbandingan dengan median 20 sesi belum dapat dihitung dari baseline yang tersedia.';
      }
    } else {
      volumeBlock += '\nPerbandingan dengan median 20 sesi tidak tersedia pada hasil evaluasi.';
    }

    sections.push(volumeBlock);
  }

  // ==========================================
  // 11. FAKTA LAIN & INTERPRETASI TERBATAS (Fallback/Engine audit)
  // ==========================================
  // If no price/filing context was passed, ensure template facts are visible
  if (
    includesSection('engine') &&
    (prices.length === 0 || context.includeSections !== undefined) &&
    template?.facts &&
    template.facts.length > 0
  ) {
    let fallbackFacts = `<b>📌 FAKTA (Terverifikasi Data Sectors API):</b>\n`;
    template.facts.forEach((f: string) => {
      fallbackFacts += `• ${escapeHtml(f)}\n`;
    });
    sections.push(fallbackFacts.trim());
  }

  if (includesSection('engine') && template?.limitedInterpretations && template.limitedInterpretations.length > 0) {
    let interBlock = `🔍 <b>Interpretasi Terbatas (Tanpa Prediksi):</b>\n`;
    template.limitedInterpretations.forEach((item: string) => {
      interBlock += `• ${escapeHtml(item)}\n`;
    });
    sections.push(interBlock.trim());
  }

  // ==========================================
  // 12. FOOTER & DISCLAIMER
  // ==========================================
  if (context.includeFooter !== false) {
    const disclaimerText = escapeHtml(
      template?.disclaimer ||
      'Evaluasi otomatis SIBA berbasis aturan deterministik dan data resmi Sectors API. Bukan rekomendasi investasi (DYOR).'
    );

    let footer = `<i>Sumber data: Sectors API. Diperiksa sekitar ${escapeHtml(wibTime)} WIB.</i>\n\n`;
    footer += `⚠️ <b>Disclaimer:</b>\n<i>${disclaimerText}</i>\n\n`;
    footer += `🔗 <a href="${escapeHtml(dashboardUrl)}/?ticker=${escapeHtml(cleanSymbol)}">Lihat detail kasus di Dashboard SIBA →</a>`;

    sections.push(footer);
  }

  return sections.join('\n\n');
}

export function formatTelegramDigest(
  checkpoint: 'evening' | 'morning',
  date: string,
  tickerBlocks: string[],
  wibTime: string,
  dashboardUrl = 'https://siba.investor.id'
): string {
  const blocks = tickerBlocks.filter((block) => block.trim().length > 0);
  if (blocks.length === 0) return '';

  const title = checkpoint === 'morning' ? '☀️ PEMBARUAN PAGI' : '🌙 RINGKASAN MALAM';
  const footer =
    `<i>Sumber data: Sectors API. Diperiksa sekitar ${escapeHtml(wibTime)} WIB.</i>\n\n` +
    `⚠️ <b>Disclaimer:</b>\n<i>Data dapat tidak lengkap atau terlambat. Bukan rekomendasi investasi.</i>\n\n` +
    `🔗 <a href="${escapeHtml(dashboardUrl)}">Lihat detail di Dashboard SIBA →</a>`;

  return `<b>${title} | ${escapeHtml(formatIndonesianDate(date))}</b>\n\n${blocks.join('\n\n')}\n\n${footer}`;
}

export function formatTelegramTickerDigest(
  checkpoint: 'evening' | 'morning',
  date: string,
  symbol: string,
  tickerBlock: string,
  wibTime: string,
  dashboardUrl = 'https://siba.investor.id'
): string {
  const cleanSymbol = symbol.toUpperCase().replace(/\.JK$/, '');
  const title = checkpoint === 'morning' ? '☀️ Pembaruan Pagi' : '🌙 Update Watchlist';
  const footer =
    `<i>Sumber data: Sectors API. Diperiksa sekitar ${escapeHtml(wibTime)} WIB.</i>\n\n` +
    `⚠️ <b>Disclaimer:</b>\n<i>Data dapat tidak lengkap atau terlambat. Bukan rekomendasi investasi.</i>\n\n` +
    `🔗 <a href="${escapeHtml(dashboardUrl)}/?ticker=${escapeHtml(cleanSymbol)}">Lihat detail kasus di Dashboard SIBA →</a>`;

  return `<b>${title} — ${escapeHtml(cleanSymbol)}</b>\n` +
    `📅 ${escapeHtml(formatIndonesianDate(date))}\n\n` +
    `${tickerBlock}\n\n${footer}`;
}
