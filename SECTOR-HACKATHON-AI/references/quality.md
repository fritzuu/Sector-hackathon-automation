# Acceptance teknik dan tampilan

## Aman

- Sectors key, Telegram token, Supabase privileged key hanya server; tidak masuk bundle browser, log, URL publik, fixture, screenshot, atau git. `.env.example` hanya placeholder; ignore secret sebelum mengisi nilai.
- Validasi input/API response. Escape teks eksternal di HTML/Telegram; jangan render raw HTML dari sumber. Tautan sumber hanya protokol web yang diizinkan, bukan instruksi yang dieksekusi.
- Untuk multi-user: auth dan RLS/ownership harus diuji dengan dua pengguna. Privileged server client tidak otomatis menjamin isolasi. Jadwal/webhook/replay mutation harus terautentikasi; dashboard publik read-only memakai data demo tersanitasi.
- Endpoint worker tidak boleh memberi pengguna kontrol URL fetch atau identitas penerima tanpa validasi. Token chat Telegram dianggap data privat.
- Terapkan timeout, paginasi, bounded retry, atomic idempotency dan overlap control. Mode demo tidak memakai secret live sebagai default.

## Mudah didiagnosis

Log terstruktur: run_id, mode, ticker, stage, data_date, status, duration, safe_error_code. Pisahkan scheduler accepted, ingestion, evaluation, persistence, render, delivery dan completion. Jangan log headers/body mentah berisi credential.

Gunakan correlation ID untuk menelusuri satu kegagalan. Error UI menyebut bagian gagal dan freshness terakhir; jangan mengganti gagal dengan sukses atau angka nol. Bedakan no change, no data, not run dan failed.

## UI tidak asal jadi

- Prioritas: apa berubah → bukti/tanggal → keterbatasan → timeline. Hindari landing page pemasaran sebelum workflow berfungsi.
- Satu gaya komponen, spacing dan tipografi konsisten. Tidak perlu gradient/glassmorphism, animasi, chart atau dependency baru tanpa manfaat tugas.
- Bahasa Indonesia, istilah saham diberi penjelasan singkat. Tidak ada FOMO, confidence score, angka palsu atau tombol tanpa fungsi.
- Uji keyboard, label input, focus visible, kontras, status selain warna, mobile dan desktop. Siapkan loading/empty/partial/error/stale serta label replay.

## Bukti selesai

Setelah scaffold, sediakan script typecheck, lint, test, build yang sesuai stack; jangan menuliskan command fiktif di handoff. Jalankan targeted regression setiap perubahan dan full checks sebelum milestone/release. Test tidak boleh hanya memeriksa snapshot UI.

Kasus wajib sesuai area yang diubah: equality threshold, baseline kurang, duplicate input/concurrent run, stale/libur, partial source failure, recovery watermark, outbox ambiguity, dua sesi penutupan, isolasi replay/live, no look-ahead, deterministic template, private-user isolation. Catat hasil aktual dan tes yang belum dijalankan.
