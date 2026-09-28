/**
 * DashboardTourModal — Interactive Onboarding Tour with Dynamic Element Spotlight
 * Highlights target elements cut through dark overlay + attached tooltip card with Next / Prev / Skip actions.
 */

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, X, Sparkles, CheckCircle2, Target } from 'lucide-react';

interface TourStep {
  targetId: string;
  path: DashboardPath;
  title: string;
  description: string;
  actionHint: string;
}

export type DashboardPath = '/dashboard' | '/dashboard/watchlist' | '/dashboard/cases' | '/dashboard/audit';

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-sidebar-overview',
    path: '/dashboard',
    title: '1. Overview',
    description: 'Buka halaman awal untuk melihat ringkasan otomatisasi, jumlah saham dalam pantauan, kasus aktif, dan pemeriksaan terakhir.',
    actionHint: 'Menu sidebar: Overview',
  },
  {
    targetId: 'tour-overview-content',
    path: '/dashboard',
    title: '2. Ringkasan Overview',
    description: 'Bagian ini merangkum jumlah saham pantauan, kasus aktif, waktu pemeriksaan terakhir, dan status scheduler.',
    actionHint: 'Konten Overview · Ringkasan otomatisasi',
  },
  {
    targetId: 'tour-sidebar-watchlist',
    path: '/dashboard/watchlist',
    title: '3. Watchlist',
    description: 'Menu ini membuka pengelolaan saham yang Anda pantau.',
    actionHint: 'Menu sidebar: Watchlist',
  },
  {
    targetId: 'tour-watchlist-content',
    path: '/dashboard/watchlist',
    title: '4. Kelola Watchlist',
    description: 'Cari dan tambahkan emiten, pilih preset, buka detail saham, hapus saham dari daftar, atau kirim rekap ke Telegram.',
    actionHint: 'Konten Watchlist · Pencarian dan daftar saham',
  },
  {
    targetId: 'tour-sidebar-cases',
    path: '/dashboard/cases',
    title: '5. Kasus Aktif',
    description: 'Menu ini membuka daftar kasus yang dibuat dari hasil evaluasi saham.',
    actionHint: 'Menu sidebar: Kasus Aktif',
  },
  {
    targetId: 'tour-cases-content',
    path: '/dashboard/cases',
    title: '6. Tinjau Kasus',
    description: 'Lihat status dan aturan pemicu kasus. Pilih satu kasus untuk membuka detail serta timeline perubahannya.',
    actionHint: 'Konten Kasus Aktif · Pilih kasus untuk detail',
  },
  {
    targetId: 'tour-sidebar-audit',
    path: '/dashboard/audit',
    title: '7. Audit Trail',
    description: 'Menu ini membuka riwayat eksekusi workflow.',
    actionHint: 'Menu sidebar: Audit Trail',
  },
  {
    targetId: 'tour-audit-content',
    path: '/dashboard/audit',
    title: '8. Riwayat Eksekusi',
    description: 'Tabel ini mencatat waktu run, jumlah ticker, trigger aktif, durasi, dan status hasil evaluasi.',
    actionHint: 'Konten Audit Trail · Tabel riwayat run',
  },
  {
    targetId: 'tour-header-reset',
    path: '/dashboard',
    title: '9. Reset Sesi',
    description: 'Reset menghapus data replay sementara agar workflow dapat diuji kembali dari kondisi awal.',
    actionHint: 'Header dashboard · Reset',
  },
  {
    targetId: 'tour-header-run',
    path: '/dashboard',
    title: '10. Jalankan Run',
    description: 'Jalankan evaluasi watchlist secara langsung. Tombol nonaktif bila tidak ada saham yang dipantau atau proses sedang berjalan.',
    actionHint: 'Header dashboard · Jalankan Run',
  },
  {
    targetId: 'tour-header-online',
    path: '/dashboard',
    title: '11. Sistem Online',
    description: 'Indikator ini menunjukkan status sistem pada dashboard.',
    actionHint: 'Header dashboard · Sistem Online',
  },
  {
    targetId: 'tour-user-info',
    path: '/dashboard',
    title: '12. Info Pengguna',
    description: 'Dari bagian ini Anda dapat melihat identitas dan peran akun, mengulangi tur, atau keluar.',
    actionHint: 'Overview · Info Pengguna di bagian bawah sidebar',
  },
];

interface DashboardTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: DashboardPath) => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const DashboardTourModal: React.FC<DashboardTourModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);

  const currentStep = TOUR_STEPS[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  useEffect(() => {
    if (!isOpen) {
      setTargetRect(null);
      return;
    }

    document.body.style.overflow = 'hidden';
    setTargetRect(null);
    onNavigate(currentStep.path);

    let frameId = 0;
    let attempts = 0;
    const measureTarget = () => {
      const target = document.getElementById(currentStep.targetId);
      if (!target) {
        attempts += 1;
        if (attempts < 90) frameId = window.requestAnimationFrame(measureTarget);
        return;
      }

      target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      frameId = window.requestAnimationFrame(() => {
        const rect = target.getBoundingClientRect();
        setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
      });
    };

    frameId = window.requestAnimationFrame(measureTarget);
    const updateTargetRect = () => {
      const target = document.getElementById(currentStep.targetId);
      if (!target) return;
      const rect = target.getBoundingClientRect();
      setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    };
    window.addEventListener('resize', updateTargetRect);

    return () => {
      document.body.style.overflow = '';
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', updateTargetRect);
    };
  }, [isOpen, currentStep, onNavigate]);

  useEffect(() => {
    if (!isOpen) setCurrentStepIndex(0);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const pad = 10;

  // Determine smart tooltip card placement (avoid overlapping target)
  // If target is in lower half of screen, place tooltip near top, vice versa
  const isTargetInBottomHalf = targetRect ? targetRect.top > window.innerHeight / 2 : false;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden select-none pointer-events-auto touch-none"
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      {/* Full screen invisible click-shield backdrop to block clicks behind tour */}
      <div className="fixed inset-0 z-30 pointer-events-auto cursor-default" onClick={(e) => e.stopPropagation()} />

      {/* Dynamic spotlight cutout overlay - accurately highlights active step target */}
      {targetRect ? (
        <div
          className="fixed rounded-2xl pointer-events-none transition-all duration-300 ease-out z-40 border-2 border-accent"
          style={{
            top: targetRect.top - pad,
            left: targetRect.left - pad,
            width: targetRect.width + (pad * 2),
            height: targetRect.height + (pad * 2),
            boxShadow: `0 0 0 9999px rgba(4, 2, 8, 0.82), 0 0 30px 6px rgba(0, 255, 136, 0.5)`,
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-[#040208]/85 backdrop-blur-sm transition-opacity duration-300 z-40" />
      )}

      {/* Floating Compact Tooltip Card - Non-overlapping Smart Position */}
      <div
        className={`fixed inset-x-0 z-50 flex justify-center p-4 pointer-events-none transition-all duration-300 ${
          isTargetInBottomHalf ? 'top-8 items-start' : 'bottom-8 items-end'
        }`}
      >
        <div className="w-full max-w-sm bg-[#130720] border-2 border-border rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.95)] p-4 space-y-3.5 pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
          {/* Card Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-border">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-secondary text-accent border border-border flex items-center justify-center font-bold flex-shrink-0 shadow-inner">
                <Target className="w-4 h-4 text-accent" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-black text-accent uppercase tracking-wider block">
                  TUR INTERAKTIF ({currentStepIndex + 1}/{TOUR_STEPS.length})
                </span>
                <h3 className="text-sm font-extrabold text-white leading-tight">
                  {currentStep.title}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-secondary transition-colors cursor-pointer"
              title="Selesai / Lewati Tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Description Box - Compact Solid Dark */}
          <div className="p-3 rounded-xl bg-bg border border-border text-xs text-white/95 leading-relaxed space-y-2">
            <p className="text-xs text-slate-200 font-medium">{currentStep.description}</p>
            <div className="text-[10px] font-mono font-semibold text-primary bg-secondary px-2.5 py-1.5 rounded-lg border border-border flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <span className="truncate">{currentStep.actionHint}</span>
            </div>
          </div>

          {/* Step dots */}
          <div className="flex items-center justify-center space-x-1.5 pt-0.5">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? 'w-6 bg-accent shadow-[0_0_8px_hsl(141,100%,50%)]'
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={onClose}
              className="text-[11px] font-bold text-white/60 hover:text-white px-2 py-1 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
            >
              Lewati (Skip)
            </button>

            <div className="flex items-center space-x-2">
              {!isFirst && (
                <button
                  onClick={handlePrev}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-secondary hover:bg-secondary border border-border transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Sebelumnya</span>
                </button>
              )}

              <button
                onClick={handleNext}
                className="flex items-center space-x-1 px-4 py-1.5 rounded-xl text-xs font-black text-bg bg-accent hover:bg-accent transition-all cursor-pointer shadow-md shadow-primary/20 glow-blue"
              >
                <span>{isLast ? 'Selesai Tur' : 'Lanjut (Next)'}</span>
                {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
