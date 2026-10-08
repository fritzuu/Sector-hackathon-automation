import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pageCount: number;
  total: number;
  start: number;
  end: number;
  onPageChange: (page: number) => void;
  label: string;
}

export function Pagination({ page, pageCount, total, start, end, onPageChange, label }: PaginationProps) {
  if (!total) return null;
  const buttonClass = 'inline-flex min-h-9 items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-main hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary';
  return <nav aria-label={label} className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-text-muted">
    <p aria-live="polite">{start}–{end} dari {total} entri</p>
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className={buttonClass} aria-label={`${label}: sebelumnya`}><ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />Sebelumnya</button>
      <span className="px-1">Halaman {page} / {pageCount}</span>
      <button type="button" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)} className={buttonClass} aria-label={`${label}: berikutnya`}>Berikutnya<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /></button>
    </div>
  </nav>;
}
