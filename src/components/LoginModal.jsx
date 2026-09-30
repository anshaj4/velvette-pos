import React, { useState } from 'react';
import { Lock, User, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginModal({
  settings = {},
  onLoginSuccess
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const correctUser = settings.username || 'admin@velvette';
    const correctPass = settings.password || 'pass@velvette';

    if (username.trim() === correctUser && password === correctPass) {
      localStorage.setItem('velvette_auth_session', JSON.stringify({
        username: correctUser,
        loggedInAt: new Date().toISOString()
      }));
      onLoginSuccess({ username: correctUser });
    } else {
      setErrorMsg('Invalid username or password.');
    }
  };

  return (
    <div className="modal-overlay" style={{ background: 'rgba(25, 8, 18, 0.85)' }}>
      <div className="modal-card" style={{ maxWidth: 440, padding: 0, overflow: 'hidden', boxShadow: '0 20px 60px rgba(251, 70, 146, 0.35)' }}>
        
        {/* White Top Banner with Centered Velvette Logo */}
        <div style={{ background: '#FFFFFF', padding: '28px 24px', textAlign: 'center', borderBottom: '3px solid var(--primary)' }}>
          <img
            src="/logo.png"
            alt="Velvette Logo"
            style={{ maxHeight: 68, maxWidth: 240, objectFit: 'contain' }}
          />
          <p style={{ margin: '8px 0 0 0', color: 'var(--primary)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2 }}>
            Billing & Sales Portal
          </p>
        </div>

        {/* Login Form Body */}
        <div style={{ padding: '28px 30px', background: '#FFFFFF' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
              Store Login
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              Enter staff credentials to unlock POS & sales registry.
            </p>
          </div>

          {errorMsg && (
            <div style={{ background: '#FFEBEF', color: '#FF3B5C', padding: '10px 14px', borderRadius: 12, fontSize: 12, fontWeight: 600, marginBottom: 16, border: '1px solid #FFCCD5', textAlign: 'center' }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="field-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <User size={13} />
                <span>Username</span>
              </label>
              <input
                type="text"
                required
                placeholder="admin"
                value={username}
                onChange={e => { setUsername(e.target.value); setErrorMsg(''); }}
                style={{ padding: '10px 14px', borderRadius: 12 }}
              />
            </div>

            <div className="field-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Lock size={13} />
                <span>Password</span>
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setErrorMsg(''); }}
                style={{ padding: '10px 14px', borderRadius: 12 }}
              />
            </div>

            <button
              type="submit"
              className="btn-checkout"
              style={{ marginTop: 8 }}
            >
              <span>Unlock Velvette POS</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 18, fontSize: 11, color: '#aaa' }}>
            Default credentials: <code style={{ color: 'var(--primary)', fontWeight: 700 }}>admin</code> / <code style={{ color: 'var(--primary)', fontWeight: 700 }}>velvette123</code>
          </div>
        </div>

      </div>
    </div>
  );
}
