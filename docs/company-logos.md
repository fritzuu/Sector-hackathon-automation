# Logo emiten

`StockLogo` menerima ticker dari daftar emiten live Sectors, tanpa mengubah model
data, harga, rule, workflow, atau pengiriman Telegram. Digunakan pada kartu
watchlist, hasil pencarian, explorer sektor, saham populer, detail saham,
pengumuman per saham, ringkasan watchlist, dan aktivitas pasar dashboard.

Sumber prioritas untuk BBCA, BBRI, BMRI, GOTO, AMMN adalah aset pada situs
perusahaan yang ditemukan pada 8 Oktober 2026:

- BCA: https://www.bca.co.id/id (aset pada pustaka.bca.co.id)
- BRI: https://www.ir-bri.com/
- Mandiri: https://www.bankmandiri.co.id/
- GoTo: https://www.gotocompany.com/
- AMMAN: https://www.amman.co.id/

Untuk ticker lain, atau ketika sumber utama gagal, komponen mencoba gambar
`https://assets.stockbit.com/logos/companies/{TICKER}.png` milik Stockbit.
Identitas sumber dicantumkan pada judul logo dan keterangan halaman watchlist;
logo bukan data Sectors dan bukan bukti afiliasi. Penemuan URL publik ini tidak
menetapkan lisensi penggunaan ulang aset atau merek.

Tidak memerlukan API key atau request company report tambahan. Hanya logo
yang muncul di antarmuka dimuat, memakai native lazy loading dan tanpa referrer.
Format ticker dibatasi empat huruf IDX (suffix `.JK` dinormalisasi). Logo memakai
object-contain, ukuran tetap, dan kode saham selama loading atau setelah semua
sumber gagal; retry dibatasi jumlah sumber. Pergantian ticker mereset status gambar.

Verifikasi HTTP HEAD: 5 sumber perusahaan mengembalikan 200 dan content-type
gambar. Sampel CDN BBCA, BBRI, BMRI, GOTO, AMMN, TLKM, ASII, BBNI, INDF, AADI,
PANI, CUAN, WIFI mengembalikan 200 image/png; ticker kontrol XXXX mengembalikan
403. Tidak membuktikan seluruh emiten memiliki logo maupun izin hotlink permanen.
Review dashboard pada 8 Oktober: versi resmi GOTO berwarna putih; latar gelap
memperbaiki kontrasnya. Browser memperlihatkan logo GOTO berhasil dimuat dan terlihat.
Komponen mendukung ukuran kecil (32 px) dan besar (48 px) untuk dashboard.
