import { create } from 'zustand';

export interface DbCompany {
  symbol: string;
  name: string;
  sector: string;
  subSector: string;
  marketCapTier: string;
  market_cap: number | null;
  lastPrice?: number;
}

interface CompanyState {
  companies: DbCompany[];
  setCompanies: (companies: DbCompany[]) => void;
  getCompany: (sym: string) => DbCompany | undefined;
}

export const useCompanyStore = create<CompanyState>((set, get) => ({
  companies: [],
  setCompanies: (companies) => set({ companies }),
  getCompany: (sym) => get().companies.find(c => c.symbol === sym),
}));

export const POPULAR_PRESETS = [
  { id: 'banks', label: 'Big 4 Banks', icon: '💰', description: 'BCA, BRI, Mandiri, BNI', tickers: ['BBCA', 'BBRI', 'BMRI', 'BBNI'] },
  { id: 'telco', label: 'Telekomunikasi', icon: '📶', description: 'Telkom, Indosat, XL', tickers: ['TLKM', 'ISAT', 'EXCL'] },
  { id: 'consumer', label: 'Consumer Goods', icon: '🛒', description: 'Indofood, Unilever, Mayora', tickers: ['INDF', 'ICBP', 'UNVR', 'MYOR'] },
  { id: 'energy', label: 'Energi & Tambang', icon: '⚡', description: 'Adaro, PTBA, Medco', tickers: ['ADRO', 'PTBA', 'MEDC', 'PGAS'] },
];
