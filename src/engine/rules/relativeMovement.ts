import { DailyTransaction, BenchmarkData } from '../../types/sectors.ts';
import { RuleResult, RelativeMovementEvidence } from '../../types/engine.ts';

export function evaluateRelativeMovement(
  transactions: DailyTransaction[],
  benchmarkData: BenchmarkData[],
  thresholdPercentagePoints: number = 2.0
): RuleResult {
  const ruleId = 'RELATIVE_MOVEMENT';
  const name = 'Pergerakan Relatif Signifikan terhadap IHSG (|Δ| >= 2.0%)';

  if (!transactions || transactions.length < 2) {
    return {
      ruleId,
      name,
      isTriggered: false,
      summary: 'Data harga saham harian tidak cukup untuk menghitung return harian.',
      evidence: {
        stockReturn: 0,
        benchmarkReturn: 0,
        spreadPercentagePoints: 0,
        thresholdPercentagePoints,
      },
      missingDataReasons: ['Data historis harga saham minimal 2 hari bursa diperlukan.'],
    };
  }

  if (!benchmarkData || benchmarkData.length === 0) {
    return {
      ruleId,
      name,
      isTriggered: false,
      summary: 'Data benchmark IHSG tidak tersedia untuk perbandingan.',
      evidence: {
        stockReturn: 0,
        benchmarkReturn: 0,
        spreadPercentagePoints: 0,
        thresholdPercentagePoints,
      },
      missingDataReasons: ['Data benchmark IHSG tidak ditemukan pada tanggal evaluasi.'],
    };
  }

  const sortedPrices = [...transactions].sort((a, b) => (a.date > b.date ? 1 : -1));
  const currentPrice = sortedPrices[sortedPrices.length - 1];
  const previousPrice = sortedPrices[sortedPrices.length - 2];

  const stockReturn = (currentPrice.close - previousPrice.close) / previousPrice.close;

  const targetBenchmark = benchmarkData.find((b) => b.date === currentPrice.date) || benchmarkData[benchmarkData.length - 1];
  const benchmarkReturn = targetBenchmark.percentChange;

  const stockReturnPercent = stockReturn * 100;
  const benchmarkReturnPercent = benchmarkReturn * 100;
  const spreadPercentagePoints = Math.abs(stockReturnPercent - benchmarkReturnPercent);

  const isTriggered = spreadPercentagePoints >= thresholdPercentagePoints;

  const formatPercent = (val: number) => `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;
  const summary = isTriggered
    ? `Pergerakan saham (${formatPercent(stockReturnPercent)}) menyimpang ${spreadPercentagePoints.toFixed(2)}% dari IHSG (${formatPercent(benchmarkReturnPercent)}).`
    : `Pergerakan saham (${formatPercent(stockReturnPercent)}) sejalan dengan IHSG (${formatPercent(benchmarkReturnPercent)}), selisih ${spreadPercentagePoints.toFixed(2)}%.`;

  const evidence: RelativeMovementEvidence = {
    stockReturn: parseFloat(stockReturn.toFixed(6)),
    benchmarkReturn: parseFloat(benchmarkReturn.toFixed(6)),
    spreadPercentagePoints: parseFloat(spreadPercentagePoints.toFixed(4)),
    thresholdPercentagePoints,
  };

  return {
    ruleId,
    name,
    isTriggered,
    summary,
    evidence,
  };
}
