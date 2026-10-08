# Deploy workflow dari sumber yang sama

Jalankan dari root repository:

```sh
npm test
npm run build
npm run build:workflow
npx deno check --no-lock supabase/functions/siba-workflow/index.ts supabase/functions/telegram-worker/index.ts
npx deno check --no-lock dist-functions/siba-workflow/index.js
```

`dist-functions/siba-workflow/index.js` adalah satu file hasil bundle engine dan formatter kanonis `src/engine/telegramFormatter.ts`, termasuk semua import lokal. Untuk deployment melalui editor Supabase, ganti isi entry `index.ts` dengan seluruh isi bundle yang baru dibuat. Jangan menyalin shim `formatter.ts` saja atau memakai bundle lama. Output tidak disimpan ke Git; buat ulang setelah perubahan sumber. Deployment bukan bagian dari perintah build.

Workflow POST hanya menerima header `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` yang sama persis dengan konfigurasi server. Klaim `role` dari payload JWT tidak lagi dipakai sebagai bukti autentikasi. Pastikan Cron memakai kredensial server yang sesuai; jangan menaruh key di frontend atau dokumentasi. Worker tetap fungsi terpisah.

Pesan per saham menggunakan urutan harga, IHSG, volume, kemudian berita dan footer. Checkpoint pagi mengambil daily dan benchmark sekali per simbol unik untuk konteks lengkap; ini menambah request dibanding jalur pagi lama yang hanya mengambil harga pending. Ledger tetap mengendalikan item baru yang boleh dikirim: watchlist lima saham tidak selalu menghasilkan lima pesan jika hanya satu saham memiliki pembaruan baru. Mode preview yang sudah tersedia membuat pesan seluruh watchlist untuk satu profil yang ditargetkan, tanpa reservasi item delivery, sehingga pemanggilan preview berulang memang dapat menghasilkan pesan ulang.

Baseline memakai 20 tanggal sesi unik sebelum sesi target, bukan 20 baris atau hari kalender. Rasio tidak ditampilkan jika histori kurang, volume tidak valid, data duplikat bertentangan, atau median nol. Jika engine melewati sesi yang sudah diproses, formatter dapat menghitung konteks volume secara murni tanpa memproses ulang kasus.

Setelah deploy, validasi Cron autentikasi, respons workflow, outbox, worker, dan pesan Telegram dari data asli. Tes lokal dan pemeriksaan Deno tidak membuktikan versi live sudah berubah atau scheduler telah berjalan otomatis.

## Rekap dan evaluasi gabungan 07.00 WIB

Terapkan migrasi `20261008173000_morning_briefing_cases.sql` bila belum diterapkan, lalu `20261008190000_combined_morning_workflow.sql`, dan deploy bundle terbaru. Migrasi terbaru menggantikan keputusan pemisahan jadwal: `invoke-siba-workflow` pukul 07.00 WIB memakai `phase=workflow`, mengevaluasi kasus lalu mengirim Rekap Pagi satu bubble per saham. Job `invoke-siba-cases` pukul 08.00 dinonaktifkan, riwayatnya tetap tersimpan. Worker tetap setiap menit.

Fase default tanpa query adalah `workflow` gabungan. Fase eksplisit `briefing` tetap hanya rekap tanpa menyimpan workspace/watermark; `evaluation` tetap evaluasi tanpa mengambil berita, untuk kompatibilitas. Preview manual tidak mengubah state kasus dan bukan bukti eksekusi unattended.

Hanya sesi sebelum tanggal WIB hari ini yang digunakan, IHSG wajib tanggal sama. Data incomplete mempertahankan lifecycle dan menampilkan catatan menunggu data; tidak ada janji sumber siap pukul 07.00 ataupun retry per jam. Kunci harga rekap per tanggal kirim/saham/sesi mencegah pengiriman rekap ulang pada hari yang sama, sambil memungkinkan rekap data sesi terakhir saat data terbaru belum tersedia. Perubahan kasus tetap memakai event key sendiri.

Kolom `data_date`/`ihsg_data_date` memisahkan tanggal sesi dari waktu snapshot. Dashboard membaca workspace, snapshot, audit dan Telegram setiap 30 detik saat terlihat, tanpa menulis workspace, dengan guard akun. Riwayat detail kasus dibatasi ke caseId yang dipilih. Build lokal bukan konfirmasi versi live: cek Cron aktif, riwayat automation_runs mode workflow, audit, outbox dan worker setelah deploy.
