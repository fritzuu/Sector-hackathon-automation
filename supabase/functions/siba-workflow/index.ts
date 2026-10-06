import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { runTickerStep, TickerStepResult } from "../../../src/engine/tickerStep.ts"
import { renderCaseTemplate } from "../../../src/engine/templateRenderer.ts"
import { sectorsApi } from "../../../src/services/sectorsApi.ts"
import { formatTelegramHtml } from "./formatter.ts"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
const SECTORS_API_KEY = Deno.env.get("SECTORS_API_KEY")

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
if (SECTORS_API_KEY) sectorsApi.setApiKey(SECTORS_API_KEY)

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method === "GET") return new Response(JSON.stringify({ isConfigured: !!SECTORS_API_KEY }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
  
  if (req.method === "POST") {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response("Unauthorized: Missing auth header", { status: 401, headers: corsHeaders })
    }
    try {
      const token = authHeader.replace('Bearer ', '')
      const payloadBase64 = token.split('.')[1]
      const payload = JSON.parse(atob(payloadBase64))
      if (payload.role !== 'service_role') {
        return new Response("Unauthorized: Only Service Role can execute workflow", { status: 401, headers: corsHeaders })
      }
    } catch (e) {
      return new Response("Unauthorized: Invalid token format", { status: 401, headers: corsHeaders })
    }
  }
  
  // CLEAR CACHE: Ensure Deno isolate doesn't reuse stale memory across cron runs
  sectorsApi.invalidateAll();
  
  const { data: users } = await supabase
    .from("profiles")
    .select("id, name, watchlist, telegram_chat_id")
    .eq("is_telegram_linked", true)

  if (!users || users.length === 0) return new Response("No users found", { status: 200 })

  const userIds = users.map((u) => u.id)
  const { data: workspaces } = await supabase
    .from("user_workspaces")
    .select("user_id, active_cases, case_events, run_index, market_snapshots, ticker_states")
    .in("user_id", userIds)

  const workspaceMap = new Map(workspaces?.map((w) => [w.user_id, w]) || [])

  const timestamp = new Date().toISOString()
  const dateStr = timestamp.slice(0, 10).replace(/-/g, '')

  const pricesCache = new Map<string, any>()
  const benchmarkCache = new Map<string, any>()
  const filingsCache = new Map<string, any>()

  const auditRunsToInsert: any[] = []
  const workspacesToUpsert: any[] = []
  const telegramOutboxToInsert: any[] = []

  const allWatchlistedTickers = new Set<string>();
  for (const user of users) {
    user.watchlist?.forEach((t: string) => allWatchlistedTickers.add(t));
  }
  const uniqueTickers = Array.from(allWatchlistedTickers);

  await sectorsApi.fetchBenchmarkData();

  await Promise.all(uniqueTickers.map(async (ticker) => {
    const [prices, filings] = await Promise.all([
      sectorsApi.fetchDailyTransactions(ticker),
      sectorsApi.fetchCompanyFilings(ticker)
    ]);
    pricesCache.set(ticker, prices);
    filingsCache.set(ticker, filings);
    
    if (prices.length > 0) {
      const benchmark = await sectorsApi.fetchBenchmarkData(prices.map((p: any) => p.date));
      benchmarkCache.set(ticker, benchmark);
    }
  }));

  const globalSnapshotsToUpsert = new Map<string, any>()

  // Cache unfiltered IHSG globally for the proxy
  const rawBenchmark = await sectorsApi.fetchBenchmarkData();
  if (rawBenchmark && rawBenchmark.length > 0) {
    const latestIHSG = rawBenchmark[rawBenchmark.length - 1];
    const prevIHSG = rawBenchmark[rawBenchmark.length - 2] || latestIHSG;
    const ihsgChangePercent = prevIHSG.close ? ((latestIHSG.close - prevIHSG.close) / prevIHSG.close) * 100 : 0;
    
    globalSnapshotsToUpsert.set('IHSG', {
      symbol: 'IHSG',
      last_price: Math.round(latestIHSG.close),
      change_amount: Math.round(latestIHSG.close - prevIHSG.close),
      change_percent: Number(ihsgChangePercent.toFixed(2)),
      today_volume: 0,
      median_volume_20d: 0,
      ihsg_price: Math.round(latestIHSG.close),
      ihsg_change_percent: Number(ihsgChangePercent.toFixed(2)),
      latest_filings: [],
      updated_at: timestamp
    });
  }

  for (const user of users) {
    if (!user.watchlist || user.watchlist.length === 0) continue

    const startTime = Date.now()

    const workspace = workspaceMap.get(user.id)

    let activeCases = workspace?.active_cases || {}
    let caseEvents = workspace?.case_events || {}
    let tickerStates = workspace?.ticker_states || {}
    let runIndex = workspace?.run_index || 1
    
    let totalTriggersFound = 0
    let incompleteCount = 0
    let evaluatedCount = 0

    for (const ticker of user.watchlist) {
      const prices = pricesCache.get(ticker) || []
      const benchmark = benchmarkCache.get(ticker) || []
      const filings = filingsCache.get(ticker) || []

      const r = runTickerStep({
        symbol: ticker,
        prices,
        benchmark,
        filings,
        currentCase: activeCases[ticker] || null,
        tickerState: tickerStates[ticker] || null,
        runTimestamp: timestamp
      })

      tickerStates[ticker] = r.nextTickerState
      
      if (r.nextCase) {
        activeCases[ticker] = r.nextCase
      } else {
        delete activeCases[ticker]
      }
      
      if (r.event) {
        caseEvents[ticker] = [r.event, ...(caseEvents[ticker] || [])]
      }

      if (r.shouldNotify && r.event && r.evalResult) {
        const template = renderCaseTemplate(r.evalResult, r.event.newStatus)
        const messageHtml = formatTelegramHtml(ticker, r.event.newStatus, template)
        telegramOutboxToInsert.push({
          chat_id: user.telegram_chat_id,
          message: messageHtml,
          status: 'pending'
        })
      }

      if (r.evalResult) {
        totalTriggersFound += r.evalResult.activeTriggerCount
      }
      
      if (r.outcome === 'DATA_INCOMPLETE') {
        incompleteCount++
      } else if (r.outcome === 'EVALUATED') {
        evaluatedCount++
      }

      if (r.outcome !== 'SKIPPED_STALE' && prices.length > 0) {
        const latestPriceData = prices[prices.length - 1]
        const prevPriceData = prices[prices.length - 2] || latestPriceData
        const latestIHSG = benchmark[benchmark.length - 1] || { close: 0 }
        const prevIHSG = benchmark[benchmark.length - 2] || latestIHSG

        const volRule = r.evalResult?.ruleResults.find((r: any) => r.ruleId === 'ABNORMAL_VOLUME')
        const medianVol = volRule?.evidence ? (volRule.evidence as any).medianVolume20Days : 0
        
        const changePercent = prevPriceData.close ? ((latestPriceData.close - prevPriceData.close) / prevPriceData.close) * 100 : 0
        const ihsgChangePercent = prevIHSG.close ? ((latestIHSG.close - prevIHSG.close) / prevIHSG.close) * 100 : 0

        globalSnapshotsToUpsert.set(ticker, {
          symbol: ticker,
          last_price: latestPriceData.close,
          change_amount: latestPriceData.close - prevPriceData.close,
          change_percent: Number(changePercent.toFixed(2)),
          today_volume: latestPriceData.volume || 0,
          median_volume_20d: medianVol,
          ihsg_price: Math.round(latestIHSG.close),
          ihsg_change_percent: Number(ihsgChangePercent.toFixed(2)),
          latest_filings: filings,
          updated_at: timestamp
        })
      }
    }


    const durationMs = Date.now() - startTime
    const uniqueRunId = `RUN-${dateStr}-${Math.floor(Date.now() / 1000).toString().slice(-5)}-${user.id.slice(0, 4)}`

    let auditStatus = 'SUCCESS'
    if (incompleteCount > 0) {
      auditStatus = evaluatedCount === 0 ? 'INCOMPLETE' : 'PARTIAL'
    }

    auditRunsToInsert.push({
      user_id: user.id,
      run_id: uniqueRunId,
      timestamp,
      tickers_count: user.watchlist.length,
      active_triggers_count: totalTriggersFound,
      status: auditStatus,
      duration_ms: durationMs
    })

    workspacesToUpsert.push({
      user_id: user.id,
      active_cases: activeCases,
      case_events: caseEvents,
      market_snapshots: {}, // No longer stored per-user
      ticker_states: tickerStates,
      run_index: runIndex + 1,
      last_run_time: timestamp,
      updated_at: timestamp
    })
  }

  if (globalSnapshotsToUpsert.size > 0) {
    await supabase.from("global_market_snapshots").upsert(Array.from(globalSnapshotsToUpsert.values()))
  }

  if (auditRunsToInsert.length > 0) {
    await supabase.from("audit_runs").insert(auditRunsToInsert)
  }
  
  if (workspacesToUpsert.length > 0) {
    await supabase.from("user_workspaces").upsert(workspacesToUpsert)
  }

  if (telegramOutboxToInsert.length > 0) {
    await supabase.from("telegram_outbox").insert(telegramOutboxToInsert)
  }

  return new Response("Workflow completed successfully", { status: 200 })
})

