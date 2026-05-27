import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(username, password);
    if (result.success) navigate('/');
    else setError(result.error);
  };

  const inputStyle = { width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-h)', backgroundColor: 'var(--bg-input)' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--bg-page)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex" style={{ width: '440px', backgroundColor: 'var(--bg-card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px 40px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '48px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 700 }}>E</span>
            </div>
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-h)' }}>ESG Platform</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-h)', letterSpacing: '-0.02em', lineHeight: '30px', marginBottom: '12px' }}>
            ESG Data Ingestion<br />& Review Platform
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '22px', maxWidth: '340px' }}>
            Enterprise-grade pipeline for normalizing, validating, and approving ESG operational data.
          </p>
        </div>
        <div>
          {[
            { title: 'Multi-Source Ingestion', desc: 'SAP, Utility, and Travel data' },
            { title: 'Smart Validation', desc: 'Automated anomaly detection' },
            { title: 'Audit-Ready Approvals', desc: 'Full traceability and sign-off' },
          ].map(({ title, desc }) => (
            <div key={title} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent)', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-h)' }}>{title}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{desc}</p>
              </div>
            </div>
          ))}
          <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '24px' }}>Scope 1 · Scope 2 · Scope 3 — GHG Protocol Aligned</p>
        </div>
      </div>

      {/* Right — Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', position: 'relative' }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          style={{ position: 'absolute', top: '20px', right: '20px', width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? (
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          ) : (
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          )}
        </button>

        <div style={{ width: '100%', maxWidth: '380px' }} className="animate-fade-in">
          <div className="lg:hidden" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#FFFFFF', fontSize: '12px', fontWeight: 700 }}>E</span>
              </div>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-h)' }}>ESG Platform</span>
            </div>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-h)', letterSpacing: '-0.02em', marginBottom: '4px' }}>Welcome back</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '28px' }}>Sign in to your account</p>

          {error && (
            <div style={{ padding: '10px 14px', backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '8px', marginBottom: '20px' }}>
              <p style={{ fontSize: '13px', color: 'var(--danger-text)' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="username" style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-body)', marginBottom: '6px' }}>Username</label>
              <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} placeholder="Enter your username" required />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="password" style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-body)', marginBottom: '6px' }}>Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} placeholder="Enter your password" required />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px 16px', backgroundColor: 'var(--accent)', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '12px' }}>Demo Accounts</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { role: 'Admin', user: 'admin', pass: 'admin123!', dot: 'var(--warning)' },
                { role: 'Analyst', user: 'analyst', pass: 'analyst123!', dot: 'var(--accent)' },
              ].map(({ role, user, pass, dot }) => (
                <button key={role} type="button" onClick={() => { setUsername(user); setPassword(pass); }}
                  style={{ padding: '10px 12px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', textAlign: 'left', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text-faint)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: dot }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-h)' }}>{role}</span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>{user} / {pass}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
