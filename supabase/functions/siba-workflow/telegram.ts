import { formatTelegramHtml } from "./formatter.ts"

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")

export async function sendTelegramAlert(chatId: string, symbol: string, status: string, template: any) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn("TELEGRAM_BOT_TOKEN is missing!")
    return
  }
  
  const messageHtml = formatTelegramHtml(symbol, status, template)
  
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      chat_id: chatId, 
      text: messageHtml, 
      parse_mode: "HTML" 
    })
  })
}
