import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { AlertTriangle, CircleHelp, RefreshCw } from 'lucide-react';

interface RouteErrorProps {
  error: unknown;
  reset: () => void;
}

export function RouteErrorPage({ error, reset }: RouteErrorProps) {
  useEffect(() => {
    console.error('[Router] Gagal memuat halaman:', error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <section
        role="alert"
        className="w-full max-w-lg border border-rose-500/30 bg-secondary/70 p-6 text-center shadow-xl sm:p-8"
      >
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-300">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-bold text-text-main">Halaman gagal dimuat</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-text-muted">
          Terjadi kendala saat membuka halaman. Coba muat ulang bagian ini.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex min-h-10 items-center justify-center gap-2 border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition-colors hover:bg-rose-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Coba lagi
        </button>
      </section>
    </main>
  );
}

export function RoutePendingPage() {
  return (
    <main
      aria-label="Memuat halaman"
      aria-busy="true"
      className="mx-auto min-h-[60vh] w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="mb-6 h-7 w-48 animate-pulse bg-secondary/80" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(17rem,1fr)]">
        <div className="space-y-4">
          <div className="h-44 animate-pulse border border-border bg-secondary/60" />
          <div className="h-56 animate-pulse border border-border bg-secondary/60" />
        </div>
        <div className="h-64 animate-pulse border border-border bg-secondary/60" />
      </div>
    </main>
  );
}

export function RouteNotFoundPage() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <section className="w-full max-w-lg border border-border bg-secondary/70 p-6 text-center shadow-xl sm:p-8">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
          <CircleHelp className="h-5 w-5" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-bold text-text-main">Halaman tidak ditemukan</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-text-muted">
          Alamat ini tidak tersedia atau sudah dipindahkan.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex min-h-10 items-center justify-center border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Kembali ke beranda
        </Link>
      </section>
    </main>
  );
}