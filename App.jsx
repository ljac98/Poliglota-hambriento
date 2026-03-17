import React, { useState, useEffect, useRef, useCallback } from 'react';
import socket from './src/socket.js';
import { login, register, clearAuth, getSavedUser, getHistory, searchUsers, getFriends, sendFriendRequest, getFriendRequests, acceptFriendRequest, declineFriendRequest, removeFriend, blockUser, unblockUser, getBlockedUsers } from './src/api.js';
import {
  LANGUAGES, LANG_BORDER, LANG_BG, LANG_TEXT, LANG_SHORT,
  ING_EMOJI, ING_BG, FRUITS_VEGS, AI_NAMES, getIngName, getActionInfo,
  ING_NAMES, ACTION_CARDS,
} from './constants';
import { generateDeck, initPlayer, canPlayCard, checkBurgerComplete } from './game';
import { shuffle, randInt, uid } from './game/utils';
import { t, getUILang, setUILang } from './src/translations.js';
import { GameCard } from './components/Cards';
import { BurgerTarget, LogEntry } from './components/GameUI';
import ingPan    from './imagenes/hamburguesas/objetivos/pan.png';
import ingLechuga from './imagenes/hamburguesas/objetivos/lechuga.png';
import ingTomate  from './imagenes/hamburguesas/objetivos/tomate.png';
import ingCarne   from './imagenes/hamburguesas/objetivos/carne.png';
import ingQueso   from './imagenes/hamburguesas/objetivos/queso.png';
import ingPollo   from './imagenes/hamburguesas/objetivos/pollo.png';
import ingHuevo   from './imagenes/hamburguesas/objetivos/huevo.png';
import ingCebolla from './imagenes/hamburguesas/objetivos/cebolla.png';
import ingPalta   from './imagenes/hamburguesas/objetivos/palta.png';
import comodinImg from './imagenes/ingredientes/comodines/comodin.png';
import modoclon from './imagenes/modos/clones.png';
import modoescalera from './imagenes/modos/escalera.png';
import modocaotico from './imagenes/modos/caotico.png';


const ING_IMG = {
  pan: ingPan, lechuga: ingLechuga, tomate: ingTomate, carne: ingCarne,
  queso: ingQueso, pollo: ingPollo, huevo: ingHuevo, cebolla: ingCebolla,
  palta: ingPalta, perrito: comodinImg,
};
// Wildcard helpers: 'perrito|lechuga' → base='perrito', chosen='lechuga'
const ingKey = ing => ing && ing.includes('|') ? ing.split('|')[0] : ing;
const ingChosen = ing => ing && ing.includes('|') ? ing.split('|')[1] : null;
const ING_AFFECTED_BY = {
  pan: ['milanesa'], huevo: ['milanesa'],
  lechuga: ['ensalada'], tomate: ['ensalada'], cebolla: ['ensalada'], palta: ['ensalada'],
  queso: ['pizza'], pollo: ['parrilla'], carne: ['parrilla'],
  perrito: ['comecomodines'],
};
import { HatBadge, PercheroSVG } from './components/HatComponents';
import hamImg from './imagenes/hamburguesas/ham.png';
import HatSVG from './components/HatSVG';
import percheroImg from './imagenes/sombreros/perchero/percherofinal.png';
import imgGlotonHead from './imagenes/acciones/comer.png';

// ── Helpers ──────────────────────────────────────────────────────────────────
const PLAYER_COLORS = ['#FFD700', '#00BCD4', '#FF7043', '#66BB6A', '#CE93D8'];
const clone = o => JSON.parse(JSON.stringify(o));

function drawN(deck, discard, n) {
  let d = [...deck], di = [...discard], drawn = [];
  for (let i = 0; i < n; i++) {
    if (d.length === 0) {
      d = shuffle(di.map(c =>
        c.type === 'ingredient' && !c.language
          ? { ...c, language: LANGUAGES[Math.floor(Math.random() * LANGUAGES.length)] }
          : c
      ));
      di = [];
    }
    if (d.length > 0) drawn.push(d.shift());
  }
  return { drawn, deck: d, discard: di };
}

function advanceBurger(player) {
  if (!checkBurgerComplete(player)) return { player, freed: [], done: false };
  const freed = [...player.table];
  return { player: { ...player, table: [], currentBurger: player.currentBurger + 1 }, freed, done: true };
}

function filterTable(player, discardArr) {
  const target = player.burgers[player.currentBurger] || [];
  const needed = [...target];
  const keep = [];
  for (const item of player.table) {
    const ing = item.startsWith('perrito|') ? item.split('|')[1] : item;
    const ni = needed.indexOf(ing);
    if (ni !== -1) {
      keep.push(item);
      needed.splice(ni, 1);
    } else if ((item === 'perrito' || item.startsWith('perrito|')) && needed.length > 0) {
      keep.push(item);
      needed.splice(0, 1);
    } else {
      discardArr.push({ type: 'ingredient', ingredient: item.startsWith('perrito') ? 'perrito' : item, id: `c${Date.now()}${Math.random()}` });
    }
  }
  player.table = keep;
}

function applyMass(players, discard, actionId, playerIdx) {
  const ps = clone(players);
  let di = [...discard];
  if (actionId === 'comecomodines') {
    ps.forEach((p, i) => {
      if (i === playerIdx) return;
      const kept = [];
      p.table.forEach(ing => {
        if (ingKey(ing) === 'perrito') di.push({ type: 'ingredient', ingredient: 'perrito', id: `d${Date.now()}${Math.random()}` });
        else kept.push(ing);
      });
      p.table = kept;
    });
    return { players: ps, discard: di };
  }
  const targets = {
    milanesa: ['pan', 'huevo'], ensalada: FRUITS_VEGS,
    pizza: ['queso'], parrilla: ['pollo', 'carne'],
  }[actionId] || [];
  ps.forEach((p, i) => {
    if (i === playerIdx) return;
    const kept = [];
    p.table.forEach(ing => {
      if (targets.includes(ingKey(ing)) || targets.includes(ingChosen(ing))) di.push({ type: 'ingredient', ingredient: ingKey(ing), id: `d${Date.now()}${Math.random()}` });
      else kept.push(ing);
    });
    p.table = kept;
  });
  return { players: ps, discard: di };
}

// ── Btn helper ────────────────────────────────────────────────────────────────
const Btn = ({ onClick, children, color = '#FFD700', disabled, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: '8px 18px', borderRadius: 10, border: 'none',
    background: disabled ? '#333' : color, color: disabled ? '#666' : '#111',
    fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 14,
    cursor: disabled ? 'default' : 'pointer', transition: 'all .15s',
    boxShadow: disabled ? 'none' : '0 2px 8px rgba(0,0,0,.3)', ...style,
  }}>
    {children}
  </button>
);

// ── Language selector names (in their own language) ──
const UI_LANG_OPTIONS = [
  { key: 'es', label: 'Español' },
  { key: 'en', label: 'English' },
  { key: 'fr', label: 'Français' },
  { key: 'it', label: 'Italiano' },
  { key: 'de', label: 'Deutsch' },
  { key: 'pt', label: 'Português' },
];

// ── Auth Screen (full page) ──────────────────────────────────────────────────
function AuthScreen({ onAuth, onGuest, T, uiLang, onLangChange }) {
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

// ── History Screen ───────────────────────────────────────────────────────────
function HistoryScreen({ user, onBack, T }) {
  const [history, setHistory] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getHistory(user.id).then(setHistory).catch(() => setHistory([]));
  }, [user.id]);

  const wins = history ? history.filter(g => g.winnerName === user.displayName).length : 0;
  const losses = history ? history.filter(g => g.winnerName !== user.displayName).length : 0;
  const total = history ? history.length : 0;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  const filtered = history ? history.filter(g => {
    if (filter === 'wins') return g.winnerName === user.displayName;
    if (filter === 'losses') return g.winnerName !== user.displayName;
    return true;
  }) : [];

  const filters = [
    { id: 'all', label: T('all'), count: total },
    { id: 'wins', label: T('winsFilter'), count: wins },
    { id: 'losses', label: T('lossesFilter'), count: losses },
  ];

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      background: 'linear-gradient(135deg,#0f1117 0%,#1a1a2e 100%)',
      fontFamily: "'Fredoka',sans-serif", padding: '40px 0',
    }}>
      <div style={{
        background: '#16213e', borderRadius: 20, padding: 'clamp(20px, 5vw, 36px) clamp(16px, 5vw, 40px)',
        maxWidth: 520, width: '92vw',
        boxShadow: '0 8px 40px rgba(0,0,0,.6)', border: '2px solid #2a2a4a',
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: '#888', fontSize: 14,
          cursor: 'pointer', fontFamily: "'Fredoka',sans-serif", marginBottom: 12, padding: 0,
        }}>
          {T('back')}
        </button>

        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#FFD700', marginBottom: 6, textAlign: 'center' }}>
          {T('gameHistory')}
        </h2>
        <p style={{ color: '#4ecdc4', fontSize: 14, fontWeight: 700, textAlign: 'center', marginBottom: 20 }}>
          {user.displayName}
        </p>

        {/* Stats bar */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 20,
          background: 'rgba(255,255,255,.03)', borderRadius: 12, padding: '12px 16px',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#FFD700' }}>{total}</div>
            <div style={{ fontSize: 10, color: '#777', fontWeight: 700 }}>{T('games')}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#66BB6A' }}>{wins}</div>
            <div style={{ fontSize: 10, color: '#777', fontWeight: 700 }}>{T('wins')}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#FF7043' }}>{losses}</div>
            <div style={{ fontSize: 10, color: '#777', fontWeight: 700 }}>{T('losses')}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#CE93D8' }}>{winRate}%</div>
            <div style={{ fontSize: 10, color: '#777', fontWeight: 700 }}>{T('winrate')}</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              flex: 1, padding: '8px 0', borderRadius: 10, border: 'none',
              background: filter === f.id ? (f.id === 'wins' ? '#66BB6A' : f.id === 'losses' ? '#FF7043' : '#FFD700') : '#2a2a4a',
              color: filter === f.id ? '#111' : '#888',
              fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer',
              transition: 'all .15s',
            }}>
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* Game list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '50vh', overflowY: 'auto' }}>
          {!history ? (
            <p style={{ color: '#666', fontSize: 13, textAlign: 'center', padding: 20 }}>{T('loading')}</p>
          ) : filtered.length === 0 ? (
            <p style={{ color: '#666', fontSize: 13, textAlign: 'center', padding: 20 }}>{T('noGames')}</p>
          ) : filtered.map(g => {
            const isWin = g.winnerName === user.displayName;
            return (
              <div key={g.id} style={{
                background: isWin ? 'rgba(102,187,106,.08)' : 'rgba(255,112,67,.08)',
                border: `1px solid ${isWin ? 'rgba(102,187,106,.25)' : 'rgba(255,112,67,.25)'}`,
                borderRadius: 10, padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 20 }}>{isWin ? '🏆' : '❌'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isWin ? '#66BB6A' : '#FF7043' }}>
                    {isWin ? T('victory') : (typeof T('defeatBy') === 'function' ? T('defeatBy')(g.winnerName) : T('defeatBy'))}
                  </div>
                  <div style={{ fontSize: 11, color: '#777' }}>
                    {g.playerCount} {T('players')} · {g.difficulty} · {new Date(g.finishedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Setup Screen ──────────────────────────────────────────────────────────────
function SetupScreen({ onStart, onOnline, user, onLogout, onHistory, onFriends, T }) {
  const [name, setName] = useState(user?.displayName || '');
  const [hat, setHat] = useState(null);
  const [gameMode, setGameMode] = useState('clon');
  const [burgerCount, setBurgerCount] = useState(2);
  const [ingredientCount, setIngredientCount] = useState(5);
  const [aiCount, setAiCount] = useState(2);

  const gameModes = [
    { id: 'clon', label: T('modeClon'), desc: T('modeClonDesc') ,img:modoclon },
    { id: 'escalera', label: T('modeEscalera'), desc: T('modeEscaleraDesc'),img:modoescalera },
    { id: 'caotico', label: T('modeCaotico'), desc: T('modeCaoticoDesc') ,img:modocaotico},
  ];

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
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
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
                onClick={() => setGameMode(m.id)}
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

        {/* Burger count (clon & escalera) */}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#555', marginTop: 2 }}>
              <span>1</span><span>4</span>
            </div>
          </div>
        )}

        {/* Ingredient count (clon only) */}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#555', marginTop: 2 }}>
              <span>2</span><span>8</span>
            </div>
          </div>
        )}

        {/* AI count */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>
            {T('aiOpponents')}: <span style={{ color: '#FFD700' }}>{aiCount}</span>
          </label>
          <input
            type="range" min={1} max={3} value={aiCount}
            onChange={e => setAiCount(+e.target.value)}
            style={{ width: '100%', accentColor: '#FFD700' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#555', marginTop: 2 }}>
            <span>{T('opponent1')}</span><span>{T('opponents3')}</span>
          </div>
        </div>

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
    </div>
  );
}

// ── Transition Screen ─────────────────────────────────────────────────────────
function TransitionScreen({ player, onContinue, isExtraPlay, T }) {
  return (
    <div
      onClick={onContinue}
      style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg,#0f1117 0%,#1a1a2e 100%)',
        cursor: 'pointer', userSelect: 'none',
      }}
    >
      {/* Sombreros principales del jugador */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        {(player?.mainHats || []).map(h => (
          <HatBadge key={h} lang={h} isMain size="lg" />
        ))}
      </div>
      {/* Cabeza del Glotón */}
      <div style={{
        width: 120, height: 120, borderRadius: '50%', overflow: 'hidden',
        border: '3px solid #FFD700', boxShadow: '0 0 30px rgba(255,215,0,0.3)',
        marginBottom: 16,
      }}>
        <img src={imgGlotonHead} alt="El Glotón" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <h2 style={{ fontSize: 28, fontWeight: 900, color: '#FFD700', marginBottom: 8 }}>
        {isExtraPlay ? T('extraPlayMsg') : T('yourTurn')}
      </h2>
      <div style={{ fontSize: 22, color: '#eee', marginBottom: 6 }}>
        {player?.name}
      </div>
      <div style={{ fontSize: 13, color: '#555', marginTop: 20 }}>
        {T('tapContinue')}
      </div>
    </div>
  );
}

// ── Game Over Screen ──────────────────────────────────────────────────────────
function GameOverScreen({ winner, players, onRestart, user, onHistory, T }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#0f1117 0%,#1a1a2e 100%)',
    }}>
      <div style={{ fontSize: 72, marginBottom: 12 }}>🏆</div>
      <h1 style={{ fontSize: 34, fontWeight: 900, color: '#FFD700', marginBottom: 6 }}>{typeof T('playerWon') === 'function' ? T('playerWon')(winner.name) : T('playerWon')}</h1>
      <p style={{ color: '#888', fontSize: 14, marginBottom: 32 }}>
        {T('completedBurgers')}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32, minWidth: 220 }}>
        {players.map((p, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
            borderRadius: 10, background: p.name === winner.name ? 'rgba(255,215,0,.12)' : 'rgba(255,255,255,.04)',
            border: p.name === winner.name ? '2px solid #FFD700' : '2px solid transparent',
          }}>
            <HatSVG lang={p.mainHats[0] || LANGUAGES[0]} size={24} />
            <span style={{ fontWeight: 700, color: p.name === winner.name ? '#FFD700' : '#ccc' }}>{p.name}</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#777' }}>
              🍔 {p.currentBurger}/{p.totalBurgers}
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Btn onClick={onRestart} color="#FFD700" style={{ fontSize: 16, padding: '12px 32px' }}>
          {T('playAgain')}
        </Btn>
        {user && (
          <Btn onClick={onHistory} color="#4ecdc4" style={{ fontSize: 14, padding: '12px 24px' }}>
            {T('historyBtn')}
          </Btn>
        )}
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#16213e', borderRadius: 16, padding: '24px 28px',
        maxWidth: 480, width: '90vw', maxHeight: '80vh', overflowY: 'auto',
        border: '2px solid #2a2a4a', boxShadow: '0 8px 40px rgba(0,0,0,.7)',
      }}>
        {title && <h3 style={{ fontSize: 18, fontWeight: 900, color: '#FFD700', marginBottom: 16 }}>{title}</h3>}
        {children}
      </div>
    </div>
  );
}

// ── Opponent Card (compact) ───────────────────────────────────────────────────
function OpponentCard({ player, index, color, isActive, onIngredientClick, T }) {
  const burger = player.burgers[player.currentBurger];
  return (
    <div style={{
      background: isActive ? 'rgba(255,215,0,.06)' : 'rgba(255,255,255,.03)',
      border: `2px solid ${isActive ? '#FFD700' : color + '44'}`,
      borderRadius: 12, padding: '10px 12px', transition: 'all .2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <HatSVG lang={player.mainHats[0] || LANGUAGES[0]} size={22} />
        <span style={{ fontWeight: 800, color, fontSize: 13 }}>{player.name}</span>
        {isActive && <span style={{ fontSize: 10, color: '#FFD700', marginLeft: 'auto' }}>{T('turn')}</span>}
        <span style={{ marginLeft: isActive ? 0 : 'auto', fontSize: 11, color: '#777' }}>
          🍔 {player.currentBurger}/{player.totalBurgers}
        </span>
      </div>

      {/* Main hats */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
        {player.mainHats.map(h => (
          <HatBadge key={h} lang={h} isMain size="sm" />
        ))}
      </div>

      {/* Table ingredients */}
      {player.table.length > 0 && (
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 4 }}>
          {player.table.map((ing, i) => {
            const base = ingKey(ing);
            const chosen = ingChosen(ing);
            return (
              <div key={i} onClick={() => onIngredientClick?.(ing)} style={{
                width: 30, height: 30, borderRadius: 6,
                background: chosen
                  ? `linear-gradient(to right, ${ING_BG.perrito || '#9b59b6'} 50%, ${ING_BG[chosen]} 50%)`
                  : ING_BG[base],
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                overflow: 'hidden', position: 'relative', cursor: 'pointer',
              }}>
                {chosen ? (
                  <>
                    <div style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={ING_IMG.perrito} alt="comodín" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                    </div>
                    <div style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {ING_IMG[chosen]
                        ? <img src={ING_IMG[chosen]} alt={chosen} style={{ width: 14, height: 14, objectFit: 'contain' }} />
                        : <span style={{ fontSize: 10 }}>{ING_EMOJI[chosen]}</span>}
                    </div>
                  </>
                ) : (
                  ING_IMG[base]
                    ? <img src={ING_IMG[base]} alt={base} style={{ width: 22, height: 22, objectFit: 'contain' }} />
                    : ING_EMOJI[base]
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Current burger target */}
      {burger && player.currentBurger < player.totalBurgers && (
        <BurgerTarget ingredients={burger} table={player.table} isCurrent={false} />
      )}

      {/* Hand count */}
      <div style={{ fontSize: 10, color: '#555', marginTop: 4 }}>
        {typeof T('cardsInHand') === 'function' ? T('cardsInHand')(player.hand.length) : `🃏 ${player.hand.length}`}
      </div>
    </div>
  );
}

// ── Friends Screen ───────────────────────────────────────────────────────────
function FriendsScreen({ user, onBack, T }) {
  const [tab, setTab] = useState('list');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [f, r, b] = await Promise.all([getFriends(), getFriendRequests(), getBlockedUsers()]);
      setFriends(f); setRequests(r); setBlocked(b);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Real-time updates
  useEffect(() => {
    const handleOnline = ({ userId }) => setFriends(prev => prev.map(f => f.id === userId ? { ...f, online: true } : f));
    const handleOffline = ({ userId }) => setFriends(prev => prev.map(f => f.id === userId ? { ...f, online: false } : f));
    const handleNewRequest = () => loadData();
    const handleAccepted = () => loadData();
    socket.on('friendOnline', handleOnline);
    socket.on('friendOffline', handleOffline);
    socket.on('friendRequestReceived', handleNewRequest);
    socket.on('friendRequestAccepted', handleAccepted);
    return () => {
      socket.off('friendOnline', handleOnline);
      socket.off('friendOffline', handleOffline);
      socket.off('friendRequestReceived', handleNewRequest);
      socket.off('friendRequestAccepted', handleAccepted);
    };
  }, [loadData]);

  async function handleSearch() {
    if (searchQuery.trim().length < 2) return;
    setSearchLoading(true); setMsg('');
    try {
      const results = await searchUsers(searchQuery.trim());
      setSearchResults(results);
    } catch { setMsg('Error'); } finally { setSearchLoading(false); }
  }

  async function handleSendRequest(username) {
    setMsg('');
    try {
      const res = await sendFriendRequest(username);
      if (res.status === 'accepted') { setMsg(T('autoAccepted')); loadData(); }
      else setMsg(T('requestSent'));
      setSearchResults(prev => prev.filter(u => u.username !== username));
    } catch (err) { setMsg(err.message); }
  }

  async function handleAccept(id) {
    try { await acceptFriendRequest(id); loadData(); } catch {}
  }
  async function handleDecline(id) {
    try { await declineFriendRequest(id); loadData(); } catch {}
  }
  async function handleRemove(id) {
    try { await removeFriend(id); setFriends(prev => prev.filter(f => f.id !== id)); } catch {}
  }
  async function handleBlock(id) {
    try { await blockUser(id); loadData(); } catch {}
  }
  async function handleUnblock(id) {
    try { await unblockUser(id); setBlocked(prev => prev.filter(b => b.id !== id)); } catch {}
  }

  const tabStyle = (active) => ({
    flex: 1, padding: '10px 0', border: 'none', borderRadius: 10,
    background: active ? 'rgba(255,215,0,.15)' : 'transparent',
    color: active ? '#FFD700' : '#666', fontFamily: "'Fredoka',sans-serif",
    fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all .2s',
  });

  const btnSmall = (bg, color) => ({
    padding: '5px 12px', borderRadius: 8, border: 'none', background: bg,
    color, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 11,
    cursor: 'pointer',
  });

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#0f1117 0%,#1a1a2e 100%)',
      fontFamily: "'Fredoka',sans-serif", overflowY: 'auto', padding: '20px 0',
    }}>
      <div style={{
        background: '#16213e', borderRadius: 20,
        padding: 'clamp(20px, 5vw, 36px) clamp(16px, 5vw, 40px)',
        maxWidth: 520, width: '92vw',
        boxShadow: '0 8px 40px rgba(0,0,0,.6)', border: '2px solid #2a2a4a',
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: '#888', fontSize: 14,
          cursor: 'pointer', fontFamily: "'Fredoka',sans-serif", fontWeight: 700, marginBottom: 16,
        }}>{T('back')}</button>

        <h2 style={{ color: '#FFD700', fontSize: 22, fontWeight: 900, textAlign: 'center', marginBottom: 20 }}>
          {T('friends')}
        </h2>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          <button onClick={() => setTab('list')} style={tabStyle(tab === 'list')}>{T('friendsList')}</button>
          <button onClick={() => setTab('requests')} style={tabStyle(tab === 'requests')}>
            {T('friendRequests')}{requests.length > 0 ? ` (${requests.length})` : ''}
          </button>
          <button onClick={() => setTab('add')} style={tabStyle(tab === 'add')}>{T('addFriend')}</button>
          <button onClick={() => setTab('blocked')} style={tabStyle(tab === 'blocked')}>{T('blockedUsers')}</button>
        </div>

        {loading ? <p style={{ color: '#888', textAlign: 'center' }}>{T('loading')}</p> : (
          <>
            {/* Friends List */}
            {tab === 'list' && (
              <div>
                {friends.length === 0 ? (
                  <p style={{ color: '#666', textAlign: 'center', fontSize: 14 }}>{T('noFriends')}</p>
                ) : friends.sort((a, b) => (b.online ? 1 : 0) - (a.online ? 1 : 0)).map(f => (
                  <div key={f.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: 'rgba(255,255,255,.03)', borderRadius: 10,
                    marginBottom: 8, border: '1px solid #2a2a4a',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: f.online ? '#4CAF50' : '#555',
                      }} />
                      <div>
                        <div style={{ color: '#eee', fontSize: 14, fontWeight: 700 }}>{f.displayName}</div>
                        <div style={{ color: '#666', fontSize: 11 }}>
                          @{f.username} — {f.online ? T('onlineStatus') : T('offlineStatus')}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleBlock(f.id)} style={btnSmall('rgba(255,87,34,.15)', '#FF5722')}>
                        {T('blockUser')}
                      </button>
                      <button onClick={() => handleRemove(f.id)} style={btnSmall('rgba(244,67,54,.15)', '#F44336')}>
                        {T('removeFriend')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Friend Requests */}
            {tab === 'requests' && (
              <div>
                {requests.length === 0 ? (
                  <p style={{ color: '#666', textAlign: 'center', fontSize: 14 }}>{T('noRequests')}</p>
                ) : requests.map(r => (
                  <div key={r.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: 'rgba(255,255,255,.03)', borderRadius: 10,
                    marginBottom: 8, border: '1px solid #2a2a4a',
                  }}>
                    <div>
                      <div style={{ color: '#eee', fontSize: 14, fontWeight: 700 }}>{r.displayName}</div>
                      <div style={{ color: '#666', fontSize: 11 }}>@{r.username}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleAccept(r.id)} style={btnSmall('rgba(76,175,80,.2)', '#4CAF50')}>
                        {T('accept')}
                      </button>
                      <button onClick={() => handleDecline(r.id)} style={btnSmall('rgba(244,67,54,.15)', '#F44336')}>
                        {T('decline')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Friend (search) */}
            {tab === 'add' && (
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder={T('searchUsers')}
                    style={{
                      flex: 1, padding: '10px 14px', borderRadius: 10, border: '2px solid #2a2a4a',
                      background: '#0d1526', color: '#eee', fontSize: 14,
                      fontFamily: "'Fredoka',sans-serif", outline: 'none',
                    }}
                  />
                  <button onClick={handleSearch} disabled={searchLoading} style={{
                    padding: '10px 18px', borderRadius: 10, border: 'none',
                    background: '#FFD700', color: '#000', fontFamily: "'Fredoka',sans-serif",
                    fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  }}>{searchLoading ? '...' : T('sendRequest').split(' ')[0]}</button>
                </div>
                {msg && <p style={{ color: '#4ecdc4', fontSize: 12, textAlign: 'center', marginBottom: 10 }}>{msg}</p>}
                {searchResults.map(u => (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: 'rgba(255,255,255,.03)', borderRadius: 10,
                    marginBottom: 8, border: '1px solid #2a2a4a',
                  }}>
                    <div>
                      <div style={{ color: '#eee', fontSize: 14, fontWeight: 700 }}>{u.displayName}</div>
                      <div style={{ color: '#666', fontSize: 11 }}>@{u.username}</div>
                    </div>
                    <button onClick={() => handleSendRequest(u.username)} style={btnSmall('rgba(255,215,0,.15)', '#FFD700')}>
                      {T('sendRequest')}
                    </button>
                  </div>
                ))}
                {searchQuery.trim().length >= 2 && !searchLoading && searchResults.length === 0 && (
                  <p style={{ color: '#666', textAlign: 'center', fontSize: 14 }}>{T('noResults')}</p>
                )}
              </div>
            )}

            {/* Blocked Users */}
            {tab === 'blocked' && (
              <div>
                {blocked.length === 0 ? (
                  <p style={{ color: '#666', textAlign: 'center', fontSize: 14 }}>{T('noBlocked')}</p>
                ) : blocked.map(b => (
                  <div key={b.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: 'rgba(255,255,255,.03)', borderRadius: 10,
                    marginBottom: 8, border: '1px solid #2a2a4a',
                  }}>
                    <div>
                      <div style={{ color: '#eee', fontSize: 14, fontWeight: 700 }}>{b.displayName}</div>
                      <div style={{ color: '#666', fontSize: 11 }}>@{b.username}</div>
                    </div>
                    <button onClick={() => handleUnblock(b.id)} style={btnSmall('rgba(76,175,80,.2)', '#4CAF50')}>
                      {T('unblockUser')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Online Menu (create / join / lobby) ──────────────────────────────────────
function OnlineMenu({ onCreated, onJoined, onBack, initialCode = '', user, T }) {
  const [tab, setTab] = useState(initialCode ? 'join' : 'create');
  const [name, setName] = useState(user?.displayName || '');
  const [isPublic, setIsPublic] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [joinName, setJoinName] = useState(user?.displayName || '');
  const [joinCode, setJoinCode] = useState(initialCode);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lobbyRooms, setLobbyRooms] = useState([]);
  const [lobbyLoading, setLobbyLoading] = useState(false);
  const [lobbyName, setLobbyName] = useState(user?.displayName || '');
  const joinedRoomRef = useRef(false);

  // ── Lobby browser: fetch & subscribe to public rooms ──
  useEffect(() => {
    if (tab !== 'lobby') return;
    setLobbyLoading(true);

    function fetchRooms() {
      socket.emit('listRooms', (rooms) => {
        if (rooms) setLobbyRooms(rooms);
        setLobbyLoading(false);
      });
    }

    socket.connect();
    fetchRooms();
    socket.emit('joinLobbyBrowser');
    const handleUpdate = (rooms) => setLobbyRooms(rooms);
    socket.on('lobbyListUpdate', handleUpdate);
    // Poll every 3 seconds as fallback for missed events
    const pollInterval = setInterval(fetchRooms, 3000);
    return () => {
      clearInterval(pollInterval);
      socket.emit('leaveLobbyBrowser');
      socket.off('lobbyListUpdate', handleUpdate);
      if (!joinedRoomRef.current) socket.disconnect();
    };
  }, [tab]);

  function handleCreate() {
    if (!name.trim()) return;
    if (isPublic && !roomName.trim()) return;
    setLoading(true); setError('');

    const timeout = setTimeout(() => {
      socket.off('roomCreated');
      socket.off('connect', doCreate);
      setError(T('timeout'));
      setLoading(false);
    }, 10000);

    socket.once('roomCreated', ({ code, isPublic: pub, roomName: rn }) => {
      clearTimeout(timeout);
      setLoading(false);
      window.history.replaceState({}, '', window.location.pathname);
      onCreated(name.trim(), code, pub, rn);
    });

    function doCreate() {
      socket.emit('createRoom', { playerName: name.trim(), isPublic, roomName: roomName.trim() });
    }

    if (socket.connected) {
      doCreate();
    } else {
      socket.once('connect', doCreate);
      socket.connect();
    }
  }

  function handleJoin() {
    if (!joinName.trim() || !joinCode.trim()) return;
    setLoading(true); setError('');

    const timeout = setTimeout(() => {
      socket.off('roomJoined');
      socket.off('joinError');
      socket.off('connect', doJoin);
      setError(T('timeout'));
      setLoading(false);
    }, 10000);

    socket.once('joinError', msg => { clearTimeout(timeout); setError(msg); setLoading(false); socket.disconnect(); });
    socket.once('roomJoined', ({ myIdx, isPublic: pub, roomName: rn }) => {
      clearTimeout(timeout);
      setLoading(false);
      window.history.replaceState({}, '', window.location.pathname);
      onJoined(joinName.trim(), joinCode.trim().toUpperCase(), myIdx, pub, rn);
    });

    function doJoin() {
      socket.emit('joinRoom', { playerName: joinName.trim(), code: joinCode.trim().toUpperCase() });
    }

    if (socket.connected) {
      doJoin();
    } else {
      socket.once('connect', doJoin);
      socket.connect();
    }
  }

  function handleLobbyJoin(roomCode) {
    if (!lobbyName.trim()) { setError(T('enterNameFirst')); return; }
    setLoading(true); setError('');
    // Socket is already connected from lobby tab
    socket.once('joinError', msg => { setError(msg); setLoading(false); });
    socket.once('roomJoined', ({ code, myIdx, isPublic: pub, roomName: rn }) => {
      setLoading(false);
      joinedRoomRef.current = true;
      window.history.replaceState({}, '', window.location.pathname);
      onJoined(lobbyName.trim(), roomCode, myIdx, pub, rn);
    });
    socket.emit('joinRoom', { playerName: lobbyName.trim(), code: roomCode });
  }

  const tabStyle = (active) => ({
    flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
    fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13,
    background: active ? '#FFD700' : 'rgba(255,255,255,.06)',
    color: active ? '#111' : '#aaa', transition: 'all .15s',
  });
  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid #2a2a4a',
    background: '#0f1117', color: '#eee', fontFamily: "'Fredoka',sans-serif",
    fontSize: 15, outline: 'none', boxSizing: 'border-box',
  };
  const toggleStyle = (active) => ({
    flex: 1, padding: '8px 4px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
    border: active ? '2px solid #FFD700' : '2px solid #2a2a4a',
    background: active ? 'rgba(255,215,0,.08)' : 'rgba(255,255,255,.02)',
    transition: 'all .15s',
  });

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
        maxWidth: 480, width: '92vw',
        boxShadow: '0 8px 40px rgba(0,0,0,.6)', border: '2px solid #2a2a4a',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 50, marginBottom: 8 }}>🌐</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#FFD700' }}>{T('multiplayerOnline')}</h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>{T('playWithFriends')}</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          <button style={tabStyle(tab === 'create')} onClick={() => { setTab('create'); setError(''); }}>
            {T('createRoom')}
          </button>
          <button style={tabStyle(tab === 'lobby')} onClick={() => { setTab('lobby'); setError(''); }}>
            {T('lobby')}
          </button>
          <button style={tabStyle(tab === 'join')} onClick={() => { setTab('join'); setError(''); }}>
            {T('code')}
          </button>
        </div>

        {tab === 'create' && (
          <div>
            {!user && (<>
              <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>{T('yourName')}</label>
              <input
                value={name} onChange={e => setName(e.target.value)}
                placeholder={T('enterName')}
                maxLength={20} style={inputStyle}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </>)}

            {/* Public / Private toggle */}
            <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6, marginTop: 16 }}>{T('roomType')}</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: isPublic ? 14 : 0 }}>
              <div onClick={() => setIsPublic(false)} style={toggleStyle(!isPublic)}>
                <div style={{ fontSize: 13, fontWeight: 700, color: !isPublic ? '#FFD700' : '#ccc' }}>{T('private')}</div>
                <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{T('codeOnly')}</div>
              </div>
              <div onClick={() => setIsPublic(true)} style={toggleStyle(isPublic)}>
                <div style={{ fontSize: 13, fontWeight: 700, color: isPublic ? '#FFD700' : '#ccc' }}>{T('public')}</div>
                <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{T('visibleInLobby')}</div>
              </div>
            </div>

            {isPublic && (
              <div>
                <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>{T('roomName')}</label>
                <input
                  value={roomName} onChange={e => setRoomName(e.target.value)}
                  placeholder={T('roomNamePlaceholder')}
                  maxLength={30} style={inputStyle}
                />
              </div>
            )}

            <Btn
              onClick={handleCreate}
              disabled={!name.trim() || (isPublic && !roomName.trim()) || loading}
              color="#FFD700"
              style={{ width: '100%', fontSize: 16, padding: '12px 0', marginTop: 20 }}
            >
              {loading ? T('creating') : T('createRoomBtn')}
            </Btn>
          </div>
        )}

        {tab === 'lobby' && (
          <div>
            {!user && (<>
              <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>{T('yourName')}</label>
              <input
                value={lobbyName} onChange={e => setLobbyName(e.target.value)}
                placeholder={T('enterName')}
                maxLength={20} style={{ ...inputStyle, marginBottom: 16 }}
              />
            </>)}

            <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>{T('publicRooms')}</label>
            {lobbyLoading ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#888', fontSize: 13 }}>
                {T('loadingRooms')}
              </div>
            ) : lobbyRooms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: '#555', fontSize: 13 }}>
                {T('noPublicRooms')}
              </div>
            ) : (
              <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {lobbyRooms.map(room => (
                  <div key={room.code} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,.04)', border: '2px solid #2a2a4a',
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#eee', fontSize: 14 }}>{room.roomName}</div>
                      <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                        👑 {room.hostName} · {room.playerCount}/4 {T('players')}
                      </div>
                    </div>
                    <Btn
                      onClick={() => handleLobbyJoin(room.code)}
                      disabled={loading}
                      color="#00BCD4"
                      style={{ fontSize: 13, padding: '8px 16px' }}
                    >
                      {T('join')}
                    </Btn>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'join' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {!user && (
              <div>
                <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>{T('yourName')}</label>
                <input
                  value={joinName} onChange={e => setJoinName(e.target.value)}
                  placeholder={T('enterName')} maxLength={20} style={inputStyle}
                />
              </div>
            )}
            <div>
              <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>{T('roomCode')}</label>
              <input
                value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder={T('roomCodePlaceholder')} maxLength={7} style={{ ...inputStyle, letterSpacing: 4, textTransform: 'uppercase' }}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
              />
            </div>
            <Btn
              onClick={handleJoin}
              disabled={!joinName.trim() || !joinCode.trim() || loading}
              color="#00BCD4"
              style={{ width: '100%', fontSize: 16, padding: '12px 0' }}
            >
              {loading ? T('joining') : T('joinBtn')}
            </Btn>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: 'rgba(244,67,54,.15)', border: '1px solid #f44336', color: '#ef9a9a', fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button onClick={onBack} style={{
            background: 'none', border: 'none', color: '#555', cursor: 'pointer',
            fontFamily: "'Fredoka',sans-serif", fontSize: 13,
          }}>
            {T('backToMenu')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Online Lobby (waiting room before game starts) ────────────────────────────
function OnlineLobby({ roomCode, myName, isHost, players, onStart, onBack, isPublic, roomDisplayName, T, user }) {
  const [gameMode, setGameMode] = useState('clon');
  const [burgerCount, setBurgerCount] = useState(2);
  const [ingredientCount, setIngredientCount] = useState(5);
  const [hatPicks, setHatPicks] = useState({});
  const [copied, setCopied] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteFriends, setInviteFriends] = useState([]);
  const [inviteSentTo, setInviteSentTo] = useState(new Set());
  const [friendReqSent, setFriendReqSent] = useState(new Set());
  const [existingFriends, setExistingFriends] = useState(new Set());
  const [lobbyChat, setLobbyChat] = useState([]);
  const [lobbyChatInput, setLobbyChatInput] = useState('');
  const [showLobbyChat, setShowLobbyChat] = useState(false);
  const lobbyChatEndRef = useRef(null);

  // Load existing friends on mount to hide "Add" button for them
  useEffect(() => {
    if (!user) return;
    getFriends().then(friends => {
      setExistingFriends(new Set(friends.map(f => f.username)));
    }).catch(() => {});
  }, [user]);

  // Lobby chat listener
  useEffect(() => {
    const handleChat = (msg) => setLobbyChat(prev => [...prev, msg]);
    socket.on('chatMessage', handleChat);
    return () => socket.off('chatMessage', handleChat);
  }, []);

  useEffect(() => {
    if (showLobbyChat && lobbyChatEndRef.current) {
      lobbyChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lobbyChat, showLobbyChat]);

  function sendLobbyChat() {
    if (!lobbyChatInput.trim()) return;
    socket.emit('chatMessage', { code: roomCode, playerName: myName, text: lobbyChatInput.trim() });
    setLobbyChatInput('');
  }

  function handleCopyLink() {
    const link = window.location.origin + '/?sala=' + roomCode;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function toggleInvitePanel() {
    if (showInvite) { setShowInvite(false); return; }
    setShowInvite(true);
    try {
      const friends = await getFriends();
      setInviteFriends(friends.filter(f => f.online));
    } catch { setInviteFriends([]); }
  }

  function handleInvite(friendId) {
    socket.emit('roomInvite', { friendUserId: friendId });
    setInviteSentTo(prev => new Set([...prev, friendId]));
  }

  async function handleAddFriendFromLobby(username) {
    setFriendReqSent(prev => new Set([...prev, username]));
    try { await sendFriendRequest(username); } catch {}
  }

  const myHat = hatPicks[myName];

  // Listen for other players' hat picks
  useEffect(() => {
    const handleHatPick = ({ playerName, hat }) => {
      setHatPicks(prev => ({ ...prev, [playerName]: hat }));
    };
    socket.on('lobbyHatPick', handleHatPick);
    return () => socket.off('lobbyHatPick', handleHatPick);
  }, []);

  const gameModes = [
    { id: 'clon', label: T('modeClon'), desc: T('modeClonDesc') },
    { id: 'escalera', label: T('modeEscalera'), desc: T('modeEscaleraDesc') },
    { id: 'caotico', label: T('modeCaotico'), desc: T('modeCaoticoDesc') },
  ];

  function pickHat(lang) {
    const taken = Object.values(hatPicks);
    if (taken.includes(lang) && hatPicks[myName] !== lang) return;
    setHatPicks(prev => ({ ...prev, [myName]: lang }));
    socket.emit('lobbyHatPick', { code: roomCode, playerName: myName, hat: lang });
  }

  function handleStart() {
    if (!myHat) return;
    const gameConfig = { mode: gameMode, burgerCount, ingredientCount };
    socket.emit('startGame', { code: roomCode, hatPicks, gameConfig });
    onStart(hatPicks, gameConfig);
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#0f1117 0%,#1a1a2e 100%)',
      fontFamily: "'Fredoka',sans-serif",
      overflowY: 'auto', padding: '20px 0',
    }}>
      <div style={{
        background: '#16213e', borderRadius: 20,
        padding: 'clamp(18px, 4vw, 32px) clamp(14px, 4vw, 36px)',
        maxWidth: 560, width: '94vw',
        boxShadow: '0 8px 40px rgba(0,0,0,.6)', border: '2px solid #2a2a4a',
      }}>
        {/* Room info display */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          {isPublic ? (
            <>
              <div style={{ fontSize: 13, color: '#888', fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>{T('publicRoom')}</div>
              <div style={{
                fontSize: 24, fontWeight: 900, color: '#FFD700',
                background: 'rgba(255,215,0,.08)', borderRadius: 12, padding: '10px 20px',
                border: '2px dashed rgba(255,215,0,.3)',
              }}>
                {roomDisplayName}
              </div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 6 }}>{T('codeLabel')}: {roomCode}</div>
              <button
                onClick={handleCopyLink}
                style={{
                  marginTop: 10, padding: '7px 18px', borderRadius: 10,
                  border: '1px solid rgba(255,215,0,.35)',
                  background: copied ? 'rgba(76,175,80,.18)' : 'rgba(255,215,0,.08)',
                  color: copied ? '#81C784' : '#FFD700',
                  fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', transition: 'all .2s',
                }}
              >
                {copied ? T('linkCopied') : T('inviteLink')}
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, color: '#888', fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>{T('privateRoom')}</div>
              <div style={{
                fontSize: 36, fontWeight: 900, color: '#FFD700', letterSpacing: 8,
                background: 'rgba(255,215,0,.08)', borderRadius: 12, padding: '10px 20px',
                border: '2px dashed rgba(255,215,0,.3)',
              }}>
                {roomCode}
              </div>
              <div style={{ fontSize: 12, color: '#555', marginTop: 8 }}>{T('shareCode')}</div>
              <button
                onClick={handleCopyLink}
                style={{
                  marginTop: 10, padding: '7px 18px', borderRadius: 10,
                  border: '1px solid rgba(255,215,0,.35)',
                  background: copied ? 'rgba(76,175,80,.18)' : 'rgba(255,215,0,.08)',
                  color: copied ? '#81C784' : '#FFD700',
                  fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', transition: 'all .2s',
                }}
              >
                {copied ? T('linkCopied') : T('inviteLink')}
              </button>
            </>
          )}
          {/* Invite Friend Button */}
          {user && players.length < 4 && (
            <div style={{ marginTop: 12, position: 'relative' }}>
              <button onClick={toggleInvitePanel} style={{
                padding: '7px 18px', borderRadius: 10,
                border: '1px solid rgba(78,205,196,.35)',
                background: showInvite ? 'rgba(78,205,196,.18)' : 'rgba(78,205,196,.08)',
                color: '#4ecdc4', fontFamily: "'Fredoka',sans-serif", fontWeight: 700,
                fontSize: 13, cursor: 'pointer', transition: 'all .2s',
              }}>
                {T('inviteFriend')}
              </button>
              {showInvite && (
                <div style={{
                  position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                  marginTop: 8, background: '#1a2744', borderRadius: 12,
                  border: '1px solid #2a2a4a', padding: 12, minWidth: 220,
                  boxShadow: '0 8px 24px rgba(0,0,0,.5)', zIndex: 10,
                }}>
                  {inviteFriends.length === 0 ? (
                    <p style={{ color: '#666', fontSize: 12, textAlign: 'center', margin: 0 }}>{T('noFriends')}</p>
                  ) : inviteFriends.map(f => (
                    <div key={f.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 8px', borderRadius: 8, marginBottom: 4,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4CAF50' }} />
                        <span style={{ color: '#eee', fontSize: 13, fontWeight: 700 }}>{f.displayName}</span>
                      </div>
                      <button
                        onClick={() => handleInvite(f.id)}
                        disabled={inviteSentTo.has(f.id)}
                        style={{
                          padding: '3px 10px', borderRadius: 6, border: 'none',
                          background: inviteSentTo.has(f.id) ? 'rgba(76,175,80,.15)' : 'rgba(78,205,196,.15)',
                          color: inviteSentTo.has(f.id) ? '#81C784' : '#4ecdc4',
                          fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 11,
                          cursor: inviteSentTo.has(f.id) ? 'default' : 'pointer',
                        }}
                      >
                        {inviteSentTo.has(f.id) ? T('inviteSent') : T('inviteToRoom')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Players */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#555', letterSpacing: 1, marginBottom: 10 }}>
            {typeof T('playersCount') === 'function' ? T('playersCount')(players.length) : `PLAYERS (${players.length}/4)`}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {players.map((p, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                borderRadius: 10, background: 'rgba(255,255,255,.04)',
                border: `2px solid ${PLAYER_COLORS[i % PLAYER_COLORS.length]}44`,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: PLAYER_COLORS[i % PLAYER_COLORS.length] + '33',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 900, color: PLAYER_COLORS[i % PLAYER_COLORS.length],
                }}>
                  {i + 1}
                </div>
                <span style={{ fontWeight: 700, color: '#eee' }}>{p.name}</span>
                {p.name === myName && <span style={{ fontSize: 11, color: '#888' }}>{T('you')}</span>}
                {i === 0 && <span style={{ fontSize: 11, color: '#FFD700', marginLeft: 'auto' }}>{T('host')}</span>}
                {hatPicks[p.name] && (
                  <HatSVG lang={hatPicks[p.name]} size={24} />
                )}
                {user && p.username && p.name !== myName && !existingFriends.has(p.username) && (
                  <button
                    onClick={() => handleAddFriendFromLobby(p.username)}
                    disabled={friendReqSent.has(p.username)}
                    style={{
                      marginLeft: i === 0 ? 0 : 'auto', padding: '3px 10px', borderRadius: 8,
                      border: 'none', fontFamily: "'Fredoka',sans-serif", fontWeight: 700,
                      fontSize: 11, cursor: friendReqSent.has(p.username) ? 'default' : 'pointer',
                      background: friendReqSent.has(p.username) ? 'rgba(76,175,80,.15)' : 'rgba(78,205,196,.15)',
                      color: friendReqSent.has(p.username) ? '#81C784' : '#4ecdc4',
                      transition: 'all .2s',
                    }}
                  >
                    {friendReqSent.has(p.username) ? '✓' : T('addFriendShort')}
                  </button>
                )}
              </div>
            ))}
            {players.length < 2 && (
              <div style={{ fontSize: 12, color: '#555', textAlign: 'center', padding: 8 }}>
                {T('waitingPlayers')}
              </div>
            )}
          </div>
        </div>

        {/* Hat selection for current player */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: '#aaa', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8 }}>
            {T('yourLanguage')} {myHat ? '✅' : T('chooseOne')}
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {LANGUAGES.map(lang => {
              const takenBy = Object.entries(hatPicks).find(([n, h]) => h === lang && n !== myName);
              const isTaken = !!takenBy;
              return (
                <div
                  key={lang}
                  onClick={() => !isTaken && pickHat(lang)}
                  style={{
                    flex: '1 1 28%', minWidth: 75, padding: '6px 4px', borderRadius: 8, cursor: isTaken ? 'not-allowed' : 'pointer',
                    border: myHat === lang ? '2px solid #FFD700' : `2px solid ${LANG_BORDER[lang]}44`,
                    background: myHat === lang ? 'rgba(255,215,0,.1)' : isTaken ? 'rgba(0,0,0,.2)' : 'rgba(255,255,255,.02)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    opacity: isTaken ? 0.4 : 1, transition: 'all .15s',
                  }}
                >
                  <HatSVG lang={lang} size={28} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: myHat === lang ? '#FFD700' : LANG_TEXT[lang] }}>
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </span>
                  {isTaken && <span style={{ fontSize: 9, color: '#888' }}>{takenBy[0]}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Game Mode (host only) */}
        {isHost && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: '#aaa', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8 }}>{T('gameMode')}</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {gameModes.map(m => (
                <div
                  key={m.id}
                  onClick={() => setGameMode(m.id)}
                  style={{
                    flex: 1, padding: '7px 4px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                    border: gameMode === m.id ? '2px solid #FFD700' : '2px solid #2a2a4a',
                    background: gameMode === m.id ? 'rgba(255,215,0,.08)' : 'rgba(255,255,255,.02)',
                    transition: 'all .15s',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: gameMode === m.id ? '#FFD700' : '#ccc' }}>{m.label}</div>
                  <div style={{ fontSize: 9, color: '#666', marginTop: 2 }}>{m.desc}</div>
                </div>
              ))}
            </div>

            {/* Burger count (clon & escalera) */}
            {gameMode !== 'caotico' && (
              <div style={{ marginTop: 12 }}>
                <label style={{ color: '#aaa', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                  {T('burgerCount')}: <span style={{ color: '#FFD700' }}>{burgerCount}</span>
                </label>
                <input
                  type="range" min={1} max={4} value={burgerCount}
                  onChange={e => setBurgerCount(+e.target.value)}
                  style={{ width: '100%', accentColor: '#FFD700' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#555', marginTop: 2 }}>
                  <span>1</span><span>4</span>
                </div>
              </div>
            )}

            {/* Ingredient count (clon only) */}
            {gameMode === 'clon' && (
              <div style={{ marginTop: 12 }}>
                <label style={{ color: '#aaa', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                  {T('ingredientCount')}: <span style={{ color: '#FFD700' }}>{ingredientCount}</span>
                </label>
                <input
                  type="range" min={2} max={8} value={ingredientCount}
                  onChange={e => setIngredientCount(+e.target.value)}
                  style={{ width: '100%', accentColor: '#FFD700' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#555', marginTop: 2 }}>
                  <span>2</span><span>8</span>
                </div>
              </div>
            )}
          </div>
        )}

        {isHost ? (
          <Btn
            onClick={handleStart}
            disabled={players.length < 2 || !myHat || Object.keys(hatPicks).length < players.length}
            color="#4CAF50"
            style={{ width: '100%', fontSize: 15, padding: '12px 0' }}
          >
            {Object.keys(hatPicks).length < players.length
              ? (typeof T('waitingHats') === 'function' ? T('waitingHats')(Object.keys(hatPicks).length, players.length) : T('waitingHats'))
              : T('startGame')}
          </Btn>
        ) : (
          <div style={{ textAlign: 'center', padding: 12, color: '#888', fontSize: 13 }}>
            {!myHat ? T('chooseHat') : T('waitingHost')}
          </div>
        )}

        {/* Lobby Chat */}
        <div style={{ marginTop: 16 }}>
          <button onClick={() => setShowLobbyChat(s => !s)} style={{
            background: 'none', border: '1px solid #2a2a4a', borderRadius: 10,
            color: showLobbyChat ? '#FFD700' : '#888', fontFamily: "'Fredoka',sans-serif",
            fontWeight: 700, fontSize: 12, padding: '6px 16px', cursor: 'pointer',
            width: '100%', transition: 'all .2s',
          }}>
            {T('chat')} {!showLobbyChat && lobbyChat.length > 0 ? `(${lobbyChat.length})` : ''}
          </button>
          {showLobbyChat && (
            <div style={{
              marginTop: 8, background: 'rgba(0,0,0,.2)', borderRadius: 12,
              border: '1px solid #2a2a4a', overflow: 'hidden',
            }}>
              <div style={{
                maxHeight: 160, overflowY: 'auto', padding: '8px 12px',
              }}>
                {lobbyChat.length === 0 && (
                  <p style={{ color: '#555', fontSize: 12, textAlign: 'center', margin: '8px 0' }}>{T('noMessages')}</p>
                )}
                {lobbyChat.map((msg, i) => (
                  <div key={i} style={{ marginBottom: 4 }}>
                    <span style={{ color: '#4ecdc4', fontSize: 12, fontWeight: 700 }}>{msg.playerName}: </span>
                    <span style={{ color: '#ccc', fontSize: 12 }}>{msg.text}</span>
                  </div>
                ))}
                <div ref={lobbyChatEndRef} />
              </div>
              <div style={{ display: 'flex', borderTop: '1px solid #2a2a4a' }}>
                <input
                  value={lobbyChatInput}
                  onChange={e => setLobbyChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendLobbyChat()}
                  placeholder={T('typeMessage')}
                  maxLength={200}
                  style={{
                    flex: 1, padding: '8px 12px', border: 'none', background: 'transparent',
                    color: '#eee', fontSize: 13, fontFamily: "'Fredoka',sans-serif", outline: 'none',
                  }}
                />
                <button onClick={sendLobbyChat} style={{
                  padding: '8px 14px', border: 'none', background: 'rgba(255,215,0,.1)',
                  color: '#FFD700', fontFamily: "'Fredoka',sans-serif", fontWeight: 700,
                  fontSize: 12, cursor: 'pointer',
                }}>
                  {T('send')}
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <button onClick={onBack} style={{
            background: 'none', border: 'none', color: '#555', cursor: 'pointer',
            fontFamily: "'Fredoka',sans-serif", fontSize: 12,
          }}>
            {T('leaveRoom')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const initialSalaCode = new URLSearchParams(window.location.search).get('sala') || '';
  const hasRoomSession = !!sessionStorage.getItem('hp_room_session');
  const [phase, setPhase] = useState(
    hasRoomSession ? 'reconnecting'
    : initialSalaCode ? 'onlineMenu'
    : (getSavedUser() ? 'setup' : 'auth')
  );
  const [players, setPlayers] = useState([]);
  const [deck, setDeck] = useState([]);
  const [discard, setDiscard] = useState([]);
  const [cp, setCp] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [log, setLog] = useState([]);
  const [modal, setModal] = useState(null);
  const [winner, setWinner] = useState(null);
  const [extraPlay, setExtraPlay] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [mobileTab, setMobileTab] = useState('mesa');
  const [showPercheroModal, setShowPercheroModal] = useState(false);
  const aiRunning = useRef(false);
  const [turnTime, setTurnTime] = useState(60);
  const turnTimerRef = useRef(null);

  // ── Online multiplayer state ──
  const [isOnline, setIsOnline] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [myPlayerIdx, setMyPlayerIdx] = useState(0);
  const [roomCode, setRoomCode] = useState('');
  const [roomIsPublic, setRoomIsPublic] = useState(false);
  const [roomDisplayName, setRoomDisplayName] = useState('');
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [unreadChat, setUnreadChat] = useState(0);
  const chatEndRef = useRef(null);
  const showChatRef = useRef(showChat);
  const lastSyncCpRef = useRef(null);
  const lastExtraPlayRef = useRef(false);
  // Human index: 0 for local/AI mode, myPlayerIdx for online
  const HI = isOnline ? myPlayerIdx : 0;

  // ── Auth state ──
  const [user, setUser] = useState(() => getSavedUser());
  // ── UI language state ──
  const [uiLang, setUiLangState] = useState(() => getUILang());
  const T = useCallback((key) => t(key, uiLang), [uiLang]);
  const handleSetLang = (lang) => { setUILang(lang); setUiLangState(lang); };
  // ── Negación state ──
  // pendingNeg: null | { actingIdx, cardInfo, eligibleIdxs, responses: {i: bool} }
  const [pendingNeg, setPendingNeg] = useState(null);
  // Host-only ref that stores the resolve callback (not serializable over socket)
  const pendingNegRef = useRef(null);

  // ── Voluntary leave state ──
  const [gamePaused, setGamePaused] = useState(false);
  const [pausedMessage, setPausedMessage] = useState('');

  // ── Room invite notification state ──
  const [roomInvite, setRoomInvite] = useState(null);
  const [inviteJoinCode, setInviteJoinCode] = useState('');

  // ── Friend request notification state ──
  const [friendReqNotif, setFriendReqNotif] = useState(null);

  // ── Room invite listener (global) ──
  useEffect(() => {
    const handleRoomInvite = (data) => {
      setRoomInvite(data);
      // Auto-dismiss after 15 seconds
      setTimeout(() => setRoomInvite(prev => prev === data ? null : prev), 15000);
    };
    socket.on('roomInviteReceived', handleRoomInvite);
    return () => socket.off('roomInviteReceived', handleRoomInvite);
  }, []);

  // ── Friend request notification listener (global) ──
  useEffect(() => {
    const handleFriendReq = (data) => {
      setFriendReqNotif(data);
      setTimeout(() => setFriendReqNotif(prev => prev === data ? null : prev), 10000);
    };
    socket.on('friendRequestReceived', handleFriendReq);
    return () => socket.off('friendRequestReceived', handleFriendReq);
  }, []);

  function acceptRoomInvite() {
    if (!roomInvite) return;
    const code = roomInvite.roomCode;
    setRoomInvite(null);
    setInviteJoinCode(code);
    setPhase('onlineMenu');
  }

  // ── Room session persistence for reconnection ──
  function saveRoomSession(data) {
    sessionStorage.setItem('hp_room_session', JSON.stringify(data));
  }
  function clearRoomSession() {
    sessionStorage.removeItem('hp_room_session');
  }
  function getRoomSession() {
    try { return JSON.parse(sessionStorage.getItem('hp_room_session')); }
    catch { return null; }
  }

  // ── Handle voluntary leave from room ──
  function handleVoluntaryLeave() {
    if (!isOnline || !roomCode) return;
    socket.emit('voluntaryLeave', { code: roomCode });
    // Don't disconnect socket — keep it alive for potential rejoin
    setPhase('leftRoom');
  }

  // ── Auto-rejoin on page load ──
  const rejoinAttempted = useRef(false);
  useEffect(() => {
    if (rejoinAttempted.current) return;
    rejoinAttempted.current = true;
    const session = getRoomSession();
    if (!session) return;

    const timeout = setTimeout(() => {
      socket.off('rejoinSuccess');
      socket.off('rejoinError');
      clearRoomSession();
      setPhase(getSavedUser() ? 'setup' : 'auth');
    }, 10000);

    socket.once('rejoinSuccess', ({ myIdx, isHost: host, phase: serverPhase, players: pls, roomIsPublic: pub, roomDisplayName: rn, gameState }) => {
      clearTimeout(timeout);
      setIsOnline(true);
      setIsHost(host);
      setMyPlayerIdx(myIdx);
      setRoomCode(session.roomCode);
      setRoomIsPublic(!!pub);
      setRoomDisplayName(rn || '');
      setLobbyPlayers(pls);
      if (serverPhase === 'playing') {
        if (host && gameState) {
          // Host reconnecting: restore cached game state from server
          setPlayers(gameState.players);
          setDeck(gameState.deck);
          setDiscard(gameState.discard);
          setCp(gameState.cp);
          setLog(gameState.log || []);
          setExtraPlay(gameState.extraPlay || false);
          setModal(null);
          setPendingNeg(gameState.pendingNeg || null);
          if (gameState.winner) { setWinner(gameState.winner); clearRoomSession(); setPhase('gameover'); }
          else setPhase('playing');
        } else if (!host) {
          // Non-host: stateUpdate will arrive from host within 80ms
          setPhase('playing');
        } else {
          // Host but no cached state (edge case) — go to lobby
          setPhase('onlineLobby');
        }
      } else {
        setPhase('onlineLobby');
      }
      // Listen for gameStarted if in lobby
      socket.once('gameStarted', () => setPhase('playing'));
    });

    socket.once('rejoinError', () => {
      clearTimeout(timeout);
      clearRoomSession();
      setPhase(getSavedUser() ? 'setup' : 'auth');
    });

    function doRejoin() {
      const reconnectId = sessionStorage.getItem('hp_reconnect_id');
      socket.emit('rejoinRoom', { reconnectId, roomCode: session.roomCode });
    }

    if (socket.connected) {
      doRejoin();
    } else {
      socket.once('connect', doRejoin);
      socket.connect();
    }
  }, []);

  function addLog(playerIdx, text, pls) {
    const p = pls ? pls[playerIdx] : null;
    const color = PLAYER_COLORS[playerIdx % PLAYER_COLORS.length];
    setLog(prev => [{ player: p ? p.name : '', text, color }, ...prev].slice(0, 40));
  }

  function sendChatMessage() {
    if (!chatInput.trim() || !isOnline) return;
    socket.emit('chatMessage', { code: roomCode, playerName: players[HI]?.name || lobbyPlayers.find(p => p.idx === myPlayerIdx)?.name || 'Jugador', text: chatInput.trim() });
    setChatInput('');
  }

  // ── Socket: lobby updates (hat picks from others) ──
  useEffect(() => {
    if (!isOnline) return;
    socket.on('lobbyUpdate', ({ players: pls }) => setLobbyPlayers(pls));
    socket.on('lobbyHatPick', () => {});  // handled via lobbyUpdate in server if needed
    socket.on('playerLeft', ({ players: pls }) => setLobbyPlayers(pls));
    socket.on('chatMessage', (msg) => {
      setChatMessages(prev => [...prev, msg]);
      if (!showChatRef.current) setUnreadChat(prev => prev + 1);
    });
    socket.on('playerVoluntaryLeft', ({ playerName, activeCount, gameStarted }) => {
      // Add a chat-like message so everyone sees who left
      setChatMessages(prev => [...prev, { playerName: 'Sistema', text: `${playerName} se ha salido del juego`, timestamp: Date.now() }]);
      // If game in progress and only 1 active player left (was 2-player game), pause
      if (gameStarted && activeCount <= 1) {
        setGamePaused(true);
        setPausedMessage(`${playerName} se ha salido. Esperando a que vuelva...`);
      }
    });
    socket.on('playerRejoined', ({ playerName }) => {
      setChatMessages(prev => [...prev, { playerName: 'Sistema', text: `${playerName} ha vuelto al juego`, timestamp: Date.now() }]);
      setGamePaused(false);
      setPausedMessage('');
    });
    socket.on('playerRemovedFromGame', ({ playerIdx, playerName, activeCount }) => {
      setChatMessages(prev => [...prev, { playerName: 'Sistema', text: `${playerName} ha abandonado la partida`, timestamp: Date.now() }]);
      // Remove player from game state (host removes, non-host gets via stateUpdate)
      setPlayers(prev => {
        const updated = prev.filter((_, i) => i !== playerIdx);
        return updated;
      });
      // Adjust current player index if needed
      setCp(prev => {
        if (playerIdx < prev) return prev - 1;
        if (prev >= activeCount) return 0;
        return prev;
      });
      // Adjust myPlayerIdx if our index shifted
      setMyPlayerIdx(prev => playerIdx < prev ? prev - 1 : prev);
      // If only 1 active player left, show alone screen
      if (activeCount <= 1) {
        setGamePaused(true);
        setPausedMessage('alone');
      } else {
        setGamePaused(false);
        setPausedMessage('');
      }
    });
    return () => {
      socket.off('lobbyUpdate');
      socket.off('lobbyHatPick');
      socket.off('playerLeft');
      socket.off('chatMessage');
      socket.off('playerVoluntaryLeft');
      socket.off('playerRejoined');
      socket.off('playerRemovedFromGame');
    };
  }, [isOnline]);

  useEffect(() => { showChatRef.current = showChat; }, [showChat]);
  useEffect(() => {
    if (showChat) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, showChat]);

  // ── Socket: non-host receives full game state from host ──
  useEffect(() => {
    if (!isOnline || isHost) return;
    socket.on('stateUpdate', ({ state }) => {
      setPlayers(state.players);
      setDeck(state.deck);
      setDiscard(state.discard);
      setCp(state.cp);
      setLog(state.log);
      setExtraPlay(state.extraPlay || false);
      setModal(currentModal => {
        const privateModals = ['manual_cambiar', 'manual_cambiar_discard', 'manual_agregar', 'wildcard', 'basurero', 'pickHatReplace', 'pickHatExchange', 'ingredientInfo', 'pickTarget', 'pickIngredient', 'pickIngredientRemote'];
        if (state.modal) return state.modal;
        if (currentModal && privateModals.includes(currentModal.type)) return currentModal;
        return null;
      });
      setPendingNeg(state.pendingNeg || null);
      if (state.winner) { setWinner(state.winner); clearRoomSession(); setPhase('gameover'); }
      else if (state.cp === myPlayerIdx && lastSyncCpRef.current !== myPlayerIdx) {
        // Only show transition when cp just changed to this player's turn
        setPhase('transition');
      } else if (state.cp === myPlayerIdx && state.extraPlay && !lastExtraPlayRef.current) {
        setPhase('transition');
      } else if (state.cp !== myPlayerIdx) {
        setPhase('playing');
      }
      lastSyncCpRef.current = state.cp;
      lastExtraPlayRef.current = state.extraPlay || false;
    });
    return () => socket.off('stateUpdate');
  }, [isOnline, isHost]);

  // ── Socket: host syncs state to all clients after every change ──
  const syncRef = useRef(null);
  useEffect(() => {
    clearTimeout(syncRef.current);
    if (!isOnline || !isHost || phase !== 'playing') return;
    syncRef.current = setTimeout(() => {
      const privateModals = ['manual_cambiar', 'manual_cambiar_discard', 'manual_agregar', 'wildcard', 'basurero', 'pickHatReplace', 'pickHatExchange', 'ingredientInfo', 'pickTarget', 'pickIngredient', 'pickIngredientRemote'];
      const syncModal = modal && privateModals.includes(modal.type) ? null : modal;
      socket.emit('syncState', {
        code: roomCode,
        state: { players, deck, discard, cp, log, extraPlay, modal: syncModal, pendingNeg, winner, phase: 'playing' },
      });
    }, 80);
    return () => clearTimeout(syncRef.current);
  }, [players, deck, discard, cp, log, extraPlay, modal, pendingNeg, winner, phase, isOnline, isHost]);

  // ── Socket: host processes remote player actions ──
  // We store the latest state in refs so the socket handler always has fresh values
  const playersRef = useRef(players);
  const deckRef = useRef(deck);
  const discardRef = useRef(discard);
  const modalRef = useRef(modal);
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { deckRef.current = deck; }, [deck]);
  useEffect(() => { discardRef.current = discard; }, [discard]);
  useEffect(() => { modalRef.current = modal; }, [modal]);

  useEffect(() => {
    if (!isOnline || !isHost) return;
    const handler = ({ playerIdx, action }) => {
      processRemoteAction(playerIdx, action);
    };
    socket.on('remoteAction', handler);
    return () => socket.off('remoteAction', handler);
  }, [isOnline, isHost]);  // eslint-disable-line

  // ── Negación: check before applying any action ──
  // resolveCallback: () => void  — called if action is NOT negated
  function startNegCheck(actingIdx, card, resolveCallback, affectedIdxs) {
    const pls = playersRef.current;
    // Find players who can negate (only affected players with a negación card)
    const eligible = pls.map((_, i) => i).filter(i =>
      i !== actingIdx && pls[i].hand.some(c => c.action === 'negacion') &&
      (!affectedIdxs || affectedIdxs.includes(i))
    );

    if (eligible.length === 0) { resolveCallback(); return; }

    // AI players decide immediately (25% chance to use negación)
    const responses = {};
    for (const i of eligible) {
      if (pls[i].isAI) responses[i] = Math.random() < 0.25;
    }
    const aiNegator = eligible.find(i => pls[i].isAI && responses[i] === true);
    if (aiNegator !== undefined) { cancelWithNegation(actingIdx, aiNegator, card); return; }

    // Human/remote players need to respond
    const humanEligible = eligible.filter(i => !pls[i].isAI);
    if (humanEligible.length === 0) { resolveCallback(); return; }

    pendingNegRef.current = { actingIdx, card, resolveCallback, eligibleIdxs: humanEligible, responses };
    setPendingNeg({ actingIdx, cardInfo: getActionInfo(card.action), eligibleIdxs: humanEligible, responses });
  }

  function cancelWithNegation(actingIdx, negatorIdx, card) {
    const newPls = clone(playersRef.current);
    // Remove action card from acting player's hand (by id, it's still there during neg check)
    const cIdx = newPls[actingIdx].hand.findIndex(c => c.id === card.id);
    if (cIdx !== -1) newPls[actingIdx].hand.splice(cIdx, 1);
    // Remove one negación card from negator's hand
    const nIdx = newPls[negatorIdx].hand.findIndex(c => c.action === 'negacion');
    const negCard = nIdx !== -1 ? newPls[negatorIdx].hand.splice(nIdx, 1)[0] : null;
    const newDiscard = [...discardRef.current, card, ...(negCard ? [negCard] : [])];
    addLog(negatorIdx, `usó 🚫 Negación contra ${newPls[actingIdx].name}!`, newPls);
    setPendingNeg(null); pendingNegRef.current = null;
    endTurn(newPls, deckRef.current, newDiscard, actingIdx);
  }

  // Called by the local eligible player (host or non-host)
  function respondNegation(negar) {
    if (!pendingNeg) return;

    // Non-host sends response via socket; host handles it in processRemoteAction
    if (isOnline && !isHost) {
      socket.emit('playerAction', { code: roomCode, action: { type: 'negationResponse', negar } });
      // Optimistically mark as responded in local display
      setPendingNeg(prev => prev ? { ...prev, responses: { ...prev.responses, [HI]: negar } } : null);
      return;
    }

    if (negar) {
      cancelWithNegation(pendingNeg.actingIdx, HI, pendingNeg.card ?? pendingNegRef.current?.card);
      return;
    }
    // Passed — record and check if all responded
    const newResponses = { ...pendingNeg.responses, [HI]: false };
    if (pendingNegRef.current) pendingNegRef.current.responses = newResponses;
    const remaining = pendingNeg.eligibleIdxs.filter(i => !(i in newResponses));
    if (remaining.length === 0) {
      const cb = pendingNegRef.current?.resolveCallback;
      setPendingNeg(null); pendingNegRef.current = null;
      cb?.();
    } else {
      setPendingNeg(prev => prev ? { ...prev, responses: newResponses } : null);
    }
  }

  // ── Start game (local / vs AI) ──
  function startGame(name, hat, gameConfig, aiCount) {
    const rawDeck = generateDeck();
    const deckArr = [...rawDeck];
    const ps = [];
    ps.push(initPlayer(name, deckArr, hat, gameConfig, false));
    const usedHats = [hat];
    const aiNames = shuffle([...AI_NAMES, 'Maestro Cocinero', 'Hambre Total', 'Chef Políglota']);
    for (let i = 0; i < aiCount; i++) {
      const avail = LANGUAGES.filter(l => !usedHats.includes(l));
      const aiHat = avail.length ? shuffle(avail)[0] : shuffle(LANGUAGES)[0];
      usedHats.push(aiHat);
      ps.push(initPlayer(aiNames[i % aiNames.length], deckArr, aiHat, gameConfig, true));
    }
    setPlayers(ps); setDeck(deckArr); setDiscard([]);
    setCp(0); setLog([]); setSelectedIdx(null); setModal(null);
    setWinner(null); setExtraPlay(false);
    aiRunning.current = false;
    setPhase('playing');
  }

  // ── Start game (online host) ──
  function startOnlineGame(hatPicks, gameConfig, onlinePls) {
    const rawDeck = generateDeck();
    const deckArr = [...rawDeck];
    const ps = onlinePls.map(p => initPlayer(p.name, deckArr, hatPicks[p.name], gameConfig, false));
    // Mark non-host players as remote
    ps.forEach((p, i) => { if (i !== 0) p.isRemote = true; });
    setPlayers(ps); setDeck(deckArr); setDiscard([]);
    setCp(0); setLog([]); setSelectedIdx(null); setModal(null);
    setWinner(null); setExtraPlay(false);
    aiRunning.current = false;
    // Update session to reflect game started
    const session = getRoomSession();
    if (session) saveRoomSession({ ...session, phase: 'playing' });
    setPhase('playing');
  }

  // ── Shared targeted action resolution (used by host for both local and remote players) ──
  function applyTargetedAction(card, actingIdx, ti, action, pls, dk, di) {
    if (card.action === 'gloton') {
      pls[ti].table.forEach(ing => di.push({ type: 'ingredient', ingredient: ingKey(ing), id: uid() }));
      pls[ti].table = [];
      endTurnFromRemote(pls, dk, di, actingIdx);
    } else if (card.action === 'tenedor' && action.ingIdx !== undefined) {
      const stolen = pls[ti].table.splice(action.ingIdx, 1)[0];
      pls[actingIdx].table.push(stolen);
      const { player: up, freed, done } = advanceBurger(pls[actingIdx]);
      pls[actingIdx] = up;
      if (done) { freed.forEach(ing => di.push({ type: 'ingredient', ingredient: ingKey(ing), id: uid() })); }
      endTurnFromRemote(pls, dk, di, actingIdx);
    } else if (card.action === 'ladron') {
      if (pls[ti].mainHats.length > 0) {
        const stolen = pls[ti].mainHats.splice(0, 1)[0];
        pls[actingIdx].mainHats.push(stolen);
        if (pls[ti].mainHats.length > 0) {
          pls[ti].maxHand = Math.min(6, pls[ti].maxHand + 1);
        }
        if (pls[ti].mainHats.length === 0 && pls[ti].perchero.length > 0) {
          setPlayers(pls); setDiscard(di);
          setModal({ type: 'pickHatReplace', newPls: pls, newDiscard: di, victimIdx: ti, fromIdx: actingIdx });
          return;
        }
      }
      endTurnFromRemote(pls, dk, di, actingIdx);
    } else if (card.action === 'intercambio_sombreros') {
      const myHat = action.myHat;
      const theirHat = action.theirHat;
      if (myHat && theirHat) {
        const mi = pls[actingIdx].mainHats.indexOf(myHat);
        const ti2 = pls[ti].mainHats.indexOf(theirHat);
        if (mi !== -1 && ti2 !== -1) {
          pls[actingIdx].mainHats.splice(mi, 1);
          pls[ti].mainHats.splice(ti2, 1);
          pls[actingIdx].mainHats.push(theirHat);
          pls[ti].mainHats.push(myHat);
        }
      } else {
        const tmp = pls[actingIdx].mainHats[0];
        pls[actingIdx].mainHats[0] = pls[ti].mainHats[0];
        pls[ti].mainHats[0] = tmp;
      }
      endTurnFromRemote(pls, dk, di, actingIdx);
    } else if (card.action === 'intercambio_hamburguesa') {
      const tmp = pls[actingIdx].table;
      pls[actingIdx].table = pls[ti].table;
      pls[ti].table = tmp;
      filterTable(pls[actingIdx], di);
      filterTable(pls[ti], di);
      endTurnFromRemote(pls, dk, di, actingIdx);
    }
  }

  // ── Host: process remote player action ──
  function processRemoteAction(idx, action) {
    // Use refs to get fresh values (avoid stale closure)
    {
      const pls = clone(playersRef.current);
      let dk = [...deckRef.current];
      let di = [...discardRef.current];
      const prevModal = modalRef.current;

            const { type } = action;

            if (type === 'playIngredient') {
              const card = pls[idx].hand[action.cardIdx];
              if (!card || !canPlayCard(pls[idx], card)) return;
              addLog(idx, `jugó ${getIngName(card.ingredient, card.language)} ${ING_EMOJI[card.ingredient]}`, pls);
              pls[idx].hand.splice(action.cardIdx, 1);
              pls[idx].table.push(card.ingredient);
              const { player: up, freed, done } = advanceBurger(pls[idx]);
              pls[idx] = up;
              di = [...di, card];
              if (done) { freed.forEach(ing => di.push({ type: 'ingredient', ingredient: ingKey(ing), id: uid() })); addLog(idx, '¡completó una hamburguesa! 🎉', pls); }
              setTimeout(() => endTurnFromRemote(pls, dk, di, idx), 0);

            } else if (type === 'playWildcard') {
              const card = pls[idx].hand[action.cardIdx];
              if (!card) return;
              addLog(idx, 'jugó 🌭 Comodín', pls);
              pls[idx].hand.splice(action.cardIdx, 1);
              pls[idx].table.push('perrito|' + action.ingredient);
              const { player: up, freed, done } = advanceBurger(pls[idx]);
              pls[idx] = up;
              di = [...di, card];
              if (done) { freed.forEach(ing => di.push({ type: 'ingredient', ingredient: ingKey(ing), id: uid() })); addLog(idx, '¡completó una hamburguesa! 🎉', pls); }
              setTimeout(() => endTurnFromRemote(pls, dk, di, idx), 0);

            } else if (type === 'discard') {
              const card = pls[idx].hand[action.cardIdx];
              if (!card) return;
              addLog(idx, `descartó una carta`, pls);
              pls[idx].hand.splice(action.cardIdx, 1);
              di = [...di, card];
              setTimeout(() => endTurnFromRemote(pls, dk, di, idx), 0);

            } else if (type === 'playMass') {
              const card = pls[idx].hand[action.cardIdx];
              if (!card) return;
              const info = getActionInfo(card.action);
              addLog(idx, `jugó ${info.name} ${info.emoji}`, pls);
              startNegCheck(idx, card, () => {
                const fp = clone(playersRef.current);
                const ci = fp[idx].hand.findIndex(c => c.id === card.id);
                if (ci !== -1) fp[idx].hand.splice(ci, 1);
                const fd = [...discardRef.current, card];
                const r = applyMass(fp, fd, card.action, idx);
                endTurnFromRemote(r.players, deckRef.current, r.discard, idx);
              });
              return;

            } else if (type === 'playActionTarget') {
              const card = pls[idx].hand[action.cardIdx];
              if (!card) return;
              const info = getActionInfo(card.action);
              const ti = action.targetIdx;
              addLog(idx, `jugó ${info.name} ${info.emoji} contra ${pls[ti].name}`, pls);
              startNegCheck(idx, card, () => {
                const fp = clone(playersRef.current);
                const fd = [...discardRef.current];
                const ci = fp[idx].hand.findIndex(c => c.id === card.id);
                if (ci !== -1) fp[idx].hand.splice(ci, 1);
                const fd2 = [...fd, card];
                applyTargetedAction(card, idx, ti, action, fp, deckRef.current, fd2);
              }, [ti]);
              return;

            } else if (type === 'playBasurero') {
              const card = pls[idx].hand[action.cardIdx];
              if (!card) return;
              pls[idx].hand.splice(action.cardIdx, 1);
              di = [...di, card];
              const found = di.find(c => c.id === action.pickedCardId);
              if (found) {
                di = di.filter(c => c.id !== action.pickedCardId);
                pls[idx].hand.push(found);
                addLog(idx, 'rescató una carta del 🗑️ basurero', pls);
              }
              setTimeout(() => endTurnFromRemote(pls, dk, di, idx), 0);

            } else if (type === 'manualCambiar') {
              const p = pls[idx];
              const hi = p.perchero.indexOf(action.hatLang);
              if (hi === -1) return;
              p.perchero.splice(hi, 1);
              const oldMain = p.mainHats[0];
              p.mainHats[0] = action.hatLang;
              p.perchero.push(oldMain);
              let discarded;
              if (action.cardIndices) {
                const sorted = [...action.cardIndices].sort((a, b) => b - a);
                discarded = sorted.map(i => p.hand.splice(i, 1)[0]);
              } else {
                const cost = Math.ceil(p.hand.length / 2);
                discarded = p.hand.splice(0, cost);
              }
              di = [...di, ...discarded];
              addLog(idx, `cambió sombrero a ${action.hatLang} (descartó ${discarded.length} cartas)`, pls);
              setPlayers(pls); setDiscard(di); setExtraPlay(true);

            } else if (type === 'manualAgregar') {
              const p = pls[idx];
              const hi = p.perchero.indexOf(action.hatLang);
              if (hi === -1) return;
              p.perchero.splice(hi, 1);
              p.mainHats.push(action.hatLang);
              p.manuallyAddedHats = [...(p.manuallyAddedHats || []), action.hatLang];
              di = [...di, ...p.hand];
              p.hand = [];
              p.maxHand = Math.max(1, p.maxHand - 1);
              const { drawn, deck: nd, discard: nd2 } = drawN(dk, di, p.maxHand);
              p.hand = drawn; dk = nd; di = nd2;
              addLog(idx, `agregó sombrero ${action.hatLang} — mano máx reducida a ${p.maxHand}`, pls);
              setPlayers(pls); setDeck(dk); setDiscard(di); setExtraPlay(true);

            } else if (type === 'pickHatReplace') {
              // Victim (remote) picks replacement hat after ladron
              if (prevModal?.type === 'pickHatReplace') {
                const { newPls, newDiscard, victimIdx, fromIdx } = prevModal;
                const hi = newPls[victimIdx].perchero.indexOf(action.hatLang);
                if (hi !== -1) {
                  newPls[victimIdx].perchero.splice(hi, 1);
                  newPls[victimIdx].mainHats.push(action.hatLang);
                }
                setModal(null);
                setTimeout(() => endTurnFromRemote(newPls, dk, newDiscard, fromIdx ?? idx), 0);
              }

            } else if (type === 'negationResponse') {
              // Remote player responded to negation window
              if (!pendingNegRef.current) return;
              const pn = pendingNegRef.current;
              if (action.negar) {
                cancelWithNegation(pn.actingIdx, idx, pn.card);
              } else {
                const newResp = { ...pn.responses, [idx]: false };
                pn.responses = newResp;
                const remaining = pn.eligibleIdxs.filter(i => !(i in newResp));
                setPendingNeg(prev => prev ? { ...prev, responses: newResp } : null);
                if (remaining.length === 0) {
                  const cb = pn.resolveCallback;
                  setPendingNeg(null); pendingNegRef.current = null;
                  cb?.();
                }
              }
              return;

            } else if (type === 'passTurn') {
              setExtraPlay(false);
              setTimeout(() => endTurnFromRemote(pls, dk, di, idx), 0);
            }
    }
  }

  function endTurnFromRemote(pls, dk, di, idx) {
    endTurn(pls, dk, di, idx);
  }

  // ── Check win ──
  function checkWin(pls) {
    return pls.find(p => p.currentBurger >= p.totalBurgers) || null;
  }

  // ── End turn ──
  function endTurn(pls, deckArr, discardArr, fromIdx) {
    // Fill hand
    const p = pls[fromIdx];
    const needed = p.maxHand - p.hand.length;
    let newPls = pls, newDeck = deckArr, newDiscard = discardArr;
    if (needed > 0) {
      const { drawn, deck: d, discard: di } = drawN(deckArr, discardArr, needed);
      newPls = clone(pls);
      newPls[fromIdx].hand.push(...drawn);
      newDeck = d;
      newDiscard = di;
    }
    const w = checkWin(newPls);
    if (w) {
      setPlayers(newPls); setDeck(newDeck); setDiscard(newDiscard);
      // Emit final sync with winner BEFORE changing phase (the useEffect guard
      // blocks sync when phase !== 'playing', so we must emit directly here)
      if (isOnline && isHost) {
        socket.emit('syncState', {
          code: roomCode,
          state: { players: newPls, deck: newDeck, discard: newDiscard, cp, log, extraPlay, modal: null, pendingNeg: null, winner: w, phase: 'playing' },
        });
      }
      setWinner(w); clearRoomSession(); setPhase('gameover');
      return;
    }
    const nextIdx = (fromIdx + 1) % newPls.length;
    setPlayers(newPls); setDeck(newDeck); setDiscard(newDiscard);
    setSelectedIdx(null); setExtraPlay(false);
    setCp(nextIdx);
    // In online mode skip transition screen (turn order is visible in UI)
    if (nextIdx === HI) {
      setPhase('transition');
    }
    // If AI, useEffect will trigger
  }

  // ── AI Turn ──
  function runAITurn(pls, deckArr, discardArr, idx) {
    if (aiRunning.current) return;
    aiRunning.current = true;
    const p = pls[idx];

    // Priority 1: Play playable ingredient
    const playableIdx = p.hand.findIndex(c => c.type === 'ingredient' && canPlayCard(p, c));
    if (playableIdx !== -1) {
      const card = p.hand[playableIdx];
      addLog(idx, `jugó ${getIngName(card.ingredient, card.language)} ${ING_EMOJI[card.ingredient]}`, pls);
      const newPls = clone(pls);
      newPls[idx].hand.splice(playableIdx, 1);
      if (card.ingredient === 'perrito') {
        const burger = newPls[idx].burgers[newPls[idx].currentBurger] || [];
        const remaining = [...burger];
        const tableCopy = newPls[idx].table.map(t => t.startsWith('perrito|') ? t.split('|')[1] : t);
        for (let r = remaining.length - 1; r >= 0; r--) {
          const ti = tableCopy.indexOf(remaining[r]);
          if (ti !== -1) { remaining.splice(r, 1); tableCopy.splice(ti, 1); }
        }
        const pick = remaining.length > 0 ? remaining[0] : 'lechuga';
        newPls[idx].table.push('perrito|' + pick);
      } else {
        newPls[idx].table.push(card.ingredient);
      }
      const { player: up, freed, done } = advanceBurger(newPls[idx]);
      newPls[idx] = up;
      let newDiscard = [...discardArr, card];
      if (done) { freed.forEach(ing => newDiscard.push({ type: 'ingredient', ingredient: ingKey(ing), id: `f${Date.now()}${Math.random()}` })); addLog(idx, '¡completó una hamburguesa! 🎉', newPls); }
      setTimeout(() => { aiRunning.current = false; endTurn(newPls, deckArr, newDiscard, idx); }, 900);
      return;
    }

    // Priority 2: Play action card (skip negacion & basurero)
    const actionIdx = p.hand.findIndex(c =>
      c.type === 'action' && c.action !== 'negacion' && c.action !== 'basurero'
    );
    if (actionIdx !== -1) {
      const card = p.hand[actionIdx];
      const info = getActionInfo(card.action);
      const opponents = pls.map((_, i) => i).filter(i => i !== idx);
      const richest = opponents.reduce((b, i) => pls[i].table.length > pls[b].table.length ? i : b, opponents[0]);
      let newPls = clone(pls);
      let newDiscard = [...discardArr, card];
      newPls[idx].hand.splice(actionIdx, 1);
      addLog(idx, `jugó ${info.name} ${info.emoji}`, pls);

      const mass = ['milanesa', 'ensalada', 'pizza', 'parrilla', 'comecomodines'];
      if (mass.includes(card.action)) {
        const r = applyMass(newPls, newDiscard, card.action, idx);
        newPls = r.players; newDiscard = r.discard;
      } else if (card.action === 'gloton') {
        newPls[richest].table.forEach(ing => newDiscard.push({ type: 'ingredient', ingredient: ingKey(ing), id: `g${Date.now()}${Math.random()}` }));
        newPls[richest].table = [];
        addLog(idx, `vació la mesa de ${pls[richest].name}`, newPls);
      } else if (card.action === 'tenedor') {
        if (newPls[richest].table.length > 0) {
          const si = randInt(0, newPls[richest].table.length - 1);
          const stolen = newPls[richest].table.splice(si, 1)[0];
          newPls[idx].table.push(stolen);
          const { player: up2, freed: fr2, done: dn2 } = advanceBurger(newPls[idx]);
          newPls[idx] = up2;
          if (dn2) { fr2.forEach(ing => newDiscard.push({ type: 'ingredient', ingredient: ingKey(ing), id: `t${Date.now()}${Math.random()}` })); }
          addLog(idx, `robó ${ING_EMOJI[ingKey(stolen)]} de ${pls[richest].name}`, newPls);
        }
      } else if (card.action === 'ladron') {
        if (newPls[richest].mainHats.length > 0) {
          const stolen = newPls[richest].mainHats.splice(0, 1)[0];
          newPls[idx].mainHats.push(stolen);
          if (newPls[richest].mainHats.length > 0) {
            newPls[richest].maxHand = Math.min(6, newPls[richest].maxHand + 1);
          }
          if (newPls[richest].mainHats.length === 0 && newPls[richest].perchero.length > 0) {
            const nh = newPls[richest].perchero.shift();
            newPls[richest].mainHats.push(nh);
          }
          addLog(idx, `robó el sombrero ${stolen} de ${pls[richest].name}`, newPls);
        }
      } else if (card.action === 'intercambio_sombreros') {
        if (newPls[idx].mainHats[0] && newPls[richest].mainHats[0]) {
          const tmp = newPls[idx].mainHats[0];
          newPls[idx].mainHats[0] = newPls[richest].mainHats[0];
          newPls[richest].mainHats[0] = tmp;
          addLog(idx, `intercambió sombreros con ${pls[richest].name}`, newPls);
        }
      } else if (card.action === 'intercambio_hamburguesa') {
        const tmp = newPls[idx].table;
        newPls[idx].table = newPls[richest].table;
        newPls[richest].table = tmp;
        filterTable(newPls[idx], newDiscard);
        filterTable(newPls[richest], newDiscard);
        addLog(idx, `intercambió mesa con ${pls[richest].name}`, newPls);
      }

      setTimeout(() => { aiRunning.current = false; endTurn(newPls, deckArr, newDiscard, idx); }, 900);
      return;
    }

    // Priority 3: Discard least valuable
    const di2 = p.hand.findIndex(c => c.type === 'action') !== -1
      ? p.hand.findIndex(c => c.type === 'action') : 0;
    if (p.hand.length > 0) {
      addLog(idx, `descartó una carta`, pls);
      const newPls = clone(pls);
      const card = newPls[idx].hand.splice(di2, 1)[0];
      const newDiscard2 = [...discardArr, card];
      setTimeout(() => { aiRunning.current = false; endTurn(newPls, deckArr, newDiscard2, idx); }, 700);
    } else {
      aiRunning.current = false;
      endTurn(pls, deckArr, discardArr, idx);
    }
  }

  // ── AI useEffect ──
  useEffect(() => {
    if (phase !== 'playing') return;
    if (!players.length) return;
    // Skip if it's a remote player's turn (they handle it on their client)
    if (players[cp]?.isRemote) return;
    if (!players[cp]?.isAI) return;
    if (modal) return;

    const timer = setTimeout(() => {
      runAITurn(players, deck, discard, cp);
    }, 1200);
    return () => clearTimeout(timer);
  }, [phase, cp, players, deck, discard, modal]);

  // ── Turn timer (60s) ──
  useEffect(() => {
    clearInterval(turnTimerRef.current);
    const isTimedPlayer = players[cp] && !players[cp].isAI;
    if (phase !== 'playing' || !isTimedPlayer) { setTurnTime(60); return; }
    setTurnTime(60);
    turnTimerRef.current = setInterval(() => {
      setTurnTime(prev => {
        if (prev <= 1) {
          clearInterval(turnTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(turnTimerRef.current);
  }, [phase, cp, players.length]);

  useEffect(() => {
    if (document.getElementById('pulse-keyframes')) return;
    const style = document.createElement('style');
    style.id = 'pulse-keyframes';
    style.textContent = '@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}';
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    if (turnTime !== 0) return;
    if (phase !== 'playing') return;
    const p = players[cp];
    if (!p || p.isAI) return;
    if (p.hand.length === 0) return;
    // Timeout: discard random card and end turn
    const randIdx = Math.floor(Math.random() * p.hand.length);
    const card = p.hand[randIdx];
    addLog(cp, `se le acabó el tiempo — descartó ${card.type === 'ingredient' ? getIngName(card.ingredient, card.language) : getActionInfo(card.action).name}`, players);
    const newPls = clone(players);
    const discarded = newPls[cp].hand.splice(randIdx, 1)[0];
    setSelectedIdx(null);
    setModal(null);
    endTurn(newPls, deck, [...discard, discarded], cp);
  }, [turnTime]);

  // ── Human: Play selected card ──
  function humanPlay() {
    if (selectedIdx === null) return;
    const human = players[HI];
    const card = human.hand[selectedIdx];

    // Non-host: send action via socket
    if (isOnline && !isHost) {
      if (card.type === 'ingredient') {
        if (!canPlayCard(human, card)) return;
        if (card.ingredient === 'perrito') {
          setModal({ type: 'wildcard', cardIdx: selectedIdx });
          return;
        }
        socket.emit('playerAction', { code: roomCode, action: { type: 'playIngredient', cardIdx: selectedIdx } });
        setSelectedIdx(null);
      } else if (card.type === 'action') {
        humanPlayActionRemote(card, selectedIdx);
      }
      return;
    }

    if (card.type === 'ingredient') {
      if (!canPlayCard(human, card)) return;
      if (card.ingredient === 'perrito') {
        setModal({ type: 'wildcard', cardIdx: selectedIdx });
        return;
      }
      addLog(HI, `jugó ${getIngName(card.ingredient, card.language)} ${ING_EMOJI[card.ingredient]}`, players);
      const newPls = clone(players);
      newPls[HI].hand.splice(selectedIdx, 1);
      newPls[HI].table.push(card.ingredient);
      const { player: up, freed, done } = advanceBurger(newPls[HI]);
      newPls[HI] = up;
      let newDiscard = [...discard, card];
      if (done) {
        freed.forEach(ing => newDiscard.push({ type: 'ingredient', ingredient: ingKey(ing), id: `f${Date.now()}${Math.random()}` }));
        addLog(HI, '¡completó una hamburguesa! 🎉', newPls);
      }
      setSelectedIdx(null);
      setExtraPlay(false);
      endTurn(newPls, deck, newDiscard, HI);

    } else if (card.type === 'action') {
      humanPlayAction(card, selectedIdx);
    }
  }

  // ── Non-host: action card dispatch via socket ──
  function humanPlayActionRemote(card, cardIdx) {
    const mass = ['milanesa', 'ensalada', 'pizza', 'parrilla', 'comecomodines'];
    if (mass.includes(card.action)) {
      socket.emit('playerAction', { code: roomCode, action: { type: 'playMass', cardIdx } });
      setSelectedIdx(null);
    } else if (card.action === 'basurero') {
      const ingCards = discard.filter(c => c.type === 'ingredient');
      if (ingCards.length === 0) { alert('El basurero está vacío'); return; }
      setModal({ type: 'basurero', cardIdx, cards: ingCards });
    } else if (['tenedor', 'ladron', 'intercambio_sombreros', 'intercambio_hamburguesa', 'gloton'].includes(card.action)) {
      setModal({ type: 'pickTarget', cardIdx, action: card.action });
    } else if (card.action === 'negacion') {
      alert('Negación se juega automáticamente cuando un oponente juega una acción.');
    }
  }

  function humanPlayAction(card, cardIdx) {
    const info = getActionInfo(card.action);
    const mass = ['milanesa', 'ensalada', 'pizza', 'parrilla', 'comecomodines'];
    const targeted = ['tenedor', 'ladron', 'intercambio_sombreros', 'intercambio_hamburguesa', 'gloton'];

    if (card.action === 'negacion') {
      alert('Negación se juega automáticamente cuando un oponente juega una acción.');
      return;
    }

    // Targeted actions: pick target FIRST, then negation check (only target can negate)
    if (targeted.includes(card.action)) {
      setSelectedIdx(null);
      setModal({ type: 'pickTarget', cardIdx, action: card.action });
      return;
    }

    setSelectedIdx(null);
    addLog(HI, `jugó ${info.name} ${info.emoji}`, players);

    // Mass actions & basurero: all opponents can negate
    startNegCheck(HI, card, () => {
      const pls = playersRef.current;
      const dk  = deckRef.current;
      const di  = discardRef.current;

      if (mass.includes(card.action)) {
        const newPls = clone(pls);
        const ci = newPls[HI].hand.findIndex(c => c.id === card.id);
        if (ci !== -1) newPls[HI].hand.splice(ci, 1);
        const newDiscard = [...di, card];
        const { players: ps2, discard: di2 } = applyMass(newPls, newDiscard, card.action, HI);
        endTurn(ps2, dk, di2, HI);

      } else if (card.action === 'basurero') {
        const ingCards = di.filter(c => c.type === 'ingredient');
        if (ingCards.length === 0) {
          const newPls = clone(pls);
          const ci = newPls[HI].hand.findIndex(c => c.id === card.id);
          if (ci !== -1) newPls[HI].hand.splice(ci, 1);
          endTurn(newPls, dk, [...di, card], HI);
          return;
        }
        setModal({ type: 'basurero', cardIdx, cards: ingCards });
      }
    });
  }

  function humanDiscard() {
    if (selectedIdx === null) return;
    if (isOnline && !isHost) {
      socket.emit('playerAction', { code: roomCode, action: { type: 'discard', cardIdx: selectedIdx } });
      setSelectedIdx(null);
      return;
    }
    const card = players[HI].hand[selectedIdx];
    addLog(HI, `descartó ${card.type === 'ingredient' ? getIngName(card.ingredient, card.language) : getActionInfo(card.action).name}`, players);
    const newPls = clone(players);
    const discarded = newPls[HI].hand.splice(selectedIdx, 1)[0];
    setSelectedIdx(null);
    endTurn(newPls, deck, [...discard, discarded], HI);
  }

  function confirmWildcard(chosenIng) {
    const { cardIdx } = modal;
    setModal(null); setSelectedIdx(null);
    if (isOnline && !isHost) {
      socket.emit('playerAction', { code: roomCode, action: { type: 'playWildcard', cardIdx, ingredient: chosenIng } });
      return;
    }
    const card = players[HI].hand[cardIdx];
    addLog(HI, 'jugó 🌭 Comodín', players);
    const newPls = clone(players);
    newPls[HI].hand.splice(cardIdx, 1);
    newPls[HI].table.push('perrito|' + chosenIng);
    const { player: up, freed, done } = advanceBurger(newPls[HI]);
    newPls[HI] = up;
    let newDiscard = [...discard, card];
    if (done) {
      freed.forEach(ing => newDiscard.push({ type: 'ingredient', ingredient: ingKey(ing), id: `f${Date.now()}${Math.random()}` }));
      addLog(HI, '¡completó una hamburguesa! 🎉', newPls);
    }
    setExtraPlay(false);
    endTurn(newPls, deck, newDiscard, HI);
  }

  // ── Modal resolvers ──
  function resolvePickTarget(targetIdx) {
    const { cardIdx, action } = modal;
    setModal(null); setSelectedIdx(null);

    // Non-host: send action via socket (tenedor needs ingIdx too, handled via nested modal)
    if (isOnline && !isHost) {
      if (action === 'tenedor') {
        // Show ingredient picker locally, then send complete action
        const newPls = clone(players);
        const card = newPls[HI].hand[cardIdx];
        newPls[HI].hand.splice(cardIdx, 1);
        const newDiscard = [...discard, card];
        if (newPls[targetIdx].table.length === 0) return;
        setModal({ type: 'pickIngredientRemote', targetIdx, cardIdx, newPls, newDiscard });
      } else if (action === 'intercambio_sombreros') {
        // Show hat exchange picker locally
        setModal({ type: 'pickHatExchange', targetIdx, cardIdx, isRemote: true });
      } else {
        socket.emit('playerAction', { code: roomCode, action: { type: 'playActionTarget', cardIdx, targetIdx, action } });
      }
      return;
    }

    const card = players[HI].hand[cardIdx];
    const info = getActionInfo(action);
    addLog(HI, `jugó ${info.name} ${info.emoji} contra ${players[targetIdx].name}`, players);

    // Negation check: only the targeted player can negate
    startNegCheck(HI, card, () => {
      const pls = playersRef.current;
      const dk  = deckRef.current;
      const di  = discardRef.current;
      const newPls = clone(pls);
      const ci = newPls[HI].hand.findIndex(c => c.id === card.id);
      if (ci !== -1) newPls[HI].hand.splice(ci, 1);
      let newDiscard = [...di, card];

      if (action === 'gloton') {
        newPls[targetIdx].table.forEach(ing => newDiscard.push({ type: 'ingredient', ingredient: ingKey(ing), id: `g${Date.now()}` }));
        newPls[targetIdx].table = [];
        endTurn(newPls, dk, newDiscard, HI);

      } else if (action === 'tenedor') {
        if (newPls[targetIdx].table.length === 0) return;
        setModal({ type: 'pickIngredient', targetIdx, newPls, newDiscard });

      } else if (action === 'ladron') {
        if (newPls[targetIdx].mainHats.length === 0) return;
        const stolen = newPls[targetIdx].mainHats.splice(0, 1)[0];
        newPls[HI].mainHats.push(stolen);
        if (newPls[targetIdx].mainHats.length > 0) {
          newPls[targetIdx].maxHand = Math.min(6, newPls[targetIdx].maxHand + 1);
        }
        addLog(HI, `robó el sombrero ${stolen}`, newPls);
        if (newPls[targetIdx].mainHats.length === 0) {
          if (newPls[targetIdx].perchero.length > 0) {
            if (newPls[targetIdx].isAI) {
              const nh = newPls[targetIdx].perchero.shift();
              newPls[targetIdx].mainHats.push(nh);
              endTurn(newPls, dk, newDiscard, HI);
            } else if (newPls[targetIdx].isRemote) {
              setModal({ type: 'pickHatReplace', newPls, newDiscard, victimIdx: targetIdx, fromIdx: HI });
              setPlayers(newPls); setDiscard(newDiscard);
            } else {
              setModal({ type: 'pickHatReplace', newPls, newDiscard, victimIdx: targetIdx });
            }
            return;
          }
        }
        endTurn(newPls, dk, newDiscard, HI);

      } else if (action === 'intercambio_sombreros') {
        if (newPls[HI].mainHats.length > 0 && newPls[targetIdx].mainHats.length > 0) {
          setModal({ type: 'pickHatExchange', targetIdx, newPls, newDiscard, dk });
        } else {
          endTurn(newPls, dk, newDiscard, HI);
        }

      } else if (action === 'intercambio_hamburguesa') {
        const tmp = newPls[HI].table;
        newPls[HI].table = newPls[targetIdx].table;
        newPls[targetIdx].table = tmp;
        filterTable(newPls[HI], newDiscard);
        filterTable(newPls[targetIdx], newDiscard);
        endTurn(newPls, dk, newDiscard, HI);

      }
    }, [targetIdx]);
  }

  function resolvePickIngredient(ingIdx) {
    const { targetIdx, newPls, newDiscard } = modal;
    setModal(null); setSelectedIdx(null);
    // Non-host: send complete action
    if (isOnline && !isHost) {
      const { cardIdx } = modal;
      socket.emit('playerAction', { code: roomCode, action: { type: 'playActionTarget', cardIdx, targetIdx, action: 'tenedor', ingIdx } });
      return;
    }
    const stolen = newPls[targetIdx].table.splice(ingIdx, 1)[0];
    newPls[HI].table.push(stolen);
    const { player: up, freed, done } = advanceBurger(newPls[HI]);
    newPls[HI] = up;
    let fd = newDiscard;
    if (done) { freed.forEach(ing => fd = [...fd, { type: 'ingredient', ingredient: ingKey(ing), id: `t${Date.now()}` }]); addLog(HI, '¡completó una hamburguesa! 🎉', newPls); }
    endTurn(newPls, deck, fd, HI);
  }

  function resolveHatReplace(hatLang) {
    const { newPls, newDiscard, victimIdx, fromIdx } = modal;
    setModal(null); setSelectedIdx(null);
    // Non-host victim sends their hat pick
    if (isOnline && !isHost) {
      socket.emit('playerAction', { code: roomCode, action: { type: 'pickHatReplace', hatLang } });
      return;
    }
    const hi = newPls[victimIdx].perchero.indexOf(hatLang);
    newPls[victimIdx].perchero.splice(hi, 1);
    newPls[victimIdx].mainHats.push(hatLang);
    endTurn(newPls, deck, newDiscard, fromIdx ?? HI);
  }

  function resolveHatExchange(myHat, theirHat) {
    const { targetIdx, newPls, newDiscard, dk, cardIdx, isRemote } = modal;
    setModal(null); setSelectedIdx(null);
    // Non-host: send complete action via socket
    if (isOnline && !isHost) {
      socket.emit('playerAction', { code: roomCode, action: { type: 'playActionTarget', cardIdx, targetIdx, action: 'intercambio_sombreros', myHat, theirHat } });
      return;
    }
    // Host/local: execute swap
    const mi = newPls[HI].mainHats.indexOf(myHat);
    const ti = newPls[targetIdx].mainHats.indexOf(theirHat);
    if (mi !== -1 && ti !== -1) {
      newPls[HI].mainHats.splice(mi, 1);
      newPls[targetIdx].mainHats.splice(ti, 1);
      newPls[HI].mainHats.push(theirHat);
      newPls[targetIdx].mainHats.push(myHat);
    }
    endTurn(newPls, dk || deck, newDiscard || discard, HI);
  }

  // Manual: swap main hat from perchero (costs half your hand — player chooses which cards)
  function resolveManualCambiar(hatLang, cardIndices) {
    setModal(null); setSelectedIdx(null);
    if (isOnline && !isHost) {
      socket.emit('playerAction', { code: roomCode, action: { type: 'manualCambiar', hatLang, cardIndices } });
      return;
    }
    const newPls = clone(players);
    const p = newPls[HI];
    const hi = p.perchero.indexOf(hatLang);
    p.perchero.splice(hi, 1);
    const oldMain = p.mainHats[0];
    p.mainHats[0] = hatLang;
    p.perchero.push(oldMain);
    const sorted = [...cardIndices].sort((a, b) => b - a);
    const discarded = sorted.map(i => p.hand.splice(i, 1)[0]);
    let newDiscard = [...discard, ...discarded];
    const cost = discarded.length;
    addLog(HI, `cambió sombrero a ${hatLang} (descartó ${cost} carta${cost !== 1 ? 's' : ''}) — puede jugar un ingrediente`, newPls);
    setPlayers(newPls); setDiscard(newDiscard); setExtraPlay(true); setPhase('transition');
  }

  // Manual: add an extra hat from perchero (costs discarding entire hand, reduces maxHand)
  function resolveManualAgregar(hatLang) {
    setModal(null); setSelectedIdx(null);
    if (isOnline && !isHost) {
      socket.emit('playerAction', { code: roomCode, action: { type: 'manualAgregar', hatLang } });
      return;
    }
    const newPls = clone(players);
    const p = newPls[HI];
    const hi = p.perchero.indexOf(hatLang);
    p.perchero.splice(hi, 1);
    p.mainHats.push(hatLang);
    p.manuallyAddedHats = [...(p.manuallyAddedHats || []), hatLang];
    let newDiscard = [...discard, ...p.hand];
    p.hand = [];
    p.maxHand = Math.max(1, p.maxHand - 1);
    const { drawn, deck: newDeck, discard: di2 } = drawN(deck, newDiscard, p.maxHand);
    p.hand = drawn;
    addLog(HI, `agregó sombrero ${hatLang} — mano máx reducida a ${p.maxHand}`, newPls);
    setPlayers(newPls); setDeck(newDeck); setDiscard(di2); setExtraPlay(true); setPhase('transition');
  }

  function resolveBasurero(cardId) {
    const { cardIdx } = modal;
    setModal(null); setSelectedIdx(null);
    if (isOnline && !isHost) {
      socket.emit('playerAction', { code: roomCode, action: { type: 'playBasurero', cardIdx, pickedCardId: cardId } });
      return;
    }
    const actionCard = players[HI].hand[cardIdx];
    const newPls = clone(players);
    newPls[HI].hand.splice(cardIdx, 1);
    let newDiscard = [...discard, actionCard];
    const found = newDiscard.find(c => c.id === cardId);
    if (found) {
      newDiscard = newDiscard.filter(c => c.id !== cardId);
      newPls[HI].hand.push(found);
      addLog(HI, 'rescató una carta del 🗑️ basurero', newPls);
    }
    endTurn(newPls, deck, newDiscard, HI);
  }

  // ── Render phases ──
  // ── Room invite toast overlay (shown on any screen when invite received) ──
  const inviteToast = roomInvite && (
    <div style={{
      position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
      background: '#1a2744', borderRadius: 16, padding: '14px 20px',
      border: '2px solid #4ecdc4', boxShadow: '0 8px 32px rgba(0,0,0,.6)',
      zIndex: 9999, display: 'flex', alignItems: 'center', gap: 14,
      fontFamily: "'Fredoka',sans-serif", maxWidth: '90vw',
    }}>
      <div>
        <div style={{ color: '#eee', fontSize: 14, fontWeight: 700 }}>
          {roomInvite.fromDisplayName} {T('roomInvite')}
        </div>
        {roomInvite.roomName && (
          <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>{roomInvite.roomName}</div>
        )}
      </div>
      <button onClick={acceptRoomInvite} style={{
        padding: '7px 16px', borderRadius: 10, border: 'none',
        background: '#4ecdc4', color: '#000', fontFamily: "'Fredoka',sans-serif",
        fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
      }}>{T('joinRoom')}</button>
      <button onClick={() => setRoomInvite(null)} style={{
        padding: '7px 12px', borderRadius: 10, border: '1px solid #555',
        background: 'transparent', color: '#888', fontFamily: "'Fredoka',sans-serif",
        fontWeight: 700, fontSize: 13, cursor: 'pointer',
      }}>✕</button>
    </div>
  );

  // ── Friend request toast overlay (shown on any screen) ──
  const friendReqToast = friendReqNotif && (
    <div style={{
      position: 'fixed', bottom: roomInvite ? 90 : 20, left: '50%', transform: 'translateX(-50%)',
      background: '#1a2744', borderRadius: 16, padding: '14px 20px',
      border: '2px solid #FFD700', boxShadow: '0 8px 32px rgba(0,0,0,.6)',
      zIndex: 9999, display: 'flex', alignItems: 'center', gap: 14,
      fontFamily: "'Fredoka',sans-serif", maxWidth: '90vw',
    }}>
      <div>
        <div style={{ color: '#eee', fontSize: 14, fontWeight: 700 }}>
          🤝 {friendReqNotif.fromDisplayName} {T('friendRequestNotif')}
        </div>
      </div>
      <button onClick={() => { setFriendReqNotif(null); setPhase('friends'); }} style={{
        padding: '7px 16px', borderRadius: 10, border: 'none',
        background: '#FFD700', color: '#000', fontFamily: "'Fredoka',sans-serif",
        fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
      }}>{T('viewRequest')}</button>
      <button onClick={() => setFriendReqNotif(null)} style={{
        padding: '7px 12px', borderRadius: 10, border: '1px solid #555',
        background: 'transparent', color: '#888', fontFamily: "'Fredoka',sans-serif",
        fontWeight: 700, fontSize: 13, cursor: 'pointer',
      }}>✕</button>
    </div>
  );

  if (phase === 'reconnecting') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e1a', color: '#FFD700', fontFamily: "'Fredoka',sans-serif", fontSize: 22 }}>
      {T('reconnecting')}
    </div>
  );

  if (phase === 'leftRoom') return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#0f1117 0%,#1a1a2e 100%)', fontFamily: "'Fredoka',sans-serif",
    }}>
      <div style={{ textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🚪</div>
        <h2 style={{ color: '#FFD700', fontSize: 24, fontWeight: 900, marginBottom: 8 }}>
          {T('leftRoom')}
        </h2>
        <p style={{ color: '#aaa', fontSize: 15, marginBottom: 32 }}>
          {T('roomLabel')}: {roomCode}
        </p>
        <p style={{ color: '#ccc', fontSize: 17, marginBottom: 28 }}>
          {T('wantToReturn')}
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <Btn onClick={() => {
            // Rejoin the room
            const reconnectId = sessionStorage.getItem('hp_reconnect_id');
            const timeout = setTimeout(() => {
              socket.off('rejoinSuccess');
              socket.off('rejoinError');
              clearRoomSession();
              setIsOnline(false); setIsHost(false); setMyPlayerIdx(0); setRoomCode('');
              setPhase(getSavedUser() ? 'setup' : 'auth');
            }, 10000);

            socket.once('rejoinSuccess', ({ myIdx, isHost: host, phase: serverPhase, players: pls, roomIsPublic: pub, roomDisplayName: rn, gameState }) => {
              clearTimeout(timeout);
              setIsHost(host);
              setMyPlayerIdx(myIdx);
              setRoomIsPublic(!!pub);
              setRoomDisplayName(rn || '');
              setLobbyPlayers(pls);
              if (serverPhase === 'playing') {
                if (host && gameState) {
                  setPlayers(gameState.players);
                  setDeck(gameState.deck);
                  setDiscard(gameState.discard);
                  setCp(gameState.cp);
                  setLog(gameState.log || []);
                  setExtraPlay(gameState.extraPlay || false);
                  setModal(null);
                  setPendingNeg(gameState.pendingNeg || null);
                  if (gameState.winner) { setWinner(gameState.winner); clearRoomSession(); setPhase('gameover'); }
                  else setPhase('playing');
                } else {
                  setPhase('playing');
                }
              } else {
                setPhase('onlineLobby');
                socket.once('gameStarted', () => setPhase('playing'));
              }
              setGamePaused(false);
              setPausedMessage('');
            });

            socket.once('rejoinError', () => {
              clearTimeout(timeout);
              clearRoomSession();
              setIsOnline(false); setIsHost(false); setMyPlayerIdx(0); setRoomCode('');
              setPhase(getSavedUser() ? 'setup' : 'auth');
            });

            if (socket.connected) {
              socket.emit('rejoinRoom', { reconnectId, roomCode });
            } else {
              socket.once('connect', () => socket.emit('rejoinRoom', { reconnectId, roomCode }));
              socket.connect();
            }
          }} color="#4ecdc4" style={{ fontSize: 16, padding: '12px 32px' }}>
            {T('returnToRoom')}
          </Btn>
          <Btn onClick={() => {
            const reconnectId = sessionStorage.getItem('hp_reconnect_id');
            socket.emit('permanentLeave', { code: roomCode, reconnectId });
            socket.disconnect();
            setIsOnline(false); setIsHost(false); setMyPlayerIdx(0); setRoomCode('');
            setRoomIsPublic(false); setRoomDisplayName('');
            setLobbyPlayers([]);
            clearRoomSession();
            setGamePaused(false);
            setPausedMessage('');
            setPhase('setup');
          }} color="#ff4444" style={{ fontSize: 16, padding: '12px 32px', color: '#fff' }}>
            {T('noGoLobby')}
          </Btn>
        </div>
      </div>
    </div>
  );

  if (phase === 'auth') return (
    <AuthScreen
      onAuth={(u) => { setUser(u); setPhase('setup'); }}
      onGuest={() => setPhase('setup')}
      T={T} uiLang={uiLang} onLangChange={handleSetLang}
    />
  );

  if (phase === 'history' && user) return (
    <>{inviteToast}{friendReqToast}<HistoryScreen user={user} onBack={() => setPhase('setup')} T={T} /></>
  );

  if (phase === 'friends' && user) return (
    <>{inviteToast}{friendReqToast}<FriendsScreen user={user} onBack={() => setPhase('setup')} T={T} /></>
  );

  if (phase === 'setup') return (
    <>{inviteToast}{friendReqToast}
    <SetupScreen
      onStart={startGame}
      onOnline={() => setPhase('onlineMenu')}
      user={user}
      onLogout={() => { clearAuth(); setUser(null); setPhase('auth'); }}
      onHistory={() => setPhase('history')}
      onFriends={() => { socket.connect(); setPhase('friends'); }}
      T={T}
    /></>
  );

  if (phase === 'onlineMenu') return (
    <>{friendReqToast}
    <OnlineMenu
      user={user}
      initialCode={inviteJoinCode || initialSalaCode}
      onBack={() => { setInviteJoinCode(''); setPhase('setup'); }}
      T={T}
      onCreated={(name, code, pub, rn) => {
        setIsOnline(true); setIsHost(true); setMyPlayerIdx(0); setRoomCode(code);
        setRoomIsPublic(!!pub); setRoomDisplayName(rn || '');
        setLobbyPlayers([{ name, idx: 0 }]);
        saveRoomSession({ roomCode: code, playerName: name, myPlayerIdx: 0, isHost: true, phase: 'onlineLobby' });
        setPhase('onlineLobby');
      }}
      onJoined={(name, code, myIdx, pub, rn) => {
        setIsOnline(true); setIsHost(false); setMyPlayerIdx(myIdx); setRoomCode(code);
        setRoomIsPublic(!!pub); setRoomDisplayName(rn || '');
        setLobbyPlayers([]);
        saveRoomSession({ roomCode: code, playerName: name, myPlayerIdx: myIdx, isHost: false, phase: 'onlineLobby' });
        socket.once('lobbyUpdate', ({ players: pls }) => setLobbyPlayers(pls));
        // gameStarted event will trigger stateUpdate which sets phase to 'playing'
        socket.once('gameStarted', () => {
          saveRoomSession({ roomCode: code, playerName: name, myPlayerIdx: myIdx, isHost: false, phase: 'playing' });
          setPhase('playing');
        });
        setPhase('onlineLobby');
      }}
    />
    </>
  );

  if (phase === 'onlineLobby') return (
    <>{friendReqToast}
    <OnlineLobby
      roomCode={roomCode}
      myName={lobbyPlayers[myPlayerIdx]?.name || ''}
      isHost={isHost}
      players={lobbyPlayers}
      isPublic={roomIsPublic}
      roomDisplayName={roomDisplayName}
      T={T}
      user={user}
      onStart={(hatPicks, gameConfig) => {
        if (isHost) {
          startOnlineGame(hatPicks, gameConfig, lobbyPlayers);
        }
      }}
      onBack={() => {
        socket.emit('leaveRoom');
        socket.disconnect();
        setIsOnline(false); setIsHost(false); setMyPlayerIdx(0); setRoomCode('');
        setRoomIsPublic(false); setRoomDisplayName('');
        setLobbyPlayers([]);
        clearRoomSession();
        setPhase('setup');
      }}
    />
    </>
  );

  if (phase === 'transition') return <TransitionScreen player={players[HI]} onContinue={() => setPhase('playing')} isExtraPlay={extraPlay} T={T} />;
  if (phase === 'gameover') return (
    <GameOverScreen
      winner={winner}
      players={players}
      user={user}
      T={T}
      onRestart={() => {
        if (isOnline) { socket.emit('leaveRoom'); socket.disconnect(); setIsOnline(false); setIsHost(false); setMyPlayerIdx(0); setRoomCode(''); setRoomIsPublic(false); setRoomDisplayName(''); setLobbyPlayers([]); }
        clearRoomSession();
        setPhase('setup');
      }}
      onHistory={() => setPhase('history')}
    />
  );
  if (!players.length) return null;

  // ── Playing screen ──
  const human = players[HI] || players[0];
  const opponents = players.filter((_, i) => i !== HI);
  const isHumanTurn = cp === HI;
  const burger = human.burgers[human.currentBurger];
  const humanColor = PLAYER_COLORS[HI % PLAYER_COLORS.length];

  // Card playability
  const getPlayable = (card, idx) => {
    if (!isHumanTurn || extraPlay) {
      if (card.type !== 'ingredient') return null;
    }
    if (card.type === 'ingredient') return canPlayCard(human, card) ? true : false;
    return null; // action cards always selectable
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;
  const handN = human.hand.length;
  const MAX_ANGLE = isMobile ? 12 : 14;
  const OVERLAP = isMobile ? 20 : 18;

  // ── Panel: Rivals (left sidebar) ──
  const rivalesPanel = (
    <div style={{
      ...(isMobile
        ? { flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }
        : { width: 220, flexShrink: 0, background: '#12192e', borderRight: '2px solid #1e2a45', overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }
      ),
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#555', letterSpacing: 1, marginBottom: 4 }}>{T('opponents')}</div>
      {opponents.map((opp, i) => {
        const realIdx = players.indexOf(opp);
        return (
          <OpponentCard
            key={realIdx}
            player={opp}
            index={realIdx}
            color={PLAYER_COLORS[realIdx % PLAYER_COLORS.length]}
            isActive={cp === realIdx}
            onIngredientClick={(ing) => setModal({ type: 'ingredientInfo', ingredient: ing })}
            T={T}
          />
        );
      })}

      {/* Log panel */}
      {showLog && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#555', letterSpacing: 1, marginBottom: 6 }}>{T('historyLog')}</div>
          {log.length === 0 && <div style={{ fontSize: 11, color: '#444' }}>{T('noEvents')}</div>}
          {log.map((e, i) => <LogEntry key={i} e={e} />)}
        </div>
      )}
    </div>
  );

  // ── Panel: Mesa (center) — section blocks ──

  const playerHeader = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'rgba(255,215,0,.06)', borderRadius: 12, padding: '8px 14px',
      border: '2px solid rgba(255,215,0,.2)', flexShrink: 0,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 900, fontSize: 16, color: humanColor }}>{human.name}</div>
        <div style={{ fontSize: 11, color: '#777' }}>
          🍔 {human.currentBurger}/{human.totalBurgers} hamburguesas
          {extraPlay && <span style={{ color: '#FFD700', marginLeft: 8 }}>{T('extraPlayLabel')}</span>}
        </div>
      </div>
      {phase === 'playing' && players[cp] && !players[cp].isAI && (
        <div style={{
          minWidth: 44, height: 44, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: 18,
          color: turnTime <= 10 ? '#ff4444' : turnTime <= 20 ? '#ffaa00' : '#4ecdc4',
          border: `3px solid ${turnTime <= 10 ? '#ff4444' : turnTime <= 20 ? '#ffaa00' : '#4ecdc4'}`,
          animation: turnTime <= 10 ? 'pulse 1s infinite' : 'none',
        }}>
          {turnTime}
        </div>
      )}
    </div>
  );

  const burgersSection = (
    <div style={{
      background: 'rgba(255,255,255,.03)', borderRadius: 10, padding: '8px 10px',
      border: '2px solid #1e2a45', flexShrink: 0,
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#555', letterSpacing: 1, marginBottom: 6 }}>{T('burgers')}</div>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: 4, flexWrap: 'wrap' }}>
        {human.burgers.map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: i === human.currentBurger ? '#FFD700' : '#555', width: 14, fontWeight: 700 }}>
              {i < human.currentBurger ? '✅' : i === human.currentBurger ? '▶' : '○'}
            </span>
            <BurgerTarget
              ingredients={b}
              table={i === human.currentBurger ? human.table : i < human.currentBurger ? b : []}
              isCurrent={i === human.currentBurger}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const tableSection = (
    <div style={{
      background: 'rgba(255,255,255,.03)', borderRadius: 10, padding: '8px 10px',
      border: '2px solid #1e2a45', flexShrink: 0,
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#555', letterSpacing: 1, marginBottom: 6 }}>
        {typeof T('tableCount') === 'function' ? T('tableCount')(human.table.length) : T('table')}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', minHeight: 32 }}>
        {human.table.length === 0 && <span style={{ fontSize: 12, color: '#333' }}>{T('emptyTable')}</span>}
        {human.table.map((ing, i) => {
          const base = ingKey(ing);
          const chosen = ingChosen(ing);
          return (
            <div key={i} onClick={() => setModal({ type: 'ingredientInfo', ingredient: ing })} style={{
              width: 36, height: 36, borderRadius: 8,
              background: chosen
                ? `linear-gradient(to right, ${ING_BG.perrito || '#9b59b6'} 50%, ${ING_BG[chosen]} 50%)`
                : ING_BG[base],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, boxShadow: '0 2px 6px rgba(0,0,0,.3)',
              overflow: 'hidden', position: 'relative', cursor: 'pointer',
            }}>
              {chosen ? (
                <>
                  <div style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={ING_IMG.perrito} alt="comodín" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                  </div>
                  <div style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {ING_IMG[chosen]
                      ? <img src={ING_IMG[chosen]} alt={chosen} style={{ width: 22, height: 22, objectFit: 'contain' }} />
                      : <span style={{ fontSize: 14 }}>{ING_EMOJI[chosen]}</span>}
                  </div>
                </>
              ) : (
                ING_IMG[base]
                  ? <img src={ING_IMG[base]} alt={base} style={{ width: 26, height: 26, objectFit: 'contain' }} />
                  : ING_EMOJI[base]
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const percheroTree = human.perchero.length > 0 && (() => {
    const branchPositions = [
      { left: '10%', top: '2%', rotate: -12 },
      { left: '68%', top: '2%', rotate: 12 },
      { left: '5%', top: '30%', rotate: -10 },
      { left: '63%', top: '30%', rotate: 10 },
      { left: '8%', top: '58%', rotate: -12 },
      { left: '62%', top: '58%', rotate: 12 },
    ];
    return (
      <div>
        <div style={{ fontSize: 9, color: '#555', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>{T('closet')}</div>
        <div style={{ position: 'relative', width: 180, height: 220 }}>
          <img src={percheroImg} alt="Perchero" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          {human.perchero.map((h, i) => {
            if (i >= branchPositions.length) return null;
            const pos = branchPositions[i];
            return (
              <div key={h} style={{
                position: 'absolute', left: pos.left, top: pos.top,
                transform: `rotate(${pos.rotate}deg)`,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
              }}>
                <HatSVG lang={h} size={32} />
                <span style={{ fontSize: 7, fontWeight: 800, color: LANG_TEXT[h], letterSpacing: 0.5, marginTop: -2 }}>
                  {LANG_SHORT[h]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  })();

  const percheroButtons = isHumanTurn && !extraPlay && human.perchero.length > 0 && (
    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
      <button
        onClick={() => { setShowPercheroModal(false); setModal({ type: 'manual_cambiar' }); }}
        title={T('changeHatTooltip')}
        style={{
          padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(156,39,176,0.3)',
          background: 'rgba(156,39,176,0.12)', color: '#BA68C8', fontSize: 14,
          fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        {T('changeHat')}
      </button>
      {human.hand.length > 0 && (
        <button
          onClick={() => { setShowPercheroModal(false); setModal({ type: 'manual_agregar' }); }}
          title={T('addHatTooltip')}
          style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(156,39,176,0.3)',
            background: 'rgba(156,39,176,0.12)', color: '#BA68C8', fontSize: 14,
            fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {T('addHat')}
        </button>
      )}
    </div>
  );

  const hatsSection = (
    <div style={{
      background: 'rgba(255,255,255,.02)', borderRadius: 10, padding: '8px 10px',
      border: '2px solid #1e2a45', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        {/* Sombrero(s) principal(es) */}
        <div>
          <div style={{ fontSize: 9, color: '#555', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>{T('mainHat')}</div>
          <div style={isMobile
            ? { display: 'flex', gap: 4, flexWrap: 'wrap' }
            : { display: 'grid', gridTemplateRows: 'repeat(3, auto)', gridAutoFlow: 'column', gap: 4 }
          }>
            {human.mainHats.map(h => <HatBadge key={h} lang={h} isMain size="lg" />)}
          </div>
        </div>

        {/* On mobile: button to open perchero modal; on desktop: inline perchero */}
        {isMobile ? (
          human.perchero.length > 0 && (
            <button onClick={() => setShowPercheroModal(true)} style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid #2a2a4a',
              background: 'rgba(255,255,255,.05)', color: '#aaa',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {typeof T('viewCloset') === 'function' ? T('viewCloset')(human.perchero.length) : T('viewCloset')}
            </button>
          )
        ) : (
          percheroTree
        )}

        {/* Botones Cambiar / Agregar */}
        {percheroButtons}
      </div>
    </div>
  );

  const addedHats = human.manuallyAddedHats || [];
  const isReduced = human.maxHand < 6;

  const handLabel = (
    <div style={{ fontSize: 11, fontWeight: 800, color: '#555', letterSpacing: 1, flexShrink: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
      {T('hand')} ({human.hand.length}/{human.maxHand})
      {isReduced && (
        <span style={{ color: '#FF7043', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          ⚠ {T('maxReduced')}: {addedHats.map(h => (
            <HatBadge key={h} lang={h} isMain size="sm" />
          ))}
        </span>
      )}
    </div>
  );

  const turnActionIndicators = (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0, alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: '#555', fontWeight: 700, letterSpacing: 1 }}>
        {T('turnActionsLabel')}
      </span>
      {[
        { key: 'playIngredient', emoji: '🃏', label: T('ingredientCard') },
        { key: 'playAction',     emoji: '⚡', label: T('actionCard')    },
        { key: 'discard',        emoji: '🗑️', label: T('discard')       },
        { key: 'changeHat',      emoji: '🎩', label: T('changeHat')     },
        { key: 'addHat',         emoji: '➕', label: T('addHat')        },
      ].map(({ key, emoji, label }) => (
        <button
          key={key}
          onClick={() => setModal({ type: 'turnActionInfo', action: key })}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 20, padding: '4px 10px', cursor: 'pointer',
            color: isHumanTurn ? '#ddd' : '#555',
            fontSize: 12, display: 'flex', gap: 4, alignItems: 'center',
            fontFamily: 'inherit', fontWeight: 600, transition: 'all .15s',
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = 'rgba(78,205,196,0.2)';
            e.currentTarget.style.borderColor = '#4ecdc4';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
            e.currentTarget.style.color = isHumanTurn ? '#ddd' : '#555';
          }}
        >
          <span>{emoji}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );

  const handFan = (
    <div style={{
      display: 'flex', justifyContent: isMobile ? 'flex-start' : 'center', alignItems: isMobile ? 'center' : 'flex-end',
      padding: isMobile ? '8px 12px' : '36px 0 8px 0',
      flex: isMobile ? 'none' : 1,
      overflowX: isMobile ? 'auto' : 'visible', overflowY: isMobile ? 'hidden' : 'visible',
      minHeight: isMobile ? 'auto' : 170,
      gap: isMobile ? 10 : 0,
      scrollSnapType: isMobile ? 'x mandatory' : 'none',
      WebkitOverflowScrolling: 'touch',
    }}>
      {human.hand.map((card, i) => {
        const playable = card.type === 'ingredient' ? canPlayCard(human, card) : (extraPlay ? false : null);
        const angle = handN > 1 ? -MAX_ANGLE + i * (2 * MAX_ANGLE / (handN - 1)) : 0;
        const isSelected = selectedIdx === i;
        return (
          <div
            key={card.id}
            onClick={() => {
              if (!isHumanTurn) return;
              if (extraPlay && card.type !== 'ingredient') return;
              setSelectedIdx(isSelected ? null : i);
            }}
            onMouseEnter={e => { if (!isMobile && !isSelected && isHumanTurn) e.currentTarget.style.transform = `translateY(-14px) rotate(${angle * 0.4}deg)`; }}
            onMouseLeave={e => { if (!isMobile && !isSelected) e.currentTarget.style.transform = `translateY(0px) rotate(${angle}deg)`; }}
            style={{
              cursor: isHumanTurn ? 'pointer' : 'default',
              marginLeft: isMobile ? 0 : (i === 0 ? 0 : -OVERLAP),
              flexShrink: isMobile ? 0 : undefined,
              scrollSnapAlign: isMobile ? 'center' : undefined,
              transform: isMobile
                ? (isSelected ? 'translateY(-10px)' : 'none')
                : (isSelected ? 'translateY(-28px) rotate(0deg)' : `translateY(0px) rotate(${angle}deg)`),
              transformOrigin: 'bottom center',
              transition: 'transform 0.15s',
              zIndex: isSelected ? handN + 1 : i,
              position: 'relative',
            }}
          >
            {isSelected && isHumanTurn && !isMobile && (
              <div style={{
                position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginBottom: 8,
                zIndex: 200, whiteSpace: 'nowrap',
              }}
              onClick={e => e.stopPropagation()}
              >
                <div style={{
                  fontSize: 12, textAlign: 'center', padding: '4px 10px', borderRadius: 6,
                  background: 'rgba(0,0,0,0.85)', color: '#ddd',
                  display: 'flex', flexDirection: 'column', gap: 2,
                }}>
                  {card.type === 'ingredient' ? (<>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{getIngName(card.ingredient, card.language)}</span>
                    {card.ingredient === 'perrito' && (
                      <span style={{ fontSize: 12, color: '#ccc' }}>{T('wildcardChoose')}</span>
                    )}
                    {canPlayCard(human, card)
                      ? <span style={{ color: '#4CAF50', fontSize: 12 }}>{T('canPlay')}</span>
                      : <span style={{ color: '#FF7043', fontSize: 12 }}>{T('cantPlay')}</span>}
                  </>) : (<>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#FFD700' }}>{getActionInfo(card.action)?.name}</span>
                    <span style={{ fontSize: 12, color: '#ccc' }}>{getActionInfo(card.action)?.desc}</span>
                  </>)}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Btn onClick={humanPlay} disabled={extraPlay && card.type !== 'ingredient'} color="#4CAF50" style={{ fontSize: 11, padding: '6px 12px' }}>
                    {T('play')}
                  </Btn>
                  <Btn onClick={humanDiscard} disabled={extraPlay} color="#FF7043" style={{ fontSize: 11, padding: '6px 12px' }}>
                    {T('discard')}
                  </Btn>
                </div>
              </div>
            )}
            <GameCard
              card={card}
              selected={isSelected}
              playable={isHumanTurn ? playable : false}
              large={true}
              small={false}
            />
          </div>
        );
      })}
    </div>
  );

  const selectedCardInfo = isHumanTurn && selectedIdx !== null && (
    <div style={{
      flexShrink: 0, padding: '6px 10px', borderRadius: 8, marginBottom: 4,
      background: 'rgba(255,255,255,.04)', border: '1px solid #2a2a4a', fontSize: 11, color: '#aaa',
    }}>
      {human.hand[selectedIdx]?.type === 'ingredient' ? (
        canPlayCard(human, human.hand[selectedIdx])
          ? <span style={{ color: '#4CAF50' }}>{T('canPlayThis')}</span>
          : <span style={{ color: '#FF7043' }}>{T('cantPlayNow')}</span>
      ) : (
        <span style={{ color: '#FFD700' }}>⚡ {getActionInfo(human.hand[selectedIdx]?.action)?.desc}</span>
      )}
    </div>
  );

  const actionButtons = isHumanTurn && extraPlay && (
    <div style={{
      display: 'flex', gap: 8, flexShrink: 0, padding: '6px 0',
    }}>
      <Btn onClick={() => {
        if (isOnline && !isHost) {
          socket.emit('playerAction', { code: roomCode, action: { type: 'passTurn' } });
        } else {
          setExtraPlay(false); endTurn(players, deck, discard, HI);
        }
      }} color="#888" style={{ flex: 1 }}>
        {T('skipTurn')}
      </Btn>
    </div>
  );

  const turnStatus = !isHumanTurn && (
    <div style={{
      textAlign: 'center', color: '#555', fontSize: 13, padding: '8px 0', flexShrink: 0,
    }}>
      {players[cp]?.isRemote
        ? (typeof T('waitingOnline') === 'function' ? T('waitingOnline')(players[cp]?.name) : T('waitingOnline'))
        : (typeof T('waitingLocal') === 'function' ? T('waitingLocal')(players[cp]?.name) : T('waitingLocal'))}
    </div>
  );

  const burgersAndHatsRow = (
    <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
      <div style={{ flex: 1 }}>{burgersSection}</div>
      <div style={{ flex: 1 }}>{hatsSection}</div>
    </div>
  );

  const mesaPanel = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '12px 16px', gap: 10 }}>
      {playerHeader}
      {turnActionIndicators}
      {isMobile ? (
        <>
          {burgersSection}
          {tableSection}
          {hatsSection}
          {handLabel}
          {handFan}
          {actionButtons}
          {turnStatus}
        </>
      ) : (
        <>
          {burgersAndHatsRow}
          {tableSection}
          {actionButtons}
          {handLabel}
          {handFan}
          {turnStatus}
        </>
      )}
    </div>
  );

  // ── Panel: Mano (right sidebar) ──
  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: '#0f1117', fontFamily: "'Fredoka',sans-serif", overflow: 'hidden', position: 'relative',
    }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 12, padding: isMobile ? '6px 10px' : '8px 16px',
        background: '#16213e', borderBottom: '2px solid #2a2a4a', flexShrink: 0,
      }}>
        <span style={{ fontSize: 22 }}>🍔</span>
        {!isMobile && <span style={{ fontWeight: 900, fontSize: 16, color: '#FFD700' }}>HUNGRY POLY</span>}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: isMobile ? 6 : 12, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#555' }}>🃏 {deck.length}</span>
          <span style={{ fontSize: 12, color: '#555' }}>🗑️ {discard.length}</span>
          <div style={{
            background: isHumanTurn ? 'rgba(255,215,0,.15)' : 'rgba(0,188,212,.15)',
            border: `1px solid ${isHumanTurn ? '#FFD700' : '#00BCD4'}`,
            borderRadius: 8, padding: isMobile ? '3px 6px' : '3px 10px', fontSize: isMobile ? 11 : 12, fontWeight: 700,
            color: isHumanTurn ? '#FFD700' : '#00BCD4',
          }}>
            {isHumanTurn ? (extraPlay ? T('extraPlayLabel') : T('yourTurnLabel')) : (typeof T('waitingPlayer') === 'function' ? T('waitingPlayer')(players[cp]?.name) : `⏳ ${players[cp]?.name}`)}
          </div>
          {isOnline && !isMobile && (
            <div style={{ fontSize: 11, color: '#555', padding: '3px 8px', borderRadius: 6, background: 'rgba(0,188,212,.08)', border: '1px solid rgba(0,188,212,.2)' }}>
              🌐 {T('room')}: {roomCode}
            </div>
          )}
          <Btn onClick={() => setShowLog(l => !l)} color="#2a2a4a" style={{ color: '#aaa', fontSize: 12, padding: '4px 10px' }}>
            {T('log')}
          </Btn>
          {isOnline && (
            <>
              <Btn onClick={() => { setShowChat(s => !s); setUnreadChat(0); }} color="#2a2a4a" style={{ color: '#aaa', fontSize: 12, padding: '4px 10px', position: 'relative' }}>
                {T('chat')}
                {unreadChat > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16,
                    borderRadius: '50%', background: '#ff4444', color: '#fff',
                    fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{unreadChat}</span>
                )}
              </Btn>
              <Btn onClick={handleVoluntaryLeave} color="#ff4444" style={{ color: '#fff', fontSize: 12, padding: '4px 10px' }}>
                {T('leave')}
              </Btn>
            </>
          )}
        </div>
      </div>

      {/* ── Game paused overlay (opponent left or alone) ── */}
      {gamePaused && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
          background: 'rgba(0,0,0,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Fredoka',sans-serif",
        }}>
          <div style={{ textAlign: 'center', padding: 32 }}>
            {pausedMessage === 'alone' ? (
              <>
                <div style={{ fontSize: 48, marginBottom: 16 }}>😔</div>
                <h2 style={{ color: '#FFD700', fontSize: 22, fontWeight: 900, marginBottom: 12 }}>{T('aloneTitle')}</h2>
                <p style={{ color: '#aaa', fontSize: 15, marginBottom: 24 }}>{T('aloneDesc')}</p>
              </>
            ) : (
              <>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⏸️</div>
                <h2 style={{ color: '#FFD700', fontSize: 22, fontWeight: 900, marginBottom: 12 }}>{T('gamePaused')}</h2>
                <p style={{ color: '#aaa', fontSize: 15, marginBottom: 24 }}>{pausedMessage}</p>
              </>
            )}
            <Btn onClick={() => {
              socket.emit('leaveRoom');
              socket.disconnect();
              setIsOnline(false); setIsHost(false); setMyPlayerIdx(0); setRoomCode('');
              setRoomIsPublic(false); setRoomDisplayName('');
              setLobbyPlayers([]); clearRoomSession();
              setGamePaused(false); setPausedMessage('');
              setPhase('setup');
            }} color="#ff4444" style={{ color: '#fff', fontSize: 14, padding: '10px 24px' }}>
              {T('backToLobby')}
            </Btn>
          </div>
        </div>
      )}

      {/* ── Main area ── */}
      {isMobile ? (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {mobileTab === 'mesa' && mesaPanel}
          {mobileTab === 'rivales' && rivalesPanel}
          {mobileTab === 'chat' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {chatMessages.length === 0 && (
                  <div style={{ color: '#444', fontSize: 12, textAlign: 'center', marginTop: 40 }}>{T('noMessages')}</div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} style={{ fontSize: 13 }}>
                    <span style={{ fontWeight: 800, color: '#4ecdc4' }}>{msg.playerName}: </span>
                    <span style={{ color: '#ccc' }}>{msg.text}</span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div style={{ display: 'flex', gap: 6, padding: '8px 12px', borderTop: '1px solid #2a2a4a', flexShrink: 0 }}>
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                  placeholder={T('typeMessage')}
                  style={{
                    flex: 1, background: 'rgba(255,255,255,.06)', border: '1px solid #2a2a4a',
                    borderRadius: 8, padding: '8px 10px', color: '#ccc', fontSize: 13,
                    fontFamily: "'Fredoka',sans-serif", outline: 'none',
                  }}
                />
                <Btn onClick={sendChatMessage} color="#4ecdc4" style={{ padding: '8px 14px', fontSize: 13 }}>
                  {T('send')}
                </Btn>
              </div>
            </div>
          )}

          {/* Mobile tab bar */}
          <div style={{ display: 'flex', flexShrink: 0, background: '#16213e', borderTop: '2px solid #2a2a4a' }}>
            {[
              { id: 'mesa', label: T('tableTab'), notify: isHumanTurn },
              { id: 'rivales', label: T('rivalsTab') },
              ...(isOnline ? [{ id: 'chat', label: T('chatTab'), notify: unreadChat > 0 }] : []),
            ].map(tab => (
              <button key={tab.id} onClick={() => { setMobileTab(tab.id); if (tab.id === 'chat') setUnreadChat(0); }} style={{
                flex: 1, padding: '10px 4px', border: 'none', cursor: 'pointer',
                background: mobileTab === tab.id ? 'rgba(255,215,0,.1)' : 'transparent',
                color: mobileTab === tab.id ? '#FFD700' : '#666',
                fontSize: 12, fontWeight: mobileTab === tab.id ? 800 : 600,
                borderTop: mobileTab === tab.id ? '2px solid #FFD700' : '2px solid transparent',
                fontFamily: "'Fredoka',sans-serif",
                position: 'relative',
              }}>
                {tab.label}
                {tab.notify && mobileTab !== tab.id && (
                  <span style={{
                    position: 'absolute', top: 4, right: 8,
                    width: 7, height: 7, borderRadius: '50%', background: '#FFD700',
                  }} />
                )}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden' }}>
          {rivalesPanel}
          {mesaPanel}
        </div>
      )}

      {/* ── Modals ── */}

      {/* Pick Target */}
      {modal?.type === 'pickTarget' && (
        <Modal title={`${getActionInfo(modal.action)?.emoji} ${getActionInfo(modal.action)?.name} — ${T('chooseOpponent')}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {players.map((p, i) => {
              if (i === HI) return null;
              return (
                <div
                  key={i}
                  onClick={() => resolvePickTarget(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                    borderRadius: 10, background: 'rgba(255,255,255,.04)',
                    border: `2px solid ${PLAYER_COLORS[i % PLAYER_COLORS.length]}44`,
                    cursor: 'pointer', transition: 'all .15s',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.08)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,.04)'}
                >
                  <HatSVG lang={p.mainHats[0] || LANGUAGES[0]} size={28} />
                  <div>
                    <div style={{ fontWeight: 800, color: PLAYER_COLORS[i % PLAYER_COLORS.length] }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#777' }}>
                      {T('tableLabel')}: {p.table.map(ing => ING_EMOJI[ingKey(ing)]).join(' ') || T('empty')} •
                      {T('burgersLabel')}: {p.currentBurger}/{p.totalBurgers}
                    </div>
                  </div>
                </div>
              );
            })}
            <Btn onClick={() => setModal(null)} color="#333" style={{ color: '#aaa', marginTop: 8 }}>
              {T('cancel')}
            </Btn>
          </div>
        </Modal>
      )}

      {/* Pick Ingredient (Tenedor) */}
      {modal?.type === 'pickIngredient' && (
        <Modal title={T('forkSteal')}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {modal.newPls[modal.targetIdx].table.map((ing, i) => {
              const base = ingKey(ing);
              return (
                <div
                  key={i}
                  onClick={() => resolvePickIngredient(i)}
                  style={{
                    width: 54, height: 54, borderRadius: 10, background: ING_BG[base],
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    fontSize: 26, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.4)',
                    transition: 'transform .1s',
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {ING_IMG[base]
                    ? <img src={ING_IMG[base]} alt={base} style={{ width: 36, height: 36, objectFit: 'contain' }} />
                    : ING_EMOJI[base]}
                </div>
              );
            })}
          </div>
          <Btn onClick={() => setModal(null)} color="#333" style={{ color: '#aaa' }}>{T('cancel')}</Btn>
        </Modal>
      )}

      {/* Pick Ingredient (Tenedor) - non-host remote version */}
      {modal?.type === 'pickIngredientRemote' && (
        <Modal title={T('forkSteal')}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {modal.newPls[modal.targetIdx].table.map((ing, i) => {
              const base = ingKey(ing);
              return (
                <div
                  key={i}
                  onClick={() => resolvePickIngredient(i)}
                  style={{
                    width: 54, height: 54, borderRadius: 10, background: ING_BG[base],
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    fontSize: 26, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.4)',
                    transition: 'transform .1s',
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {ING_IMG[base]
                    ? <img src={ING_IMG[base]} alt={base} style={{ width: 36, height: 36, objectFit: 'contain' }} />
                    : ING_EMOJI[base]}
                </div>
              );
            })}
          </div>
          <Btn onClick={() => setModal(null)} color="#333" style={{ color: '#aaa' }}>{T('cancel')}</Btn>
        </Modal>
      )}

      {/* Pick Hat Replace (after Ladrón steals last hat) */}
      {modal?.type === 'pickHatReplace' && (!isOnline || !isHost || modal.victimIdx === HI) && (
        <Modal title={T('chooseNewHat')}>
          <p style={{ color: '#888', fontSize: 12, marginBottom: 12 }}>
            {isOnline && isHost && modal.victimIdx !== HI
              ? (typeof T('waitingHatChoice') === 'function' ? T('waitingHatChoice')(players[modal.victimIdx]?.name) : T('waitingHatChoice'))
              : T('hatStolen')}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {modal.newPls[modal.victimIdx].perchero.map(h => (
              <div
                key={h}
                onClick={() => resolveHatReplace(h)}
                style={{
                  padding: 10, borderRadius: 10, cursor: 'pointer',
                  border: `2px solid ${LANG_BORDER[h]}88`,
                  background: 'rgba(255,255,255,.04)', transition: 'all .15s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,.04)'}
              >
                <HatSVG lang={h} size={36} />
                <span style={{ fontSize: 11, fontWeight: 700, color: LANG_TEXT[h] }}>
                  {h.charAt(0).toUpperCase() + h.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {modal?.type === 'pickHatExchange' && (() => {
        const myHats = modal.isRemote ? players[HI].mainHats : modal.newPls[HI].mainHats;
        const theirHats = modal.isRemote ? players[modal.targetIdx].mainHats : modal.newPls[modal.targetIdx].mainHats;
        const targetName = players[modal.targetIdx]?.name || 'Oponente';
        return (
          <Modal title={T('hatExchange')}>
            <p style={{ color: '#888', fontSize: 12, marginBottom: 12 }}>
              {typeof T('hatExchangeDesc') === 'function' ? T('hatExchangeDesc')(targetName) : T('hatExchangeDesc')}
            </p>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#4ecdc4', marginBottom: 8 }}>{T('yourHatToGive')}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {myHats.map(h => (
                  <div
                    key={h}
                    onClick={() => setModal(prev => ({ ...prev, selectedMyHat: h }))}
                    style={{
                      padding: 10, borderRadius: 10, cursor: 'pointer',
                      border: modal.selectedMyHat === h ? `3px solid #FFD700` : `2px solid ${LANG_BORDER[h]}88`,
                      background: modal.selectedMyHat === h ? 'rgba(255,215,0,.12)' : 'rgba(255,255,255,.04)',
                      transition: 'all .15s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    }}
                    onMouseOver={e => { if (modal.selectedMyHat !== h) e.currentTarget.style.background = 'rgba(255,255,255,.1)'; }}
                    onMouseOut={e => { if (modal.selectedMyHat !== h) e.currentTarget.style.background = 'rgba(255,255,255,.04)'; }}
                  >
                    <HatSVG lang={h} size={36} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: modal.selectedMyHat === h ? '#FFD700' : LANG_TEXT[h] }}>
                      {h.charAt(0).toUpperCase() + h.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#ff6b6b', marginBottom: 8 }}>{typeof T('hatToReceive') === 'function' ? T('hatToReceive')(targetName) : T('hatToReceive')}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {theirHats.map(h => (
                  <div
                    key={h}
                    onClick={() => setModal(prev => ({ ...prev, selectedTheirHat: h }))}
                    style={{
                      padding: 10, borderRadius: 10, cursor: 'pointer',
                      border: modal.selectedTheirHat === h ? `3px solid #FFD700` : `2px solid ${LANG_BORDER[h]}88`,
                      background: modal.selectedTheirHat === h ? 'rgba(255,215,0,.12)' : 'rgba(255,255,255,.04)',
                      transition: 'all .15s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    }}
                    onMouseOver={e => { if (modal.selectedTheirHat !== h) e.currentTarget.style.background = 'rgba(255,255,255,.1)'; }}
                    onMouseOut={e => { if (modal.selectedTheirHat !== h) e.currentTarget.style.background = 'rgba(255,255,255,.04)'; }}
                  >
                    <HatSVG lang={h} size={36} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: modal.selectedTheirHat === h ? '#FFD700' : LANG_TEXT[h] }}>
                      {h.charAt(0).toUpperCase() + h.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <button
              disabled={!modal.selectedMyHat || !modal.selectedTheirHat}
              onClick={() => resolveHatExchange(modal.selectedMyHat, modal.selectedTheirHat)}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 10,
                border: 'none', fontFamily: 'inherit', fontWeight: 800, fontSize: 14,
                cursor: modal.selectedMyHat && modal.selectedTheirHat ? 'pointer' : 'not-allowed',
                background: modal.selectedMyHat && modal.selectedTheirHat ? 'linear-gradient(135deg, #4ecdc4, #44b09e)' : 'rgba(255,255,255,.08)',
                color: modal.selectedMyHat && modal.selectedTheirHat ? '#fff' : '#555',
                transition: 'all .2s',
              }}
            >
              {T('exchange')}
            </button>
          </Modal>
        );
      })()}

      {/* Mobile: Perchero modal */}
      {showPercheroModal && (
        <Modal title="🧥 Perchero">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            {percheroTree}
            <button onClick={() => setShowPercheroModal(false)} style={{
              padding: '8px 24px', borderRadius: 8, border: '1px solid #2a2a4a',
              background: 'rgba(255,255,255,.08)', color: '#aaa',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {T('close')}
            </button>
          </div>
        </Modal>
      )}

      {/* Mobile: Card detail modal */}
      {isMobile && isHumanTurn && selectedIdx !== null && human.hand[selectedIdx] && (() => {
        const card = human.hand[selectedIdx];
        const playable = card.type === 'ingredient' ? canPlayCard(human, card) : (extraPlay ? false : null);
        return (
          <Modal title={card.type === 'ingredient' ? T('ingredientCard') : T('actionCard')}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <GameCard card={card} selected playable={playable} large />
              <div style={{
                fontSize: 14, textAlign: 'center', padding: '8px 14px', borderRadius: 8,
                background: 'rgba(0,0,0,0.5)', color: '#ddd',
                display: 'flex', flexDirection: 'column', gap: 4, width: '100%',
              }}>
                {card.type === 'ingredient' ? (<>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{getIngName(card.ingredient, card.language)}</span>
                  {card.ingredient === 'perrito' && (
                    <span style={{ fontSize: 13, color: '#ccc' }}>{T('wildcardChoose')}</span>
                  )}
                  {canPlayCard(human, card)
                    ? <span style={{ color: '#4CAF50', fontSize: 13 }}>{T('canPlay')}</span>
                    : <span style={{ color: '#FF7043', fontSize: 13 }}>{T('cantPlay')}</span>}
                </>) : (<>
                  <span style={{ fontWeight: 700, fontSize: 16, color: '#FFD700' }}>{getActionInfo(card.action)?.name}</span>
                  <span style={{ fontSize: 13, color: '#ccc' }}>{getActionInfo(card.action)?.desc}</span>
                </>)}
              </div>
              <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                <Btn onClick={() => { humanPlay(); }} disabled={extraPlay && card.type !== 'ingredient'} color="#4CAF50" style={{ flex: 1, fontSize: 14, padding: '10px 16px' }}>
                  {T('play')}
                </Btn>
                <Btn onClick={() => { humanDiscard(); }} disabled={extraPlay} color="#FF7043" style={{ flex: 1, fontSize: 14, padding: '10px 16px' }}>
                  {T('discard')}
                </Btn>
              </div>
              <button onClick={() => setSelectedIdx(null)} style={{
                padding: '8px 24px', borderRadius: 8, border: '1px solid #2a2a4a',
                background: 'rgba(255,255,255,.08)', color: '#aaa',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {T('close')}
              </button>
            </div>
          </Modal>
        );
      })()}

      {/* Manual: Cambiar sombrero — paso 1: elegir sombrero */}
      {modal?.type === 'manual_cambiar' && (
        <Modal title={T('changeHatStep1')}>
          <p style={{ color: '#888', fontSize: 12, marginBottom: 12 }}>
            {typeof T('changeHatStep1Desc') === 'function' ? T('changeHatStep1Desc')(Math.ceil(human.hand.length / 2)) : T('changeHatStep1Desc')}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {human.perchero.map(h => (
              <div
                key={h}
                onClick={() => setModal({ type: 'manual_cambiar_discard', hatLang: h, selected: [] })}
                style={{
                  padding: 10, borderRadius: 10, cursor: 'pointer',
                  border: `2px solid ${LANG_BORDER[h]}88`,
                  background: 'rgba(255,255,255,.04)', transition: 'all .15s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,.04)'}
              >
                <HatSVG lang={h} size={36} />
                <span style={{ fontSize: 11, fontWeight: 700, color: LANG_TEXT[h] }}>
                  {h.charAt(0).toUpperCase() + h.slice(1)}
                </span>
              </div>
            ))}
          </div>
          <Btn onClick={() => setModal(null)} color="#333" style={{ color: '#aaa' }}>{T('cancel')}</Btn>
        </Modal>
      )}

      {/* Manual: Cambiar sombrero — paso 2: elegir cartas a descartar */}
      {modal?.type === 'manual_cambiar_discard' && (() => {
        const cost = Math.ceil(human.hand.length / 2);
        const sel = modal.selected;
        const remaining = cost - sel.length;
        return (
          <Modal title={typeof T('changeHatStep2') === 'function' ? T('changeHatStep2')(modal.hatLang.charAt(0).toUpperCase() + modal.hatLang.slice(1)) : T('changeHatStep2')}>
            <p style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>
              <strong style={{ color: remaining > 0 ? '#FFD700' : '#4CAF50' }}>
                {remaining > 0 ? (typeof T('moreCards') === 'function' ? T('moreCards')(remaining) : T('moreCards')) : T('ready')}
              </strong> ({sel.length}/{cost})
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, justifyContent: 'center' }}>
              {human.hand.map((card, i) => {
                const isSel = sel.includes(i);
                return (
                  <div
                    key={card.id}
                    onClick={() => {
                      const newSel = isSel
                        ? sel.filter(x => x !== i)
                        : sel.length < cost ? [...sel, i] : sel;
                      setModal({ ...modal, selected: newSel });
                    }}
                    style={{
                      cursor: 'pointer', transition: 'all .15s',
                      outline: isSel ? '3px solid #FF7043' : '3px solid transparent',
                      borderRadius: 8,
                      transform: isSel ? 'translateY(-6px)' : 'none',
                      opacity: !isSel && sel.length >= cost ? 0.4 : 1,
                    }}
                  >
                    <GameCard card={card} selected={false} playable={false} large={false} small={true} />
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={() => setModal({ type: 'manual_cambiar' })} color="#333" style={{ color: '#aaa' }}>{T('goBack')}</Btn>
              <Btn
                onClick={() => resolveManualCambiar(modal.hatLang, modal.selected)}
                disabled={sel.length !== cost}
                color="#9C27B0"
                style={{ flex: 1 }}
              >
                {T('confirmDiscard')}
              </Btn>
            </div>
          </Modal>
        );
      })()}

      {/* Manual: Agregar sombrero */}
      {modal?.type === 'manual_agregar' && (
        <Modal title={T('addHatModal')}>
          <p style={{ color: '#888', fontSize: 12, marginBottom: 12 }}>
            {typeof T('addHatDesc') === 'function' ? T('addHatDesc')(Math.max(1, human.maxHand - 1)) : T('addHatDesc')}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {human.perchero.map(h => (
              <div
                key={h}
                onClick={() => resolveManualAgregar(h)}
                style={{
                  padding: 10, borderRadius: 10, cursor: 'pointer',
                  border: `2px solid ${LANG_BORDER[h]}88`,
                  background: 'rgba(255,255,255,.04)', transition: 'all .15s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,.04)'}
              >
                <HatSVG lang={h} size={36} />
                <span style={{ fontSize: 11, fontWeight: 700, color: LANG_TEXT[h] }}>
                  {h.charAt(0).toUpperCase() + h.slice(1)}
                </span>
              </div>
            ))}
          </div>
          <Btn onClick={() => setModal(null)} color="#333" style={{ color: '#aaa' }}>{T('cancel')}</Btn>
        </Modal>
      )}

      {/* Basurero */}
      {modal?.type === 'basurero' && (
        <Modal title={T('trashBin')}>
          <p style={{ color: '#888', fontSize: 12, marginBottom: 12 }}>
            {T('trashBinDesc')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12, maxHeight: 280, overflowY: 'auto' }}>
            {modal.cards.map(card => (
              <div
                key={card.id}
                onClick={() => resolveBasurero(card.id)}
                style={{ cursor: 'pointer' }}
              >
                <GameCard card={card} small={false} />
              </div>
            ))}
          </div>
          <Btn onClick={() => setModal(null)} color="#333" style={{ color: '#aaa' }}>{T('cancel')}</Btn>
        </Modal>
      )}

      {/* Wildcard (Comodín) modal */}
      {modal?.type === 'wildcard' && (() => {
        const human = players[HI];
        const burger = human.burgers[human.currentBurger] || [];
        const needed = (() => {
          const remaining = [...burger];
          const tableCopy = human.table.map(t => t.startsWith('perrito|') ? t.split('|')[1] : t);
          for (let i = remaining.length - 1; i >= 0; i--) {
            const idx = tableCopy.indexOf(remaining[i]);
            if (idx !== -1) {
              remaining.splice(i, 1);
              tableCopy.splice(idx, 1);
            }
          }
          return remaining;
        })();
        const choices = needed.length > 0 ? [...new Set(needed)] : Object.keys(ING_EMOJI).filter(i => i !== 'perrito');
        return (
          <Modal title={T('wildcard')}>
            <p style={{ color: '#888', fontSize: 12, marginBottom: 12 }}>
              {needed.length > 0 ? T('wildcardNeeded') : T('wildcardAny')}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {choices.map(ing => (
                <div
                  key={ing}
                  onClick={() => confirmWildcard(ing)}
                  style={{
                    width: 64, borderRadius: 10, background: ING_BG[ing], padding: '8px 4px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.4)', transition: 'transform .1s',
                    border: '2px solid rgba(0,0,0,0.15)',
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {ING_IMG[ing]
                    ? <img src={ING_IMG[ing]} alt={ing} style={{ width: 36, height: 36, objectFit: 'contain' }} />
                    : <span style={{ fontSize: 26 }}>{ING_EMOJI[ing]}</span>}
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#333', textAlign: 'center' }}>{ing}</span>
                </div>
              ))}
            </div>
            <Btn onClick={() => setModal(null)} color="#333" style={{ color: '#aaa' }}>{T('cancel')}</Btn>
          </Modal>
        );
      })()}

      {/* Ingredient info modal */}
      {modal?.type === 'ingredientInfo' && (() => {
        const raw = modal.ingredient;
        const base = ingKey(raw);
        const chosen = ingChosen(raw);
        const displayIng = chosen || base;
        const isWildcard = base === 'perrito';
        const specific = ING_AFFECTED_BY[displayIng] || [];
        const general = ['tenedor', 'gloton', 'intercambio_hamburguesa'];
        const allActionIds = [...specific, ...general, ...(isWildcard && !specific.includes('comecomodines') ? ['comecomodines'] : [])];
        return (
          <Modal title={`${ING_EMOJI[displayIng]} ${ING_NAMES[displayIng]?.español || displayIng}`}>
            {isWildcard && chosen && (
              <p style={{ color: '#ccc', fontSize: 13, marginBottom: 12 }}>
                {typeof T('wildcardActingAs') === 'function' ? T('wildcardActingAs')(`${ING_EMOJI[chosen]} ${ING_NAMES[chosen]?.español || chosen}`) : T('wildcardActingAs')}
              </p>
            )}
            {isWildcard && !chosen && (
              <p style={{ color: '#ccc', fontSize: 13, marginBottom: 12 }}>
                {T('wildcardCanBe')}
              </p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 12, background: ING_BG[displayIng],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {ING_IMG[displayIng]
                  ? <img src={ING_IMG[displayIng]} alt={displayIng} style={{ width: 40, height: 40, objectFit: 'contain' }} />
                  : <span style={{ fontSize: 32 }}>{ING_EMOJI[displayIng]}</span>}
              </div>
            </div>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: '#FFD700', marginBottom: 8 }}>{T('names')}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', marginBottom: 16 }}>
              {LANGUAGES.map(lang => (
                <div key={lang} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  <span style={{
                    background: LANG_BG[lang], color: LANG_TEXT[lang], border: `1px solid ${LANG_BORDER[lang]}`,
                    borderRadius: 4, padding: '1px 5px', fontSize: 10, fontWeight: 700, minWidth: 28, textAlign: 'center',
                  }}>{LANG_SHORT[lang]}</span>
                  <span style={{ color: '#ddd' }}>{getIngName(displayIng, lang)}</span>
                </div>
              ))}
            </div>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: '#FFD700', marginBottom: 8 }}>{T('affectingCards')}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              {allActionIds.map(id => {
                const info = getActionInfo(id);
                if (!info) return null;
                return (
                  <div key={id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '6px 10px',
                  }}>
                    <span style={{ fontSize: 18 }}>{info.emoji}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#eee' }}>{info.name}</div>
                      <div style={{ fontSize: 11, color: '#999' }}>{info.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <Btn onClick={() => setModal(null)} color="#333" style={{ color: '#aaa' }}>{T('close')}</Btn>
          </Modal>
        );
      })()}

      {/* Turn Action Info modal */}
      {modal?.type === 'turnActionInfo' && (() => {
        const actionKey = modal.action;
        const infos = {
          playIngredient: {
            emoji: '🃏',
            title: T('ingredientCard'),
            desc: T('tiPlayIngDesc'),
            example: (
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Ej:</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13 }}>
                  <span style={{ background: 'rgba(255,215,0,.2)', border: '1px solid #FFD700', borderRadius: 8, padding: '3px 8px' }}>🎩 ESP</span>
                  <span style={{ color: '#888' }}>+</span>
                  <span style={{ background: 'rgba(255,255,255,.08)', borderRadius: 8, padding: '3px 8px' }}>🥩 Carne <small style={{ color: '#aaa' }}>(ESP)</small></span>
                  <span style={{ color: '#888' }}>+</span>
                  <span style={{ background: 'rgba(76,175,80,.15)', border: '1px solid #4CAF50', borderRadius: 8, padding: '3px 8px' }}>🍔 necesita 🥩</span>
                  <span style={{ color: '#888' }}>→</span>
                  <span style={{ color: '#4CAF50', fontWeight: 700 }}>✅ ¡Jugá!</span>
                </div>
              </div>
            ),
          },
          playAction: {
            emoji: '⚡',
            title: T('actionCard'),
            desc: T('tiPlayCardDesc'),
            example: (
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px' }}>
                  {ACTION_CARDS.map(a => (
                    <div key={a.id} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
                      <span>{a.emoji}</span>
                      <span style={{ color: '#ccc' }}>{a.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ),
          },
          discard: {
            emoji: '🗑️',
            title: T('discard'),
            desc: T('tiDiscardDesc'),
            example: (
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 28 }}>🃏 → 🗑️</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>→ {T('yourTurnLabel')}</div>
              </div>
            ),
          },
          changeHat: {
            emoji: '🎩',
            title: T('changeHat'),
            desc: T('changeHatTooltip'),
            example: (
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13 }}>
                  <span style={{ background: 'rgba(255,215,0,.15)', border: '1px solid #FFD700', borderRadius: 8, padding: '3px 8px' }}>🎩 ESP</span>
                  <span style={{ color: '#888' }}>↔</span>
                  <span style={{ background: 'rgba(0,188,212,.15)', border: '1px solid #00BCD4', borderRadius: 8, padding: '3px 8px' }}>🎩 ENG</span>
                  <span style={{ color: '#888' }}>→</span>
                  <span style={{ color: '#FF7043' }}>✂️ -3 cartas</span>
                  <span style={{ color: '#888' }}>→</span>
                  <span style={{ color: '#4ecdc4' }}>+1 🥩</span>
                </div>
              </div>
            ),
          },
          addHat: {
            emoji: '➕',
            title: T('addHat'),
            desc: T('addHatTooltip'),
            example: (
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13 }}>
                  <span style={{ background: 'rgba(255,215,0,.15)', border: '1px solid #FFD700', borderRadius: 8, padding: '3px 8px' }}>🎩 ESP</span>
                  <span style={{ color: '#888' }}>+</span>
                  <span style={{ background: 'rgba(0,188,212,.15)', border: '1px solid #00BCD4', borderRadius: 8, padding: '3px 8px' }}>🎩 ENG</span>
                  <span style={{ color: '#888' }}>→</span>
                  <span style={{ color: '#FF7043' }}>🗑️ toda la mano</span>
                  <span style={{ color: '#888' }}>→</span>
                  <span style={{ color: '#4ecdc4' }}>+1 🥩</span>
                </div>
              </div>
            ),
          },
        };
        const info = infos[actionKey];
        if (!info) return null;
        return (
          <Modal title={`${info.emoji} ${info.title}`}>
            <p style={{ color: '#ccc', fontSize: 13, marginBottom: 14 }}>{info.desc}</p>
            {info.example}
            <Btn onClick={() => setModal(null)} color="#333" style={{ color: '#aaa' }}>{T('close')}</Btn>
          </Modal>
        );
      })()}

      {/* Negación window modal */}
      {pendingNeg && pendingNeg.eligibleIdxs.includes(HI) && !(HI in (pendingNeg.responses || {})) && (
        <Modal title={T('negation')}>
          <p style={{ marginBottom: 8, fontSize: 14 }} dangerouslySetInnerHTML={{ __html: typeof T('negationPlayed') === 'function' ? T('negationPlayed')(players[pendingNeg.actingIdx]?.name, `${pendingNeg.cardInfo?.emoji} ${pendingNeg.cardInfo?.name}`) : T('negationPlayed') }} />
          <p style={{ color: '#aaa', fontSize: 12, marginBottom: 16 }}>
            {T('negationQuestion')}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Btn onClick={() => respondNegation(true)} color="#c0392b">{T('deny')}</Btn>
            <Btn onClick={() => respondNegation(false)} color="#27ae60">{T('allow')}</Btn>
          </div>
        </Modal>
      )}

      {/* ── Chat panel ── */}
      {isOnline && showChat && (
        <div style={{
          position: 'fixed', bottom: isMobile ? 50 : 16, right: 16,
          width: isMobile ? 'calc(100% - 32px)' : 320, maxHeight: isMobile ? '60vh' : '50vh',
          background: '#16213e', border: '2px solid #2a2a4a', borderRadius: 14,
          display: 'flex', flexDirection: 'column', zIndex: 9999,
          boxShadow: '0 8px 32px rgba(0,0,0,.5)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', padding: '10px 14px',
            borderBottom: '1px solid #2a2a4a',
          }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: '#4ecdc4', flex: 1 }}>💬 Chat</span>
            <span onClick={() => setShowChat(false)} style={{ cursor: 'pointer', color: '#666', fontSize: 18, lineHeight: 1 }}>✕</span>
          </div>
          <div style={{
            flex: 1, overflowY: 'auto', padding: '8px 12px',
            display: 'flex', flexDirection: 'column', gap: 6,
            minHeight: 120, maxHeight: isMobile ? '40vh' : '35vh',
          }}>
            {chatMessages.length === 0 && (
              <div style={{ color: '#444', fontSize: 12, textAlign: 'center', marginTop: 20 }}>{T('noMessages')}</div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} style={{ fontSize: 12 }}>
                <span style={{ fontWeight: 800, color: '#4ecdc4' }}>{msg.playerName}: </span>
                <span style={{ color: '#ccc' }}>{msg.text}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div style={{
            display: 'flex', gap: 6, padding: '8px 12px',
            borderTop: '1px solid #2a2a4a',
          }}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
              placeholder={T('typeMessage')}
              style={{
                flex: 1, background: 'rgba(255,255,255,.06)', border: '1px solid #2a2a4a',
                borderRadius: 8, padding: '6px 10px', color: '#ccc', fontSize: 12,
                fontFamily: "'Fredoka',sans-serif", outline: 'none',
              }}
            />
            <Btn onClick={sendChatMessage} color="#4ecdc4" style={{ padding: '6px 12px', fontSize: 12 }}>
              {T('send')}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
