import React, { useEffect, useMemo, useRef, useState } from 'react';
import socket from '../../src/socket.js';
import { LANGUAGES, LANG_BORDER, LANG_BG, LANG_TEXT, INGREDIENTS, ING_BG, getIngName } from '../../constants/index.js';
import { getFriends, sendFriendRequest } from '../../src/api.js';
import { getUILang, KEY_TO_LANG } from '../../src/translations.js';
import { HatBadge, PercheroSVG } from '../../components/HatComponents.jsx';
import HatSVG from '../../components/HatSVG.jsx';
import { Btn } from '../components/Btn.jsx';
import { Modal } from '../components/Modal.jsx';
import { UserAvatar } from '../components/UserAvatar.jsx';
import { PLAYER_COLORS } from '../utils/gameHelpers.js';
import { ING_IMG } from '../utils/gameHelpers.js';
import { genBurger } from '../../game/deck.js';
import modoclon from '../../imagenes/modos/clones.png';
import modoescalera from '../../imagenes/modos/escalera.png';
import modocaotico from '../../imagenes/modos/caotico.png';
import vsiaImg from '../../imagenes/vsia.png';
import actionEnsaladaImg from '../../imagenes/acciones/ensalada3.png';
import actionPizzaImg from '../../imagenes/acciones/pizza.png';
import actionParrillaImg from '../../imagenes/acciones/parrilla2.png';
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
import { getRoomSession } from '../utils/roomSession.js';

export function OnlineLobby({ roomCode, myName, isHost, players, onStart, onBack, isPublic, roomDisplayName, T, user, onOpenProfile, onLocalHatPick }) {
  const MAX_ROOM_PLAYERS = 6;
  const uiGameLang = KEY_TO_LANG[getUILang()] || 'espanol';
  const cloneIngredients = INGREDIENTS.filter((ing) => ing !== 'pan');
  const [gameMode, setGameMode] = useState('clon');
  const [burgerCount, setBurgerCount] = useState(2);
  const [ingredientCount, setIngredientCount] = useState(5);
  const [ingredientPool, setIngredientPool] = useState(cloneIngredients);
  const [cloneWildcardsEnabled, setCloneWildcardsEnabled] = useState(true);
  const [chaosLevel, setChaosLevel] = useState(2);
  const [aiDifficulty, setAiDifficulty] = useState('medium');
  const [showModeConfig, setShowModeConfig] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteFriends, setInviteFriends] = useState([]);
  const [inviteSentTo, setInviteSentTo] = useState(new Set());
  const [friendReqSent, setFriendReqSent] = useState(new Set());
  const [existingFriends, setExistingFriends] = useState(new Set());
  const [selectedStaircasePlayer, setSelectedStaircasePlayer] = useState(0);
  const [lobbyChat, setLobbyChat] = useState([]);
  const [lobbyChatInput, setLobbyChatInput] = useState('');
  const [showLobbyChat, setShowLobbyChat] = useState(false);
  const lobbyChatEndRef = useRef(null);
  const [isDesktopWide, setIsDesktopWide] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1280 : false));
  const uiKey = getUILang();
  const sessionPlayerName = getRoomSession()?.playerName || '';
  const hatPicks = useMemo(
    () => Object.fromEntries((players || []).filter((player) => !!player.hat).map((player) => [player.name, player.hat])),
    [players]
  );
  const resolvedMyPlayer = useMemo(() => {
    if (!Array.isArray(players) || players.length === 0) return null;
    if (socket.id) {
      const bySocket = players.find((player) => player.socketId === socket.id);
      if (bySocket) return bySocket;
    }
    if (myName) {
      const byName = players.find((player) => player.name === myName);
      if (byName) return byName;
    }
    if (sessionPlayerName) {
      const bySessionName = players.find((player) => player.name === sessionPlayerName);
      if (bySessionName) return bySessionName;
    }
    if (user?.id != null) {
      const byUserId = players.find((player) => String(player.userId) === String(user.id));
      if (byUserId) return byUserId;
    }
    if (user?.username) {
      const byUsername = players.find((player) => player.username === user.username);
      if (byUsername) return byUsername;
    }
    const humanPlayers = players.filter((player) => !player.isAI);
    return humanPlayers.length === 1 ? humanPlayers[0] : (players.length === 1 ? players[0] : null);
  }, [myName, players, sessionPlayerName, user, socket.id]);
  const resolvedMyName = resolvedMyPlayer?.name || myName || sessionPlayerName || '';
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
    socket.emit('chatMessage', { code: roomCode, playerName: resolvedMyName || myName || 'Jugador', text: lobbyChatInput.trim() });
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

  const myHat = resolvedMyPlayer?.hat || hatPicks[resolvedMyName];
  const desktopLeftPanelWidth = 500;

  const gameModes = [
    { id: 'clon', label: T('modeClon'), desc: T('modeClonDesc'),img:modoclon },
    { id: 'escalera', label: T('modeEscalera'), desc: T('modeEscaleraDesc'),img:modoescalera },
    { id: 'caotico', label: T('modeCaotico'), desc: T('modeCaoticoDesc'),img:modocaotico },
  ];
  const aiDifficultyOptions = [
    { id: 'easy', label: T('aiEasy') },
    { id: 'medium', label: T('aiMedium') },
    { id: 'hard', label: T('aiHard') },
    { id: 'impossible', label: T('aiImpossible') },
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
  const removedCloneActions = useMemo(() => {
    const poolSet = new Set(ingredientPool);
    const removed = [];
    if (!['lechuga', 'tomate', 'cebolla', 'palta'].some((ing) => poolSet.has(ing))) removed.push('ensalada');
    if (!poolSet.has('queso')) removed.push('pizza');
    if (!poolSet.has('carne') && !poolSet.has('pollo')) removed.push('parrilla');
    return removed;
  }, [ingredientPool]);
  const cloneRemovedActionImages = {
    ensalada: actionEnsaladaImg,
    pizza: actionPizzaImg,
    parrilla: actionParrillaImg,
  };
  const staircasePreviewByPlayer = useMemo(
    () => Array.from(
      { length: Math.max(players.length, 1) },
      () => Array.from({ length: burgerCount }, (_, index) => genBurger(4 + index)),
    ),
    [players.length, burgerCount],
  );
  useEffect(() => {
    setSelectedStaircasePlayer((prev) => Math.min(prev, Math.max(staircasePreviewByPlayer.length - 1, 0)));
  }, [staircasePreviewByPlayer.length, burgerCount]);
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
  const renderEscaleraPlayers = (compact = false) => {
    const safeIndex = Math.min(selectedStaircasePlayer, Math.max(staircasePreviewByPlayer.length - 1, 0));
    const selectedPlayerBurgers = staircasePreviewByPlayer[safeIndex] || [];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 8 : 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {staircasePreviewByPlayer.map((_, playerIndex) => {
            const isActive = playerIndex === safeIndex;
            const label = players[playerIndex]?.name || `${playerWord} ${playerIndex + 1}`;
            return (
              <button
                key={`escalera-tab-${playerIndex}`}
                type="button"
                onClick={() => setSelectedStaircasePlayer(playerIndex)}
                style={{
                  padding: compact ? '6px 10px' : '7px 12px',
                  borderRadius: 999,
                  border: isActive ? '2px solid #FFD700' : '1px solid rgba(255,255,255,0.12)',
                  background: isActive ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.04)',
                  color: isActive ? '#FFD700' : '#d8ddf3',
                  fontFamily: "'Fredoka',sans-serif",
                  fontSize: compact ? 11 : 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div
          style={{
            borderRadius: 12,
            padding: compact ? '8px 10px' : '10px 12px',
            background: compact ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ color: '#FFD700', fontSize: compact ? 11 : 12, fontWeight: 900, marginBottom: 6 }}>
            {players[safeIndex]?.name || `${playerWord} ${safeIndex + 1}`}
          </div>
          <div style={{ display: 'flex', gap: compact ? 8 : 12, flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: compact ? 'flex-start' : 'center' }}>
            {selectedPlayerBurgers.map((burger, burgerIndex) => renderBurgerPreview(burger, burgerIndex, { compact }))}
          </div>
        </div>
      </div>
    );
  };
  const renderModeSummary = () => {
    if (gameMode === 'escalera') {
      return (
        <>
          <div
            style={{
              marginBottom: 12,
              padding: '10px 12px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div style={{ color: '#f6f0c3', fontSize: 12, fontWeight: 800, lineHeight: 1.35 }}>{selectedMode.desc}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              <span style={markerStyle}>{`${T('burgerCount')}: ${modePreview.burgers}`}</span>
              <span style={markerStyle}>{`${T('ingredientsLabelShort')}: ${modePreview.ingredients}`}</span>
              <span style={markerStyle}>{T('perPlayerLabel')}</span>
            </div>
          </div>
          {renderEscaleraPlayers(true)}
        </>
      );
    }
    return (
      <>
        <div
          style={{
            marginBottom: 12,
            padding: '10px 12px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ color: '#f6f0c3', fontSize: 12, fontWeight: 800, lineHeight: 1.35 }}>{selectedMode.desc}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            <span style={markerStyle}>{`${T('burgerCount')}: ${modePreview.burgers}`}</span>
            <span style={markerStyle}>{`${T('ingredientsLabelShort')}: ${modePreview.ingredients}`}</span>
            <span style={markerStyle}>{T('perPlayerLabel')}</span>
            {gameMode === 'clon' && (
              <span style={markerStyle}>{cloneWildcardsEnabled ? T('cloneWildcardsOn') : T('cloneWildcardsOff')}</span>
            )}
            {gameMode === 'caotico' && (
              <span style={markerStyle}>{`CAOS ${chaosLevel}/3`}</span>
            )}
          </div>
          {gameMode === 'clon' && (
            <div style={{ marginTop: 10 }}>
              <div style={{ color: '#9ea4be', fontSize: 10, fontWeight: 800, marginBottom: 6 }}>
                {T('cloneRemovedActionsLabel')}
              </div>
              {removedCloneActions.length > 0 ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {removedCloneActions.map((actionId) => (
                    <span
                      key={`clone-removed-${actionId}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '5px 8px',
                        borderRadius: 999,
                        background: 'rgba(255,120,120,0.08)',
                        border: '1px solid rgba(255,120,120,0.18)',
                        color: '#ffcfbf',
                        fontSize: 10,
                        fontWeight: 800,
                      }}
                    >
                      <img
                        src={cloneRemovedActionImages[actionId]}
                        alt={T(`actionName_${actionId}`)}
                        style={{ width: 16, height: 16, objectFit: 'contain' }}
                      />
                      {T(`actionName_${actionId}`)}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#7ef0a2', fontSize: 10, fontWeight: 800 }}>
                  {T('cloneNoRemovedActions')}
                </div>
              )}
            </div>
          )}
        </div>
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
              const takenBy = getTakenBy(lang);
              const isTaken = !!takenBy;
              return (
                <button
                  key={`desktop-${lang}`}
                  type="button"
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
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    touchAction: 'manipulation',
                  }}
                >
                  <HatSVG lang={lang} size={28} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: myHat === lang ? '#FFD700' : LANG_TEXT[lang], textAlign: 'center', lineHeight: 1 }}>
                    {T(lang)}
                  </span>
                </button>
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
                onClick={() => {
                  if (!isHost) return;
                  setGameMode(m.id);
                  setShowModeConfig(true);
                }}
                style={{
                  minHeight: 98,
                  padding: '9px 6px',
                  borderRadius: 12,
                  cursor: isHost ? 'pointer' : 'default',
                  border: gameMode === m.id ? '2px solid #FFD700' : '1px solid rgba(255,255,255,0.08)',
                  background: gameMode === m.id ? 'linear-gradient(180deg, rgba(255,215,0,0.16), rgba(255,255,255,0.05))' : 'rgba(255,255,255,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  boxShadow: gameMode === m.id ? '0 0 18px rgba(255,215,0,0.16)' : 'none',
                  transition: 'all .15s',
                  opacity: isHost ? 1 : 0.92,
                }}
              >
                <img src={m.img} alt={m.label} style={{ width: 62, height: 62, objectFit: 'cover', borderRadius: 14 }} />
                <div style={{ color: gameMode === m.id ? '#FFD700' : '#f3f4ff', fontSize: 12, fontWeight: 900, lineHeight: 1, textAlign: 'center' }}>
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
    width: isDesktopWide ? 560 : 'auto',
    borderRadius: 18,
    padding: '14px 14px 16px',
    background: 'linear-gradient(180deg, rgba(26,31,55,0.98), rgba(18,22,40,0.96))',
    border: '1px solid rgba(255,215,0,0.16)',
    boxShadow: '0 18px 40px rgba(0,0,0,0.32)',
    backdropFilter: 'blur(8px)',
  };
  const modalDesktopColumns = isDesktopWide ? {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.1fr) minmax(280px, 0.9fr)',
    gap: 18,
    alignItems: 'start',
  } : null;

  const allHumansReady = players
    .filter((player) => !player.isAI)
    .every((player) => !!hatPicks[player.name]);

  function getTakenBy(lang) {
    return players.find((player) => player.name !== resolvedMyName && hatPicks[player.name] === lang) || null;
  }

  function pickHat(lang) {
    if (!resolvedMyName) return;
    const takenBy = getTakenBy(lang);
    if (takenBy && hatPicks[resolvedMyName] !== lang) return;
    onLocalHatPick?.(resolvedMyName, lang);
    socket.emit('lobbyHatPick', { code: roomCode, playerName: resolvedMyName, hat: lang });
  }

  function handleStart() {
    if (!myHat || !allHumansReady) return;
    const gameConfig = {
      mode: gameMode,
      burgerCount,
      ingredientCount,
      chaosLevel,
      ingredientPool,
      cloneWildcardsEnabled,
      aiDifficulty,
      sharedBurgers: gameMode === 'clon' ? previewBurgers : null,
    };
    socket.emit('startGame', { code: roomCode, hatPicks, gameConfig });
    onStart(hatPicks, gameConfig);
  }

  function handleAddAi() {
    if (!isHost || players.length >= MAX_ROOM_PLAYERS) return;
    socket.emit('addAiPlayer', { code: roomCode });
  }

  function handleRemoveAi(playerIdx) {
    if (!isHost) return;
    socket.emit('removeAiPlayer', { code: roomCode, playerIdx });
  }

  const roomHeader = (
    <div style={{ width: '100%', maxWidth: isDesktopWide ? 1120 : 560, margin: '0 auto 18px' }}>
      {isDesktopWide ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 60 }}>
          <div style={{ width: desktopLeftPanelWidth, paddingTop: 84 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
              <button
                onClick={handleCopyLink}
                style={{
                  padding: '7px 18px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,215,0,.35)',
                  background: copied ? 'rgba(76,175,80,.18)' : 'rgba(255,215,0,.08)',
                  color: copied ? '#81C784' : '#FFD700',
                  fontFamily: "'Fredoka',sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all .2s',
                }}
              >
                {copied ? T('linkCopied') : T('inviteLink')}
              </button>
              {user && players.length < MAX_ROOM_PLAYERS && (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={toggleInvitePanel}
                    style={{
                      padding: '7px 18px',
                      borderRadius: 10,
                      border: '1px solid rgba(78,205,196,.35)',
                      background: showInvite ? 'rgba(78,205,196,.18)' : 'rgba(78,205,196,.08)',
                      color: '#4ecdc4',
                      fontFamily: "'Fredoka',sans-serif",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      transition: 'all .2s',
                    }}
                  >
                    {T('inviteFriend')}
                  </button>
                  {showInvite && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: 8,
                      background: '#1a2744',
                      borderRadius: 12,
                      border: '1px solid #2a2a4a',
                      padding: 12,
                      minWidth: 220,
                      boxShadow: '0 8px 24px rgba(0,0,0,.5)',
                      zIndex: 10,
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
              {isHost && players.length < MAX_ROOM_PLAYERS && (
                <button
                  onClick={handleAddAi}
                  style={{
                    padding: '7px 18px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,112,67,.35)',
                    background: 'rgba(255,112,67,.1)',
                    color: '#FFB199',
                    fontFamily: "'Fredoka',sans-serif",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all .2s',
                  }}
                >
                  {T('addAiPlayer')}
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
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
                <span>{players.length}/{MAX_ROOM_PLAYERS}</span>
                <span>{String(T('players')).toLowerCase()}</span>
              </div>
            </div>
          </div>
          <div style={{ width: 560, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: '#888', fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>
              {isPublic ? T('publicRoom') : T('privateRoom')}
            </div>
            <div style={{
              fontSize: isPublic ? 24 : 36,
              fontWeight: 900,
              color: '#FFD700',
              letterSpacing: isPublic ? 0 : 8,
              background: 'rgba(255,215,0,.08)',
              borderRadius: 12,
              padding: '10px 20px',
              border: '2px dashed rgba(255,215,0,.3)',
            }}>
              {isPublic ? roomDisplayName : roomCode}
            </div>
            <div style={{ fontSize: 11, color: '#555', marginTop: 6 }}>
              {T('codeLabel')}: {roomCode}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ width: '100%', textAlign: 'center' }}>
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
            </>
          )}
          <button
            onClick={handleCopyLink}
            style={{
              marginTop: 10, padding: '7px 18px', borderRadius: 10,
              border: '1px solid rgba(255,215,0,.35)',
              background: copied ? 'rgba(76,175,80,.18)' : 'rgba(255,215,0,.08)',
              color: copied ? '#81C784' : '#FFD700',
              fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13,
              cursor: 'pointer', transition: 'all .2s',
              display: 'block', marginLeft: 'auto', marginRight: 'auto',
            }}
          >
            {copied ? T('linkCopied') : T('inviteLink')}
          </button>
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
              <span>{players.length}/{MAX_ROOM_PLAYERS}</span>
              <span>{String(T('players')).toLowerCase()}</span>
            </div>
          </div>
          {user && players.length < MAX_ROOM_PLAYERS && (
            <div style={{ marginTop: 12, position: 'relative', display: 'flex', justifyContent: 'center' }}>
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
          {isHost && players.length < MAX_ROOM_PLAYERS && (
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={handleAddAi}
                style={{
                  padding: '7px 18px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,112,67,.35)',
                  background: 'rgba(255,112,67,.1)',
                  color: '#FFB199',
                  fontFamily: "'Fredoka',sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {T('addAiPlayer')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: isDesktopWide ? 'flex-start' : 'center',
      background: 'linear-gradient(135deg,#0f1117 0%,#1a1a2e 100%)',
      fontFamily: "'Fredoka',sans-serif",
      overflowY: 'auto', padding: isDesktopWide ? '20px 0 20px 28px' : '20px 0',
    }}>
      <div style={{ width: '100%' }}>
        {roomHeader}
      <div style={isDesktopWide ? {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 60,
        width: '100%',
        maxWidth: 1120,
        margin: '0 auto',
      } : {}}>
      <div style={{
        background: '#16213e', borderRadius: 20,
        padding: 'clamp(18px, 4vw, 32px) clamp(14px, 4vw, 36px)',
        maxWidth: isDesktopWide ? desktopLeftPanelWidth : 560, width: isDesktopWide ? `min(${desktopLeftPanelWidth}px, 78vw)` : '94vw',
        boxShadow: '0 8px 40px rgba(0,0,0,.6)', border: '2px solid #2a2a4a',
        position: 'relative',
        overflow: 'visible',
      }}>
        {/* Players */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#555', letterSpacing: 1, marginBottom: 10 }}>
            {typeof T('playersCount') === 'function' ? T('playersCount')(players.length) : `PLAYERS (${players.length}/${MAX_ROOM_PLAYERS})`}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {players.map((p, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                borderRadius: 10, background: 'rgba(255,255,255,.04)',
                border: `2px solid ${PLAYER_COLORS[i % PLAYER_COLORS.length]}44`,
              }}>
                <UserAvatar name={p.name} username={p.username} avatarUrl={p.isAI ? vsiaImg : p.avatarUrl} size={34} />
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: PLAYER_COLORS[i % PLAYER_COLORS.length] + '33',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 900, color: PLAYER_COLORS[i % PLAYER_COLORS.length],
                }}>
                  {i + 1}
                </div>
                {p.userId ? (
                  <button
                    type="button"
                    onClick={() => onOpenProfile?.({
                      id: p.userId,
                      username: p.username || null,
                      displayName: p.name,
                      avatarUrl: p.isAI ? null : (p.avatarUrl || null),
                    })}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      margin: 0,
                      color: '#eee',
                      fontFamily: "'Fredoka',sans-serif",
                      fontSize: 15,
                      fontWeight: 800,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      textUnderlineOffset: 3,
                    }}
                  >
                    {p.name}
                  </button>
                ) : (
                  <span style={{ fontWeight: 700, color: '#eee' }}>{p.name}</span>
                )}
                {p.name === resolvedMyName && <span style={{ fontSize: 11, color: '#888' }}>{T('you')}</span>}
                {p.isAI && <span style={{ fontSize: 11, color: '#FFB199', fontWeight: 800 }}>IA</span>}
                {i === 0 && <span style={{ fontSize: 11, color: '#FFD700', marginLeft: 'auto' }}>{T('host')}</span>}
                {hatPicks[p.name] && (
                  <HatSVG lang={hatPicks[p.name]} size={24} />
                )}
                {isHost && p.isAI && (
                  <button
                    type="button"
                    onClick={() => handleRemoveAi(p.idx)}
                    style={{
                      marginLeft: 'auto',
                      padding: '4px 10px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,112,67,.35)',
                      background: 'rgba(255,112,67,.12)',
                      color: '#FFB199',
                      fontFamily: "'Fredoka',sans-serif",
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {T('removeAiPlayer')}
                  </button>
                )}
                {user && p.username && p.name !== resolvedMyName && !existingFriends.has(p.username) && (
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
              const takenBy = getTakenBy(lang);
              const isTaken = !!takenBy;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => !isTaken && pickHat(lang)}
                  style={{
                    flex: '1 1 28%', minWidth: 75, padding: '6px 4px', borderRadius: 8, cursor: isTaken ? 'not-allowed' : 'pointer',
                    border: myHat === lang ? '2px solid #FFD700' : `2px solid ${LANG_BORDER[lang]}44`,
                    background: myHat === lang ? 'rgba(255,215,0,.1)' : isTaken ? 'rgba(0,0,0,.2)' : 'rgba(255,255,255,.02)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    opacity: isTaken ? 0.4 : 1, transition: 'all .15s',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    touchAction: 'manipulation',
                  }}
                >
                  <HatSVG lang={lang} size={28} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: myHat === lang ? '#FFD700' : LANG_TEXT[lang] }}>
                    {T(lang)}
                  </span>
                  {isTaken && <span style={{ fontSize: 9, color: '#888' }}>{takenBy.name}</span>}
                </button>
              );
            })}
          </div>
          </div>
        )}

        {/* Game Mode / Mode Summary */}
        {(isHost || !isDesktopWide) && (
          <div style={{ marginBottom: 16, position: 'relative', paddingRight: 0 }}>
            {!isDesktopWide && <label style={{ color: '#aaa', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8 }}>{T('gameMode')}</label>}
            <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', flexWrap: 'wrap' }}>
              {!isDesktopWide && isHost && (
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
              {!isDesktopWide && (
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
            disabled={players.length < 2 || !myHat || !allHumansReady}
            color="#4CAF50"
            style={{ width: '100%', fontSize: 15, padding: '12px 0' }}
          >
            {!allHumansReady
              ? (typeof T('waitingHats') === 'function' ? T('waitingHats')(players.filter((p) => !p.isAI && hatPicks[p.name]).length, players.filter((p) => !p.isAI).length) : T('waitingHats'))
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
      {isDesktopWide && (
        <div style={{ width: 560 }}>
          {renderDesktopSidebar()}
        </div>
      )}
      </div>
      {isHost && showModeConfig && (
        <Modal
          title={`${T('gameMode')}: ${gameModes.find(m => m.id === gameMode)?.label || ''}`}
          maxWidth={isDesktopWide ? 1040 : 480}
          width={isDesktopWide ? 'min(1040px, 94vw)' : '90vw'}
        >
          <div style={modalDesktopColumns || undefined}>
            <div style={{
              marginBottom: isDesktopWide ? 0 : 16,
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
                {gameMode === 'clon' && !isDesktopWide && (
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
            <div>
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
              <div style={{ marginTop: 10, marginBottom: 10 }}>
                <label style={{ color: '#aaa', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                  {T('cloneWildcardsToggle')}
                </label>
                <button
                  type="button"
                  onClick={() => setCloneWildcardsEnabled((prev) => !prev)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 999,
                    border: cloneWildcardsEnabled ? '2px solid #FFD700' : '1px solid rgba(255,255,255,0.12)',
                    background: cloneWildcardsEnabled ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.03)',
                    color: cloneWildcardsEnabled ? '#FFD700' : '#8a8fa8',
                    fontFamily: "'Fredoka',sans-serif",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  <img src={ING_IMG.perrito} alt={T('cloneWildcardsToggle')} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                  <span>{cloneWildcardsEnabled ? T('cloneWildcardsOn') : T('cloneWildcardsOff')}</span>
                </button>
              </div>
              <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: '#FFD700', fontSize: 11, fontWeight: 900, marginBottom: 6 }}>
                  {T('cloneRemovedActions')}
                </div>
                {removedCloneActions.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {removedCloneActions.map((actionId) => (
                      <span
                        key={actionId}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 10px 6px 6px',
                          borderRadius: 999,
                          background: 'rgba(255,112,67,0.12)',
                          border: '1px solid rgba(255,112,67,0.28)',
                          color: '#ffb199',
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        <img
                          src={cloneRemovedActionImages[actionId]}
                          alt={T(`actionName_${actionId}`)}
                          style={{ width: 22, height: 22, objectFit: 'cover', borderRadius: 999, flexShrink: 0 }}
                        />
                        {T(`actionName_${actionId}`)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#8a8fa8', fontSize: 11 }}>{T('cloneRemovedActionsNone')}</div>
                )}
              </div>
            </div>
          )}
          <div style={{ marginBottom: 18 }}>
            <label style={{ color: '#aaa', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
              {T('aiDifficulty')}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
              {aiDifficultyOptions.map((option) => {
                const active = aiDifficulty === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setAiDifficulty(option.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: active ? '2px solid #FFD700' : '1px solid rgba(255,255,255,0.12)',
                      background: active ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.03)',
                      color: active ? '#FFD700' : '#d8ddf3',
                      fontFamily: "'Fredoka',sans-serif",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
            </div>
          </div>
          <Btn onClick={() => setShowModeConfig(false)} color="#333" style={{ color: '#aaa', marginTop: 16 }}>{T('close')}</Btn>
        </Modal>
      )}
      </div>
    </div>
  );
}




