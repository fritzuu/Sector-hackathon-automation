const DASHBOARD_URL = Deno.env.get("DASHBOARD_URL") || "http://localhost:3000"

export function formatTelegramHtml(symbol: string, status: string, template: any) {
  const icons: any = { OPEN: "🚨", UPDATED: "🔄", CLOSED: "✅", DATA_INCOMPLETE: "⚠️" }
  const icon = icons[status] || "📊"

  let html = `<b>${icon} [SIBA — ${symbol}] Status: ${status}</b>\n`
  html += `<i>Sesi: ${template.asOfDate} | Template Versi ${template.version}</i>\n\n`
  
  html += `<b>📌 FAKTA (Terverifikasi Data Sectors API):</b>\n`
  template.facts.forEach((f: string) => html += `• ${f}\n`)
  html += `\n<b>🔍 INTERPRETASI TERBATAS (Tanpa Prediksi):</b>\n`
  template.limitedInterpretations.forEach((i: string) => html += `• ${i}\n`)
  html += `\n<b>❓ BELUM DIKETAHUI:</b>\n`
  template.unknowns.forEach((u: string) => html += `• ${u}\n`)
  html += `\n<b>⚠️ DISCLAIMER:</b>\n<i>${template.disclaimer}</i>\n\n`
  
  html += `🔗 <a href="${DASHBOARD_URL}/?ticker=${symbol}">Lihat detail kasus di Dashboard SIBA →</a>`
  
  return html
}
