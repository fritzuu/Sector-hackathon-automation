# Product Requirement Document (PRD)

## SIBA — Sistem Informasi Bursa dan Aset

| Field | Detail |
|---|---|
| Status | Draft v0.4 — acuan ruang lingkup MVP, deterministik tanpa LLM |
| Track | Track 02 — Automation & Workflows, Sectors Hackathon 2026 |
| Product owner | TBD |
| Target submission internal | 29 September 2026 |
| Deadline resmi | 30 September 2026, 23:59 WIB |
| Bahasa produk | Bahasa Indonesia |

---

## 1. Riwayat Perubahan

| Versi | Tanggal | Perubahan utama |
|---|---|---|
| 0.1 | 12 September 2026 | Konsep awal pemantau perubahan material dan pengiriman alert |
| 0.2 | 12 September 2026 | Fokus dipindahkan dari alert satu kali menjadi pemantauan kasus lintas hari; persona dipersempit; batas data dikoreksi; confidence score dihapus; replay dan validasi masalah ditambahkan |
| 0.3 | 12 September 2026 | LLM dan AI generatif dikeluarkan dari MVP; seluruh penjelasan menggunakan template deterministik yang terversi dan dapat diuji |
| 0.4 | 28 September 2026 | Menegaskan batas MVP: satu watchlist maksimal lima ticker, tiga rule, pemeriksaan pascapasar, dashboard, dan Telegram notifikasi saja; data terlambat/tidak lengkap harus ditampilkan apa adanya |

## 2. Ringkasan Produk

SIBA, singkatan dari Sistem Informasi Bursa dan Aset, adalah asisten pemantauan saham IDX yang berjalan otomatis setelah pengguna membuat watchlist. Setiap hari bursa, SIBA mengambil data Sectors, mendeteksi perubahan yang memenuhi aturan transparan, membuka kasus pemantauan, lalu membandingkan perkembangan pada run berikutnya.

Pengguna dapat melihat:

- apa yang memicu kasus;
- apa yang berubah sejak pemeriksaan sebelumnya;
- informasi mana yang benar-benar baru;
- sumber dan waktu setiap fakta;
- apa yang belum diketahui;
- kapan kondisi pemicu tidak lagi aktif.

SIBA bukan alat prediksi, pemberi sinyal beli atau jual, penasihat keuangan, maupun eksekutor transaksi. Produk membantu pengguna melakukan riset mandiri dengan lebih teratur dan tidak mengulang pemeriksaan dari awal.

### 2.1 Pernyataan masalah

> Investor ritel atau swing trader IDX yang tidak dapat memantau pasar sepanjang hari harus berulang kali memeriksa perubahan pada saham pilihannya, mencari konteks dari beberapa sumber, dan mengingat sendiri informasi yang sudah pernah dilihat.

### 2.2 Pernyataan masalah untuk submission

> SIBA membantu investor ritel IDX mengikuti perkembangan saham pilihannya dengan otomatis mencatat perubahan penting, membedakan temuan baru dari temuan lama, dan mengirim pembaruan berbasis data Sectors.

### 2.3 Value proposition

> **Ketahui apa yang berubah sejak pemeriksaan terakhir, beserta bukti dan batas informasinya, tanpa mengulang riset dari awal.**

### 2.4 Hipotesis yang belum terbukti

> Setelah sebuah saham menarik perhatian, sebagian investor ritel kesulitan mengikuti perkembangannya dari hari ke hari dan membedakan informasi baru dari informasi yang sudah pernah dilihat.

Hipotesis ini belum boleh disebut fakta pasar. Wawancara awal dengan satu responden memberi sinyal bahwa pengguna mencari informasi dari banyak kanal, tidak langsung memercayai sinyal, melakukan riset sendiri, dan tetap memantau setelah masuk. Namun responden tersebut menggeneralisasi pengalaman investasi atau trading dan bukan pengguna saham berpengalaman. Validasi lanjutan tetap wajib.

## 3. Alasan Memilih Track Automation & Workflows

Fungsi inti SIBA adalah rutinitas berulang:

```text
Jadwal hari bursa
      ↓
Ambil data Sectors
      ↓
Bandingkan dengan riwayat
      ↓
Evaluasi aturan
      ↓
Buka/perbarui/tutup kasus
      ↓
Kirim perubahan material
      ↓
Simpan audit log
```

Kesesuaian dengan track:

1. Workflow berjalan berdasarkan jadwal tanpa intervensi manusia pada setiap siklus.
2. Data Sectors berada di inti deteksi dan pembaruan kasus.
3. Seluruh deteksi, perubahan status, dan penjelasan MVP bersifat deterministik.
4. Video menunjukkan konfigurasi jadwal, timestamp, log, dan hasil unattended run.

SIBA MVP tidak menggunakan LLM atau AI generatif. Fokus teknisnya adalah recurring workflow, stateful case monitoring, deduplikasi, data traceability, dan unattended execution.

## 4. Tujuan dan Non-Tujuan

### 4.1 Tujuan MVP

1. Mengotomatisasi pemeriksaan berulang atas saham dalam watchlist.
2. Mengubah perubahan satu kali menjadi kasus yang mempunyai riwayat perkembangan.
3. Menunjukkan hanya perkembangan material, bukan mengirim ulang informasi yang sama.
4. Memisahkan fakta, interpretasi terbatas, dan informasi yang belum diketahui.
5. Memberikan bukti workflow berjalan tanpa pengguna membuka aplikasi.
6. Membuktikan alur end-to-end dalam video maksimal tiga menit.

### 4.2 Non-tujuan MVP

SIBA tidak bertujuan untuk:

- memprediksi harga atau return;
- mencari saham yang akan naik;
- memberi label Buy, Hold, Sell, entry, exit, target profit, atau stop loss;
- menentukan penyebab pasti pergerakan hanya dari kedekatan waktu;
- mengumpulkan rumor atau informasi orang dalam;
- mencakup seluruh X, Instagram, Threads, Telegram, dan media sosial lain;
- melakukan transaksi atau terhubung ke akun broker;
- menjadi terminal data real-time;
- menggantikan riset dan keputusan pengguna.

## 5. Target Pengguna

### 5.1 Persona utama

**Investor ritel atau swing trader IDX paruh waktu** yang:

- telah memiliki saham atau watchlist yang ingin dipantau;
- memegang posisi selama beberapa hari hingga beberapa minggu;
- tidak dapat memantau pasar sepanjang hari;
- melakukan DYOR sebelum mengambil keputusan;
- menginginkan sedikit pembaruan yang dapat diverifikasi, bukan banyak sinyal.

### 5.2 Bukan target utama

- day trader yang membutuhkan data intraday atau detik-ke-detik;
- pengguna yang hanya mencari rekomendasi saham;
- investor pasif yang tidak membutuhkan pemantauan kejadian;
- institusi yang membutuhkan terminal riset tingkat enterprise.

### 5.3 Jobs to Be Done

> Ketika saham dalam watchlist mengalami perubahan tidak biasa, saya ingin sistem mencatat kejadiannya dan mengikuti perkembangannya secara otomatis, sehingga saya dapat melihat apa yang baru tanpa mengulang pencarian dari awal.

JTBD pendukung:

- Ketika tidak ada perkembangan, saya tidak ingin menerima notifikasi berulang.
- Ketika ada temuan, saya ingin memeriksa angka, waktu, aturan, dan sumbernya.
- Ketika konteks belum ditemukan, saya ingin sistem mengatakannya dengan jujur.
- Ketika automation gagal, saya ingin mengetahui data mana yang tidak berhasil diperiksa.

## 6. Alur Pengguna Utama

### 6.1 Setup satu kali

1. Pengguna membuat watchlist.
2. Pengguna mengaktifkan pemantauan otomatis.
3. Sistem menampilkan jadwal run berikutnya dan kanal notifikasi.
4. Setelah itu pengguna tidak perlu menekan tombol setiap hari.

### 6.2 Run otomatis

1. Scheduler memulai workflow setelah data harian tersedia.
2. Sistem mengambil data terbaru dari Sectors API v2.
3. Sistem memvalidasi tanggal, kelengkapan, dan freshness data.
4. Sistem membandingkan data dengan sesi perdagangan sebelumnya dan baseline historis.
5. Detection engine mengevaluasi aturan deterministik.
6. Case engine menentukan apakah perlu membuka, memperbarui, mempertahankan, atau menutup kasus.
7. Sistem menyimpan hasil run dan perubahan kasus.
8. Notifikasi hanya dikirim jika terjadi perubahan status atau temuan material.

### 6.3 Pengguna menerima pembaruan

Telegram berfungsi sebagai pintu masuk singkat:

```text
TLKM — Kasus baru

Volume sesi terakhir 2,3× median 20 sesi sebelumnya.
Return TLKM +3,1%; IHSG +0,4%.
Belum ditemukan konteks langsung dari sumber yang diperiksa.

Ini adalah informasi pemantauan, bukan rekomendasi transaksi.
Lihat detail kasus →
```

Dashboard menampilkan fakta, sumber, apa yang belum diketahui, dan linimasa kasus. Nilai di atas hanya ilustrasi format, bukan data saham nyata.

### 6.4 Tidak ada perkembangan

Jika kasus masih aktif tetapi tidak ada perubahan material baru:

- run tetap dicatat;
- status kasus tetap terlihat di dashboard;
- notifikasi yang sama tidak dikirim ulang;
- kasus hanya muncul di daily digest jika pengguna mengaktifkannya.

### 6.5 Run gagal atau data tidak lengkap

- Sistem tidak membuat kesimpulan dari data wajib yang hilang.
- Rule terkait berstatus `skipped`.
- Run dapat berstatus `partial` jika sebagian ticker berhasil diperiksa.
- Kegagalan pembuatan pesan tidak menggagalkan deteksi, penyimpanan kasus, atau audit log.

## 7. Model Kasus Lintas Hari

### 7.1 Satu kasus per ticker aktif

MVP hanya mengizinkan satu kasus aktif per ticker. Trigger tambahan masuk ke kasus yang sama agar pengguna tidak menerima kasus yang tumpang tindih.

### 7.2 Status kasus

| Status | Makna | Aksi notifikasi |
|---|---|---|
| `OPEN` | Trigger pertama kali memenuhi aturan | Kirim kasus baru |
| `MONITORING` | Kasus masih dipantau tanpa perkembangan material | Tidak kirim ulang |
| `UPDATED` | Ada trigger, sumber, atau perubahan status baru yang material | Kirim pembaruan |
| `CLOSED` | Kondisi penutupan terpenuhi | Kirim penutupan singkat |
| `DATA_INCOMPLETE` | Data wajib tidak tersedia | Tampilkan keterbatasan; notifikasi hanya jika berulang |

`UPDATED` adalah jenis kejadian, bukan status permanen. Setelah pembaruan dicatat, kasus kembali menjadi `MONITORING` bila masih aktif.

### 7.3 Aturan transisi awal

- Tidak ada kasus aktif + minimal satu trigger aktif → `OPEN`.
- Ada kasus aktif + tidak ada perubahan material → `MONITORING`.
- Ada kasus aktif + trigger atau filing baru → event `UPDATED`.
- Seluruh market trigger tidak aktif pada dua successful run berturut-turut → `CLOSED`.
- Data wajib tidak lengkap → `DATA_INCOMPLETE`; sistem tidak boleh menganggap kondisi normal.

Aturan dua run untuk penutupan adalah konfigurasi awal agar kasus tidak berulang kali buka-tutup karena fluktuasi satu hari. Aturan ini harus diuji pada replay.

### 7.4 Definisi perkembangan material

Perkembangan material untuk MVP adalah salah satu dari:

- trigger baru aktif;
- trigger aktif menjadi tidak aktif atau sebaliknya;
- nilai metrik melewati batas rule yang terdokumentasi;
- terdapat filing baru setelah successful run sebelumnya;
- kasus ditutup;
- data wajib gagal tersedia pada dua run berturut-turut.

Perubahan versi atau redaksi template bukan perkembangan material.

## 8. Ruang Lingkup MVP

### 8.1 Must Have (P0)

#### P0-01 — Watchlist

- Pengguna dapat menambah dan menghapus ticker IDX.
- MVP mendukung satu watchlist.
- Satu watchlist dibatasi maksimal lima ticker.
- Sistem menolak ticker tidak valid dengan pesan yang mudah dipahami.
- Preset sektor hanya menambahkan ticker yang masih muat dalam kapasitas watchlist.

#### P0-02 — Scheduler hari bursa

- Workflow terjadwal berjalan setelah pasar tutup dan setelah data harian tersedia, tanpa aplikasi/browser pengguna terbuka dan tanpa perlu pengguna menekan tombol pada setiap siklus.
- Setiap run memiliki ID, waktu terjadwal, mulai, selesai, dan status.
- Dashboard menampilkan last run dan next run.
- Data kosong karena hari libur tidak dianggap sebagai sesi baru.
- Tombol manual `Jalankan Run` memicu evaluasi sekarang untuk watchlist yang aktif; tombol ini bukan prediksi atau transaksi dan tidak menggantikan scheduler.

#### P0-03 — Sectors API v2 sebagai sumber inti

Data minimum:

- daily transaction per ticker: tanggal, close, open, high, low, volume, dan market cap;
- index daily transaction untuk benchmark awal IHSG;
- company filings yang tersedia pada endpoint Sectors.

Catatan coverage:

- Endpoint daily merupakan data harian, bukan bukti kemampuan streaming intraday.
- Rentang request daily maksimal 90 hari kalender dan biayanya satu kredit per request menurut dokumentasi saat PRD direvisi.
- Endpoint filings yang diverifikasi mencakup transaksi insider dan pemegang saham utama; produk tidak boleh menyebutnya seluruh pengumuman perusahaan.
- Corporate actions, laporan keuangan, berita umum, foreign flow, dan broker activity hanya masuk setelah endpoint serta coverage-nya diuji dalam feasibility spike.
- Timestamp, sumber, freshness, dan status kelengkapan data ditampilkan apa adanya. Data terlambat atau tidak lengkap tidak boleh ditampilkan seolah-olah terbaru atau dianggap sebagai kondisi normal.

#### P0-04 — Detection engine deterministik

Aturan awal untuk diuji:

| Rule | Kondisi awal | Penjelasan |
|---|---|---|
| Abnormal volume | Volume sesi terakhir ≥ 2× median 20 sesi perdagangan sebelumnya | Menandai aktivitas di atas kebiasaan terbaru |
| Relative movement | Selisih absolut return harian saham dan IHSG ≥ 2 poin persentase | Menandai saham yang bergerak berbeda dari pasar umum |
| New verified filing | Ada filing baru sejak successful run terakhir | Menandai informasi resmi baru dalam coverage endpoint |

Threshold 2× dan 2 poin persentase adalah hipotesis konfigurasi, bukan standar kebenaran pasar. Threshold diuji pada beberapa periode historis dan dicatat jika diubah.

Setiap hasil rule berisi nilai aktual, pembanding, periode, timestamp data, versi rule, dan status `triggered`, `not_triggered`, atau `skipped`.

#### P0-05 — Case engine dan deduplikasi

- Membuka, memperbarui, mempertahankan, dan menutup kasus sesuai state transition.
- Menyimpan evidence yang sudah pernah dilihat.
- Filing dibedakan menggunakan identifier sumber; jika tidak tersedia, gunakan fingerprint atribut stabil.
- Event yang sama tidak dikirim ulang hanya karena workflow berjalan kembali.
- Perubahan hasil template tidak boleh membuat event baru.

#### P0-06 — Dashboard kasus

Dashboard minimal mempunyai:

1. Overview automation: status, last run, next run, dan freshness.
2. Active cases: ticker, alasan dibuka, perubahan terakhir, dan keterbatasan data.
3. Case detail: fakta, sumber, `belum diketahui`, dan timeline.
4. Run history: bukti unattended run dan error yang aman.

#### P0-07 — Telegram notification

Bot Telegram pada P0 berfungsi sebagai kanal pengiriman notifikasi satu arah. Notifikasi hanya dikirim untuk kasus baru, perkembangan material, penutupan kasus, atau kegagalan data berulang. Pesan memuat ticker, perubahan, angka utama, timestamp, status sumber, disclaimer, dan tautan detail. Perintah interaktif bot seperti `/status` dan fitur senyapkan ticker tidak termasuk P0.

#### P0-08 — Audit log

Setiap run menyimpan run ID, scheduled time, start/end time, status, ticker dan rule yang diperiksa, perubahan kasus, status pengiriman, serta error tanpa credential.

#### P0-09 — Historical replay untuk demo dan pengujian

Replay memproses tanggal historis secara berurutan menggunakan detection engine dan case engine yang sama dengan mode terjadwal.

Guardrail replay:

- UI selalu menampilkan label `REPLAY DATA HISTORIS`;
- engine hanya membaca data sampai tanggal simulasi;
- timestamp event memakai tanggal data, bukan dipresentasikan sebagai live run;
- hasil replay dipisahkan dari kasus live;
- Telegram production tidak digunakan untuk replay;
- replay bukan backtest keuntungan atau bukti prediksi.

#### P0-10 — Safety dan trust layer

- Tidak ada confidence score numerik yang menyerupai probabilitas prediksi.
- UI memisahkan `Fakta`, `Interpretasi terbatas`, dan `Belum diketahui`.
- Klaim hubungan antarkejadian menggunakan bahasa asosiasi, bukan sebab-akibat.
- Seluruh fakta memiliki sumber dan timestamp.
- Disclaimer terlihat pada onboarding, case detail, Telegram, dan replay.

### 8.2 Should Have (P1)

- Variasi template untuk kombinasi beberapa trigger agar pesan tetap ringkas.
- Daily digest opsional: kasus baru, diperbarui, tidak berubah, dan ditutup.
- Feedback `berguna/tidak berguna` beserta alasan singkat.
- Pengguna dapat mengaktifkan atau menonaktifkan jenis rule.
- Sumber tambahan yang lolos feasibility spike.

### 8.3 Could Have (P2)

- Beberapa watchlist.
- Weekly case report.
- Perbandingan peer basket dengan metodologi terdokumentasi.
- Email sebagai kanal tambahan.
- Ekspor kasus.

### 8.4 Won't Have pada MVP

- Prediksi harga atau return.
- Rekomendasi beli/jual atau personalized advice.
- Automated trading dan broker connection.
- Social-media scraping.
- Rumor atau “informasi orang dalam”.
- Intraday real-time monitoring.
- Perintah interaktif Telegram seperti `/status` atau pengaturan senyapkan ticker pada P0.
- Native mobile app.
- Multi-market di luar IDX.
- LLM, AI generatif, atau fine-tuning model.
- Multi-agent architecture sebagai tujuan tersendiri.
- Klaim sebab-akibat dari korelasi waktu.

## 9. Mesin Penjelasan Deterministik

SIBA MVP tidak menggunakan LLM atau AI generatif. Seluruh pesan dibentuk dari evidence object yang sudah divalidasi menggunakan template biasa.

```text
Sectors data
      ↓
Validasi dan normalisasi
      ↓
Rule engine
      ↓
Case state transition
      ↓
Structured evidence object
      ↓
Template renderer terversi
      ↓
Dashboard dan Telegram
```

### 9.1 Tanggung jawab template renderer

Template renderer:

- memilih template berdasarkan jenis case event dan trigger;
- memasukkan hanya nilai dari evidence object;
- memformat angka, tanggal, dan satuan secara konsisten;
- menyertakan sumber, timestamp, bagian `Belum diketahui`, dan disclaimer;
- menghasilkan teks yang sama untuk input dan versi template yang sama.

Template renderer tidak boleh:

- menambahkan angka atau fakta yang tidak ada pada evidence object;
- menyimpulkan penyebab kejadian;
- menghasilkan rekomendasi transaksi;
- mengubah hasil rule atau status kasus;
- memakai kata-kata prediktif seperti `akan naik`, `akan turun`, atau `peluang profit`.

### 9.2 Versioning dan pengujian template

- Setiap template mempunyai `template_id` dan `template_version`.
- Case event menyimpan versi template yang dipakai saat pesan dibuat.
- Perubahan template masuk version control.
- Snapshot test memastikan format pesan tidak berubah tanpa disengaja.
- Regression test mencakup satu trigger, beberapa trigger, data kosong, filing baru, penutupan kasus, dan disclaimer.
- Jika rendering gagal, case event tetap tersimpan dan delivery berstatus `failed` agar dapat dicoba ulang secara idempotent.

## 10. Model Kepercayaan

SIBA tidak meminta pengguna memercayai prediksi atau penilaian tersembunyi. Trust dibangun dari kemampuan memeriksa proses.

| Elemen | Yang ditampilkan |
|---|---|
| Trigger transparency | Rule, nilai aktual, threshold, dan versi |
| Data traceability | Sumber, tanggal data, dan waktu pengambilan |
| Freshness | Sesi perdagangan terbaru yang berhasil diproses |
| Completeness | Rule yang dievaluasi dan dilewati |
| Uncertainty | Bagian `Belum diketahui` dan larangan causal claim |
| Change history | Timeline pembukaan, pembaruan, dan penutupan |
| Automation proof | Jadwal, run ID, status, timestamp, dan delivery log |

Produk tidak menampilkan “trust level 82%”. Jika informasi tidak lengkap, produk menyebutkan langsung apa yang hilang.

## 11. Functional Requirements

| ID | Requirement |
|---|---|
| FR-01 | Sistem menyimpan dan memvalidasi satu watchlist. |
| FR-02 | Sistem berjalan otomatis berdasarkan jadwal hari bursa. |
| FR-03 | Sistem menggunakan Sectors API v2 sebagai sumber inti. |
| FR-04 | Sistem menyimpan snapshot untuk perbandingan. |
| FR-05 | Sistem menghitung rule secara deterministik dan terversi. |
| FR-06 | Sistem membuka maksimal satu kasus aktif per ticker. |
| FR-07 | Sistem membedakan evidence baru dan yang sudah diproses. |
| FR-08 | Sistem memperbarui timeline pada perubahan material. |
| FR-09 | Sistem tidak menutup kasus jika data wajib tidak tersedia. |
| FR-10 | Sistem mengirim notifikasi otomatis berdasarkan case event. |
| FR-11 | Sistem menyimpan audit log setiap scheduled run. |
| FR-12 | Sistem menyediakan replay tanpa look-ahead. |
| FR-13 | Sistem memisahkan fakta, interpretasi, dan ketidakpastian. |
| FR-14 | Sistem tidak menghasilkan rekomendasi atau transaksi. |
| FR-15 | Sistem menghasilkan penjelasan dengan template deterministik yang terversi. |

## 12. Non-Functional Requirements

### Reliability

- Kegagalan satu ticker tidak menggagalkan seluruh watchlist.
- Retry terbatas dan tidak menghasilkan notifikasi ganda.
- Idempotency memakai kombinasi run, ticker, rule version, dan data date.
- Data parsial selalu terlihat sebagai data parsial.

### Performance

- Target durasi run ditetapkan setelah feasibility spike.
- Dashboard menampilkan fakta langsung dari data terstruktur.
- Pembuatan pesan tidak menambah panggilan layanan generatif eksternal.

### Security

- API key Sectors dan token Telegram hanya berada pada server-side secret.
- Credential tidak muncul di repository, log, screenshot, video, atau browser.
- Input ticker dan konfigurasi divalidasi.
- Teks sumber eksternal diperlakukan sebagai data tidak tepercaya.

### Explainability dan compliance

- Setiap event dapat ditelusuri ke rule dan snapshot sumber.
- Formula serta versi rule terdokumentasi.
- Sistem membedakan tanggal kejadian, publikasi, dan pengambilan jika field tersedia.
- Produk diposisikan sebagai alat informasi dan analisis.
- Tidak ada automated trade execution atau janji keuntungan.

## 13. Struktur Data Konseptual

```text
User
└── Watchlist
    └── WatchlistTicker

ScheduledRun
├── TickerRun
│   ├── SourceSnapshot
│   └── RuleEvaluation
└── DeliveryAttempt

MonitoringCase
├── CaseEvent
└── EvidenceReference
```

Contoh event:

```json
{
  "case_id": "case_tlkm_20260910",
  "symbol": "TLKM",
  "event": "OPENED",
  "data_date": "2026-09-10",
  "generated_at": "2026-09-10T18:05:00+07:00",
  "rule_version": "volume-v1",
  "facts": [
    {
      "metric": "volume_ratio_vs_median_20_sessions",
      "value": 2.3,
      "threshold": 2.0,
      "source": "Sectors daily transaction v2"
    }
  ],
  "unknowns": [
    "Belum ditemukan informasi dalam sumber yang diperiksa yang menjelaskan pergerakan ini."
  ]
}
```

Nilai contoh tersebut hanya ilustrasi format.

## 14. Konsep Antarmuka

```text
Overview
├── Automation status, last run, next run, freshness
└── Perubahan terbaru

Cases
├── Active / Updated / Closed
└── Case detail
    ├── Alasan dibuka
    ├── Apa yang berubah
    ├── Fakta dan sumber
    ├── Belum diketahui
    └── Timeline

Run history
├── Schedule dan timestamp
├── Ticker/rule results
├── Case events
└── Delivery/error status
```

### Prinsip UX

- **Evidence first:** angka dan sumber sebelum narasi.
- **Change first:** tampilkan perbedaan dari run sebelumnya.
- **Calm by design:** hindari copy yang mendorong FOMO.
- **Quiet by default:** tidak ada notifikasi tanpa perubahan material.
- **Transparent failure:** missing data dan failed run terlihat.
- **Beginner-readable:** istilah ticker, volume, median, dan IHSG memiliki penjelasan.

## 15. Strategi Demo

Demo terdiri dari dua bukti berbeda.

### 15.1 Replay historis

Replay menunjukkan perjalanan kasus beberapa hari dengan cepat. Pilih rentang historis, proses tanggal berurutan, lalu tampilkan kasus dibuka, dipantau tanpa duplikasi, diperbarui, dan ditutup. Replay selalu berlabel historis dan bukan bukti unattended run.

### 15.2 Bukti automation nyata

Video menunjukkan konfigurasi jadwal, minimal tiga unattended runs, timestamp/run ID, hasil saat tidak ada perubahan, delivery log jika ada, dan failure handling bila tersedia.

### 15.3 Storyboard maksimal tiga menit

| Waktu | Isi |
|---|---|
| 0:00–0:25 | Masalah dan target pengguna |
| 0:25–0:45 | Setup watchlist satu kali |
| 0:45–1:45 | Replay perjalanan satu kasus |
| 1:45–2:25 | Jadwal, unattended runs, log, dan Telegram |
| 2:25–3:00 | Fakta vs ketidakpastian, manfaat, dan batas produk |

## 16. Metrik dan Rencana Validasi

### 16.1 Metrik teknis

| Metrik | Kriteria MVP |
|---|---:|
| Evidence traceability | 100% fakta memiliki sumber dan tanggal data |
| Duplicate notification pada replay identik | 0 |
| Look-ahead violation pada replay test set | 0 |
| Deterministic rendering | Input dan versi template yang sama selalu menghasilkan output yang sama |
| Secret exposure pada repository/log demo | 0 |
| Scheduled-run evidence | Minimal 3 unattended runs |

### 16.2 Validasi kegunaan

Target awal adalah lima pengguna yang sesuai persona; ini ukuran sampel pengujian, bukan batas jumlah pengguna atau ticker produk.

Protokol:

1. Berikan satu saham dan sumber informasi dari beberapa hari.
2. Minta pengguna menjelaskan apa yang baru pada hari terakhir secara manual.
3. Catat waktu, halaman yang dibuka, informasi terlewat, dan informasi lama yang dianggap baru.
4. Ulangi dengan SIBA pada kasus sebanding.
5. Tanyakan bagian yang dipercaya, diragukan, dan masih perlu dicari sendiri.

Metrik observasi: waktu menemukan perubahan, jumlah sumber/tab, fakta terlewat, false-new rate, case event yang dinilai berguna, dan alasan tidak percaya.

PRD tidak menetapkan klaim “menghemat 70% waktu” atau “recall 85%” sebelum data tersedia.

### 16.3 Kriteria keputusan

**Lanjutkan** jika mayoritas pengguna target menunjukkan pekerjaan follow-up berulang dan SIBA membantu membedakan perkembangan baru tanpa menambah kebingungan.

**Persempit atau pivot** jika pengguna hanya membutuhkan alert pertama, tidak melakukan follow-up, atau data Sectors tidak cukup untuk pekerjaan yang paling penting bagi mereka.

## 17. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Masalah belum tervalidasi | Solusi mencari masalah | Uji tugas nyata pada 5 pengguna target |
| Tidak berbeda dari price alert | Nilai produk lemah | Fokus timeline, delta, deduplikasi, dan unknowns |
| Coverage Sectors kurang | Kasus miskin konteks | Jujur soal coverage dan lakukan feasibility spike |
| Sumber sosial tidak tercakup | Ekspektasi meleset | Nyatakan batas; social scraping di luar MVP |
| Korelasi dianggap penyebab | Pengguna tersesat | Bahasa asosiasi dan bagian `Belum diketahui` |
| Threshold noisy | Alert fatigue | Replay beberapa periode dan versioning rule |
| Tidak ada event menarik | Demo sulit | Replay historis + unattended evidence nyata |
| Replay dianggap palsu | Trust juri turun | Label historis, tanpa look-ahead, pisahkan log |
| Template salah memasangkan angka | Informasi menyesatkan | Schema validation, snapshot test, dan regression test |
| Produk dianggap kurang teknis tanpa AI | Storytelling lemah | Tunjukkan state machine, deduplikasi, replay tanpa look-ahead, dan unattended execution |
| Kredit API habis | Automation berhenti | Ukur cost/run, cache, hindari fetch saat page load |
| Onboarding belum selesai | Eligibility risk | Jangan tulis project code sebelum terverifikasi |
| Credential bocor | Security risk | Server secret, secret scan, prosedur rotasi |
| Scope tidak selesai | Core gagal | Tiga rule, satu watchlist, satu kanal, satu jadwal |

## 18. Timeline

Timeline dimulai setelah seluruh anggota menyelesaikan onboarding Sectors.

| Tanggal | Milestone | Exit criteria |
|---|---|---|
| 12–13 Sep | PRD v0.3 dan problem review | Tim menyetujui problem, persona, P0, dan batas klaim |
| 14–15 Sep | Data feasibility spike | Endpoint, coverage, ID, freshness, error, dan credit cost tercatat |
| 16–19 Sep | Core pipeline | Scheduled fetch, snapshot, tiga rule, dan run log bekerja |
| 20–22 Sep | Case lifecycle | Open/update/monitor/close dan deduplikasi bekerja |
| 23–24 Sep | Telegram dan dashboard | Detail, timeline, delivery, dan failure state bekerja |
| 25 Sep | Historical replay | Replay tanpa look-ahead memakai engine yang sama |
| 26 Sep | Scope lock | Semua P0 memiliki jalur end-to-end |
| 27 Sep | Reliability dan usability | Unattended runs dan catatan 5 user tests tersedia |
| 28 Sep | Video dan security check | Demo <3 menit, secrets bersih, klaim terbukti |
| 29 Sep | Submission internal | Repo, video, formulir selesai lalu freeze |
| 30 Sep | Buffer submission | Bukan hari penambahan fitur |

## 19. Hackathon Success Gates

- Semua anggota menyelesaikan onboarding sebelum kode pertama.
- Repository dibuat pada build period dan tidak berisi proyek lama.
- Sectors API/MCP merupakan sumber inti.
- Workflow bekerja end-to-end tanpa intervensi per siklus.
- Video menunjukkan schedule/trigger serta log, timestamp, atau unattended runs.
- Tidak ada automated trade execution atau financial-advice positioning.
- Repository publik, teaser satu menit, video maksimal tiga menit, problem statement, track/team, dan social post siap.
- Tidak ada perubahan aplikasi/repository setelah submission atau deadline, kecuali prosedur credential leak resmi.

## 20. Definition of Done

MVP selesai jika:

1. Pengguna dapat membuat satu watchlist.
2. Scheduler menjalankan workflow tanpa intervensi.
3. Data Sectors v2 diambil, divalidasi, dan disimpan.
4. Tiga rule awal dapat ditelusuri.
5. Kasus dapat dibuka, diperbarui, dipertahankan, dan ditutup.
6. Informasi lama tidak dikirim ulang sebagai informasi baru.
7. Dashboard menampilkan fakta, sumber, unknowns, dan timeline.
8. Telegram mengirim case event otomatis.
9. Run history membuktikan minimal tiga unattended runs.
10. Replay berjalan tanpa look-ahead dan berlabel jelas.
11. Template deterministik lulus snapshot dan regression test.
12. Tidak ada credential dalam repository, log, screenshot, atau video.
13. Semua klaim demo dapat dibuktikan dari produk atau repository.

## 21. Keputusan yang Masih Terbuka

1. Apakah seluruh anggota sudah menyelesaikan onboarding Sectors?
2. Siapa product owner dan pemilik engineering, design, data, serta video?
3. Berapa ticker aman untuk demo berdasarkan credit budget dan coverage?
4. Jam berapa data harian Sectors konsisten tersedia setelah sesi perdagangan?
5. Apakah identifier filing cukup stabil untuk deduplikasi?
6. Apakah filing dapat dipetakan ke ticker secara konsisten?
7. Apakah sumber tambahan layak masuk P1 setelah feasibility spike?
8. Apakah pengguna target benar-benar membutuhkan follow-up lintas hari?
9. Apa nama final produk dan tim?

## 22. Disclaimer Produk

> SIBA menyajikan informasi dan analisis berdasarkan data yang tersedia. Informasi dapat tidak lengkap atau terlambat. SIBA tidak memberikan rekomendasi investasi, tidak memprediksi pergerakan harga, dan tidak menjamin hasil di masa depan. Pengguna tetap bertanggung jawab atas riset dan keputusan finansialnya sendiri.

## 23. Referensi

- [RevoU — Product Requirement Document](https://www.revou.co/kosakata/product-requirement-document)
- [Sectors Hackathon 2026 — Official Rules](https://hackathon.sectors.app/rules)
- [Sectors Hackathon — Automation & Workflows](https://hackathon.sectors.app/tracks/automation-workflows)
- [Sectors API v2 — Daily Transaction Data](https://docs.sectors.app/api-references/v2/indonesia/transaction/daily)
- [Sectors API v2 — Index Daily Transaction Data](https://docs.sectors.app/api-references/v2/indonesia/transaction/index-daily)
- [Sectors API v2 — Company Filings](https://docs.sectors.app/api-references/v2/indonesia/news/filings)
