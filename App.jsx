import React, { useState, useEffect, useRef, useCallback } from 'react';
import socket from './src/socket.js';
import {
  LANGUAGES, LANG_BORDER, LANG_BG, LANG_TEXT, LANG_SHORT,
  ING_EMOJI, ING_BG, FRUITS_VEGS, AI_NAMES, getIngName, getActionInfo,
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
import { HatBadge, PercheroSVG } from './components/HatComponents';
import hamImg from './imagenes/hamburguesas/ham.png';
import HatSVG from './components/HatSVG';

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

function applyMass(players, discard, actionId) {
  const ps = clone(players);
  let di = [...discard];
  if (actionId === 'comecomodines') {
    ps.forEach(p => {
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
  ps.forEach(p => {
    const kept = [];
    p.table.forEach(ing => {
      if (targets.includes(ingKey(ing))) di.push({ type: 'ingredient', ingredient: ingKey(ing), id: `d${Date.now()}${Math.random()}` });
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
          <h1 style={{ fontSize: 30, fontWeight: 900, color: '#FFD700', letterSpacing: 1 }}>Políglota Hambriento</h1>
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
function OpponentCard({ player, index, color, isActive }) {
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
            return (
              <div key={i} style={{
                width: 22, height: 22, borderRadius: 5, background: ING_BG[base],
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
              }}>
                {ING_IMG[base]
                  ? <img src={ING_IMG[base]} alt={base} style={{ width: 16, height: 16, objectFit: 'contain' }} />
                  : ING_EMOJI[base]}
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
  const aiRunning = useRef(false);

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
      setModal(state.modal || null);
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
      socket.emit('syncState', {
        code: roomCode,
        state: { players, deck, discard, cp, log, extraPlay, modal, pendingNeg, winner, phase },
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
  function startNegCheck(actingIdx, card, resolveCallback) {
    const pls = playersRef.current;
    // Find players who can negate (opponents with a negación card in hand)
    const eligible = pls.map((_, i) => i).filter(i =>
      i !== actingIdx && pls[i].hand.some(c => c.action === 'negacion')
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
              addLog(idx, `jugó 🌭 Comodín como ${ING_EMOJI[action.ingredient]} ${action.ingredient}`, pls);
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
                const r = applyMass(fp, fd, card.action);
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
              });
              return;

            } else if (type === 'playCambioSombrero') {
              const card = pls[idx].hand[action.cardIdx];
              if (!card) return;
              pls[idx].hand.splice(action.cardIdx, 1);
              di = [...di, card];
              const hi = pls[idx].perchero.indexOf(action.hatLang);
              if (hi !== -1) pls[idx].perchero.splice(hi, 1);
              pls[idx].mainHats.unshift(action.hatLang);
              addLog(idx, `cambió sombrero a ${action.hatLang} — puede jugar una carta`, pls);
              setPlayers(pls); setDiscard(di); setExtraPlay(true);

            } else if (type === 'playBasurero') {
              const card = pls[idx].hand[action.cardIdx];
              if (!card) return;
              pls[idx].hand.splice(action.cardIdx, 1);
              di = [...di, card];
              const found = di.find(c => c.id === action.pickedCardId);
              if (found) {
                di = di.filter(c => c.id !== action.pickedCardId);
                pls[idx].hand.push(found);
                addLog(idx, `rescató ${ING_EMOJI[found.ingredient]} del basurero`, pls);
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
              const cost = Math.ceil(p.hand.length / 2);
              const discarded = p.hand.splice(0, cost);
              di = [...di, ...discarded];
              addLog(idx, `cambió sombrero a ${action.hatLang} (descartó ${cost} cartas)`, pls);
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
      newPls[idx].table.push(card.ingredient);
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
        const r = applyMass(newPls, newDiscard, card.action);
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
        addLog(idx, `intercambió mesa con ${pls[richest].name}`, newPls);
      } else if (card.action === 'cambio_sombrero') {
        if (newPls[idx].perchero.length > 0) {
          // Pick hat that helps most (matches needed ingredient language)
          const burger = newPls[idx].burgers[newPls[idx].currentBurger];
          const needed = burger ? burger.filter(ing => !newPls[idx].table.includes(ing)) : [];
          const newHat = newPls[idx].perchero.shift();
          newPls[idx].mainHats.unshift(newHat);
          addLog(idx, `cambió sombrero a ${newHat}`, newPls);
          // Then try to play an ingredient with the new hat
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
      if (players[HI].perchero.length === 0) { alert('No tienes sombreros en el perchero'); return; }
      setModal({ type: 'cambio_sombrero', cardIdx });
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

    if (card.action === 'negacion') {
      alert('Negación se juega automáticamente cuando un oponente juega una acción.');
      return;
    }

    setSelectedIdx(null);
    addLog(HI, `jugó ${info.name} ${info.emoji}`, players);

    // Check negation before resolving — card stays in hand during the check
    startNegCheck(HI, card, () => {
      // Use refs for fresh state (callback may be async)
      const pls = playersRef.current;
      const dk  = deckRef.current;
      const di  = discardRef.current;

      if (mass.includes(card.action)) {
        const newPls = clone(pls);
        const ci = newPls[HI].hand.findIndex(c => c.id === card.id);
        if (ci !== -1) newPls[HI].hand.splice(ci, 1);
        const newDiscard = [...di, card];
        const { players: ps2, discard: di2 } = applyMass(newPls, newDiscard, card.action);
        endTurn(ps2, dk, di2, HI);

      } else if (card.action === 'cambio_sombrero') {
        if (pls[HI].perchero.length === 0) return;
        setModal({ type: 'cambio_sombrero', cardIdx });

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

      } else if (['tenedor', 'ladron', 'intercambio_sombreros', 'intercambio_hamburguesa', 'gloton'].includes(card.action)) {
        setModal({ type: 'pickTarget', cardIdx, action: card.action });
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
    addLog(HI, `jugó 🌭 Comodín como ${ING_EMOJI[chosenIng]} ${chosenIng} (${LANG_SHORT[card.language]})`, players);
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
    const newPls = clone(players);
    newPls[HI].hand.splice(cardIdx, 1);
    let newDiscard = [...discard, card];

    if (action === 'gloton') {
      newPls[targetIdx].table.forEach(ing => newDiscard.push({ type: 'ingredient', ingredient: ingKey(ing), id: `g${Date.now()}` }));
      newPls[targetIdx].table = [];
      endTurn(newPls, deck, newDiscard, HI);

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
            endTurn(newPls, deck, newDiscard, HI);
          } else if (newPls[targetIdx].isRemote) {
            // Remote victim: broadcast modal state, wait for their response
            setModal({ type: 'pickHatReplace', newPls, newDiscard, victimIdx: targetIdx, fromIdx: HI });
            setPlayers(newPls); setDiscard(newDiscard);
          } else {
            setModal({ type: 'pickHatReplace', newPls, newDiscard, victimIdx: targetIdx });
          }
          return;
        }
      }
      endTurn(newPls, deck, newDiscard, HI);

    } else if (action === 'intercambio_sombreros') {
      if (newPls[HI].mainHats[0] && newPls[targetIdx].mainHats[0]) {
        const tmp = newPls[HI].mainHats[0];
        newPls[HI].mainHats[0] = newPls[targetIdx].mainHats[0];
        newPls[targetIdx].mainHats[0] = tmp;
      }
      endTurn(newPls, deck, newDiscard, HI);

    } else if (action === 'intercambio_hamburguesa') {
      const tmp = newPls[HI].table;
      newPls[HI].table = newPls[targetIdx].table;
      newPls[targetIdx].table = tmp;
      endTurn(newPls, deck, newDiscard, HI);
    }
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

  function resolveCambioSombrero(hatLang) {
    const { cardIdx } = modal;
    setModal(null); setSelectedIdx(null);
    if (isOnline && !isHost) {
      socket.emit('playerAction', { code: roomCode, action: { type: 'playCambioSombrero', cardIdx, hatLang } });
      return;
    }
    const card = players[HI].hand[cardIdx];
    const newPls = clone(players);
    newPls[HI].hand.splice(cardIdx, 1);
    let newDiscard = [...discard, card];
    const hi = newPls[HI].perchero.indexOf(hatLang);
    newPls[HI].perchero.splice(hi, 1);
    newPls[HI].mainHats.unshift(hatLang);
    addLog(HI, `cambió sombrero a ${hatLang} — puede jugar una carta`, newPls);
    setPlayers(newPls); setDiscard(newDiscard); setExtraPlay(true);
  }

  // Manual: swap main hat from perchero (costs half your hand)
  function resolveManualCambiar(hatLang) {
    setModal(null); setSelectedIdx(null);
    if (isOnline && !isHost) {
      socket.emit('playerAction', { code: roomCode, action: { type: 'manualCambiar', hatLang } });
      return;
    }
    const newPls = clone(players);
    const p = newPls[HI];
    const hi = p.perchero.indexOf(hatLang);
    p.perchero.splice(hi, 1);
    const oldMain = p.mainHats[0];
    p.mainHats[0] = hatLang;
    p.perchero.push(oldMain);
    const cost = Math.ceil(p.hand.length / 2);
    const discarded = p.hand.splice(0, cost);
    let newDiscard = [...discard, ...discarded];
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
      addLog(HI, `rescató ${ING_EMOJI[found.ingredient]} del basurero`, newPls);
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

  // ── Panel: Mesa (center) ──
  const mesaPanel = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: isMobile ? 'auto' : 'hidden', padding: '12px 16px', gap: 10 }}>

      {/* Player header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(255,215,0,.06)', borderRadius: 12, padding: '8px 14px',
        border: '2px solid rgba(255,215,0,.2)', flexShrink: 0,
      }}>
        <HatSVG lang={human.mainHats[0] || LANGUAGES[0]} size={32} />
        <div>
          <div style={{ fontWeight: 900, fontSize: 16, color: humanColor }}>{human.name}</div>
          <div style={{ fontSize: 11, color: '#777' }}>
            🍔 {human.currentBurger}/{human.totalBurgers} hamburguesas
            {extraPlay && <span style={{ color: '#FFD700', marginLeft: 8 }}>⚡ Turno extra!</span>}
          </div>
        </div>
        {/* Main hats */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {human.mainHats.map(h => <HatBadge key={h} lang={h} isMain size="md" />)}
        </div>
      </div>

      {/* Burger targets */}
      <div style={{
        background: 'rgba(255,255,255,.03)', borderRadius: 10, padding: '8px 10px',
        border: '2px solid #1e2a45', flexShrink: 0,
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#555', letterSpacing: 1, marginBottom: 6 }}>HAMBURGUESAS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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

      {/* Table */}
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
              <div key={i} style={{
                width: 36, height: 36, borderRadius: 8,
                background: chosen
                  ? `linear-gradient(to right, ${ING_BG.perrito || '#9b59b6'} 50%, ${ING_BG[chosen]} 50%)`
                  : ING_BG[base],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, boxShadow: '0 2px 6px rgba(0,0,0,.3)',
                overflow: 'hidden', position: 'relative',
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

      {/* Perchero */}
      <div style={{
        background: 'rgba(255,255,255,.02)', borderRadius: 10, padding: '6px 10px',
        border: '2px solid #1e2a45', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#555', letterSpacing: 1 }}>
            PERCHERO
          </div>
          {isHumanTurn && !extraPlay && human.perchero.length > 0 && (
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => setModal({ type: 'manual_cambiar' })}
                title="Cambia tu sombrero principal (cuesta descartar la mitad de tu mano)"
                style={{
                  padding: '2px 7px', borderRadius: 6, border: '1px solid rgba(156,39,176,0.3)',
                  background: 'rgba(156,39,176,0.12)', color: '#BA68C8', fontSize: 10,
                  fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                🎩 Cambiar
              </button>
              {human.hand.length > 0 && (
                <button
                  onClick={() => setModal({ type: 'manual_agregar' })}
                  title="Agrega un sombrero extra (descarta toda tu mano, mano máx se reduce)"
                  style={{
                    padding: '2px 7px', borderRadius: 6, border: '1px solid rgba(156,39,176,0.3)',
                    background: 'rgba(156,39,176,0.12)', color: '#BA68C8', fontSize: 10,
                    fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  ➕ Agregar
                </button>
              )}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {human.perchero.map(h => <HatBadge key={h} lang={h} isMain={false} size="sm" />)}
        </div>
      </div>

      {/* Spacer (desktop only) */}
      {!isMobile && <div style={{ flex: 1 }} />}

      {/* Action buttons */}
      {isHumanTurn && (
        <div style={{
          display: 'flex', gap: 8, flexShrink: 0, padding: '6px 0',
        }}>
          <Btn
            onClick={humanPlay}
            disabled={selectedIdx === null}
            color="#4CAF50"
            style={{ flex: 1 }}
          >
            ▶ Jugar carta
          </Btn>
          <Btn
            onClick={humanDiscard}
            disabled={selectedIdx === null || extraPlay}
            color="#FF7043"
            style={{ flex: 1 }}
          >
            🗑 Descartar
          </Btn>
          {extraPlay && (
            <Btn onClick={() => {
              if (isOnline && !isHost) {
                socket.emit('playerAction', { code: roomCode, action: { type: 'passTurn' } });
              } else {
                setExtraPlay(false); endTurn(players, deck, discard, HI);
              }
            }} color="#888" style={{ flex: 1 }}>
              ⏭ Pasar turno
            </Btn>
          )}
        </div>
      )}

      {!isHumanTurn && (
        <div style={{
          textAlign: 'center', color: '#555', fontSize: 13, padding: '8px 0', flexShrink: 0,
        }}>
          {players[cp]?.isRemote ? `🌐 Esperando la jugada de ${players[cp]?.name}...` : `⏳ Esperando a ${players[cp]?.name}...`}
        </div>
      )}
    </div>
  );

  // ── Panel: Mano (right sidebar) ──
  const handN = human.hand.length;
  const MAX_ANGLE = isMobile ? 12 : 14;
  const OVERLAP = isMobile ? 20 : 18;
  const manoPanel = (
    <div style={{
      ...(isMobile
        ? { flex: 1, overflow: 'visible', padding: '8px 10px 0', display: 'flex', flexDirection: 'column', gap: 6 }
        : { width: 'clamp(260px, 30vw, 420px)', flexShrink: 0, background: '#12192e', borderLeft: '2px solid #1e2a45', display: 'flex', flexDirection: 'column', padding: '10px 10px 0', gap: 6, overflowY: 'visible', overflowX: 'hidden' }
      ),
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#555', letterSpacing: 1, flexShrink: 0 }}>
        MANO ({human.hand.length}/{human.maxHand})
      </div>

      {/* Fan hand layout */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingTop: 40,
        paddingBottom: 16,
        flex: 1,
        overflow: 'visible',
      }}>
        {human.hand.map((card, i) => {
          const playable = card.type === 'ingredient' ? canPlayCard(human, card) : null;
          const angle = handN > 1 ? -MAX_ANGLE + i * (2 * MAX_ANGLE / (handN - 1)) : 0;
          const isSelected = selectedIdx === i;
          return (
            <div
              key={card.id}
              onClick={() => isHumanTurn ? setSelectedIdx(isSelected ? null : i) : null}
              onMouseEnter={e => { if (!isSelected && isHumanTurn) e.currentTarget.style.transform = `translateY(-14px) rotate(${angle * 0.4}deg)`; }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.transform = `translateY(0px) rotate(${angle}deg)`; }}
              style={{
                cursor: isHumanTurn ? 'pointer' : 'default',
                marginLeft: i === 0 ? 0 : -OVERLAP,
                transform: isSelected ? 'translateY(-28px) rotate(0deg)' : `translateY(0px) rotate(${angle}deg)`,
                transformOrigin: 'bottom center',
                transition: 'transform 0.15s',
                zIndex: isSelected ? handN + 1 : i,
                position: 'relative',
              }}
            >
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

      {isHumanTurn && selectedIdx !== null && (
        <div style={{
          flexShrink: 0, padding: '8px 10px', borderRadius: 8, marginBottom: 8,
          background: 'rgba(255,255,255,.04)', border: '1px solid #2a2a4a',
          fontSize: 11, color: '#aaa',
        }}>
          {human.hand[selectedIdx]?.type === 'ingredient' ? (
            canPlayCard(human, human.hand[selectedIdx])
              ? <span style={{ color: '#4CAF50' }}>✅ Puedes jugar esta carta</span>
              : <span style={{ color: '#FF7043' }}>❌ No puedes jugar esta carta ahora (sombrero o ingrediente no necesario)</span>
          ) : (
            <span style={{ color: '#FFD700' }}>⚡ {getActionInfo(human.hand[selectedIdx]?.action)?.desc}</span>
          )}
        </div>
      )}
    </div>
  );

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
        {!isMobile && <span style={{ fontWeight: 900, fontSize: 16, color: '#FFD700' }}>Políglota Hambriento</span>}
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
          {mobileTab === 'mano' && manoPanel}
          {mobileTab === 'rivales' && rivalesPanel}

          {/* Mobile tab bar */}
          <div style={{ display: 'flex', flexShrink: 0, background: '#16213e', borderTop: '2px solid #2a2a4a' }}>
            {[
              { id: 'mesa', label: '🍔 Mesa', notify: isHumanTurn },
              { id: 'mano', label: `🃏 Mano (${human.hand.length})` },
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
        <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden', position: 'relative' }}>
          {rivalesPanel}
          {mesaPanel}
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'visible', zIndex: 10 }}>
            {manoPanel}
          </div>
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

      {/* Cambio Sombrero */}
      {modal?.type === 'cambio_sombrero' && (
        <Modal title="👒 Cambio Sombrero — Elige nuevo sombrero principal">
          <p style={{ color: '#888', fontSize: 12, marginBottom: 12 }}>
            Elige un sombrero del perchero. Luego podrás jugar una carta adicional.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {human.perchero.map(h => (
              <div
                key={h}
                onClick={() => resolveCambioSombrero(h)}
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

      {/* Manual: Cambiar sombrero */}
      {modal?.type === 'manual_cambiar' && (
        <Modal title="🎩 Cambiar Sombrero — cuesta la mitad de tu mano">
          <p style={{ color: '#888', fontSize: 12, marginBottom: 12 }}>
            Elige un sombrero del perchero. Tu sombrero actual vuelve al perchero y descartás {Math.ceil(human.hand.length / 2)} carta{Math.ceil(human.hand.length / 2) !== 1 ? 's' : ''}. Luego podés jugar una carta extra.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {human.perchero.map(h => (
              <div
                key={h}
                onClick={() => resolveManualCambiar(h)}
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
        const human = players[0];
        const burger = human.burgers[human.currentBurger] || [];
        const needed = burger.filter(ing => !human.table.includes(ing));
        const choices = needed.length > 0 ? needed : Object.keys(ING_EMOJI).filter(i => i !== 'perrito');
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
