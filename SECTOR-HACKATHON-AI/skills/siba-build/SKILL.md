---
name: siba-build
description: Implements one approved SIBA MVP slice, including scaffolding, UI or pipeline wiring, without expanding product scope.
---

# Build satu slice

Baca [STATE](../../STATE.md), [DECISIONS](../../DECISIONS.md), bagian PRD terkait, lalu acceptance relevan di [quality](../../references/quality.md). Jangan membaca semua skill. Gate onboarding/freeze berlaku sebelum kode; setup dokumen boleh tetap berjalan.

Tentukan outcome terlihat, FR/P0 terkait, file target, dan cara menguji. Bila task kecil dan jelas, langsung implementasikan; keputusan produk belum final yang memengaruhi task perlu konfirmasi, bukan tebakan.

Gunakan pola project yang sudah ada. Saat scaffold pertama, konfirmasi stack, pin dependency lewat lockfile dan tambahkan script pemeriksaan nyata. Pisahkan core murni dari I/O; domain invariants ada di [domain](../../references/domain.md) bila menyentuh rule/state/replay.

Bangun jalur minimal yang bekerja. Pada slice antarmuka/UI, jaga konsistensi visual & teknis sesuai `tailwind-design-system`, `anti-ui-slop`, `react-ui-patterns`, dan `references/quality.md`: gunakan satu hierarki token/komponen, siapkan 5 state penanganan data (loading, empty, partial, error, stale), label replay eksplisit, serta navigasi keyboard/kontras WCAG. UI harus menyambung data nyata/fixture berlabel, bukan tombol dekoratif. Abstraksi hanya jika mengurangi duplikasi nyata atau memungkinkan test boundary. Jangan menambah auth vendor, animasi kosmetik berlebih, chart atau fitur P1 sebagai bonus.

Verifikasi perubahan dengan test bermakna, review diff, lalu perbarui STATE dengan command/hasil aktual dan satu next step. Bila dependency/API belum tersedia, laporkan batas pengujian; jangan mengganti integrasi dengan mock tanpa memberi label.
