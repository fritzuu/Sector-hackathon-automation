import React, { useState } from 'react';
import { signInWithGoogle, GOOGLE_CANCELLED } from '../../../utils/googleAuth';

interface InlineAuthPanelProps {
  onAuthSuccess: (userData: { name: string; email: string; avatar?: string }) => void;
  initialView?: 'login' | 'register';
}

/* ── Google SVG (inline, no external icon dep) ──────────────────────────── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path
      d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      fill="#4285F4"
    />
    <path
      d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      fill="#34A853"
    />
    <path
      d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
      fill="#FBBC05"
    />
    <path
      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
      fill="#EA4335"
    />
  </svg>
);

/* ── Spinner ────────────────────────────────────────────────────────────── */
const Spinner = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    style={{ animation: 'spin 0.8s linear infinite' }}
  >
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
    <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </svg>
);

export const InlineAuthPanel: React.FC<InlineAuthPanelProps> = ({
  onAuthSuccess,
  initialView = 'register',
}) => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleCancelled, setGoogleCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setError(null);
    setGoogleCancelled(false);
    setGoogleLoading(true);
    try {
      const userData = await signInWithGoogle();
      onAuthSuccess(userData);
    } catch (err: any) {
      if (err?.name === GOOGLE_CANCELLED || err?.message === GOOGLE_CANCELLED) {
        setGoogleCancelled(true);
      } else {
        const msg: string = err?.message || '';
        if (msg.includes('Client ID') || msg.includes('client_id')) {
          setError('Konfigurasi Google OAuth belum diatur. Hubungi administrator.');
        } else if (msg.includes('popup') || msg.includes('blocked')) {
          setError('Popup diblokir browser. Izinkan popup lalu coba lagi.');
        } else if (msg.includes('network') || msg.includes('fetch') || msg.includes('Failed to fetch')) {
          setError('Tidak ada koneksi internet. Periksa jaringan Anda.');
        } else {
          setError('Gagal masuk dengan Google. Silakan coba lagi.');
        }
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const isRegister = initialView === 'register';

  return (
    <div
      style={{
        background: 'rgba(13,20,36,0.92)',
        border: '1px solid #1e2d45',
        borderRadius: 16,
        padding: '32px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        backdropFilter: 'blur(12px)',
        maxWidth: 400,
        width: '100%',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 10,
            fontWeight: 700,
            color: '#2dd4bf',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          {isRegister ? 'Mulai Gratis' : 'Masuk ke Akun'}
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: '#f0f4ff',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            marginBottom: 6,
          }}
        >
          {isRegister ? 'Pantau saham IDX Anda — otomatis' : 'Selamat kembali'}
        </div>
        <div style={{ fontSize: 13, color: '#8b9abf', lineHeight: 1.55 }}>
          {isRegister
            ? 'Daftar dengan Google dan mulai dalam 30 detik.'
            : 'Masuk untuk melihat pantauan dan laporan Anda.'}
        </div>
      </div>

      {/* Error box */}
      {error && (
        <div
          style={{
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.25)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
            color: '#f87171',
            marginBottom: 16,
            lineHeight: 1.5,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
          }}
        >
          <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Cancelled hint */}
      {googleCancelled && !error && (
        <div
          style={{
            background: 'rgba(251,191,36,0.06)',
            border: '1px solid rgba(251,191,36,0.22)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
            color: '#fbbf24',
            marginBottom: 16,
            lineHeight: 1.5,
          }}
        >
          Anda membatalkan login Google. Klik tombol di bawah untuk mencoba lagi.
        </div>
      )}

      {/* Google button */}
      <button
        onClick={handleGoogle}
        disabled={googleLoading}
        style={{
          width: '100%',
          padding: '13px 20px',
          background: googleLoading ? 'rgba(255,255,255,0.04)' : '#fff',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10,
          cursor: googleLoading ? 'not-allowed' : 'pointer',
          fontSize: 14,
          fontWeight: 600,
          color: googleLoading ? '#8b9abf' : '#111827',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          transition: 'all 140ms ease',
          opacity: googleLoading ? 0.7 : 1,
        }}
        onMouseOver={(e) => {
          if (!googleLoading) {
            (e.currentTarget as HTMLButtonElement).style.background = '#f5f5f5';
          }
        }}
        onMouseOut={(e) => {
          if (!googleLoading) {
            (e.currentTarget as HTMLButtonElement).style.background = '#fff';
          }
        }}
        aria-label={googleCancelled ? 'Coba lagi dengan Google' : isRegister ? 'Daftar dengan Google' : 'Masuk dengan Google'}
      >
        {googleLoading ? <Spinner /> : <GoogleIcon />}
        <span>
          {googleLoading
            ? 'Menghubungkan...'
            : googleCancelled
            ? 'Coba lagi dengan Google'
            : isRegister
            ? 'Daftar dengan Google'
            : 'Masuk dengan Google'}
        </span>
      </button>

      {/* Divider */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          margin: '20px 0',
        }}
      >
        <div style={{ flex: 1, height: 1, background: '#1e2d45' }} />
        <span style={{ fontSize: 11, color: '#4a5a82', fontWeight: 600, letterSpacing: '0.06em' }}>
          AMAN & CEPAT
        </span>
        <div style={{ flex: 1, height: 1, background: '#1e2d45' }} />
      </div>

      {/* Trust badges */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {[
          'Tidak ada kata sandi yang disimpan',
          'Data Anda tidak dijual ke pihak ketiga',
          'OAuth 2.0 via Supabase — standar industri',
        ].map((text) => (
          <div
            key={text}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              color: '#4a5a82',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="6" stroke="#14b8a6" strokeWidth="1.5" strokeOpacity="0.5" />
              <path d="M4.5 7l2 2 3-3" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
