---
name: siba-debug
description: Diagnoses SIBA failures or fixes an authorized bug using reproducible evidence and narrow regression tests.
---

# Debug berbasis bukti

Diagnosis saja tidak memberi izin fix. Catat expected vs actual, mode live/replay, run_id/ticker/data_date, dan perubahan terakhir yang relevan. Jangan meminta dump secret atau seluruh database.

Telusuri boundary pertama yang berbeda: scheduler → fetch/schema → rule → state/persistence → template → delivery → UI. Scheduler accepted bukan bukti worker selesai. Baca [domain](../../references/domain.md) hanya bila masalah melibatkan data/state; [quality](../../references/quality.md) untuk observability/security.

Reproduksi lokal dengan fixture minimum tersanitasi dan clock tetap. Tulis satu hipotesis, pemeriksaan pembeda, lalu hasil. Setelah dua percobaan tanpa bukti baru, berhenti menebak: ambil observasi yang hilang atau laporkan blocker; jangan reinstall/refactor besar sebagai ritual.

Bila fix diizinkan, perbaiki akar masalah dengan diff terkecil, tambahkan regression yang gagal sebelum fix dan lulus sesudahnya, lalu cek area berdekatan. Jangan menghapus assertion, melemahkan RLS, memakai catch kosong atau angka default untuk menyembunyikan error.

Laporkan penyebab terbukti vs dugaan, hasil tes, dan risiko tersisa. STATE hanya menyimpan temuan berguna untuk kelanjutan. Jangan replay job live atau kirim ulang Telegram untuk eksperimen tanpa izin penerima dan budget.
