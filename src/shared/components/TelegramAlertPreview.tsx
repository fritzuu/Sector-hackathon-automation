import React from 'react';
import { Send, X, ExternalLink } from 'lucide-react';
import { UserProfile } from '../../data/userProfiles.js';

interface TelegramAlertPreviewProps {
  user: UserProfile;
  message: string | null;
  onClose: () => void;
}

export const TelegramAlertPreview: React.FC<TelegramAlertPreviewProps> = ({
  user,
  message,
  onClose,
}) => {
  if (!message || !user.isTelegramLinked) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-[#17212b] border border-sky-500/40 rounded-2xl shadow-2xl overflow-hidden animate-bounce-short">
      {/* Telegram Message Header */}
      <div className="bg-[#242f3d] px-4 py-2.5 flex items-center justify-between border-b border-slate-700/50">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center text-white">
            <Send className="w-3.5 h-3.5 -translate-x-0.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white">SIBA Bot Official</span>
            <span className="text-[10px] text-sky-300 block">
              Terkirim ke: {user.telegramUsername} (Chat ID: {user.telegramChatId})
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Telegram Message Content */}
      <div className="p-4 text-xs text-slate-100 font-sans space-y-2 max-h-60 overflow-y-auto">
        <div className="bg-[#1f2c38] p-3 rounded-xl border border-slate-700/60 whitespace-pre-line leading-relaxed">
          {message}
        </div>
      </div>
    </div>
  );
};
