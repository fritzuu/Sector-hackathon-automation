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
<<<<<<< HEAD
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(9,0,12,0.88)', backdropFilter: 'blur(18px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden my-6"
        style={{
          backgroundColor: 'var(--color-secondary)',
          borderColor: 'var(--color-border)',
          borderRadius: 20,
          boxShadow: '0 32px 80px rgba(0,0,0,0.85)',
        }}
      >
        {/* Top Accent Line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          backgroundColor: 'var(--color-secondary)',
          opacity: 0.9,
        }} />
=======
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0d1424] border border-slate-700 rounded-xl shadow-2xl overflow-hidden my-6">
>>>>>>> integration/Auth-Bot

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-secondary/30">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-bg font-black flex-shrink-0 shadow-md shadow-primary/30">
              <Send className="w-4 h-4 -translate-x-0.5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-wide">
                Integrasi Telegram Bot SIBA
              </h3>
<<<<<<< HEAD
              <p className="text-[11px] text-text/60">
                Pemberitahuan otomatis terisolasi untuk akun <strong className="text-white">{user.name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
=======
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
>>>>>>> integration/Auth-Bot
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">

          {/* Already linked */}
          {user.isTelegramLinked ? (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-3">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                <CheckCircle className="w-4 h-4" />
                <span>Telegram Terhubung</span>
              </div>
<<<<<<< HEAD
              <p className="text-xs text-text/80 leading-relaxed">
                Akun Telegram <strong className="text-white font-mono">{user.telegramUsername}</strong> (Chat ID: <span className="font-mono text-primary">{user.telegramChatId}</span>) telah dipairing secara permanen ke akun ini. Setiap pembaruan kasus pada watchlist Anda otomatis dikirimkan ke chat tersebut.
=======
              <p className="text-xs text-slate-300 leading-relaxed">
                Akun <strong className="text-white font-mono">{user.telegramUsername}</strong>
                {' '}(Chat ID: <span className="font-mono text-teal-300">{user.telegramChatId}</span>)
                {' '}terpasang ke akun ini. Alert otomatis akan dikirim ke chat tersebut.
>>>>>>> integration/Auth-Bot
              </p>
              <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                <span className="text-[10px] text-text/50">Status: Aktif</span>
                <button
                  onClick={onUnlink}
                  className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold transition-colors"
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
                <label className="block text-xs font-semibold text-text/80">
                  Kode Pairing Kriptografis Unik (24+ Karakter):
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 px-3 py-2.5 bg-bg border border-border rounded-xl font-mono text-xs text-accent font-bold truncate select-all">
                    {fullCommand}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="px-3.5 py-2.5 bg-accent hover:bg-accent text-bg rounded-xl text-xs font-bold border border-accent transition-colors flex items-center space-x-1.5 flex-shrink-0 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Tersalin!' : 'Salin'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-text/50">
                  Token acak dibuat dengan entropi tinggi dan hanya valid untuk akun Anda.
                </p>
              </div>

              {/* Step by step */}
              <div className="space-y-2.5 pt-1 text-xs">
                <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-bg border border-border">
                  <span className="w-5 h-5 rounded-lg bg-accent text-bg border border-accent flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    1
                  </span>
                  <div className="text-text/80 leading-relaxed">
                    Buka Telegram dan cari bot resmi <strong className="text-bg bg-accent px-1.5 py-0.5 rounded border border-accent font-mono">@{botUsername}</strong>.
                  </div>
                </div>

                <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-bg border border-border">
                  <span className="w-5 h-5 rounded-lg bg-accent text-bg border border-accent flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    2
                  </span>
                  <div className="text-text/80 leading-relaxed">
                    Kirim perintah <strong className="text-bg bg-accent px-1.5 py-0.5 rounded border border-accent font-mono">/start &lt;token&gt;</strong> yang sudah Anda salin di atas.
                  </div>
                </div>

                <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-bg border border-border">
                  <span className="w-5 h-5 rounded-lg bg-accent text-bg border border-accent flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    3
                  </span>
                  <div className="text-text/80 leading-relaxed">
                    Sistem otomatis mengunci Chat ID Anda secara <strong className="text-white">permanen</strong> ke akun ini sampai Anda memutuskan sambungan.
                  </div>
                </div>
              </div>

              {/* Error */}
              {pairingState === 'error' && errorMsg && (
                <div className="flex items-start space-x-2 p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action */}
              <div className="pt-2 border-t border-border">
                {pairingState === 'waiting' ? (
                  <div className="w-full py-3 flex items-center justify-center space-x-2 text-xs text-text-muted bg-bg rounded-xl border border-border">
                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    <span>Menunggu Anda mengirim <span className="font-mono text-accent">/start</span> di Telegram…</span>
                  </div>
                ) : (
                  <button
                    onClick={handleStartPairing}
                    disabled={botStatus === 'offline' || pairingState === 'registering'}
                    className="w-full py-3 px-4 bg-accent hover:bg-accent text-bg disabled:bg-bg disabled:text-text-muted disabled:cursor-not-allowed font-black text-xs rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-accent/20 cursor-pointer"
                  >
                    {pairingState === 'registering' ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /><span>Mendaftarkan token…</span></>
                    ) : (
                      <><Send className="w-4 h-4 stroke-[2.5]" /><span>Mulai Pairing Otomatis</span></>
                    )}
                  </button>
                )}
              </div>
            </>
          )}

          <div className="flex items-center space-x-2 text-[10px] text-text/40 justify-center pt-1">
            <Shield className="w-3.5 h-3.5 text-accent flex-shrink-0" />
            <span>Token hanya valid untuk akun Anda. Watchlist pengguna lain tidak bocor ke Telegram Anda.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
