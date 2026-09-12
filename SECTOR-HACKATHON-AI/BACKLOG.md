# Urutan slice

Semua belum dikerjakan. Pilih satu slice; ini urutan usulan, bukan izin otomatis mengerjakan seluruh backlog.

| Slice | Hasil yang bisa dibuktikan |
|---|---|
| S0 Preflight | Onboarding/freeze dicek, stack diputuskan, asumsi domain relevan diselesaikan |
| S1 Data spike | Setelah izin akses API: sample tersanitasi, schema, biaya, freshness dan coverage tercatat; kegagalan terlihat |
| S2 Core lokal | Tiga rule + template diuji dengan fixture berlabel; threshold boundary dan missing data benar |
| S3 Kasus persisten | Snapshot → case/event → run log; replay input sama tidak menggandakan event; recovery diuji |
| S4 Automation | Jadwal memicu pipeline tanpa UI; overlapping run terkendali; worker completion tercatat |
| S5 Delivery | Outbox + Telegram test recipient yang disetujui; retry/error tercatat; tidak ada pesan pada unchanged |
| S6 Dashboard | Watchlist, overview, detail/timeline, run history; loading/empty/partial/error nyata |
| S7 Replay dan demo | Engine sama, isolasi live, tanpa look-ahead; perjalanan kasus dapat dipercepat |
| S8 Release review | Tes risiko, secret review, usability, bukti unattended dan materi submission |

Bangun satu jalur end-to-end lebih awal; jangan menunggu UI sempurna untuk menguji jadwal. P1/P2 diparkir sampai P0 berfungsi dan pemilik menyetujui tambahan. Target tiga unattended runs dari PRD adalah acceptance internal, bukan jumlah minimum yang diklaim berasal dari panitia.
