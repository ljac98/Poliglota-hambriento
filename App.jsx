import React, { useState, useEffect, useRef, useCallback } from 'react';
import socket from './src/socket.js';
import { getSavedUser } from './src/api.js';
import {
  LANGUAGES, LANG_BORDER, LANG_BG, LANG_TEXT,
  ING_EMOJI, ING_BG, AI_NAMES, getIngName, getActionInfo,
  ING_NAMES, ACTION_CARDS,
} from './constants';
import { generateDeck, genBurger, initPlayer, canPlayCard } from './game';
import { shuffle, randInt, uid } from './game/utils';
import { t, getUILang, setUILang, KEY_TO_LANG, getLocalizedLangShort } from './src/translations.js';
import { GameCard } from './components/Cards';
import { BurgerTarget, LogEntry } from './components/GameUI';
import { HatBadge } from './components/HatComponents.jsx';
import HatSVG from './components/HatSVG.jsx';
import percheroImg from './imagenes/sombreros/perchero/percherofinal.png';
import ingredientCardIcon from './imagenes/hamburguesas/ham.png';
import eqMilanesa from './imagenes/acciones/esquina/milanga.png';
import eqEnsalada from './imagenes/acciones/esquina/ensalada2.png';
import eqPizza from './imagenes/acciones/esquina/pizza2.png';
import eqParrilla from './imagenes/acciones/esquina/parrilla.png';
import eqTenedor from './imagenes/acciones/esquina/tenedor2.png';
import eqLadron from './imagenes/acciones/esquina/robo.png';
import eqIntercambioSomb from './imagenes/acciones/esquina/intercambiosomb.png';
import eqIntercambioHamb from './imagenes/acciones/esquina/intercam.png';
import eqBasurero from './imagenes/acciones/esquina/basurero.png';
import eqGloton from './imagenes/acciones/esquina/comelona.png';
import eqNegacion from './imagenes/acciones/esquina/cancelh.png';
import eqComeComodines from './imagenes/acciones/esquina/pancho.png';
import eqRightGlobal from './imagenes/acciones/esquina derecha/global.png';
import eqRightSingle from './imagenes/acciones/esquina derecha/singular.png';
import eqRightDiscard from './imagenes/acciones/esquina derecha/descarte.png';
import eqRightNegation from './imagenes/acciones/esquina derecha/negacion.png';

import { Btn, Modal, OpponentCard } from './app/components/index.js';
import { AppPhaseRouter } from './app/screens/index.js';
import {
  ING_IMG,
  ING_AFFECTED_BY,
  PLAYER_COLORS,
  advanceBurger,
  applyMass,
  clone,
  drawN,
  filterTable,
  ingChosen,
  ingKey,
} from './app/utils/gameHelpers.js';
import { clearRoomSession, getRoomSession, saveRoomSession } from './app/utils/roomSession.js';

const INSTALL_PROMPT_COPY = {
  es: {
    title: 'Instala Hungry Poly',
    descPrompt: 'Descarga el juego en tu teléfono para abrirlo como app.',
    descIos: 'En iPhone usa Compartir y luego "Agregar a pantalla de inicio".',
    install: 'Instalar',
    later: 'Ahora no',
  },
  en: {
    title: 'Install Hungry Poly',
    descPrompt: 'Download the game on your phone and open it like an app.',
    descIos: 'On iPhone tap Share and then "Add to Home Screen".',
    install: 'Install',
    later: 'Not now',
  },
  fr: {
    title: 'Installer Hungry Poly',
    descPrompt: 'Télécharge le jeu sur ton téléphone pour l’ouvrir comme une app.',
    descIos: 'Sur iPhone, appuie sur Partager puis "Sur l’écran d’accueil".',
    install: 'Installer',
    later: 'Plus tard',
  },
  it: {
    title: 'Installa Hungry Poly',
    descPrompt: 'Scarica il gioco sul telefono e aprilo come un’app.',
    descIos: 'Su iPhone tocca Condividi e poi "Aggiungi alla schermata Home".',
    install: 'Installa',
    later: 'Dopo',
  },
  de: {
    title: 'Hungry Poly installieren',
    descPrompt: 'Lade das Spiel auf dein Handy und öffne es wie eine App.',
    descIos: 'Auf dem iPhone tippe auf Teilen und dann "Zum Home-Bildschirm".',
    install: 'Installieren',
    later: 'Später',
  },
  pt: {
    title: 'Instalar Hungry Poly',
    descPrompt: 'Baixa o jogo no teu telemóvel e abre como app.',
    descIos: 'No iPhone toca em Partilhar e depois "Adicionar ao ecrã inicial".',
    install: 'Instalar',
    later: 'Agora não',
  },
};

export default function App() {
  const initialParams = new URLSearchParams(window.location.search);
  const initialSalaCode = initialParams.get('sala') || '';
  const initialView = initialParams.get('view') || '';
  const initialProfileId = parseInt(initialParams.get('id') || '', 10);
  const savedUserOnLoad = getSavedUser();
  const appDownloadUrl = typeof window !== 'undefined' ? new URL('/', window.location.href).toString() : 'https://hungry-poly.up.railway.app/';
  const hasRoomSession = !!sessionStorage.getItem('hp_room_session');
  const [phase, setPhase] = useState(
    hasRoomSession ? 'reconnecting'
    : initialSalaCode ? 'onlineMenu'
    : initialView === 'profile' && savedUserOnLoad && (Number.isFinite(initialProfileId) || savedUserOnLoad?.id) ? 'profile'
    : initialView === 'friends' && savedUserOnLoad ? 'friends'
    : (savedUserOnLoad ? 'setup' : 'auth')
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
  const [howToPlayPage, setHowToPlayPage] = useState(0);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showIosInstallHint, setShowIosInstallHint] = useState(false);
  const [downloadReturnPhase, setDownloadReturnPhase] = useState('setup');
  const [onlineMenuTab, setOnlineMenuTab] = useState('');
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [profileUserId, setProfileUserId] = useState(Number.isFinite(initialProfileId) ? initialProfileId : (savedUserOnLoad?.id || null));
  const [profileReturnPhase, setProfileReturnPhase] = useState('setup');
  const aiRunning = useRef(false);
  const [turnTime, setTurnTime] = useState(60);
  const [currentGameConfig, setCurrentGameConfig] = useState(null);
  const turnTimerRef = useRef(null);

  // â”€â”€ Online multiplayer state â”€â”€
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

  // â”€â”€ Auth state â”€â”€
  const [user, setUser] = useState(() => getSavedUser());
  // â”€â”€ UI language state â”€â”€
  const [uiLang, setUiLangState] = useState(() => getUILang());
  const T = useCallback((key) => t(key, uiLang), [uiLang]);
  const uiGameLang = KEY_TO_LANG[uiLang] || LANGUAGES[0];
  const installCopy = INSTALL_PROMPT_COPY[uiLang] || INSTALL_PROMPT_COPY.en;
  const canOpenInstallPrompt = showIosInstallHint || !!deferredInstallPrompt;
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;
  const handleSetLang = (lang) => { setUILang(lang); setUiLangState(lang); };
  const getActionText = useCallback((actionId) => {
    const base = getActionInfo(actionId);
    if (!base) return null;
    const nameKey = `actionName_${actionId}`;
    const descKey = `actionDesc_${actionId}`;
    const trName = T(nameKey);
    const trDesc = T(descKey);
    return {
      ...base,
      name: trName === nameKey ? base.name : trName,
      desc: trDesc === descKey ? base.desc : trDesc,
    };
  }, [T]);
  // â”€â”€ NegaciÃ³n state â”€â”€
  // pendingNeg: null | { actingIdx, cardInfo, eligibleIdxs, responses: {i: bool} }
  const [pendingNeg, setPendingNeg] = useState(null);
  // Host-only ref that stores the resolve callback (not serializable over socket)
  const pendingNegRef = useRef(null);

  // â”€â”€ Voluntary leave state â”€â”€
  const [gamePaused, setGamePaused] = useState(false);
  const [pausedMessage, setPausedMessage] = useState('');

  // â”€â”€ Room invite notification state â”€â”€
  const [roomInvite, setRoomInvite] = useState(null);
  const [inviteJoinCode, setInviteJoinCode] = useState('');

  // â”€â”€ Friend request notification state â”€â”€
  const [friendReqNotif, setFriendReqNotif] = useState(null);

  // â”€â”€ Room invite listener (global) â”€â”€
  useEffect(() => {
    const handleRoomInvite = (data) => {
      setRoomInvite(data);
      // Auto-dismiss after 15 seconds
      setTimeout(() => setRoomInvite(prev => prev === data ? null : prev), 15000);
    };
    socket.on('roomInviteReceived', handleRoomInvite);
    return () => socket.off('roomInviteReceived', handleRoomInvite);
  }, []);

  // â”€â”€ Friend request notification listener (global) â”€â”€
  useEffect(() => {
    const handleFriendReq = (data) => {
      setFriendReqNotif(data);
      setTimeout(() => setFriendReqNotif(prev => prev === data ? null : prev), 10000);
    };
    socket.on('friendRequestReceived', handleFriendReq);
    return () => socket.off('friendRequestReceived', handleFriendReq);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const isStandalone = window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone === true;
    if (isStandalone) return undefined;

    const ua = window.navigator.userAgent || '';
    const isIos = /iPad|iPhone|iPod/.test(ua);
    const isTouchDevice = window.matchMedia?.('(pointer: coarse)')?.matches;

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event);
      setShowInstallPrompt(true);
      setShowIosInstallHint(false);
    };

    const handleInstalled = () => {
      setDeferredInstallPrompt(null);
      setShowInstallPrompt(false);
      setShowIosInstallHint(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    if (isIos && isTouchDevice) {
      setShowIosInstallHint(true);
      setShowInstallPrompt(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstallApp = useCallback(async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice.catch(() => null);
    setDeferredInstallPrompt(null);
    if (choice?.outcome === 'accepted') {
      setShowInstallPrompt(false);
      return;
    }
    setShowInstallPrompt(false);
  }, [deferredInstallPrompt]);

  const openInstallPrompt = useCallback(() => {
    if (!canOpenInstallPrompt) return;
    setShowInstallPrompt(true);
  }, [canOpenInstallPrompt]);

  const installBanner = showInstallPrompt && (
    <div
      style={{
        position: 'fixed',
        left: 16,
        right: isMobile ? 16 : 'auto',
        bottom: isMobile ? 16 : 20,
        width: isMobile ? 'auto' : 360,
        zIndex: 10000,
        padding: isMobile ? '12px 14px' : '14px 16px',
        borderRadius: 18,
        background: 'rgba(12, 16, 28, 0.96)',
        border: '1px solid rgba(255, 215, 0, 0.22)',
        boxShadow: '0 20px 50px rgba(0,0,0,.42)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            background: 'rgba(255, 215, 0, 0.16)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: 22,
          }}
        >
          {'\u{1F4F1}'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#FFD700', fontWeight: 900, fontSize: 16, lineHeight: 1.1, marginBottom: 4 }}>
            {installCopy.title}
          </div>
          <div style={{ color: '#d5d8e4', fontSize: 13, lineHeight: 1.35 }}>
            {showIosInstallHint ? installCopy.descIos : installCopy.descPrompt}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {!showIosInstallHint && deferredInstallPrompt && (
              <Btn onClick={handleInstallApp} color="#FFD700" style={{ color: '#0f1117', fontWeight: 900 }}>
                {installCopy.install}
              </Btn>
            )}
            <Btn
              onClick={() => {
                setShowInstallPrompt(false);
              }}
              color="#2a2a4a"
              style={{ color: '#c5cada', fontWeight: 800 }}
            >
              {installCopy.later}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );

  function acceptRoomInvite() {
    if (!roomInvite) return;
    const code = roomInvite.roomCode;
    setRoomInvite(null);
    setInviteJoinCode(code);
    setPhase('onlineMenu');
  }

  // â”€â”€ Handle voluntary leave from room / local match â”€â”€
  function resetLocalGameState() {
    aiRunning.current = false;
    setPlayers([]);
    setDeck([]);
    setDiscard([]);
    setCp(0);
    setSelectedIdx(null);
    setLog([]);
    setModal(null);
    setWinner(null);
    setExtraPlay(false);
    setCurrentGameConfig(null);
    setPendingNeg(null);
    pendingNegRef.current = null;
    setGamePaused(false);
    setPausedMessage('');
    setShowChat(false);
    setUnreadChat(0);
    setShowPercheroModal(false);
    setHowToPlayPage(0);
    setMobileTab('mesa');
    setTurnTime(60);
  }

  function handleLeaveLocalGame() {
    if (isOnline || phase !== 'playing') return;
    const fallbackConfirm = 'Exit the AI match and return to setup?';
    const confirmText = T('leaveLocalConfirm');
    if (typeof window !== 'undefined' && !window.confirm(confirmText === 'leaveLocalConfirm' ? fallbackConfirm : confirmText)) return;
    resetLocalGameState();
    setPhase('setup');
  }

  function handleVoluntaryLeave() {
    if (!isOnline || !roomCode) return;
    socket.emit('voluntaryLeave', { code: roomCode });
    // Don't disconnect socket â€” keep it alive for potential rejoin
    setPhase('leftRoom');
  }

  function resetOnlineRoomState() {
    setIsOnline(false);
    setIsHost(false);
    setMyPlayerIdx(0);
    setRoomCode('');
    setRoomIsPublic(false);
    setRoomDisplayName('');
    setLobbyPlayers([]);
    clearRoomSession();
    setGamePaused(false);
    setPausedMessage('');
    setShowChat(false);
    setUnreadChat(0);
  }

  function goToOnlineHub(tab = 'lobby') {
    if (phase === 'playing' && !isOnline) {
      resetLocalGameState();
    }
    if (isOnline && roomCode) {
      socket.emit('leaveRoom');
      socket.disconnect();
      resetOnlineRoomState();
    }
    setInviteJoinCode('');
    setOnlineMenuTab(tab);
    setShowQuickMenu(false);
    setPhase('onlineMenu');
  }

  function goToHome() {
    if (phase === 'playing' && !isOnline) {
      resetLocalGameState();
    }
    if (isOnline && roomCode) {
      socket.emit('leaveRoom');
      socket.disconnect();
      resetOnlineRoomState();
    }
    setInviteJoinCode('');
    setOnlineMenuTab('');
    setProfileUserId(null);
    setShowQuickMenu(false);
    setPhase(getSavedUser() ? 'setup' : 'auth');
  }

  function goToFriends() {
    if (phase === 'playing' && !isOnline) {
      resetLocalGameState();
    }
    if (isOnline && roomCode) {
      socket.emit('leaveRoom');
      socket.disconnect();
      resetOnlineRoomState();
    }
    setInviteJoinCode('');
    setOnlineMenuTab('');
    setProfileUserId(null);
    setShowQuickMenu(false);
    if (getSavedUser()) {
      socket.connect();
      setPhase('friends');
    } else {
      setPhase('auth');
    }
  }

  function goToProfile() {
    if (phase === 'playing' && !isOnline) {
      resetLocalGameState();
    }
    if (isOnline && roomCode) {
      socket.emit('leaveRoom');
      socket.disconnect();
      resetOnlineRoomState();
    }
    setInviteJoinCode('');
    setOnlineMenuTab('');
    setShowQuickMenu(false);
    if (getSavedUser()) {
      const saved = getSavedUser();
      setProfileUserId(saved?.id || null);
      setProfileReturnPhase('setup');
      setPhase('profile');
    } else {
      setPhase('auth');
    }
  }

  function openProfile(targetUserId, returnPhase = phase) {
    if (!targetUserId) return;
    setProfileUserId(targetUserId);
    setProfileReturnPhase(returnPhase || (user ? 'setup' : 'auth'));
    setShowQuickMenu(false);
    setPhase('profile');
  }

  function handleQuickLeaveGame() {
    if (phase !== 'playing') return;
    if (isOnline) {
      goToOnlineHub('lobby');
      return;
    }
    handleLeaveLocalGame();
    setShowQuickMenu(false);
  }

  // â”€â”€ Auto-rejoin on page load â”€â”€
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
          setCurrentGameConfig(gameState.gameConfig || null);
          setModal(null);
          setPendingNeg(gameState.pendingNeg || null);
          if (gameState.winner) { setWinner(gameState.winner); clearRoomSession(); setPhase('gameover'); }
          else setPhase('playing');
        } else if (!host) {
          // Non-host: stateUpdate will arrive from host within 80ms
          setPhase('playing');
        } else {
          // Host but no cached state (edge case) â€” go to lobby
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

  // â”€â”€ Socket: lobby updates (hat picks from others) â”€â”€
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

  // â”€â”€ Socket: non-host receives full game state from host â”€â”€
  useEffect(() => {
    if (!isOnline || isHost) return;
    socket.on('stateUpdate', ({ state }) => {
      setPlayers(state.players);
      setDeck(state.deck);
      setDiscard(state.discard);
      setCp(state.cp);
      setLog(state.log);
      setExtraPlay(state.extraPlay || false);
      setCurrentGameConfig(state.gameConfig || null);
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

  // â”€â”€ Socket: host syncs state to all clients after every change â”€â”€
  const syncRef = useRef(null);
  useEffect(() => {
    clearTimeout(syncRef.current);
    if (!isOnline || !isHost || phase !== 'playing') return;
    syncRef.current = setTimeout(() => {
      const privateModals = ['manual_cambiar', 'manual_cambiar_discard', 'manual_agregar', 'wildcard', 'basurero', 'pickHatReplace', 'pickHatExchange', 'ingredientInfo', 'pickTarget', 'pickIngredient', 'pickIngredientRemote'];
      const syncModal = modal && privateModals.includes(modal.type) ? null : modal;
      socket.emit('syncState', {
        code: roomCode,
        state: { players, deck, discard, cp, log, extraPlay, modal: syncModal, pendingNeg, winner, gameConfig: currentGameConfig, phase: 'playing' },
      });
    }, 80);
    return () => clearTimeout(syncRef.current);
  }, [players, deck, discard, cp, log, extraPlay, modal, pendingNeg, winner, currentGameConfig, phase, isOnline, isHost]);

  // â”€â”€ Socket: host processes remote player actions â”€â”€
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

  // â”€â”€ NegaciÃ³n: check before applying any action â”€â”€
  // resolveCallback: () => void  â€” called if action is NOT negated
  function startNegCheck(actingIdx, card, resolveCallback, affectedIdxs) {
    const pls = playersRef.current;
    // Find players who can negate (only affected players with a negaciÃ³n card)
    const eligible = pls.map((_, i) => i).filter(i =>
      i !== actingIdx && pls[i].hand.some(c => c.action === 'negacion') &&
      (!affectedIdxs || affectedIdxs.includes(i))
    );

    if (eligible.length === 0) { resolveCallback(); return; }

    // AI players decide immediately (25% chance to use negaciÃ³n)
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
    // Remove one negaciÃ³n card from negator's hand
    const nIdx = newPls[negatorIdx].hand.findIndex(c => c.action === 'negacion');
    const negCard = nIdx !== -1 ? newPls[negatorIdx].hand.splice(nIdx, 1)[0] : null;
    const newDiscard = [...discardRef.current, card, ...(negCard ? [negCard] : [])];
    addLog(negatorIdx, `usÃ³ ðŸš« NegaciÃ³n contra ${newPls[actingIdx].name}!`, newPls);
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
    // Passed â€” record and check if all responded
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
  function buildGameConfig(gameConfig) {
    if (!gameConfig || gameConfig.mode !== 'clon') return gameConfig;
    if (Array.isArray(gameConfig.sharedBurgers) && gameConfig.sharedBurgers.length > 0) {
      return {
        ...gameConfig,
        sharedBurgers: gameConfig.sharedBurgers.map((burger) => [...burger]),
      };
    }
    return {
      ...gameConfig,
      sharedBurgers: Array.from(
        { length: gameConfig.burgerCount },
        () => genBurger(gameConfig.ingredientCount, gameConfig.ingredientPool),
      ),
    };
  }
  function startGame(name, hat, gameConfig, aiCount) {
    const rawDeck = generateDeck();
    const deckArr = [...rawDeck];
    const normalizedConfig = buildGameConfig(gameConfig);
    const ps = [];
    ps.push(initPlayer(name, deckArr, hat, normalizedConfig, false));
    const usedHats = [hat];
    const aiNames = shuffle([...AI_NAMES, 'Maestro Cocinero', 'Hambre Total', 'Chef PolÃ­glota']);
    for (let i = 0; i < aiCount; i++) {
      const avail = LANGUAGES.filter(l => !usedHats.includes(l));
      const aiHat = avail.length ? shuffle(avail)[0] : shuffle(LANGUAGES)[0];
      usedHats.push(aiHat);
      ps.push(initPlayer(aiNames[i % aiNames.length], deckArr, aiHat, normalizedConfig, true));
    }
    setPlayers(ps); setDeck(deckArr); setDiscard([]);
    setCp(0); setLog([]); setSelectedIdx(null); setModal(null);
    setWinner(null); setExtraPlay(false); setCurrentGameConfig(normalizedConfig);
    aiRunning.current = false;
    setPhase('playing');
  }

  // â”€â”€ Start game (online host) â”€â”€
  function startOnlineGame(hatPicks, gameConfig, onlinePls) {
    const rawDeck = generateDeck();
    const deckArr = [...rawDeck];
    const normalizedConfig = buildGameConfig(gameConfig);
    const ps = onlinePls.map(p => initPlayer(p.name, deckArr, hatPicks[p.name], normalizedConfig, false));
    // Mark non-host players as remote
    ps.forEach((p, i) => { if (i !== 0) p.isRemote = true; });
    setPlayers(ps); setDeck(deckArr); setDiscard([]);
    setCp(0); setLog([]); setSelectedIdx(null); setModal(null);
    setWinner(null); setExtraPlay(false); setCurrentGameConfig(normalizedConfig);
    aiRunning.current = false;
    // Update session to reflect game started
    const session = getRoomSession();
    if (session) saveRoomSession({ ...session, phase: 'playing' });
    setPhase('playing');
  }

  // â”€â”€ Shared targeted action resolution (used by host for both local and remote players) â”€â”€
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

  // â”€â”€ Host: process remote player action â”€â”€
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
              addLog(idx, `jugÃ³ ${getIngName(card.ingredient, card.language)} ${ING_EMOJI[card.ingredient]}`, pls);
              pls[idx].hand.splice(action.cardIdx, 1);
              pls[idx].table.push(card.ingredient);
              const { player: up, freed, done } = advanceBurger(pls[idx]);
              pls[idx] = up;
              di = [...di, card];
              if (done) { freed.forEach(ing => di.push({ type: 'ingredient', ingredient: ingKey(ing), id: uid() })); addLog(idx, 'Â¡completÃ³ una hamburguesa! ðŸŽ‰', pls); }
              setTimeout(() => endTurnFromRemote(pls, dk, di, idx), 0);

            } else if (type === 'playWildcard') {
              const card = pls[idx].hand[action.cardIdx];
              if (!card) return;
              addLog(idx, 'jugÃ³ ðŸŒ­ ComodÃ­n', pls);
              pls[idx].hand.splice(action.cardIdx, 1);
              pls[idx].table.push('perrito|' + action.ingredient);
              const { player: up, freed, done } = advanceBurger(pls[idx]);
              pls[idx] = up;
              di = [...di, card];
              if (done) { freed.forEach(ing => di.push({ type: 'ingredient', ingredient: ingKey(ing), id: uid() })); addLog(idx, 'Â¡completÃ³ una hamburguesa! ðŸŽ‰', pls); }
              setTimeout(() => endTurnFromRemote(pls, dk, di, idx), 0);

            } else if (type === 'discard') {
              const card = pls[idx].hand[action.cardIdx];
              if (!card) return;
              addLog(idx, `descartÃ³ una carta`, pls);
              pls[idx].hand.splice(action.cardIdx, 1);
              di = [...di, card];
              setTimeout(() => endTurnFromRemote(pls, dk, di, idx), 0);

            } else if (type === 'playMass') {
              const card = pls[idx].hand[action.cardIdx];
              if (!card) return;
              const info = getActionInfo(card.action);
              addLog(idx, `jugÃ³ ${info.name} ${info.emoji}`, pls);
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
              addLog(idx, `jugÃ³ ${info.name} ${info.emoji} contra ${pls[ti].name}`, pls);
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
                addLog(idx, 'rescatÃ³ una carta del ðŸ—‘ï¸ basurero', pls);
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
              addLog(idx, `cambiÃ³ sombrero a ${action.hatLang} (descartÃ³ ${discarded.length} cartas)`, pls);
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
              addLog(idx, `agregÃ³ sombrero ${action.hatLang} â€” mano mÃ¡x reducida a ${p.maxHand}`, pls);
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

  // â”€â”€ Check win â”€â”€
  function checkWin(pls) {
    return pls.find(p => p.currentBurger >= p.totalBurgers) || null;
  }

  // â”€â”€ End turn â”€â”€
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
          state: { players: newPls, deck: newDeck, discard: newDiscard, cp, log, extraPlay, modal: null, pendingNeg: null, winner: w, gameConfig: currentGameConfig, phase: 'playing' },
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

  // â”€â”€ AI Turn â”€â”€
  function runAITurn(pls, deckArr, discardArr, idx) {
    if (aiRunning.current) return;
    aiRunning.current = true;
    const p = pls[idx];

    // Priority 1: Play playable ingredient
    const playableIdx = p.hand.findIndex(c => c.type === 'ingredient' && canPlayCard(p, c));
    if (playableIdx !== -1) {
      const card = p.hand[playableIdx];
      addLog(idx, `jugÃ³ ${getIngName(card.ingredient, card.language)} ${ING_EMOJI[card.ingredient]}`, pls);
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
      if (done) { freed.forEach(ing => newDiscard.push({ type: 'ingredient', ingredient: ingKey(ing), id: `f${Date.now()}${Math.random()}` })); addLog(idx, 'Â¡completÃ³ una hamburguesa! ðŸŽ‰', newPls); }
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
      addLog(idx, `jugÃ³ ${info.name} ${info.emoji}`, pls);

      const mass = ['milanesa', 'ensalada', 'pizza', 'parrilla', 'comecomodines'];
      if (mass.includes(card.action)) {
        const r = applyMass(newPls, newDiscard, card.action, idx);
        newPls = r.players; newDiscard = r.discard;
      } else if (card.action === 'gloton') {
        newPls[richest].table.forEach(ing => newDiscard.push({ type: 'ingredient', ingredient: ingKey(ing), id: `g${Date.now()}${Math.random()}` }));
        newPls[richest].table = [];
        addLog(idx, `vaciÃ³ la mesa de ${pls[richest].name}`, newPls);
      } else if (card.action === 'tenedor') {
        if (newPls[richest].table.length > 0) {
          const si = randInt(0, newPls[richest].table.length - 1);
          const stolen = newPls[richest].table.splice(si, 1)[0];
          newPls[idx].table.push(stolen);
          const { player: up2, freed: fr2, done: dn2 } = advanceBurger(newPls[idx]);
          newPls[idx] = up2;
          if (dn2) { fr2.forEach(ing => newDiscard.push({ type: 'ingredient', ingredient: ingKey(ing), id: `t${Date.now()}${Math.random()}` })); }
          addLog(idx, `robÃ³ ${ING_EMOJI[ingKey(stolen)]} de ${pls[richest].name}`, newPls);
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
          addLog(idx, `robÃ³ el sombrero ${stolen} de ${pls[richest].name}`, newPls);
        }
      } else if (card.action === 'intercambio_sombreros') {
        if (newPls[idx].mainHats[0] && newPls[richest].mainHats[0]) {
          const tmp = newPls[idx].mainHats[0];
          newPls[idx].mainHats[0] = newPls[richest].mainHats[0];
          newPls[richest].mainHats[0] = tmp;
          addLog(idx, `intercambiÃ³ sombreros con ${pls[richest].name}`, newPls);
        }
      } else if (card.action === 'intercambio_hamburguesa') {
        const tmp = newPls[idx].table;
        newPls[idx].table = newPls[richest].table;
        newPls[richest].table = tmp;
        filterTable(newPls[idx], newDiscard);
        filterTable(newPls[richest], newDiscard);
        addLog(idx, `intercambiÃ³ mesa con ${pls[richest].name}`, newPls);
      }

      setTimeout(() => { aiRunning.current = false; endTurn(newPls, deckArr, newDiscard, idx); }, 900);
      return;
    }

    // Priority 3: Discard least valuable
    const di2 = p.hand.findIndex(c => c.type === 'action') !== -1
      ? p.hand.findIndex(c => c.type === 'action') : 0;
    if (p.hand.length > 0) {
      addLog(idx, `descartÃ³ una carta`, pls);
      const newPls = clone(pls);
      const card = newPls[idx].hand.splice(di2, 1)[0];
      const newDiscard2 = [...discardArr, card];
      setTimeout(() => { aiRunning.current = false; endTurn(newPls, deckArr, newDiscard2, idx); }, 700);
    } else {
      aiRunning.current = false;
      endTurn(pls, deckArr, discardArr, idx);
    }
  }

  // â”€â”€ AI useEffect â”€â”€
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

  // â”€â”€ Turn timer (60s) â”€â”€
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
    addLog(cp, `se le acabÃ³ el tiempo â€” descartÃ³ ${card.type === 'ingredient' ? getIngName(card.ingredient, card.language) : getActionInfo(card.action).name}`, players);
    const newPls = clone(players);
    const discarded = newPls[cp].hand.splice(randIdx, 1)[0];
    setSelectedIdx(null);
    setModal(null);
    endTurn(newPls, deck, [...discard, discarded], cp);
  }, [turnTime]);

  // â”€â”€ Human: Play selected card â”€â”€
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
      addLog(HI, `jugÃ³ ${getIngName(card.ingredient, card.language)} ${ING_EMOJI[card.ingredient]}`, players);
      const newPls = clone(players);
      newPls[HI].hand.splice(selectedIdx, 1);
      newPls[HI].table.push(card.ingredient);
      const { player: up, freed, done } = advanceBurger(newPls[HI]);
      newPls[HI] = up;
      let newDiscard = [...discard, card];
      if (done) {
        freed.forEach(ing => newDiscard.push({ type: 'ingredient', ingredient: ingKey(ing), id: `f${Date.now()}${Math.random()}` }));
        addLog(HI, 'Â¡completÃ³ una hamburguesa! ðŸŽ‰', newPls);
      }
      setSelectedIdx(null);
      setExtraPlay(false);
      endTurn(newPls, deck, newDiscard, HI);

    } else if (card.type === 'action') {
      humanPlayAction(card, selectedIdx);
    }
  }

  // â”€â”€ Non-host: action card dispatch via socket â”€â”€
  function humanPlayActionRemote(card, cardIdx) {
    const mass = ['milanesa', 'ensalada', 'pizza', 'parrilla', 'comecomodines'];
    if (mass.includes(card.action)) {
      socket.emit('playerAction', { code: roomCode, action: { type: 'playMass', cardIdx } });
      setSelectedIdx(null);
    } else if (card.action === 'basurero') {
      const ingCards = discard.filter(c => c.type === 'ingredient');
      if (ingCards.length === 0) { alert('El basurero estÃ¡ vacÃ­o'); return; }
      setModal({ type: 'basurero', cardIdx, cards: ingCards });
    } else if (['tenedor', 'ladron', 'intercambio_sombreros', 'intercambio_hamburguesa', 'gloton'].includes(card.action)) {
      setModal({ type: 'pickTarget', cardIdx, action: card.action });
    } else if (card.action === 'negacion') {
      alert('NegaciÃ³n se juega automÃ¡ticamente cuando un oponente juega una acciÃ³n.');
    }
  }

  function humanPlayAction(card, cardIdx) {
    const info = getActionInfo(card.action);
    const mass = ['milanesa', 'ensalada', 'pizza', 'parrilla', 'comecomodines'];
    const targeted = ['tenedor', 'ladron', 'intercambio_sombreros', 'intercambio_hamburguesa', 'gloton'];

    if (card.action === 'negacion') {
      alert('NegaciÃ³n se juega automÃ¡ticamente cuando un oponente juega una acciÃ³n.');
      return;
    }

    // Targeted actions: pick target FIRST, then negation check (only target can negate)
    if (targeted.includes(card.action)) {
      setSelectedIdx(null);
      setModal({ type: 'pickTarget', cardIdx, action: card.action });
      return;
    }

    setSelectedIdx(null);
    addLog(HI, `jugÃ³ ${info.name} ${info.emoji}`, players);

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
    addLog(HI, `descartÃ³ ${card.type === 'ingredient' ? getIngName(card.ingredient, card.language) : getActionInfo(card.action).name}`, players);
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
    addLog(HI, 'jugÃ³ ðŸŒ­ ComodÃ­n', players);
    const newPls = clone(players);
    newPls[HI].hand.splice(cardIdx, 1);
    newPls[HI].table.push('perrito|' + chosenIng);
    const { player: up, freed, done } = advanceBurger(newPls[HI]);
    newPls[HI] = up;
    let newDiscard = [...discard, card];
    if (done) {
      freed.forEach(ing => newDiscard.push({ type: 'ingredient', ingredient: ingKey(ing), id: `f${Date.now()}${Math.random()}` }));
      addLog(HI, 'Â¡completÃ³ una hamburguesa! ðŸŽ‰', newPls);
    }
    setExtraPlay(false);
    endTurn(newPls, deck, newDiscard, HI);
  }

  // â”€â”€ Modal resolvers â”€â”€
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
    addLog(HI, `jugÃ³ ${info.name} ${info.emoji} contra ${players[targetIdx].name}`, players);

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
        addLog(HI, `robÃ³ el sombrero ${stolen}`, newPls);
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
    if (done) { freed.forEach(ing => fd = [...fd, { type: 'ingredient', ingredient: ingKey(ing), id: `t${Date.now()}` }]); addLog(HI, 'Â¡completÃ³ una hamburguesa! ðŸŽ‰', newPls); }
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

  // Manual: swap main hat from perchero (costs half your hand â€” player chooses which cards)
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
    addLog(HI, `cambiÃ³ sombrero a ${hatLang} (descartÃ³ ${cost} carta${cost !== 1 ? 's' : ''}) â€” puede jugar un ingrediente`, newPls);
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
    addLog(HI, `agregÃ³ sombrero ${hatLang} â€” mano mÃ¡x reducida a ${p.maxHand}`, newPls);
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
      addLog(HI, 'rescatÃ³ una carta del ðŸ—‘ï¸ basurero', newPls);
    }
    endTurn(newPls, deck, newDiscard, HI);
  }

  // â”€â”€ Render phases â”€â”€
  // â”€â”€ Room invite toast overlay (shown on any screen when invite received) â”€â”€
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
      }}>{'\u00D7'}</button>
    </div>
  );

  // â”€â”€ Friend request toast overlay (shown on any screen) â”€â”€
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
          {'\u{1F91D}'} {friendReqNotif.fromDisplayName} {T('friendRequestNotif')}
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
      }}>{'\u00D7'}</button>
    </div>
  );

  const handleLeftRoomReturn = () => {
    const reconnectId = sessionStorage.getItem('hp_reconnect_id');
    const timeout = setTimeout(() => {
      socket.off('rejoinSuccess');
      socket.off('rejoinError');
      clearRoomSession();
      setIsOnline(false);
      setIsHost(false);
      setMyPlayerIdx(0);
      setRoomCode('');
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
          if (gameState.winner) {
            setWinner(gameState.winner);
            clearRoomSession();
            setPhase('gameover');
          } else {
            setPhase('playing');
          }
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
      setIsOnline(false);
      setIsHost(false);
      setMyPlayerIdx(0);
      setRoomCode('');
      setPhase(getSavedUser() ? 'setup' : 'auth');
    });

    if (socket.connected) {
      socket.emit('rejoinRoom', { reconnectId, roomCode });
    } else {
      socket.once('connect', () => socket.emit('rejoinRoom', { reconnectId, roomCode }));
      socket.connect();
    }
  };

  const handleLeftRoomLeave = () => {
    const reconnectId = sessionStorage.getItem('hp_reconnect_id');
    socket.emit('permanentLeave', { code: roomCode, reconnectId });
    socket.disconnect();
    resetOnlineRoomState();
    setPhase('setup');
  };

  const quickMenu = (
    <div style={{ position: 'fixed', top: isMobile ? 10 : 16, right: isMobile ? 10 : 16, zIndex: 3000 }}>
      {showQuickMenu && (
        <button
          aria-label="Close menu"
          onClick={() => setShowQuickMenu(false)}
          style={{ position: 'fixed', inset: 0, border: 'none', background: 'transparent', cursor: 'default' }}
        />
      )}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowQuickMenu(v => !v)}
          style={{
            width: isMobile ? 42 : 46,
            height: isMobile ? 42 : 46,
            borderRadius: 14,
            border: '2px solid rgba(255,215,0,.45)',
            background: 'rgba(18,25,46,.96)',
            color: '#FFD700',
            fontSize: 22,
            fontWeight: 900,
            cursor: 'pointer',
            boxShadow: '0 10px 24px rgba(0,0,0,.35)',
          }}
        >
          ☰
        </button>
        {showQuickMenu && (
          <div style={{
            position: 'absolute',
            top: isMobile ? 50 : 54,
            right: 0,
            minWidth: isMobile ? 188 : 210,
            padding: 10,
            borderRadius: 16,
            background: 'rgba(22,33,62,.98)',
            border: '2px solid rgba(255,215,0,.18)',
            boxShadow: '0 18px 40px rgba(0,0,0,.45)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            <Btn onClick={goToHome} color="#4ecdc4" style={{ color: '#0f1117', width: '100%', justifyContent: 'center' }}>
              {T('homeMenu')}
            </Btn>
            <Btn onClick={goToFriends} color="#7ad8ff" style={{ color: '#102033', width: '100%', justifyContent: 'center' }}>
              {T('friends')}
            </Btn>
            <Btn onClick={goToProfile} color="#c8a2ff" style={{ color: '#1f1530', width: '100%', justifyContent: 'center' }}>
              {T('profileMenu')}
            </Btn>
            {phase === 'playing' && (
              <Btn onClick={handleQuickLeaveGame} color="#ff4444" style={{ color: '#fff', width: '100%', justifyContent: 'center' }}>
                {T('leaveLocal')}
              </Btn>
            )}
            <Btn onClick={() => goToOnlineHub('create')} color="#FFD700" style={{ color: '#111', width: '100%', justifyContent: 'center' }}>
              {T('createRoom')}
            </Btn>
            <Btn onClick={() => goToOnlineHub('join')} color="#00BCD4" style={{ color: '#0f1117', width: '100%', justifyContent: 'center' }}>
              {T('joinBtn')}
            </Btn>
            <Btn onClick={() => goToOnlineHub('lobby')} color="#2a2a4a" style={{ color: '#fff', width: '100%', justifyContent: 'center' }}>
              {T('lobby')}
            </Btn>
          </div>
        )}
      </div>
    </div>
  );

  if (phase !== 'playing') {
    return (
      <>
        {quickMenu}
        <AppPhaseRouter
          phase={phase}
          T={T}
          roomCode={roomCode}
          user={user}
          uiLang={uiLang}
          handleSetLang={handleSetLang}
          installEntryVisible={canOpenInstallPrompt}
          installEntryTitle={installCopy.title}
          installEntryDesc={showIosInstallHint ? installCopy.descIos : installCopy.descPrompt}
          installEntryButton={showIosInstallHint ? installCopy.title : installCopy.install}
          openInstallPrompt={openInstallPrompt}
          downloadUrl={appDownloadUrl}
          downloadReturnPhase={downloadReturnPhase}
          setDownloadReturnPhase={setDownloadReturnPhase}
          profileUserId={profileUserId}
          profileReturnPhase={profileReturnPhase}
          openProfile={openProfile}
          inviteToast={inviteToast}
          friendReqToast={friendReqToast}
          setUser={setUser}
          setPhase={setPhase}
          startGame={startGame}
          socket={socket}
          setInviteJoinCode={setInviteJoinCode}
          inviteJoinCode={inviteJoinCode}
          onlineMenuTab={onlineMenuTab}
          initialSalaCode={initialSalaCode}
          setIsOnline={setIsOnline}
          setIsHost={setIsHost}
          setMyPlayerIdx={setMyPlayerIdx}
          setRoomCode={setRoomCode}
          setRoomIsPublic={setRoomIsPublic}
          setRoomDisplayName={setRoomDisplayName}
          setLobbyPlayers={setLobbyPlayers}
          saveRoomSession={saveRoomSession}
          lobbyPlayers={lobbyPlayers}
          myPlayerIdx={myPlayerIdx}
          isHost={isHost}
          roomIsPublic={roomIsPublic}
          roomDisplayName={roomDisplayName}
          startOnlineGame={startOnlineGame}
          clearRoomSession={clearRoomSession}
          players={players}
          HI={HI}
          extraPlay={extraPlay}
          winner={winner}
          isOnline={isOnline}
          onLeftRoomReturn={handleLeftRoomReturn}
          onLeftRoomLeave={handleLeftRoomLeave}
        />
        {installBanner}
      </>
    );
  }

  if (!players.length) return null;

  // â”€â”€ Playing screen â”€â”€
  const human = players[HI] || players[0];
  const opponents = players.filter((_, i) => i !== HI);
  const isHumanTurn = cp === HI;
  const burger = human.burgers[human.currentBurger];
  const humanColor = PLAYER_COLORS[HI % PLAYER_COLORS.length];
  const hasSharedGoals = currentGameConfig?.mode === 'clon' && Array.isArray(currentGameConfig?.sharedBurgers) && currentGameConfig.sharedBurgers.length > 0;

  // Card playability
  const getPlayable = (card, idx) => {
    if (!isHumanTurn || extraPlay) {
      if (card.type !== 'ingredient') return null;
    }
    if (card.type === 'ingredient') return canPlayCard(human, card) ? true : false;
    return null; // action cards always selectable
  };

  const handN = human.hand.length;
  const MAX_ANGLE = isMobile ? 12 : 14;
  const OVERLAP = isMobile ? 20 : 18;

  // â”€â”€ Panel: Rivals (left sidebar) â”€â”€
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

  // â”€â”€ Panel: Mesa (center) â€” section blocks â”€â”€

  const playerHeader = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'rgba(255,215,0,.06)', borderRadius: 12, padding: '8px 14px',
      border: '2px solid rgba(255,215,0,.2)', flexShrink: 0,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 900, fontSize: 16, color: humanColor }}>{human.name}</div>
        <div style={{ fontSize: 11, color: '#777' }}>
          {'\u{1F354}'} {human.currentBurger}/{human.totalBurgers} {String(T('burgersLabel')).toLowerCase()}
          {extraPlay && <span style={{ color: '#FFD700', marginLeft: 8 }}>{T('extraPlayLabel')}</span>}
        </div>
        {hasSharedGoals && (
          <div style={{
            marginTop: 6,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 999,
            background: 'rgba(78,205,196,0.12)',
            border: '1px solid rgba(78,205,196,0.35)',
            color: '#7be7dd',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
          }}>
            <span>{'\u{1F91D}'}</span>
            <span>{T('sharedGoalsLabel')}</span>
          </div>
        )}
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
      <div style={{ fontSize: 11, fontWeight: 800, color: '#555', letterSpacing: 1, marginBottom: 6 }}>{T('table')}</div>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: 4, flexWrap: 'wrap' }}>
        {human.burgers.slice(0, human.currentBurger + 1).map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: i === human.currentBurger ? '#FFD700' : '#555', width: 14, fontWeight: 700 }}>
              {i < human.currentBurger ? '\u2714' : i === human.currentBurger ? '\u25B6' : '\u25CB'}
            </span>
            <BurgerTarget
              ingredients={b}
              table={i === human.currentBurger ? human.table : i < human.currentBurger ? b : []}
              isCurrent={i === human.currentBurger}
              onIngredientClick={(ing) => setModal({ type: 'ingredientInfo', ingredient: ing })}
            />
          </div>
        ))}
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
        <div style={{ position: 'relative', width: 130, height: 165 }}>
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
                <HatSVG lang={h} size={24} />
                <span style={{
                  fontSize: h === 'inglés' ? 8 : 7,
                  fontWeight: 900,
                  color: h === 'inglés' ? '#FFD700' : LANG_TEXT[h],
                  letterSpacing: 0.5,
                  marginTop: -2,
                  textShadow: h === 'inglés' ? '0 1px 2px rgba(0,0,0,0.6)' : 'none',
                }}>
                  {getLocalizedLangShort(h, uiLang)}
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
          padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(156,39,176,0.3)',
          background: 'rgba(156,39,176,0.12)', color: '#BA68C8', fontSize: 13,
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
            padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(156,39,176,0.3)',
            background: 'rgba(156,39,176,0.12)', color: '#BA68C8', fontSize: 13,
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
          {'\u26A0'} {T('maxReduced')}: {addedHats.map(h => (
            <HatBadge key={h} lang={h} isMain size="sm" />
          ))}
        </span>
      )}
    </div>
  );

  const turnActionIndicators = (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0, alignItems: 'center' }}>
      <button
        onClick={() => { setHowToPlayPage(0); setModal({ type: 'howToPlay' }); }}
        style={{
          fontSize: 11,
          color: '#4ecdc4',
          fontWeight: 800,
          letterSpacing: 1,
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          textDecoration: 'underline',
          textUnderlineOffset: 3,
          fontFamily: 'inherit',
        }}
      >
        <span style={{ marginRight: 4 }}>{'\u{1F4D6}'}</span>
        {T('turnActionsLabel')}
      </button>
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
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 2 }}>
                      {ING_IMG[card.ingredient]
                        ? <img src={ING_IMG[card.ingredient]} alt={card.ingredient} style={{ width: 28, height: 28, objectFit: 'contain' }} />
                        : <span style={{ fontSize: 24 }}>{ING_EMOJI[card.ingredient]}</span>}
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{getIngName(card.ingredient, card.language)}</span>
                    {card.ingredient === 'perrito' && (
                      <span style={{ fontSize: 12, color: '#ccc' }}>{T('wildcardChoose')}</span>
                    )}
                    {canPlayCard(human, card)
                      ? <span style={{ color: '#4CAF50', fontSize: 12 }}>{T('canPlay')}</span>
                      : <span style={{ color: '#FF7043', fontSize: 12 }}>{T('cantPlay')}</span>}
                  </>) : (<>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#FFD700' }}>{getActionText(card.action)?.name}</span>
                    <span style={{ fontSize: 12, color: '#ccc' }}>{getActionText(card.action)?.desc}</span>
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
        <span style={{ color: '#FFD700' }}>{'\u26A1'} {getActionText(human.hand[selectedIdx]?.action)?.desc}</span>
      )}
    </div>
  );

  const actionButtons = isHumanTurn && extraPlay && (
    <div style={{
      position: 'absolute',
      right: isMobile ? 12 : 16,
      bottom: isMobile ? 72 : 16,
      zIndex: 30,
      display: 'flex',
      gap: 8,
    }}>
      <Btn onClick={() => {
        if (isOnline && !isHost) {
          socket.emit('playerAction', { code: roomCode, action: { type: 'passTurn' } });
        } else {
          setExtraPlay(false); endTurn(players, deck, discard, HI);
        }
      }} color="#888" style={{ boxShadow: '0 10px 24px rgba(0,0,0,.35)' }}>
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
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '12px 16px', gap: 10 }}>
      {playerHeader}
      {turnActionIndicators}
      {isMobile ? (
        <>
          {burgersSection}
          {hatsSection}
          {handLabel}
          {handFan}
          {actionButtons}
          {turnStatus}
        </>
      ) : (
        <>
          {burgersAndHatsRow}
          {actionButtons}
          {handLabel}
          {handFan}
          {turnStatus}
        </>
      )}
    </div>
  );

  // â”€â”€ Panel: Mano (right sidebar) â”€â”€
  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: '#0f1117', fontFamily: "'Fredoka',sans-serif", overflow: 'hidden', position: 'relative',
    }}>
      {quickMenu}
      {installBanner}

      {/* â”€â”€ Header â”€â”€ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 12, padding: isMobile ? '6px 10px' : '8px 16px',
        background: '#16213e', borderBottom: '2px solid #2a2a4a', flexShrink: 0,
      }}>
        <span style={{ fontSize: 22 }}>{'\u{1F354}'}</span>
        {!isMobile && <span style={{ fontWeight: 900, fontSize: 16, color: '#FFD700' }}>HUNGRY POLY</span>}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: isMobile ? 6 : 12, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#555' }}>Deck: {deck.length}</span>
          <span style={{ fontSize: 12, color: '#555' }}>Discard: {discard.length}</span>
          <div style={{
            background: isHumanTurn ? 'rgba(255,215,0,.15)' : 'rgba(0,188,212,.15)',
            border: `1px solid ${isHumanTurn ? '#FFD700' : '#00BCD4'}`,
            borderRadius: 8, padding: isMobile ? '3px 6px' : '3px 10px', fontSize: isMobile ? 11 : 12, fontWeight: 700,
            color: isHumanTurn ? '#FFD700' : '#00BCD4',
          }}>
            {isHumanTurn ? (extraPlay ? T('extraPlayLabel') : T('yourTurnLabel')) : (typeof T('waitingPlayer') === 'function' ? T('waitingPlayer')(players[cp]?.name) : `${'\u23F3'} ${players[cp]?.name}`)}
          </div>
          {isOnline && !isMobile && (
            <div style={{ fontSize: 11, color: '#555', padding: '3px 8px', borderRadius: 6, background: 'rgba(0,188,212,.08)', border: '1px solid rgba(0,188,212,.2)' }}>
              {'\u{1F310}'} {T('room')}: {roomCode}
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
            </>
          )}
        </div>
      </div>

      {/* â”€â”€ Game paused overlay (opponent left or alone) â”€â”€ */}
      {gamePaused && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
          background: 'rgba(0,0,0,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Fredoka',sans-serif",
        }}>
          <div style={{ textAlign: 'center', padding: 32 }}>
            {pausedMessage === 'alone' ? (
              <>
                <div style={{ fontSize: 48, marginBottom: 16 }}>ðŸ˜”</div>
                <h2 style={{ color: '#FFD700', fontSize: 22, fontWeight: 900, marginBottom: 12 }}>{T('aloneTitle')}</h2>
                <p style={{ color: '#aaa', fontSize: 15, marginBottom: 24 }}>{T('aloneDesc')}</p>
              </>
            ) : (
              <>
                <div style={{ fontSize: 48, marginBottom: 16 }}>â¸ï¸</div>
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

      {/* â”€â”€ Main area â”€â”€ */}
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

      {/* â”€â”€ Modals â”€â”€ */}

      {/* Pick Target */}
      {modal?.type === 'pickTarget' && (
        <Modal title={`${getActionInfo(modal.action)?.emoji} ${getActionInfo(modal.action)?.name} â€” ${T('chooseOpponent')}`}>
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
                      {T('tableLabel')}: {p.table.map(ing => ING_EMOJI[ingKey(ing)]).join(' ') || T('empty')} â€¢
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

      {/* Pick Hat Replace (after LadrÃ³n steals last hat) */}
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
                  {T(h)}
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
                      {T(h)}
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
                      {T(h)}
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
        <Modal title={T('closet')}>
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
        const cleanTitle = (txt) => String(txt).replace('🃏 ', '').replace('🃏', '').replace('⚡ ', '').replace('⚡', '');
        const actionTypeIcon = (() => {
          if (card.type !== 'action') return null;
          if (['tenedor', 'ladron', 'intercambio_sombreros', 'intercambio_hamburguesa', 'gloton'].includes(card.action)) return eqRightSingle;
          if (['milanesa', 'ensalada', 'pizza', 'parrilla', 'comecomodines'].includes(card.action)) return eqRightGlobal;
          if (card.action === 'basurero') return eqRightDiscard;
          if (card.action === 'negacion') return eqRightNegation;
          return eqRightSingle;
        })();
        const mobileTitle = card.type === 'ingredient'
          ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <img src={ingredientCardIcon} alt={cleanTitle(T('ingredientCard'))} style={{ width: 22, height: 22, objectFit: 'contain' }} />
              <span>{cleanTitle(T('ingredientCard'))}</span>
            </span>
          )
          : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {actionTypeIcon && <img src={actionTypeIcon} alt={cleanTitle(T('actionCard'))} style={{ width: 22, height: 22, objectFit: 'contain' }} />}
              <span>{cleanTitle(T('actionCard'))}</span>
            </span>
          );
        return (
          <Modal title={mobileTitle}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <GameCard card={card} selected playable={playable} large />
              <div style={{
                fontSize: 14, textAlign: 'center', padding: '8px 14px', borderRadius: 8,
                background: 'rgba(0,0,0,0.5)', color: '#ddd',
                display: 'flex', flexDirection: 'column', gap: 4, width: '100%',
              }}>
                {card.type === 'ingredient' ? (<>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 2 }}>
                    {ING_IMG[card.ingredient]
                      ? <img src={ING_IMG[card.ingredient]} alt={card.ingredient} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                      : <span style={{ fontSize: 26 }}>{ING_EMOJI[card.ingredient]}</span>}
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{getIngName(card.ingredient, card.language)}</span>
                  {card.ingredient === 'perrito' && (
                    <span style={{ fontSize: 13, color: '#ccc' }}>{T('wildcardChoose')}</span>
                  )}
                  {canPlayCard(human, card)
                    ? <span style={{ color: '#4CAF50', fontSize: 13 }}>{T('canPlay')}</span>
                    : <span style={{ color: '#FF7043', fontSize: 13 }}>{T('cantPlay')}</span>}
                </>) : (<>
                  <span style={{ fontWeight: 700, fontSize: 16, color: '#FFD700' }}>{getActionText(card.action)?.name}</span>
                  <span style={{ fontSize: 13, color: '#ccc' }}>{getActionText(card.action)?.desc}</span>
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

      {/* Manual: Cambiar sombrero â€” paso 1: elegir sombrero */}
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
                  {T(h)}
                </span>
              </div>
            ))}
          </div>
          <Btn onClick={() => setModal(null)} color="#333" style={{ color: '#aaa' }}>{T('cancel')}</Btn>
        </Modal>
      )}

      {/* Manual: Cambiar sombrero â€” paso 2: elegir cartas a descartar */}
      {modal?.type === 'manual_cambiar_discard' && (() => {
        const cost = Math.ceil(human.hand.length / 2);
        const sel = modal.selected;
        const remaining = cost - sel.length;
        return (
          <Modal title={typeof T('changeHatStep2') === 'function' ? T('changeHatStep2')(T(modal.hatLang)) : T('changeHatStep2')}>
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
                  {T(h)}
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

      {/* Wildcard (ComodÃ­n) modal */}
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
        const ingredientTitle = (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {ING_IMG[displayIng]
              ? <img src={ING_IMG[displayIng]} alt={displayIng} style={{ width: 22, height: 22, objectFit: 'contain' }} />
              : <span>{ING_EMOJI[displayIng]}</span>}
            <span>{getIngName(displayIng, uiGameLang) || displayIng}</span>
          </span>
        );
        const actionCardIcons = {
          milanesa: eqMilanesa,
          ensalada: eqEnsalada,
          pizza: eqPizza,
          parrilla: eqParrilla,
          tenedor: eqTenedor,
          ladron: eqLadron,
          intercambio_sombreros: eqIntercambioSomb,
          intercambio_hamburguesa: eqIntercambioHamb,
          basurero: eqBasurero,
          gloton: eqGloton,
          negacion: eqNegacion,
          comecomodines: eqComeComodines,
        };
        const specific = ING_AFFECTED_BY[displayIng] || [];
        const singleTarget = ['tenedor', 'gloton', 'intercambio_hamburguesa'];
        const allActionIds = [...new Set([
          ...specific,
          ...singleTarget,
          ...(isWildcard ? ['comecomodines'] : []),
        ])];
        return (
          <Modal title={ingredientTitle}>
            {isWildcard && chosen && (
              <p style={{ color: '#ccc', fontSize: 13, marginBottom: 12 }}>
                {typeof T('wildcardActingAs') === 'function' ? T('wildcardActingAs')(`${ING_EMOJI[chosen]} ${getIngName(chosen, uiGameLang) || chosen}`) : T('wildcardActingAs')}
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
                  }}>{getLocalizedLangShort(lang, uiLang)}</span>
                  <span style={{ color: '#ddd' }}>{getIngName(displayIng, lang)}</span>
                </div>
              ))}
            </div>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: '#FFD700', marginBottom: 8 }}>{T('affectingCards')}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              {allActionIds.map(id => {
                const info = getActionText(id);
                if (!info) return null;
                return (
                  <div key={id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '6px 10px',
                  }}>
                    <span style={{
                      width: 38,
                      height: 38,
                      minWidth: 38,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.16)',
                      border: '1px solid rgba(255,255,255,0.26)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {actionCardIcons[id]
                        ? <img src={actionCardIcons[id]} alt={info.name} style={{ width: 26, height: 26, objectFit: 'contain' }} />
                        : <span style={{ fontSize: 20 }}>{info.emoji}</span>}
                    </span>
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

      {/* How to play modal */}
      {modal?.type === 'howToPlay' && (() => {
        const actionIcons = {
          milanesa: eqMilanesa,
          ensalada: eqEnsalada,
          pizza: eqPizza,
          parrilla: eqParrilla,
          tenedor: eqTenedor,
          ladron: eqLadron,
          intercambio_sombreros: eqIntercambioSomb,
          intercambio_hamburguesa: eqIntercambioHamb,
          basurero: eqBasurero,
          gloton: eqGloton,
          negacion: eqNegacion,
          comecomodines: eqComeComodines,
        };
        const actionCategories = [
          {
            key: 'single',
            icon: eqRightSingle,
            title: T('howToPlayActionSingleTitle'),
            desc: T('howToPlayActionSingleDesc'),
            actions: ['tenedor', 'ladron', 'intercambio_sombreros', 'intercambio_hamburguesa', 'gloton'],
          },
          {
            key: 'global',
            icon: eqRightGlobal,
            title: T('howToPlayActionGlobalTitle'),
            desc: T('howToPlayActionGlobalDesc'),
            actions: ['milanesa', 'ensalada', 'pizza', 'parrilla', 'comecomodines'],
          },
          {
            key: 'discard',
            icon: eqRightDiscard,
            title: T('howToPlayActionDiscardTitle'),
            desc: T('howToPlayActionDiscardDesc'),
            actions: ['basurero'],
          },
          {
            key: 'negation',
            icon: eqRightNegation,
            title: T('howToPlayActionNegationTitle'),
            desc: T('howToPlayActionNegationDesc'),
            actions: ['negacion'],
          },
        ];
        const actionsById = ACTION_CARDS.reduce((acc, a) => {
          acc[a.id] = getActionText(a.id) || a;
          return acc;
        }, {});
        const discardedIngredientsByAction = {
          milanesa: ['pan', 'huevo'],
          ensalada: ['lechuga', 'tomate', 'cebolla', 'palta'],
          pizza: ['queso'],
          parrilla: ['pollo', 'carne'],
          comecomodines: ['perrito'],
        };
        const actionEffectById = {
          tenedor: T('howToPlayEffectTenedor'),
          ladron: T('howToPlayEffectLadron'),
          intercambio_sombreros: T('howToPlayEffectIntercambioSombreros'),
          intercambio_hamburguesa: T('howToPlayEffectIntercambioMesa'),
          gloton: T('howToPlayEffectGloton'),
        };
        const currentModeId = currentGameConfig?.mode || 'clon';
        const modeCards = [
          {
            id: 'clon',
            label: T('modeClon'),
            short: T('modeClonDesc'),
            detailed: T('modeClonDetailed'),
          },
          {
            id: 'escalera',
            label: T('modeEscalera'),
            short: T('modeEscaleraDesc'),
            detailed: T('modeEscaleraDetailed'),
          },
          {
            id: 'caotico',
            label: T('modeCaotico'),
            short: T('modeCaoticoDesc'),
            detailed: T('modeCaoticoDetailed'),
          },
        ];
        const currentModeSummary = (() => {
          if (currentModeId === 'clon') {
            const burgers = currentGameConfig?.burgerCount ?? human.totalBurgers;
            const ingredients = currentGameConfig?.ingredientCount ?? human.burgers?.[0]?.length ?? 0;
            return `${burgers} ${String(T('burgers')).toLowerCase()} · ${ingredients} ${String(T('ingredientCount')).toLowerCase()}`;
          }
          if (currentModeId === 'escalera') {
            const burgers = currentGameConfig?.burgerCount ?? human.totalBurgers;
            return `${burgers} ${String(T('burgers')).toLowerCase()} · 4+ ${String(T('ingredientCount')).toLowerCase()}`;
          }
          return `${T('modeCaotico')} · ${currentGameConfig?.chaosLevel || 2}/3`;
        })();
        const totalHowToPlayPages = 8;
        const page = Math.max(0, Math.min(howToPlayPage, totalHowToPlayPages - 1));
        const actionCategoriesByKey = actionCategories.reduce((acc, group) => {
          acc[group.key] = group;
          return acc;
        }, {});
        const actionPages = [
          { idx: 2, pageNumber: 3, label: T('howToPlayActionPageSingle') || 'Acciones: un jugador', groups: ['single'] },
          { idx: 3, pageNumber: 4, label: T('howToPlayActionPageGlobal') || 'Acciones: los demas jugadores', groups: ['global'] },
          { idx: 4, pageNumber: 5, label: T('howToPlayActionPageNegDiscard') || 'Acciones: negacion y basurero', groups: ['negation', 'discard'] },
        ];

        return (
          <Modal title={T('turnActionsLabel')}>
            <div style={{
              position: 'relative',
              background: 'linear-gradient(180deg,#b98d58 0%,#8f6a43 100%)',
              borderRadius: 14,
              border: '2px solid rgba(65,42,24,0.8)',
              padding: 10,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 10px 24px rgba(0,0,0,0.35)',
              marginBottom: 12,
            }}>
              <div style={{
                position: 'absolute',
                left: '50%',
                top: 10,
                bottom: 10,
                width: 6,
                transform: 'translateX(-50%)',
                borderRadius: 99,
                background: 'linear-gradient(180deg, rgba(52,33,20,0.45), rgba(245,225,197,0.25), rgba(52,33,20,0.45))',
                pointerEvents: 'none',
              }} />
              <div style={{
                background: 'linear-gradient(180deg,#f3e2c7 0%,#e8d2b1 100%)',
                borderRadius: 10,
                border: '1px solid rgba(82,58,36,0.35)',
                padding: '12px 14px',
                maxHeight: '52vh',
                overflowY: 'auto',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.35)',
              }}>
            <p style={{ color: '#3f3125', fontSize: 13, marginBottom: 14, display: page === 0 ? 'block' : 'none' }}>
              {T('howToPlayDesc')}
            </p>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 12, display: page === 0 ? 'block' : 'none' }}>
              <div style={{ color: '#5a4635', fontSize: 10, fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>{T('howToPlayPage')} 1</div>
              <div style={{ color: '#7A4A00', fontWeight: 800, fontSize: 14, marginBottom: 6 }}>
                {T('howToPlayTurnRulesTitle')}
              </div>
              <div style={{ color: '#3f3125', fontSize: 12, lineHeight: 1.35, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span>{T('howToPlayRuleOneCard')}</span>
                <span>{T('howToPlayRuleHatButtonsBeforePlay')}</span>
                <span>{T('howToPlayRuleHatButtonsIngredientOnly')}</span>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 12, display: page === 0 ? 'block' : 'none' }}>
              <div style={{ color: '#7A4A00', fontWeight: 800, fontSize: 14, marginBottom: 6 }}>
                {T('gameMode')}
              </div>
              <div style={{ color: '#5a4635', fontSize: 11, lineHeight: 1.35, marginBottom: 10 }}>
                {T('howToPlayModeIntro')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {modeCards.map((mode) => {
                  const isCurrentMode = mode.id === currentModeId;
                  return (
                    <div
                      key={mode.id}
                      style={{
                        borderRadius: 10,
                        padding: '10px 12px',
                        background: isCurrentMode ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.05)',
                        border: isCurrentMode ? '1px solid rgba(255,215,0,0.45)' : '1px solid rgba(82,58,36,0.18)',
                        boxShadow: isCurrentMode ? '0 0 0 1px rgba(255,215,0,0.18) inset' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ color: '#7A4A00', fontWeight: 800, fontSize: 13 }}>{mode.label}</span>
                          <span style={{
                            borderRadius: 999,
                            padding: '2px 8px',
                            fontSize: 10,
                            fontWeight: 800,
                            letterSpacing: 0.3,
                            color: isCurrentMode ? '#7A4A00' : '#6d5a48',
                            background: isCurrentMode ? 'rgba(255,215,0,0.25)' : 'rgba(90,70,53,0.08)',
                          }}>
                            {mode.short}
                          </span>
                        </div>
                        {isCurrentMode && (
                          <span style={{
                            borderRadius: 999,
                            padding: '2px 8px',
                            fontSize: 10,
                            fontWeight: 900,
                            letterSpacing: 0.4,
                            background: '#7A4A00',
                            color: '#f8e8cc',
                            textTransform: 'uppercase',
                          }}>
                            {T('currentModeBadge')}
                          </span>
                        )}
                      </div>
                      {isCurrentMode && (
                        <div style={{ color: '#7A4A00', fontSize: 10, fontWeight: 700, letterSpacing: 0.2, marginBottom: 5 }}>
                          {currentModeSummary}
                        </div>
                      )}
                      <div style={{ color: '#3f3125', fontSize: 12, lineHeight: 1.4 }}>
                        {mode.detailed}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 12, display: page === 1 ? 'block' : 'none' }}>
              <div style={{ color: '#5a4635', fontSize: 10, fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>{T('howToPlayPage')} 2</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <img src={ingredientCardIcon} alt={T('ingredientCard')} style={{ width: 22, height: 22, objectFit: 'contain' }} />
                <div style={{ color: '#7A4A00', fontWeight: 800, fontSize: 14 }}>{T('howToPlayIngredientTitle')}</div>
              </div>
              <div style={{ color: '#3f3125', fontSize: 12, lineHeight: 1.35 }}>
                {T('howToPlayIngredientDesc')}
              </div>
            </div>

            {actionPages.map((ap) => (
              <div key={`action-page-${ap.idx}`} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 14, display: page === ap.idx ? 'block' : 'none' }}>
                <div style={{ color: '#5a4635', fontSize: 10, fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>{T('howToPlayPage')} {ap.pageNumber}</div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{
                    display: 'inline-block',
                    background: 'rgba(122,74,0,0.14)',
                    border: '1px solid rgba(122,74,0,0.35)',
                    borderRadius: 999,
                    padding: '2px 10px',
                    color: '#7A4A00',
                    fontWeight: 800,
                    fontSize: 11,
                    letterSpacing: 0.4,
                  }}>
                    {ap.label}
                  </span>
                </div>
                <div style={{ color: '#7A4A00', fontWeight: 800, fontSize: 14, marginBottom: 8 }}>
                  {T('howToPlayActionTitle')}
                </div>
                <div style={{ color: '#3f3125', fontSize: 12, lineHeight: 1.35, marginBottom: 10 }}>
                  {T('howToPlayActionDesc')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {ap.groups.map((groupKey) => {
                    const group = actionCategoriesByKey[groupKey];
                    if (!group) return null;
                    return (
                      <div key={group.key} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <img src={group.icon} alt={group.title} style={{ width: 30, height: 30, objectFit: 'contain' }} />
                          <span style={{ color: '#7A4A00', fontWeight: 700, fontSize: 12 }}>{group.title}</span>
                        </div>
                        <div style={{ color: '#5a4635', fontSize: 11, lineHeight: 1.35, marginBottom: 6 }}>{group.desc}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 10px' }}>
                          {group.actions.map((actionId) => {
                            const a = actionsById[actionId];
                            if (!a) return null;
                            const discards = discardedIngredientsByAction[a.id] || [];
                            return (
                              <div key={a.id} style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#3f3125' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  {actionIcons[a.id]
                                    ? <img src={actionIcons[a.id]} alt={a.name} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                                    : <span>{a.emoji}</span>}
                                  <span>{a.name}</span>
                                </div>
                                {discards.length > 0 && (
                                  <div style={{ fontSize: 11, color: '#5a4635', display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                                    <span>{T('howToPlayOthersDiscardLabel')}</span>
                                    {discards.map((ing) => (
                                      <span key={`${a.id}-${ing}`} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 999, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                        {ING_IMG[ing]
                                          ? <img src={ING_IMG[ing]} alt={ing} style={{ width: 18, height: 18, objectFit: 'contain' }} />
                                          : <span>{ING_EMOJI[ing]}</span>}
                                        <span>{getIngName(ing, uiGameLang)}</span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {actionEffectById[a.id] && (
                                  <div style={{ fontSize: 11, color: '#5a4635' }}>
                                    <span>{T('howToPlayEffectLabel')} </span>
                                    <span>{actionEffectById[a.id]}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 12, display: page === 5 ? 'block' : 'none' }}>
              <div style={{ color: '#5a4635', fontSize: 10, fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>{T('howToPlayPage')} 6</div>
              <div style={{ color: '#7A4A00', fontWeight: 800, fontSize: 14, marginBottom: 6 }}>
                {T('howToPlayGoalTitle')}
              </div>
              <div style={{ color: '#3f3125', fontSize: 12, lineHeight: 1.35 }}>
                {T('howToPlayGoalDesc')}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 12, display: page === 6 ? 'block' : 'none' }}>
              <div style={{ color: '#5a4635', fontSize: 10, fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>{T('howToPlayPage')} 7</div>
              <div style={{ color: '#7A4A00', fontWeight: 800, fontSize: 14, marginBottom: 8 }}>
                {T('howToPlayMainHatsTitle')}
              </div>
              <div style={{ color: '#3f3125', fontSize: 12, lineHeight: 1.35, marginBottom: 8 }}>
                {T('howToPlayMainHatsDesc')}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {human.mainHats.map((h) => <HatBadge key={`help-main-${h}`} lang={h} isMain size="sm" />)}
              </div>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 11, color: '#5a4635' }}>{T('howToPlayHatButtonsTitle')}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: 12, color: '#3f3125' }}>
                    <strong>{T('changeHat')}:</strong> {T('changeHatTooltip')}
                  </div>
                  <div style={{ fontSize: 11, color: '#5a4635' }}>
                    {T('howToPlayChangeHatRule')}
                  </div>
                  <div style={{ fontSize: 12, color: '#3f3125' }}>
                    <strong>{T('addHat')}:</strong> {T('addHatTooltip')}
                  </div>
                  <div style={{ fontSize: 11, color: '#5a4635' }}>
                    {T('howToPlayAddHatRule')}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 14, display: page === 7 ? 'block' : 'none' }}>
              <div style={{ color: '#5a4635', fontSize: 10, fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>{T('howToPlayPage')} 8</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <img src={percheroImg} alt={T('closet')} style={{ width: 22, height: 22, objectFit: 'contain' }} />
                <div style={{ color: '#7A4A00', fontWeight: 800, fontSize: 14 }}>{T('howToPlayClosetTitle')}</div>
              </div>
              <div style={{ color: '#3f3125', fontSize: 12, lineHeight: 1.35, marginBottom: 8 }}>
                {typeof T('howToPlayClosetDesc') === 'function' ? T('howToPlayClosetDesc')(human.perchero.length) : T('howToPlayClosetDesc')}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {human.perchero.map((h, i) => <HatBadge key={`help-closet-${h}-${i}`} lang={h} size="sm" />)}
              </div>
            </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8 }}>
              <Btn onClick={() => setHowToPlayPage((p) => Math.max(0, p - 1))} color="#6b4f36" disabled={page === 0}>
                {T('prevPage') || 'Anterior'}
              </Btn>
              <span style={{ color: '#c9b08f', fontSize: 12 }}>
                {T('howToPlayPage')} {page + 1}/{totalHowToPlayPages}
              </span>
              <Btn onClick={() => setHowToPlayPage((p) => Math.min(totalHowToPlayPages - 1, p + 1))} color="#6b4f36" disabled={page === totalHowToPlayPages - 1}>
                {T('nextPage') || 'Siguiente'}
              </Btn>
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
            emoji: 'ðŸƒ',
            title: T('ingredientCard'),
            desc: T('tiPlayIngDesc'),
            example: (
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Ej:</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13 }}>
                  <span style={{ background: 'rgba(255,215,0,.2)', border: '1px solid #FFD700', borderRadius: 8, padding: '3px 8px' }}>ðŸŽ© ESP</span>
                  <span style={{ color: '#888' }}>+</span>
                  <span style={{ background: 'rgba(255,255,255,.08)', borderRadius: 8, padding: '3px 8px' }}>ðŸ¥© Carne <small style={{ color: '#aaa' }}>(ESP)</small></span>
                  <span style={{ color: '#888' }}>+</span>
                  <span style={{ background: 'rgba(76,175,80,.15)', border: '1px solid #4CAF50', borderRadius: 8, padding: '3px 8px' }}>ðŸ” necesita ðŸ¥©</span>
                  <span style={{ color: '#888' }}>â†’</span>
                  <span style={{ color: '#4CAF50', fontWeight: 700 }}>âœ… Â¡JugÃ¡!</span>
                </div>
              </div>
            ),
          },
          playAction: {
            emoji: 'âš¡',
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
            emoji: 'ðŸ—‘ï¸',
            title: T('discard'),
            desc: T('tiDiscardDesc'),
            example: (
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 28 }}>ðŸƒ â†’ ðŸ—‘ï¸</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>â†’ {T('yourTurnLabel')}</div>
              </div>
            ),
          },
          changeHat: {
            emoji: 'ðŸŽ©',
            title: T('changeHat'),
            desc: T('changeHatTooltip'),
            example: (
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13 }}>
                  <span style={{ background: 'rgba(255,215,0,.15)', border: '1px solid #FFD700', borderRadius: 8, padding: '3px 8px' }}>ðŸŽ© ESP</span>
                  <span style={{ color: '#888' }}>â†”</span>
                  <span style={{ background: 'rgba(0,188,212,.15)', border: '1px solid #00BCD4', borderRadius: 8, padding: '3px 8px' }}>ðŸŽ© ENG</span>
                  <span style={{ color: '#888' }}>â†’</span>
                  <span style={{ color: '#FF7043' }}>âœ‚ï¸ -3 cartas</span>
                  <span style={{ color: '#888' }}>â†’</span>
                  <span style={{ color: '#4ecdc4' }}>+1 ðŸ¥©</span>
                </div>
              </div>
            ),
          },
          addHat: {
            emoji: 'âž•',
            title: T('addHat'),
            desc: T('addHatTooltip'),
            example: (
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13 }}>
                  <span style={{ background: 'rgba(255,215,0,.15)', border: '1px solid #FFD700', borderRadius: 8, padding: '3px 8px' }}>ðŸŽ© ESP</span>
                  <span style={{ color: '#888' }}>+</span>
                  <span style={{ background: 'rgba(0,188,212,.15)', border: '1px solid #00BCD4', borderRadius: 8, padding: '3px 8px' }}>ðŸŽ© ENG</span>
                  <span style={{ color: '#888' }}>â†’</span>
                  <span style={{ color: '#FF7043' }}>ðŸ—‘ï¸ toda la mano</span>
                  <span style={{ color: '#888' }}>â†’</span>
                  <span style={{ color: '#4ecdc4' }}>+1 ðŸ¥©</span>
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

      {/* NegaciÃ³n window modal */}
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

      {/* â”€â”€ Chat panel â”€â”€ */}
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
            <span style={{ fontWeight: 800, fontSize: 14, color: '#4ecdc4', flex: 1 }}>{'\u{1F4AC}'} Chat</span>
            <span onClick={() => setShowChat(false)} style={{ cursor: 'pointer', color: '#666', fontSize: 18, lineHeight: 1 }}>{'\u00D7'}</span>
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



