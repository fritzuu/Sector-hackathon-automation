import React, { useState, useEffect, useRef } from 'react';
import { Send, CheckCircle, Copy, X, Shield, Loader2, AlertCircle, WifiOff } from 'lucide-react';
import { UserProfile } from '../../../data/userProfiles.js';
import { generateSecurePairingToken } from '../../../utils/token.js';
import { useAuthStore } from '../stores/auth.store';
import {
  registerPairingToken,
  checkPairingStatus,
  checkBotHealth,
} from '../../../services/telegramService.js';

interface TelegramConnectModalProps {
  user: UserProfile;
  watchlist: string[];
  isOpen: boolean;
  onClose: () => void;
  onLinkSuccess: (chatId: string, username: string) => void;
  onUnlink: () => void;
}

type BotStatus = 'checking' | 'online' | 'offline';
type PairingState = 'idle' | 'registering' | 'waiting' | 'linked' | 'error';

export const TelegramConnectModal: React.FC<TelegramConnectModalProps> = ({
  user,
  watchlist,
  isOpen,
  onClose,
  onLinkSuccess,
  onUnlink,
}) => {
  const [copied, setCopied] = useState(false);
  const [token] = useState(user.pairingToken || generateSecurePairingToken());
  const [botStatus, setBotStatus] = useState<BotStatus>('checking');
  const [pairingState, setPairingState] = useState<PairingState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Read bot username from env — set VITE_TELEGRAM_BOT_USERNAME in .env
  const botUsername =
    (import.meta as any).env?.VITE_TELEGRAM_BOT_USERNAME || 'SIBANotbot';

  const fullCommand = `/start ${token}`;

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Check bot server health on open ──────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setBotStatus('checking');
    checkBotHealth().then((h) => setBotStatus(h.online ? 'online' : 'offline'));
  }, [isOpen]);

  // ── Cleanup poll on unmount / close ──────────────────────────────────────
  useEffect(() => {
    if (!isOpen) stopPolling();
    return () => stopPolling();
  }, [isOpen]);

  if (!isOpen) return null;

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  // ── Start pairing flow ────────────────────────────────────────────────────
  const handleStartPairing = async () => {
    setErrorMsg(null);
    setPairingState('registering');

    if (token && token !== user.pairingToken) {
      useAuthStore.getState().updateUser({ ...user, pairingToken: token });
    }

    // 1. Register the token with the bot server
    const ok = await registerPairingToken(token, user.id, user.name, watchlist);
    if (!ok) {
      setErrorMsg('Bot server tidak dapat dijangkau. Pastikan bot sudah berjalan (cd bot && python main.py).');
      setPairingState('error');
      return;
    }

    // 2. Start polling for pairing completion
    setPairingState('waiting');
    pollRef.current = setInterval(async () => {
      const status = await checkPairingStatus(token);
      if (status.linked && status.chatId) {
        stopPolling();
        setPairingState('linked');
        setTimeout(() => {
          onLinkSuccess(status.chatId!, status.username || `@${botUsername}_user`);
        }, 1200);
      }
    }, 3000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fullCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ── Bot server offline notice ─────────────────────────────────────────────
  const BotOfflineBanner = () => (
    <div className="flex items-start space-x-2.5 p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-xs">
      <WifiOff className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
      <div className="text-rose-300 space-y-1">
        <p className="font-bold">Bot server tidak berjalan.</p>
        <p>Jalankan terlebih dahulu di terminal:</p>
        <code className="block px-2 py-1 bg-slate-950 rounded text-teal-300 font-mono text-[11px] select-all">
          cd bot && python main.py
        </code>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0d1424] border border-slate-700 rounded-xl shadow-2xl overflow-hidden my-6">

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
              <Send className="w-4 h-4 -translate-x-0.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Integrasi Telegram Bot SIBA
              </h3>
              <p className="text-[11px] text-slate-400">
                Pemberitahuan otomatis untuk akun <strong className="text-slate-200">{user.name}</strong>
              </p>
            </div>
          </div>

          {/* Bot health indicator */}
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${
              botStatus === 'checking' ? 'bg-amber-400 animate-pulse' :
              botStatus === 'online'   ? 'bg-emerald-400' :
                                         'bg-rose-400'
            }`} />
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              {botStatus === 'checking' ? 'Memeriksa...' :
               botStatus === 'online'   ? 'Bot aktif' :
                                          'Bot offline'}
            </span>
            <button
              onClick={onClose}
              className="ml-2 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">

          {/* Already linked */}
          {user.isTelegramLinked ? (
            <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-3">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                <CheckCircle className="w-4 h-4" />
                <span>Telegram Terhubung</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Akun <strong className="text-white font-mono">{user.telegramUsername}</strong>
                {' '}(Chat ID: <span className="font-mono text-teal-300">{user.telegramChatId}</span>)
                {' '}terpasang ke akun ini. Alert otomatis akan dikirim ke chat tersebut.
              </p>
              <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Status: Aktif</span>
                <button
                  onClick={onUnlink}
                  className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-xs font-semibold transition-colors"
                >
                  Putuskan Sambungan
                </button>
              </div>
            </div>

          ) : pairingState === 'linked' ? (
            /* Just linked — brief success flash before modal closes */
            <div className="py-8 flex flex-col items-center space-y-3 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
              <p className="text-sm font-bold text-white">Berhasil terhubung!</p>
              <p className="text-xs text-slate-400">Alert Telegram aktif untuk watchlist Anda.</p>
            </div>

          ) : (
            <>
              {/* Bot offline warning */}
              {botStatus === 'offline' && <BotOfflineBanner />}

              {/* Token display */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Kode Pairing Unik:
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded font-mono text-xs text-teal-300 truncate select-all">
                    {fullCommand}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold border border-slate-600 transition-colors flex items-center space-x-1.5 flex-shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Tersalin!' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-2 text-xs">
                {[
                  <>Buka Telegram dan cari bot <strong className="text-sky-400 font-mono">@{botUsername}</strong></>,
                  <>Kirim perintah yang sudah disalin: <strong className="text-teal-300 font-mono">/start &lt;token&gt;</strong></>,
                  <>Sistem mengunci Chat ID Anda ke akun ini secara otomatis.</>,
                ].map((step, i) => (
                  <div key={i} className="flex items-start space-x-2.5 p-2.5 rounded bg-slate-900/80 border border-slate-800">
                    <span className="w-5 h-5 rounded bg-teal-500/20 text-teal-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="text-slate-300">{step}</div>
                  </div>
                ))}
              </div>

              {/* Error */}
              {pairingState === 'error' && errorMsg && (
                <div className="flex items-start space-x-2 p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* CTA */}
              <div className="pt-2 border-t border-slate-800">
                {pairingState === 'waiting' ? (
                  <div className="w-full py-2.5 flex items-center justify-center space-x-2 text-xs text-slate-300 bg-slate-900 rounded border border-slate-700">
                    <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                    <span>Menunggu Anda mengirim <span className="font-mono text-teal-300">/start</span> di Telegram…</span>
                  </div>
                ) : (
                  <button
                    onClick={handleStartPairing}
                    disabled={botStatus === 'offline' || pairingState === 'registering'}
                    className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-xs rounded transition-colors flex items-center justify-center space-x-2"
                  >
                    {pairingState === 'registering' ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /><span>Mendaftarkan token…</span></>
                    ) : (
                      <><Send className="w-4 h-4" /><span>Mulai Pairing Otomatis</span></>
                    )}
                  </button>
                )}
              </div>
            </>
          )}

          <div className="flex items-center space-x-2 text-[10px] text-slate-500 justify-center">
            <Shield className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
            <span>Token hanya valid untuk akun Anda. Watchlist pengguna lain tidak bocor ke Telegram Anda.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
