import { precedingVolumeMedian } from '../../../src/engine/volumeBaseline.ts'
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
const SECTORS_API_KEY = Deno.env.get("SECTORS_API_KEY")

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders })
  }

  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders })
  }

  let body: any
  try {
    body = await req.json()
  } catch (e) {
    return new Response("Invalid body", { status: 400, headers: corsHeaders })
  }

  const { symbol } = body
  if (!symbol) return new Response("Missing symbol", { status: 400, headers: corsHeaders })

  // Calculate date 60 days ago for ?start= parameter
  const timestamp = new Date().toISOString();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 60);
  const startParam = thirtyDaysAgo.toISOString().split('T')[0];

  // 1. Fetch from Sectors API v2
  const fetchDaily = async (ticker: string) => {
    const res = await fetch(`https://api.sectors.app/v2/daily/${ticker}/?start=${startParam}`, {
      headers: { "Authorization": SECTORS_API_KEY!, "Cache-Control": "no-cache" }
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`fetchDaily v2 failed with status ${res.status}: ${errText}`);
    }
    return res.json();
  }
  const fetchBenchmark = async () => {
    const res = await fetch(`https://api.sectors.app/v2/index-daily/ihsg/?start=${startParam}`, {
      headers: { "Authorization": SECTORS_API_KEY!, "Cache-Control": "no-cache" }
    });
    if (!res.ok) {
      const errText = await res.text();
      console.warn(`fetchBenchmark v2 failed with status ${res.status}: ${errText}`);
      return [];
    }
    return res.json();
  }

  let prices, benchmark;
  try {
    [prices, benchmark] = await Promise.all([
      fetchDaily(symbol),
      fetchBenchmark()
    ]);
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }

  // Handle potential `{ data: [...] }` wraps
  const pricesArr = Array.isArray(prices) ? prices : (prices?.data || prices?.results || []);
  const benchArr = Array.isArray(benchmark) ? benchmark : (benchmark?.data || benchmark?.results || []);

  if (!pricesArr || pricesArr.length === 0) {
    return new Response(JSON.stringify({ error: "No data found for symbol" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }

  // v2 usually sorts descending (latest first). Let's check date to be sure, or just assume [0] is latest if date[0] > date[last]
  const isDesc = pricesArr.length > 1 && new Date(pricesArr[0].date) > new Date(pricesArr[pricesArr.length - 1].date);
  
  const latestPriceData = isDesc ? pricesArr[0] : pricesArr[pricesArr.length - 1];
  const prevPriceData = isDesc 
    ? (pricesArr.length > 1 ? pricesArr[1] : pricesArr[0])
    : (pricesArr.length > 1 ? pricesArr[pricesArr.length - 2] : latestPriceData);
  
  // Find matching benchmark date, fallback to latest available
  let latestIHSG = benchArr.find((b: any) => b.date === latestPriceData.date)
  if (!latestIHSG && benchArr.length > 0) latestIHSG = isDesc ? benchArr[0] : benchArr[benchArr.length - 1]
  if (!latestIHSG) latestIHSG = { close: 0 }
  
  let prevIHSG = benchArr.find((b: any) => b.date === prevPriceData.date)
  if (!prevIHSG && benchArr.length > 1) prevIHSG = isDesc ? benchArr[1] : benchArr[benchArr.length - 2]
  if (!prevIHSG) prevIHSG = latestIHSG

  const latestPrice = latestPriceData.close ?? latestPriceData.price ?? 0;
  const prevPrice = prevPriceData.close ?? prevPriceData.price ?? 0;
  const latestIhsgPrice = latestIHSG.close ?? latestIHSG.price ?? 0;
  const prevIhsgPrice = prevIHSG.close ?? prevIHSG.price ?? 0;

  const changePercent = prevPrice ? ((latestPrice - prevPrice) / prevPrice) * 100 : 0
  const ihsgChangePercent = prevIhsgPrice ? ((latestIhsgPrice - prevIhsgPrice) / prevIhsgPrice) * 100 : 0

  const medianVolume = precedingVolumeMedian(pricesArr);

  const snapshot = {
    symbol,
    last_price: latestPrice,
    change_amount: latestPrice - prevPrice,
    change_percent: Number(changePercent.toFixed(2)),
    today_volume: latestPriceData.volume ?? 0,
    median_volume_20d: Math.round(medianVolume),
    ihsg_price: latestIhsgPrice || 0, // Fallback to 0 to strictly avoid null
    ihsg_change_percent: Number(ihsgChangePercent.toFixed(2)),
    updated_at: timestamp,
    data_date: latestPriceData.date
  }

  // 2. Upsert to global table
  const { error } = await supabase.from("global_market_snapshots").upsert(snapshot)
  if (error) console.error("Error upserting proxy snapshot", error.message)

  return new Response(JSON.stringify(snapshot), { 
    status: 200, 
    headers: { ...corsHeaders, "Content-Type": "application/json" } 
  })
})
