import { normalizeTelegramSections } from "../../../src/engine/telegramPreferences.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { authorizeWorkflow } from "./auth.ts"
import { WorkflowMonitor, workflowSource } from "./monitor.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { runPhaseTicker, completedSessions } from "./phase.ts"
import { evaluateAbnormalVolume } from "../../../src/engine/rules/abnormalVolume.ts"
import { renderCaseTemplate } from "../../../src/engine/templateRenderer.ts"
import { sectorsApi, wibDateOffset } from "../../../src/services/sectorsApi.ts"
import {
  escapeHtml,
  formatIndonesianDate,
  formatTelegramHtml,
  formatTelegramTickerDigest,
  TelegramNewsItem,
  TelegramFormatterSection,
} from "./formatter.ts"
import {
  filingDeliveryKey,
  marketDeliveryKey,
  newsDeliveryKey,
  selectUndeliveredItems,
} from "../../../src/engine/telegramDelivery.ts"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
const SECTORS_API_KEY = Deno.env.get("SECTORS_API_KEY")

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
if (SECTORS_API_KEY) sectorsApi.setApiKey(SECTORS_API_KEY)

async function handleWorkflow(req: Request, monitor: WorkflowMonitor): Promise<Response> {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method === "GET") return new Response(JSON.stringify({ isConfigured: !!SECTORS_API_KEY }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
  
  if (req.method === "POST") {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return new Response("Workflow authentication is not configured", { status: 503, headers: corsHeaders })
    }
    if (!await authorizeWorkflow(req.headers.get("Authorization"), SUPABASE_SERVICE_ROLE_KEY)) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders })
    }
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders })
  }

  const phase = new URL(req.url).searchParams.get("phase") || "workflow"
  if (!["briefing", "evaluation", "workflow"].includes(phase)) return new Response("Invalid phase", { status: 400 })
  const includesRecap = phase !== "evaluation"
  const evaluatesCases = phase !== "briefing"
  let checkpoint: "evening" | "morning" = "morning"
  let previewUserName: string | null = null
  try {
    const body = await req.json()
    if (body?.checkpoint !== undefined && !["evening", "morning"].includes(body.checkpoint)) {
      return new Response("Invalid checkpoint", { status: 400, headers: corsHeaders })
    }
    if (body?.checkpoint) checkpoint = body.checkpoint
    if (body?.mode !== undefined && body.mode !== "preview") {
      return new Response("Invalid mode", { status: 400, headers: corsHeaders })
    }
    if (body?.mode === "preview") {
      if (typeof body.user_name !== "string" || !body.user_name.trim()) {
        return new Response("Preview requires user_name", { status: 400, headers: corsHeaders })
      }
      previewUserName = body.user_name.trim()
    }
  } catch {
    // Empty manual invocations use the morning presentation.
  }
  
  if (new URL(req.url).searchParams.has("phase")) checkpoint = "morning"

  // CLEAR CACHE: Ensure Deno isolate doesn't reuse stale memory across cron runs
  sectorsApi.invalidateAll();
  
  let usersQuery = supabase
    .from("profiles")
    .select("id, name, watchlist, telegram_chat_id")
    .eq("is_telegram_linked", true)
  if (previewUserName) usersQuery = usersQuery.eq("name", previewUserName)
  const { data: users, error: usersError } = await usersQuery
  if (usersError) return new Response("Profiles unavailable", { status: 500, headers: corsHeaders })
  if (previewUserName && users?.length !== 1) {
    return new Response("Preview requires exactly one linked profile", { status: 409, headers: corsHeaders })
  }

  if (!users || users.length === 0) return new Response("No users found", { status: 200 })

  const { data: preferences, error: preferencesError } = await supabase
    .from("telegram_preferences").select("user_id, sections").in("user_id", users.map(user => user.id))
  if (preferencesError) return new Response("Telegram preferences unavailable", { status: 503, headers: corsHeaders })
  const preferencesMap = new Map((preferences || []).map(row => [row.user_id, row.sections]))

  await monitor.start(users, workflowSource(req.url), previewUserName ? "preview" : phase, checkpoint)

  const userIds = users.map((u) => u.id)
  const { data: workspaces, error: workspaceError } = await supabase
    .from("user_workspaces")
    .select("user_id, active_cases, case_events, run_index, market_snapshots, ticker_states")
    .in("user_id", userIds)

  if (workspaceError) return new Response("Workspace state unavailable", { status: 500, headers: corsHeaders })

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
    .select("user_id, item_key")
    .eq("status", "pending")
    .in("user_id", userIds)
  if (pendingError) {
    return new Response("Pending delivery state unavailable", { status: 500, headers: corsHeaders })
  }

  const pendingKeysByUser = new Map<string, Set<string>>()
  for (const row of pendingRows || []) {
    const keys = pendingKeysByUser.get(row.user_id) || new Set<string>()
    keys.add(row.item_key)
    pendingKeysByUser.set(row.user_id, keys)
  }

  // Full context is required for morning news too. Fetch once per unique ticker,
  // shared across users; delivery keys still decide which updates are sent.
  const shouldFetchBenchmark = uniqueTickers.length > 0

  let newsPage = { articles: [], hasNext: false, nextOffset: null } as Awaited<ReturnType<typeof sectorsApi.fetchNewsArticles>>
  let newsFetchFailed = false
  if (uniqueTickers.length > 0 && (includesRecap || previewUserName)) {
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
    const [rawPrices, filings] = await Promise.all([
      sectorsApi.fetchDailyTransactions(ticker),
      sectorsApi.fetchCompanyFilings(ticker)
    ]);
    const prices = completedSessions(rawPrices, digestDate);
    pricesCache.set(ticker, prices);
    filingsCache.set(ticker, filings);
    
    if (prices.length > 0 && shouldFetchBenchmark) {
      const benchmark = await sectorsApi.fetchBenchmarkData(prices.map((p: any) => p.date));
      benchmarkCache.set(ticker, benchmark);
    }
  }));

  // Explicit manual previews use the same formatter and real latest sessions.
  // They do not consume delivery keys or mutate the automated workflow state.
  if (previewUserName) {
    const user = users[0]
    const selectedSections = normalizeTelegramSections(preferencesMap.get(user.id))
    if (!user.telegram_chat_id) return new Response("Telegram is not linked", { status: 409, headers: corsHeaders })
    const messages: any[] = []
    const tickers: string[] = []
    const skipped: string[] = []
    for (const ticker of uniqueTickers) {
      const prices = pricesCache.get(ticker) || []
      const latestPrice = prices[prices.length - 1]
      if (!latestPrice) { skipped.push(ticker); continue }
      const cleanTicker = ticker.toUpperCase().replace(/\.JK$/, "")
      const news = newsPage.articles
        .filter((article) => article.symbols.some((symbol) => symbol.toUpperCase().replace(/\.JK$/, "") === cleanTicker))
        .slice(0, 3)
        .map((article) => {
          let source = "Sumber berita"
          try { source = new URL(article.source).hostname.replace(/^www\./, "") } catch { /* Keep generic label. */ }
          return {
            title: article.title, summary: article.body?.trim().split(/(?<=[.!?])\s+/)[0]?.slice(0, 500),
            source, url: article.source, publishedAt: article.publishedAt,
          }
        })
      const block = formatTelegramHtml(ticker, "MONITORING", {
        asOfDate: latestPrice.date, facts: [], limitedInterpretations: [],
      }, {
        prices, benchmark: benchmarkCache.get(ticker) || [],
        filings: filingsCache.get(ticker) || [], news,
        includeSections: selectedSections,
        engineSummaryOnly: preferencesMap.has(user.id),
        includeHeader: false, includeFooter: false,
        isMorningBriefing: checkpoint === "morning",
      })
      const coverageNote = !selectedSections.includes("news") ? "" : newsFetchFailed
        ? "<i>Sebagian sumber berita belum berhasil diperiksa.</i>\n\n"
        : newsPage.hasNext
        ? "<i>Cakupan berita parsial; masih ada halaman berita yang belum diperiksa.</i>\n\n"
        : ""
      messages.push({
        user_id: user.id, chat_id: user.telegram_chat_id, status: "pending",
        automation_run_id: monitor.id(user.id),
        message: formatTelegramTickerDigest(checkpoint, digestDate, cleanTicker, coverageNote + block, wibTime),
      })
      tickers.push(cleanTicker)
    }
    if (messages.length) {
      const { error } = await supabase.from("telegram_outbox").insert(messages)
      if (error) return new Response("Preview could not be queued", { status: 500, headers: corsHeaders })
    }
    monitor.result(user.id, skipped.length ? (messages.length ? "PARTIAL" : "INCOMPLETE") : "SUCCESS")
    return new Response(JSON.stringify({ mode: "preview", queued: messages.length, tickers, skipped }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const globalSnapshotsToUpsert = new Map<string, any>()

  // Cache unfiltered IHSG globally for the proxy
  const rawBenchmark = shouldFetchBenchmark ? completedSessions(await sectorsApi.fetchBenchmarkData(), digestDate) : [];
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
      data_date: latestIHSG.date,
      ihsg_data_date: latestIHSG.date,
      updated_at: timestamp
    });
  }

  for (const user of users) {
    if (!user.watchlist || user.watchlist.length === 0 || !user.telegram_chat_id) continue

    const selectedSections = normalizeTelegramSections(preferencesMap.get(user.id))
    const enabled = (section: TelegramFormatterSection) => selectedSections.some(value => value === section)
    const startTime = Date.now()

    const workspace = workspaceMap.get(user.id)

    let activeCases = workspace?.active_cases || {}
    let caseEvents = workspace?.case_events || {}
    let tickerStates = workspace?.ticker_states || {}
    let runIndex = workspace?.run_index || 1
    
    let totalTriggersFound = 0
    let incompleteCount = 0
    let evaluatedCount = 0
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
      return true
    }
    let remainingNews = 3

    for (const ticker of user.watchlist) {
      const prices = pricesCache.get(ticker) || []
      const benchmark = benchmarkCache.get(ticker) || []
      const filings = filingsCache.get(ticker) || []
      const previousTickerState = tickerStates[ticker] || null

      const r = runPhaseTicker(phase as "briefing" | "evaluation" | "workflow", {
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
        const priceKey = includesRecap
          ? `briefing:${digestDate}:${cleanTicker}:price:${latestPrice.date}`
          : marketDeliveryKey("price", ticker, latestPrice.date)
        const pendingPriceKey = `pending:price:${cleanTicker}`
        if (includesRecap && (enabled("price") || enabled("volume")) && userPendingKeys.has(pendingPriceKey) && reserveKey(pendingPriceKey)) {
          tickerItemKeys.push(pendingPriceKey)
        }
        if (includesRecap && (enabled("price") || enabled("volume")) && reserveKey(priceKey)) {
          includeSections.add("price")
          includeSections.add("volume")
          tickerItemKeys.push(priceKey)
        }

        if (!latestIHSG || latestIHSG.date !== latestPrice.date) {
          if (tickerItemKeys.length > 0) includeSections.add("benchmark")
        } else if (enabled("benchmark")) {
          const comparisonKey = marketDeliveryKey("comparison", ticker, latestPrice.date)
          const pendingBenchmarkKey = `pending:benchmark:${cleanTicker}`
          const pendingComparisonKey = `pending:comparison:${cleanTicker}:${latestPrice.date}`
          const includeComparison = reserveKey(comparisonKey)
          let includePendingBenchmark = false
          if (includeComparison) tickerItemKeys.push(comparisonKey)
          if (userPendingKeys.has(pendingBenchmarkKey) && reserveKey(pendingBenchmarkKey)) {
            tickerItemKeys.push(pendingBenchmarkKey)
            includePendingBenchmark = true
          }
          if (userPendingKeys.has(pendingComparisonKey) && reserveKey(pendingComparisonKey)) {
            tickerItemKeys.push(pendingComparisonKey)
            includePendingBenchmark = true
          }
          if (includeComparison || includePendingBenchmark) includeSections.add("benchmark")
        }
      }

      const previouslySeenFilingIds = new Set(previousTickerState?.seenFilingIds || [])
      const newFilings = filings.filter((filing: any) => {
        const key = filingDeliveryKey(ticker, filing)
        if (!enabled("filings") || !includesRecap || previousTickerState?.seenFilingIds == null) return false
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
      const newNews = selectUndeliveredItems(enabled("news") ? tickerNewsCandidates : [], deliveryStatuses)
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
        if (enabled("engine") && reserveKey(eventKey)) {
          tickerItemKeys.push(eventKey)
          includeSections.add("engine")
          template = renderCaseTemplate(r.evalResult, r.event.newStatus)
        }
      }

      if (includesRecap && r.evalResult) includeSections.add("engine")
      if (includesRecap && latestPrice && !enabled("price") && !enabled("volume") && reserveKey(`recap:${digestDate}:${cleanTicker}`)) {
        tickerItemKeys.push(`recap:${digestDate}:${cleanTicker}`)
        for (const section of selectedSections) {
          if (section !== "news" && section !== "filings") includeSections.add(section)
        }
      }

      if (tickerItemKeys.length > 0 && latestPrice) {
        // Include market context in each new ticker message without reserving
        // already-delivered price/volume keys again.
        includeSections.add("price")
        includeSections.add("benchmark")
        includeSections.add("volume")
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
          includeSections: [...includeSections].filter(enabled),
          engineSummaryOnly: preferencesMap.has(user.id),
          includeHeader: false,
          includeFooter: false,
        })
        if (block) {
          const coverageNote = !enabled("news") ? "" : newsFetchFailed
            ? "<i>Sebagian sumber berita belum berhasil diperiksa.</i>"
            : newsPage.hasNext
            ? "<i>Cakupan berita parsial; masih ada halaman berita yang belum diperiksa.</i>"
            : ""
          const evaluationNote = enabled("engine") && evaluatesCases && r.outcome === 'DATA_INCOMPLETE'
            ? "<i>Evaluasi kasus menunggu kelengkapan data sesi yang sama. Status kasus dipertahankan.</i>\n\n"
            : enabled("engine") && evaluatesCases && r.outcome === 'SKIPPED_STALE'
            ? "<i>Sesi perdagangan ini sudah dievaluasi; status kasus terakhir dipertahankan.</i>\n\n" : ""
          const message = formatTelegramTickerDigest(
            checkpoint,
            digestDate,
            cleanTicker,
            `${evaluationNote}${coverageNote ? `${coverageNote}\n\n` : ""}${block}`,
            wibTime,
            undefined,
            { purpose: includesRecap ? "briefing" : "evaluation", sessionDate: latestPrice?.date }
          )
          const { data: outboxId, error: enqueueError } = await supabase.rpc("enqueue_telegram_digest", {
            p_user_id: user.id,
            p_chat_id: user.telegram_chat_id,
            p_checkpoint: checkpoint,
            p_digest_date: digestDate,
            p_message: message,
            p_item_keys: [...new Set(tickerItemKeys)],
          })
          if (outboxId && !enqueueError) {
            const { error: linkError } = await supabase.from("telegram_outbox")
              .update({ automation_run_id: monitor.id(user.id) }).eq("id", outboxId).eq("user_id", user.id)
            if (linkError) return new Response("Delivery tracking could not be saved", { status: 500, headers: corsHeaders })
          }
          if (enqueueError) {
            console.error(`Telegram digest enqueue failed for user ${user.id}`)
            return new Response("Telegram digest could not be queued", { status: 500, headers: corsHeaders })
          }
        }
      }

      if (r.evalResult) {
        totalTriggersFound += r.evalResult.activeTriggerCount
      }
      
      if (!evaluatesCases) {
        if (!latestPrice || !latestIHSG || latestIHSG.date !== latestPrice.date) incompleteCount++
        else evaluatedCount++
      } else if (r.outcome === 'DATA_INCOMPLETE') {
        incompleteCount++
      } else if (r.outcome === 'EVALUATED') {
        evaluatedCount++
      }

      if ((includesRecap || r.outcome !== 'SKIPPED_STALE') && prices.length > 0) {
        const latestPriceData = prices[prices.length - 1]
        const prevPriceData = prices[prices.length - 2] || latestPriceData
        const latestIHSG = benchmark[benchmark.length - 1] || { close: 0 }
        const prevIHSG = benchmark[benchmark.length - 2] || latestIHSG

        const volRule = r.evalResult?.ruleResults.find((r: any) => r.ruleId === 'ABNORMAL_VOLUME') || evaluateAbnormalVolume(prices)
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
          data_date: latestPriceData.date,
          ihsg_data_date: latestIHSG.date || null,
          updated_at: timestamp
        })
      }
    }


    const durationMs = Date.now() - startTime
    const uniqueRunId = `RUN-${dateStr}-${Math.floor(Date.now() / 1000).toString().slice(-5)}-${user.id.slice(0, 4)}`

    let auditStatus = includesRecap && (newsFetchFailed || newsPage.hasNext) ? 'PARTIAL' : 'SUCCESS'
    if (incompleteCount > 0) {
      auditStatus = evaluatedCount === 0 ? 'INCOMPLETE' : 'PARTIAL'
    }

    monitor.result(user.id, auditStatus, totalTriggersFound)
    if (evaluatesCases) auditRunsToInsert.push({
      automation_run_id: monitor.id(user.id),
      user_id: user.id,
      run_id: uniqueRunId,
      timestamp,
      tickers_count: user.watchlist.length,
      active_triggers_count: totalTriggersFound,
      status: auditStatus,
      duration_ms: durationMs
    })

    if (evaluatesCases) workspacesToUpsert.push({
      user_id: user.id,
      active_cases: activeCases,
      case_events: caseEvents,
      market_snapshots: {}, // No longer stored per-user
      ticker_states: tickerStates,
      run_index: runIndex + 1,
      last_run_time: timestamp,
      updated_at: timestamp
    })

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
    const { error } = await supabase.from("global_market_snapshots").upsert(Array.from(globalSnapshotsToUpsert.values()))
    if (error) return new Response("Market snapshot could not be saved", { status: 500 })
  }

  if (auditRunsToInsert.length > 0) {
    const { error } = await supabase.from("audit_runs").insert(auditRunsToInsert)
    if (error) return new Response("Audit could not be saved", { status: 500 })
  }
  
  if (workspacesToUpsert.length > 0) {
    const { error } = await supabase.from("user_workspaces").upsert(workspacesToUpsert)
    if (error) return new Response("Workspace could not be saved", { status: 500 })
  }

  return new Response("Workflow completed successfully", { status: 200 })
}

serve(async (req) => {
  const monitor = new WorkflowMonitor(supabase);
  let response: Response;
  try {
    response = await handleWorkflow(req, monitor);
  } catch {
    console.error("Workflow failed unexpectedly");
    response = new Response("Workflow could not complete", { status: 500 });
  }
  try {
    await monitor.finish(response.status);
  } catch {
    console.error("Workflow execution result could not be recorded");
    return new Response("Execution tracking could not be completed", { status: 500 });
  }
  return response;
});
