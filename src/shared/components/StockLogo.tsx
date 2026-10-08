import { useState } from 'react';

// Company identity only; market data continues to come from Sectors.
const OFFICIAL_LOGOS: Record<string, string> = {
  BBCA: 'https://pustaka.bca.co.id/public-assets/logo-bca-white.svg',
  BBRI: 'https://www.ir-bri.com/bbri_assets/vendor/img/bri-logo.png',
  BMRI: 'https://www.bankmandiri.co.id/image/layout_set_logo?img_id=31567',
  GOTO: 'https://www.gotocompany.com/_next/static/media/footer-logo.8fa29839.png',
  AMMN: 'https://www.amman.co.id/assets/logo-amman-1326d9e51ac0ffe53dc6956cc15ff5c877db72a9afa86af0336721b9f08b2046.png',
};

interface StockLogoProps {
  ticker: string;
  className?: string;
  size?: 'small' | 'large';
}

function LogoImage({ ticker, className = '', size = 'small' }: StockLogoProps) {
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const validTicker = /^[A-Z]{4}$/.test(ticker);
  const sources = validTicker
    ? [OFFICIAL_LOGOS[ticker], `https://assets.stockbit.com/logos/companies/${ticker}.png`].filter(Boolean)
    : [];
  const src = sources[attempt];
  const sourceLabel = src?.startsWith('https://assets.stockbit.com/') ? 'Stockbit' : 'situs perusahaan';

  return (
    <span
      className={`relative inline-flex ${size === 'large' ? 'h-12 w-12 text-xs' : 'h-8 w-8 text-[9px]'} shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-secondary font-mono font-bold text-text-muted ${className}`}
      title={loaded ? `Logo ${ticker} · ${sourceLabel}` : `Logo ${ticker} belum tersedia`}
      aria-hidden="true"
    >
      {!loaded && <span>{ticker || '—'}</span>}
      {src && (
        <img
          key={src}
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className={`absolute inset-0 h-full w-full object-contain p-1 ${src === OFFICIAL_LOGOS.BBCA || src === OFFICIAL_LOGOS.GOTO ? 'bg-secondary' : 'bg-white'} ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => { setLoaded(false); setAttempt(value => value + 1); }}
        />
      )}
    </span>
  );
}

export function StockLogo({ ticker, className, size }: StockLogoProps) {
  const symbol = ticker.trim().toUpperCase().replace(/\.JK$/, '');
  // A different ticker must not inherit the previous image's load/error state.
  return <LogoImage key={symbol} ticker={symbol} className={className} size={size} />;
}
