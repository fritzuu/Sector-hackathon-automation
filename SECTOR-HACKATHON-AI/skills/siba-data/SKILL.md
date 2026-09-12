---
name: siba-data
description: Validates Sectors API feasibility or implements SIBA deterministic rules, case transitions, deduplication and replay.
---

# Data dan engine

Baca [domain](../../references/domain.md) serta keputusan terbuka di [DECISIONS](../../DECISIONS.md). Untuk API, verifikasi endpoint v2 dari dokumentasi resmi yang ditautkan PRD §23; jangan mengarang schema, coverage atau fallback v1.

Feasibility output: endpoint/field yang diuji, sample tersanitasi, timestamp semantics, ID stability, availability, missing/error behavior, credits terpakai dan perkiraan cost/run. Bedakan documented, tested dan unknown. Batasi live probe sesuai izin/budget; jangan fetch saat setiap page load atau menggunakan request live dalam unit test.

Normalize sekali pada adapter dan validasi boundary. Core menerima snapshot bertipe, previous state dan as-of eksplisit; menghasilkan evaluation/event, bukan langsung mengirim Telegram. Template hanya merender evidence dan versi, tidak mengubah keputusan.

Tulis test threshold dan missing-data sebelum memperluas pipeline. Test pengulangan lintas run, concurrence/constraint pada persistence, late filings, replay availability dan no live delivery sesuai bagian yang disentuh. Jika definisi lifecycle/ownership belum diputuskan, kerjakan bagian independen dan minta keputusan pada titik itu.

Simpan contract/keputusan terverifikasi secukupnya agar agent berikutnya tidak mengulang riset. Jangan mengarsip credential atau menyalin dokumentasi API lengkap.
