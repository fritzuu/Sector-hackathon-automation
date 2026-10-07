import { EvaluationResult, CaseStatus, RenderedTemplate } from '../types/engine.ts';
import { VolumeEvidence, RelativeMovementEvidence } from '../types/engine.ts';

export const STANDARD_DISCLAIMER =
  'Pemberitahuan otomatis SIBA (Sistem Informasi Bursa dan Aset) berbasis aturan deterministik dan data resmi Sectors API. Bukan saran investasi, rekomendasi beli/jual, atau prediksi harga. Seluruh keputusan investasi merupakan tanggung jawab mandiri investor (DYOR).';

export function renderCaseTemplate(
  evalResult: EvaluationResult,
  caseStatus: CaseStatus
): RenderedTemplate {
  const { symbol, evaluationDate, ruleResults, hasIncompleteData, missingDataReasons } = evalResult;

  const facts: string[] = [];
  const limitedInterpretations: string[] = [];

  if (hasIncompleteData) {
    facts.push(`Status data: Data historis/benchmark tidak lengkap pada sesi ${evaluationDate}.`);
    for (const reason of missingDataReasons) {
      facts.push(`- Keterbatasan: ${reason}`);
    }
    limitedInterpretations.push(
      'Evaluasi aturan ditangguhkan untuk menjaga akurasi dan mencegah sinyal palsu.'
    );
  } else {
    for (const result of ruleResults) {
      if (result.ruleId === 'ABNORMAL_VOLUME') {
        const ev = result.evidence as VolumeEvidence;
        if (result.isTriggered) {
          facts.push(
            `Volume Transaksi: ${ev.latestVolume.toLocaleString('id-ID')} lot (${ev.multiplier.toFixed(2)}x dibanding median 20 sesi bursa: ${ev.medianVolume20Days.toLocaleString('id-ID')} lot).`
          );
          limitedInterpretations.push(
            `Aktivitas volume transaksi melonjak signifikan di atas batas wajar (≥ ${ev.threshold}x median 20 hari).`
          );
        }
      } else if (result.ruleId === 'RELATIVE_MOVEMENT') {
        const ev = result.evidence as RelativeMovementEvidence;
        if (result.isTriggered) {
          const dir = ev.stockReturn >= 0 ? '+' : '';
          const bDir = ev.benchmarkReturn >= 0 ? '+' : '';
          facts.push(
            `Divergensi Harga: Return Saham ${dir}${(ev.stockReturn * 100).toFixed(2)}% vs IHSG ${bDir}${(ev.benchmarkReturn * 100).toFixed(2)}% (Spread: ${ev.spreadPercentagePoints.toFixed(2)}%).`
          );
          limitedInterpretations.push(
            `Pergerakan harga saham menyimpang tajam dari tren indeks acuan bursa (selisih ≥ ${ev.thresholdPercentagePoints}%).`
          );
        }
      } else if (result.ruleId === 'NEW_FILING') {
        const ev = result.evidence as any;
        if (result.isTriggered && ev.newFilings && ev.newFilings.length > 0) {
          facts.push(
            `Keterbukaan Informasi: Ditemukan ${ev.newFilings.length} pengumuman baru (termasuk: "${ev.newFilings[0].title}").`
          );
          limitedInterpretations.push(
            `Terdapat pengumuman resmi dari emiten yang berpotensi menjadi katalis pergerakan pasar.`
          );
        }
      }
    }

    if (facts.length === 0) {
      facts.push(`Tidak ada anomali yang terdeteksi pada sesi ${evaluationDate}.`);
      limitedInterpretations.push('Seluruh indikator volume dan harga berada dalam rentang normal.');
    }
  }

  // Format Plain Text
  const plainTextLines: string[] = [
    `[SIBA — ${symbol}] Status: ${caseStatus} (${evaluationDate})`,
    '',
    '📌 FAKTA (Terverifikasi Data Sectors API):',
    ...facts.map((f) => `• ${f}`),
    '',
    '🔍 INTERPRETASI TERBATAS (Tanpa Prediksi):',
    ...limitedInterpretations.map((i) => `• ${i}`),
    '',
    `⚠️ DISCLAIMER:\n${STANDARD_DISCLAIMER}`,
  ];

  return {
    symbol,
    asOfDate: evaluationDate,
    status: caseStatus,
    facts,
    limitedInterpretations,
    disclaimer: STANDARD_DISCLAIMER,
    plainText: plainTextLines.join('\n'),
  };
}
