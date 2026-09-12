# Sector-hackathon-automation — SIBA Developer Onboarding

Selamat datang di proyek **SIBA** (**Sistem Informasi Bursa dan Aset** / *Watchtower*).  
Repositori ini adalah starter kit dan panduan kolaboratif pengembangan asisten pemantau saham IDX untuk **Track 02 — Automation & Workflows, Sectors Hackathon 2026**.

> **Prinsip Utama**: Produk beroperasi **100% deterministik tanpa runtime LLM** (berbasis rule transparan dan template teruji). AI (seperti Antigravity) hanya digunakan sebagai asisten rekayasa kode di lingkungan development, bukan di dalam alur eksekusi aplikasi pengguna.

---

## 1. Quickstart: Memulai dalam 3 Langkah

### Langkah 1: Buka Workspace di Antigravity
Buka root folder `sector-hackathon` di Antigravity IDE. Folder kerja utama kamu berada di dalam `SECTOR-HACKATHON-AI/`.

### Langkah 2: Pastikan Rules & Skills Terbaca
1. Di panel **Customizations → Rules**, pastikan rule `siba` terbaca dari jembatan `.agents/rules` dan atur ke **Always On**.
2. Seluruh skill pengembangan (4 skill alur kerja SIBA + 8 skill desain/frontend esensial) sudah tersimpan langsung di dalam folder [`SECTOR-HACKATHON-AI/skills/`](SECTOR-HACKATHON-AI/skills/) dan terhubung melalui `.agents/skills/`. **Tidak perlu menginstal skill ke environment global.**

### Langkah 3: Baca Status Terkini & Jalankan Preflight
Selalu mulai setiap sesi dengan memeriksa handoff terkini di [STATE.md](SECTOR-HACKATHON-AI/STATE.md), lalu berikan prompt pemula:

```text
Baca SECTOR-HACKATHON-AI/rules/siba.md dan SECTOR-HACKATHON-AI/STATE.md. Gunakan siba-build. Saat ini lakukan preflight: periksa status gate onboarding, keputusan teknis yang aktif, dan rencana slice berikutnya. Jangan install dependency, membuat kode aplikasi, atau memanggil API berbayar dulu. Jelaskan hal yang perlu aku konfirmasi.
```

---

## 2. Navigasi Dokumen & Arsitektur

Gunakan tabel referensi berikut sesuai konteks pekerjaan kamu:

| Path | Kapan Harus Dibaca |
| --- | --- |
| [rules/siba.md](SECTOR-HACKATHON-AI/rules/siba.md) | Aturan operasional wajib setiap sesi coding Antigravity |
| [STATE.md](SECTOR-HACKATHON-AI/STATE.md) | **Single source of truth**: status aktif, handoff, blocker, dan next step |
| [PRD.md](SECTOR-HACKATHON-AI/PRD.md) | Spesifikasi produk, pernyataan masalah, batasan data, dan FR P0 |
| [DECISIONS.md](SECTOR-HACKATHON-AI/DECISIONS.md) | Stack teknologi yang disepakati, batas kuota API, dan arsitektur |
| [BACKLOG.md](SECTOR-HACKATHON-AI/BACKLOG.md) | Roadmap pengerjaan berbasis slice terukur (S0 s/d S5) |
| [references/domain.md](SECTOR-HACKATHON-AI/references/domain.md) | Logika bursa IDX, case lifecycle state machine, replay, dan dedup |
| [references/quality.md](SECTOR-HACKATHON-AI/references/quality.md) | Standar keamanan, logging terstruktur, UI tanpa FOMO, dan kriteria tes |
| [graphify-out/GRAPH_REPORT.md](SECTOR-HACKATHON-AI/graphify-out/GRAPH_REPORT.md) | Laporan peta relasi arsitektur dan dependensi proyek |

---

## 3. Toolkit Skills Bawaan Proyek

Katalog skill lokal di [`skills/`](SECTOR-HACKATHON-AI/skills/) dibagi menjadi dua kategori yang siap dipanggil:

### A. Skill Alur Kerja Inti SIBA
- **`siba-build`**: Mengimplementasikan satu slice MVP yang sudah disepakati beserta bukti tesnya.
- **`siba-data`**: Memvalidasi kelayakan skema Sectors API dan engine rule deterministik.
- **`siba-debug`**: Mendiagnosis bug berdasarkan bukti reproduksi sebelum menuliskan fix.
- **`siba-review`**: Mengaudit diff kode, kepatuhan kualitas, dan kesiapan demo hackathon.

### B. Skill Desain & Frontend Terkurasi
Untuk menjaga konsistensi antarmuka dashboard (Next.js + Tailwind) sesuai kriteria [quality.md](SECTOR-HACKATHON-AI/references/quality.md):
- **`anti-ui-slop`**: Mencegah tampilan generik AI; memastikan hierarki bersih tanpa gradien/animasi berlebih.
- **`tailwind-design-system`**: Standarisasi token tema Tailwind, layout responsif, dan konsistensi komponen.
- **`kpi-dashboard-design`**: Pola tampilan ringkasan metrik saham, kartu KPI, dan timeline perkembangan kasus.
- **`react-ui-patterns`**: Menangani 5 state wajib: *loading*, *empty*, *partial*, *error*, dan *stale data*.
- **`wcag-audit-patterns`**: Memastikan kepatuhan aksesibilitas (kontras warna WCAG 2.2, fokus keyboard, ARIA).
- **`ux-copy`**: Panduan microcopy bahasa Indonesia yang lugas, profesional, dan bebas dari sensasionalisme / FOMO.
- **`frontend-architecture`**: Pemisahan tegas antara *server-state* dan *UI-state* pada modul React/Next.js.
- **`api-and-interface-design`**: Kontrak tipe TypeScript murni antara layer data, engine, dan antarmuka.

---

## 4. Standar Kolaborasi Tim & Guardrails

1. **Prinsip Satu Slice**: Jangan mencoba mengimplementasikan banyak fitur sekaligus. Pilih satu slice dari [BACKLOG.md](SECTOR-HACKATHON-AI/BACKLOG.md), selesaikan jalurnya, verifikasi dengan tes aktual, lalu perbarui [STATE.md](SECTOR-HACKATHON-AI/STATE.md).
2. **Tanpa Klaim Fiktif**: Jangan pernah menyatakan build atau tes lulus jika perintah pengujiannya belum benar-benar dijalankan di terminal.
3. **Keamanan Kredensial**: Kunci API Sectors, bot token Telegram, dan kredensial Supabase hanya untuk *server-side*. Jangan pernah menaruh secret di file publik, log, fixture, screenshot, atau git commit.
4. **Knowledge Graph Sinkron**: Jika kamu melakukan pull pembaruan dari GitHub atau memperbarui struktur dependensi dokumen, jalankan pembaruan knowledge graph:
   ```bash
   /graphify update .
   ```
   Visualisasi interaktif dapat dilihat langsung dengan membuka [graphify-out/index.html](SECTOR-HACKATHON-AI/graphify-out/index.html) di browser kamu.
5. **Konfirmasi Push**: Selalu koordinasikan dan konfirmasi dengan rekan tim sebelum melakukan git push ke remote repository.
