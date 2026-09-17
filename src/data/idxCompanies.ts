export interface IdxCompany {
  symbol: string;
  name: string;
  sector: string;
  subSector: string;
  marketCapTier: 'Mega Cap' | 'Big Cap' | 'Mid Cap';
  marketCapTrillion: number;
  lastPrice: number;
  indexMembership: string[]; // e.g. ['LQ45', 'IDX30', 'KOMPAS100']
  description: string;
}

export const IDX_COMPANIES: IdxCompany[] = [
  {
    symbol: 'BBCA',
    name: 'PT Bank Central Asia Tbk',
    sector: 'Financials',
    subSector: 'Banks',
    marketCapTier: 'Mega Cap',
    marketCapTrillion: 1280.5,
    lastPrice: 10450,
    indexMembership: ['LQ45', 'IDX30', 'KOMPAS100'],
    description: 'Bank swasta terbesar di Indonesia dengan kapitalisasi pasar nomor satu di IDX.',
  },
  {
    symbol: 'BBRI',
    name: 'PT Bank Rakyat Indonesia (Persero) Tbk',
    sector: 'Financials',
    subSector: 'Banks',
    marketCapTier: 'Mega Cap',
    marketCapTrillion: 735.2,
    lastPrice: 4850,
    indexMembership: ['LQ45', 'IDX30', 'KOMPAS100'],
    description: 'Bank BUMN dengan fokus pembiayaan UMKM dan penyumbang laba terbesar.',
  },
  {
    symbol: 'BMRI',
    name: 'PT Bank Mandiri (Persero) Tbk',
    sector: 'Financials',
    subSector: 'Banks',
    marketCapTier: 'Mega Cap',
    marketCapTrillion: 615.8,
    lastPrice: 6600,
    indexMembership: ['LQ45', 'IDX30', 'KOMPAS100'],
    description: 'Bank BUMN dengan portofolio korporasi dan pertumbuhan digital banking Livin.',
  },
  {
    symbol: 'BBNI',
    name: 'PT Bank Negara Indonesia (Persero) Tbk',
    sector: 'Financials',
    subSector: 'Banks',
    marketCapTier: 'Big Cap',
    marketCapTrillion: 201.4,
    lastPrice: 5400,
    indexMembership: ['LQ45', 'IDX30', 'KOMPAS100'],
    description: 'Bank BUMN pelopor transaksi internasional dan pembiayaan industri nasional.',
  },
  {
    symbol: 'TLKM',
    name: 'PT Telkom Indonesia (Persero) Tbk',
    sector: 'Telecommunication',
    subSector: 'Wireless & Broadband',
    marketCapTier: 'Mega Cap',
    marketCapTrillion: 299.1,
    lastPrice: 3020,
    indexMembership: ['LQ45', 'IDX30', 'KOMPAS100'],
    description: 'Penyedia infrastruktur telekomunikasi dan jaringan data center terbesar di Indonesia.',
  },
  {
    symbol: 'ASII',
    name: 'PT Astra International Tbk',
    sector: 'Consumer Cyclicals',
    subSector: 'Automotive & Heavy Equipment',
    marketCapTier: 'Mega Cap',
    marketCapTrillion: 207.4,
    lastPrice: 5125,
    indexMembership: ['LQ45', 'IDX30', 'KOMPAS100'],
    description: 'Konglomerasi otomotif (pangsa pasar >50%), jasa keuangan, alat berat, dan agribisnis.',
  },
  {
    symbol: 'UNTR',
    name: 'PT United Tractors Tbk',
    sector: 'Energy & Mining',
    subSector: 'Heavy Equipment & Coal Mining',
    marketCapTier: 'Big Cap',
    marketCapTrillion: 99.8,
    lastPrice: 26800,
    indexMembership: ['LQ45', 'IDX30', 'KOMPAS100'],
    description: 'Distributor alat berat Komatsu dan kontraktor penambangan PAMA terbesar di Indonesia.',
  },
  {
    symbol: 'ICBP',
    name: 'PT Indofood CBP Sukses Makmur Tbk',
    sector: 'Consumer Non-Cyclicals',
    subSector: 'Packaged Food & Beverages',
    marketCapTier: 'Big Cap',
    marketCapTrillion: 137.6,
    lastPrice: 11800,
    indexMembership: ['LQ45', 'IDX30', 'KOMPAS100'],
    description: 'Produsen makanan olahan terkemuka (Indomie, susu Indomilk) dengan penetrasi global.',
  },
  {
    symbol: 'INDF',
    name: 'PT Indofood Sukses Makmur Tbk',
    sector: 'Consumer Non-Cyclicals',
    subSector: 'Food Products & Agribusiness',
    marketCapTier: 'Big Cap',
    marketCapTrillion: 62.3,
    lastPrice: 7100,
    indexMembership: ['LQ45', 'IDX30', 'KOMPAS100'],
    description: 'Perusahaan Total Food Solutions dari bahan baku tepung Bogasari hingga agribisnis.',
  },
  {
    symbol: 'ANTM',
    name: 'PT Aneka Tambang Tbk',
    sector: 'Basic Materials',
    subSector: 'Gold, Nickel & Bauxite Mining',
    marketCapTier: 'Mid Cap',
    marketCapTrillion: 37.2,
    lastPrice: 1550,
    indexMembership: ['LQ45', 'KOMPAS100'],
    description: 'Produsen emas batangan Logam Mulia (LM) dan pengolah feronikel terintegrasi BUMN.',
  },
  {
    symbol: 'ADRO',
    name: 'PT Adaro Energy Indonesia Tbk',
    sector: 'Energy',
    subSector: 'Coal Mining & Green Energy',
    marketCapTier: 'Big Cap',
    marketCapTrillion: 115.7,
    lastPrice: 3620,
    indexMembership: ['LQ45', 'IDX30', 'KOMPAS100'],
    description: 'Grup energi terintegrasi batu bara metalurgi dan ekspansi energi baru terbarukan.',
  },
  {
    symbol: 'GOTO',
    name: 'PT GoTo Gojek Tokopedia Tbk',
    sector: 'Technology',
    subSector: 'Digital Ecosystem & FinTech',
    marketCapTier: 'Mid Cap',
    marketCapTrillion: 74.5,
    lastPrice: 62,
    indexMembership: ['LQ45', 'KOMPAS100'],
    description: 'Ekosistem digital terkemuka Indonesia (Gojek on-demand dan GoTo Financial).',
  },
];

export interface PopularPreset {
  name: string;
  tickers: string[];
  description: string;
  indexBasis: string; // e.g. 'Konstituen LQ45 & IDX30'
  totalMarketCap: string; // e.g. 'Rp 2.830 Triliun'
  dataReason: string; // e.g. '4 emiten dengan kapitalisasi pasar perbankan terbesar & volume terlikuid di IDX'
}

export const POPULAR_PRESETS: PopularPreset[] = [
  {
    name: 'Perbankan Terbesar (Big 4)',
    tickers: ['BBCA', 'BBRI', 'BMRI', 'BBNI'],
    description: 'Pilar utama keuangan nasional dengan bobot ~30% terhadap pergerakan IHSG.',
    indexBasis: 'Konstituen Resmi LQ45 & IDX30',
    totalMarketCap: 'Rp 2.832 Triliun',
    dataReason: 'Berdasarkan data Sectors API: 4 emiten perbankan dengan Free Float Market Cap & likuiditas harian tertinggi di BEI.',
  },
  {
    name: 'Konsumsi & Kebutuhan Pokok',
    tickers: ['ICBP', 'INDF', 'KLBF', 'CPIN'],
    description: 'Emiten defensif penyedia produk makanan, minuman, dan farmasi harian.',
    indexBasis: 'Klasifikasi Sektoral IDX-IC & LQ45',
    totalMarketCap: 'Rp 278 Triliun',
    dataReason: 'Berdasarkan data Sectors API: Pemimpin pangsa pasar sektor Consumer Non-Cyclicals dengan pendapatan stabil.',
  },
  {
    name: 'Energi & Pertambangan',
    tickers: ['ADRO', 'UNTR', 'ANTM', 'AMMN'],
    description: 'Emiten komoditas batu bara, emas, tembaga, dan penyedia alat berat.',
    indexBasis: 'Konstituen LQ45 Komoditas',
    totalMarketCap: 'Rp 450+ Triliun',
    dataReason: 'Berdasarkan data Sectors API: 4 emiten sektor energi & material dasar dengan perputaran nilai transaksi terbesar.',
  },
  {
    name: 'Telco & Otomotif Terkemuka',
    tickers: ['TLKM', 'ASII', 'GOTO'],
    description: 'Pemimpin pangsa pasar jaringan digital, ekosistem teknologi, dan industri otomotif.',
    indexBasis: 'Top 15 Market Cap IDX',
    totalMarketCap: 'Rp 581 Triliun',
    dataReason: 'Berdasarkan data Sectors API: Emiten dengan pangsa pasar >50% di bidang telekomunikasi seluler dan otomotif nasional.',
  },
];
