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
                Pemberitahuan otomatis terisolasi untuk akun <strong className="text-slate-200">{user.name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {user.isTelegramLinked ? (
            <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-3">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                <CheckCircle className="w-4 h-4" />
                <span>Telegram Terhubung & Terkunci Permanen</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Akun Telegram <strong className="text-white font-mono">{user.telegramUsername}</strong> (Chat ID: <span className="font-mono text-teal-300">{user.telegramChatId}</span>) telah dipairing secara permanen ke akun ini. Setiap pembaruan kasus pada watchlist Anda otomatis dikirimkan ke chat tersebut.
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
          ) : (
            <>
              {/* Token Display Box */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Kode Pairing Kriptografis Unik (24+ Karakter):
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
                    <span>{copied ? 'Tersalin!' : 'Salin Perintah'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Token acak dibuat dengan entropi tinggi dan hanya valid untuk akun Anda.
                </p>
              </div>

              {/* Step by step */}
              <div className="space-y-2.5 pt-1 text-xs">
                <div className="flex items-start space-x-2.5 p-2.5 rounded bg-slate-900/80 border border-slate-800">
                  <span className="w-5 h-5 rounded bg-teal-500/20 text-teal-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    1
                  </span>
                  <div className="text-slate-300">
                    Buka Telegram dan cari bot resmi <strong className="text-sky-400 font-mono">@{botUsername}</strong>.
                  </div>
                </div>

                <div className="flex items-start space-x-2.5 p-2.5 rounded bg-slate-900/80 border border-slate-800">
                  <span className="w-5 h-5 rounded bg-teal-500/20 text-teal-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    2
                  </span>
                  <div className="text-slate-300">
                    Kirim perintah <strong className="text-teal-300 font-mono">/start &lt;token&gt;</strong> yang sudah Anda salin di atas.
                  </div>
                </div>

                <div className="flex items-start space-x-2.5 p-2.5 rounded bg-slate-900/80 border border-slate-800">
                  <span className="w-5 h-5 rounded bg-teal-500/20 text-teal-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    3
                  </span>
                  <div className="text-slate-300">
                    Sistem otomatis mengunci Chat ID Anda secara <strong>permanen</strong> ke akun ini sampai Anda memutuskan sambungan.
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={handleSimulateLink}
                  className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Simulasikan / Konfirmasi Sambungan Bot</span>
                </button>
              </div>
            </>
          )}

          <div className="flex items-center space-x-2 text-[10px] text-slate-500 justify-center">
            <Shield className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
            <span>Isolasi Aman: Watchlist pengguna lain tidak akan pernah masuk ke Telegram Anda.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
