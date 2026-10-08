import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { runTickerStep, TickerStepResult } from "../../../src/engine/tickerStep.ts"
import { renderCaseTemplate } from "../../../src/engine/templateRenderer.ts"
import { sectorsApi, wibDateOffset } from "../../../src/services/sectorsApi.ts"
import {
  escapeHtml,
  formatIndonesianDate,
  formatTelegramDigest,
  formatTelegramHtml,
  TelegramNewsItem,
  TelegramFormatterSection,
} from "./formatter.ts"
import {
  filingDeliveryKey,
  inferTelegramCheckpoint,
  marketDeliveryKey,
  marketSymbolFromDeliveryKey,
  newsDeliveryKey,
  selectUndeliveredItems,
} from "../../../src/engine/telegramDelivery.ts"

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

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders })
  }

  const jakartaHour = Number(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta', hour: '2-digit', hourCycle: 'h23'
  }).format(new Date()))
  let checkpoint: "evening" | "morning" = inferTelegramCheckpoint(jakartaHour)
  try {
    const body = await req.json()
    if (body?.checkpoint !== undefined && !["evening", "morning"].includes(body.checkpoint)) {
      return new Response("Invalid checkpoint", { status: 400, headers: corsHeaders })
    }
    if (body?.checkpoint) checkpoint = body.checkpoint
  } catch {
    // Existing manual invocations without a body default to the evening format.
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
  const digestDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date(timestamp))
  const wibTime = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false
  }).format(new Date(timestamp))

  const pricesCache = new Map<string, any>()
  const benchmarkCache = new Map<string, any>()
  const filingsCache = new Map<string, any>()

  const auditRunsToInsert: any[] = []
  const workspacesToUpsert: any[] = []

  const allWatchlistedTickers = new Set<string>();
  for (const user of users) {
    user.watchlist?.forEach((t: string) => allWatchlistedTickers.add(t));
  }
  const uniqueTickers = Array.from(allWatchlistedTickers);

  const { data: pendingRows, error: pendingError } = await supabase
    .from("telegram_delivery_items")
    .select("user_id, chat_id, item_key, payload")
    .eq("status", "pending")
    .in("user_id", userIds)
  if (pendingError) {
    return new Response("Pending delivery state unavailable", { status: 500, headers: corsHeaders })
  }

  const activeTickers = new Set(uniqueTickers.map((ticker) => ticker.toUpperCase().replace(/\.JK$/, "")))
  const pendingPriceTickers = new Set<string>()
  const pendingPricesByTicker = new Map<string, any[]>()
  let hasPendingBenchmark = false
  const pendingKeysByUser = new Map<string, Set<string>>()
  for (const row of pendingRows || []) {
    const keys = pendingKeysByUser.get(row.user_id) || new Set<string>()
    keys.add(row.item_key)
    pendingKeysByUser.set(row.user_id, keys)
    const [prefix, part] = row.item_key.split(":")
    const pendingSymbol = marketSymbolFromDeliveryKey(row.item_key)
    if (pendingSymbol && activeTickers.has(pendingSymbol.toUpperCase().replace(/\.JK$/, ""))) {
      if (Array.isArray(row.payload?.prices)) {
        pendingPricesByTicker.set(pendingSymbol, row.payload.prices)
      }
      if ((prefix === "pending" && part === "price") || prefix === "price") {
        pendingPriceTickers.add(pendingSymbol)
        hasPendingBenchmark = true
      }
    }
    if (prefix === "pending" && ["benchmark", "comparison"].includes(part)) {
      hasPendingBenchmark = true
    }
  }

  const tickersToRefresh = checkpoint === "evening"
    ? uniqueTickers
    : uniqueTickers.filter((ticker) => pendingPriceTickers.has(ticker.toUpperCase().replace(/\.JK$/, "")))
  const shouldFetchBenchmark = checkpoint === "evening" || hasPendingBenchmark

  let newsPage = { articles: [], hasNext: false, nextOffset: null } as Awaited<ReturnType<typeof sectorsApi.fetchNewsArticles>>
  let newsFetchFailed = false
  if (uniqueTickers.length > 0) {
    try {
      newsPage = await sectorsApi.fetchNewsArticles(uniqueTickers, wibDateOffset(7))
      if (newsPage.hasNext) {
        console.warn(`Sectors API news page is partial; next offset ${newsPage.nextOffset}`)
      }
    } catch {
      newsFetchFailed = true
      console.warn("Sectors API news fetch failed for this checkpoint")
    }
  }

  if (shouldFetchBenchmark) await sectorsApi.fetchBenchmarkData();

  await Promise.all(uniqueTickers.map(async (ticker) => {
    const normalizedTicker = ticker.toUpperCase().replace(/\.JK$/, "")
    const shouldRefreshPrice = tickersToRefresh.some((item) =>
      item.toUpperCase().replace(/\.JK$/, "") === normalizedTicker
    )
    const [prices, filings] = await Promise.all([
      shouldRefreshPrice
        ? sectorsApi.fetchDailyTransactions(ticker)
        : Promise.resolve(pendingPricesByTicker.get(normalizedTicker) || []),
      sectorsApi.fetchCompanyFilings(ticker)
    ]);
    pricesCache.set(ticker, prices);
    filingsCache.set(ticker, filings);
    
    if (prices.length > 0 && shouldFetchBenchmark) {
      const benchmark = await sectorsApi.fetchBenchmarkData(prices.map((p: any) => p.date));
      benchmarkCache.set(ticker, benchmark);
    }
  }));

  const globalSnapshotsToUpsert = new Map<string, any>()

  // Cache unfiltered IHSG globally for the proxy
  const rawBenchmark = shouldFetchBenchmark ? await sectorsApi.fetchBenchmarkData() : [];
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
    if (!user.watchlist || user.watchlist.length === 0 || !user.telegram_chat_id) continue

    const startTime = Date.now()

    const workspace = workspaceMap.get(user.id)

    let activeCases = workspace?.active_cases || {}
    let caseEvents = workspace?.case_events || {}
    let tickerStates = workspace?.ticker_states || {}
    let runIndex = workspace?.run_index || 1
    
    let totalTriggersFound = 0
    let incompleteCount = 0
    let evaluatedCount = 0
    const digestBlocks: string[] = []
    const digestItemKeys: string[] = []
    const selectedKeys = new Set<string>()
    const { data: deliveryRows, error: deliveryError } = await supabase
      .from("telegram_delivery_items")
      .select("item_key, status")
      .eq("user_id", user.id)
      .eq("chat_id", user.telegram_chat_id)
    if (deliveryError) {
      console.error(`Delivery ledger read failed for user ${user.id}`)
      return new Response("Delivery ledger unavailable", { status: 500, headers: corsHeaders })
    }
    const deliveryStatuses = new Map(
      (deliveryRows || []).map((row: any) => [row.item_key, row.status])
    ) as Map<string, "pending" | "queued" | "sent" | "unknown">
    const userPendingKeys = pendingKeysByUser.get(user.id) || new Set<string>()
    const reserveKey = (key: string): boolean => {
      const status = deliveryStatuses.get(key)
      if (selectedKeys.has(key) || (status && status !== "pending")) return false
      selectedKeys.add(key)
      digestItemKeys.push(key)
      return true
    }
    let remainingNews = 3

    for (const ticker of user.watchlist) {
      const prices = pricesCache.get(ticker) || []
      const benchmark = benchmarkCache.get(ticker) || []
      const filings = filingsCache.get(ticker) || []
      const previousTickerState = tickerStates[ticker] || null

      const r = runTickerStep({
        symbol: ticker,
        prices,
        benchmark,
        filings,
        currentCase: activeCases[ticker] || null,
        tickerState: previousTickerState,
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

      const includeSections = new Set<TelegramFormatterSection>()
      const tickerItemKeys: string[] = []
      const cleanTicker = ticker.toUpperCase().replace(/\.JK$/, "")
      const latestPrice = prices.length > 0 ? prices[prices.length - 1] : null
      const latestIHSG = benchmark.length > 0 ? benchmark[benchmark.length - 1] : null

      if (latestPrice) {
        const priceKey = marketDeliveryKey("price", ticker, latestPrice.date)
        const pendingPriceKey = `pending:price:${cleanTicker}`
        if (userPendingKeys.has(pendingPriceKey) && reserveKey(pendingPriceKey)) {
          tickerItemKeys.push(pendingPriceKey)
        }
        if (reserveKey(priceKey)) {
          includeSections.add("price")
          includeSections.add("volume")
          tickerItemKeys.push(priceKey)
        }

        if (!latestIHSG || latestIHSG.date !== latestPrice.date) {
          if (tickerItemKeys.length > 0) includeSections.add("benchmark")
        } else {
          const ihsgKey = marketDeliveryKey("ihsg", "IHSG", latestPrice.date)
          const comparisonKey = marketDeliveryKey("comparison", ticker, latestPrice.date)
          const pendingBenchmarkKey = `pending:benchmark:${cleanTicker}`
          const pendingComparisonKey = `pending:comparison:${cleanTicker}:${latestPrice.date}`
          const includeIHSG = reserveKey(ihsgKey)
          const includeComparison = reserveKey(comparisonKey)
          let includePendingBenchmark = false
          if (includeIHSG) tickerItemKeys.push(ihsgKey)
          if (includeComparison) tickerItemKeys.push(comparisonKey)
          if (userPendingKeys.has(pendingBenchmarkKey) && reserveKey(pendingBenchmarkKey)) {
            tickerItemKeys.push(pendingBenchmarkKey)
            includePendingBenchmark = true
          }
          if (userPendingKeys.has(pendingComparisonKey) && reserveKey(pendingComparisonKey)) {
            tickerItemKeys.push(pendingComparisonKey)
            includePendingBenchmark = true
          }
          if (includeIHSG || includeComparison || includePendingBenchmark) includeSections.add("benchmark")
        }
      }

      const previouslySeenFilingIds = new Set(previousTickerState?.seenFilingIds || [])
      const newFilings = filings.filter((filing: any) => {
        const key = filingDeliveryKey(ticker, filing)
        if (previousTickerState?.seenFilingIds == null) return false
        if (previouslySeenFilingIds.has(filing.id) && deliveryStatuses.get(key) !== "pending") return false
        if (!reserveKey(key)) return false
        tickerItemKeys.push(key)
        return true
      })
      if (newFilings.length > 0) includeSections.add("filings")

      const tickerNewsCandidates: Array<{ key: string; item: TelegramNewsItem }> = newsPage.articles
        .filter((article) => article.symbols.some((relatedSymbol) =>
          relatedSymbol.toUpperCase().replace(/\.JK$/, "") === cleanTicker
        ))
        .map((article) => {
          let sourceName = "Sumber berita"
          try {
            sourceName = new URL(article.source).hostname.replace(/^www\./, "")
          } catch {
            // Keep the generic source label for invalid URLs.
          }
          const summary = article.body?.trim().split(/(?<=[.!?])\s+/)[0]
          return {
            key: newsDeliveryKey(article.source),
            item: {
              title: article.title,
              summary: summary?.slice(0, 500),
              source: sourceName,
              url: article.source,
              publishedAt: article.publishedAt,
            },
          }
        })
      const newNews = selectUndeliveredItems(tickerNewsCandidates, deliveryStatuses)
        .slice(0, remainingNews)
        .filter(({ key }) => reserveKey(key))
      if (newNews.length > 0) {
        remainingNews -= newNews.length
        includeSections.add("news")
        for (const newsItem of newNews) tickerItemKeys.push(newsItem.key)
      }

      let template = r.evalResult
        ? renderCaseTemplate(r.evalResult, r.event?.newStatus || "MONITORING")
        : { asOfDate: latestPrice?.date || "", facts: [], limitedInterpretations: [] }
      if (r.shouldNotify && r.event && r.evalResult) {
        const eventKey = `event:${r.event.caseId}:${r.event.eventId}`
        if (reserveKey(eventKey)) {
          tickerItemKeys.push(eventKey)
          includeSections.add("engine")
          template = renderCaseTemplate(r.evalResult, r.event.newStatus)
        }
      }

      if (tickerItemKeys.length > 0) {
        const block = formatTelegramHtml(ticker, r.event?.newStatus || "MONITORING", template, {
          prices,
          benchmark,
          filings: newFilings,
          news: newNews.map(({ item }) => item),
          evalResult: r.evalResult,
          event: r.event,
          isMorningBriefing: checkpoint === "morning",
          includeSections: [...includeSections],
          includeHeader: false,
          includeFooter: false,
        })
        if (block) digestBlocks.push(`<b>${escapeHtml(cleanTicker)}</b>\n${block}`)
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

    if (newsFetchFailed && digestBlocks.length > 0) {
      digestBlocks.unshift("<i>Sebagian sumber berita belum berhasil diperiksa.</i>")
    } else if (newsPage.hasNext && digestBlocks.length > 0) {
      digestBlocks.unshift("<i>Cakupan berita parsial; masih ada halaman berita yang belum diperiksa.</i>")
    }

    if (digestItemKeys.length > 0 && digestBlocks.length > 0) {
      const message = formatTelegramDigest(checkpoint, digestDate, digestBlocks, wibTime)
      const { error: enqueueError } = await supabase.rpc("enqueue_telegram_digest", {
        p_user_id: user.id,
        p_chat_id: user.telegram_chat_id,
        p_checkpoint: checkpoint,
        p_digest_date: digestDate,
        p_message: message,
        p_item_keys: [...new Set(digestItemKeys)],
      })
      if (enqueueError) {
        console.error(`Telegram digest enqueue failed for user ${user.id}`)
        return new Response("Telegram digest could not be queued", { status: 500, headers: corsHeaders })
      }
    }

    const pendingSources: any[] = []
    for (const ticker of user.watchlist) {
      const cleanTicker = ticker.toUpperCase().replace(/\.JK$/, "")
      const tickerPrices = pricesCache.get(ticker) || []
      const latestPrice = tickerPrices[tickerPrices.length - 1]
      const tickerBenchmark = benchmarkCache.get(ticker) || []
      const latestIHSG = tickerBenchmark[tickerBenchmark.length - 1]
      if (!latestPrice) {
        pendingSources.push(
          { user_id: user.id, chat_id: user.telegram_chat_id, item_key: `pending:price:${cleanTicker}`, status: "pending" },
          { user_id: user.id, chat_id: user.telegram_chat_id, item_key: `pending:benchmark:${cleanTicker}`, status: "pending" }
        )
      } else if (!latestIHSG || latestIHSG.date !== latestPrice.date) {
        const pendingKey = `pending:comparison:${cleanTicker}:${latestPrice.date}`
        pendingSources.push({
          user_id: user.id,
          chat_id: user.telegram_chat_id,
          item_key: pendingKey,
          status: "pending",
          payload: { prices: tickerPrices.slice(-2) },
        })
      }
    }
    if (pendingSources.length > 0) {
      const { error: pendingWriteError } = await supabase
        .from("telegram_delivery_items")
        .upsert(pendingSources, {
          onConflict: "user_id,chat_id,item_key",
          ignoreDuplicates: true,
        })
      if (pendingWriteError) {
        console.error(`Pending market state write failed for user ${user.id}`)
        return new Response("Pending market state could not be saved", { status: 500, headers: corsHeaders })
      }
    }
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

  return new Response("Workflow completed successfully", { status: 200 })
})

