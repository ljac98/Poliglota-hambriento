import React, { useState } from 'react';
import { login, register } from '../../src/api.js';
import { Btn } from '../components/Btn.jsx';
import { InstallFloatingCard } from '../components/InstallFloatingCard.jsx';
import hamImg from '../../imagenes/hamburguesas/ham.png';

const UI_LANG_OPTIONS = [
  { key: 'es', label: 'Español' },
  { key: 'en', label: 'English' },
  { key: 'fr', label: 'Français' },
  { key: 'it', label: 'Italiano' },
  { key: 'de', label: 'Deutsch' },
  { key: 'pt', label: 'Português' },
];

// ── Auth Screen (full page) ──────────────────────────────────────────────────
export function AuthScreen({ onAuth, onGuest, onDownload, T, uiLang, onLangChange, installEntryVisible, installEntryTitle, installEntryDesc, installEntryButton, onOpenInstallPrompt }) {
  const [tab, setTab] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(''); setLoading(true);
    try {
      const user = tab === 'login'
        ? await login(username, password)
        : await register(username, password, displayName || username);
      onAuth(user);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid #2a2a4a',
    background: '#0f1117', color: '#eee', fontFamily: "'Fredoka',sans-serif", fontSize: 14, outline: 'none',
    marginBottom: 12, boxSizing: 'border-box',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#0f1117 0%,#1a1a2e 100%)',
      fontFamily: "'Fredoka',sans-serif", padding: '20px 0',
    }}>
      <InstallFloatingCard
        visible={installEntryVisible}
        title={installEntryTitle}
        desc={installEntryDesc}
        buttonLabel={installEntryButton}
        onInstall={onOpenInstallPrompt}
        onDownload={onDownload}
      />
      <div style={{
        background: '#16213e', borderRadius: 20, padding: 'clamp(20px, 5vw, 36px) clamp(16px, 5vw, 40px)',
        maxWidth: 420, width: '92vw',
        boxShadow: '0 8px 40px rgba(0,0,0,.6)', border: '2px solid #2a2a4a',
      }}>
        {/* Language selector */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
          {UI_LANG_OPTIONS.map(opt => (
            <button key={opt.key} onClick={() => onLangChange(opt.key)} style={{
              padding: '4px 10px', borderRadius: 8, border: uiLang === opt.key ? '2px solid #FFD700' : '2px solid #2a2a4a',
              background: uiLang === opt.key ? 'rgba(255,215,0,.12)' : 'transparent',
              color: uiLang === opt.key ? '#FFD700' : '#888', fontSize: 11, fontWeight: 700,
              cursor: 'pointer', fontFamily: "'Fredoka',sans-serif", transition: 'all .15s',
            }}>
              {opt.label}
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src={hamImg} alt="hamburguesa" style={{ width: 80, height: 80, objectFit: 'contain' }} />
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#FFD700', letterSpacing: 1 }}>{T('appTitle')}</h1>
          <p style={{ color: '#888', fontSize: 12, marginTop: 4 }}>{T('tagline')}</p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['login', 'register'].map(tb => (
            <button key={tb} onClick={() => { setTab(tb); setError(''); }} style={{
              flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
              background: tab === tb ? '#FFD700' : '#2a2a4a', color: tab === tb ? '#111' : '#888',
              fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer',
              transition: 'all .15s',
            }}>
              {tb === 'login' ? T('login') : T('register')}
            </button>
          ))}
        </div>

        <input value={username} onChange={e => setUsername(e.target.value)} placeholder={T('username')} maxLength={20} style={inputStyle} />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder={T('password')} type="password" style={inputStyle} />
        {tab === 'register' && (
          <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder={T('displayName')} maxLength={20} style={inputStyle} />
        )}

        {error && <div style={{ color: '#ff6b6b', fontSize: 12, marginBottom: 10, textAlign: 'center' }}>{error}</div>}

        <Btn onClick={handleSubmit} disabled={loading || !username || !password} color="#FFD700" style={{ width: '100%', fontSize: 16, padding: '12px 0', marginBottom: 10 }}>
          {loading ? T('loading') : tab === 'login' ? T('enter') : T('createAccount')}
        </Btn>

        <div style={{ textAlign: 'center', margin: '16px 0 0' }}>
          <button onClick={onGuest} style={{
            background: 'none', border: 'none', color: '#888', fontSize: 14,
            cursor: 'pointer', fontFamily: "'Fredoka',sans-serif",
            textDecoration: 'underline', padding: '8px 16px',
          }}>
            {T('playAsGuest')}
          </button>
        </div>
      </div>
    </div>
  );
}

