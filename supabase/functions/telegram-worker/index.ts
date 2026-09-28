import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

serve(async () => {
  // 1. Fetch up to 25 pending messages
  const { data: messages, error } = await supabase
    .from("telegram_outbox")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(25)

  if (error || !messages || messages.length === 0) {
    return new Response("No pending messages", { status: 200 })
  }

  // 2. Mark them as 'processing' so another cron tick doesn't grab them
  const messageIds = messages.map(m => m.id)
  await supabase
    .from("telegram_outbox")
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .in("id", messageIds)

  // 3. Send them out sequentially
  let successCount = 0
  for (const msg of messages) {
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

      if (res.ok) {
        successCount++
        await supabase.from("telegram_outbox").update({ status: 'sent', updated_at: new Date().toISOString() }).eq("id", msg.id)
      } else {
        const errText = await res.text()
        console.error(`Telegram API error for ${msg.id}: ${errText}`)
        await supabase.from("telegram_outbox").update({ status: 'failed', updated_at: new Date().toISOString() }).eq("id", msg.id)
      }
    } catch (err) {
      console.error(`Fetch error for ${msg.id}:`, err)
      await supabase.from("telegram_outbox").update({ status: 'failed', updated_at: new Date().toISOString() }).eq("id", msg.id)
    }
    
    // Tiny delay to respect Telegram's absolute limits (though 25 is safe)
    await new Promise(resolve => setTimeout(resolve, 40))
  }

  return new Response(`Processed ${messages.length} messages, ${successCount} sent successfully.`, { status: 200 })
})
