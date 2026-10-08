import { useEffect, useState } from 'react';

const PAGE_SIZE = 10;

export function usePagination<T>(items: T[], resetKey = '') {
  const [selection, setSelection] = useState({ page: 1, key: resetKey });
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const page = selection.key === resetKey ? Math.min(selection.page, pageCount) : 1;

  // Clamp when a filter or data removal makes the selected page unavailable.
  // Keep the current page during ordinary background refreshes.
  useEffect(() => {
    if (selection.page !== page || selection.key !== resetKey) {
      setSelection({ page, key: resetKey });
    }
  }, [page, resetKey, selection.page, selection.key]);

  const offset = (page - 1) * PAGE_SIZE;
  return {
    items: items.slice(offset, offset + PAGE_SIZE),
    page,
    pageCount,
    total: items.length,
    start: items.length ? offset + 1 : 0,
    end: Math.min(offset + PAGE_SIZE, items.length),
    onPageChange: (nextPage: number) => setSelection({
      page: Math.max(1, Math.min(nextPage, pageCount)), key: resetKey,
    }),
  };
}
