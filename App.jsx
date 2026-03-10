import React, { useState, useEffect, useRef } from 'react';
import {
  LANGUAGES, LANG_BORDER, LANG_BG, LANG_TEXT, LANG_SHORT,
  ING_EMOJI, ING_BG, FRUITS_VEGS, AI_NAMES, getIngName, getActionInfo,
} from './constants';
import { generateDeck, initPlayer, canPlayCard, checkBurgerComplete } from './game';
import { shuffle, randInt } from './game/utils';
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
const ING_IMG = {
  pan: ingPan, lechuga: ingLechuga, tomate: ingTomate, carne: ingCarne,
  queso: ingQueso, pollo: ingPollo, huevo: ingHuevo, cebolla: ingCebolla,
  palta: ingPalta,
};
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
  const targets = {
    milanesa: ['pan', 'huevo'], ensalada: FRUITS_VEGS,
    pizza: ['queso'], parrilla: ['pollo', 'carne'],
  }[actionId] || [];
  const ps = clone(players);
  let di = [...discard];
  ps.forEach(p => {
    const kept = [];
    p.table.forEach(ing => {
      if (targets.includes(ing)) di.push({ type: 'ingredient', ingredient: ing, id: `d${Date.now()}${Math.random()}` });
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
function SetupScreen({ onStart }) {
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
    }}>
      <div style={{
        background: '#16213e', borderRadius: 20, padding: '36px 40px', maxWidth: 520, width: '90vw',
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

        <Btn
          onClick={() => onStart(name.trim(), hat, diff, aiCount)}
          disabled={!name.trim() || !hat}
          color="#FFD700"
          style={{ width: '100%', fontSize: 16, padding: '12px 0' }}
        >
          🎮 ¡Jugar!
        </Btn>
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
          {player.table.map((ing, i) => (
            <div key={i} style={{
              width: 22, height: 22, borderRadius: 5, background: ING_BG[ing],
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
            }}>
              {ING_IMG[ing]
                ? <img src={ING_IMG[ing]} alt={ing} style={{ width: 16, height: 16, objectFit: 'contain' }} />
                : ING_EMOJI[ing]}
            </div>
          ))}
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

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [phase, setPhase] = useState('setup');
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
  const aiRunning = useRef(false);

  function addLog(playerIdx, text, pls) {
    const p = pls ? pls[playerIdx] : null;
    const color = PLAYER_COLORS[playerIdx % PLAYER_COLORS.length];
    setLog(prev => [{ player: p ? p.name : '', text, color }, ...prev].slice(0, 40));
  }

  // ── Start game ──
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
    setPlayers(ps);
    setDeck(deckArr);
    setDiscard([]);
    setCp(0);
    setLog([]);
    setSelectedIdx(null);
    setModal(null);
    setWinner(null);
    setExtraPlay(false);
    aiRunning.current = false;
    setPhase('playing');
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
    if (nextIdx === 0) {
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
      if (done) { freed.forEach(ing => newDiscard.push({ type: 'ingredient', ingredient: ing, id: `f${Date.now()}${Math.random()}` })); addLog(idx, '¡completó una hamburguesa! 🎉', newPls); }
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

      const mass = ['milanesa', 'ensalada', 'pizza', 'parrilla'];
      if (mass.includes(card.action)) {
        const r = applyMass(newPls, newDiscard, card.action);
        newPls = r.players; newDiscard = r.discard;
      } else if (card.action === 'gloton') {
        newPls[richest].table.forEach(ing => newDiscard.push({ type: 'ingredient', ingredient: ing, id: `g${Date.now()}${Math.random()}` }));
        newPls[richest].table = [];
        addLog(idx, `vació la mesa de ${pls[richest].name}`, newPls);
      } else if (card.action === 'tenedor') {
        if (newPls[richest].table.length > 0) {
          const si = randInt(0, newPls[richest].table.length - 1);
          const stolen = newPls[richest].table.splice(si, 1)[0];
          newPls[idx].table.push(stolen);
          const { player: up2, freed: fr2, done: dn2 } = advanceBurger(newPls[idx]);
          newPls[idx] = up2;
          if (dn2) { fr2.forEach(ing => newDiscard.push({ type: 'ingredient', ingredient: ing, id: `t${Date.now()}${Math.random()}` })); }
          addLog(idx, `robó ${ING_EMOJI[stolen]} de ${pls[richest].name}`, newPls);
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
            if (dn3) { fr3.forEach(ing => newDiscard.push({ type: 'ingredient', ingredient: ing, id: `c${Date.now()}${Math.random()}` })); addLog(idx, '¡completó una hamburguesa! 🎉', newPls); }
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
    const human = players[0];
    const card = human.hand[selectedIdx];

    if (card.type === 'ingredient') {
      if (!canPlayCard(human, card)) return;
      addLog(0, `jugó ${getIngName(card.ingredient, card.language)} ${ING_EMOJI[card.ingredient]}`, players);
      const newPls = clone(players);
      newPls[0].hand.splice(selectedIdx, 1);
      newPls[0].table.push(card.ingredient);
      const { player: up, freed, done } = advanceBurger(newPls[0]);
      newPls[0] = up;
      let newDiscard = [...discard, card];
      if (done) {
        freed.forEach(ing => newDiscard.push({ type: 'ingredient', ingredient: ing, id: `f${Date.now()}${Math.random()}` }));
        addLog(0, '¡completó una hamburguesa! 🎉', newPls);
      }
      setSelectedIdx(null);
      setExtraPlay(false);
      endTurn(newPls, deck, newDiscard, 0);

    } else if (card.type === 'action') {
      humanPlayAction(card, selectedIdx);
    }
  }

  function humanPlayAction(card, cardIdx) {
    const info = getActionInfo(card.action);
    const mass = ['milanesa', 'ensalada', 'pizza', 'parrilla'];

    if (mass.includes(card.action)) {
      addLog(0, `jugó ${info.name} ${info.emoji}`, players);
      const newPls = clone(players);
      newPls[0].hand.splice(cardIdx, 1);
      let newDiscard = [...discard, card];
      const { players: ps2, discard: di2 } = applyMass(newPls, newDiscard, card.action);
      setSelectedIdx(null);
      endTurn(ps2, deck, di2, 0);

    } else if (card.action === 'cambio_sombrero') {
      if (players[0].perchero.length === 0) { alert('No tienes sombreros en el perchero'); return; }
      setModal({ type: 'cambio_sombrero', cardIdx });

    } else if (card.action === 'basurero') {
      const ingCards = discard.filter(c => c.type === 'ingredient');
      if (ingCards.length === 0) { alert('El basurero está vacío'); return; }
      setModal({ type: 'basurero', cardIdx, cards: ingCards });

    } else if (['tenedor', 'ladron', 'intercambio_sombreros', 'intercambio_hamburguesa', 'gloton'].includes(card.action)) {
      setModal({ type: 'pickTarget', cardIdx, action: card.action });

    } else if (card.action === 'negacion') {
      alert('Negación se juega en respuesta a una acción enemiga');
    }
  }

  function humanDiscard() {
    if (selectedIdx === null) return;
    const card = players[0].hand[selectedIdx];
    addLog(0, `descartó ${card.type === 'ingredient' ? getIngName(card.ingredient, card.language) : getActionInfo(card.action).name}`, players);
    const newPls = clone(players);
    const discarded = newPls[0].hand.splice(selectedIdx, 1)[0];
    setSelectedIdx(null);
    endTurn(newPls, deck, [...discard, discarded], 0);
  }

  function confirmWildcard(chosenIng) {
    const { cardIdx } = modal;
    const card = players[0].hand[cardIdx];
    addLog(0, `jugó 🌭 Comodín como ${ING_EMOJI[chosenIng]} ${chosenIng} (${LANG_SHORT[card.language]})`, players);
    const newPls = clone(players);
    newPls[0].hand.splice(cardIdx, 1);
    newPls[0].table.push(chosenIng);
    const { player: up, freed, done } = advanceBurger(newPls[0]);
    newPls[0] = up;
    let newDiscard = [...discard, card];
    if (done) {
      freed.forEach(ing => newDiscard.push({ type: 'ingredient', ingredient: ing, id: `f${Date.now()}${Math.random()}` }));
      addLog(0, '¡completó una hamburguesa! 🎉', newPls);
    }
    setModal(null); setSelectedIdx(null); setExtraPlay(false);
    endTurn(newPls, deck, newDiscard, 0);
  }

  // ── Modal resolvers ──
  function resolvePickTarget(targetIdx) {
    const { cardIdx, action } = modal;
    const card = players[0].hand[cardIdx];
    const info = getActionInfo(action);
    addLog(0, `jugó ${info.name} ${info.emoji} contra ${players[targetIdx].name}`, players);
    const newPls = clone(players);
    newPls[0].hand.splice(cardIdx, 1);
    let newDiscard = [...discard, card];

    if (action === 'gloton') {
      newPls[targetIdx].table.forEach(ing => newDiscard.push({ type: 'ingredient', ingredient: ing, id: `g${Date.now()}` }));
      newPls[targetIdx].table = [];
      setModal(null); setSelectedIdx(null); endTurn(newPls, deck, newDiscard, 0);

    } else if (action === 'tenedor') {
      if (newPls[targetIdx].table.length === 0) { setModal(null); return; }
      setModal({ type: 'pickIngredient', targetIdx, newPls, newDiscard });

    } else if (action === 'ladron') {
      if (newPls[targetIdx].mainHats.length === 0) { setModal(null); return; }
      const stolen = newPls[targetIdx].mainHats.splice(0, 1)[0];
      newPls[0].mainHats.push(stolen);
      addLog(0, `robó el sombrero ${stolen}`, newPls);
      if (newPls[targetIdx].mainHats.length === 0) {
        if (newPls[targetIdx].perchero.length > 0) {
          if (newPls[targetIdx].isAI) {
            const nh = newPls[targetIdx].perchero.shift();
            newPls[targetIdx].mainHats.push(nh);
            setModal(null); setSelectedIdx(null); endTurn(newPls, deck, newDiscard, 0);
          } else {
            setModal({ type: 'pickHatReplace', newPls, newDiscard, victimIdx: targetIdx });
          }
          return;
        }
      }
      setModal(null); setSelectedIdx(null); endTurn(newPls, deck, newDiscard, 0);

    } else if (action === 'intercambio_sombreros') {
      if (newPls[0].mainHats[0] && newPls[targetIdx].mainHats[0]) {
        const tmp = newPls[0].mainHats[0];
        newPls[0].mainHats[0] = newPls[targetIdx].mainHats[0];
        newPls[targetIdx].mainHats[0] = tmp;
      }
      setModal(null); setSelectedIdx(null); endTurn(newPls, deck, newDiscard, 0);

    } else if (action === 'intercambio_hamburguesa') {
      const tmp = newPls[0].table;
      newPls[0].table = newPls[targetIdx].table;
      newPls[targetIdx].table = tmp;
      setModal(null); setSelectedIdx(null); endTurn(newPls, deck, newDiscard, 0);
    }
  }

  function resolvePickIngredient(ingIdx) {
    const { targetIdx, newPls, newDiscard } = modal;
    const stolen = newPls[targetIdx].table.splice(ingIdx, 1)[0];
    newPls[0].table.push(stolen);
    const { player: up, freed, done } = advanceBurger(newPls[0]);
    newPls[0] = up;
    let fd = newDiscard;
    if (done) { freed.forEach(ing => fd = [...fd, { type: 'ingredient', ingredient: ing, id: `t${Date.now()}` }]); addLog(0, '¡completó una hamburguesa! 🎉', newPls); }
    setModal(null); setSelectedIdx(null); endTurn(newPls, deck, fd, 0);
  }

  function resolveHatReplace(hatLang) {
    const { newPls, newDiscard, victimIdx } = modal;
    const hi = newPls[victimIdx].perchero.indexOf(hatLang);
    newPls[victimIdx].perchero.splice(hi, 1);
    newPls[victimIdx].mainHats.push(hatLang);
    setModal(null); setSelectedIdx(null); endTurn(newPls, deck, newDiscard, 0);
  }

  function resolveCambioSombrero(hatLang) {
    const { cardIdx } = modal;
    const card = players[0].hand[cardIdx];
    const newPls = clone(players);
    newPls[0].hand.splice(cardIdx, 1);
    let newDiscard = [...discard, card];
    const hi = newPls[0].perchero.indexOf(hatLang);
    newPls[0].perchero.splice(hi, 1);
    newPls[0].mainHats.unshift(hatLang);
    addLog(0, `cambió sombrero a ${hatLang} — puede jugar una carta`, newPls);
    setModal(null); setSelectedIdx(null);
    setPlayers(newPls); setDiscard(newDiscard); setExtraPlay(true);
  }

  // Manual: swap main hat from perchero (costs half your hand)
  function resolveManualCambiar(hatLang) {
    const newPls = clone(players);
    const p = newPls[0];
    const hi = p.perchero.indexOf(hatLang);
    p.perchero.splice(hi, 1);
    const oldMain = p.mainHats[0];
    p.mainHats[0] = hatLang;
    p.perchero.push(oldMain);
    // Cost: discard half the hand (rounded up)
    const cost = Math.ceil(p.hand.length / 2);
    const discarded = p.hand.splice(0, cost);
    let newDiscard = [...discard, ...discarded];
    addLog(0, `cambió sombrero a ${hatLang} (descartó ${cost} carta${cost !== 1 ? 's' : ''}) — puede jugar una carta`, newPls);
    setModal(null); setSelectedIdx(null);
    setPlayers(newPls); setDiscard(newDiscard); setExtraPlay(true);
  }

  // Manual: add an extra hat from perchero (costs discarding entire hand, reduces maxHand)
  function resolveManualAgregar(hatLang) {
    const newPls = clone(players);
    const p = newPls[0];
    const hi = p.perchero.indexOf(hatLang);
    p.perchero.splice(hi, 1);
    p.mainHats.push(hatLang);
    // Cost: discard entire hand and reduce maxHand
    let newDiscard = [...discard, ...p.hand];
    p.hand = [];
    p.maxHand = Math.max(1, p.maxHand - 1);
    // Refill at new maxHand
    const { drawn, deck: newDeck, discard: di2 } = drawN(deck, newDiscard, p.maxHand);
    p.hand = drawn;
    addLog(0, `agregó sombrero ${hatLang} — mano máx reducida a ${p.maxHand}`, newPls);
    setModal(null); setSelectedIdx(null);
    setPlayers(newPls); setDeck(newDeck); setDiscard(di2); setExtraPlay(true);
  }

  function resolveBasurero(cardId) {
    const { cardIdx } = modal;
    const actionCard = players[0].hand[cardIdx];
    const newPls = clone(players);
    newPls[0].hand.splice(cardIdx, 1);
    let newDiscard = [...discard, actionCard];
    const found = newDiscard.find(c => c.id === cardId);
    if (found) {
      newDiscard = newDiscard.filter(c => c.id !== cardId);
      newPls[0].hand.push(found);
      addLog(0, `rescató ${ING_EMOJI[found.ingredient]} del basurero`, newPls);
    }
    setModal(null); setSelectedIdx(null); endTurn(newPls, deck, newDiscard, 0);
  }

  // ── Render phases ──
  if (phase === 'setup') return <SetupScreen onStart={startGame} />;
  if (phase === 'transition') return <TransitionScreen player={players[0]} onContinue={() => setPhase('playing')} />;
  if (phase === 'gameover') return <GameOverScreen winner={winner} players={players} onRestart={() => setPhase('setup')} />;
  if (!players.length) return null;

  // ── Playing screen ──
  const human = players[0];
  const opponents = players.slice(1);
  const isHumanTurn = cp === 0;
  const burger = human.burgers[human.currentBurger];
  const humanColor = PLAYER_COLORS[0];

  // Card playability
  const getPlayable = (card, idx) => {
    if (!isHumanTurn || extraPlay) {
      if (card.type !== 'ingredient') return null;
    }
    if (card.type === 'ingredient') return canPlayCard(human, card) ? true : false;
    return null; // action cards always selectable
  };

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: '#0f1117', fontFamily: "'Fredoka',sans-serif", overflow: 'hidden',
    }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px',
        background: '#16213e', borderBottom: '2px solid #2a2a4a', flexShrink: 0,
      }}>
        <span style={{ fontSize: 22 }}>🍔</span>
        <span style={{ fontWeight: 900, fontSize: 16, color: '#FFD700' }}>Políglota Hambriento</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#555' }}>🃏 {deck.length}</span>
          <span style={{ fontSize: 12, color: '#555' }}>🗑️ {discard.length}</span>
          <div style={{
            background: cp === 0 ? 'rgba(255,215,0,.15)' : 'rgba(0,188,212,.15)',
            border: `1px solid ${cp === 0 ? '#FFD700' : '#00BCD4'}`,
            borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 700,
            color: cp === 0 ? '#FFD700' : '#00BCD4',
          }}>
            {cp === 0 ? '🎴 Tu turno' : `⏳ Turno de ${players[cp]?.name}`}
          </div>
          <Btn onClick={() => setShowLog(l => !l)} color="#2a2a4a" style={{ color: '#aaa', fontSize: 12, padding: '4px 10px' }}>
            📋 Log
          </Btn>
        </div>
      </div>

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden' }}>

        {/* Left: opponents + log */}
        <div style={{
          width: 220, flexShrink: 0, background: '#12192e', borderRight: '2px solid #1e2a45',
          overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#555', letterSpacing: 1, marginBottom: 4 }}>OPONENTES</div>
          {opponents.map((opp, i) => (
            <OpponentCard
              key={i}
              player={opp}
              index={i + 1}
              color={PLAYER_COLORS[(i + 1) % PLAYER_COLORS.length]}
              isActive={cp === i + 1}
            />
          ))}

          {/* Log panel */}
          {showLog && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#555', letterSpacing: 1, marginBottom: 6 }}>HISTORIAL</div>
              {log.length === 0 && <div style={{ fontSize: 11, color: '#444' }}>Sin eventos aún</div>}
              {log.map((e, i) => <LogEntry key={i} e={e} />)}
            </div>
          )}
        </div>

        {/* Center: human player area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '12px 16px', gap: 10 }}>

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
              {human.table.map((ing, i) => (
                <div key={i} style={{
                  width: 36, height: 36, borderRadius: 8, background: ING_BG[ing],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, boxShadow: '0 2px 6px rgba(0,0,0,.3)',
                }}>
                  {ING_IMG[ing]
                    ? <img src={ING_IMG[ing]} alt={ing} style={{ width: 26, height: 26, objectFit: 'contain' }} />
                    : ING_EMOJI[ing]}
                </div>
              ))}
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

          {/* Spacer */}
          <div style={{ flex: 1 }} />

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
                <Btn onClick={() => { setExtraPlay(false); endTurn(players, deck, discard, 0); }} color="#888" style={{ flex: 1 }}>
                  ⏭ Pasar turno
                </Btn>
              )}
            </div>
          )}

          {!isHumanTurn && (
            <div style={{
              textAlign: 'center', color: '#555', fontSize: 13, padding: '8px 0', flexShrink: 0,
            }}>
              ⏳ Esperando a {players[cp]?.name}...
            </div>
          )}
        </div>

        {/* Right: hand */}
        <div style={{
          width: 'clamp(200px, 28vw, 340px)', flexShrink: 0,
          background: '#12192e', borderLeft: '2px solid #1e2a45',
          display: 'flex', flexDirection: 'column', padding: '12px 10px', gap: 8,
          overflowY: 'auto',
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#555', letterSpacing: 1 }}>
            MANO ({human.hand.length}/{human.maxHand})
          </div>

          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center',
          }}>
            {human.hand.map((card, i) => {
              const playable = card.type === 'ingredient' ? canPlayCard(human, card) : null;
              return (
                <div
                  key={card.id}
                  onClick={() => isHumanTurn ? setSelectedIdx(selectedIdx === i ? null : i) : null}
                  style={{ cursor: isHumanTurn ? 'pointer' : 'default' }}
                >
                  <GameCard
                    card={card}
                    selected={selectedIdx === i}
                    playable={isHumanTurn ? playable : false}
                    small={false}
                  />
                </div>
              );
            })}
          </div>

          {isHumanTurn && selectedIdx !== null && (
            <div style={{
              marginTop: 8, padding: '8px 10px', borderRadius: 8,
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
      </div>

      {/* ── Modals ── */}

      {/* Pick Target */}
      {modal?.type === 'pickTarget' && (
        <Modal title={`${getActionInfo(modal.action)?.emoji} ${getActionInfo(modal.action)?.name} — Elige oponente`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {players.map((p, i) => {
              if (i === 0) return null;
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
                      Mesa: {p.table.map(ing => ING_EMOJI[ing]).join(' ') || 'vacía'} •
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
            {modal.newPls[modal.targetIdx].table.map((ing, i) => (
              <div
                key={i}
                onClick={() => resolvePickIngredient(i)}
                style={{
                  width: 54, height: 54, borderRadius: 10, background: ING_BG[ing],
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.4)',
                  transition: 'transform .1s',
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {ING_IMG[ing]
                  ? <img src={ING_IMG[ing]} alt={ing} style={{ width: 36, height: 36, objectFit: 'contain' }} />
                  : ING_EMOJI[ing]}
              </div>
            ))}
          </div>
          <Btn onClick={() => setModal(null)} color="#333" style={{ color: '#aaa' }}>Cancelar</Btn>
        </Modal>
      )}

      {/* Pick Hat Replace (after Ladrón steals last hat) */}
      {modal?.type === 'pickHatReplace' && (
        <Modal title="🎩 Elige nuevo sombrero principal">
          <p style={{ color: '#888', fontSize: 12, marginBottom: 12 }}>
            Tu sombrero principal fue robado. Elige uno del perchero.
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
    </div>
  );
}
