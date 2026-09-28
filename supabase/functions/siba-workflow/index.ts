import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { evaluateDataset } from "../../../src/engine/rules/index.ts"
import { processCaseTransition } from "../../../src/engine/caseEngine.ts"
import { renderCaseTemplate } from "../../../src/engine/templateRenderer.ts"
import { sectorsApi } from "../../../src/services/sectorsApi.ts"
import { sendTelegramAlert } from "./telegram.ts"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
const SECTORS_API_KEY = Deno.env.get("SECTORS_API_KEY")

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
if (SECTORS_API_KEY) sectorsApi.setApiKey(SECTORS_API_KEY)

serve(async (req) => {
  const { data: users } = await supabase
    .from("profiles")
    .select("id, name, watchlist, telegram_chat_id")
    .eq("is_telegram_linked", true)

  if (!users) return new Response("No users found", { status: 200 })

  const timestamp = new Date().toISOString()
  const dateStr = timestamp.slice(0, 10).replace(/-/g, '')

  // Cache to prevent duplicate API calls for the same ticker across different users
  const pricesCache = new Map<string, any>()
  const benchmarkCache = new Map<string, any>()
  const filingsCache = new Map<string, any>()

  for (const user of users) {
    if (!user.watchlist || user.watchlist.length === 0) continue

    const startTime = Date.now()

    const { data: workspace } = await supabase
      .from("user_workspaces")
      .select("active_cases, case_events, run_index")
      .eq("user_id", user.id)
      .maybeSingle()

    let activeCases = workspace?.active_cases || {}
    let caseEvents = workspace?.case_events || {}
    let runIndex = workspace?.run_index || 1
    let hasChanges = false
    let totalTriggersFound = 0

    for (const ticker of user.watchlist) {
      if (!pricesCache.has(ticker)) {
        pricesCache.set(ticker, await sectorsApi.fetchDailyTransactions(ticker))
      }
      const prices = pricesCache.get(ticker)

      if (!benchmarkCache.has(ticker)) {
        benchmarkCache.set(ticker, await sectorsApi.fetchBenchmarkData(prices.map((p: any) => p.date)))
      }
      const benchmark = benchmarkCache.get(ticker)

      if (!filingsCache.has(ticker)) {
        filingsCache.set(ticker, await sectorsApi.fetchCompanyFilings(ticker))
      }
      const filings = filingsCache.get(ticker)

      const dataset = {
        symbol: ticker,
        asOfDate: prices.length > 0 ? prices[prices.length - 1].date : timestamp.split('T')[0],
        historicalPrices: prices,
        benchmarkPrices: benchmark,
        filings,
        lastEvaluatedFilingId: null,
      }

      const evalResult = evaluateDataset(dataset)
      totalTriggersFound += evalResult.activeTriggerCount

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

        await sendTelegramAlert(user.telegram_chat_id, ticker, transition.event.newStatus, template)
      }
    }

    const durationMs = Date.now() - startTime

    const uniqueRunId = `RUN-${dateStr}-${Math.floor(Date.now() / 1000).toString().slice(-5)}`

    // Always log the audit run!
    await supabase.from("audit_runs").insert({
      user_id: user.id,
      run_id: uniqueRunId,
      timestamp,
      tickers_count: user.watchlist.length,
      active_triggers_count: totalTriggersFound,
      status: 'SUCCESS',
      duration_ms: durationMs
    })

    // Update workspace state
    await supabase.from("user_workspaces").upsert({
      user_id: user.id,
      active_cases: activeCases,
      case_events: caseEvents,
      run_index: runIndex + 1,
      last_run_time: timestamp,
      updated_at: timestamp
    })
  }

  return new Response("Workflow completed successfully", { status: 200 })
})
