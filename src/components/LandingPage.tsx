import React from 'react';
import {
  Shield,
  ArrowRight,
  Send,
  Zap,
  CheckCircle2,
  TrendingUp,
  FileText,
  Clock,
  Layers,
  HelpCircle,
  Building2,
  Lock,
  Database,
  Calculator,
  Search,
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  return (
    <div className="space-y-16 py-6 font-sans">
      {/* Hero Section */}
      <section className="border-b border-slate-800 pb-16 pt-6">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-slate-900 border border-slate-700 text-teal-400 text-xs font-mono">
            <Database className="w-3.5 h-3.5" />
            <span>SIBA — SISTEM INFORMASI BURSA DAN ASET (TRACK 02)</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto">
            Pemantauan Saham IDX Otomatis Lintas Hari Berbasis Data Resmi Sectors API
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Asisten pemantau saham Indonesia yang mengawasi aset pilihan Anda setiap hari bursa jam 16:30 WIB. Mendeteksi anomali volume, penyimpangan harga terhadap IHSG, dan keterbukaan informasi resmi tanpa tebakan AI.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto px-6 py-3 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-xs rounded transition-colors flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Mulai Buat Watchlist & Akun</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onOpenAuth('login')}
              className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-xs rounded transition-colors"
            >
              Masuk ke Akun
            </button>
          </div>

          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left font-mono text-xs text-slate-400 max-w-4xl mx-auto">
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded">
              <div className="text-slate-500 text-[10px]">SUMBER DATA</div>
              <div className="text-white font-bold mt-0.5">Sectors API v2</div>
            </div>
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded">
              <div className="text-slate-500 text-[10px]">MODEL LOGIKA</div>
              <div className="text-white font-bold mt-0.5">100% Deterministik</div>
            </div>
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded">
              <div className="text-slate-500 text-[10px]">KANAL NOTIFIKASI</div>
              <div className="text-white font-bold mt-0.5">Telegram Terisolasi</div>
            </div>
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded">
              <div className="text-slate-500 text-[10px]">JADWAL EKSEKUSI</div>
              <div className="text-white font-bold mt-0.5">Hari Bursa 16:30 WIB</div>
            </div>
          </div>
        </div>
      </section>

      {/* How Users Know Validation is Valid (No AI Hallucinations) */}
      <section className="max-w-5xl mx-auto px-4 space-y-6">
        <div className="border-l-2 border-teal-500 pl-4">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">
            Transparansi Bukti: Bagaimana Anda Tahu Data & Rangkuman Ini Valid?
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            SIBA tidak menggunakan LLM atau AI generatif yang berisiko membuat kesimpulan palsu. Seluruh temuan bersumber dari kalkulasi matematis pasti dan dokumen resmi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Rule 1 Evidence */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded space-y-2">
            <div className="flex items-center space-x-2 text-teal-400 font-bold">
              <Calculator className="w-4 h-4" />
              <span>1. Validitas Volume Transaksi</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Dihitung dengan rumus pasti: Volume sesi hari ini dibanding median volume 20 sesi bursa sebelumnya. Sinyal hanya aktif jika rasio &gt;= 2.0x median. Nilai median dan riwayat transaksi tercatat transparan.
            </p>
          </div>

          {/* Rule 2 Evidence */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded space-y-2">
            <div className="flex items-center space-x-2 text-sky-400 font-bold">
              <TrendingUp className="w-4 h-4" />
              <span>2. Validitas Pergerakan IHSG</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Membandingkan persentase return harian saham dengan persentase perubahan indeks acuan IHSG. Kasus dibuka bila selisih pergerakan &gt;= 2.0%.
            </p>
          </div>

          {/* Rule 3 Evidence */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 font-bold">
              <FileText className="w-4 h-4" />
              <span>3. Validitas Keterbukaan IDX</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Setiap pengumuman menyertakan ID Filing resmi, tanggal publikasi menit-ke-menit, dan tautan langsung ke arsip dokumen keterbukaan informasi Bursa Efek Indonesia.
            </p>
          </div>
        </div>
      </section>

      {/* Telegram Live Mockup Section */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Contoh Format Pesan Otomatis di Telegram
              </h3>
              <p className="text-xs text-slate-400">
                Pesan dikirim terisolasi hanya ke nomor Telegram yang terdaftar di akun Anda.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-slate-800 text-teal-300 font-mono text-[11px] self-start sm:self-auto">
              Template v1.0.0
            </span>
          </div>

          <div className="max-w-xl mx-auto bg-[#17212b] border border-slate-700/80 rounded p-4 text-xs font-mono text-slate-200 space-y-3 leading-relaxed">
            <div className="text-sky-400 font-bold border-b border-slate-700 pb-1 flex items-center justify-between">
              <span>[SIBA — TLKM] Status: OPEN (2026-08-21)</span>
              <span className="text-[10px] text-slate-400">16:31 WIB</span>
            </div>

            <div>
              <span className="text-teal-300 font-bold block mb-1">📌 FAKTA (Terverifikasi Data Sectors API):</span>
              <span className="text-slate-300">
                • Volume Transaksi: 32.000.000 lot (3,20x dibanding median 20 sesi: 10.000.000 lot).
              </span>
            </div>

            <div>
              <span className="text-sky-300 font-bold block mb-1">🔍 INTERPRETASI TERBATAS (Tanpa Prediksi):</span>
              <span className="text-slate-300">
                • Aktivitas volume perdagangan berada di atas ambang batas normal (&gt;= 2x median 20 hari).
              </span>
            </div>

            <div>
              <span className="text-amber-300 font-bold block mb-1">❓ BELUM DIKETAHUI:</span>
              <span className="text-slate-300">
                • Faktor katalis eksternal, rumor pasar, dan sentimen media sosial di luar data resmi Sectors API tidak dipantau.
              </span>
            </div>

            <div className="pt-2 border-t border-slate-700 text-[10px] text-slate-400">
              ⚠️ DISCLAIMER: Pemberitahuan otomatis SIBA. Bukan rekomendasi transaksi atau prediksi harga. Lakukan riset mandiri (DYOR).
            </div>
          </div>
        </div>
      </section>

      {/* 3 Step Beginner Flow */}
      <section className="max-w-5xl mx-auto px-4 space-y-6">
        <div className="border-l-2 border-teal-500 pl-4">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">
            Alur Penggunaan Sederhana untuk Pemula
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded space-y-2">
            <div className="text-teal-400 font-mono font-bold text-sm">LANGKAH 1</div>
            <h4 className="font-bold text-white text-sm">Pilih Perusahaan</h4>
            <p className="text-slate-300 leading-relaxed">
              Cari nama perusahaan yang Anda kenal (cth: Bank Central Asia, Telkom, Indofood) atau pilih paket sektor siap pakai.
            </p>
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded space-y-2">
            <div className="text-teal-400 font-mono font-bold text-sm">LANGKAH 2</div>
            <h4 className="font-bold text-white text-sm">Sambungkan Telegram</h4>
            <p className="text-slate-300 leading-relaxed">
              Salin kode pairing 24+ karakter ke bot Telegram SIBA. Chat ID Anda terkunci permanen ke akun pribadi Anda.
            </p>
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded space-y-2">
            <div className="text-teal-400 font-mono font-bold text-sm">LANGKAH 3</div>
            <h4 className="font-bold text-white text-sm">Otomatis Terpantau</h4>
            <p className="text-slate-300 leading-relaxed">
              Selesai. Setiap hari bursa jam 16:30 WIB, worker SIBA otomatis memeriksa data Sectors dan mengirim kabar jika ada anomali.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="p-6 bg-[#0f172a] border border-slate-800 rounded-lg text-center space-y-4">
          <h2 className="text-xl font-bold text-white">
            Mulai Pantau Saham Pilihan Anda Tanpa Mengulang Riset dari Awal
          </h2>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">
            Daftar akun gratis dan hubungkan bot Telegram Anda sekarang.
          </p>
          <div>
            <button
              onClick={() => onOpenAuth('register')}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-xs rounded transition-colors cursor-pointer"
            >
              Buat Akun SIBA Sekarang
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
