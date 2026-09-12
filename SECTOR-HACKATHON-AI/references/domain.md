# Invarian domain

Gunakan bersama PRD §7–10; daftar ini menyorot jebakan implementasi, bukan mengganti PRD.

## Data dan rule

- Volume: sesi saat ini dibanding median **20 sesi sebelumnya**, tidak memasukkan sesi saat ini. Contoh fixture: median 100, volume 200 → triggered; 199 → not_triggered. Kurang baseline atau median nol → skipped dengan alasan, bukan pembagian tak hingga.
- Relative movement: return saham dan IHSG memakai pasangan sesi yang sejajar. `abs(stockReturn - indexReturn) >= 2` bila unit persen; setara `0.02` bila desimal. Pilih satu unit internal. Harga sebelumnya nol/missing → skipped.
- Kalender adalah sesi bursa, bukan 20 hari kalender. Weekend/holiday/stale response tidak menambah sesi atau memenuhi counter penutupan.
- Harga adjusted/raw dan corporate action belum tervalidasi. Jangan menyimpulkan split sebagai perubahan ekonomi atau penyebab pasti.
- Filing endpoint bukan seluruh berita/pengumuman emiten. Verifikasi ID, simbol, event date, published_at, fetched_at; tanggal kejadian bukan otomatis waktu informasi tersedia.
- Unknown/null bukan 0. Catat evaluated/skipped per rule, data_date dan waktu fetch per sumber. Status partial tidak boleh menjadi sukses penuh.

## State dan idempotency

- Simpan rule version, evidence identity dan template version. Perubahan redaksi tidak membuat event material.
- Identifier semantic event tidak bergantung hanya pada run ID yang berubah setiap retry. Gunakan constraint unik dalam database; in-memory Set tidak cukup.
- Commit case/event dan outbox dalam transaksi; failure satu ticker tidak menghapus keberhasilan ticker lain. Watermark sumber hanya maju setelah data terkait tersimpan, bukan sekadar fetch berhasil.
- Dua successful run untuk CLOSED dalam PRD berisiko menghitung ulang sesi yang sama. Usulan: dua sesi berbeda, lengkap, tanpa market trigger; konfirmasi sebelum coding. Filing-only closure juga perlu keputusan eksplisit.
- UPDATED merupakan event, bukan status persisten. Usulan data_quality terpisah agar missing data tidak menghilangkan status lifecycle; konfirmasi schema.
- Jangan tutup kasus saat data wajib hilang. Filing baseline awal jangan otomatis dianggap seluruhnya baru tanpa keputusan onboarding data.

## Replay dan delivery

- Engine menerima clock/as-of dan input eksplisit; tidak membaca Date.now atau fetch masa depan di domain.
- Filter berdasarkan kapan informasi tersedia, bukan event date saja. Jika publication history tidak tersedia, nyatakan keterbatasan; gunakan fixture simulasi berlabel, bukan klaim replay point-in-time valid.
- Namespace/storage dan outbox replay terpisah live; default replay tidak mengirim Telegram. Fixture diberi label SIMULASI, historical replay diberi label REPLAY DATA HISTORIS.
- Dedup delivery per event + penerima + kanal. Telegram send timeout dapat berarti pesan sebenarnya terkirim: jangan menjanjikan exactly-once atau blind retry. Simpan status ambiguous/unknown, tampilkan untuk rekonsiliasi sesuai kebijakan yang disetujui.
- Retry terbatas untuk transient failure; hormati rate limit. Auth/schema error bukan alasan loop tanpa batas.
