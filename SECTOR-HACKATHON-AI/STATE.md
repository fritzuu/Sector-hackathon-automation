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
