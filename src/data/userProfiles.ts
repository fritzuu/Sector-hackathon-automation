export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'Investor Ritel' | 'Swing Trader' | 'Wealth Analyst';
  telegramChatId: string | null;
  telegramUsername: string | null;
  isTelegramLinked: boolean;
  pairingToken: string;
  defaultWatchlist: string[];
}
