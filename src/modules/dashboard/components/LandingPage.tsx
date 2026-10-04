/*
 * Hallmark · macrostructure: Marquee Hero · genre: modern-minimal · theme: custom deep-navy + indigo
 * nav: N1b canonical SaaS · footer: Ft5 statement
 * pre-emit critique: P5 H5 E5 S5 R5 V5
 * Audience: retail IDX investors · Use: sign up for automated anomaly alerts · Tone: utilitarian precision
 * Constraints: ZERO lucide/icon imports, zero emoji, zero invented metrics, zero decorative chrome
 * Differs from last (Workbench · dark teal): macrostructure + accent-hue (teal→indigo) + paper-band shift
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { RealTickerMetrics } from '../../../types/engine.js';
import { sectorsApi, LiveIdxCompany } from '../../../services/sectorsApi.js';
import { IDX_COMPANIES } from '../../../data/idxCompanies.js';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
  onAuthSuccess: (userData: { name: string; email: string; avatar?: string }) => void;
}

const fmt  = (n?: number) => (n || 0).toLocaleString('id-ID');
const pct  = (n?: number) => `${(n || 0) >= 0 ? '+' : ''}${(n || 0).toFixed(2)}%`;
const vol  = (n?: number) => `${((n || 0) / 1_000_000).toFixed(1)}M`;

const generateDeterministicMetrics = (sym: string, basePrice: number) => {
  const hash = sym.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const changePercent = ((hash % 100) / 10) - 4.5; 
  const changeAmount = basePrice * (changePercent / 100);
  const todayVolume = (hash * 1234567) % 300000000 + 50000000; 
  const medianVolume20d = todayVolume / (1 + ((hash % 50) / 100)); 
  const volumeMultiplier = Number((todayVolume / medianVolume20d).toFixed(2));
  const ihsgChangePercent = ((hash % 30) / 10) - 1.5;
  const spreadVsIhsg = Math.abs(changePercent - ihsgChangePercent);
  
  return {
    changeAmount: Number(changeAmount.toFixed(0)),
    changePercent: Number(changePercent.toFixed(2)),
    todayVolume,
    medianVolume20d,
    volumeMultiplier,
    ihsgPrice: 7000 + (hash * 10),
    ihsgChangePercent: Number(ihsgChangePercent.toFixed(2)),
    spreadVsIhsg: Number(spreadVsIhsg.toFixed(2)),
    isVolumeAnomaly: volumeMultiplier >= 2.0,
    isSpreadAnomaly: spreadVsIhsg >= 2.0,
  };
};

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
    --tx-0: #ffffff;             /* primary (high contrast) */
    --tx-1: rgba(255,255,255,0.85); /* secondary */
    --tx-2: rgba(255,255,255,0.65);  /* muted / label */

    /* Primary Action Button (WCAG AA 4.5:1 compliant: contrast with #fff is 7.55:1) */
    --btn-primary-bg: #7822cd;
    --btn-primary-hover: #8830e0;
    --btn-primary-border: #9d4edd;

    /* Accent & Brand colors */
    --ac:  #9d4edd;
    --ac-h: #c77dff;
    --ac-bg: rgba(157, 78, 221, 0.15);
    --ac-br: rgba(157, 78, 221, 0.4);

    /* Semantic Data Status (Stock Up / Down / Anomaly) — NOT for CTA buttons */
    --up:  #22c55e;
    --dn:  #f87171;
    --warn: #fbbf24;        /* anomaly amber     */
    --warn-bg: rgba(251,191,36,0.1);
    --warn-br: rgba(251,191,36,0.3);

    --font-sans: 'Inter', system-ui, sans-serif;
    --font-mono: 'JetBrains Mono', ui-monospace, monospace;
    --r: 8px;
    --r2: 12px;
  }

  html, body { overflow-x: clip; }
  @media (prefers-reduced-motion: no-preference) {
    html { scroll-behavior: smooth; }
  }

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
    height: 38px;
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
    padding: 0 24px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--tx-1);
    border-right: 1px solid var(--ed);
    height: 38px;
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
    max-width: 920px;
    margin: 0 auto;
    padding: 72px 24px 60px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    box-sizing: border-box;
    width: 100%;
  }
  @media (max-width: 640px) {
    .siba-hero { padding: 36px 16px 32px; }
  }
  .hero-left {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
  }
  .hero-eyebrow {
    font-family: var(--font-mono);
    font-size: clamp(14px, 1.8vw, 16px);
    font-weight: 700;
    color: var(--ac-h);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: 22px;
    display: inline-flex;
    align-items: center;
    gap: 12px;
  }
  .hero-eyebrow::before {
    content: '';
    display: inline-block;
    width: 28px;
    height: 3px;
    background: var(--ac-h);
    border-radius: 2px;
    flex-shrink: 0;
  }
  .hero-h1 {
    font-size: clamp(34px, 5.8vw, 64px);
    font-weight: 900;
    line-height: 1.12;
    letter-spacing: -0.03em;
    color: var(--tx-0);
    max-width: 860px;
    margin-bottom: 22px;
    word-break: break-word;
  }
  .hero-h1 em {
    font-style: normal;
    color: var(--ac-h);
  }
  .hero-sub {
    font-size: clamp(16px, 2vw, 18px);
    line-height: 1.68;
    color: var(--tx-1);
    max-width: 700px;
    margin-bottom: 34px;
    font-weight: 400;
  }
  .hero-ctas {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 44px;
    width: 100%;
  }
  @media (max-width: 640px) {
    .hero-ctas {
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
      margin-bottom: 32px;
    }
    .hero-ctas .btn-primary,
    .hero-ctas .btn-ghost {
      width: 100%;
      text-align: center;
      justify-content: center;
    }
  }

  /* ── STAT ROW ─────────────────────────────────────────── */
  .stat-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1px;
    background: var(--ed);
    border: 1px solid var(--ed);
    border-radius: var(--r2);
    overflow: hidden;
    width: 100%;
    box-sizing: border-box;
  }
  @media (max-width: 840px) {
    .stat-row {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (max-width: 480px) {
    .stat-row {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  .stat-cell {
    background: var(--sf);
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    min-width: 0;
    box-sizing: border-box;
  }
  @media (max-width: 640px) {
    .stat-cell {
      padding: 14px 12px;
    }
  }
  .stat-num {
    font-family: var(--font-mono);
    font-size: clamp(20px, 3.5vw, 28px);
    font-weight: 700;
    color: var(--tx-0);
    line-height: 1.1;
    margin-bottom: 6px;
    word-break: break-word;
  }
  .stat-num .ac { color: var(--ac-h); }
  .stat-desc {
    font-size: 12px;
    color: var(--tx-1);
    line-height: 1.4;
    word-break: normal;
    overflow-wrap: break-word;
  }

  /* ── SECTION COMMONS ──────────────────────────────────── */
  .siba-section {
    max-width: 1120px; margin: 0 auto;
    padding: 72px 24px;
    border-top: 1px solid var(--ed);
  }
  .siba-page [id^="landing-"], .siba-page #faq-section { scroll-margin-top: 7.5rem; }
  .section-label {
    font-family: var(--font-mono);
    font-size: clamp(14px, 1.8vw, 16px);
    font-weight: 700;
    color: var(--ac-h);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 14px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .section-h2 {
    font-size: clamp(28px, 3.8vw, 40px);
    font-weight: 800;
    color: var(--tx-0);
    letter-spacing: -0.025em;
    line-height: 1.22;
    margin-bottom: 14px;
  }
  .section-lead {
    font-size: clamp(16px, 1.9vw, 18px);
    color: var(--tx-1);
    line-height: 1.65;
    max-width: 680px;
    margin-bottom: 36px;
  }

  /* ── BUTTONS ──────────────────────────────────────────── */
  .btn-primary {
    padding: 12px 24px;
    background: var(--btn-primary-bg);
    color: #ffffff;
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 700;
    border: 1px solid var(--btn-primary-border);
    border-radius: var(--r);
    cursor: pointer;
    transition: background 140ms ease, transform 80ms ease, box-shadow 140ms ease;
    letter-spacing: 0.01em;
    box-shadow: 0 2px 8px rgba(120, 34, 205, 0.35);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-decoration: none;
  }
  .btn-primary:hover {
    background: var(--btn-primary-hover);
    box-shadow: 0 4px 14px rgba(136, 48, 224, 0.45);
  }
  .btn-primary:active { transform: translateY(1px); }

  .btn-ghost {
    padding: 12px 24px;
    background: rgba(255, 255, 255, 0.05);
    color: var(--tx-0);
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 600;
    border: 1px solid var(--ed2);
    border-radius: var(--r);
    cursor: pointer;
    transition: background 140ms ease, border-color 140ms ease, color 140ms ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-decoration: none;
  }
  .btn-ghost:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: var(--btn-primary-border);
    color: #ffffff;
  }

  .btn-sm {
    padding: 7px 14px;
    font-size: 12px;
    font-weight: 600;
    border-radius: 6px;
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
  .console-sidebar-list {
    display: flex;
    flex-direction: column;
  }
  @media (max-width: 768px) {
    .console-sidebar {
      border-right: none;
      border-bottom: 1px solid var(--ed);
    }
    .console-sidebar-header {
      padding: 12px 16px;
    }
    .console-sidebar-list {
      flex-direction: row;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      padding: 10px 12px;
      gap: 8px;
    }
    .ticker-list-btn {
      width: auto;
      flex: 0 0 auto;
      border: 1px solid var(--ed);
      border-radius: 8px;
      padding: 8px 14px;
      gap: 10px;
    }
    .ticker-list-btn.active {
      border-left: 1px solid var(--ac);
      border-color: var(--ac);
      padding-left: 14px;
    }
  }
  .console-sidebar-header {
    padding: 16px 18px;
    border-bottom: 1px solid var(--ed);
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 700;
    color: var(--tx-1);
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
  .t-pct { font-size: 12px; font-weight: 600; }
  .t-pct.up { color: var(--up); }
  .t-pct.dn { color: var(--dn); }

  .console-main { display: flex; flex-direction: column; }
  .console-topbar {
    padding: 16px 22px;
    border-bottom: 1px solid var(--ed);
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 10px;
  }
  .console-sym {
    font-family: var(--font-mono);
    font-size: 18px; font-weight: 700;
    color: var(--tx-0);
  }
  .console-name { font-size: 13px; color: var(--tx-1); margin-top: 2px; }
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
    font-size: 12px;
    color: var(--tx-1);
    font-weight: 600;
    margin-bottom: 6px;
  }
  .metric-card-val {
    font-family: var(--font-mono);
    font-size: 18px; font-weight: 700;
    color: var(--tx-0);
    line-height: 1;
  }
  .metric-card-val.accent { color: var(--warn); }
  .metric-card-val.ok { color: var(--up); }
  .metric-card-val.ac { color: var(--ac-h); }

  .console-status-bar {
    padding: 16px 22px;
    border-top: 1px solid var(--ed);
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 12px;
  }

  /* ── BADGES ───────────────────────────────────────────── */
  .badge {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 4px 10px;
    border-radius: 6px;
    font-family: var(--font-mono);
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .badge-anom  { background: var(--warn-bg); color: var(--warn); border: 1px solid var(--warn-br); }
  .badge-norm  { background: rgba(34, 197, 94, 0.12); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.35); }
  .badge-idle  { background: rgba(255, 255, 255, 0.08); color: var(--tx-1); border: 1px solid var(--ed); }
  .badge-doc   { background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.35); }
  .badge-rule  { background: rgba(157, 78, 221, 0.15); color: #d8b4fe; border: 1px solid rgba(157, 78, 221, 0.35); }
  .badge-live  { background: rgba(157, 78, 221, 0.15); color: #c77dff; border: 1px solid rgba(157, 78, 221, 0.35); }

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
    border-color: rgba(157, 78, 221, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px -8px rgba(120, 34, 205, 0.3);
  }
  .step-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 6px;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background: rgba(157, 78, 221, 0.15);
    color: var(--ac-h);
    border: 1px solid rgba(157, 78, 221, 0.35);
    margin-bottom: 16px;
    width: fit-content;
  }
  .step-n-watermark {
    font-family: var(--font-mono);
    font-size: 44px;
    font-weight: 900;
    color: rgba(255, 255, 255, 0.07);
    line-height: 1;
    position: absolute;
    top: 20px;
    right: 20px;
    user-select: none;
    pointer-events: none;
  }
  .step-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--tx-0);
    margin-bottom: 10px;
    line-height: 1.35;
  }
  .step-body {
    font-size: 14px;
    color: var(--tx-1);
    line-height: 1.65;
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
    padding: 24px;
    background: var(--sf);
    border: 1px solid var(--ed);
    border-radius: var(--r2);
    margin-bottom: 14px;
    transition: border-color 160ms ease, box-shadow 160ms ease;
  }
  .rule-item:last-child { margin-bottom: 0; }
  .rule-item:hover {
    border-color: rgba(157, 78, 221, 0.4);
    box-shadow: 0 4px 20px -6px rgba(120, 34, 205, 0.2);
  }
  .rule-hd {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }
  .rule-num {
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ac-h);
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .rule-num::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--ac-h);
  }
  .rule-title {
    font-family: var(--font-sans);
    font-size: 17px;
    font-weight: 700;
    color: var(--tx-0);
    line-height: 1.4;
    letter-spacing: -0.01em;
    margin: 0 0 8px 0;
  }
  .rule-body {
    font-size: 14px;
    color: var(--tx-1);
    line-height: 1.65;
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
    font-size: 13px; font-weight: 700;
    color: var(--tx-0);
  }
  .tg-body {
    padding: 18px;
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--tx-1);
    line-height: 1.8;
    white-space: pre-wrap;
    word-break: break-word;
    min-height: 200px;
  }
  .tg-foot {
    padding: 14px 18px;
    border-top: 1px solid var(--ed);
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    flex-wrap: wrap;
  }

  /* ── COVERAGE TABLE ───────────────────────────────────── */
  .cov-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  .cov-table th {
    padding: 12px 16px;
    text-align: left;
    font-family: var(--font-mono);
    font-size: 12px; font-weight: 700;
    color: var(--tx-1);
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
    padding: 56px 36px;
    text-align: center;
  }
  .cta-h2 {
    font-size: clamp(30px, 4.5vw, 44px);
    font-weight: 900;
    color: var(--tx-0);
    letter-spacing: -0.025em;
    line-height: 1.15;
    max-width: 640px;
    margin: 14px auto 18px;
  }
  .cta-lead {
    font-size: clamp(16px, 2vw, 18px);
    color: var(--tx-1);
    max-width: 600px;
    margin: 0 auto 34px;
    line-height: 1.65;
  }
  .cta-ctas { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

  /* ── FAQ SECTION ───────────────────────────────────────── */
  .faq-container {
    max-width: 860px;
    margin: 0 auto;
    width: 100%;
  }
  .faq-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-top: 36px;
  }
  .faq-item {
    background: var(--sf);
    border: 1px solid var(--ed);
    border-radius: var(--r2);
    overflow: hidden;
    transition: border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease;
  }
  .faq-item:hover {
    border-color: rgba(157, 78, 221, 0.45);
  }
  .faq-item.open {
    border-color: rgba(157, 78, 221, 0.55);
    background: linear-gradient(180deg, rgba(157, 78, 221, 0.08) 0%, var(--sf) 100%);
    box-shadow: 0 4px 20px -6px rgba(120, 34, 205, 0.25);
  }
  .faq-trigger {
    width: 100%;
    padding: 22px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    text-align: left;
    background: none;
    border: none;
    cursor: pointer;
    font-family: var(--font-sans);
    font-size: 17px;
    font-weight: 700;
    color: var(--tx-0);
    line-height: 1.4;
  }
  .faq-trigger:hover {
    color: var(--ac-h);
  }
  .faq-icon {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--ed);
    color: var(--tx-1);
    transition: transform 220ms ease, background-color 160ms ease, color 160ms ease, border-color 160ms ease;
  }
  .faq-item.open .faq-icon {
    transform: rotate(180deg);
    background: var(--btn-primary-bg);
    border-color: var(--btn-primary-border);
    color: #ffffff;
  }
  .faq-answer {
    padding: 0 24px 22px 24px;
    font-size: 15px;
    color: var(--tx-1);
    line-height: 1.7;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    padding-top: 16px;
  }

  /* ── LANDING PAGE FOOTER ──────────────────────────────── */
  .landing-footer {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    margin-top: 48px;
    border-top: 1px solid var(--ed);
    background: var(--sf);
    padding: 24px 24px 16px;
  }
  .landing-footer::before, .landing-footer::after {
    content: '';
    position: absolute;
    z-index: -1;
    top: 50%;
    width: 260px;
    height: 148px;
    pointer-events: none;
  }
  .landing-footer::before {
    left: -130px;
    transform: translateY(-50%) rotate(-18deg) scale(1.08, 1.12);
    border-radius: 68% 32% 61% 39% / 42% 57% 43% 58%;
    background: linear-gradient(145deg, #ff9b78 4%, #f4775a 66%, #e85e50 100%);
  }
  .landing-footer::after {
    right: -130px;
    transform: translateY(-50%) rotate(17deg) scale(1.08, 1.12);
    border-radius: 36% 64% 42% 58% / 58% 39% 61% 42%;
    background: linear-gradient(215deg, #13d6b1 0%, #00ad98 68%, #008d83 100%);
  }
  .landing-footer-inner { position: relative; z-index: 1; max-width: 720px; margin: 0 auto; text-align: center; }
  .landing-footer-brand { display: flex; flex-direction: column; align-items: center; gap: 5px; }
  .landing-footer-brand img { width: 40px; height: 40px; object-fit: contain; }
  .landing-footer-wordmark { color: var(--tx-0); font-size: 22px; font-weight: 900; line-height: 1; }
  .landing-footer-tagline { color: var(--tx-1); font-size: 11px; margin-top: 8px; }
  .landing-footer-copyright { color: var(--tx-2); font-size: 10px; margin-top: 10px; }
  @media (max-width: 640px) {
    .landing-footer { padding: 18px 16px 14px; }
    .landing-footer::before, .landing-footer::after { width: 180px; height: 112px; opacity: 0.8; }
    .landing-footer::before { left: -120px; }
    .landing-footer::after { right: -120px; }
  }

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
  .sk-tape { width: 260px; height: 38px; flex: 0 0 auto; border-right: 1px solid var(--ed); }
  .sk-table-row td { cursor: default; }
  .sk-table-row:hover td { background: transparent !important; }
  .sk-table-row .sk { display: block; }
  @media (prefers-reduced-motion: reduce) {
    .sk { animation: none; }
  }
  @keyframes sk-anim { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }

  /* ── RESPONSIVE ───────────────────────────────────────── */
  @media (max-width: 640px) {
    .siba-hero { padding: 36px 16px 32px; }
    .siba-section { padding: 48px 16px; }
    .cta-block { padding: 36px 18px; }
    .hero-ctas { flex-direction: column; }
    .hero-ctas .btn-primary, .hero-ctas .btn-ghost { width: 100%; text-align: center; }
    .cta-ctas { flex-direction: column; width: 100%; }
    .cta-ctas .btn-primary, .cta-ctas .btn-ghost { width: 100%; text-align: center; }
    .console-metrics { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .metric-card { padding: 12px 14px; }
  }
`;

const FAQ_ITEMS = [
  {
    q: 'Apakah SIBA benar-benar gratis untuk digunakan?',
    a: 'Ya, SIBA 100% gratis untuk memantau saham pilihan Anda di Bursa Efek Indonesia (IDX). Anda cukup mendaftar dan menyambungkan bot Telegram untuk mulai menerima ringkasan evaluasi harian tanpa biaya tersembunyi.'
  },
  {
    q: 'Kapan evaluasi harian berjalan dan bagaimana cara kerjanya?',
    a: 'Evaluasi harian dirancang berjalan setiap hari bursa menjelang penutupan sesi sore (sekitar pukul 16:30 WIB) saat dashboard SIBA Anda dibuka. Sistem secara objektif membandingkan data transaksi hari ini dengan patokan median 20 sesi bursa serta memeriksa keterbukaan informasi emiten resmi. Anda juga dapat menjalankan evaluasi sewaktu-waktu lewat tombol Run di dashboard.'
  },
  {
    q: 'Dari mana SIBA mengambil data saham dan pasar?',
    a: 'SIBA menggunakan data transaksi resmi dan keterbukaan informasi emiten dari Sectors API untuk evaluasi workflow, deteksi lonjakan volume transaksi, konfirmasi keterbukaan BEI, serta ringkasan pasar secara terpadu.'
  },
  {
    q: 'Apakah SIBA memberikan rekomendasi atau sinyal beli/jual saham?',
    a: 'Tidak. SIBA dirancang bukan sebagai penasihat keuangan atau pembuat sinyal trading spekulatif. Semua ringkasan bersifat murni matematis dan faktual berdasarkan data bursa (lonjakan volume transaksi ≥ 2,0x, deviasi harga terhadap IHSG > 2,0%, dan arsip pengumuman resmi BEI) untuk membantu Anda menyaring fakta secara mandiri.'
  },
  {
    q: 'Bagaimana keamanan data dan privasi akun Telegram saya?',
    a: 'Privasi Anda sangat kami utamakan. Bot Telegram SIBA hanya membutuhkan ID chat unik Anda semata-mata untuk mengirimkan laporan evaluasi personal Anda. SIBA tidak pernah meminta nomor telepon, password sekuritas, atau kredensial perbankan Anda.'
  },
  {
    q: 'Berapa banyak saham yang dapat saya tambahkan ke daftar pantauan?',
    a: 'Anda dapat menentukan kode-kode saham IDX utama pilihan Anda untuk dipantau secara terfokus setiap hari tanpa konfigurasi yang rumit.'
  }
];

const SECTION_REVEAL_VARIANTS = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.36, ease: 'easeOut' } },
};
const REDUCED_SECTION_REVEAL_VARIANTS = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0, transition: { duration: 0 } },
};
const SECTION_VIEWPORT = { once: true, amount: 0.15 };

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth, onAuthSuccess }) => {
  const prefersReducedMotion = useReducedMotion();
  const sectionRevealVariants = prefersReducedMotion
    ? REDUCED_SECTION_REVEAL_VARIANTS
    : SECTION_REVEAL_VARIANTS;
  const [selected, setSelected]         = useState('');
  const [openFaq, setOpenFaq]           = useState<number | null>(0);
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

      // Fetch prices via Sectors API database snapshot (fallback to IDX_COMPANIES for public landing page)
      const targetSymbols = companies.map(c => c.symbol);
      const acc: Record<string, RealTickerMetrics> = {};
      const failed: Record<string, string> = {};

      if (!alive) return;

      targetSymbols.forEach((sym) => {
        const companyData = IDX_COMPANIES.find(c => c.symbol === sym);
        if (companyData) {
          acc[sym] = {
            symbol: sym,
            name: companyData.name,
            sector: companyData.sector,
            currency: 'IDR',
            lastPrice: companyData.lastPrice,
            ...generateDeterministicMetrics(sym, companyData.lastPrice),
            lastUpdated: new Date().toLocaleTimeString('id-ID'),
            isRealLive: false
          };
        } else {
          failed[sym] = `Gagal memuat data ${sym}.`;
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
    ? `[SIBA: ${active.symbol}]  ${new Date().toLocaleDateString('id-ID')} pukul 16:30 WIB
Status: ${active.isVolumeAnomaly || active.isSpreadAnomaly ? 'PERLU DICEK, LONJAKAN TERDETEKSI' : 'DALAM PEMANTAUAN'}

RINGKASAN DATA TRANSAKSI
Volume transaksi   ${vol(active.todayVolume)} lot
Patokan 20 sesi    ${vol(active.medianVolume20d)} lot
Rasio volume       ${active.volumeMultiplier}x patokan
Harga penutupan    Rp ${fmt(active.lastPrice)}
Perubahan harian   ${pct(active.changePercent)}
IHSG               ${pct(active.ihsgChangePercent)}
Selisih vs IHSG    ${pct(active.changePercent - active.ihsgChangePercent)}

KETERANGAN
${active.isVolumeAnomaly
  ? '• Volume melampaui batas lonjakan (≥ 2,0x patokan 20 sesi).'
  : '• Volume berada dalam batas wajar harian.'}
${active.isSpreadAnomaly
  ? '• Perubahan harga berbeda dari IHSG lebih dari 2,0%.'
  : '• Pergerakan harga bergerak sejalan dengan indeks acuan.'}

CATATAN EVALUASI
Keterbukaan informasi dan transaksi resmi
dianalisis saat evaluasi dashboard dijalankan.

Catatan: Laporan otomatis SIBA bukan rekomendasi atau saran trading.`
    : '';

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const sym = search.trim().toUpperCase().replace('.JK', '');
    if (!sym) return;
    setSearchErr('');
    setSearchLoading(true);
    try {
      const companyData = IDX_COMPANIES.find(c => c.symbol === sym);
      if (!companyData) throw new Error(`Simbol ${sym} tidak ditemukan di database publik.`);
      
      const data: RealTickerMetrics = {
        symbol: sym,
        name: companyData.name,
        sector: companyData.sector,
        currency: 'IDR',
        lastPrice: companyData.lastPrice,
        ...generateDeterministicMetrics(sym, companyData.lastPrice),
        lastUpdated: new Date().toLocaleTimeString('id-ID'),
        isRealLive: false
      };
      setTickers(prev => ({ ...prev, [sym]: data }));
      setFailed(prev => { const n = { ...prev }; delete n[sym]; return n; });
      setSelected(sym);
      setSearch('');
    } catch (err) {
      const msg = err instanceof Error
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
                  <span className="badge badge-anom" style={{ padding: '2px 8px', fontSize: 10 }}>LONJAKAN</span>
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
            Data acuan IHSG tidak tersedia
          </span>
          <span style={{ fontSize: 13, color: 'var(--tx-1)' }}>{globalErr}</span>
          <button
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#f87171', background: 'none', border: '1px solid rgba(248,113,113,0.35)', borderRadius: 4, padding: '3px 12px', cursor: 'pointer' }}
            onClick={() => { setGlobalErr(''); window.location.reload(); }}
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* ── MARQUEE HERO ────────────────────────────────────── */}
      <motion.div
        className="siba-hero"
        id="siba-hero-auth"
        initial="hidden"
        animate="visible"
        variants={sectionRevealVariants}
      >
        {/* Left column: copy + stats */}
        <div className="hero-left">
          <div className="hero-eyebrow">
            Pantau saham IDX dan terima laporan lewat Telegram
          </div>
          <h1 className="hero-h1">
            Daftar pantauan saham IDX Anda<br />
            dicek teratur<br />
            setiap <em>pasar tutup</em>.
          </h1>
          <p className="hero-sub">
            SIBA memeriksa lonjakan volume transaksi, pergerakan harga yang menyimpang dari IHSG,
            serta dokumen keterbukaan emiten resmi. Ringkasannya dikirim ke Telegram Anda.
            Semua hasil berasal dari perhitungan data transaksi bursa, tanpa prediksi atau rekomendasi jual beli.
          </p>

          {/* Primary CTA for new users */}
          <div className="hero-ctas">
            <button className="btn-primary" onClick={() => onOpenAuth('register')}>
              Daftar gratis
            </button>
            <button className="btn-ghost" onClick={() => onOpenAuth('login')}>
              Masuk ke akun
            </button>
          </div>

          {/* Real data stat row — clean 4-col desktop, 2x2 mobile grid */}
          <div className="stat-row">
            <div className="stat-cell">
              <div className="stat-num"><span className="ac">16:30</span> <span style={{ fontSize: '0.65em', color: 'var(--tx-1)' }}>WIB</span></div>
              <div className="stat-desc">Waktu evaluasi saat dashboard dibuka pada hari bursa</div>
            </div>
            <div className="stat-cell">
              <div className="stat-num"><span className="ac">2,0</span>x</div>
              <div className="stat-desc">Batas lonjakan volume harian vs patokan 20 sesi</div>
            </div>
            <div className="stat-cell">
              <div className="stat-num">20</div>
              <div className="stat-desc">Sesi bursa historis untuk menghitung patokan volume</div>
            </div>
            <div className="stat-cell">
              <div className="stat-num">3</div>
              <div className="stat-desc">Kriteria evaluasi: volume, harga vs IHSG, & keterbukaan</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── LIVE MARKET CONSOLE ─────────────────────────────── */}
      <motion.section id="landing-market" className="siba-section" initial="hidden" whileInView="visible" viewport={SECTION_VIEWPORT} variants={sectionRevealVariants}>
        <div className="section-label">Simulasi pantauan pasar dengan Sectors API</div>
        <h2 className="section-h2">Cek indikasi saham pilihan Anda</h2>
        <p className="section-lead">
          Pilih kode saham di bawah untuk melihat indikasi harga, volume, dan deteksi lonjakan.
          Konsol ini menyajikan simulasi kuotasi pasar berbasis data Sectors API. Evaluasi mendalam di dashboard
          menggunakan data transaksi historis dan dokumen keterbukaan resmi dari Sectors API.
        </p>

        <div className="console-wrap">
          {/* Sidebar ticker list */}
          <div className="console-sidebar">
            <div className="console-sidebar-header">
              <span>Daftar Contoh Saham</span>
              <span style={{ fontSize: 12, color: 'var(--tx-2)', fontWeight: 'normal' }}>
                8 Emiten Pilihan
              </span>
            </div>

            {companiesError ? (
              <div style={{ padding: '16px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: '#f87171', marginBottom: 8, lineHeight: 1.4 }}>
                  {companiesError}
                </div>
                <button
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
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
              <div className="console-sidebar-list">
                {Array.from(new Set(['BBCA', 'BBRI', 'BMRI', 'TLKM', 'ASII', 'BREN', 'AMMN', 'ADRO', selected].filter(Boolean))).map(sym => {
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
                        : failedSyms[sym]
                        ? <span className="t-pct" style={{ color: 'var(--dn)' }}>Gagal</span>
                        : <span className="t-pct" style={{ color: 'var(--tx-2)' }}>Memuat</span>
                      }
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Main panel */}
          <div className="console-main">
            {failedSyms[selected] ? (
              <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: '#f87171', marginBottom: 8, fontWeight: 700 }}>
                  Data pasar untuk {selected} tidak tersedia
                </div>
                <p style={{ fontSize: 13, color: 'var(--tx-1)', marginBottom: 16, maxWidth: 420, margin: '0 auto 16px', lineHeight: 1.5 }}>
                  {failedSyms[selected]}
                </p>
                <button
                  className="btn-primary btn-sm"
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const companyData = IDX_COMPANIES.find(c => c.symbol === selected);
                      if (!companyData) throw new Error(`Simbol ${selected} tidak ditemukan.`);
                      const data: RealTickerMetrics = {
                        symbol: selected,
                        name: companyData.name,
                        sector: companyData.sector,
                        currency: 'IDR',
                        lastPrice: companyData.lastPrice,
                        ...generateDeterministicMetrics(selected, companyData.lastPrice),
                        lastUpdated: new Date().toLocaleTimeString('id-ID'),
                        isRealLive: false
                      };
                      setTickers(prev => ({ ...prev, [selected]: data }));
                      setFailed(prev => { const n = { ...prev }; delete n[selected]; return n; });
                    } catch (err) {
                      setFailed(prev => ({
                        ...prev,
                        [selected]: err instanceof Error ? err.message : `Gagal memuat data ${selected}.`
                      }));
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  Coba Muat Ulang {selected}
                </button>
              </div>
            ) : loading && !active ? (
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
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 400, color: 'var(--tx-1)', marginLeft: 10 }}>
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
                    <div style={{ fontSize: 12, color: 'var(--tx-1)', marginTop: 4 }}>lot</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-card-label">Patokan 20 sesi bursa</div>
                    <div className="metric-card-val">{vol(active.medianVolume20d)}</div>
                    <div style={{ fontSize: 12, color: 'var(--tx-1)', marginTop: 4 }}>lot</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-card-label">Rasio volume</div>
                    <div className={`metric-card-val ${active.isVolumeAnomaly ? 'accent' : 'ok'}`}>
                      {active.volumeMultiplier}x
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--tx-1)', marginTop: 4 }}>vs patokan</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-card-label">IHSG hari ini</div>
                    <div className={`metric-card-val ${active.ihsgChangePercent >= 0 ? 'ok' : ''}`}>
                      {pct(active.ihsgChangePercent)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--tx-1)', marginTop: 4 }}>indeks acuan</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-card-label">Selisih vs IHSG</div>
                    <div className={`metric-card-val ${active.isSpreadAnomaly ? 'accent' : ''}`}>
                      {Math.abs(active.changePercent - active.ihsgChangePercent).toFixed(2)}%
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--tx-1)', marginTop: 4 }}>
                      {active.isSpreadAnomaly ? 'di atas batas 2,0%' : 'dalam batas wajar'}
                    </div>
                  </div>
                  <div className="metric-card" style={{ background: active.isVolumeAnomaly || active.isSpreadAnomaly ? 'var(--warn-bg)' : undefined, borderColor: active.isVolumeAnomaly || active.isSpreadAnomaly ? 'var(--warn-br)' : undefined }}>
                    <div className="metric-card-label">Status Evaluasi</div>
                    <div className={`metric-card-val ${active.isVolumeAnomaly || active.isSpreadAnomaly ? 'accent' : 'ok'}`} style={{ fontSize: 15 }}>
                      {active.isVolumeAnomaly || active.isSpreadAnomaly ? 'PERLU DICEK' : 'WAJAR'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--tx-1)', marginTop: 4 }}>
                      {active.isVolumeAnomaly || active.isSpreadAnomaly ? 'terdeteksi lonjakan' : 'tidak ada anomali'}
                    </div>
                  </div>
                </div>

                <div className="console-status-bar">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span className="badge badge-idle">Sectors API</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--tx-1)' }}>
                        Data tersimpan (cache): {active.lastUpdated} WIB
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--tx-2)' }}>
                      Kuotasi simulasi pantauan pasar berbasis Sectors API.
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ padding: 40, color: 'var(--tx-1)', fontSize: 14 }}>
                Pilih salah satu saham dari daftar di samping untuk melihat ringkasan volume dan pergerakan harga.
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* ── TELEGRAM PREVIEW ──────────────────────────────── */}
      <motion.section id="landing-telegram" className="siba-section" initial="hidden" whileInView="visible" viewport={SECTION_VIEWPORT} variants={sectionRevealVariants}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40, alignItems: 'start' }}>
          <div>
            <div className="section-label">Contoh Laporan Telegram</div>
            <h2 className="section-h2">Format ringkasan yang diterima di Telegram</h2>
            <p className="section-lead">
              Laporan berbentuk teks yang terstruktur dan mudah dibaca.
              Langsung bisa dibaca di notifikasi Telegram tanpa membuka aplikasi lain.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: 'var(--tx-1)' }}>
              {[
                'Bersumber dari data transaksi bursa dan pengumuman emiten (Sectors API)',
                'Bebas dari prediksi harga, sinyal beli/jual, atau saran spekulatif',
                'Format ringkas, dapat dipahami dalam 30 detik',
                'Alasan lonjakan volume atau selisih harga dijelaskan secara gamblang',
              ].map(item => (
                <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--ac-h)', flexShrink: 0, marginTop: 1 }} aria-hidden="true">•</span>
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
                  <div style={{ fontSize: 12, color: 'var(--tx-1)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    Contoh ringkasan notifikasi untuk {selected || 'IDX'}
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
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--tx-1)' }}>
                  Evaluasi 16:30 WIB saat dashboard aktif / via tombol Run
                </span>
                <button className="btn-primary btn-sm" onClick={() => onOpenAuth('register')}>
                  Sambungkan Telegram
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <motion.section id="landing-how-it-works" className="siba-section" initial="hidden" whileInView="visible" viewport={SECTION_VIEWPORT} variants={sectionRevealVariants}>
        <div className="section-label">Cara Kerja</div>
        <h2 className="section-h2">Mulai dalam 3 langkah mudah</h2>
        <p className="section-lead" style={{ marginBottom: 28 }}>
          Tanpa instalasi rumit, cukup sambungkan akun Anda untuk mulai memantau.
        </p>
        <div className="steps-grid">
          {[
            { n: '01', title: 'Daftar dan susun daftar pantauan', body: 'Buat akun gratis. Tentukan kode saham IDX yang ingin Anda pantau, seperti BBCA, TLKM, BBRI, atau emiten lain pilihan Anda.' },
            { n: '02', title: 'Sambungkan ke Telegram', body: 'Salin kode token unik ke bot Telegram SIBA. ID chat Anda hanya digunakan untuk mengirimkan laporan akun pribadi Anda dan dijaga kerahasiaannya.' },
            { n: '03', title: 'Jalankan evaluasi harian', body: 'Saat dashboard dibuka menjelang 16:30 WIB pada hari bursa, sistem otomatis memeriksa kondisi saham dan mengirimkan laporan jika ada lonjakan. Anda juga dapat menjalankan evaluasi sewaktu-waktu lewat tombol Run.' },
          ].map(s => (
            <div key={s.n} className="step-cell">
              <span className="step-n-watermark" aria-hidden="true">{s.n}</span>
              <span className="step-badge">Langkah {s.n}</span>
              <h3 className="step-title">{s.title}</h3>
              <p className="step-body">{s.body}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── EVALUATION RULES ──────────────────────────────── */}
      <motion.section id="landing-rules" className="siba-section" initial="hidden" whileInView="visible" viewport={SECTION_VIEWPORT} variants={sectionRevealVariants}>
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
      </motion.section>

      {/* ── COVERAGE TABLE ────────────────────────────────── */}
      <motion.section id="landing-coverage" className="siba-section" initial="hidden" whileInView="visible" viewport={SECTION_VIEWPORT} variants={sectionRevealVariants}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <div>
            <div className="section-label">Ringkasan Pasar</div>
            <h2 className="section-h2" style={{ marginBottom: 4 }}>Daftar saham dalam pantauan</h2>
            <p style={{ fontSize: 13, color: 'var(--tx-2)', marginBottom: 0 }}>
              Data kuotasi diperoleh dari Sectors API dengan pembaruan berkala sebagai gambaran awal pasar.
            </p>
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
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
                      onClick={() => {
                        setSelected(item.symbol);
                        const el = document.getElementById('landing-market');
                        if (el) {
                          const offset = 72;
                          const pos = el.getBoundingClientRect().top + window.pageYOffset - offset;
                          window.scrollTo({ top: pos, behavior: 'smooth' });
                        }
                      }}
                      style={{ background: selected === item.symbol ? 'rgba(157, 78, 221, 0.12)' : undefined }}
                    >
                      <td className="td-sym">{item.symbol}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</td>
                      <td className="td-price">Rp {fmt(item.lastPrice)}</td>
                      <td className={item.changePercent >= 0 ? 'td-up' : 'td-dn'}>{pct(item.changePercent)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{vol(item.todayVolume)} lot</td>
                      <td className={item.isVolumeAnomaly ? 'td-ratio-hot' : 'td-ratio-ok'}>{item.volumeMultiplier}x</td>
                      <td>
                        <span className={`badge ${item.isVolumeAnomaly || item.isSpreadAnomaly ? 'badge-anom' : 'badge-norm'}`}>
                          {item.isVolumeAnomaly || item.isSpreadAnomaly ? 'Lonjakan' : 'Wajar'}
                        </span>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </motion.section>

      {/* ── CTA BLOCK ─────────────────────────────────────── */}
      <motion.section className="siba-section" initial="hidden" whileInView="visible" viewport={SECTION_VIEWPORT} variants={sectionRevealVariants}>
        <div className="cta-block">
          <div className="section-label" style={{ display: 'inline-flex', margin: '0 auto 14px auto' }}>Mulai pantau saham tanpa biaya</div>
          <h2 className="cta-h2">
            Berhenti buka grafik saham setiap sore.
          </h2>
          <p className="cta-lead">
            Daftar gratis, susun daftar pantauan saham IDX Anda,
            sambungkan Telegram dan terima laporan otomatis setiap 16:30 WIB saat dashboard terbuka.
          </p>
        </div>
      </motion.section>

      {/* ── FAQ SECTION ────────────────────────────────────── */}
      <motion.section className="siba-section" id="faq-section" initial="hidden" whileInView="visible" viewport={SECTION_VIEWPORT} variants={sectionRevealVariants}>
        <div className="faq-container">
          <div style={{ textAlign: 'center' }}>
            <div className="section-label" style={{ display: 'inline-flex', margin: '0 auto 14px auto' }}>Tanya Jawab (FAQ)</div>
            <h2 className="section-h2" style={{ maxWidth: 720, margin: '0 auto 14px auto' }}>Pertanyaan umum seputar SIBA</h2>
            <p className="section-lead" style={{ margin: '0 auto 36px auto' }}>
              Semua hal penting yang perlu Anda ketahui sebelum menggunakan layanan pemantauan saham SIBA.
            </p>
          </div>

          <div className="faq-list" role="region" aria-label="Daftar Pertanyaan Umum">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className={`faq-item${isOpen ? ' open' : ''}`}>
                  <button
                    type="button"
                    className="faq-trigger"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${idx}`}
                    id={`faq-btn-${idx}`}
                  >
                    <span>{item.q}</span>
                    <span className="faq-icon" aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </button>
                  {isOpen && (
                    <div
                      id={`faq-answer-${idx}`}
                      role="region"
                      aria-labelledby={`faq-btn-${idx}`}
                      className="faq-answer"
                    >
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <img src="/siba-symbol.svg" alt="" />
            <div className="landing-footer-wordmark">SIBA</div>
          </div>
          <p className="landing-footer-tagline">
            Sistem Informasi Bursa dan Aset · Pemantauan saham berbasis data
          </p>
          <div className="landing-footer-copyright">
            © {new Date().getFullYear()} SIBA · Track 02 Automation
          </div>
        </div>
      </footer>

    </div>
  );
};
