---
name: siba-review
description: Reviews SIBA changes or checks release and hackathon demo readiness with evidence; does not deploy or submit.
---

# Review dan demo

Review read-only kecuali user meminta perbaikan. Baca diff, bagian PRD yang disentuh dan [quality](../../references/quality.md). Prioritaskan hasil pengguna salah, secret/ownership, idempotency dan failure visibility sebelum kosmetik. Setiap temuan berisi lokasi, dampak, kondisi pemicu dan bukti; jangan membuat temuan hanya agar terlihat teliti.

Jalankan pemeriksaan yang tersedia; bedakan lulus, gagal, dan belum dijalankan. Untuk rule/state/replay, audit [domain](../../references/domain.md). Untuk slice antarmuka/UI, audit kepatuhan konsistensi desain (`wcag-audit-patterns`, `anti-ui-slop`): pastikan tidak ada ad-hoc utility styling yang bertabrakan, status loading/empty/error/stale terpasang rapi, dan kontras serta navigasi keyboard memenuhi standar kualitas. Mock tests tidak membuktikan integrasi live atau unattended execution.

Saat diminta readiness demo: tunjukkan satu kasus lintas hari melalui replay berlabel serta bukti automation nyata terpisah. Tidak boleh menyebut replay sebagai unattended run atau fixture sebagai data historis riil. Target internal PRD: tiga unattended runs dan video maksimal tiga menit.

Cek sumber/timestamp/disclaimer, credential di repo/log/video, reproducible setup, dan batas klaim manfaat. Verifikasi rules resmi di tautan PRD sebelum submission; kit bukan jaminan eligibility. Laporkan readiness dan blocker, jangan mengunggah, submit, commit/push atau mengubah deployment otomatis. Freeze mulai saat submit atau deadline, mana lebih awal; exception credential mengikuti panitia, bukan workflow bugfix biasa.
