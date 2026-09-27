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

  const botUsername = (import.meta as any).env?.VITE_TELEGRAM_BOT_USERNAME || 'SIBANotbot';
  const fullCommand = `/start ${token}`;
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setBotStatus('checking');
    checkBotHealth().then((h) => setBotStatus(h.online ? 'online' : 'offline'));
  }, [isOpen]);

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

  const handleStartPairing = async () => {
    setErrorMsg(null);
    setPairingState('registering');

    if (token && token !== user.pairingToken) {
      useAuthStore.getState().updateUser({ ...user, pairingToken: token });
    }

    const ok = await registerPairingToken(token, user.id, user.name, watchlist);
    if (!ok) {
      setErrorMsg('Bot server tidak dapat dijangkau. Pastikan bot sudah berjalan (cd bot && python main.py).');
      setPairingState('error');
      return;
    }

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

  const BotOfflineBanner = () => (
    <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs">
      <WifiOff className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
      <div className="text-rose-300 space-y-1">
        <p className="font-bold">Bot server tidak berjalan.</p>
        <p className="text-[11px] opacity-80">Jalankan <code className="font-mono bg-black/30 px-1 rounded">npm run dev:all</code> untuk menyalakan bot.</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center font-sans">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-secondary border border-border shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden mx-4">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-secondary/30 relative">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Send className="w-4 h-4 -ml-0.5 mt-0.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-main">Konfigurasi Bot Telegram</h2>
              <p className="text-[10px] text-text-muted">Hubungkan SIBA ke akun Telegram Anda</p>
            </div>
          </div>
          <div className="flex items-center">
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border flex items-center space-x-1 ${
              botStatus === 'online' ? 'bg-accent/10 text-accent border-accent/30' :
              botStatus === 'checking' ? 'bg-bg text-text-muted border-border' :
              'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}>
              {botStatus === 'online' ? <CheckCircle className="w-3 h-3" /> :
               botStatus === 'checking' ? <Loader2 className="w-3 h-3 animate-spin" /> :
               <WifiOff className="w-3 h-3" />}
              <span>
                {botStatus === 'online' ? 'Bot online' :
                 botStatus === 'checking' ? 'Mengecek bot...' :
                                          'Bot offline'}
              </span>
            </span>
            <button onClick={onClose} className="ml-2 p-2 rounded-xl text-text-muted hover:text-white hover:bg-bg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {user.isTelegramLinked ? (
            <div className="p-4 rounded-xl bg-accent/10 border border-accent/30 space-y-3">
              <div className="flex items-center space-x-2 text-accent font-bold text-xs">
                <CheckCircle className="w-4 h-4" />
                <span>Telegram Terhubung</span>
              </div>
              <p className="text-xs text-text/80 leading-relaxed">
                Akun Telegram <strong className="text-white font-mono">{user.telegramUsername}</strong> (Chat ID: <span className="font-mono text-primary">{user.telegramChatId}</span>) telah dipairing secara permanen ke akun ini. Setiap pembaruan kasus pada watchlist Anda otomatis dikirimkan ke chat tersebut.
              </p>
              <div className="pt-2 border-t border-accent/20 flex items-center justify-between">
                <span className="text-[10px] text-text/50">Status: Aktif</span>
                <button onClick={onUnlink} className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors">
                  Putuskan Sambungan
                </button>
              </div>
            </div>
          ) : pairingState === 'linked' ? (
            <div className="py-8 flex flex-col items-center space-y-3 text-center">
              <CheckCircle className="w-10 h-10 text-accent" />
              <p className="text-sm font-bold text-white">Berhasil terhubung!</p>
              <p className="text-xs text-text-muted">Alert Telegram aktif untuk watchlist Anda.</p>
            </div>
          ) : (
            <>
              {botStatus === 'offline' && <BotOfflineBanner />}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-text/80">Kode Pairing Kriptografis Unik (24+ Karakter):</label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 px-3 py-2.5 bg-bg border border-border rounded-xl font-mono text-xs text-accent font-bold truncate select-all">
                    {fullCommand}
                  </div>
                  <button onClick={handleCopy} className="px-3.5 py-2.5 bg-accent hover:bg-accent text-bg rounded-xl text-xs font-bold border border-accent transition-colors flex items-center space-x-1.5 flex-shrink-0 cursor-pointer">
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Tersalin!' : 'Salin'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-text/50">Token acak dibuat dengan entropi tinggi dan hanya valid untuk akun Anda.</p>
              </div>

              <div className="space-y-2.5 pt-1 text-xs">
                <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-bg border border-border">
                  <span className="w-5 h-5 rounded-lg bg-accent text-bg border border-accent flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</span>
                  <div className="text-text/80 leading-relaxed">Buka Telegram dan cari bot resmi <strong className="text-bg bg-accent px-1.5 py-0.5 rounded border border-accent font-mono">@{botUsername}</strong>.</div>
                </div>
                <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-bg border border-border">
                  <span className="w-5 h-5 rounded-lg bg-accent text-bg border border-accent flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</span>
                  <div className="text-text/80 leading-relaxed">Kirim perintah <strong className="text-bg bg-accent px-1.5 py-0.5 rounded border border-accent font-mono">/start &lt;token&gt;</strong> yang sudah Anda salin di atas.</div>
                </div>
                <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-bg border border-border">
                  <span className="w-5 h-5 rounded-lg bg-accent text-bg border border-accent flex items-center justify-center text-[10px] font-bold flex-shrink-0">3</span>
                  <div className="text-text/80 leading-relaxed">Sistem otomatis mengunci Chat ID Anda secara <strong className="text-white">permanen</strong> ke akun ini.</div>
                </div>
              </div>

              {pairingState === 'error' && errorMsg && (
                <div className="flex items-start space-x-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="pt-2 border-t border-border">
                {pairingState === 'waiting' ? (
                  <div className="w-full py-3 flex items-center justify-center space-x-2 text-xs text-text-muted bg-bg rounded-xl border border-border">
                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    <span>Menunggu Anda mengirim <span className="font-mono text-accent">/start</span> di Telegram…</span>
                  </div>
                ) : (
                  <button onClick={handleStartPairing} disabled={botStatus === 'offline' || pairingState === 'registering'} className="w-full py-3 px-4 bg-accent hover:bg-accent text-bg disabled:bg-bg disabled:text-text-muted disabled:cursor-not-allowed font-black text-xs rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-accent/20 cursor-pointer">
                    {pairingState === 'registering' ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Mendaftarkan token…</span></> : <><Send className="w-4 h-4 stroke-[2.5]" /><span>Mulai Pairing Otomatis</span></>}
                  </button>
                )}
              </div>
            </>
          )}

          <div className="flex items-center space-x-2 text-[10px] text-text/40 justify-center pt-1">
            <Shield className="w-3.5 h-3.5 text-accent flex-shrink-0" />
            <span>Token hanya valid untuk akun Anda. Watchlist tidak akan bocor.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
