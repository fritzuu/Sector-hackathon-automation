# Keputusan dan gate

## Disepakati melalui PRD

SIBA, IDX, satu watchlist, tiga rule awal, case timeline, Telegram, dashboard, audit log, replay. Tanpa LLM runtime. P0/FR dan disclaimer: PRD §8–12, §22. PRD masih draft; jangan memperlakukan hipotesis manfaat sebagai hasil validasi.

## Usulan teknis — belum final

Default sederhana untuk dikonfirmasi sekali: TypeScript, Next.js + Tailwind untuk dashboard, Supabase Postgres, Zod untuk boundary, Vitest untuk core. Telegram sebagai kanal. Scheduler kandidat Supabase Cron memanggil worker/Edge Function, bukan browser pengguna. Vercel opsional untuk dashboard.

Satu core TypeScript murni dipakai live/replay/test; provider, database, clock, dan delivery lewat adapter kecil. Jangan buat framework plugin, microservices, Redis, atau multi-agent runtime. Jika Edge Function dipilih, pastikan core kompatibel Deno; jangan impor modul Node/server framework ke core.

Konfirmasi versi/dependency melalui dokumentasi resmi saat scaffold; simpan lockfile, gunakan satu package manager. Jangan memasang semua opsi library sekaligus.

## Putuskan tepat sebelum bagian terkait dibangun

| Keputusan | Gate / bukti yang dibutuhkan |
|---|---|
| Onboarding + freeze | Konfirmasi pemilik; belum tersedia |
| Stack dan scheduler | Persetujuan default di atas; ukur durasi worker dan batas runtime aktual |
| API layak | Schema, coverage, ID filing, waktu publikasi, freshness, error, biaya request aktual |
| Budget | 1.000 kredit tim total menurut rules, bukan per hari; catat sisa, biaya bootstrapping/run/retry dan cadangan |
| Ticker demo | Hitung dari budget dan coverage; bukan batas permanen produk |
| Kepemilikan data | Tentukan satu kasus aktif per ticker global atau per pengguna sebelum schema; isolasi private watchlist/delivery |
| Case lifecycle | Putuskan penutupan filing-only, data-quality terpisah dari lifecycle, dan dua sesi berbeda vs dua run |
| Filing pertama | Tentukan baseline awal agar arsip lama tidak dikirim sebagai berita baru |
| Harga | Verifikasi adjusted/raw serta corporate actions sebelum menganggap pergerakan valid |

Pertanyaan ini tidak menghalangi pekerjaan independen; jangan menebak keputusan yang mengubah hasil pengguna. Rekam keputusan saat dibuat dengan tanggal, alasan, dan bukti; ubah PRD hanya atas persetujuan.

Layanan gratis punya kuota dan risiko jeda. Batas durasi Cron bukan batas durasi Edge Function. Jangan klaim scheduler sukses dari HTTP accepted saja: perlu status selesai worker. Tidak ada akun, langganan, atau deployment yang dibuat oleh kit ini.
