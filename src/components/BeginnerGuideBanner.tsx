import React, { useState } from 'react';
import { X, CheckCircle, Sparkles } from 'lucide-react';

interface BeginnerGuideBannerProps {
  userName: string;
}

export const BeginnerGuideBanner: React.FC<BeginnerGuideBannerProps> = ({ userName }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="p-4 rounded-lg bg-[#0f172a] border border-slate-800 text-xs text-slate-200 space-y-2 font-sans">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2 text-teal-300 font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>Selamat Datang di SIBA, {userName}</span>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-slate-300 leading-relaxed max-w-4xl">
        Anda tidak perlu membaca grafik teknikal atau memantau bursa sepanjang hari. Cukup masukkan saham perusahaan yang ingin Anda awasi di <strong>Watchlist</strong> dan hubungkan ke <strong>Telegram</strong>. SIBA akan memeriksa data resmi Sectors API setiap hari bursa dan mengirim rangkuman hanya saat ada kejadian penting.
      </p>

      <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-teal-300 font-mono">
        <span className="flex items-center space-x-1">
          <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
          <span>Otomatis Jalan Tiap 16:30 WIB</span>
        </span>
        <span className="flex items-center space-x-1">
          <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
          <span>100% Deterministik Tanpa AI Halu</span>
        </span>
        <span className="flex items-center space-x-1">
          <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
          <span>Notifikasi Terisolasi ke Akun Anda</span>
        </span>
      </div>
    </div>
  );
};
