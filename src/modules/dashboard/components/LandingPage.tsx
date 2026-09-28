/*
 * Hallmark · macrostructure: Marquee Hero · genre: modern-minimal · theme: custom deep-navy + indigo
 * nav: N1b canonical SaaS · footer: Ft5 statement
 * pre-emit critique: P5 H5 E5 S5 R5 V5
 * Audience: retail IDX investors · Use: sign up for automated anomaly alerts · Tone: utilitarian precision
 * Constraints: ZERO lucide/icon imports, zero emoji, zero invented metrics, zero decorative chrome
 * Differs from last (Workbench · dark teal): macrostructure + accent-hue (teal→indigo) + paper-band shift
 */

import React, { useState, useEffect, useRef } from 'react';
import { liveMarketService, RealTickerMetrics, MarketDataUnavailableError, IhsgUnavailableError } from '../../../services/liveMarketService.js';
import { sectorsApi, LiveIdxCompany } from '../../../services/sectorsApi.js';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
  onAuthSuccess: (userData: { name: string; email: string; avatar?: string }) => void;
}

const fmt  = (n: number) => n.toLocaleString('id-ID');
const pct  = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
const vol  = (n: number) => `${(n / 1_000_000).toFixed(1)}M`;

/* ─── INJECTED DESIGN TOKENS & GLOBAL STYLES ─────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900&family=JetBrains+Mono:wght@400;500;700&display=swap');

  :root {
    /* Paper — matched to requested bg */
    --pp: hsl(279, 100%, 3%);     /* page background  */
    --sf: #120517;          /* surface           */
    --sf2: hsl(301, 100%, 12%);  /* raised surface    */
    --ed: hsl(301, 60%, 25%);    /* edge / border     */
    --ed2: hsl(301, 70%, 32%);   /* prominent edge    */

    /* Text */
    --tx-0: hsl(0, 0%, 100%);     /* primary           */
    --tx-1: rgba(255,255,255,0.75); /* secondary       */
    --tx-2: rgba(255,255,255,0.5);  /* muted / label     */

    /* Accent — Primary purple/magenta & Accent Emerald */
    --ac:  hsl(288, 100%, 70%); /* primary accent    */
    --ac-h: hsl(288, 100%, 80%);/* hover             */
    --ac-bg: rgba(230,102,255,0.12);
    --ac-br: rgba(230,102,255,0.35);

    /* Semantic */
    --up:  hsl(141, 100%, 50%);
    --dn:  #f87171;
    --warn: #fbbf24;        /* anomaly amber     */
    --warn-bg: rgba(251,191,36,0.08);
    --warn-br: rgba(251,191,36,0.25);

    --font-sans: 'Inter', system-ui, sans-serif;
    --font-mono: 'JetBrains Mono', ui-monospace, monospace;
    --r: 6px;
    --r2: 10px;
  }

  html, body { overflow-x: clip; }

  .siba-page {
    background: var(--pp);
    color: var(--tx-0);
    font-family: var(--font-sans);
    min-height: 100vh;
  }

  /* ── NAV removed — shared <Header> from App.tsx handles nav ── */

  /* ── TICKER TAPE ──────────────────────────────────────── */
  .tape-wrap {
    overflow: hidden;
    background: var(--sf);
    border-bottom: 1px solid var(--ed);
    height: 36px;
    display: flex; align-items: center;
  }
  .tape-inner {
    display: flex; gap: 0;
    animation: tape-scroll 90s linear infinite;
    white-space: nowrap;
    will-change: transform;
  }
  .tape-inner:hover { animation-play-state: paused; }
  .tape-item {
    padding: 0 28px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--tx-1);
    border-right: 1px solid var(--ed);
    height: 36px;
    display: flex; align-items: center; gap: 10px;
    flex-shrink: 0;
  }
  .tape-sym { color: var(--tx-0); font-weight: 700; }
  .tape-price { color: var(--tx-1); }
  .tape-chg { font-weight: 600; }
  .tape-chg.up { color: var(--up); }
  .tape-chg.dn { color: var(--dn); }
  @keyframes tape-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

  /* ── HERO ─────────────────────────────────────────────── */
  .siba-hero {
    max-width: 1120px; margin: 0 auto;
    padding: 120px 24px 80px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    align-items: center;
  }
  @media (max-width: 900px) {
    .siba-hero { grid-template-columns: 1fr; gap: 40px; }
  }
  .hero-left { display: flex; flex-direction: column; }
  .hero-right { display: flex; justify-content: flex-end; }
  .hero-eyebrow {
    font-family: var(--font-mono);
    font-size: 12.5px; font-weight: 700;
    color: var(--ac-h);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 22px;
    display: flex; align-items: center; gap: 10px;
    padding: 6px 14px;
    background: rgba(157, 78, 221, 0.08);
    border: 1px solid rgba(157, 78, 221, 0.22);
    border-radius: 9999px;
    width: fit-content;
  }
  .hero-eyebrow::before {
    content: '';
    display: inline-block; width: 24px; height: 2px;
    background: var(--ac); flex-shrink: 0;
  }
  .hero-h1 {
    font-size: clamp(36px, 6vw, 68px);
    font-weight: 900;
    line-height: 1.08;
    letter-spacing: -0.03em;
    color: var(--tx-0);
    max-width: 840px;
    margin-bottom: 24px;
  }
  .hero-h1 em {
    font-style: normal;
    color: var(--ac-h);
  }
  .hero-sub {
    font-size: clamp(15px, 2vw, 18px);
    line-height: 1.65;
    color: var(--tx-1);
    max-width: 580px;
    margin-bottom: 36px;
    font-weight: 400;
  }
  .hero-ctas {
    display: flex; gap: 12px; flex-wrap: wrap;
    margin-bottom: 56px;
  }

  /* ── STAT ROW ─────────────────────────────────────────── */
  .stat-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    border: 1px solid var(--ed);
    border-radius: var(--r2);
    overflow: hidden;
    max-width: 720px;
  }
  .stat-cell {
    padding: 20px 24px;
    border-right: 1px solid var(--ed);
  }
  .stat-cell:last-child { border-right: none; }
  .stat-num {
    font-family: var(--font-mono);
    font-size: 28px; font-weight: 700;
    color: var(--tx-0);
    line-height: 1;
    margin-bottom: 6px;
  }
  .stat-num .ac { color: var(--ac-h); }
  .stat-desc {
    font-size: 12px;
    color: var(--tx-2);
    line-height: 1.4;
  }

  /* ── SECTION COMMONS ──────────────────────────────────── */
  .siba-section {
    max-width: 1120px; margin: 0 auto;
    padding: 72px 24px;
    border-top: 1px solid var(--ed);
  }
  .section-label {
    font-family: var(--font-mono);
    font-size: 11px; font-weight: 700;
    color: var(--ac-h); letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 14px;
  }
  .section-h2 {
    font-size: clamp(22px, 3vw, 30px);
    font-weight: 800;
    color: var(--tx-0);
    letter-spacing: -0.02em;
    line-height: 1.2;
    margin-bottom: 12px;
  }
  .section-lead {
    font-size: 15px;
    color: var(--tx-1);
    line-height: 1.65;
    max-width: 560px;
    margin-bottom: 36px;
  }

  /* ── BUTTONS ──────────────────────────────────────────── */
  .btn-primary {
    padding: 13px 26px;
    background: var(--ac);
    color: #fff;
    font-family: var(--font-sans);
    font-size: 14px; font-weight: 700;
    border: none; border-radius: var(--r);
    cursor: pointer;
    transition: background 140ms ease, transform 80ms ease;
    letter-spacing: 0.01em;
  }
  .btn-primary:hover { background: var(--ac-h); }
  .btn-primary:active { transform: translateY(1px); }

  .btn-ghost {
    padding: 12px 24px;
    background: transparent;
    color: var(--tx-1);
    font-family: var(--font-sans);
    font-size: 14px; font-weight: 500;
    border: 1px solid var(--ed2);
    border-radius: var(--r);
    cursor: pointer;
    transition: border-color 140ms ease, color 140ms ease;
  }
  .btn-ghost:hover { border-color: var(--ac); color: var(--ac-h); }

  .btn-sm {
    padding: 7px 14px;
    font-size: 12px; font-weight: 600;
    border-radius: 4px;
  }

  /* ── MARKET CONSOLE ───────────────────────────────────── */
  .console-wrap {
    display: grid;
    grid-template-columns: 260px 1fr;
    border: 1px solid var(--ed2);
    border-radius: var(--r2);
    overflow: hidden;
    background: var(--sf);
    min-height: 420px;
  }
  @media (max-width: 768px) {
    .console-wrap { grid-template-columns: 1fr; }
  }
  .console-sidebar {
    border-right: 1px solid var(--ed);
    background: var(--pp);
    display: flex;
    flex-direction: column;
  }
  .console-sidebar-header {
    padding: 16px 18px;
    border-bottom: 1px solid var(--ed);
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    color: var(--tx-2);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .ticker-list-btn {
    width: 100%;
    padding: 12px 18px;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--ed);
    color: var(--tx-1);
    font-family: var(--font-mono);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: background 120ms;
  }
  .ticker-list-btn:hover { background: var(--sf); }
  .ticker-list-btn.active {
    background: var(--ac-bg);
    color: var(--tx-0);
    border-left: 2px solid var(--ac);
    padding-left: 16px;
  }
  .ticker-list-btn.active .t-sym { color: var(--ac-h); }
  .t-sym { font-weight: 700; }
  .t-pct { font-size: 11px; font-weight: 600; }
  .t-pct.up { color: var(--up); }
  .t-pct.dn { color: var(--dn); }

  .console-main { display: flex; flex-direction: column; }
  .console-topbar {
    padding: 14px 22px;
    border-bottom: 1px solid var(--ed);
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 10px;
  }
  .console-sym {
    font-family: var(--font-mono);
    font-size: 18px; font-weight: 700;
    color: var(--tx-0);
  }
  .console-name { font-size: 13px; color: var(--tx-2); margin-top: 2px; }
  .console-price {
    font-family: var(--font-mono);
    font-size: 22px; font-weight: 700;
    color: var(--tx-0);
    text-align: right;
  }
  .console-chg {
    font-family: var(--font-mono);
    font-size: 13px; font-weight: 600;
    text-align: right;
  }
  .console-chg.up { color: var(--up); }
  .console-chg.dn { color: var(--dn); }

  .console-metrics {
    padding: 20px 22px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
    flex: 1;
  }
  .metric-card {
    padding: 14px 16px;
    background: var(--sf2);
    border: 1px solid var(--ed);
    border-radius: var(--r);
  }
  .metric-card-label {
    font-size: 11px;
    color: var(--tx-2);
    font-weight: 500;
    margin-bottom: 6px;
  }
  .metric-card-val {
    font-family: var(--font-mono);
    font-size: 17px; font-weight: 700;
    color: var(--tx-0);
    line-height: 1;
  }
  .metric-card-val.accent { color: var(--warn); }
  .metric-card-val.ok { color: var(--up); }
  .metric-card-val.ac { color: var(--ac-h); }

  .console-status-bar {
    padding: 14px 22px;
    border-top: 1px solid var(--ed);
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 10px;
  }

  /* ── BADGES ───────────────────────────────────────────── */
  .badge {
    display: inline-flex; align-items: center;
    padding: 4px 10px;
    border-radius: 4px;
    font-family: var(--font-mono);
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .badge-anom  { background: var(--warn-bg); color: var(--warn); border: 1px solid var(--warn-br); }
  .badge-norm  { background: rgba(52,211,153,0.06); color: #34d399; border: 1px solid rgba(52,211,153,0.2); }
  .badge-idle  { background: rgba(74,90,130,0.18); color: var(--tx-2); border: 1px solid var(--ed); }
  .badge-live  { background: rgba(20,184,166,0.08); color: #2dd4bf; border: 1px solid rgba(20,184,166,0.28); }

  /* ── HOW IT WORKS ─────────────────────────────────────── */
  .steps-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    width: 100%;
    box-sizing: border-box;
  }
  @media (max-width: 860px) {
    .steps-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }
  .step-cell {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%), var(--sf);
    border: 1px solid var(--ed);
    border-radius: var(--r2);
    padding: 28px 24px;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    transition: border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
  }
  .step-cell:hover {
    border-color: rgba(157, 78, 221, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.5);
  }
  .step-n-watermark {
    position: absolute;
    top: 10px;
    right: 16px;
    font-family: var(--font-mono);
    font-size: 56px;
    font-weight: 900;
    color: rgba(255, 255, 255, 0.04);
    line-height: 1;
    pointer-events: none;
    user-select: none;
  }
  .step-badge {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    padding: 3px 8px;
    border-radius: 9999px;
    background: rgba(157, 78, 221, 0.12);
    border: 1px solid rgba(157, 78, 221, 0.28);
    color: #d8b4fe;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin-bottom: 16px;
  }
  .step-title {
    font-size: 16px; font-weight: 700;
    color: var(--tx-0);
    margin-bottom: 10px;
    line-height: 1.35;
  }
  .step-body {
    font-size: 13.5px;
    color: var(--tx-1);
    line-height: 1.6;
    margin: 0;
  }

  /* ── RULES SECTION ────────────────────────────────────── */
  .rules-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    align-items: start;
  }
  @media (max-width: 768px) { .rules-grid { grid-template-columns: 1fr; } }
  .rule-item {
    padding: 22px 24px;
    background: var(--sf);
    border: 1px solid var(--ed);
    border-radius: var(--r);
    margin-bottom: 10px;
  }
  .rule-item:last-child { margin-bottom: 0; }
  .rule-hd {
    display: flex; justify-content: space-between;
    align-items: flex-start; gap: 12px;
    margin-bottom: 10px;
  }
  .rule-title {
    font-family: var(--font-mono);
    font-size: 12px; font-weight: 700;
    color: var(--tx-0);
    line-height: 1.4;
  }
  .rule-body {
    font-size: 13px;
    color: var(--tx-1);
    line-height: 1.6;
  }

  /* ── TELEGRAM PREVIEW ─────────────────────────────────── */
  .tg-card {
    background: var(--sf);
    border: 1px solid var(--ed2);
    border-radius: var(--r2);
    overflow: hidden;
  }
  .tg-header {
    padding: 14px 18px;
    background: var(--pp);
    border-bottom: 1px solid var(--ed);
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    flex-wrap: wrap;
  }
  .tg-channel {
    font-family: var(--font-mono);
    font-size: 12px; font-weight: 700;
    color: var(--tx-0);
  }
  .tg-body {
    padding: 18px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--tx-1);
    line-height: 1.8;
    white-space: pre-wrap;
    word-break: break-word;
    min-height: 200px;
  }
  .tg-foot {
    padding: 12px 18px;
    border-top: 1px solid var(--ed);
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
  }

  /* ── COVERAGE TABLE ───────────────────────────────────── */
  .cov-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  .cov-table th {
    padding: 11px 16px;
    text-align: left;
    font-family: var(--font-mono);
    font-size: 10px; font-weight: 700;
    color: var(--tx-2);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    background: var(--sf);
    border-bottom: 1px solid var(--ed);
    white-space: nowrap;
  }
  .cov-table td {
    padding: 13px 16px;
    border-bottom: 1px solid var(--ed);
    color: var(--tx-1);
    vertical-align: middle;
  }
  .cov-table tr:last-child td { border-bottom: none; }
  .cov-table tr { transition: background 120ms; cursor: pointer; }
  .cov-table tr:hover td { background: var(--sf2); }
  .td-sym { font-family: var(--font-mono); font-weight: 700; color: var(--tx-0); white-space: nowrap; }
  .td-price { font-family: var(--font-mono); font-weight: 600; color: var(--tx-0); white-space: nowrap; }
  .td-up { font-family: var(--font-mono); font-weight: 600; color: var(--up); white-space: nowrap; }
  .td-dn { font-family: var(--font-mono); font-weight: 600; color: var(--dn); white-space: nowrap; }
  .td-ratio-hot { font-family: var(--font-mono); font-weight: 700; color: var(--warn); }
  .td-ratio-ok  { font-family: var(--font-mono); color: var(--tx-1); }

  /* ── CTA BLOCK ────────────────────────────────────────── */
  .cta-block {
    background: var(--sf);
    border: 1px solid var(--ed2);
    border-radius: 12px;
    padding: 64px 40px;
    text-align: center;
  }
  .cta-h2 {
    font-size: clamp(26px, 4vw, 40px);
    font-weight: 900;
    color: var(--tx-0);
    letter-spacing: -0.025em;
    line-height: 1.15;
    max-width: 580px;
    margin: 12px auto 16px;
  }
  .cta-lead {
    font-size: 15px;
    color: var(--tx-1);
    max-width: 460px;
    margin: 0 auto 32px;
    line-height: 1.65;
  }
  .cta-ctas { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

  /* ── FOOTER removed — shared footer from App.tsx handles this ── */

  /* ── SEARCH ───────────────────────────────────────────── */
  .search-input {
    padding: 9px 14px;
    background: var(--sf);
    border: 1px solid var(--ed2);
    border-radius: var(--r);
    color: var(--tx-0);
    font-family: var(--font-mono);
    font-size: 13px;
    outline: none;
    width: 200px;
    transition: border-color 140ms;
  }
  .search-input::placeholder { color: var(--tx-2); }
  .search-input:focus { border-color: var(--ac); }

  /* ── SKELETON ─────────────────────────────────────────── */
  .sk {
    background: linear-gradient(90deg, var(--sf) 0%, var(--sf2) 50%, var(--sf) 100%);
    background-size: 200% 100%;
    animation: sk-anim 1.3s ease infinite;
    border-radius: 3px;
    height: 14px;
  }
  .sk-text { height: 12px; }
  .sk-heading { height: 18px; }
  .sk-value { height: 24px; }
  .sk-tape { width: 260px; height: 36px; flex: 0 0 auto; border-right: 1px solid var(--ed); }
  .sk-table-row td { cursor: default; }
  .sk-table-row:hover td { background: transparent !important; }
  .sk-table-row .sk { display: block; }
  @media (prefers-reduced-motion: reduce) {
    .sk { animation: none; }
  }
  @keyframes sk-anim { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }

  /* ── RESPONSIVE ───────────────────────────────────────── */
  @media (max-width: 640px) {
    .siba-hero { padding: 48px 16px 40px; }
    .siba-section { padding: 48px 16px; }
    .cta-block { padding: 40px 20px; }
    .hero-ctas { flex-direction: column; }
    .hero-ctas .btn-primary, .hero-ctas .btn-ghost { width: 100%; text-align: center; }
  }
`;

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth, onAuthSuccess }) => {
  const [selected, setSelected]         = useState('');
  const [tickers, setTickers]           = useState<Record<string, RealTickerMetrics>>({});
  const [liveCompanies, setLiveCompanies] = useState<LiveIdxCompany[]>([]);
  const [companiesLoading, setCompLoading] = useState(true);
  const [companiesError, setCompError]   = useState<string>('');
  const [failedSyms, setFailed]         = useState<Record<string, string>>({});  // sym → error msg
  const [globalErr, setGlobalErr]       = useState<string>('');                  // IHSG / network down
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchErr, setSearchErr]       = useState('');
  const tapeRef = useRef<HTMLDivElement>(null);

  // Fetch live companies from Sectors API first, then fetch live prices via Yahoo Finance
  useEffect(() => {
    let alive = true;
    (async () => {
      setCompLoading(true);
      setCompError('');
      setLoading(true);

      let companies: LiveIdxCompany[] = [];
      try {
        companies = await sectorsApi.fetchTopCompanies();
      } catch (err) {
        console.error('Failed to fetch companies from Sectors API:', err);
      }

      if (!alive) return;

      if (!companies || companies.length === 0) {
        setCompLoading(false);
        setLoading(false);
        return;
      }

      setLiveCompanies(companies);
      setCompLoading(false);

      // Default selected to the first company (highest market cap)
      if (companies.length > 0) {
        setSelected(prev => prev || companies[0].symbol);
      }

      // Fetch prices via Yahoo Finance proxy for all companies
      const targetSymbols = companies.map(c => c.symbol);
      const acc: Record<string, RealTickerMetrics> = {};
      const failed: Record<string, string> = {};

      const priceResults = await Promise.allSettled(
        targetSymbols.map(sym => liveMarketService.fetchTickerMetrics(sym))
      );

      if (!alive) return;

      priceResults.forEach((res, idx) => {
        const sym = targetSymbols[idx];
        if (res.status === 'fulfilled') {
          acc[sym] = res.value;
        } else {
          const err = res.reason;
          if (err instanceof IhsgUnavailableError) {
            setGlobalErr('Data IHSG tidak dapat diambil saat ini. Periksa koneksi internet Anda atau coba beberapa saat lagi.');
          } else {
            failed[sym] = err instanceof MarketDataUnavailableError
              ? err.message
              : `Gagal memuat data ${sym}.`;
          }
        }
      });

      setTickers(acc);
      setFailed(failed);
      setLoading(false);
    })();

    return () => { alive = false; };
  }, []);

  const active = tickers[selected];

  const telegramText = active
    ? `[SIBA — ${active.symbol}]  ${new Date().toLocaleDateString('id-ID')} · 16:30 WIB
Status: ${active.isVolumeAnomaly || active.isSpreadAnomaly ? 'OPEN — ANOMALI TERDETEKSI' : 'MONITORING'}

─── DATA TRANSAKSI BURSA ─────────────
Volume hari ini    ${vol(active.todayVolume)} lot
Median 20 sesi     ${vol(active.medianVolume20d)} lot
Rasio volume       ${active.volumeMultiplier}x median
Harga penutupan    Rp ${fmt(active.lastPrice)}
Perubahan harian   ${pct(active.changePercent)}
IHSG               ${pct(active.ihsgChangePercent)}
Spread vs IHSG     ${pct(active.changePercent - active.ihsgChangePercent)}

─── INTERPRETASI ─────────────────────
${active.isVolumeAnomaly
  ? '• Volume melampaui ambang anomali (≥ 2.0x median 20 sesi).'
  : '• Volume dalam batas normal harian.'}
${active.isSpreadAnomaly
  ? '• Return menyimpang dari IHSG lebih dari 2.0%.'
  : '• Pergerakan harga selaras dengan indeks acuan.'}

─── BELUM DIPANTAU ───────────────────
Rumor & sentimen sosial tidak tercakup
dalam data transaksi resmi bursa.

DISCLAIMER: Otomasi SIBA — bukan rekomendasi trading.`
    : '';



  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const sym = search.trim().toUpperCase().replace('.JK', '');
    if (!sym) return;
    setSearchErr('');
    setSearchLoading(true);
    try {
      const data = await liveMarketService.fetchTickerMetrics(sym);
      setTickers(prev => ({ ...prev, [sym]: data }));
      setFailed(prev => { const n = { ...prev }; delete n[sym]; return n; });
      setSelected(sym);
      setSearch('');
    } catch (err) {
      const msg = err instanceof MarketDataUnavailableError
        ? err.message
        : `Kode "${sym}" tidak dapat dimuat. Cek koneksi atau coba lagi.`;
      setSearchErr(msg);
    } finally {
      setSearchLoading(false);
    }
  };

  /* build double-tape for seamless loop */
  const tapeItems = Object.values(tickers);
  const tapeDouble = [...tapeItems, ...tapeItems];

  return (
    <div className="siba-page">
      <style>{GLOBAL_CSS}</style>


      {/* ── TICKER TAPE ─────────────────────────────────────── */}
      {tapeItems.length > 0 ? (
        <div className="tape-wrap">
          <div className="tape-inner" ref={tapeRef}>
            {tapeDouble.map((item, i) => (
              <div className="tape-item" key={`${item.symbol}-${i}`}>
                <span className="tape-sym">{item.symbol}</span>
                <span className="tape-price">Rp {fmt(item.lastPrice)}</span>
                <span className={`tape-chg ${item.changePercent >= 0 ? 'up' : 'dn'}`}>
                  {pct(item.changePercent)}
                </span>
                {(item.isVolumeAnomaly || item.isSpreadAnomaly) && (
                  <span className="badge badge-anom" style={{ padding: '1px 7px', fontSize: 9 }}>ANOMALI</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : loading ? (
        <div className="tape-wrap" role="status" aria-label="Memuat ringkasan harga saham" aria-busy="true">
          {[0, 1, 2, 3].map(item => <div key={item} className="sk sk-tape" aria-hidden="true" />)}
        </div>
      ) : null}

      {/* ── GLOBAL ERROR BANNER (network / IHSG down) ───────── */}
      {globalErr && (
        <div style={{
          background: 'rgba(248,113,113,0.08)',
          borderBottom: '1px solid rgba(248,113,113,0.22)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#f87171' }}>
            Data pasar tidak tersedia
          </span>
          <span style={{ fontSize: 13, color: 'var(--tx-1)' }}>{globalErr}</span>
          <button
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#f87171', background: 'none', border: '1px solid rgba(248,113,113,0.35)', borderRadius: 4, padding: '3px 12px', cursor: 'pointer' }}
            onClick={() => { setGlobalErr(''); liveMarketService.invalidate(); window.location.reload(); }}
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* ── MARQUEE HERO ────────────────────────────────────── */}
      <div className="siba-hero" id="siba-hero-auth">
        {/* Left column: copy + stats */}
        <div className="hero-left">
          <div className="hero-eyebrow">
            Evaluasi otomatis · Setiap 16:30 WIB · Data real bursa IDX
          </div>
          <h1 className="hero-h1">
            Portofolio IDX Anda<br />
            dipantau <em>otomatis</em><br />
            setiap hari bursa.
          </h1>
          <p className="hero-sub">
            SIBA mengecek volume transaksi, pergerakan harga relatif terhadap IHSG,
            dan dokumen keterbukaan resmi BEI — lalu mengirimkan ringkasannya ke Telegram Anda.
            Tidak ada AI yang menebak. Hanya matematika.
          </p>

          {/* Real data stat row — no invented metrics */}
          <div className="stat-row">
            <div className="stat-cell">
              <div className="stat-num"><span className="ac">16:30</span></div>
              <div className="stat-desc">Waktu evaluasi harian (WIB setiap hari bursa)</div>
            </div>
            <div className="stat-cell">
              <div className="stat-num"><span className="ac">2.0</span>x</div>
              <div className="stat-desc">Ambang batas rasio volume untuk anomali</div>
            </div>
            <div className="stat-cell">
              <div className="stat-num">20</div>
              <div className="stat-desc">Sesi bursa historis untuk median volume</div>
            </div>
            <div className="stat-cell">
              <div className="stat-num">3</div>
              <div className="stat-desc">Indikator deterministik yang dievaluasi SIBA</div>
            </div>
          </div>
        </div>

      </div>

      {/* ── LIVE MARKET CONSOLE ─────────────────────────────── */}
      <section className="siba-section">
        <div className="section-label">Simulasi pantauan pasar dengan Sectors API</div>
        <h2 className="section-h2">Cek indikasi saham pilihan Anda</h2>
        <p className="section-lead">
          Pilih kode saham di bawah untuk melihat harga, volume, dan status anomali real-time.
          Ini persis data yang SIBA evaluasi setiap 16:30 WIB.
        </p>

        <div className="console-wrap">
          {/* Sidebar ticker list */}
          <div className="console-sidebar">
            <div className="console-sidebar-header">
              <span>Contoh Pantauan Demo</span>
              <span style={{ fontSize: 10, color: 'var(--tx-2)', fontWeight: 'normal' }}>
                8 Emiten Pilihan
              </span>
            </div>

            {companiesError ? (
              <div style={{ padding: '16px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#f87171', marginBottom: 8, lineHeight: 1.4 }}>
                  {companiesError}
                </div>
                <button
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: '#f87171',
                    background: 'rgba(248,113,113,0.1)',
                    border: '1px solid rgba(248,113,113,0.3)',
                    borderRadius: 4,
                    padding: '4px 10px',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    sectorsApi.invalidateAll();
                    window.location.reload();
                  }}
                >
                  Muat Ulang
                </button>
              </div>
            ) : companiesLoading ? (
              <div className="api-loading-sidebar" role="status" aria-live="polite" aria-busy="true" style={{ display: 'block', padding: '10px 12px' }}>
                <span className="sr-only">Memuat daftar emiten</span>
                {[0, 1, 2, 3, 4].map(item => (
                  <div key={item} className="sk" aria-hidden="true" style={{ height: 36, marginBottom: 8 }} />
                ))}
              </div>
            ) : (
              Array.from(new Set(['BBCA', 'BBRI', 'BMRI', 'TLKM', 'ASII', 'BREN', 'AMMN', 'ADRO', selected].filter(Boolean))).map(sym => {
                const d = tickers[sym];
                const isAct = selected === sym;
                return (
                  <button
                    key={sym}
                    className={`ticker-list-btn${isAct ? ' active' : ''}`}
                    onClick={() => setSelected(sym)}
                  >
                    <span className="t-sym">{sym}</span>
                    {d
                      ? <span className={`t-pct ${d.changePercent >= 0 ? 'up' : 'dn'}`}>{pct(d.changePercent)}</span>
                      : <span className="t-pct" style={{ color: 'var(--tx-2)' }}>—</span>
                    }
                  </button>
                );
              })
            )}
          </div>

          {/* Main panel */}
          <div className="console-main">
            {loading && !active ? (
              <div className="console-skeleton" role="status" aria-live="polite" aria-busy="true" style={{ padding: 20 }}>
                <span className="sr-only">Memuat data pasar</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
                  <div style={{ display: 'grid', gap: 10, width: '55%' }}>
                    <div className="sk sk-heading" aria-hidden="true" style={{ width: '42%' }} />
                    <div className="sk sk-text" aria-hidden="true" style={{ width: '86%' }} />
                  </div>
                  <div style={{ display: 'grid', justifyItems: 'end', gap: 10, width: '35%' }}>
                    <div className="sk sk-value" aria-hidden="true" style={{ width: '75%' }} />
                    <div className="sk sk-text" aria-hidden="true" style={{ width: '55%' }} />
                  </div>
                </div>
                <div className="console-metrics">
                  {[0, 1, 2, 3, 4, 5].map(item => (
                    <div className="metric-card" key={item} aria-hidden="true">
                      <div className="sk sk-text" style={{ width: '72%', marginBottom: 12 }} />
                      <div className="sk sk-value" style={{ width: '54%' }} />
                      <div className="sk sk-text" style={{ width: '28%', marginTop: 8 }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 18 }}>
                  <div className="sk sk-text" aria-hidden="true" style={{ width: 150 }} />
                  <div className="sk" aria-hidden="true" style={{ width: 150, height: 34 }} />
                </div>
              </div>
            ) : active ? (
              <>
                <div className="console-topbar">
                  <div>
                    <div className="console-sym">
                      {active.symbol}
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 400, color: 'var(--tx-2)', marginLeft: 10 }}>
                        {active.name}
                      </span>
                    </div>
                    <div className="console-name">{active.sector}</div>
                  </div>
                  <div>
                    <div className="console-price">Rp {fmt(active.lastPrice)}</div>
                    <div className={`console-chg ${active.changePercent >= 0 ? 'up' : 'dn'}`}>
                      {pct(active.changePercent)} hari ini
                    </div>
                  </div>
                </div>

                <div className="console-metrics">
                  <div className="metric-card">
                    <div className="metric-card-label">Volume hari ini</div>
                    <div className={`metric-card-val ${active.isVolumeAnomaly ? 'accent' : ''}`}>
                      {vol(active.todayVolume)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--tx-2)', marginTop: 4 }}>lot</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-card-label">Median 20 sesi bursa</div>
                    <div className="metric-card-val">{vol(active.medianVolume20d)}</div>
                    <div style={{ fontSize: 11, color: 'var(--tx-2)', marginTop: 4 }}>lot</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-card-label">Rasio volume</div>
                    <div className={`metric-card-val ${active.isVolumeAnomaly ? 'accent' : 'ok'}`}>
                      {active.volumeMultiplier}x
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--tx-2)', marginTop: 4 }}>vs median</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-card-label">IHSG hari ini</div>
                    <div className={`metric-card-val ${active.ihsgChangePercent >= 0 ? 'ok' : ''}`}>
                      {pct(active.ihsgChangePercent)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--tx-2)', marginTop: 4 }}>indeks acuan</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-card-label">Spread vs IHSG</div>
                    <div className={`metric-card-val ${active.isSpreadAnomaly ? 'accent' : ''}`}>
                      {Math.abs(active.changePercent - active.ihsgChangePercent).toFixed(2)}%
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--tx-2)', marginTop: 4 }}>
                      {active.isSpreadAnomaly ? 'di atas ambang 2.0%' : 'dalam batas normal'}
                    </div>
                  </div>
                  <div className="metric-card" style={{ background: active.isVolumeAnomaly || active.isSpreadAnomaly ? 'var(--warn-bg)' : undefined, borderColor: active.isVolumeAnomaly || active.isSpreadAnomaly ? 'var(--warn-br)' : undefined }}>
                    <div className="metric-card-label">Status SIBA</div>
                    <div className={`metric-card-val ${active.isVolumeAnomaly || active.isSpreadAnomaly ? 'accent' : 'ok'}`} style={{ fontSize: 14 }}>
                      {active.isVolumeAnomaly || active.isSpreadAnomaly ? 'ANOMALI' : 'NORMAL'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--tx-2)', marginTop: 4 }}>
                      {active.isVolumeAnomaly || active.isSpreadAnomaly ? 'laporan akan dikirim' : 'tidak ada laporan'}
                    </div>
                  </div>
                </div>

                <div className="console-status-bar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge badge-live">Live IDX</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--tx-2)' }}>
                      Diperbarui: {active.lastUpdated}
                    </span>
                  </div>
                  <button className="btn-primary btn-sm" onClick={() => onOpenAuth('register')}>
                    Tambahkan ke watchlist saya
                  </button>
                </div>
              </>
            ) : (
              <div style={{ padding: 40, color: 'var(--tx-2)', fontSize: 14 }}>Pilih saham dari daftar di kiri.</div>
            )}
          </div>
        </div>
      </section>

      {/* ── TELEGRAM PREVIEW ──────────────────────────────── */}
      <section className="siba-section">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40, alignItems: 'start' }}>
          <div>
            <div className="section-label">Contoh Laporan Telegram</div>
            <h2 className="section-h2">Format ringkasan yang diterima di Telegram</h2>
            <p className="section-lead">
              Laporan berbentuk teks terstruktur — bukan gambar, bukan PDF.
              Langsung bisa dibaca di notifikasi Telegram tanpa buka aplikasi lain.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: 'var(--tx-1)' }}>
              {[
                'Hanya data transaksi resmi bursa',
                'Tidak ada prediksi harga atau sinyal beli/jual',
                'Format ringkas, bisa dibaca dalam 30 detik',
                'Anomali diberi keterangan jelas mengapa terdeteksi',
              ].map(item => (
                <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ac-h)', flexShrink: 0, marginTop: 1 }}>—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="tg-card">
              <div className="tg-header">
                <div>
                  <div className="tg-channel">@siba_bot</div>
                  <div style={{ fontSize: 11, color: 'var(--tx-2)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    {selected} · {new Date().toLocaleDateString('id-ID')}
                  </div>
                </div>

              </div>
              <pre className="tg-body" aria-busy={loading && !active}>
                {active ? telegramText : loading ? (
                  <span role="status" aria-label="Memuat contoh laporan" style={{ display: 'grid', gap: 10, padding: '8px 0' }}>
                    {[82, 96, 70, 90, 62, 88, 75].map((width, index) => (
                      <span key={index} className="sk sk-text" aria-hidden="true" style={{ display: 'block', width: `${width}%` }} />
                    ))}
                  </span>
                ) : 'Pilih saham di konsol di atas untuk melihat contoh laporan.'}
              </pre>
              <div className="tg-foot">
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--tx-2)' }}>
                  Dikirim otomatis 16:30 WIB
                </span>
                <button className="btn-primary btn-sm" onClick={() => onOpenAuth('register')}>
                  Sambungkan Telegram Saya
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section className="siba-section">
        <div className="section-label">Cara Kerja</div>
        <h2 className="section-h2">Mulai dalam 3 langkah</h2>
        <p className="section-lead" style={{ marginBottom: 28 }}>
          Tidak perlu konfigurasi teknis. Tidak perlu memasang aplikasi baru.
        </p>
        <div className="steps-grid">
          {[
            { n: '01', title: 'Daftar & susun watchlist', body: 'Buat akun gratis. Tambahkan kode saham IDX yang ingin Anda pantau — BBCA, TLKM, BBRI, atau saham lain pilihan Anda.' },
            { n: '02', title: 'Sambungkan Telegram', body: 'Salin token unik dari halaman pengaturan ke bot Telegram SIBA. Chat ID Anda disimpan terisolasi dan tidak dibagikan ke pihak lain.' },
            { n: '03', title: 'Tunggu laporan di 16:30 WIB', body: 'Selesai. Setiap hari bursa tutup, SIBA otomatis mengecek dan mengirimkan ringkasan ke Telegram Anda jika ada anomali.' },
          ].map(s => (
            <div key={s.n} className="step-cell">
              <div className="step-n">{s.n}</div>
              <div className="step-title">{s.title}</div>
              <div className="step-body">{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── EVALUATION RULES ──────────────────────────────── */}
      <section className="siba-section">
        <div className="rules-grid">
          <div>
            <div className="section-label">Kriteria Evaluasi</div>
            <h2 className="section-h2">Evaluasi objektif<br />berbasis data bursa.</h2>
            <p style={{ fontSize: 14, color: 'var(--tx-1)', lineHeight: 1.7, marginBottom: 20 }}>
              SIBA tidak menggunakan model bahasa AI untuk menebak arah harga saham ataupun menganalisis opini media sosial.
              Sistem bekerja murni dengan aturan pasti yang membandingkan angka transaksi bursa terhadap batas patokan yang telah ditentukan.
            </p>
            <p style={{ fontSize: 13, color: 'var(--tx-2)', lineHeight: 1.65 }}>
              Semua aturan bersifat transparan dan konsisten: Anda dapat mengetahui secara pasti
              faktor apa yang memicu diterbitkannya suatu laporan sebelum laporan tersebut dikirimkan.
            </p>
          </div>
          <div>
            {[
              {
                num: '01',
                title: 'Lonjakan volume transaksi',
                badgeLabel: 'BATAS ≥ 2,0x',
                body: 'Volume transaksi hari ini dibandingkan dengan patokan median 20 sesi bursa sebelumnya. Bila hasilnya ≥ 2,0x dari median normal, sistem otomatis mencatat anomali lonjakan volume.',
              },
              {
                num: '02',
                title: 'Pergerakan berbeda jauh dari IHSG',
                badgeLabel: 'SELISIH > 2,0%',
                body: 'Selisih persentase perubahan harga saham terhadap indeks acuan (IHSG) dihitung secara absolut. Bila selisihnya melebihi 2,0%, dicatat sebagai pergerakan tidak lazim terhadap pasar.',
              },
              {
                num: '03',
                title: 'Dokumen keterbukaan informasi BEI',
                badgeLabel: 'ARSIP RESMI BEI',
                body: 'Nomor arsip dan pengumuman resmi dari Bursa Efek Indonesia disajikan apa adanya sebagai konfirmasi fakta emiten, tanpa ringkasan buatan, opini, atau tafsiran tambahan.',
              },
            ].map(r => (
              <div key={r.num} className="rule-item">
                <div className="rule-hd">
                  <span className="rule-num">Aturan {r.num}</span>
                  <span className="badge badge-rule">{r.badgeLabel}</span>
                </div>
                <h3 className="rule-title">{r.title}</h3>
                <p className="rule-body">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COVERAGE TABLE ────────────────────────────────── */}
      <section className="siba-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <div>
            <div className="section-label">Ringkasan Pasar</div>
            <h2 className="section-h2" style={{ marginBottom: 0 }}>Daftar saham dalam pantauan</h2>
          </div>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
            <input
              className="search-input"
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setSearchErr(''); }}
              placeholder="Cari kode saham..."
            />
            <button
              type="submit"
              className="btn-primary btn-sm"
              style={{ padding: '9px 16px' }}
              disabled={searchLoading}
              aria-busy={searchLoading}
            >
              {searchLoading && <span className="api-loading-spinner api-loading-spinner-sm" aria-hidden="true" />}
              {searchLoading ? 'Memuat' : 'Cari'}
            </button>
          </form>
        </div>

        {searchErr && (
          <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 'var(--r)', fontSize: 13, color: 'var(--dn)', marginBottom: 16 }}>
            {searchErr}
          </div>
        )}

        <div style={{ border: '1px solid var(--ed)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="cov-table" aria-busy={loading && Object.values(tickers).length === 0}>
              <thead>
                <tr>
                  {['Kode', 'Nama Emiten', 'Harga', 'Perubahan', 'Volume Hari Ini', 'Rasio Volume', 'Status'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const demoSyms = ['BBCA', 'BBRI', 'BMRI', 'TLKM', 'ASII', 'BREN', 'AMMN', 'ADRO'];
                  const displayedList = search.trim()
                    ? Object.values(tickers).filter(t => t.symbol.toLowerCase().includes(search.toLowerCase()) || t.name.toLowerCase().includes(search.toLowerCase()))
                    : demoSyms.map(s => tickers[s]).filter(Boolean);

                  if (loading && Object.values(tickers).length === 0) {
                    return Array.from({ length: 5 }, (_, rowIndex) => (
                      <tr className="sk-table-row" key={`skeleton-${rowIndex}`} aria-hidden="true">
                        {[42, 150, 74, 52, 76, 48, 64].map((width, cellIndex) => (
                          <td key={cellIndex}>
                            <span className={`sk ${cellIndex === 0 || cellIndex === 2 ? 'sk-text' : ''}`} style={{ width, maxWidth: '100%' }} />
                          </td>
                        ))}
                      </tr>
                    ));
                  }

                  if (displayedList.length === 0) {
                    return (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--tx-2)' }}>
                          {`Tidak ada emiten dengan kode "${search}"`}
                        </td>
                      </tr>
                    );
                  }

                  return displayedList.map(item => (
                    <tr
                      key={item.symbol}
                      onClick={() => { setSelected(item.symbol); window.scrollTo({ top: 500, behavior: 'smooth' }); }}
                      style={{ background: selected === item.symbol ? 'rgba(99,102,241,0.05)' : undefined }}
                    >
                      <td className="td-sym">{item.symbol}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</td>
                      <td className="td-price">Rp {fmt(item.lastPrice)}</td>
                      <td className={item.changePercent >= 0 ? 'td-up' : 'td-dn'}>{pct(item.changePercent)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{vol(item.todayVolume)} lot</td>
                      <td className={item.isVolumeAnomaly ? 'td-ratio-hot' : 'td-ratio-ok'}>{item.volumeMultiplier}x</td>
                      <td>
                        <span className={`badge ${item.isVolumeAnomaly || item.isSpreadAnomaly ? 'badge-anom' : 'badge-norm'}`}>
                          {item.isVolumeAnomaly || item.isSpreadAnomaly ? 'Anomali' : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── CTA BLOCK ─────────────────────────────────────── */}
      <section className="siba-section">
        <div className="cta-block">
          <div className="section-label" style={{ textAlign: 'center' }}>Mulai Hari Ini — Tanpa Biaya</div>
          <h2 className="cta-h2">
            Berhenti buka grafik saham setiap sore.
          </h2>
          <p className="cta-lead">
            Daftar gratis, susun watchlist saham IDX Anda,
            sambungkan Telegram — dan terima laporan otomatis setiap 16:30 WIB.
          </p>
          <div className="cta-ctas">
            <button className="btn-primary" onClick={() => onOpenAuth('register')}>
              Buat Akun Gratis Sekarang
            </button>
            <button className="btn-ghost" onClick={() => onOpenAuth('login')}>
              Masuk ke Akun
            </button>
          </div>
        </div>
      </section>


    </div>
  );
};
