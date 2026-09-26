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

  // Measure and highlight active step's target element
  const updateSpotlight = () => {
    if (!isOpen) return;
    const el = document.getElementById(currentStep.targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });
    } else {
      setTargetRect(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      const timer = setTimeout(updateSpotlight, 150);
      window.addEventListener('resize', updateSpotlight);
      window.addEventListener('scroll', updateSpotlight);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateSpotlight);
        window.removeEventListener('scroll', updateSpotlight);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(updateSpotlight, 150);
      return () => clearTimeout(timer);
    }
  }, [currentStepIndex, isOpen]);

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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Dark overlay backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300" />

      {/* Spotlight cutout border glow over highlighted component */}
      {targetRect && (
        <div
          className="absolute z-50 pointer-events-none rounded-2xl border-4 border-primary shadow-[0_0_50px_rgba(230,102,255,0.6)] animate-pulse transition-all duration-300"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}

      {/* Interactive Tooltip Card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-md bg-surface border-2 border-primary rounded-2xl shadow-2xl p-6 space-y-4 pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
          {/* Card Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-secondary text-primary border border-primary/30 flex items-center justify-center font-bold flex-shrink-0">
                <Target className="w-4 h-4 text-accent" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider">
                  Tur Interaktif ({currentStepIndex + 1}/{TOUR_STEPS.length})
                </span>
                <h3 className="text-sm font-bold text-text">
                  {currentStep.title}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-text/60 hover:text-text hover:bg-secondary transition-colors cursor-pointer"
              title="Selesai / Lewati Tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Description */}
          <div className="p-4 rounded-xl bg-background border border-border/80 text-xs text-text/90 leading-relaxed space-y-2">
            <p>{currentStep.description}</p>
            <div className="text-[11px] font-mono text-primary flex items-center space-x-1.5 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <span>{currentStep.actionHint}</span>
            </div>
          </div>

          {/* Step dots */}
          <div className="flex items-center justify-center space-x-1.5 pt-1">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? 'w-6 bg-accent'
                    : 'w-2 bg-border hover:bg-text/40'
                }`}
              />
            ))}
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={onClose}
              className="text-xs font-semibold text-text/60 hover:text-text px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
            >
              Lewati (Skip)
            </button>

            <div className="flex items-center space-x-2">
              {!isFirst && (
                <button
                  onClick={handlePrev}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-text bg-secondary hover:bg-secondary/80 border border-border transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Sebelumnya</span>
                </button>
              )}

              <button
                onClick={handleNext}
                className="flex items-center space-x-1 px-4 py-1.5 rounded-lg text-xs font-bold text-background bg-accent hover:opacity-90 transition-opacity cursor-pointer shadow-md"
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
