import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

serve(async () => {
  if (!TELEGRAM_BOT_TOKEN) {
    return new Response("Telegram delivery is not configured", { status: 503 })
  }

  // 1. Fetch up to 25 pending messages
  const { data: messages, error } = await supabase
    .from("telegram_outbox")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(25)

  if (error) {
    return new Response("Unable to read Telegram outbox", { status: 500 })
  }

  const staleBefore = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { data: staleMessages, error: staleError } = await supabase
    .from("telegram_outbox")
    .select("id, user_id, chat_id, delivery_keys")
    .eq("status", "processing")
    .lt("updated_at", staleBefore)
  if (staleError) {
    return new Response("Unable to reconcile stale Telegram messages", { status: 500 })
  }
  for (const stale of staleMessages || []) {
    await supabase
      .from("telegram_outbox")
      .update({ status: 'unknown', updated_at: new Date().toISOString() })
      .eq("id", stale.id)
    if (stale.user_id && stale.delivery_keys?.length) {
      await supabase
        .from("telegram_delivery_items")
        .update({ status: 'unknown', updated_at: new Date().toISOString() })
        .eq("user_id", stale.user_id)
        .eq("chat_id", stale.chat_id)
        .in("item_key", stale.delivery_keys)
    }
  }

  if (!messages || messages.length === 0) {
    return new Response("No pending messages", { status: 200 })
  }

  // Claim conditionally so overlapping worker invocations cannot both send a row.
  const messageIds = messages.map(m => m.id)
  const { data: claimed, error: claimError } = await supabase
    .from("telegram_outbox")
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .in("id", messageIds)
    .eq("status", "pending")
    .select("*")

  if (claimError || !claimed || claimed.length === 0) {
    return new Response(claimError ? "Unable to claim Telegram messages" : "No claimable messages", {
      status: claimError ? 500 : 200,
    })
  }

  // 3. Send them out sequentially
  let successCount = 0
  for (const msg of claimed) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          chat_id: msg.chat_id, 
          text: msg.message, 
          parse_mode: "HTML" 
        })
      })

      const result = await res.json().catch(() => null)
      if (res.ok && result?.ok === true) {
        successCount++
        await supabase.from("telegram_outbox").update({ status: 'sent', updated_at: new Date().toISOString() }).eq("id", msg.id)
        if (msg.user_id && msg.delivery_keys?.length) {
          await supabase
            .from("telegram_delivery_items")
            .update({ status: 'sent', updated_at: new Date().toISOString() })
            .eq("user_id", msg.user_id)
            .eq("chat_id", msg.chat_id)
            .in("item_key", msg.delivery_keys)
        }
      } else {
        console.error(`Telegram API rejected message ${msg.id} with status ${res.status}`)
        await supabase.from("telegram_outbox").update({ status: 'failed', updated_at: new Date().toISOString() }).eq("id", msg.id)
        if (msg.user_id && msg.delivery_keys?.length) {
          await supabase
            .from("telegram_delivery_items")
            .update({ status: 'pending', updated_at: new Date().toISOString() })
            .eq("user_id", msg.user_id)
            .eq("chat_id", msg.chat_id)
            .in("item_key", msg.delivery_keys)
        }
      }
    } catch (err) {
      console.error(`Telegram delivery outcome unknown for ${msg.id}`)
      await supabase.from("telegram_outbox").update({ status: 'unknown', updated_at: new Date().toISOString() }).eq("id", msg.id)
      if (msg.user_id && msg.delivery_keys?.length) {
        await supabase
          .from("telegram_delivery_items")
          .update({ status: 'unknown', updated_at: new Date().toISOString() })
          .eq("user_id", msg.user_id)
          .eq("chat_id", msg.chat_id)
          .in("item_key", msg.delivery_keys)
      }
    }
    
    // Tiny delay to respect Telegram's absolute limits (though 25 is safe)
    await new Promise(resolve => setTimeout(resolve, 40))
  }

  return new Response(`Processed ${claimed.length} messages, ${successCount} sent successfully.`, { status: 200 })
})
