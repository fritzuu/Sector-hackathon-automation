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

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'usr-budi-01',
    name: 'Budi Santoso',
    email: 'budi.santoso@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'Investor Ritel',
    telegramChatId: null,
    telegramUsername: null,
    isTelegramLinked: false,
    pairingToken: 'PAIR_BUDI_891',
    defaultWatchlist: ['BBCA', 'TLKM', 'UNTR'],
  },
  {
    id: 'usr-sarah-02',
    name: 'Sarah Wijaya',
    email: 'sarah.wijaya@outlook.com',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    role: 'Swing Trader',
    telegramChatId: null,
    telegramUsername: null,
    isTelegramLinked: false,
    pairingToken: 'PAIR_SARAH_412',
    defaultWatchlist: ['ASII', 'ANTM', 'ADRO', 'GOTO'],
  },
];
