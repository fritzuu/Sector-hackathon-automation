# Handoff

- Tahap: S3 persistensi per akun (bukan user dummy). Auth UUID = `profiles.id`; watchlist, audit run, dan workspace kasus disimpan di Supabase dengan RLS.
- Scope: PRD v0.3, Track 02, tanpa LLM.
- Hasil: schema `supabase/schema.sql` + migrasi `20260927100000_per_account_production.sql`; login/daftar memakai sesi Auth; bot pairing lewat RPC tanpa seed Budi/Sarah.
- Verifikasi: jalankan SQL schema di dashboard Supabase project `tdqwrfcaxxswmrtwcxyd`, lalu `npm test` dan `npm run build`.
- File utama:
  - `supabase/schema.sql`
  - `src/modules/auth/stores/auth.store.ts`
  - `src/services/supabaseStorage.ts`
  - `bot/storage.py`
- Selanjutnya: terapkan schema di SQL Editor bila belum, uji dua akun terpisah (watchlist/kasus tidak bocor), lalu scheduler unattended di luar browser.
