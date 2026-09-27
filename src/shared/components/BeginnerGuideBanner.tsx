/**
 * BeginnerGuideBanner — redesign.
 * Lebih premium, less generic, tetap informatif.
 * Hallmark · redesign · genre: atmospheric · theme: Midnight
 */

import React, { useState } from 'react';
import { X, CheckCircle2, BellRing, Shield, Zap } from 'lucide-react';

interface BeginnerGuideBannerProps {
  userName: string;
}

const FEATURES = [
  { icon: <Zap className="w-3 h-3 flex-shrink-0" />,     text: 'Otomatis 16:30 WIB setiap hari bursa' },
  { icon: <Shield className="w-3 h-3 flex-shrink-0" />,   text: '100% deterministik — nol halusinasi AI' },
  { icon: <BellRing className="w-3 h-3 flex-shrink-0" />, text: 'Notifikasi terisolasi ke akun Anda' },
];

export const BeginnerGuideBanner: React.FC<BeginnerGuideBannerProps> = ({ userName }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div
      className="rounded-xl overflow-hidden font-sans relative"
      style={{
        background: 'linear-gradient(135deg, rgba(13,20,36,0.96) 0%, rgba(6,25,28,0.96) 100%)',
        border: '1px solid rgba(20,184,166,0.12)',
        boxShadow: '0 0 40px rgba(20,184,166,0.06), 0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Subtle top gradient accent */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(20,184,166,0.5), transparent)' }}
      />

      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Greeting */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[10px] font-mono font-bold uppercase tracking-widest"
                style={{ color: 'rgba(20,184,166,0.7)' }}
              >
                Selamat datang kembali
              </span>
              <span
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                style={{
                  background: 'rgba(20,184,166,0.1)',
                  border: '1px solid rgba(20,184,166,0.2)',
                  color: '#5eead4',
                }}
              >
                {userName}
              </span>
            </div>

            {/* Body */}
            <p className="text-xs leading-relaxed max-w-3xl" style={{ color: 'rgba(203,213,225,0.7)' }}>
              Masukkan saham ke <strong className="text-slate-200">Watchlist</strong>, hubungkan{' '}
              <strong className="text-slate-200">Telegram</strong>, dan SIBA akan memeriksa data resmi
              Sectors API tiap hari bursa — notifikasi dikirim hanya saat ada pola penting.
            </p>

            {/* Feature chips */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {FEATURES.map(f => (
                <div
                  key={f.text}
                  className="flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-full"
                  style={{
                    background: 'rgba(20,184,166,0.07)',
                    border: '1px solid rgba(20,184,166,0.15)',
                    color: 'rgba(94,234,212,0.8)',
                  }}
                >
                  {f.icon}
                  {f.text}
                </div>
              ))}
            </div>
          </div>

          {/* Close */}
          <button
            onClick={() => setIsVisible(false)}
            className="flex-shrink-0 p-1 rounded-lg transition-colors duration-100"
            style={{ color: 'rgba(148,163,184,0.4)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(148,163,184,0.9)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(148,163,184,0.4)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            aria-label="Tutup banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
