import React, { useState, useEffect, useRef, useCallback } from 'react';
import socket from './src/socket.js';
import {
  LANGUAGES, LANG_BORDER, LANG_BG, LANG_TEXT, LANG_SHORT,
  ING_EMOJI, ING_BG, FRUITS_VEGS, AI_NAMES, getIngName, getActionInfo,
  ING_NAMES, ACTION_CARDS,
} from './constants';
import { generateDeck, initPlayer, canPlayCard, checkBurgerComplete } from './game';
import { shuffle, randInt, uid } from './game/utils';
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

// ── Helpers ──────────────────────────────────────────────────────────────────
const PLAYER_COLORS = ['#FFD700', '#00BCD4', '#FF7043', '#66BB6A', '#CE93D8'];
const clone = o => JSON.parse(JSON.stringify(o));

function drawN(deck, discard, n) {
  let d = [...deck], di = [...discard], drawn = [];
  for (let i = 0; i < n; i++) {
    if (d.length === 0) { d = shuffle(di); di = []; }
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

// ── Setup Screen ──────────────────────────────────────────────────────────────
function SetupScreen({ onStart, onOnline }) {
  const [name, setName] = useState('');
  const [hat, setHat] = useState(null);
  const [diff, setDiff] = useState('medio');
  const [aiCount, setAiCount] = useState(2);

  const diffs = [
    { id: 'facil', label: 'Fácil', desc: '1 hamburguesa (4-6 ing.)' },
    { id: 'medio', label: 'Medio', desc: '2 hamburguesas (5-6 ing.)' },
    { id: 'dificil', label: 'Difícil', desc: '3 hamburguesas (5-7 ing.)' },
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
          <h1 style={{ fontSize: 30, fontWeight: 900, color: '#FFD700', letterSpacing: 1 }}>HUNGRY POLY</h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Aprende vocabulario armando hamburguesas</p>
        </div>

        {/* Name */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>TU NOMBRE</label>
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="Ingresa tu nombre..."
            maxLength={20}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid #2a2a4a',
              background: '#0f1117', color: '#eee', fontFamily: "'Fredoka',sans-serif",
              fontSize: 15, outline: 'none',
            }}
          />
        </div>

        {/* Hat selection */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>ELIGE TU IDIOMA</label>
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

        {/* Difficulty */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>DIFICULTAD</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {diffs.map(d => (
              <div
                key={d.id}
                onClick={() => setDiff(d.id)}
                style={{
                  flex: 1, padding: '8px 6px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                  border: diff === d.id ? '2px solid #FFD700' : '2px solid #2a2a4a',
                  background: diff === d.id ? 'rgba(255,215,0,.08)' : 'rgba(255,255,255,.02)',
                  transition: 'all .15s',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: diff === d.id ? '#FFD700' : '#ccc' }}>{d.label}</div>
                <div style={{ fontSize: 9, color: '#666', marginTop: 2 }}>{d.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI count */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>
            OPONENTES IA: <span style={{ color: '#FFD700' }}>{aiCount}</span>
          </label>
          <input
            type="range" min={1} max={3} value={aiCount}
            onChange={e => setAiCount(+e.target.value)}
            style={{ width: '100%', accentColor: '#FFD700' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#555', marginTop: 2 }}>
            <span>1 oponente</span><span>3 oponentes</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Btn
            onClick={() => onStart(name.trim(), hat, diff, aiCount)}
            disabled={!name.trim() || !hat}
            color="#FFD700"
            style={{ flex: 1, fontSize: 16, padding: '12px 0' }}
          >
            🎮 vs IA
          </Btn>
          <Btn
            onClick={onOnline}
            color="#00BCD4"
            style={{ flex: 1, fontSize: 16, padding: '12px 0' }}
          >
            🌐 Online
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ── Transition Screen ─────────────────────────────────────────────────────────
function TransitionScreen({ player, onContinue }) {
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
      <div style={{ fontSize: 60, marginBottom: 16 }}>🎴</div>
      <h2 style={{ fontSize: 28, fontWeight: 900, color: '#FFD700', marginBottom: 8 }}>Tu turno</h2>
      <div style={{ fontSize: 22, color: '#eee', marginBottom: 6 }}>
        {player?.name}
      </div>
      <div style={{ fontSize: 13, color: '#555', marginTop: 20 }}>
        Toca para continuar...
      </div>
    </div>
  );
}

// ── Game Over Screen ──────────────────────────────────────────────────────────
function GameOverScreen({ winner, players, onRestart }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#0f1117 0%,#1a1a2e 100%)',
    }}>
      <div style={{ fontSize: 72, marginBottom: 12 }}>🏆</div>
      <h1 style={{ fontSize: 34, fontWeight: 900, color: '#FFD700', marginBottom: 6 }}>¡{winner.name} ganó!</h1>
      <p style={{ color: '#888', fontSize: 14, marginBottom: 32 }}>
        Completó todas sus hamburguesas primero
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
      <Btn onClick={onRestart} color="#FFD700" style={{ fontSize: 16, padding: '12px 32px' }}>
        🔄 Jugar de nuevo
      </Btn>
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
function OpponentCard({ player, index, color, isActive, onIngredientClick }) {
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
        {isActive && <span style={{ fontSize: 10, color: '#FFD700', marginLeft: 'auto' }}>⟵ turno</span>}
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
        🃏 {player.hand.length} cartas en mano
      </div>
    </div>
  );
}

// ── Online Menu (create / join room) ─────────────────────────────────────────
function OnlineMenu({ onCreated, onJoined, onBack, initialCode = '' }) {
  const [tab, setTab] = useState(initialCode ? 'join' : 'create');
  const [name, setName] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinCode, setJoinCode] = useState(initialCode);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleCreate() {
    if (!name.trim()) return;
    setLoading(true); setError('');
    socket.connect();
    socket.once('roomCreated', ({ code }) => {
      setLoading(false);
      window.history.replaceState({}, '', window.location.pathname);
      onCreated(name.trim(), code);
    });
    socket.emit('createRoom', { playerName: name.trim() });
  }

  function handleJoin() {
    if (!joinName.trim() || !joinCode.trim()) return;
    setLoading(true); setError('');
    socket.connect();
    socket.once('joinError', msg => { setError(msg); setLoading(false); socket.disconnect(); });
    socket.once('roomJoined', ({ myIdx }) => {
      setLoading(false);
      window.history.replaceState({}, '', window.location.pathname);
      onJoined(joinName.trim(), joinCode.trim().toUpperCase(), myIdx);
    });
    socket.emit('joinRoom', { playerName: joinName.trim(), code: joinCode.trim().toUpperCase() });
  }

  const tabStyle = (active) => ({
    flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
    fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 14,
    background: active ? '#FFD700' : 'rgba(255,255,255,.06)',
    color: active ? '#111' : '#aaa', transition: 'all .15s',
  });
  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid #2a2a4a',
    background: '#0f1117', color: '#eee', fontFamily: "'Fredoka',sans-serif",
    fontSize: 15, outline: 'none', boxSizing: 'border-box',
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
        maxWidth: 480, width: '92vw',
        boxShadow: '0 8px 40px rgba(0,0,0,.6)', border: '2px solid #2a2a4a',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 50, marginBottom: 8 }}>🌐</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#FFD700' }}>Multijugador Online</h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Juega con amigos en tiempo real</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button style={tabStyle(tab === 'create')} onClick={() => { setTab('create'); setError(''); }}>
            ➕ Crear sala
          </button>
          <button style={tabStyle(tab === 'join')} onClick={() => { setTab('join'); setError(''); }}>
            🔗 Unirse a sala
          </button>
        </div>

        {tab === 'create' && (
          <div>
            <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>TU NOMBRE</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Ingresa tu nombre..."
              maxLength={20} style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <Btn
              onClick={handleCreate}
              disabled={!name.trim() || loading}
              color="#FFD700"
              style={{ width: '100%', fontSize: 16, padding: '12px 0', marginTop: 20 }}
            >
              {loading ? '⏳ Creando...' : '🎮 Crear sala'}
            </Btn>
          </div>
        )}

        {tab === 'join' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>TU NOMBRE</label>
              <input
                value={joinName} onChange={e => setJoinName(e.target.value)}
                placeholder="Ingresa tu nombre..." maxLength={20} style={inputStyle}
              />
            </div>
            <div>
              <label style={{ color: '#aaa', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>CÓDIGO DE SALA</label>
              <input
                value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Ej: ABCD1" maxLength={7} style={{ ...inputStyle, letterSpacing: 4, textTransform: 'uppercase' }}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
              />
            </div>
            <Btn
              onClick={handleJoin}
              disabled={!joinName.trim() || !joinCode.trim() || loading}
              color="#00BCD4"
              style={{ width: '100%', fontSize: 16, padding: '12px 0' }}
            >
              {loading ? '⏳ Uniéndose...' : '🔗 Unirse'}
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
            ← Volver al menú
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Online Lobby (waiting room before game starts) ────────────────────────────
function OnlineLobby({ roomCode, myName, isHost, players, onStart, onBack }) {
  const [diff, setDiff] = useState('medio');
  const [hatPicks, setHatPicks] = useState({});
  const [copied, setCopied] = useState(false);

  function handleCopyLink() {
    const link = window.location.origin + '/?sala=' + roomCode;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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

  const diffs = [
    { id: 'facil', label: 'Fácil', desc: '1 hamburguesa' },
    { id: 'medio', label: 'Medio', desc: '2 hamburguesas' },
    { id: 'dificil', label: 'Difícil', desc: '3 hamburguesas' },
  ];

  function pickHat(lang) {
    const taken = Object.values(hatPicks);
    if (taken.includes(lang) && hatPicks[myName] !== lang) return;
    setHatPicks(prev => ({ ...prev, [myName]: lang }));
    socket.emit('lobbyHatPick', { code: roomCode, playerName: myName, hat: lang });
  }

  function handleStart() {
    if (!myHat) return;
    socket.emit('startGame', { code: roomCode, hatPicks, difficulty: diff });
    onStart(hatPicks, diff);
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
        {/* Room code display */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: '#888', fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>CÓDIGO DE SALA</div>
          <div style={{
            fontSize: 36, fontWeight: 900, color: '#FFD700', letterSpacing: 8,
            background: 'rgba(255,215,0,.08)', borderRadius: 12, padding: '10px 20px',
            border: '2px dashed rgba(255,215,0,.3)',
          }}>
            {roomCode}
          </div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 8 }}>Comparte este código con tus amigos</div>
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
            {copied ? '✅ ¡Enlace copiado!' : '🔗 Copiar enlace'}
          </button>
        </div>

        {/* Players */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#555', letterSpacing: 1, marginBottom: 10 }}>
            JUGADORES ({players.length}/4)
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
                {p.name === myName && <span style={{ fontSize: 11, color: '#888' }}>(tú)</span>}
                {i === 0 && <span style={{ fontSize: 11, color: '#FFD700', marginLeft: 'auto' }}>👑 Host</span>}
                {hatPicks[p.name] && (
                  <HatSVG lang={hatPicks[p.name]} size={24} />
                )}
              </div>
            ))}
            {players.length < 2 && (
              <div style={{ fontSize: 12, color: '#555', textAlign: 'center', padding: 8 }}>
                ⏳ Esperando más jugadores...
              </div>
            )}
          </div>
        </div>

        {/* Hat selection for current player */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: '#aaa', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8 }}>
            TU IDIOMA {myHat ? '✅' : '(elige uno)'}
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

        {/* Difficulty (host only) */}
        {isHost && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: '#aaa', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8 }}>DIFICULTAD</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {diffs.map(d => (
                <div
                  key={d.id}
                  onClick={() => setDiff(d.id)}
                  style={{
                    flex: 1, padding: '7px 4px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                    border: diff === d.id ? '2px solid #FFD700' : '2px solid #2a2a4a',
                    background: diff === d.id ? 'rgba(255,215,0,.08)' : 'rgba(255,255,255,.02)',
                    transition: 'all .15s',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: diff === d.id ? '#FFD700' : '#ccc' }}>{d.label}</div>
                  <div style={{ fontSize: 9, color: '#666', marginTop: 2 }}>{d.desc}</div>
                </div>
              ))}
            </div>
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
              ? `⏳ Esperando sombreros (${Object.keys(hatPicks).length}/${players.length})`
              : '🚀 ¡Iniciar partida!'}
          </Btn>
        ) : (
          <div style={{ textAlign: 'center', padding: 12, color: '#888', fontSize: 13 }}>
            {!myHat ? '👆 Elige tu sombrero de idioma' : '⏳ Esperando que el host inicie...'}
          </div>
        )}

        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <button onClick={onBack} style={{
            background: 'none', border: 'none', color: '#555', cursor: 'pointer',
            fontFamily: "'Fredoka',sans-serif", fontSize: 12,
          }}>
            ← Salir de la sala
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const initialSalaCode = new URLSearchParams(window.location.search).get('sala') || '';
  const [phase, setPhase] = useState(initialSalaCode ? 'onlineMenu' : 'setup');
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
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  // Human index: 0 for local/AI mode, myPlayerIdx for online
  const HI = isOnline ? myPlayerIdx : 0;

  // ── Negación state ──
  // pendingNeg: null | { actingIdx, cardInfo, eligibleIdxs, responses: {i: bool} }
  const [pendingNeg, setPendingNeg] = useState(null);
  // Host-only ref that stores the resolve callback (not serializable over socket)
  const pendingNegRef = useRef(null);

  function addLog(playerIdx, text, pls) {
    const p = pls ? pls[playerIdx] : null;
    const color = PLAYER_COLORS[playerIdx % PLAYER_COLORS.length];
    setLog(prev => [{ player: p ? p.name : '', text, color }, ...prev].slice(0, 40));
  }

  // ── Socket: lobby updates (hat picks from others) ──
  useEffect(() => {
    if (!isOnline) return;
    socket.on('lobbyUpdate', ({ players: pls }) => setLobbyPlayers(pls));
    socket.on('lobbyHatPick', () => {});  // handled via lobbyUpdate in server if needed
    socket.on('playerLeft', ({ players: pls }) => setLobbyPlayers(pls));
    return () => {
      socket.off('lobbyUpdate');
      socket.off('lobbyHatPick');
      socket.off('playerLeft');
    };
  }, [isOnline]);

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
        const privateModals = ['manual_cambiar', 'manual_cambiar_discard', 'manual_agregar', 'wildcard', 'basurero', 'pickHatReplace', 'ingredientInfo'];
        if (state.modal) return state.modal;
        if (currentModal && privateModals.includes(currentModal.type)) return currentModal;
        return null;
      });
      setPendingNeg(state.pendingNeg || null);
      if (state.winner) { setWinner(state.winner); setPhase('gameover'); }
      else if (state.phase) setPhase(state.phase);
    });
    return () => socket.off('stateUpdate');
  }, [isOnline, isHost]);

  // ── Socket: host syncs state to all clients after every change ──
  const syncRef = useRef(null);
  useEffect(() => {
    if (!isOnline || !isHost || phase !== 'playing') return;
    clearTimeout(syncRef.current);
    syncRef.current = setTimeout(() => {
      const privateModals = ['manual_cambiar', 'manual_cambiar_discard', 'manual_agregar', 'wildcard', 'basurero', 'pickHatReplace', 'ingredientInfo'];
      const syncModal = modal && privateModals.includes(modal.type) ? null : modal;
      socket.emit('syncState', {
        code: roomCode,
        state: { players, deck, discard, cp, log, extraPlay, modal: syncModal, pendingNeg, winner, phase },
      });
    }, 80);
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
  function startGame(name, hat, diff, aiCount) {
    const rawDeck = generateDeck();
    const deckArr = [...rawDeck];
    const ps = [];
    ps.push(initPlayer(name, deckArr, hat, diff, false));
    const usedHats = [hat];
    const aiNames = shuffle([...AI_NAMES, 'Maestro Cocinero', 'Hambre Total', 'Chef Políglota']);
    for (let i = 0; i < aiCount; i++) {
      const avail = LANGUAGES.filter(l => !usedHats.includes(l));
      const aiHat = avail.length ? shuffle(avail)[0] : shuffle(LANGUAGES)[0];
      usedHats.push(aiHat);
      ps.push(initPlayer(aiNames[i % aiNames.length], deckArr, aiHat, diff, true));
    }
    setPlayers(ps); setDeck(deckArr); setDiscard([]);
    setCp(0); setLog([]); setSelectedIdx(null); setModal(null);
    setWinner(null); setExtraPlay(false);
    aiRunning.current = false;
    setPhase('playing');
  }

  // ── Start game (online host) ──
  function startOnlineGame(hatPicks, diff, onlinePls) {
    const rawDeck = generateDeck();
    const deckArr = [...rawDeck];
    const ps = onlinePls.map(p => initPlayer(p.name, deckArr, hatPicks[p.name], diff, false));
    // Mark non-host players as remote
    ps.forEach((p, i) => { if (i !== 0) p.isRemote = true; });
    setPlayers(ps); setDeck(deckArr); setDiscard([]);
    setCp(0); setLog([]); setSelectedIdx(null); setModal(null);
    setWinner(null); setExtraPlay(false);
    aiRunning.current = false;
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
        if (pls[ti].mainHats.length === 0 && pls[ti].perchero.length > 0) {
          setPlayers(pls); setDiscard(di);
          setModal({ type: 'pickHatReplace', newPls: pls, newDiscard: di, victimIdx: ti, fromIdx: actingIdx });
          return;
        }
      }
      endTurnFromRemote(pls, dk, di, actingIdx);
    } else if (card.action === 'intercambio_sombreros') {
      const tmp = pls[actingIdx].mainHats[0];
      pls[actingIdx].mainHats[0] = pls[ti].mainHats[0];
      pls[ti].mainHats[0] = tmp;
      endTurnFromRemote(pls, dk, di, actingIdx);
    } else if (card.action === 'intercambio_hamburguesa') {
      const tmp = pls[actingIdx].table;
      pls[actingIdx].table = pls[ti].table;
      pls[ti].table = tmp;
      filterTable(pls[actingIdx], di);
      filterTable(pls[ti], di);
      endTurnFromRemote(pls, dk, di, actingIdx);
    } else if (card.action === 'cambio_sombrero') {
      const tmp = [...pls[actingIdx].mainHats];
      pls[actingIdx].mainHats = [...pls[ti].mainHats];
      pls[ti].mainHats = tmp;
      setPlayers(pls); setDiscard(di); setExtraPlay(true);
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
      setWinner(w); setPhase('gameover');
      return;
    }
    const nextIdx = (fromIdx + 1) % newPls.length;
    setPlayers(newPls); setDeck(newDeck); setDiscard(newDiscard);
    setSelectedIdx(null); setExtraPlay(false);
    setCp(nextIdx);
    // In online mode skip transition screen (turn order is visible in UI)
    if (nextIdx === HI && !isOnline) {
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
      } else if (card.action === 'cambio_sombrero') {
        const tmp = [...newPls[idx].mainHats];
        newPls[idx].mainHats = [...newPls[richest].mainHats];
        newPls[richest].mainHats = tmp;
        addLog(idx, `intercambió todos los sombreros con ${pls[richest].name}`, newPls);
        // Extra play: try to play an ingredient with the new hats
        const pi2 = newPls[idx].hand.findIndex(c => c.type === 'ingredient' && canPlayCard(newPls[idx], c));
        if (pi2 !== -1) {
          const c2 = newPls[idx].hand[pi2];
          addLog(idx, `jugó ${getIngName(c2.ingredient, c2.language)} ${ING_EMOJI[c2.ingredient]}`, newPls);
          newPls[idx].hand.splice(pi2, 1);
          newPls[idx].table.push(c2.ingredient);
          const { player: up3, freed: fr3, done: dn3 } = advanceBurger(newPls[idx]);
          newPls[idx] = up3;
          if (dn3) { fr3.forEach(ing => newDiscard.push({ type: 'ingredient', ingredient: ingKey(ing), id: `c${Date.now()}${Math.random()}` })); addLog(idx, '¡completó una hamburguesa! 🎉', newPls); }
        }
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
    } else if (card.action === 'cambio_sombrero') {
      setModal({ type: 'pickTarget', cardIdx, action: card.action });
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
    const targeted = ['tenedor', 'ladron', 'intercambio_sombreros', 'intercambio_hamburguesa', 'gloton', 'cambio_sombrero'];

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
        if (newPls[HI].mainHats[0] && newPls[targetIdx].mainHats[0]) {
          const tmp = newPls[HI].mainHats[0];
          newPls[HI].mainHats[0] = newPls[targetIdx].mainHats[0];
          newPls[targetIdx].mainHats[0] = tmp;
        }
        endTurn(newPls, dk, newDiscard, HI);

      } else if (action === 'intercambio_hamburguesa') {
        const tmp = newPls[HI].table;
        newPls[HI].table = newPls[targetIdx].table;
        newPls[targetIdx].table = tmp;
        filterTable(newPls[HI], newDiscard);
        filterTable(newPls[targetIdx], newDiscard);
        endTurn(newPls, dk, newDiscard, HI);

      } else if (action === 'cambio_sombrero') {
        const tmp = [...newPls[HI].mainHats];
        newPls[HI].mainHats = [...newPls[targetIdx].mainHats];
        newPls[targetIdx].mainHats = tmp;
        setPlayers(newPls); setDiscard(newDiscard); setExtraPlay(true);
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
    addLog(HI, `cambió sombrero a ${hatLang} (descartó ${cost} carta${cost !== 1 ? 's' : ''}) — puede jugar una carta`, newPls);
    setPlayers(newPls); setDiscard(newDiscard); setExtraPlay(true);
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
    let newDiscard = [...discard, ...p.hand];
    p.hand = [];
    p.maxHand = Math.max(1, p.maxHand - 1);
    const { drawn, deck: newDeck, discard: di2 } = drawN(deck, newDiscard, p.maxHand);
    p.hand = drawn;
    addLog(HI, `agregó sombrero ${hatLang} — mano máx reducida a ${p.maxHand}`, newPls);
    setPlayers(newPls); setDeck(newDeck); setDiscard(di2); setExtraPlay(true);
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
  if (phase === 'setup') return (
    <SetupScreen
      onStart={startGame}
      onOnline={() => setPhase('onlineMenu')}
    />
  );

  if (phase === 'onlineMenu') return (
    <OnlineMenu
      initialCode={initialSalaCode}
      onBack={() => setPhase('setup')}
      onCreated={(name, code) => {
        setIsOnline(true); setIsHost(true); setMyPlayerIdx(0); setRoomCode(code);
        setLobbyPlayers([{ name, idx: 0 }]);
        setPhase('onlineLobby');
      }}
      onJoined={(name, code, myIdx) => {
        setIsOnline(true); setIsHost(false); setMyPlayerIdx(myIdx); setRoomCode(code);
        setLobbyPlayers([]);
        socket.once('lobbyUpdate', ({ players: pls }) => setLobbyPlayers(pls));
        // gameStarted event will trigger stateUpdate which sets phase to 'playing'
        socket.once('gameStarted', () => setPhase('playing'));
        setPhase('onlineLobby');
      }}
    />
  );

  if (phase === 'onlineLobby') return (
    <OnlineLobby
      roomCode={roomCode}
      myName={lobbyPlayers[myPlayerIdx]?.name || ''}
      isHost={isHost}
      players={lobbyPlayers}
      onStart={(hatPicks, diff) => {
        if (isHost) {
          startOnlineGame(hatPicks, diff, lobbyPlayers);
        }
      }}
      onBack={() => {
        socket.disconnect();
        setIsOnline(false); setIsHost(false); setMyPlayerIdx(0); setRoomCode('');
        setLobbyPlayers([]);
        setPhase('setup');
      }}
    />
  );

  if (phase === 'transition') return <TransitionScreen player={players[HI]} onContinue={() => setPhase('playing')} />;
  if (phase === 'gameover') return (
    <GameOverScreen
      winner={winner}
      players={players}
      onRestart={() => {
        if (isOnline) { socket.disconnect(); setIsOnline(false); setIsHost(false); setMyPlayerIdx(0); setRoomCode(''); setLobbyPlayers([]); }
        setPhase('setup');
      }}
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
      <div style={{ fontSize: 11, fontWeight: 800, color: '#555', letterSpacing: 1, marginBottom: 4 }}>OPONENTES</div>
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
          />
        );
      })}

      {/* Log panel */}
      {showLog && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#555', letterSpacing: 1, marginBottom: 6 }}>HISTORIAL</div>
          {log.length === 0 && <div style={{ fontSize: 11, color: '#444' }}>Sin eventos aún</div>}
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
          {extraPlay && <span style={{ color: '#FFD700', marginLeft: 8 }}>⚡ Turno extra!</span>}
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
      <div style={{ fontSize: 11, fontWeight: 800, color: '#555', letterSpacing: 1, marginBottom: 6 }}>HAMBURGUESAS</div>
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
        MESA ({human.table.length} ingredientes)
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', minHeight: 32 }}>
        {human.table.length === 0 && <span style={{ fontSize: 12, color: '#333' }}>Mesa vacía</span>}
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
        <div style={{ fontSize: 9, color: '#555', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>PERCHERO</div>
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
        title="Cambia tu sombrero principal (cuesta descartar la mitad de tu mano)"
        style={{
          padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(156,39,176,0.3)',
          background: 'rgba(156,39,176,0.12)', color: '#BA68C8', fontSize: 14,
          fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        🎩 Cambiar
      </button>
      {human.hand.length > 0 && (
        <button
          onClick={() => { setShowPercheroModal(false); setModal({ type: 'manual_agregar' }); }}
          title="Agrega un sombrero extra (descarta toda tu mano, mano máx se reduce)"
          style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(156,39,176,0.3)',
            background: 'rgba(156,39,176,0.12)', color: '#BA68C8', fontSize: 14,
            fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          ➕ Agregar
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
          <div style={{ fontSize: 9, color: '#555', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>PRINCIPAL</div>
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
              🧥 Ver perchero ({human.perchero.length})
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

  const handLabel = (
    <div style={{ fontSize: 11, fontWeight: 800, color: '#555', letterSpacing: 1, flexShrink: 0 }}>
      MANO ({human.hand.length}/{human.maxHand})
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
        const playable = card.type === 'ingredient' ? canPlayCard(human, card) : null;
        const angle = handN > 1 ? -MAX_ANGLE + i * (2 * MAX_ANGLE / (handN - 1)) : 0;
        const isSelected = selectedIdx === i;
        return (
          <div
            key={card.id}
            onClick={() => isHumanTurn ? setSelectedIdx(isSelected ? null : i) : null}
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
                      <span style={{ fontSize: 12, color: '#ccc' }}>Escoge el ingrediente que necesites</span>
                    )}
                    {canPlayCard(human, card)
                      ? <span style={{ color: '#4CAF50', fontSize: 12 }}>✅ Puedes jugar</span>
                      : <span style={{ color: '#FF7043', fontSize: 12 }}>❌ No puedes jugar</span>}
                  </>) : (<>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#FFD700' }}>{getActionInfo(card.action)?.name}</span>
                    <span style={{ fontSize: 12, color: '#ccc' }}>{getActionInfo(card.action)?.desc}</span>
                  </>)}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Btn onClick={humanPlay} color="#4CAF50" style={{ fontSize: 11, padding: '6px 12px' }}>
                    ▶ Jugar
                  </Btn>
                  <Btn onClick={humanDiscard} disabled={extraPlay} color="#FF7043" style={{ fontSize: 11, padding: '6px 12px' }}>
                    🗑 Descartar
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
          ? <span style={{ color: '#4CAF50' }}>✅ Puedes jugar esta carta</span>
          : <span style={{ color: '#FF7043' }}>❌ No puedes jugar esta carta ahora (sombrero o ingrediente no necesario)</span>
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
        ⏭ Pasar turno
      </Btn>
    </div>
  );

  const turnStatus = !isHumanTurn && (
    <div style={{
      textAlign: 'center', color: '#555', fontSize: 13, padding: '8px 0', flexShrink: 0,
    }}>
      {players[cp]?.isRemote ? `🌐 Esperando la jugada de ${players[cp]?.name}...` : `⏳ Esperando a ${players[cp]?.name}...`}
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
      background: '#0f1117', fontFamily: "'Fredoka',sans-serif", overflow: 'hidden',
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
            {isHumanTurn ? '🎴 Tu turno' : `⏳ ${players[cp]?.name}`}
          </div>
          {isOnline && !isMobile && (
            <div style={{ fontSize: 11, color: '#555', padding: '3px 8px', borderRadius: 6, background: 'rgba(0,188,212,.08)', border: '1px solid rgba(0,188,212,.2)' }}>
              🌐 Sala: {roomCode}
            </div>
          )}
          <Btn onClick={() => setShowLog(l => !l)} color="#2a2a4a" style={{ color: '#aaa', fontSize: 12, padding: '4px 10px' }}>
            📋 Log
          </Btn>
        </div>
      </div>

      {/* ── Main area ── */}
      {isMobile ? (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {mobileTab === 'mesa' && mesaPanel}
          {mobileTab === 'rivales' && rivalesPanel}

          {/* Mobile tab bar */}
          <div style={{ display: 'flex', flexShrink: 0, background: '#16213e', borderTop: '2px solid #2a2a4a' }}>
            {[
              { id: 'mesa', label: '🍔 Mesa', notify: isHumanTurn },
              { id: 'rivales', label: '👥 Rivales' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setMobileTab(tab.id)} style={{
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
        <Modal title={`${getActionInfo(modal.action)?.emoji} ${getActionInfo(modal.action)?.name} — Elige oponente`}>
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
                      Mesa: {p.table.map(ing => ING_EMOJI[ingKey(ing)]).join(' ') || 'vacía'} •
                      Hambres: {p.currentBurger}/{p.totalBurgers}
                    </div>
                  </div>
                </div>
              );
            })}
            <Btn onClick={() => setModal(null)} color="#333" style={{ color: '#aaa', marginTop: 8 }}>
              Cancelar
            </Btn>
          </div>
        </Modal>
      )}

      {/* Pick Ingredient (Tenedor) */}
      {modal?.type === 'pickIngredient' && (
        <Modal title="🍴 El Tenedor — Elige ingrediente a robar">
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
          <Btn onClick={() => setModal(null)} color="#333" style={{ color: '#aaa' }}>Cancelar</Btn>
        </Modal>
      )}

      {/* Pick Ingredient (Tenedor) - non-host remote version */}
      {modal?.type === 'pickIngredientRemote' && (
        <Modal title="🍴 El Tenedor — Elige ingrediente a robar">
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
          <Btn onClick={() => setModal(null)} color="#333" style={{ color: '#aaa' }}>Cancelar</Btn>
        </Modal>
      )}

      {/* Pick Hat Replace (after Ladrón steals last hat) */}
      {modal?.type === 'pickHatReplace' && (!isOnline || !isHost || modal.victimIdx === HI) && (
        <Modal title="🎩 Elige nuevo sombrero principal">
          <p style={{ color: '#888', fontSize: 12, marginBottom: 12 }}>
            {isOnline && isHost && modal.victimIdx !== HI
              ? `⏳ Esperando que ${players[modal.victimIdx]?.name} elija su sombrero...`
              : 'Tu sombrero principal fue robado. Elige uno del perchero.'}
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
              Cerrar
            </button>
          </div>
        </Modal>
      )}

      {/* Mobile: Card detail modal */}
      {isMobile && isHumanTurn && selectedIdx !== null && human.hand[selectedIdx] && (() => {
        const card = human.hand[selectedIdx];
        const playable = card.type === 'ingredient' ? canPlayCard(human, card) : null;
        return (
          <Modal title={card.type === 'ingredient' ? '🃏 Carta de Ingrediente' : '⚡ Carta de Acción'}>
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
                    <span style={{ fontSize: 13, color: '#ccc' }}>Escoge el ingrediente que necesites</span>
                  )}
                  {canPlayCard(human, card)
                    ? <span style={{ color: '#4CAF50', fontSize: 13 }}>✅ Puedes jugar</span>
                    : <span style={{ color: '#FF7043', fontSize: 13 }}>❌ No puedes jugar</span>}
                </>) : (<>
                  <span style={{ fontWeight: 700, fontSize: 16, color: '#FFD700' }}>{getActionInfo(card.action)?.name}</span>
                  <span style={{ fontSize: 13, color: '#ccc' }}>{getActionInfo(card.action)?.desc}</span>
                </>)}
              </div>
              <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                <Btn onClick={() => { humanPlay(); }} color="#4CAF50" style={{ flex: 1, fontSize: 14, padding: '10px 16px' }}>
                  ▶ Jugar
                </Btn>
                <Btn onClick={() => { humanDiscard(); }} disabled={extraPlay} color="#FF7043" style={{ flex: 1, fontSize: 14, padding: '10px 16px' }}>
                  🗑 Descartar
                </Btn>
              </div>
              <button onClick={() => setSelectedIdx(null)} style={{
                padding: '8px 24px', borderRadius: 8, border: '1px solid #2a2a4a',
                background: 'rgba(255,255,255,.08)', color: '#aaa',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Cerrar
              </button>
            </div>
          </Modal>
        );
      })()}

      {/* Manual: Cambiar sombrero — paso 1: elegir sombrero */}
      {modal?.type === 'manual_cambiar' && (
        <Modal title="🎩 Cambiar Sombrero — paso 1: elegir sombrero">
          <p style={{ color: '#888', fontSize: 12, marginBottom: 12 }}>
            Elige un sombrero del perchero. Luego elegirás qué {Math.ceil(human.hand.length / 2)} carta{Math.ceil(human.hand.length / 2) !== 1 ? 's' : ''} descartar.
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
          <Btn onClick={() => setModal(null)} color="#333" style={{ color: '#aaa' }}>Cancelar</Btn>
        </Modal>
      )}

      {/* Manual: Cambiar sombrero — paso 2: elegir cartas a descartar */}
      {modal?.type === 'manual_cambiar_discard' && (() => {
        const cost = Math.ceil(human.hand.length / 2);
        const sel = modal.selected;
        const remaining = cost - sel.length;
        return (
          <Modal title={`🎩 Cambiar a ${modal.hatLang.charAt(0).toUpperCase() + modal.hatLang.slice(1)} — paso 2: elegir cartas`}>
            <p style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>
              Elegí <strong style={{ color: remaining > 0 ? '#FFD700' : '#4CAF50' }}>
                {remaining > 0 ? `${remaining} carta${remaining !== 1 ? 's' : ''} más` : '¡Listo!'}
              </strong> para descartar ({sel.length}/{cost})
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
              <Btn onClick={() => setModal({ type: 'manual_cambiar' })} color="#333" style={{ color: '#aaa' }}>← Volver</Btn>
              <Btn
                onClick={() => resolveManualCambiar(modal.hatLang, modal.selected)}
                disabled={sel.length !== cost}
                color="#9C27B0"
                style={{ flex: 1 }}
              >
                Confirmar descarte
              </Btn>
            </div>
          </Modal>
        );
      })()}

      {/* Manual: Agregar sombrero */}
      {modal?.type === 'manual_agregar' && (
        <Modal title="➕ Agregar Sombrero — descartás toda tu mano">
          <p style={{ color: '#888', fontSize: 12, marginBottom: 12 }}>
            Elige un sombrero del perchero para agregarlo a tu sombrero principal. Descartás toda tu mano y tu máximo de cartas se reduce a {Math.max(1, human.maxHand - 1)}.
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
          <Btn onClick={() => setModal(null)} color="#333" style={{ color: '#aaa' }}>Cancelar</Btn>
        </Modal>
      )}

      {/* Basurero */}
      {modal?.type === 'basurero' && (
        <Modal title="🗑️ El Basurero — Elige una carta del descarte">
          <p style={{ color: '#888', fontSize: 12, marginBottom: 12 }}>
            Rescata un ingrediente del montón de descarte.
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
          <Btn onClick={() => setModal(null)} color="#333" style={{ color: '#aaa' }}>Cancelar</Btn>
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
          <Modal title="🌭 Comodín — Elige ingrediente">
            <p style={{ color: '#888', fontSize: 12, marginBottom: 12 }}>
              {needed.length > 0 ? 'Estos son los ingredientes que te faltan:' : 'Elige el ingrediente que representa el comodín:'}
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
            <Btn onClick={() => setModal(null)} color="#333" style={{ color: '#aaa' }}>Cancelar</Btn>
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
        const allActionIds = [...specific, ...general];
        return (
          <Modal title={`${ING_EMOJI[displayIng]} ${ING_NAMES[displayIng]?.español || displayIng}`}>
            {isWildcard && chosen && (
              <p style={{ color: '#ccc', fontSize: 13, marginBottom: 12 }}>
                Comodín actuando como: {ING_EMOJI[chosen]} {ING_NAMES[chosen]?.español || chosen}
              </p>
            )}
            {isWildcard && !chosen && (
              <p style={{ color: '#ccc', fontSize: 13, marginBottom: 12 }}>
                Puede representar cualquier ingrediente
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
            <h4 style={{ fontSize: 14, fontWeight: 800, color: '#FFD700', marginBottom: 8 }}>Nombres</h4>
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
            <h4 style={{ fontSize: 14, fontWeight: 800, color: '#FFD700', marginBottom: 8 }}>Cartas que lo afectan</h4>
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
            <Btn onClick={() => setModal(null)} color="#333" style={{ color: '#aaa' }}>Cerrar</Btn>
          </Modal>
        );
      })()}

      {/* Negación window modal */}
      {pendingNeg && pendingNeg.eligibleIdxs.includes(HI) && !(HI in (pendingNeg.responses || {})) && (
        <Modal title="🚫 ¿Negación?">
          <p style={{ marginBottom: 8, fontSize: 14 }}>
            <strong>{players[pendingNeg.actingIdx]?.name}</strong> jugó{' '}
            <strong>{pendingNeg.cardInfo?.emoji} {pendingNeg.cardInfo?.name}</strong>
          </p>
          <p style={{ color: '#aaa', fontSize: 12, marginBottom: 16 }}>
            ¿Quieres gastar una carta de Negación para cancelar esta acción?
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Btn onClick={() => respondNegation(true)} color="#c0392b">🚫 Negar</Btn>
            <Btn onClick={() => respondNegation(false)} color="#27ae60">✅ Dejar pasar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
