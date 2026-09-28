import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

async function sendMessage(chatId: string, text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" })
  })
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 })
  
  const update = await req.json()
  const message = update.message
  if (!message || !message.text) return new Response("OK")
  
  const chatId = message.chat.id.toString()
  const text = message.text.trim()
  const username = message.from.username ? `@${message.from.username}` : message.from.first_name
  
  if (text.startsWith("/start ")) {
    const token = text.split(" ")[1]
    
    const { data: user } = await supabase
      .from("profiles")
      .select("*")
      .eq("pairing_token", token)
      .single()
      
    if (user) {
      await supabase
        .from("profiles")
        .update({
          telegram_chat_id: chatId,
          telegram_username: username,
          is_telegram_linked: true
        })
        .eq("id", user.id)
        
      await sendMessage(chatId, `✅ <b>Akun Berhasil Dipairing ke SIBA!</b>\n\n👤 <b>Pengguna:</b> ${user.name}\n\n<i>Setiap anomali pada saham di watchlist Anda akan dikirimkan otomatis ke chat ini.</i>`)
    } else {
      await sendMessage(chatId, `⚠️ <b>Kode pairing tidak valid atau kedaluwarsa.</b>\nSilakan buat token baru di Dashboard SIBA.`)
    }
  } 
  else if (text === "/status") {
    const { data: user } = await supabase
      .from("profiles")
      .select("*")
      .eq("telegram_chat_id", chatId)
      .single()
      
    if (user) {
      await sendMessage(chatId, `📊 <b>Status Integrasi SIBA:</b>\n\n• <b>Status:</b> ✅ Terhubung\n• <b>Pengguna:</b> ${user.name}\n• <b>Chat ID:</b> <code>${chatId}</code>`)
    } else {
      await sendMessage(chatId, `📊 <b>Status Integrasi SIBA:</b>\n\n• <b>Status:</b> ⚠️ Belum Dipairing\nUntuk menghubungkan, klik 'Hubungkan Telegram' di Dashboard SIBA.`)
    }
  }
  
  return new Response("OK", { status: 200 })
})
