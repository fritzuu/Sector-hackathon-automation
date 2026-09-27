import { DailyTransaction, BenchmarkData, CompanyFiling, TickerDataset } from '../types/sectors.js';

// Generates 20 preceding baseline days + 1 target day
export function generateDailyTransactions(
  symbol: string,
  basePrice: number,
  baseVolume: number,
  lastDayVolumeMultiplier: number = 1.0,
  lastDayPriceChangePercent: number = 0.0,
  daysCount: number = 21
): DailyTransaction[] {
  const transactions: DailyTransaction[] = [];
  const startDate = new Date('2026-08-01');

  for (let i = 0; i < daysCount; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];

    const isLastDay = i === daysCount - 1;
    const volume = isLastDay ? Math.round(baseVolume * lastDayVolumeMultiplier) : baseVolume;
    
    let close = basePrice;
    if (isLastDay) {
      close = Math.round(basePrice * (1 + lastDayPriceChangePercent));
    } else {
      close = basePrice; // constant baseline so (lastClose - prevClose)/prevClose is exactly lastDayPriceChangePercent
    }

    transactions.push({
      symbol,
      date: dateStr,
      open: close,
      high: close + 25,
      low: close - 25,
      close,
      volume,
      value: close * volume,
    });
  }

  return transactions;
}

export function generateBenchmarkData(
  dates: string[],
  lastDayPercentChange: number = 0.005 // default +0.5%
): BenchmarkData[] {
  return dates.map((date, index) => {
    const isLast = index === dates.length - 1;
    return {
      symbol: '^JKSE',
      date,
      close: 7500 + index * 10,
      percentChange: isLast ? lastDayPercentChange : 0.002,
    };
  });
}

// Fixture 1: Baseline normal day (no rules triggered: stock +0.5%, benchmark +0.5%, volume 1.0x)
export const normalDataset: TickerDataset = (() => {
  const symbol = 'BBCA';
  const prices = generateDailyTransactions(symbol, 10000, 5000000, 1.0, 0.005); // +0.5% return, 1.0x volume
  const benchmark = generateBenchmarkData(prices.map((p) => p.date), 0.005); // +0.5% return -> diff 0.0%
  return {
    symbol,
    asOfDate: prices[prices.length - 1].date,
    historicalPrices: prices,
    benchmarkPrices: benchmark,
    filings: [],
    lastEvaluatedFilingId: null,
  };
})();

// Fixture 2: Abnormal Volume Triggered (3.2x median, stock +0.5%, benchmark +0.5% -> movement diff 0.0%)
export const abnormalVolumeDataset: TickerDataset = (() => {
  const symbol = 'TLKM';
  const prices = generateDailyTransactions(symbol, 3000, 10000000, 3.2, 0.005);
  const benchmark = generateBenchmarkData(prices.map((p) => p.date), 0.005);
  return {
    symbol,
    asOfDate: prices[prices.length - 1].date,
    historicalPrices: prices,
    benchmarkPrices: benchmark,
    filings: [],
    lastEvaluatedFilingId: null,
  };
})();

// Fixture 3: Relative Movement Triggered (Stock +5.0%, IHSG +0.5% -> Spread 4.5% >= 2.0%, volume 1.0x)
export const relativeMovementDataset: TickerDataset = (() => {
  const symbol = 'ASII';
  const prices = generateDailyTransactions(symbol, 5000, 2000000, 1.0, 0.05); // +5.0%
  const benchmark = generateBenchmarkData(prices.map((p) => p.date), 0.005); // +0.5%
  return {
    symbol,
    asOfDate: prices[prices.length - 1].date,
    historicalPrices: prices,
    benchmarkPrices: benchmark,
    filings: [],
    lastEvaluatedFilingId: null,
  };
})();

// Fixture 4: New Filing Triggered
export const mockFiling: CompanyFiling = {
  id: 'FILING-2026-09-17-001',
  symbol: 'UNTR',
  title: 'Laporan Keterbukaan Informasi: Perubahan Susunan Direksi',
  category: 'Corporate Action',
  publishedAt: '2026-09-17T09:30:00+07:00',
  sourceUrl: 'https://idx.co.id/filings/FILING-2026-09-17-001',
  isVerified: true,
};

export const newFilingDataset: TickerDataset = (() => {
  const symbol = 'UNTR';
  const prices = generateDailyTransactions(symbol, 25000, 1000000, 1.0, 0.005);
  const benchmark = generateBenchmarkData(prices.map((p) => p.date), 0.005);
  return {
    symbol,
    asOfDate: prices[prices.length - 1].date,
    historicalPrices: prices,
    benchmarkPrices: benchmark,
    filings: [mockFiling],
    lastEvaluatedFilingId: null, // Previous seen is null -> triggered
  };
})();

// Fixture 5: Incomplete Historical Data (< 21 days)
export const incompleteDataDataset: TickerDataset = (() => {
  const symbol = 'GOTO';
  const prices = generateDailyTransactions(symbol, 60, 50000000, 2.5, 0.05, 10); // only 10 days
  const benchmark = generateBenchmarkData(prices.map((p) => p.date), 0.005);
  return {
    symbol,
    asOfDate: prices[prices.length - 1].date,
    historicalPrices: prices,
    benchmarkPrices: benchmark,
    filings: [],
    lastEvaluatedFilingId: null,
  };
})();
