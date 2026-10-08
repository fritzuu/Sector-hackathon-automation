export const TELEGRAM_SECTION_OPTIONS = [
  { id: 'price', label: 'Harga penutupan', description: 'Harga dan perubahan pada sesi terakhir.' },
  { id: 'benchmark', label: 'Perbandingan IHSG', description: 'Indeks acuan dan perbandingan dari sesi yang sama.' },
  { id: 'volume', label: 'Volume perdagangan', description: 'Volume sesi terakhir dan rasio terhadap median.' },
  { id: 'engine', label: 'Status kasus', description: 'Status kasus dan ringkasan hasil evaluasi.' },
  { id: 'filings', label: 'Keterbukaan informasi', description: 'Pengumuman baru yang tersedia dari emiten.' },
  { id: 'news', label: 'Berita terkait', description: 'Sorotan berita baru, ditempatkan paling bawah.' },
] as const;
export type TelegramUserSection = typeof TELEGRAM_SECTION_OPTIONS[number]['id'];
export const DEFAULT_TELEGRAM_SECTIONS: TelegramUserSection[] = TELEGRAM_SECTION_OPTIONS.map(option => option.id);

/** Missing/invalid settings preserve the established default. Empty selections are not valid. */
export function normalizeTelegramSections(value: unknown): TelegramUserSection[] {
  if (!Array.isArray(value) || !value.length || value.some(item => !DEFAULT_TELEGRAM_SECTIONS.includes(item))) {
    return [...DEFAULT_TELEGRAM_SECTIONS];
  }
  return DEFAULT_TELEGRAM_SECTIONS.filter(section => value.includes(section));
}
