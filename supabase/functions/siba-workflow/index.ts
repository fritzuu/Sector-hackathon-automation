import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { evaluateDataset } from "../../../src/engine/rules/index.ts"
import { processCaseTransition } from "../../../src/engine/caseEngine.ts"
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
  
  // 1. Fetch Users
  const { data: users } = await supabase
    .from("profiles")
    .select("id, name, watchlist, telegram_chat_id")
    .eq("is_telegram_linked", true)

  if (!users || users.length === 0) return new Response("No users found", { status: 200 })

  // BOTTLENECK FIX #1: Fetch all workspaces in ONE massive database query (No N+1!)
  const userIds = users.map((u) => u.id)
  const { data: workspaces } = await supabase
    .from("user_workspaces")
    .select("user_id, active_cases, case_events, run_index, market_snapshots")
    .in("user_id", userIds)

  // Map them for instant O(1) lookups in memory
  const workspaceMap = new Map(workspaces?.map((w) => [w.user_id, w]) || [])

  const timestamp = new Date().toISOString()
  const dateStr = timestamp.slice(0, 10).replace(/-/g, '')

  // Cache to prevent duplicate API calls for the same ticker across different users
  const pricesCache = new Map<string, any>()
  const benchmarkCache = new Map<string, any>()
  const filingsCache = new Map<string, any>()

  // BOTTLENECK FIX #2: Prepare buckets for Batch Inserts instead of sequential DB writes
  const auditRunsToInsert: any[] = []
  const workspacesToUpsert: any[] = []
  const telegramOutboxToInsert: any[] = []

  // PRD Fix & Optimization: Extract unique tickers and fetch concurrently
  const allWatchlistedTickers = new Set<string>();
  for (const user of users) {
    user.watchlist?.forEach((t: string) => allWatchlistedTickers.add(t));
  }
  const uniqueTickers = Array.from(allWatchlistedTickers);

  // BOTTLENECK FIX #3: Pre-fetch global IHSG benchmark ONCE to prevent Cache Stampede
  // When uniqueTickers run concurrently, they will now hit this pre-warmed cache!
  await sectorsApi.fetchBenchmarkData();

  // Concurrent Fetching
  await Promise.all(uniqueTickers.map(async (ticker) => {
    const [prices, filings] = await Promise.all([
      sectorsApi.fetchDailyTransactions(ticker),
      sectorsApi.fetchCompanyFilings(ticker)
    ]);
    pricesCache.set(ticker, prices);
    filingsCache.set(ticker, filings);
    
    if (prices.length > 0) {
      // This will instantly hit the pre-warmed cache in sectorsApi
      const benchmark = await sectorsApi.fetchBenchmarkData(prices.map((p: any) => p.date));
      benchmarkCache.set(ticker, benchmark);
    }
  }));

  for (const user of users) {
    if (!user.watchlist || user.watchlist.length === 0) continue

    const startTime = Date.now()

    // O(1) Memory Lookup instead of an HTTP Database request!
    const workspace = workspaceMap.get(user.id)

    let activeCases = workspace?.active_cases || {}
    let caseEvents = workspace?.case_events || {}
    let marketSnapshots = workspace?.market_snapshots || {}
    let runIndex = workspace?.run_index || 1
    let hasChanges = false
    let totalTriggersFound = 0

    for (const ticker of user.watchlist) {
      const prices = pricesCache.get(ticker) || []
      const benchmark = benchmarkCache.get(ticker) || []
      const filings = filingsCache.get(ticker) || []

      const dataset = {
        symbol: ticker,
        asOfDate: prices.length > 0 ? prices[prices.length - 1].date : timestamp.split('T')[0],
        historicalPrices: prices,
        benchmarkPrices: benchmark,
        filings,
        // PRD Fix: Pass the last seen filing ID so the engine can detect NEW ones!
        lastEvaluatedFilingId: activeCases[ticker]?.lastSeenFilingId || null,
      }

      const evalResult = evaluateDataset(dataset)
      totalTriggersFound += evalResult.activeTriggerCount

      // Generate Market Snapshot for Dashboard rendering
      const latestPriceData = prices[prices.length - 1] || { close: 0, volume: 0 };
      const prevPriceData = prices[prices.length - 2] || latestPriceData;
      const latestIHSG = benchmark[benchmark.length - 1] || { close: 0 };
      const prevIHSG = benchmark[benchmark.length - 2] || latestIHSG;

      const volRule = evalResult.ruleResults.find((r: any) => r.ruleId === 'ABNORMAL_VOLUME');
      const medianVol = volRule?.evidence ? (volRule.evidence as any).medianVolume20Days : 0;
      
      const changePercent = prevPriceData.close ? ((latestPriceData.close - prevPriceData.close) / prevPriceData.close) * 100 : 0;
      const ihsgChangePercent = prevIHSG.close ? ((latestIHSG.close - prevIHSG.close) / prevIHSG.close) * 100 : 0;

      marketSnapshots[ticker] = {
        symbol: ticker,
        lastPrice: latestPriceData.close,
        changeAmount: latestPriceData.close - prevPriceData.close,
        changePercent: Number(changePercent.toFixed(2)),
        todayVolume: latestPriceData.volume || 0,
        medianVolume20d: medianVol,
        ihsgPrice: latestIHSG.close,
        ihsgChangePercent: Number(ihsgChangePercent.toFixed(2)),
        lastUpdated: timestamp,
        latestFilings: filings.slice(0, 3)
      }

      const transition = processCaseTransition(activeCases[ticker] || null, evalResult, timestamp)

      if (transition.event.newStatus !== "MONITORING") {
        hasChanges = true
        
        if (transition.nextCaseState) {
          activeCases[ticker] = transition.nextCaseState
        } else if (transition.event.newStatus === 'CLOSED') {
          delete activeCases[ticker]
        }
        
        caseEvents[ticker] = [transition.event, ...(caseEvents[ticker] || [])]
        const template = renderCaseTemplate(evalResult, transition.event.newStatus)

        // Queue message instead of sending immediately!
        const messageHtml = formatTelegramHtml(ticker, transition.event.newStatus, template)
        telegramOutboxToInsert.push({
          chat_id: user.telegram_chat_id,
          message: messageHtml,
          status: 'pending'
        })
      }
    }

    const durationMs = Date.now() - startTime
    const uniqueRunId = `RUN-${dateStr}-${Math.floor(Date.now() / 1000).toString().slice(-5)}-${user.id.slice(0, 4)}`

    // Push to memory array instead of hitting the database!
    auditRunsToInsert.push({
      user_id: user.id,
      run_id: uniqueRunId,
      timestamp,
      tickers_count: user.watchlist.length,
      active_triggers_count: totalTriggersFound,
      status: 'SUCCESS',
      duration_ms: durationMs
    })

    // Push to memory array instead of hitting the database!
    workspacesToUpsert.push({
      user_id: user.id,
      active_cases: activeCases,
      case_events: caseEvents,
      market_snapshots: marketSnapshots,
      run_index: runIndex + 1,
      last_run_time: timestamp,
      updated_at: timestamp
    })
  }

  // BOTTLENECK FIX #2 Execution: Execute all DB operations in bulk!
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
