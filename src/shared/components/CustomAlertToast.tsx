import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Info,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAlertStore, AlertType, AlertItem } from '../stores/alert.store';

const ALERT_CONFIG: Record<
  AlertType,
  {
    icon: React.ComponentType<{ className?: string }>;
    accentClass: string;
    bgClass: string;
    borderClass: string;
    textClass: string;
    badgeClass: string;
    label: string;
    progressClass: string;
  }
> = {
  warning: {
    icon: AlertTriangle,
    accentClass: 'text-amber-400',
    bgClass: 'bg-[#181308]/95',
    borderClass: 'border-amber-500/35',
    textClass: 'text-amber-200',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    label: 'Peringatan',
    progressClass: 'bg-amber-500',
  },
  error: {
    icon: ShieldAlert,
    accentClass: 'text-rose-400',
    bgClass: 'bg-[#1c0c11]/95',
    borderClass: 'border-rose-500/35',
    textClass: 'text-rose-200',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    label: 'Pelanggaran / Gagal',
    progressClass: 'bg-rose-500',
  },
  success: {
    icon: CheckCircle2,
    accentClass: 'text-emerald-400',
    bgClass: 'bg-[#081711]/95',
    borderClass: 'border-emerald-500/35',
    textClass: 'text-emerald-200',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    label: 'Berhasil',
    progressClass: 'bg-emerald-500',
  },
  info: {
    icon: Info,
    accentClass: 'text-sky-400',
    bgClass: 'bg-[#091522]/95',
    borderClass: 'border-sky-500/35',
    textClass: 'text-sky-200',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    label: 'Informasi',
    progressClass: 'bg-sky-500',
  },
};

export const CustomAlertToast: React.FC = () => {
  const { alerts, removeAlert } = useAlertStore();

  return (
    <div
      aria-live="polite"
      className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-md w-[calc(100vw-2.5rem)] sm:w-96 pointer-events-none font-sans"
    >
      <AnimatePresence>
        {alerts.map((item) => (
          <AlertToastCard key={item.id} item={item} onDismiss={() => removeAlert(item.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const AlertToastCard: React.FC<{ item: AlertItem; onDismiss: () => void }> = ({
  item,
  onDismiss,
}) => {
  const config = ALERT_CONFIG[item.type] || ALERT_CONFIG.info;
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.9 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`relative pointer-events-auto rounded-2xl border ${config.borderClass} ${config.bgClass} shadow-[0_12px_36px_rgba(0,0,0,0.6)] backdrop-blur-xl overflow-hidden p-4 flex flex-col gap-2.5`}
    >
      {/* Top Accent Strip */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${config.borderClass} bg-white/5 shadow-inner`}
          >
            <Icon className={`w-5 h-5 ${config.accentClass}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${config.badgeClass}`}
              >
                {config.label}
              </span>
            </div>
            <h4 className="text-xs font-bold text-white tracking-wide truncate">
              {item.title}
            </h4>
            <p className={`text-xs ${config.textClass}/90 mt-1 leading-relaxed`}>
              {item.message}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0 cursor-pointer"
          aria-label="Tutup notifikasi"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action Button if specified */}
      {item.actionLabel && (
        <div className="pt-1 flex items-center justify-end">
          <button
            type="button"
            onClick={() => {
              if (item.onAction) item.onAction();
              onDismiss();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            {item.actionLabel}
            <ExternalLink className="w-3 h-3 text-white/70" />
          </button>
        </div>
      )}

      {/* Timeout Progress Bar */}
      {item.durationMs && item.durationMs > 0 && (
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: item.durationMs / 1000, ease: 'linear' }}
          className={`absolute bottom-0 left-0 h-0.5 ${config.progressClass} opacity-60`}
        />
      )}
    </motion.div>
  );
};
