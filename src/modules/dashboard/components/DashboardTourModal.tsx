/**
 * DashboardTourModal — Interactive Onboarding Tour with Dynamic Element Spotlight
 * Highlights target elements cut through dark overlay + attached tooltip card with Next / Prev / Skip actions.
 */

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, X, Sparkles, CheckCircle2, Target } from 'lucide-react';

interface TourStep {
  targetId: string;
  title: string;
  description: string;
  actionHint: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-watchlist-manager',
    title: '1. Cari & Tambahkan Saham ke Watchlist',
    description: 'Langkah pertama: Gunakan kolom pencarian di panel ini untuk menemukan saham IDX pilihan Anda atau pasang preset 6 sektor langsung.',
    actionHint: 'Target: Panel Watchlist & Pencarian Emiten',
  },
  {
    targetId: 'tour-header-actions',
    title: '2. Pipeline Evaluasi & Sectors API',
    description: 'Di modul ini Anda dapat memantau status Sectors API v2 dan tombol kontrol workflow untuk mengevaluasi data transaksi bursa.',
    actionHint: 'Target: Sectors API Core Pipeline Badge',
  },
  {
    targetId: 'tour-automation-kpis',
    title: '3. Status Otomasi 16:30 WIB',
    description: 'Lihat ringkasan otomatisasi harian, total saham dipantau, dan jumlah audit run deterministik tanpa LLM.',
    actionHint: 'Target: Automation Overview KPI Cards',
  },
  {
    targetId: 'tour-telegram-logs',
    title: '4. Riwayat Log Entri Telegram',
    description: 'Semua pesan rekap watchlist dan alert anomali bursa yang terkirim ke bot Telegram diarsipkan di log entri ini.',
    actionHint: 'Target: Log Entri Telegram Sent',
  },
  {
    targetId: 'tour-telegram-bot-cta',
    title: '5. Hubungkan Telegram Bot SIBA',
    description: 'Klik tombol bot melayang ini kapan saja untuk menghubungkan Chat ID Telegram Anda atau memverifikasi status bot.',
    actionHint: 'Target: Floating Telegram Bot CTA',
  },
];

interface DashboardTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const DashboardTourModal: React.FC<DashboardTourModalProps> = ({ isOpen, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);

  const currentStep = TOUR_STEPS[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  // Measure and scroll target into view
  const updateSpotlight = () => {
    if (!isOpen) return;
    const el = document.getElementById(currentStep.targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Small timeout to get accurate rect after scroll finishes
      setTimeout(() => {
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      }, 100);
    } else {
      setTargetRect(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Lock scroll on body to prevent manual user scroll background
      document.body.style.overflow = 'hidden';

      const timer = setTimeout(updateSpotlight, 150);
      window.addEventListener('resize', updateSpotlight);
      return () => {
        document.body.style.overflow = '';
        clearTimeout(timer);
        window.removeEventListener('resize', updateSpotlight);
      };
    }
  }, [isOpen, currentStepIndex]);

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
          className="fixed rounded-2xl pointer-events-none transition-all duration-300 ease-out z-40 border-2 border-[hsl(141,100%,50%)]"
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
        <div className="w-full max-w-sm bg-[#130720] border-2 border-[hsl(288,100%,70%)]/70 rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.95)] p-4 space-y-3.5 pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
          {/* Card Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-[hsl(301,60%,25%)]">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[hsl(301,100%,18%)] text-[hsl(141,100%,50%)] border border-[hsl(288,100%,70%)]/40 flex items-center justify-center font-bold flex-shrink-0 shadow-inner">
                <Target className="w-4 h-4 text-[hsl(141,100%,50%)]" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-black text-[hsl(141,100%,50%)] uppercase tracking-wider block">
                  TUR INTERAKTIF ({currentStepIndex + 1}/{TOUR_STEPS.length})
                </span>
                <h3 className="text-sm font-extrabold text-white leading-tight">
                  {currentStep.title}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-[hsl(301,100%,20%)] transition-colors cursor-pointer"
              title="Selesai / Lewati Tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Description Box - Compact Solid Dark */}
          <div className="p-3 rounded-xl bg-[#090312] border border-[hsl(301,60%,30%)] text-xs text-white/95 leading-relaxed space-y-2">
            <p className="text-xs text-slate-200 font-medium">{currentStep.description}</p>
            <div className="text-[10px] font-mono font-semibold text-[hsl(288,100%,75%)] bg-[hsl(301,100%,15%)]/60 px-2.5 py-1.5 rounded-lg border border-[hsl(288,100%,70%)]/20 flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(141,100%,50%)] flex-shrink-0" />
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
                    ? 'w-6 bg-[hsl(141,100%,50%)] shadow-[0_0_8px_hsl(141,100%,50%)]'
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={onClose}
              className="text-[11px] font-bold text-white/60 hover:text-white px-2 py-1 rounded-lg hover:bg-[hsl(301,100%,18%)] transition-colors cursor-pointer"
            >
              Lewati (Skip)
            </button>

            <div className="flex items-center space-x-2">
              {!isFirst && (
                <button
                  onClick={handlePrev}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[hsl(301,100%,18%)] hover:bg-[hsl(301,100%,25%)] border border-[hsl(301,60%,35%)] transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Sebelumnya</span>
                </button>
              )}

              <button
                onClick={handleNext}
                className="flex items-center space-x-1 px-4 py-1.5 rounded-xl text-xs font-black text-[hsl(279,100%,3%)] bg-[hsl(141,100%,50%)] hover:bg-[hsl(141,100%,45%)] transition-all cursor-pointer shadow-md shadow-[hsl(141,100%,50%)]/30 glow-blue"
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
