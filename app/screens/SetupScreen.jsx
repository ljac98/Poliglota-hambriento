import React, { useEffect, useMemo, useState } from 'react';
import { LANGUAGES, LANG_BORDER, LANG_BG, LANG_TEXT } from '../../constants/index.js';
import { randInt, uid } from '../../game/utils.js';
import { Btn } from '../components/Btn.jsx';
import { Modal } from '../components/Modal.jsx';
import { HatBadge, PercheroSVG } from '../../components/HatComponents.jsx';
import HatSVG from '../../components/HatSVG.jsx';
import hamImg from '../../imagenes/hamburguesas/ham.png';
import modoclon from '../../imagenes/modos/clones.png';
import modoescalera from '../../imagenes/modos/escalera.png';
import modocaotico from '../../imagenes/modos/caotico.png';
import percheroImg from '../../imagenes/sombreros/perchero/percherofinal.png';

export function SetupScreen({ onStart, onOnline, user, onLogout, onHistory, onFriends, T }) {
  const [name, setName] = useState(user?.displayName || '');
  const [hat, setHat] = useState(null);
  const [gameMode, setGameMode] = useState('clon');
  const [burgerCount, setBurgerCount] = useState(2);
  const [ingredientCount, setIngredientCount] = useState(5);
  const [aiCount, setAiCount] = useState(2);
  const [showModeConfig, setShowModeConfig] = useState(false);

  const gameModes = [
    { id: 'clon', label: T('modeClon'), desc: T('modeClonDesc') ,img:modoclon },
    { id: 'escalera', label: T('modeEscalera'), desc: T('modeEscaleraDesc'),img:modoescalera },
    { id: 'caotico', label: T('modeCaotico'), desc: T('modeCaoticoDesc') ,img:modocaotico},
  ];
  const markerStyle = {
    minWidth: 62,
    textAlign: 'center',
    fontSize: 11,
    color: '#8a8fa8',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 999,
    padding: '3px 8px',
    lineHeight: 1.2,
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#0f1117 0%,#1a1a2e 100%)',
      fontFamily: "'Fredoka',sans-serif",
      overflowY: 'auto', padding: '20px 0',
    }}>
      <div style={{
        background: '#16213e', borderRadius: 20,
        padding: 'clamp(20px, 5vw, 36px) clamp(16px, 5vw, 40px)',
        maxWidth: 520, width: '92vw',
        boxShadow: '0 8px 40px rgba(0,0,0,.6)', border: '2px solid #2a2a4a',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src={hamImg} alt="hamburguesa" style={{ width: 90, height: 90, objectFit: 'contain' }} />
          <h1 style={{ fontSize: 30, fontWeight: 900, color: '#FFD700', letterSpacing: 1 }}>{T('appTitle')}</h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>{T('tagline')}</p>
          {user && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ color: '#4ecdc4', fontSize: 13, fontWeight: 700 }}>
                {user.displayName} — {user.wins}W / {user.gamesPlayed}G
              </span>
              <button onClick={onHistory} style={{
                background: 'none', border: '1px solid #4ecdc4', borderRadius: 8,
                color: '#4ecdc4', fontSize: 11, padding: '3px 10px', cursor: 'pointer',
                fontFamily: "'Fredoka',sans-serif", fontWeight: 700,
              }}>{T('history')}</button>
              <button onClick={onFriends} style={{
                background: 'none', border: '1px solid #FFD700', borderRadius: 8,
                color: '#FFD700', fontSize: 11, padding: '3px 10px', cursor: 'pointer',
                fontFamily: "'Fredoka',sans-serif", fontWeight: 700,
              }}>{T('friends')}</button>
              <button onClick={onLogout} style={{
                background: 'none', border: '1px solid #555', borderRadius: 8,
                color: '#888', fontSize: 11, padding: '3px 10px', cursor: 'pointer',
                fontFamily: "'Fredoka',sans-serif",
              }}>{T('logout')}</button>
            </div>
          )}
        </div>

        {/* Name – only show input if not logged in */}
        {!user && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>{T('yourName')}</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder={T('enterName')}
              maxLength={20}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid #2a2a4a',
                background: '#0f1117', color: '#eee', fontFamily: "'Fredoka',sans-serif",
                fontSize: 15, outline: 'none',
              }}
            />
          </div>
        )}

        {/* Hat selection */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>{T('chooseLanguage')}</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {LANGUAGES.map(lang => (
              <div
                key={lang}
                onClick={() => setHat(lang)}
                style={{
                  flex: '1 1 28%', minWidth: 80, padding: '8px 6px', borderRadius: 10, cursor: 'pointer',
                  border: hat === lang ? `2px solid #FFD700` : `2px solid ${LANG_BORDER[lang]}44`,
                  background: hat === lang ? 'rgba(255,215,0,.08)' : 'rgba(255,255,255,.02)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'all .15s',
                  boxShadow: hat === lang ? '0 0 12px rgba(255,215,0,.3)' : 'none',
                }}
              >
                <HatSVG lang={lang} size={32} />
                <span style={{ fontSize: 11, fontWeight: 800, color: hat === lang ? '#FFD700' : LANG_TEXT[lang] }}>
                  {T(lang)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Game Mode */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>{T('gameMode')}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {gameModes.map(m => (
              <div
                key={m.id}
                onClick={() => { setGameMode(m.id); setShowModeConfig(true); }}
                style={{
                  flex: 1, padding: '8px 6px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                  border: gameMode === m.id ? '2px solid #FFD700' : '2px solid #2a2a4a',
                  background: gameMode === m.id ? 'rgba(255,215,0,.08)' : 'rgba(255,255,255,.02)',
                  transition: 'all .15s',
                }}
              >
                          <img src={m.img} alt="hamburguesa" style={{ width: 90, height: 90, objectFit: 'fill',borderRadius:'15px'}} />

                <div style={{ fontSize: 13, fontWeight: 700, color: gameMode === m.id ? '#FFD700' : '#ccc' }}>{m.label}</div>
                <div style={{ fontSize: 9, color: '#666', marginTop: 2 }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 28 }} />

        <div style={{ display: 'flex', gap: 10 }}>
          <Btn
            onClick={() => onStart(name.trim(), hat, { mode: gameMode, burgerCount, ingredientCount }, aiCount)}
            disabled={!name.trim() || !hat}
            color="#FFD700"
            style={{ flex: 1, fontSize: 16, padding: '12px 0' }}
          >
            {T('vsAI')}
          </Btn>
          <Btn
            onClick={onOnline}
            color="#00BCD4"
            style={{ flex: 1, fontSize: 16, padding: '12px 0' }}
          >
            {T('online')}
          </Btn>
        </div>
      </div>
      {showModeConfig && (
        <Modal title={`${T('gameMode')}: ${gameModes.find(m => m.id === gameMode)?.label || ''}`}>
          {gameMode !== 'caotico' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>
                {T('burgerCount')}: <span style={{ color: '#FFD700' }}>{burgerCount}</span>
              </label>
              <input
                type="range" min={1} max={4} value={burgerCount}
                onChange={e => setBurgerCount(+e.target.value)}
                style={{ width: '100%', accentColor: '#FFD700' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 6 }}>
                <span style={markerStyle}>1</span>
                <span style={markerStyle}>4</span>
              </div>
            </div>
          )}
          {gameMode === 'clon' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>
                {T('ingredientCount')}: <span style={{ color: '#FFD700' }}>{ingredientCount}</span>
              </label>
              <input
                type="range" min={2} max={8} value={ingredientCount}
                onChange={e => setIngredientCount(+e.target.value)}
                style={{ width: '100%', accentColor: '#FFD700' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 6 }}>
                <span style={markerStyle}>2</span>
                <span style={markerStyle}>8</span>
              </div>
            </div>
          )}
          <div style={{ marginBottom: 18 }}>
            <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>
              {T('aiOpponents')}: <span style={{ color: '#FFD700' }}>{aiCount}</span>
            </label>
            <input
              type="range" min={1} max={3} value={aiCount}
              onChange={e => setAiCount(+e.target.value)}
              style={{ width: '100%', accentColor: '#FFD700' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 6 }}>
              <span style={markerStyle}>{T('opponent1')}</span>
              <span style={markerStyle}>{T('opponents3')}</span>
            </div>
          </div>
          <Btn onClick={() => setShowModeConfig(false)} color="#333" style={{ color: '#aaa' }}>{T('close')}</Btn>
        </Modal>
      )}
    </div>
  );
}

