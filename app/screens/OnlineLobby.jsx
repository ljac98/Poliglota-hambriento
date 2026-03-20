import React, { useEffect, useMemo, useRef, useState } from 'react';
import socket from '../../src/socket.js';
import { LANGUAGES, LANG_BORDER, LANG_BG, LANG_TEXT, INGREDIENTS, ING_BG, getIngName } from '../../constants/index.js';
import { getFriends, sendFriendRequest } from '../../src/api.js';
import { getUILang, KEY_TO_LANG } from '../../src/translations.js';
import { HatBadge, PercheroSVG } from '../../components/HatComponents.jsx';
import HatSVG from '../../components/HatSVG.jsx';
import { Btn } from '../components/Btn.jsx';
import { Modal } from '../components/Modal.jsx';
import { PLAYER_COLORS } from '../utils/gameHelpers.js';
import { ING_IMG } from '../utils/gameHelpers.js';
import { genBurger } from '../../game/deck.js';
import modoclon from '../../imagenes/modos/clones.png';
import modoescalera from '../../imagenes/modos/escalera.png';
import modocaotico from '../../imagenes/modos/caotico.png';
import percheroImg from '../../imagenes/sombreros/perchero/percherofinal.png';
import burgerPanArriba from '../../imagenes/hamburguesas/ingredientes/pan arriba.png';
import burgerPanAbajo from '../../imagenes/hamburguesas/ingredientes/pan abajo.png';
import burgerCarne from '../../imagenes/hamburguesas/ingredientes/carne.png';
import burgerQueso from '../../imagenes/hamburguesas/ingredientes/queso.png';
import burgerLechuga from '../../imagenes/hamburguesas/ingredientes/lechuga.png';
import burgerCebolla from '../../imagenes/hamburguesas/ingredientes/cebolla.png';
import burgerTomate from '../../imagenes/hamburguesas/ingredientes/tomates.png';
import burgerPollo from '../../imagenes/hamburguesas/ingredientes/pollo.png';
import burgerHuevo from '../../imagenes/hamburguesas/ingredientes/huevo.png';
import burgerPalta from '../../imagenes/hamburguesas/ingredientes/palta.png';

export function OnlineLobby({ roomCode, myName, isHost, players, onStart, onBack, isPublic, roomDisplayName, T, user }) {
  const uiGameLang = KEY_TO_LANG[getUILang()] || 'español';
  const cloneIngredients = INGREDIENTS.filter((ing) => ing !== 'pan');
  const [gameMode, setGameMode] = useState('clon');
  const [burgerCount, setBurgerCount] = useState(2);
  const [ingredientCount, setIngredientCount] = useState(5);
  const [ingredientPool, setIngredientPool] = useState(cloneIngredients);
  const [chaosLevel, setChaosLevel] = useState(2);
  const [showModeConfig, setShowModeConfig] = useState(false);
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
  const [isDesktopWide, setIsDesktopWide] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1280 : false));
  const uiKey = getUILang();
  const playerWord = ({
    es: 'Jugador',
    en: 'Player',
    fr: 'Joueur',
    it: 'Giocatore',
    de: 'Spieler',
    pt: 'Jogador',
  })[uiKey] || 'Player';
  useEffect(() => {
    const handleResize = () => setIsDesktopWide(window.innerWidth >= 1280);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    { id: 'clon', label: T('modeClon'), desc: T('modeClonDesc'),img:modoclon },
    { id: 'escalera', label: T('modeEscalera'), desc: T('modeEscaleraDesc'),img:modoescalera },
    { id: 'caotico', label: T('modeCaotico'), desc: T('modeCaoticoDesc'),img:modocaotico },
  ];
  const selectedMode = gameModes.find((mode) => mode.id === gameMode) || gameModes[0];
  const burgerLayerMap = {
    carne: burgerCarne,
    queso: burgerQueso,
    lechuga: burgerLechuga,
    cebolla: burgerCebolla,
    tomate: burgerTomate,
    pollo: burgerPollo,
    huevo: burgerHuevo,
    palta: burgerPalta,
  };
  const modePreview = (() => {
    if (gameMode === 'caotico') {
      if (chaosLevel === 1) return { burgers: '1-2', ingredients: '3-5', layerCount: 5 };
      if (chaosLevel === 3) return { burgers: '3-5', ingredients: '5-8', layerCount: 8 };
      return { burgers: '2-4', ingredients: '4-7', layerCount: 7 };
    }
    if (gameMode === 'escalera') {
      return { burgers: String(burgerCount), ingredients: `4-${3 + burgerCount}`, layerCount: 3 + burgerCount };
    }
    return { burgers: String(burgerCount), ingredients: String(ingredientCount), layerCount: ingredientCount };
  })();
  const previewBurgers = useMemo(() => {
    if (gameMode === 'clon') {
      return Array.from({ length: burgerCount }, () => genBurger(ingredientCount, ingredientPool));
    }
    if (gameMode === 'escalera') {
      return Array.from({ length: burgerCount }, (_, index) => genBurger(4 + index));
    }
    const ranges = chaosLevel === 1
      ? [3, 4]
      : chaosLevel === 3
        ? [5, 6, 7]
        : [4, 5, 6];
    return ranges.map((size) => genBurger(size));
  }, [gameMode, burgerCount, ingredientCount, chaosLevel, ingredientPool]);
  const staircasePreviewByPlayer = useMemo(
    () => Array.from(
      { length: Math.max(players.length, 1) },
      () => Array.from({ length: burgerCount }, (_, index) => genBurger(4 + index)),
    ),
    [players.length, burgerCount],
  );
  const markerStyle = {
    minWidth: 54,
    textAlign: 'center',
    fontSize: 10,
    color: '#8a8fa8',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 999,
    padding: '2px 7px',
    lineHeight: 1.2,
  };
  const compactBurgerWidth = 52;
  const compactLayerWidth = 44;
  const renderBurgerPreview = (burger, burgerIndex, opts = {}) => {
    const { hiddenIngredients = false, compact = false } = opts;
    const wrapperWidth = compact ? 64 : 92;
    const minHeight = compact ? 92 : 128;
    const topWidth = compact ? compactBurgerWidth : 70;
    const layerWidth = compact ? compactLayerWidth : 60;
    const badgeSize = compact ? 24 : 30;
    const badgeTop = compact ? 24 : 38;
    return (
      <div key={`preview-burger-${burgerIndex}`} style={{ position: 'relative', width: wrapperWidth, minHeight }}>
        <div style={{
          position: 'absolute',
          right: compact ? 0 : -2,
          top: badgeTop,
          minWidth: badgeSize,
          height: badgeSize,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FFD700',
          color: '#1b1730',
          fontSize: compact ? 10 : 12,
          fontWeight: 900,
          boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
        }}>
          {burgerIndex + 1}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src={burgerPanArriba} alt="pan" style={{ width: topWidth, height: 'auto', marginBottom: compact ? -4 : -6 }} />
          {burger.filter((ing) => ing !== 'pan').map((ing, index) => (
            hiddenIngredients ? (
              <div
                key={`${burgerIndex}-${ing}-${index}`}
                style={{
                  width: compact ? 38 : 54,
                  height: compact ? 22 : 30,
                  marginTop: compact ? -3 : -5,
                  marginBottom: compact ? -3 : -5,
                  borderRadius: 999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(180deg, #fff7c7 0%, #ffe270 100%)',
                  border: '2px solid #8a5b00',
                  color: '#5c3600',
                  fontSize: compact ? 18 : 22,
                  fontWeight: 900,
                  boxShadow: '0 4px 10px rgba(0,0,0,0.18)',
                }}
                aria-label="ingrediente oculto"
              >
                ?
              </div>
            ) : (
              <img
                key={`${burgerIndex}-${ing}-${index}`}
                src={burgerLayerMap[ing]}
                alt={ing}
                style={{ width: layerWidth, height: 'auto', marginTop: compact ? -5 : -7, marginBottom: compact ? -5 : -7 }}
              />
            )
          ))}
          <img src={burgerPanAbajo} alt="pan" style={{ width: topWidth, height: 'auto', marginTop: compact ? -4 : -6 }} />
        </div>
      </div>
    );
  };
  const renderEscaleraPlayers = (compact = false) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 8 : 12 }}>
      {staircasePreviewByPlayer.map((playerBurgers, playerIndex) => (
        <div
          key={`escalera-player-${playerIndex}`}
          style={{
            borderRadius: 12,
            padding: compact ? '8px 10px' : '10px 12px',
            background: compact ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ color: '#FFD700', fontSize: compact ? 11 : 12, fontWeight: 900, marginBottom: 6 }}>
            {players[playerIndex]?.name || `${playerWord} ${playerIndex + 1}`}
          </div>
          <div style={{ display: 'flex', gap: compact ? 8 : 12, flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: compact ? 'flex-start' : 'center' }}>
            {playerBurgers.map((burger, burgerIndex) => renderBurgerPreview(burger, burgerIndex, { compact }))}
          </div>
        </div>
      ))}
    </div>
  );
  const renderModeSummary = () => {
    if (gameMode === 'escalera') {
      return renderEscaleraPlayers(true);
    }
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
          <span style={{ color: '#FFD700', fontSize: 13, fontWeight: 900 }}>{T('burgerCount')}</span>
          <span style={{ color: '#fff1b3', fontSize: 14, fontWeight: 900 }}>{modePreview.burgers}</span>
        </div>
        <div style={{ color: '#9ea4be', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>
          {T('ingredientsLabelShort')}: <span style={{ color: '#fff1b3', fontWeight: 900 }}>{modePreview.ingredients}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'center' }}>
          {previewBurgers.map((burger, burgerIndex) => renderBurgerPreview(burger, burgerIndex, { hiddenIngredients: gameMode === 'caotico', compact: true }))}
        </div>
        {gameMode === 'clon' && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 10 }}>
            {ingredientPool.map((ing) => (
              <span
                key={`mode-summary-pool-${ing}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <img src={ING_IMG[ing]} alt={ing} style={{ width: 20, height: 20, objectFit: 'contain' }} />
              </span>
            ))}
          </div>
        )}
      </>
    );
  };
  const renderDesktopSidebar = () => (
    <div style={{ ...floatingCardStyle, marginTop: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
        <div>
          <div style={{ color: '#ffd24a', fontSize: 11, fontWeight: 900, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
            {T('yourLanguage')}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            minHeight: 74,
            padding: '10px 12px',
            borderRadius: 14,
            background: 'linear-gradient(180deg, rgba(255,215,0,0.12), rgba(255,255,255,0.04))',
            border: '1px solid rgba(255,215,0,0.18)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
            marginBottom: 10,
          }}>
            {myHat ? <HatSVG lang={myHat} size={38} /> : <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />}
            <div style={{ minWidth: 0 }}>
              <div style={{ color: '#fff3bf', fontSize: 13, fontWeight: 900, lineHeight: 1.05 }}>{myHat ? T(myHat) : T('chooseOne')}</div>
              <div style={{ color: '#8a8fa8', fontSize: 10, fontWeight: 700, marginTop: 2 }}>{T('chooseHat')}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
            {LANGUAGES.map(lang => {
              const takenBy = Object.entries(hatPicks).find(([n, h]) => h === lang && n !== myName);
              const isTaken = !!takenBy;
              return (
                <div
                  key={`desktop-${lang}`}
                  onClick={() => !isTaken && pickHat(lang)}
                  style={{
                    minHeight: 62,
                    padding: '7px 4px 6px',
                    borderRadius: 10,
                    cursor: isTaken ? 'not-allowed' : 'pointer',
                    border: myHat === lang ? '2px solid #FFD700' : `1px solid ${LANG_BORDER[lang]}44`,
                    background: myHat === lang ? 'linear-gradient(180deg, rgba(255,215,0,.14), rgba(255,255,255,.05))' : isTaken ? 'rgba(0,0,0,.24)' : 'rgba(255,255,255,.03)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                    opacity: isTaken ? 0.4 : 1, transition: 'all .15s',
                    boxShadow: myHat === lang ? '0 0 18px rgba(255,215,0,.18)' : 'none',
                  }}
                >
                  <HatSVG lang={lang} size={28} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: myHat === lang ? '#FFD700' : LANG_TEXT[lang], textAlign: 'center', lineHeight: 1 }}>
                    {T(lang)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <div style={{ color: '#ffd24a', fontSize: 11, fontWeight: 900, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
            {T('gameMode')}
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'flex-start',
            gap: 9,
            padding: '8px 10px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            marginBottom: 10,
            width: 'fit-content',
            maxWidth: '100%',
          }}>
            <img src={selectedMode.img} alt={selectedMode.label} style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
            <div style={{ minWidth: 0, textAlign: 'left' }}>
              <div style={{ color: '#FFD700', fontSize: 12, fontWeight: 900, lineHeight: 1.05 }}>{selectedMode.label}</div>
              <div style={{ color: '#8a8fa8', fontSize: 9, fontWeight: 700, marginTop: 2 }}>{T('perPlayerLabel')}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
            {gameModes.map((m) => (
              <div
                key={`sidebar-mode-${m.id}`}
                onClick={() => { setGameMode(m.id); setShowModeConfig(true); }}
                style={{
                  minHeight: 84,
                  padding: '7px 4px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  border: gameMode === m.id ? '2px solid #FFD700' : '1px solid rgba(255,255,255,0.08)',
                  background: gameMode === m.id ? 'linear-gradient(180deg, rgba(255,215,0,0.16), rgba(255,255,255,0.05))' : 'rgba(255,255,255,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  boxShadow: gameMode === m.id ? '0 0 18px rgba(255,215,0,0.16)' : 'none',
                  transition: 'all .15s',
                }}
              >
                <img src={m.img} alt={m.label} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 12 }} />
                <div style={{ color: gameMode === m.id ? '#FFD700' : '#f3f4ff', fontSize: 11, fontWeight: 900, lineHeight: 1, textAlign: 'center' }}>
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,215,0,0.22), rgba(255,255,255,0))', margin: '0 0 14px' }} />
      {renderModeSummary()}
    </div>
  );
  const floatingCardStyle = {
    position: isDesktopWide ? 'absolute' : 'static',
    right: isDesktopWide ? -518 : 'auto',
    top: isDesktopWide ? -324 : 0,
    width: isDesktopWide ? 560 : 'auto',
    borderRadius: 18,
    padding: '14px 14px 16px',
    background: 'linear-gradient(180deg, rgba(26,31,55,0.98), rgba(18,22,40,0.96))',
    border: '1px solid rgba(255,215,0,0.16)',
    boxShadow: '0 18px 40px rgba(0,0,0,0.32)',
    backdropFilter: 'blur(8px)',
  };

  function pickHat(lang) {
    const taken = Object.values(hatPicks);
    if (taken.includes(lang) && hatPicks[myName] !== lang) return;
    setHatPicks(prev => ({ ...prev, [myName]: lang }));
    socket.emit('lobbyHatPick', { code: roomCode, playerName: myName, hat: lang });
  }

  function handleStart() {
    if (!myHat) return;
    const gameConfig = {
      mode: gameMode,
      burgerCount,
      ingredientCount,
      chaosLevel,
      ingredientPool,
      sharedBurgers: gameMode === 'clon' ? previewBurgers : null,
    };
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
        position: 'relative',
        overflow: 'visible',
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
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 999,
              background: 'rgba(255,215,0,.1)',
              border: '1px solid rgba(255,215,0,.25)',
              color: '#FFD700',
              fontSize: 12,
              fontWeight: 800,
            }}>
              <span>{T('gameMode')}:</span>
              <span>{selectedMode.label}</span>
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 999,
              background: 'rgba(78,205,196,.1)',
              border: '1px solid rgba(78,205,196,.25)',
              color: '#4ecdc4',
              fontSize: 12,
              fontWeight: 800,
            }}>
              <span>{players.length}/4</span>
              <span>{String(T('players')).toLowerCase()}</span>
            </div>
          </div>
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
        {!isDesktopWide && (
          <div style={{ marginBottom: 16, position: 'relative' }}>
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
                    {T(lang)}
                  </span>
                  {isTaken && <span style={{ fontSize: 9, color: '#888' }}>{takenBy[0]}</span>}
                </div>
              );
            })}
          </div>
          </div>
        )}

        {/* Game Mode (host only) */}
        {isHost && (
          <div style={{ marginBottom: 16, position: 'relative', paddingRight: isDesktopWide ? 560 : 0 }}>
            {!isDesktopWide && <label style={{ color: '#aaa', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8 }}>{T('gameMode')}</label>}
            <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', flexWrap: 'wrap' }}>
              {!isDesktopWide && (
                <div style={{ display: 'flex', gap: 8, flex: '1 1 320px' }}>
                  {gameModes.map(m => (
                    <div
                      key={m.id}
                      onClick={() => { setGameMode(m.id); setShowModeConfig(true); }}
                      style={{
                        flex: 1, padding: '7px 4px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                        border: gameMode === m.id ? '2px solid #FFD700' : '2px solid #2a2a4a',
                        background: gameMode === m.id ? 'rgba(255,215,0,.08)' : 'rgba(255,255,255,.02)',
                        transition: 'all .15s',
                      }}
                    >
                      <img src={m.img} alt="hamburguesa" style={{ width: 90, height: 90, objectFit: 'fill', borderRadius: '15px' }} />
                      <div style={{ fontSize: 12, fontWeight: 700, color: gameMode === m.id ? '#FFD700' : '#ccc' }}>{m.label}</div>
                      <div style={{ fontSize: 9, color: '#666', marginTop: 2 }}>{m.desc}</div>
                    </div>
                  ))}
                </div>
              )}
              {isDesktopWide ? renderDesktopSidebar() : (
                <div style={{ ...floatingCardStyle, marginTop: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <img src={selectedMode.img} alt={selectedMode.label} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 10 }} />
                    <div>
                      <div style={{ color: '#FFD700', fontSize: 12, fontWeight: 900 }}>{selectedMode.label}</div>
                      <div style={{ color: '#8a8fa8', fontSize: 10, fontWeight: 700 }}>{T('perPlayerLabel')}</div>
                    </div>
                  </div>
                  {renderModeSummary()}
                </div>
              )}
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
      {isHost && showModeConfig && (
        <Modal title={`${T('gameMode')}: ${gameModes.find(m => m.id === gameMode)?.label || ''}`}>
          <div style={{
            marginBottom: 16,
            borderRadius: 14,
            padding: '12px 12px 10px',
            background: 'linear-gradient(180deg, rgba(255,215,0,0.1), rgba(255,255,255,0.03))',
            border: '1px solid rgba(255,215,0,0.16)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <img src={selectedMode.img} alt={selectedMode.label} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 12 }} />
              <div>
                <div style={{ color: '#FFD700', fontWeight: 900, fontSize: 15 }}>{selectedMode.label}</div>
                <div style={{ color: '#9ea4be', fontSize: 11 }}>{selectedMode.desc}</div>
              </div>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              padding: '14px 16px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ color: '#FFD700', fontSize: 18, fontWeight: 900, letterSpacing: 0.3 }}>
                  {T('burgerCount')}
                </div>
                <div style={{ color: '#9ea4be', fontSize: 15, lineHeight: 1.45, fontWeight: 700 }}>
                  {T('ingredientsLabelShort')}: <span style={{ color: '#fff1b3', fontWeight: 900, fontSize: 18 }}>{modePreview.ingredients}</span>
                </div>
              </div>
              {gameMode === 'escalera'
                ? renderEscaleraPlayers(false)
                : (
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'center' }}>
                    {previewBurgers.map((burger, burgerIndex) => renderBurgerPreview(burger, burgerIndex, { hiddenIngredients: gameMode === 'caotico' }))}
                  </div>
                )}
              {gameMode === 'clon' && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {ingredientPool.map((ing) => (
                    <span
                      key={`pool-preview-${ing}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '5px 10px',
                        borderRadius: 999,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <img src={ING_IMG[ing]} alt={ing} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                      <span style={{ color: '#d8ddf3', fontSize: 11, fontWeight: 700 }}>{getIngName(ing, uiGameLang)}</span>
                    </span>
                  ))}
                </div>
              )}
              <div style={{ color: '#9ea4be', fontSize: 15, lineHeight: 1.45, fontWeight: 700, textAlign: 'center' }}>
                {T('perPlayerLabel')}
              </div>
            </div>
          </div>
          {gameMode !== 'caotico' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#aaa', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
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
          {gameMode === 'caotico' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#aaa', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                {T('modeCaotico')}: <span style={{ color: '#FFD700' }}>{chaosLevel}/3</span>
              </label>
              <input
                type="range" min={1} max={3} step={1} value={chaosLevel}
                onChange={e => setChaosLevel(+e.target.value)}
                style={{ width: '100%', accentColor: '#FF7043' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 6 }}>
                <span style={markerStyle}>Menos caos</span>
                <span style={markerStyle}>Mas caos</span>
              </div>
            </div>
          )}
          {gameMode === 'clon' && (
            <div style={{ marginBottom: 18 }}>
              <label style={{ color: '#aaa', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
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
          {gameMode === 'clon' && (
            <div style={{ marginBottom: 18 }}>
              <label style={{ color: '#aaa', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                {T('cloneIngredientPool')}
              </label>
              <div style={{ color: '#8a8fa8', fontSize: 11, lineHeight: 1.35, marginBottom: 10 }}>
                {T('cloneIngredientPoolHint')}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                {cloneIngredients.map((ing) => {
                  const active = ingredientPool.includes(ing);
                  return (
                    <button
                      key={ing}
                      type="button"
                      onClick={() => {
                        if (active && ingredientPool.length === 1) return;
                        setIngredientPool((prev) => active ? prev.filter((item) => item !== ing) : [...prev, ing]);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '7px 10px',
                        borderRadius: 999,
                        border: active ? `2px solid ${ING_BG[ing]}` : '1px solid rgba(255,255,255,0.12)',
                        background: active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                        color: active ? '#fff' : '#8a8fa8',
                        fontFamily: "'Fredoka',sans-serif",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <img src={ING_IMG[ing]} alt={ing} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                      <span>{getIngName(ing, uiGameLang)}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ color: '#6f7697', fontSize: 11 }}>{T('cloneIngredientPoolLocked')}</div>
            </div>
          )}
          <Btn onClick={() => setShowModeConfig(false)} color="#333" style={{ color: '#aaa' }}>{T('close')}</Btn>
        </Modal>
      )}
    </div>
  );
}

