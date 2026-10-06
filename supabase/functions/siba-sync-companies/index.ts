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
  
  // Verify token (can be cron service role)
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
        return new Response("Unauthorized: Only Service Role can execute sync", { status: 401, headers: corsHeaders })
      }
    } catch (e) {
      return new Response("Unauthorized: Invalid token format", { status: 401, headers: corsHeaders })
    }
  }

  const fetchWithOrder = async (orderBy: string) => {
    const results = new Map<string, { val: any, name: string }>()
    let offset = 0
    const limit = 200
    let hasMore = true
    
    while (hasMore) {
      const res = await fetch(`https://api.sectors.app/v2/companies/?order_by=${orderBy}&limit=${limit}&offset=${offset}&include_query_values=true`, {
        headers: { "Authorization": SECTORS_API_KEY!, "Cache-Control": "no-cache" }
      })
      
      if (!res.ok) {
        console.error(`Failed to fetch offset ${offset} for ${orderBy}`)
        break
      }
      
      const data = await res.json()
      const items = Array.isArray(data) ? data : (data.data || data.results || [])
      
      for (const item of items) {
        const cleanSymbol = item.symbol ? item.symbol.replace('.JK', '') : ''
        if (cleanSymbol && item.query_values && item.query_values[orderBy] !== undefined) {
          results.set(cleanSymbol, { 
            val: item.query_values[orderBy], 
            name: item.company_name || item.name || cleanSymbol 
          })
        }
      }
      
      if (items.length < limit) {
        hasMore = false
      } else {
        offset += limit
      }
    }
    return results
  }

  // Fetch all metadata in parallel
  const [sectorsMap, subSectorsMap, marketCapMap] = await Promise.all([
    fetchWithOrder('sector'),
    fetchWithOrder('sub_sector'),
    fetchWithOrder('market_cap')
  ])

  // We need a master list of symbols, we can just use the keys from subSectorsMap (or merge all keys)
  const allSymbols = new Set([
    ...sectorsMap.keys(),
    ...subSectorsMap.keys(),
    ...marketCapMap.keys()
  ])

  const allCompanies: any[] = []
  
  for (const sym of allSymbols) {
    const sMap = sectorsMap.get(sym)
    const subMap = subSectorsMap.get(sym)
    const mcMap = marketCapMap.get(sym)
    
    const companyName = sMap?.name || subMap?.name || mcMap?.name || sym

    let marketCapTier = 'Mid Cap'
    let rawMc: number | null = null
    if (mcMap?.val) {
      rawMc = Number(mcMap.val)
      if (rawMc >= 10_000_000_000_000) {
        marketCapTier = 'Big Cap'
      } else if (rawMc >= 1_000_000_000_000) {
        marketCapTier = 'Mid Cap'
      } else {
        marketCapTier = 'Small Cap'
      }
    }

    allCompanies.push({
      symbol: sym,
      name: companyName,
      sector: sMap?.val || 'Unknown',
      sub_sector: subMap?.val || 'Unknown',
      market_cap: rawMc,
      market_cap_tier: marketCapTier,
      updated_at: new Date().toISOString()
    })
  }
  
  if (allCompanies.length > 0) {
    const { error } = await supabase.from("companies").upsert(allCompanies, { onConflict: "symbol" })
    if (error) {
      return new Response(`Error upserting: ${error.message}`, { status: 500, headers: corsHeaders })
    }

    // Clean up delisted / renamed companies
    const activeSymbols = new Set(allCompanies.map(c => c.symbol));
    const { data: existingData } = await supabase.from("companies").select("symbol");
    
    if (existingData) {
      const obsoleteSymbols = existingData
        .map(d => d.symbol)
        .filter(sym => !activeSymbols.has(sym));
        
      if (obsoleteSymbols.length > 0) {
        await supabase.from("companies").delete().in("symbol", obsoleteSymbols);
        console.log(`Deleted ${obsoleteSymbols.length} obsolete companies:`, obsoleteSymbols);
      }
    }
  }

  return new Response(JSON.stringify({ message: `Synced ${allCompanies.length} companies` }), { 
    status: 200, 
    headers: { ...corsHeaders, "Content-Type": "application/json" } 
  })
})
