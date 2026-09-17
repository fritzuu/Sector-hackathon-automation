import { z } from 'zod';

export const DailyTransactionSchema = z.object({
  symbol: z.string(),
  date: z.string(), // YYYY-MM-DD
  open: z.number().nonnegative(),
  high: z.number().nonnegative(),
  low: z.number().nonnegative(),
  close: z.number().nonnegative(),
  volume: z.number().nonnegative(),
  value: z.number().nonnegative().optional(),
});

export type DailyTransaction = z.infer<typeof DailyTransactionSchema>;

export const BenchmarkDataSchema = z.object({
  symbol: z.string().default('^JKSE'),
  date: z.string(), // YYYY-MM-DD
  close: z.number().nonnegative(),
  previousClose: z.number().nonnegative().optional(),
  percentChange: z.number(), // e.g. 0.015 for +1.5%
});

export type BenchmarkData = z.infer<typeof BenchmarkDataSchema>;

export const CompanyFilingSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  title: z.string(),
  category: z.string(),
  publishedAt: z.string(), // ISO 8601 or YYYY-MM-DDTHH:mm:ss
  sourceUrl: z.string().url().optional(),
  isVerified: z.boolean().default(true),
});

export type CompanyFiling = z.infer<typeof CompanyFilingSchema>;

export const TickerDatasetSchema = z.object({
  symbol: z.string(),
  asOfDate: z.string(),
  historicalPrices: z.array(DailyTransactionSchema),
  benchmarkPrices: z.array(BenchmarkDataSchema),
  filings: z.array(CompanyFilingSchema),
  lastEvaluatedFilingId: z.string().optional().nullable(),
});

export type TickerDataset = z.infer<typeof TickerDatasetSchema>;
