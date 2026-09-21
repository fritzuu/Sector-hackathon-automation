import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, ArrowRight, ShieldCheck, Eye, EyeOff, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onAuthSuccess: (userData: { name: string; email: string }) => void;
}

type ModalView = 'login' | 'register' | 'forgot' | 'forgot-sent';

const INPUT_BASE =
  'w-full pl-10 pr-10 py-3 bg-[#060c1a] border border-[#1e2d45] rounded-xl text-sm text-[#f0f4ff] placeholder-[#4a5a82] focus:outline-none focus:border-teal-500/70 focus:ring-2 focus:ring-teal-500/10 transition-all duration-200';

const FIELD_ICON = 'w-4 h-4 text-[#4a5a82] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onAuthSuccess,
}) => {
  const [view, setView] = useState<ModalView>(initialMode);
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  // Sync view when initialMode changes (e.g. parent opens in 'register')
  useEffect(() => {
    if (isOpen) {
      setView(initialMode);
      setError(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const clearForm = () => {
    setName(''); setEmail(''); setPassword('');
    setForgotEmail(''); setError(null); setShowPass(false);
  };

  const switchView = (v: ModalView) => {
    setError(null);
    setView(v);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (view === 'register' && !name.trim()) {
      setError('Masukkan nama lengkap Anda.'); return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Masukkan alamat email yang valid.'); return;
    }
    if (!password || password.length < 6) {
      setError('Kata sandi minimal 6 karakter.'); return;
    }
    setLoading(true);
    // Simulate async (in real app would call API)
    setTimeout(() => {
      setLoading(false);
      onAuthSuccess({
        name: view === 'register' ? name.trim() : email.split('@')[0],
        email: email.trim(),
      });
      clearForm();
      onClose();
    }, 600);
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setError('Masukkan alamat email yang valid.'); return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setView('forgot-sent');
    }, 800);
  };

  const handleGoogleQuick = () => {
    onAuthSuccess({ name: 'Investor SIBA', email: 'investor@gmail.com' });
    clearForm();
    onClose();
  };

  const titles: Record<ModalView, { heading: string; sub: string }> = {
    login:        { heading: 'Masuk ke SIBA',            sub: 'Pantau saham pilihanmu otomatis setiap hari bursa.' },
    register:     { heading: 'Buat Akun Gratis',         sub: 'Mulai pantau aset IDX tanpa analisa teknikal.' },
    forgot:       { heading: 'Lupa Kata Sandi',          sub: 'Kami kirim tautan reset ke email kamu.' },
    'forgot-sent':{ heading: 'Email Terkirim',           sub: '' },
  };

  const { heading, sub } = titles[view];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(4,7,16,0.85)', backdropFilter: 'blur(18px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) { clearForm(); onClose(); } }}
    >
      <div
        className="relative w-full max-w-md overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0a1220 0%, #060c1a 100%)',
          border: '1px solid #1e2d45',
          borderRadius: 20,
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(20,184,166,0.06)',
        }}
      >
        {/* ── TOP GLOW BAR ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent 0%, #14b8a6 40%, #2dd4bf 60%, transparent 100%)',
          opacity: 0.7,
        }} />

        {/* ── HEADER ── */}
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid #1e2d45' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Icon */}
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'linear-gradient(135deg, #14b8a6, #2dd4bf)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(20,184,166,0.3)',
                flexShrink: 0,
              }}>
                {view === 'forgot' || view === 'forgot-sent'
                  ? <KeyRound size={18} color="#040710" strokeWidth={2.5} />
                  : <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 900, color: '#040710', letterSpacing: '-0.04em' }}>SIBA</span>
                }
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#f0f4ff', lineHeight: 1.2 }}>{heading}</div>
                {sub && <div style={{ fontSize: 12, color: '#4a5a82', marginTop: 3, lineHeight: 1.4 }}>{sub}</div>}
              </div>
            </div>
            <button
              onClick={() => { clearForm(); onClose(); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#4a5a82', padding: 4, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'color 150ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f0f4ff')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4a5a82')}
            >
              <X size={18} />
            </button>
          </div>

          {/* Tab switcher — only for login / register */}
          {(view === 'login' || view === 'register') && (
            <div style={{ display: 'flex', gap: 4, marginTop: 18, background: '#060c1a', borderRadius: 10, padding: 4, border: '1px solid #1e2d45' }}>
              {(['login', 'register'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => { clearForm(); switchView(v); }}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    transition: 'all 180ms',
                    background: view === v ? 'linear-gradient(135deg, #14b8a6, #2dd4bf)' : 'transparent',
                    color: view === v ? '#040710' : '#4a5a82',
                    boxShadow: view === v ? '0 2px 10px rgba(20,184,166,0.25)' : 'none',
                  }}
                >
                  {v === 'login' ? 'Masuk' : 'Daftar Gratis'}
                </button>
              ))}
            </div>
          )}

          {/* Back nav for forgot */}
          {view === 'forgot' && (
            <button
              onClick={() => switchView('login')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#4a5a82', fontSize: 12, fontWeight: 600, marginTop: 12, padding: 0,
                transition: 'color 150ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#2dd4bf')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4a5a82')}
            >
              <ArrowLeft size={13} /> Kembali ke Masuk
            </button>
          )}
        </div>

        {/* ── BODY ── */}
        <div style={{ padding: '24px' }}>

          {/* ── FORGOT SENT success state ── */}
          {view === 'forgot-sent' && (
            <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(20,184,166,0.1)', border: '2px solid rgba(20,184,166,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <CheckCircle2 size={32} color="#2dd4bf" strokeWidth={1.5} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f4ff', marginBottom: 8 }}>
                Link reset terkirim!
              </div>
              <div style={{ fontSize: 13, color: '#8b9abf', lineHeight: 1.6, marginBottom: 8 }}>
                Cek email <span style={{ color: '#2dd4bf', fontWeight: 600 }}>{forgotEmail}</span> dan klik link di dalamnya.
              </div>
              <div style={{ fontSize: 12, color: '#4a5a82', marginBottom: 28 }}>
                Tidak ketemu? Cek folder Spam atau Promotions.
              </div>
              <button
                onClick={() => { clearForm(); switchView('login'); }}
                style={{
                  width: '100%', padding: '12px 0',
                  background: 'linear-gradient(135deg, #14b8a6, #2dd4bf)',
                  border: 'none', borderRadius: 12, cursor: 'pointer',
                  fontSize: 13, fontWeight: 700, color: '#040710',
                  boxShadow: '0 4px 20px rgba(20,184,166,0.25)',
                }}
              >
                Kembali ke Halaman Masuk
              </button>
            </div>
          )}

          {/* ── FORGOT PASSWORD form ── */}
          {view === 'forgot' && (
            <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && <ErrorBox msg={error} />}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8b9abf', marginBottom: 6 }}>
                  Email Terdaftar
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4a5a82', pointerEvents: 'none' }} />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={e => { setForgotEmail(e.target.value); setError(null); }}
                    placeholder="nama@email.com"
                    className={INPUT_BASE}
                    autoFocus
                  />
                </div>
              </div>
              <SubmitBtn loading={loading} label="Kirim Link Reset" />
            </form>
          )}

          {/* ── LOGIN / REGISTER form ── */}
          {(view === 'login' || view === 'register') && (
            <>
              {error && <ErrorBox msg={error} />}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {view === 'register' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8b9abf', marginBottom: 6 }}>
                      Nama Lengkap
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4a5a82', pointerEvents: 'none' }} />
                      <input
                        type="text"
                        value={name}
                        onChange={e => { setName(e.target.value); setError(null); }}
                        placeholder="Contoh: Budi Santoso"
                        className={INPUT_BASE}
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8b9abf', marginBottom: 6 }}>
                    Alamat Email
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4a5a82', pointerEvents: 'none' }} />
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(null); }}
                      placeholder="nama@email.com"
                      className={INPUT_BASE}
                      autoFocus={view === 'login'}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#8b9abf' }}>Kata Sandi</label>
                    {view === 'login' && (
                      <button
                        type="button"
                        onClick={() => switchView('forgot')}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: 11, fontWeight: 600, color: '#4a5a82',
                          padding: 0, transition: 'color 150ms',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#2dd4bf')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#4a5a82')}
                      >
                        Lupa kata sandi?
                      </button>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4a5a82', pointerEvents: 'none' }} />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(null); }}
                      placeholder="Minimal 6 karakter"
                      className={INPUT_BASE}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(p => !p)}
                      style={{
                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#4a5a82', padding: 2, display: 'flex', alignItems: 'center',
                        transition: 'color 150ms',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#2dd4bf')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#4a5a82')}
                    >
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {view === 'register' && password.length > 0 && (
                    <PasswordStrength pwd={password} />
                  )}
                </div>

                <SubmitBtn loading={loading} label={view === 'login' ? 'Masuk ke Dashboard' : 'Buat Akun & Mulai'} />
              </form>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 16px' }}>
                <div style={{ flex: 1, height: 1, background: '#1e2d45' }} />
                <span style={{ fontSize: 11, color: '#4a5a82', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>atau</span>
                <div style={{ flex: 1, height: 1, background: '#1e2d45' }} />
              </div>

              {/* Google */}
              <GoogleBtn onClick={handleGoogleQuick} />

              {/* Trust badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 18 }}>
                <ShieldCheck size={13} color="#14b8a6" strokeWidth={2} />
                <span style={{ fontSize: 11, color: '#4a5a82' }}>Data & watchlist tersimpan terenkripsi.</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── SMALL HELPERS ─────────────────────────────────────────── */

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{
      padding: '10px 14px',
      background: 'rgba(248,113,113,0.07)',
      border: '1px solid rgba(248,113,113,0.22)',
      borderRadius: 10, fontSize: 12, color: '#f87171',
      marginBottom: 4,
      display: 'flex', alignItems: 'flex-start', gap: 8,
    }}>
      <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>
      <span>{msg}</span>
    </div>
  );
}

function SubmitBtn({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        width: '100%', padding: '13px 0', marginTop: 4,
        background: loading ? '#1e2d45' : 'linear-gradient(135deg, #14b8a6, #2dd4bf)',
        border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: 13, fontWeight: 800, color: loading ? '#4a5a82' : '#040710',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: loading ? 'none' : '0 4px 24px rgba(20,184,166,0.28)',
        transition: 'all 200ms',
      }}
    >
      {loading ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" style={{ animation: 'spin 0.8s linear infinite' }}>
            <circle cx="7" cy="7" r="5.5" stroke="#4a5a82" strokeWidth="2" fill="none" strokeDasharray="22" strokeDashoffset="8" />
          </svg>
          Memproses...
        </span>
      ) : (
        <><span>{label}</span><ArrowRight size={14} /></>
      )}
    </button>
  );
}

function GoogleBtn({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = React.useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', padding: '11px 0',
        background: hov ? '#111d2e' : '#0d1424',
        border: `1px solid ${hov ? '#2dd4bf40' : '#1e2d45'}`,
        borderRadius: 12, cursor: 'pointer',
        fontSize: 13, fontWeight: 600, color: '#8b9abf',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        transition: 'all 180ms',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
      </svg>
      <span>Lanjutkan dengan Google</span>
    </button>
  );
}

function PasswordStrength({ pwd }: { pwd: string }) {
  const score = [pwd.length >= 8, /[A-Z]/.test(pwd), /[0-9]/.test(pwd), /[^a-zA-Z0-9]/.test(pwd)]
    .filter(Boolean).length;
  const labels = ['', 'Lemah', 'Cukup', 'Kuat', 'Sangat kuat'];
  const colors = ['', '#f87171', '#fbbf24', '#34d399', '#2dd4bf'];
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= score ? colors[score] : '#1e2d45',
            transition: 'background 250ms',
          }} />
        ))}
      </div>
      {score > 0 && (
        <span style={{ fontSize: 11, color: colors[score], fontWeight: 600 }}>{labels[score]}</span>
      )}
    </div>
  );
}
