import React, { useState } from 'react';
import { Send, CheckCircle, Copy, X, Shield, Smartphone, Key, AlertCircle, RefreshCw } from 'lucide-react';
import { UserProfile } from '../../../data/userProfiles.js';
import { generateSecurePairingToken } from '../../../utils/token.js';

interface TelegramConnectModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onLinkSuccess: (chatId: string, username: string) => void;
  onUnlink: () => void;
}

export const TelegramConnectModal: React.FC<TelegramConnectModalProps> = ({
  user,
  isOpen,
  onClose,
  onLinkSuccess,
  onUnlink,
}) => {
  const [copied, setCopied] = useState(false);
  const [token, setToken] = useState(user.pairingToken || generateSecurePairingToken());

  if (!isOpen) return null;

  const botUsername = 'siba_idx_bot';
  const fullCommand = `/start ${token}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSimulateLink = () => {
    const generatedChatId = Math.floor(100000000 + Math.random() * 900000000).toString();
    const generatedUsername = `@${user.name.toLowerCase().replace(/\s+/g, '_')}`;
    onLinkSuccess(generatedChatId, generatedUsername);
  };

  return (
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
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {user.isTelegramLinked ? (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-3">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                <CheckCircle className="w-4 h-4" />
                <span>Telegram Terhubung & Terkunci Permanen</span>
              </div>
              <p className="text-xs text-text/80 leading-relaxed">
                Akun Telegram <strong className="text-white font-mono">{user.telegramUsername}</strong> (Chat ID: <span className="font-mono text-primary">{user.telegramChatId}</span>) telah dipairing secara permanen ke akun ini. Setiap pembaruan kasus pada watchlist Anda otomatis dikirimkan ke chat tersebut.
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
          ) : (
            <>
              {/* Token Display Box */}
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
                    <span>{copied ? 'Tersalin!' : 'Salin Perintah'}</span>
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

              {/* Action */}
              <div className="pt-2 border-t border-border">
                <button
                  onClick={handleSimulateLink}
                  className="w-full py-3 px-4 bg-accent hover:bg-accent text-bg font-black text-xs rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-accent/20"
                >
                  <Send className="w-4 h-4 stroke-[2.5]" />
                  <span>Simulasikan / Konfirmasi Sambungan Bot</span>
                </button>
              </div>
            </>
          )}

          <div className="flex items-center space-x-2 text-[10px] text-text/40 justify-center pt-1">
            <Shield className="w-3.5 h-3.5 text-accent flex-shrink-0" />
            <span>Isolasi Aman: Watchlist pengguna lain tidak akan pernah masuk ke Telegram Anda.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
