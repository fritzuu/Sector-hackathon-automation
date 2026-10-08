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

### Login Google (Supabase Auth)

1. Salin `.env.example` ke `.env.local` di root proyek, lalu isi URL proyek dan **publishable key** Supabase. Jangan masukkan Google Client Secret atau service-role key ke variabel `VITE_`.
2. Di Google Auth Platform, buat OAuth Client tipe **Web application**. Tambahkan origin aplikasi (misalnya `http://localhost:3000`) dan gunakan URL callback yang ditampilkan Supabase Auth → Sign In / Providers → Google sebagai **Authorized redirect URI** di Google.
3. Aktifkan Google provider di Supabase dengan Client ID dan Client Secret tersebut. Di Supabase Auth → URL Configuration, izinkan `http://localhost:3000/` sebagai redirect URL. Tambahkan URL aplikasi produksi saat akan deploy.
4. Jalankan `npm run dev`, klik **Masuk dengan Google**, lalu pastikan kembali ke dashboard. Login Google memakai redirect halaman penuh; aplikasi memulihkan sesi saat halaman dimuat ulang.

Konfigurasi Google di layanan eksternal diperlukan untuk uji login nyata. `npm test` dan `npm run build` hanya memverifikasi kode lokal.

### Fungsi tombol Jalankan Run

`Jalankan Run` memulai satu siklus evaluasi langsung untuk ticker di watchlist saat ini. Untuk setiap ticker, aplikasi mengambil transaksi harian Sectors, data IHSG untuk tanggal yang sama, dan filing yang tersedia; mengevaluasi tiga rule deterministik; lalu membuka, memperbarui, memantau, atau menutup kasus beserta event dan template-nya. Jika Telegram terhubung, notifikasi dikirim untuk event material. Hasil run dan workspace kasus juga dicatat.

Run manual ini tidak memprediksi harga, memberi rekomendasi, atau melakukan transaksi.

### Otomatisasi pagi

Cron `invoke-siba-workflow` menjalankan rekap dan evaluasi kasus bersama pada **07.00 WIB, Senin–Jumat** (`0 0 * * 1-5` UTC), menggunakan `phase=workflow`. Fungsi mengambil sesi perdagangan terakhir sebelum hari ini, mencocokkan tanggal saham dan IHSG, mengevaluasi kasus, lalu mengantrekan Rekap Pagi satu pesan per saham. Berita berada setelah harga, IHSG, volume, dan hasil evaluasi. Data belum lengkap mempertahankan status kasus dan diberi keterangan menunggu sumber.

Cron `invoke-telegram-worker` memeriksa antrean setiap menit. Job evaluasi terpisah `invoke-siba-cases` dinonaktifkan; tidak ada Cron malam aktif. Dashboard membaca pembaruan server setiap 30 detik saat halaman terlihat.

Konfigurasi scheduler tersedia di migrasi Supabase; gunakan migrasi gabungan terbaru `20261008190000_combined_morning_workflow.sql` dan deploy workflow dari sumber kanonis. Lihat [panduan deploy](supabase/functions/siba-workflow/DEPLOYMENT.md). Default checkpoint adalah `morning`. Nilai `evening` tetap diterima untuk kompatibilitas pemanggilan manual lama dan riwayat, bukan jadwal otomatis.

Berita diperiksa dengan rentang overlap tujuh hari; halaman yang belum tuntas dicatat sebagai cakupan parsial. Mode preview manual tidak mengubah workspace atau ledger dan bukan bukti Cron berjalan tanpa campur tangan.


---

## 2. Navigasi Dokumen & Arsitektur

Gunakan tabel referensi berikut sesuai konteks pekerjaan kamu:

| Path | Kapan Harus Dibaca |
| --- | --- |
| [rules/siba.md](SECTOR-HACKATHON-AI/rules/siba.md) | Aturan operasional wajib setiap sesi coding Antigravity |
| [STATE.md](SECTOR-HACKATHON-AI/STATE.md) | **Single source of truth**: status aktif, handoff, blocker, dan next step |
| [PRD.md](PRD.md) | **Acuan produk kanonis v0.4**: ruang lingkup MVP, batasan data, dan FR P0 |
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
