# Handoff

- Tahap: S3 persistensi per akun (bukan user dummy). Auth UUID = `profiles.id`; watchlist, audit run, dan workspace kasus disimpan di Supabase dengan RLS.
- Scope: PRD kanonis root `PRD.md` v0.4, Track 02, tanpa LLM.
- Hasil: schema `supabase/schema.sql` + migrasi `20260927100000_per_account_production.sql`; login/daftar memakai sesi Auth; bot pairing lewat RPC tanpa seed Budi/Sarah.
- Verifikasi: jalankan SQL schema di dashboard Supabase project `tdqwrfcaxxswmrtwcxyd`, lalu `npm test` dan `npm run build`.
- File utama:
  - `supabase/schema.sql`
  - `src/modules/auth/stores/auth.store.ts`
  - `src/services/supabaseStorage.ts`
  - `bot/storage.py`
- Selanjutnya: terapkan schema di SQL Editor bila belum, uji dua akun terpisah (watchlist/kasus tidak bocor), lalu scheduler unattended di luar browser.
- 27 Sep 2026 — Login Google lokal memakai redirect halaman penuh dan route menunggu pemulihan sesi. `npm test` lulus 23/23; `npm run build` lulus. Uji browser: login email, pemulihan sesi setelah refresh, logout, pengalihan dari `/dashboard` setelah logout, serta tambah/hapus satu saham dan persistensinya berhasil. Google provider membuka pemilih akun; callback setelah memilih akun belum diuji. Perlu uji dua akun terpisah dan alur reset kata sandi sampai selesai.
- Risiko auth yang perlu ditangani sebelum rilis: perintah Telegram `/login` meminta kata sandi dalam pesan; cache profil menurut email bisa mengembalikan profil dengan ID berbeda dari pengguna yang sedang login.

- 7 Okt 2026 — Resolusi lokal PR #7 pada branch `codex/pr7-resolve`: gabungkan `main` 515b23d, pertahankan error snapshot tidak tersedia, pindahkan widget dari IDX_COMPANIES ke company store, pakai query Supabase bersama untuk overview/watchlist; perbaiki urutan penurunan dan hitungan daftar. `npm test`: 31/31 lulus; `npm run build`: lulus dengan peringatan bundle >500 kB. Preview localhost:3007 terbuka; dashboard terautentikasi dan integrasi live belum divalidasi. Next: pengguna cek dashboard/watchlist di preview sebelum perubahan dikirim ke PR.

- 7 Okt 2026 — PR-QA: cleanup logout/pergantian akun kini memakai `clearAccountState` yang hanya membersihkan memori, termasuk cache log Telegram; tidak memanggil persistensi reset replay. Empat tes regresi mencakup cleanup akun aktif, pergantian akun, logout, dan reset replay eksplisit. `npm test`: 35/35 lulus; `npm run build`: lulus (peringatan bundle >500 kB tetap ada). Uji menggunakan adapter Supabase mock; pergantian dua akun live belum dijalankan. Next: validasi dua akun live sebelum merge.

- 7 Okt 2026 — PR-QA lanjutan: normalisasi metadata nullable; satu evaluator metrik kartu/modal dengan baseline nol sebagai unknown; preset/single ticker memakai loader snapshot bersama dan guard pergantian akun; source `data_date` terpisah dari `updated_at`; hidrasi auth digabung dan respons lama dibatalkan. Proxy baseline memakai 20 sesi sebelumnya (tanpa sesi terbaru). `npm test`: 52/52 lulus; `npm run build`: lulus, warning bundle >500 kB tetap ada; sintaks TS dua Edge Function lolos esbuild, runtime Deno/live belum diverifikasi. Preview guest terbuka; dashboard terautentikasi belum diuji pada perubahan ini. Next: terapkan migrasi tanggal sebelum deploy kedua fungsi sesuai references/pr-qa-rollout.md, lalu cek dua akun dan preset live.
