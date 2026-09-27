import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Eye, EyeOff, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { signInWithGoogle } from '../../../utils/googleAuth';
import { supabase } from '../../../lib/supabaseClient';

interface InlineAuthPanelProps {
  onAuthSuccess: (userData: { name: string; email: string; avatar?: string }) => void;
  initialView?: 'login' | 'register';
}

type PanelView = 'login' | 'register' | 'forgot' | 'forgot-sent' | 'confirm-email';

/* ── Google SVG ─────────────────────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
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
    style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}
  >
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
    <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const InlineAuthPanel: React.FC<InlineAuthPanelProps> = ({
  onAuthSuccess,
  initialView = 'register',
}) => {
  const [view, setView] = useState<PanelView>(initialView);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const clearForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setForgotEmail('');
    setError(null);
    setShowPass(false);
  };

  const switchView = (v: PanelView) => {
    setError(null);
    setView(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Masukkan alamat email yang valid.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }
    setFormLoading(true);
    setError(null);

    const fallbackName = email.trim().split('@')[0];
    const resolvedName = name.trim() || fallbackName;

    try {
      if (view === 'register') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              name: resolvedName,
              full_name: resolvedName,
            },
          },
        });

        if (signUpError) {
          if (signUpError.message.includes('User already registered')) {
            setError('Email sudah terdaftar. Silakan beralih ke tab Masuk.');
          } else {
            setError(signUpError.message);
          }
          setFormLoading(false);
          return;
        }

        if (!data.session) {
          setView('confirm-email');
          setFormLoading(false);
          return;
        }

        onAuthSuccess({
          name: resolvedName,
          email: email.trim(),
          avatar: undefined,
        });
        clearForm();
      } else {
        // Supabase sign-in with password
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            setError('Email atau kata sandi salah. Jika akun Anda terdaftar lewat Google, gunakan tombol "Lanjutkan dengan Google".');
          } else if (signInError.message.includes('Email not confirmed')) {
            setError('Email belum dikonfirmasi. Periksa kotak masuk email Anda.');
          } else {
            setError(signInError.message);
          }
          setFormLoading(false);
          return;
        }

        const user = data.user;
        const displayName =
          user?.user_metadata?.full_name ||
          user?.user_metadata?.name ||
          resolvedName;

        onAuthSuccess({
          name: displayName,
          email: email.trim(),
          avatar: user?.user_metadata?.avatar_url || user?.user_metadata?.picture || undefined,
        });
        clearForm();
      }
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan saat otentikasi. Silakan coba lagi.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setError('Masukkan alamat email yang valid.');
      return;
    }
    setFormLoading(true);
    setError(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        forgotEmail.trim(),
        {
          redirectTo: `${window.location.origin}/`,
        }
      );
      if (resetError) {
        setError(resetError.message);
      } else {
        setView('forgot-sent');
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal mengirim email reset kata sandi.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      const msg: string = err?.message || '';
      if (msg.includes('Client ID') || msg.includes('client_id')) {
        setError('Konfigurasi Google OAuth belum diatur. Hubungi administrator.');
      } else if (msg.includes('network') || msg.includes('fetch') || msg.includes('Failed to fetch')) {
        setError('Tidak ada koneksi internet. Periksa jaringan Anda.');
      } else {
        setError('Gagal masuk dengan Google. Silakan coba lagi.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const isRegister = view === 'register';

  return (
    <div
      style={{
        background: 'linear-gradient(165deg, rgba(13,20,36,0.96) 0%, rgba(8,13,24,0.98) 100%)',
        border: '1px solid #1e2d45',
        borderRadius: 16,
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        backdropFilter: 'blur(16px)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(20,184,166,0.06)',
        maxWidth: 410,
        width: '100%',
        position: 'relative',
      }}
    >
      {/* Top accent glow line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: 'linear-gradient(90deg, transparent 0%, #14b8a6 40%, #2dd4bf 60%, transparent 100%)',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          opacity: 0.8,
        }}
      />

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 10,
              fontWeight: 700,
              color: '#2dd4bf',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            {view === 'forgot' || view === 'forgot-sent'
              ? 'Reset Kata Sandi'
              : view === 'confirm-email'
              ? 'Aktivasi Akun'
              : isRegister
              ? 'Mulai Gratis'
              : 'Masuk ke Akun'}
          </div>
          {(view === 'forgot' || view === 'forgot-sent' || view === 'confirm-email') && (
            <button
              type="button"
              onClick={() => switchView('login')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#8b9abf',
                fontSize: 11,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#2dd4bf')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#8b9abf')}
            >
              <ArrowLeft size={12} /> Kembali
            </button>
          )}
        </div>
        <div
          style={{
            fontSize: 19,
            fontWeight: 800,
            color: '#f0f4ff',
            letterSpacing: '-0.02em',
            lineHeight: 1.25,
            marginBottom: 4,
          }}
        >
          {view === 'forgot'
            ? 'Lupa kata sandi Anda?'
            : view === 'forgot-sent'
            ? 'Tautan reset terkirim'
            : view === 'confirm-email'
            ? 'Verifikasi email Anda'
            : isRegister
            ? 'Pantau saham IDX — otomatis'
            : 'Selamat datang kembali'}
        </div>
        <div style={{ fontSize: 12, color: '#8b9abf', lineHeight: 1.5 }}>
          {view === 'forgot'
            ? 'Ketik email terdaftar untuk menerima tautan pemulihan kata sandi.'
            : view === 'forgot-sent'
            ? 'Cek folder Inbox atau Spam untuk instruksi reset kata sandi.'
            : view === 'confirm-email'
            ? 'Klik tautan konfirmasi di email Anda lalu masuk ke dashboard.'
            : isRegister
            ? 'Daftar dengan email atau Google untuk menerima alert anomali harian.'
            : 'Masuk untuk mengelola watchlist dan riwayat temuan anomali.'}
        </div>
      </div>

      {/* Tabs Switcher (Masuk / Daftar) */}
      {(view === 'login' || view === 'register') && (
        <div
          style={{
            display: 'flex',
            gap: 4,
            marginBottom: 16,
            background: '#060c1a',
            borderRadius: 10,
            padding: 3,
            border: '1px solid #1e2d45',
          }}
        >
          <button
            type="button"
            onClick={() => switchView('login')}
            style={{
              flex: 1,
              padding: '7px 0',
              borderRadius: 7,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
              transition: 'all 160ms ease',
              background: view === 'login' ? 'linear-gradient(135deg, #14b8a6, #2dd4bf)' : 'transparent',
              color: view === 'login' ? '#040710' : '#8b9abf',
              boxShadow: view === 'login' ? '0 2px 10px rgba(20,184,166,0.25)' : 'none',
            }}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => switchView('register')}
            style={{
              flex: 1,
              padding: '7px 0',
              borderRadius: 7,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
              transition: 'all 160ms ease',
              background: view === 'register' ? 'linear-gradient(135deg, #14b8a6, #2dd4bf)' : 'transparent',
              color: view === 'register' ? '#040710' : '#8b9abf',
              boxShadow: view === 'register' ? '0 2px 10px rgba(20,184,166,0.25)' : 'none',
            }}
          >
            Daftar Gratis
          </button>
        </div>
      )}

      {/* Error box */}
      {error && (
        <div
          style={{
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.25)',
            borderRadius: 8,
            padding: '9px 12px',
            fontSize: 12,
            color: '#f87171',
            marginBottom: 14,
            lineHeight: 1.45,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
          }}
        >
          <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* ── Confirm Email State ── */}
      {view === 'confirm-email' && (
        <div style={{ textAlign: 'center', padding: '12px 0 6px' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(20,184,166,0.1)',
              border: '2px solid rgba(20,184,166,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <CheckCircle2 size={26} color="#2dd4bf" strokeWidth={1.75} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff', marginBottom: 6 }}>
            Periksa Email Konfirmasi
          </div>
          <div style={{ fontSize: 12, color: '#8b9abf', lineHeight: 1.5, marginBottom: 16 }}>
            Kami mengirim tautan aktivasi ke <span style={{ color: '#2dd4bf', fontWeight: 600 }}>{email}</span>.
            Klik tautan tersebut, lalu kembali ke sini untuk masuk.
          </div>
          <button
            type="button"
            onClick={() => {
              clearForm();
              switchView('login');
            }}
            style={{
              width: '100%',
              padding: '11px 0',
              background: 'linear-gradient(135deg, #14b8a6, #2dd4bf)',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              color: '#040710',
              boxShadow: '0 4px 16px rgba(20,184,166,0.25)',
            }}
          >
            Buka Halaman Masuk
          </button>
        </div>
      )}

      {/* ── Forgot Sent State ── */}
      {view === 'forgot-sent' && (
        <div style={{ textAlign: 'center', padding: '12px 0 6px' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(20,184,166,0.1)',
              border: '2px solid rgba(20,184,166,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <CheckCircle2 size={26} color="#2dd4bf" strokeWidth={1.75} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff', marginBottom: 6 }}>
            Tautan Berhasil Dikirim
          </div>
          <div style={{ fontSize: 12, color: '#8b9abf', lineHeight: 1.5, marginBottom: 16 }}>
            Tautan reset kata sandi telah dikirim ke <span style={{ color: '#2dd4bf', fontWeight: 600 }}>{forgotEmail}</span>.
          </div>
          <button
            type="button"
            onClick={() => {
              clearForm();
              switchView('login');
            }}
            style={{
              width: '100%',
              padding: '11px 0',
              background: 'linear-gradient(135deg, #14b8a6, #2dd4bf)',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              color: '#040710',
              boxShadow: '0 4px 16px rgba(20,184,166,0.25)',
            }}
          >
            Kembali ke Masuk
          </button>
        </div>
      )}

      {/* ── Forgot Form ── */}
      {view === 'forgot' && (
        <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#8b9abf', marginBottom: 5 }}>
              Email Terdaftar
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4a5a82', pointerEvents: 'none' }} />
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => {
                  setForgotEmail(e.target.value);
                  setError(null);
                }}
                placeholder="nama@email.com"
                required
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 34px',
                  background: '#060c1a',
                  border: '1px solid #1e2d45',
                  borderRadius: 10,
                  fontSize: 13,
                  color: '#f0f4ff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#14b8a6')}
                onBlur={(e) => (e.target.style.borderColor = '#1e2d45')}
                autoFocus
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={formLoading}
            style={{
              width: '100%',
              padding: '11px 0',
              marginTop: 4,
              background: formLoading ? '#1e2d45' : 'linear-gradient(135deg, #14b8a6, #2dd4bf)',
              border: 'none',
              borderRadius: 10,
              cursor: formLoading ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 700,
              color: formLoading ? '#8b9abf' : '#040710',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: formLoading ? 'none' : '0 4px 18px rgba(20,184,166,0.25)',
              transition: 'all 160ms',
            }}
          >
            {formLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Spinner /> Mengirim...
              </span>
            ) : (
              'Kirim Tautan Reset'
            )}
          </button>
        </form>
      )}

      {/* ── Login / Register Form ── */}
      {(view === 'login' || view === 'register') && (
        <>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {/* Name field (register only) */}
            {view === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#8b9abf', marginBottom: 5 }}>
                  Nama Lengkap
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4a5a82', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError(null);
                    }}
                    placeholder="Contoh: Budi Santoso"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 34px',
                      background: '#060c1a',
                      border: '1px solid #1e2d45',
                      borderRadius: 10,
                      fontSize: 13,
                      color: '#f0f4ff',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#14b8a6')}
                    onBlur={(e) => (e.target.style.borderColor = '#1e2d45')}
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Email field */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#8b9abf', marginBottom: 5 }}>
                Alamat Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4a5a82', pointerEvents: 'none' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="nama@email.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 34px',
                    background: '#060c1a',
                    border: '1px solid #1e2d45',
                    borderRadius: 10,
                    fontSize: 13,
                    color: '#f0f4ff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#14b8a6')}
                  onBlur={(e) => (e.target.style.borderColor = '#1e2d45')}
                  autoFocus={view === 'login'}
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#8b9abf' }}>Kata Sandi</label>
                {view === 'login' && (
                  <button
                    type="button"
                    onClick={() => switchView('forgot')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#4a5a82',
                      padding: 0,
                      transition: 'color 140ms',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#2dd4bf')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#4a5a82')}
                  >
                    Lupa sandi?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4a5a82', pointerEvents: 'none' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Minimal 6 karakter"
                  style={{
                    width: '100%',
                    padding: '10px 34px 10px 34px',
                    background: '#060c1a',
                    border: '1px solid #1e2d45',
                    borderRadius: 10,
                    fontSize: 13,
                    color: '#f0f4ff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#14b8a6')}
                  onBlur={(e) => (e.target.style.borderColor = '#1e2d45')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#4a5a82',
                    padding: 2,
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'color 140ms',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#2dd4bf')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#4a5a82')}
                  aria-label={showPass ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {/* Password strength for register */}
              {view === 'register' && password.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 3 }}>
                    {[1, 2, 3, 4].map((i) => {
                      const score = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^a-zA-Z0-9]/.test(password)].filter(Boolean).length;
                      const colors = ['', '#f87171', '#fbbf24', '#34d399', '#2dd4bf'];
                      return (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            height: 3,
                            borderRadius: 2,
                            background: i <= score ? colors[score] : '#1e2d45',
                            transition: 'background 200ms',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={formLoading}
              style={{
                width: '100%',
                padding: '11px 0',
                marginTop: 4,
                background: formLoading ? '#1e2d45' : 'linear-gradient(135deg, #14b8a6, #2dd4bf)',
                border: 'none',
                borderRadius: 10,
                cursor: formLoading ? 'not-allowed' : 'pointer',
                fontSize: 13,
                fontWeight: 800,
                color: formLoading ? '#8b9abf' : '#040710',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: formLoading ? 'none' : '0 4px 20px rgba(20,184,166,0.25)',
                transition: 'all 160ms',
              }}
            >
              {formLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Spinner />
                  Memproses...
                </span>
              ) : (
                <>
                  <span>{view === 'login' ? 'Masuk ke Dashboard' : 'Daftar Akun & Mulai'}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              margin: '14px 0 12px',
            }}
          >
            <div style={{ flex: 1, height: 1, background: '#1e2d45' }} />
            <span style={{ fontSize: 10, color: '#4a5a82', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              atau
            </span>
            <div style={{ flex: 1, height: 1, background: '#1e2d45' }} />
          </div>

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: googleLoading ? 'rgba(255,255,255,0.04)' : '#fff',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10,
              cursor: googleLoading ? 'not-allowed' : 'pointer',
              fontSize: 13,
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
            aria-label={isRegister ? 'Daftar dengan Google' : 'Masuk dengan Google'}
          >
            {googleLoading ? <Spinner /> : <GoogleIcon />}
            <span>{googleLoading ? 'Menghubungkan...' : 'Lanjutkan dengan Google'}</span>
          </button>

          {/* Trust badges */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              marginTop: 14,
              fontSize: 11,
              color: '#4a5a82',
            }}
          >
            <ShieldCheck size={13} color="#14b8a6" strokeWidth={2} />
            <span>Data & watchlist tersimpan aman terenkripsi.</span>
          </div>
        </>
      )}
    </div>
  );
};
