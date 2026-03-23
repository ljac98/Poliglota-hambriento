import React, { useState, useEffect, useRef, useCallback } from 'react';
import socket from './src/socket.js';
import { clearAuth, getSavedUser } from './src/api.js';
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
import bloqueoImg from './imagenes/bloqueo.png';
import campeonImg from './imagenes/campeon.png';
import eqMilanesa from './imagenes/acciones/esquina/milanga.png';
import eqEnsalada from './imagenes/acciones/esquina/ensalada2.png';
import eqPizza from './imagenes/acciones/esquina/pizza2.png';
import eqParrilla from './imagenes/acciones/esquina/parrilla.png';
import eqTenedor from './imagenes/acciones/esquina/tenedor2.png';
import actionTenedor from './imagenes/acciones/tenedor.png';
import actionGloton from './imagenes/acciones/comer.png';
import actionComeComodines from './imagenes/acciones/comecomodines.png';
import actionMilanesaSinHuevo from './imagenes/acciones/pmilanesa sin huevo.png';
import actionMilanesa from './imagenes/acciones/milanesa.png';
import actionEnsalada1 from './imagenes/acciones/ensalada3.png';
import actionEnsalada2 from './imagenes/acciones/ensalada4.png';
import actionPizza from './imagenes/acciones/pizza.png';
import actionPizzaConQueso from './imagenes/acciones/pizza con queso.png';
import actionParrilla1 from './imagenes/acciones/parrilla2.png';
import actionParrilla2 from './imagenes/acciones/parrilla3.png';
import actionParrilla3 from './imagenes/acciones/parrilla4.png';
import actionTridente from './imagenes/acciones/tridente.png';
import actionPercheroCubierto from './imagenes/acciones/perchero cubierto.png';
import burgerCarne from './imagenes/hamburguesas/ingredientes/carne.png';
import burgerCebolla from './imagenes/hamburguesas/ingredientes/cebolla.png';
import burgerHuevo from './imagenes/hamburguesas/ingredientes/huevo.png';
import burgerLechuga from './imagenes/hamburguesas/ingredientes/lechuga.png';
import burgerPalta from './imagenes/hamburguesas/ingredientes/palta.png';
import burgerPanArriba from './imagenes/hamburguesas/ingredientes/pan arriba.png';
import burgerPanAbajo from './imagenes/hamburguesas/ingredientes/pan abajo.png';
import burgerPollo from './imagenes/hamburguesas/ingredientes/pollo.png';
import burgerQueso from './imagenes/hamburguesas/ingredientes/queso.png';
import burgerTomate from './imagenes/hamburguesas/ingredientes/tomates.png';
import eqLadron from './imagenes/acciones/esquina/robo.png';
import eqIntercambioSomb from './imagenes/acciones/esquina/intercambiosomb.png';
import eqIntercambioHamb from './imagenes/acciones/esquina/intercam.png';
import eqBasurero from './imagenes/acciones/esquina/basurero.png';
import eqPercheroCubierto from './imagenes/acciones/esquina/percheroc.png';
import eqGloton from './imagenes/acciones/esquina/comelona.png';
import eqNegacion from './imagenes/acciones/esquina/cancelh.png';
import eqComeComodines from './imagenes/acciones/esquina/pancho.png';
import eqRightGlobal from './imagenes/acciones/esquina derecha/global.png';
import eqRightSingle from './imagenes/acciones/esquina derecha/singular.png';
import eqRightDiscard from './imagenes/acciones/esquina derecha/descarte.png';
import eqRightNegation from './imagenes/acciones/esquina derecha/negacion.png';
import { UserAvatar } from './app/components/UserAvatar.jsx';

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

const BURGER_STACK_IMG = {
  carne: burgerCarne,
  cebolla: burgerCebolla,
  huevo: burgerHuevo,
  lechuga: burgerLechuga,
  palta: burgerPalta,
  pollo: burgerPollo,
  queso: burgerQueso,
  tomate: burgerTomate,
};
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
  const shouldLogoutOnLoad = initialParams.get('logout') === '1';
  const savedUserOnLoad = getSavedUser();
  const appDownloadUrl = typeof window !== 'undefined' ? new URL('/', window.location.href).toString() : 'https://hungry-poly.up.railway.app/';
  const hasRoomSession = !!sessionStorage.getItem('hp_room_session');
  const [phase, setPhase] = useState(
    shouldLogoutOnLoad ? 'auth'
    : hasRoomSession ? 'reconnecting'
    : initialSalaCode ? 'onlineMenu'
    : initialView === 'profile' && savedUserOnLoad && (Number.isFinite(initialProfileId) || savedUserOnLoad?.id) ? 'profile'
    : initialView === 'auth' ? 'auth'
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
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [profileUserId, setProfileUserId] = useState(Number.isFinite(initialProfileId) ? initialProfileId : (savedUserOnLoad?.id || null));
  const [profileReturnPhase, setProfileReturnPhase] = useState('setup');
  const [profileBackStack, setProfileBackStack] = useState([]);
  const [historyInitialFilter, setHistoryInitialFilter] = useState('all');
  const [historyReturnPhase, setHistoryReturnPhase] = useState('setup');
  const aiRunning = useRef(false);
  const aiRunningMeta = useRef({ idx: null, startedAt: 0 });
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

  const releaseAITurnLock = useCallback(() => {
    aiRunning.current = false;
    aiRunningMeta.current = { idx: null, startedAt: 0 };
  }, []);

  const markAITurnLock = useCallback((idx) => {
    aiRunning.current = true;
    aiRunningMeta.current = { idx, startedAt: Date.now() };
  }, []);

  // â”€â”€ Auth state â”€â”€
  const [user, setUser] = useState(() => (shouldLogoutOnLoad ? null : getSavedUser()));
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
  const pendingClosetCoverRef = useRef(null);
  const [lastNegationEvent, setLastNegationEvent] = useState(null);
  const [lastForkEvent, setLastForkEvent] = useState(null);
  const [lastComeComodinesEvent, setLastComeComodinesEvent] = useState(null);
  const [lastGlotonEvent, setLastGlotonEvent] = useState(null);
  const [lastMilanesaEvent, setLastMilanesaEvent] = useState(null);
  const [lastEnsaladaEvent, setLastEnsaladaEvent] = useState(null);
  const [lastPizzaEvent, setLastPizzaEvent] = useState(null);
  const [lastParrillaEvent, setLastParrillaEvent] = useState(null);
  const [negationFx, setNegationFx] = useState(null);
  const [forkFx, setForkFx] = useState(null);
  const [comeComodinesFx, setComeComodinesFx] = useState(null);
  const [glotonFx, setGlotonFx] = useState(null);
  const [milanesaFx, setMilanesaFx] = useState(null);
  const [ensaladaFx, setEnsaladaFx] = useState(null);
  const [pizzaFx, setPizzaFx] = useState(null);
  const [parrillaFx, setParrillaFx] = useState(null);
  const [forkAnim, setForkAnim] = useState(null);
  const [comeComodinesAnim, setComeComodinesAnim] = useState(null);
  const [glotonAnim, setGlotonAnim] = useState(null);
  const [milanesaAnim, setMilanesaAnim] = useState(null);
  const [ensaladaAnim, setEnsaladaAnim] = useState(null);
  const [pizzaAnim, setPizzaAnim] = useState(null);
  const [parrillaAnim, setParrillaAnim] = useState(null);
  // Host-only ref that stores the resolve callback (not serializable over socket)
  const pendingNegRef = useRef(null);
  const lastNegationSeenRef = useRef(null);
  const lastForkSeenRef = useRef(null);
  const lastComeComodinesSeenRef = useRef(null);
  const lastGlotonSeenRef = useRef(null);
  const lastMilanesaSeenRef = useRef(null);
  const lastEnsaladaSeenRef = useRef(null);
  const lastPizzaSeenRef = useRef(null);
  const lastParrillaSeenRef = useRef(null);
  const playerAreaRefs = useRef({});
  const playerIngredientRefs = useRef({});
  const humanBurgerAreaRef = useRef(null);
  const humanBurgerSlotRefs = useRef({});
  const handCardRefs = useRef({});

  // â”€â”€ Voluntary leave state â”€â”€
  const [gamePaused, setGamePaused] = useState(false);
  const [pausedMessage, setPausedMessage] = useState('');

  // â”€â”€ Room invite notification state â”€â”€
  const [roomInvite, setRoomInvite] = useState(null);
  const [inviteJoinCode, setInviteJoinCode] = useState('');

  // â”€â”€ Friend request notification state â”€â”€
  const [friendReqNotif, setFriendReqNotif] = useState(null);
  const [friendAddedNotif, setFriendAddedNotif] = useState(null);
  const [friendRemovedNotif, setFriendRemovedNotif] = useState(null);

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
    const handleFriendAccepted = (data) => {
      setFriendAddedNotif(data);
      setTimeout(() => setFriendAddedNotif(prev => prev === data ? null : prev), 10000);
    };
    socket.on('friendRequestAccepted', handleFriendAccepted);
    return () => socket.off('friendRequestAccepted', handleFriendAccepted);
  }, []);

  useEffect(() => {
    const handleFriendRemoved = (data) => {
      setFriendRemovedNotif(data);
      setTimeout(() => setFriendRemovedNotif(prev => prev === data ? null : prev), 10000);
    };
    socket.on('friendRemoved', handleFriendRemoved);
    return () => socket.off('friendRemoved', handleFriendRemoved);
  }, []);

  useEffect(() => {
    if (!negationFx) return undefined;
    const timer = setTimeout(() => setNegationFx(null), 1800);
    return () => clearTimeout(timer);
  }, [negationFx]);

  useEffect(() => {
    if (!forkFx) return undefined;
    const timer = setTimeout(() => setForkFx(null), 1500);
    return () => clearTimeout(timer);
  }, [forkFx]);

  useEffect(() => {
    if (!glotonFx) return undefined;

    const timers = [];
    const getRectCenter = (el, fallbackX, fallbackY) => {
      if (!el) return { x: fallbackX, y: fallbackY };
      const rect = el.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };
    const sourceEl = glotonFx.actingIdx === HI ? humanBurgerAreaRef.current : playerAreaRefs.current[glotonFx.actingIdx];
    const targetEl = glotonFx.targetIdx === HI ? humanBurgerAreaRef.current : playerAreaRefs.current[glotonFx.targetIdx];
    const source = glotonFx.actorPoint || getRectCenter(sourceEl, window.innerWidth * 0.68, window.innerHeight * 0.44);
    const target = glotonFx.targetPoint || getRectCenter(targetEl, window.innerWidth * 0.26, window.innerHeight * 0.34);
    const stackY = target.y + (isMobile ? 38 : 52);

    setGlotonAnim({
      x: source.x,
      y: source.y,
      targetX: target.x,
      targetY: target.y - (isMobile ? 8 : 12),
      stackX: target.x,
      stackY,
      ingredients: [...(glotonFx.ingredients || [])],
      moving: false,
      biteTick: 0,
      biteFlash: false,
      showChampion: false,
    });

    timers.push(setTimeout(() => {
      setGlotonAnim((prev) => (prev ? { ...prev, x: target.x, y: target.y - (isMobile ? 8 : 12), moving: true } : prev));
    }, 120));

    const chewStart = 760;
    (glotonFx.ingredients || []).forEach((_, idx) => {
      timers.push(setTimeout(() => {
        setGlotonAnim((prev) => {
          if (!prev) return prev;
          const nextIngredients = prev.ingredients.slice(0, Math.max(0, prev.ingredients.length - 1));
          return {
            ...prev,
            moving: false,
            ingredients: nextIngredients,
            biteTick: prev.biteTick + 1,
            biteFlash: true,
          };
        });
      }, chewStart + idx * 250));
      timers.push(setTimeout(() => {
        setGlotonAnim((prev) => (prev ? { ...prev, biteFlash: false } : prev));
      }, chewStart + idx * 250 + 130));
    });

    const finishAt = chewStart + (glotonFx.ingredients?.length || 0) * 250 + 120;
    timers.push(setTimeout(() => {
      setGlotonAnim((prev) => (prev ? { ...prev, showChampion: true } : prev));
    }, finishAt));
    timers.push(setTimeout(() => setGlotonAnim(null), finishAt + 980));

    return () => timers.forEach(clearTimeout);
  }, [glotonFx, HI, isMobile]);

  useEffect(() => {
    if (!milanesaFx?.targets?.length) return undefined;

    const timers = [];
    const getRectCenter = (el, fallbackX, fallbackY) => {
      if (!el) return { x: fallbackX, y: fallbackY };
      const rect = el.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };
    const getPlayerCenter = (playerIdx, fallbackX, fallbackY) => {
      const el = playerIdx === HI ? humanBurgerAreaRef.current : playerAreaRefs.current[playerIdx];
      return getRectCenter(el, fallbackX, fallbackY);
    };

    const targets = milanesaFx.targets.map((target, i) => ({
      ...target,
      point: getPlayerCenter(
        target.targetIdx,
        window.innerWidth * 0.18,
        window.innerHeight * (0.24 + (i * 0.14)),
      ),
    }));

    let elapsed = 90;
    const appearDuration = 260;
    const cheesyDelay = 250;
    const holdDuration = 420;

    targets.forEach((target, index) => {
      timers.push(setTimeout(() => {
        setMilanesaAnim({
          x: target.point.x,
          y: target.point.y,
          cooked: false,
          pop: false,
          visible: true,
          targetCount: target.count || 1,
        });
      }, elapsed));
      timers.push(setTimeout(() => {
        setMilanesaAnim((prev) => (prev ? { ...prev, cooked: true, pop: true } : prev));
      }, elapsed + cheesyDelay));
      timers.push(setTimeout(() => {
        setMilanesaAnim((prev) => (prev ? { ...prev, pop: false } : prev));
      }, elapsed + cheesyDelay + 150));
      timers.push(setTimeout(() => {
        setMilanesaAnim((prev) => (prev ? { ...prev, visible: false } : prev));
      }, elapsed + cheesyDelay + holdDuration));
      elapsed += appearDuration + cheesyDelay + holdDuration + (index === targets.length - 1 ? 40 : 140);
    });

    timers.push(setTimeout(() => {
      setMilanesaAnim(null);
      setMilanesaFx(null);
    }, elapsed + 80));

    return () => {
      timers.forEach(clearTimeout);
      setMilanesaAnim(null);
    };
  }, [milanesaFx, HI]);

  useEffect(() => {
    if (!ensaladaFx?.targets?.length) return undefined;

    const timers = [];
    const getRectCenter = (el, fallbackX, fallbackY) => {
      if (!el) return { x: fallbackX, y: fallbackY };
      const rect = el.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };
    const targets = ensaladaFx.targets.map((target, i) => {
      const el = target.targetIdx === HI ? humanBurgerAreaRef.current : playerAreaRefs.current[target.targetIdx];
      const ingredients = (target.ingredients?.length
        ? target.ingredients.filter((ing) => ['lechuga', 'tomate', 'cebolla', 'palta'].includes(ing))
        : Array.from({ length: target.count || 1 }, (_, idx) => ['lechuga', 'tomate', 'cebolla', 'palta'][idx % 4]));
      return {
        ...target,
        ingredients,
        point: getRectCenter(el, window.innerWidth * 0.22, window.innerHeight * (0.26 + i * 0.14)),
      };
    });

    const frames = [actionEnsalada1, actionEnsalada2];
    setEnsaladaAnim({
      x: targets[0].point.x,
      y: targets[0].point.y,
      frameIdx: 0,
      visible: true,
      tossTick: 0,
      ingredients: targets[0].ingredients,
      targetCount: targets[0].count || targets[0].ingredients.length || 1,
    });

    const frameTimer = setInterval(() => {
      setEnsaladaAnim((prev) => (prev ? { ...prev, frameIdx: (prev.frameIdx + 1) % frames.length } : prev));
    }, 180);
    timers.push(frameTimer);

    let elapsed = 120;
    targets.forEach((target, idx) => {
      timers.push(setTimeout(() => {
        setEnsaladaAnim({
          x: target.point.x,
          y: target.point.y,
          frameIdx: 0,
          visible: true,
          tossTick: idx + 1,
          ingredients: target.ingredients,
          targetCount: target.count || target.ingredients.length || 1,
        });
      }, elapsed));
      timers.push(setTimeout(() => {
        setEnsaladaAnim((prev) => (prev ? { ...prev, tossTick: prev.tossTick + 1 } : prev));
      }, elapsed + 220));
      timers.push(setTimeout(() => {
        setEnsaladaAnim((prev) => (prev ? { ...prev, visible: false } : prev));
      }, elapsed + 620));
      elapsed += idx === targets.length - 1 ? 860 : 740;
    });

    timers.push(setTimeout(() => {
      setEnsaladaAnim(null);
      setEnsaladaFx(null);
    }, elapsed + 120));

    return () => {
      timers.forEach((timer) => {
        clearTimeout(timer);
        clearInterval(timer);
      });
      setEnsaladaAnim(null);
    };
  }, [ensaladaFx, HI]);

  useEffect(() => {
    if (!pizzaFx?.targets?.length) return undefined;

    const timers = [];
    const getRectCenter = (el, fallbackX, fallbackY) => {
      if (!el) return { x: fallbackX, y: fallbackY };
      const rect = el.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };
    const targets = pizzaFx.targets.map((target, i) => {
      const el = target.targetIdx === HI ? humanBurgerAreaRef.current : playerAreaRefs.current[target.targetIdx];
      return {
        ...target,
        point: getRectCenter(el, window.innerWidth * 0.22, window.innerHeight * (0.26 + i * 0.14)),
      };
    });

    setPizzaAnim({
      x: targets[0].point.x,
      y: targets[0].point.y,
      cheesy: false,
      pop: false,
      targetCount: targets[0].count || 1,
      visible: true,
    });

    let elapsed = 120;
    targets.forEach((target, idx) => {
      timers.push(setTimeout(() => {
        setPizzaAnim({
          x: target.point.x,
          y: target.point.y,
          cheesy: false,
          pop: false,
          targetCount: target.count || 1,
          visible: true,
        });
      }, elapsed));
      timers.push(setTimeout(() => {
        setPizzaAnim((prev) => (prev ? { ...prev, cheesy: true, pop: true } : prev));
      }, elapsed + 260));
      timers.push(setTimeout(() => {
        setPizzaAnim((prev) => (prev ? { ...prev, pop: false } : prev));
      }, elapsed + 410));
      timers.push(setTimeout(() => {
        setPizzaAnim((prev) => (prev ? { ...prev, visible: false } : prev));
      }, elapsed + 620));
      elapsed += idx === targets.length - 1 ? 880 : 760;
    });

    timers.push(setTimeout(() => setPizzaAnim(null), elapsed + 120));
    return () => timers.forEach(clearTimeout);
  }, [pizzaFx, HI]);

  useEffect(() => {
    if (!parrillaFx?.targets?.length) return undefined;

    const timers = [];
    const getRectCenter = (el, fallbackX, fallbackY) => {
      if (!el) return { x: fallbackX, y: fallbackY };
      const rect = el.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };
    const getPlayerCenter = (playerIdx, fallbackX, fallbackY) => {
      const el = playerIdx === HI ? humanBurgerAreaRef.current : playerAreaRefs.current[playerIdx];
      return getRectCenter(el, fallbackX, fallbackY);
    };

    const center = {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * (isMobile ? 0.43 : 0.38),
    };
    const targets = parrillaFx.targets.flatMap((target, targetIdx) => {
      const point = getPlayerCenter(
        target.targetIdx,
        window.innerWidth * 0.18,
        window.innerHeight * (0.22 + targetIdx * 0.16),
      );
      const ingredients = (target.ingredients?.length ? target.ingredients : Array.from({ length: target.count || 1 }, (_, idx) => (idx % 2 === 0 ? 'pollo' : 'carne')));
      return ingredients.map((ingredient, idx) => ({
        id: `${target.targetIdx}-${ingredient}-${idx}`,
        ingredient,
        point: {
          x: point.x + ((idx % 2 === 0 ? -1 : 1) * (isMobile ? 12 : 18)),
          y: point.y + (idx * (isMobile ? 8 : 10)) - (isMobile ? 14 : 18),
        },
      }));
    });

    const frames = [actionParrilla1, actionParrilla2, actionParrilla3];
    setParrillaAnim({
      x: center.x,
      y: center.y,
      frameIdx: 0,
      tridentX: targets[0]?.point.x || center.x,
      tridentY: targets[0]?.point.y || center.y,
      meatX: targets[0]?.point.x || center.x,
      meatY: targets[0]?.point.y || center.y,
      meatImg: targets[0]?.ingredient === 'pollo' ? burgerPollo : burgerCarne,
      showMeat: Boolean(targets[0]),
      visible: true,
      activePickup: 0,
      sizzle: false,
      frameImages: frames,
    });

    const frameTimer = setInterval(() => {
      setParrillaAnim((prev) => (prev ? { ...prev, frameIdx: (prev.frameIdx + 1) % frames.length } : prev));
    }, 220);
    timers.push(frameTimer);

    let elapsed = 120;
    const moveDuration = 560;
    const grillPause = 260;

    targets.forEach((target, idx) => {
      timers.push(setTimeout(() => {
        setParrillaAnim((prev) => (prev ? {
          ...prev,
          tridentX: target.point.x,
          tridentY: target.point.y,
          meatX: target.point.x,
          meatY: target.point.y,
          meatImg: target.ingredient === 'pollo' ? burgerPollo : burgerCarne,
          showMeat: true,
          activePickup: idx + 1,
        } : prev));
      }, elapsed));

      timers.push(setTimeout(() => {
        setParrillaAnim((prev) => (prev ? {
          ...prev,
          tridentX: center.x,
          tridentY: center.y + (isMobile ? 16 : 22),
          meatX: center.x + (isMobile ? 2 : 4),
          meatY: center.y + (isMobile ? 2 : 4),
        } : prev));
      }, elapsed + 80));

      timers.push(setTimeout(() => {
        setParrillaAnim((prev) => (prev ? {
          ...prev,
          showMeat: false,
          sizzle: true,
        } : prev));
      }, elapsed + moveDuration));

      timers.push(setTimeout(() => {
        setParrillaAnim((prev) => (prev ? { ...prev, sizzle: false } : prev));
      }, elapsed + moveDuration + 220));

      elapsed += moveDuration + grillPause;
    });

    timers.push(setTimeout(() => {
      setParrillaAnim((prev) => (prev ? { ...prev, visible: false, showMeat: false } : prev));
    }, elapsed + 120));
    timers.push(setTimeout(() => {
      setParrillaAnim(null);
      setParrillaFx(null);
    }, elapsed + 340));

    return () => {
      timers.forEach((timer) => {
        clearTimeout(timer);
        clearInterval(timer);
      });
      setParrillaAnim(null);
    };
  }, [parrillaFx, HI, isMobile]);

  useEffect(() => {
    if (!forkFx) return undefined;

    const getRectCenter = (el, fallbackX, fallbackY) => {
      if (!el) return { x: fallbackX, y: fallbackY };
      const rect = el.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };

    const resolveTargetSlotsLocal = (table, target) => {
      const normal = {};
      const wildcardChosen = {};
      let wildcardBare = 0;
      (table || []).forEach((t) => {
        if (t === 'perrito') wildcardBare += 1;
        else if (String(t).startsWith('perrito|')) {
          const chosen = String(t).split('|')[1];
          wildcardChosen[chosen] = (wildcardChosen[chosen] || 0) + 1;
        } else {
          normal[t] = (normal[t] || 0) + 1;
        }
      });
      return (target || []).map((ing) => {
        if ((normal[ing] || 0) > 0) {
          normal[ing] -= 1;
          return { filled: true, viaWildcard: false };
        }
        if ((wildcardChosen[ing] || 0) > 0) {
          wildcardChosen[ing] -= 1;
          return { filled: true, viaWildcard: true };
        }
        if (wildcardBare > 0) {
          wildcardBare -= 1;
          return { filled: true, viaWildcard: true };
        }
        return { filled: false, viaWildcard: false };
      });
    };

    const getLandingSlotIndex = () => {
      if (forkFx.actingIdx !== HI) return null;
      const currentHuman = players[HI];
      if (!currentHuman || currentHuman.currentBurger >= currentHuman.totalBurgers) return null;
      const targetBurger = currentHuman.burgers?.[currentHuman.currentBurger] || [];
      if (!targetBurger.length) return null;
      const tableAfter = [...(currentHuman.table || [])];
      const removeIdx = [...tableAfter].map((ing, idx) => ({ ing, idx })).reverse().find((entry) => entry.ing === forkFx.stolenRaw)?.idx;
      const tableBefore = [...tableAfter];
      if (removeIdx !== undefined) tableBefore.splice(removeIdx, 1);
      const beforeSlots = resolveTargetSlotsLocal(tableBefore, targetBurger);
      const afterSlots = resolveTargetSlotsLocal(tableAfter, targetBurger);
      const baseIngredient = forkFx.ingredient;
      const slotIdx = targetBurger.findIndex((ing, idx) => ing === baseIngredient && !beforeSlots[idx]?.filled && afterSlots[idx]?.filled);
      return slotIdx === -1 ? null : slotIdx;
    };

    const sourceEl = forkFx.targetIdx === HI
      ? (forkFx.sourceSlotIdx != null ? humanBurgerSlotRefs.current[forkFx.sourceSlotIdx] : humanBurgerAreaRef.current)
      : (playerIngredientRefs.current[forkFx.targetIdx]?.[forkFx.sourceIngIdx] || playerAreaRefs.current[forkFx.targetIdx]);
    const landingSlotIdx = getLandingSlotIndex();
    const destEl = forkFx.actingIdx === HI && landingSlotIdx !== null
      ? humanBurgerSlotRefs.current[landingSlotIdx]
      : (forkFx.actingIdx === HI ? humanBurgerAreaRef.current : playerAreaRefs.current[forkFx.actingIdx]);
    const source = getRectCenter(sourceEl, window.innerWidth * 0.22, window.innerHeight * 0.38);
    const dest = getRectCenter(destEl, window.innerWidth * 0.62, window.innerHeight * 0.42);

    setForkAnim({
      x: source.x,
      y: source.y,
      dest,
      ingredient: forkFx.ingredient,
      actorName: forkFx.actorName,
      exactSlot: landingSlotIdx !== null,
      moving: false,
    });

    const moveTimer = setTimeout(() => {
      setForkAnim((prev) => (prev ? { ...prev, x: dest.x, y: dest.y, moving: true } : prev));
    }, 120);
    const clearTimer = setTimeout(() => setForkAnim(null), 980);

    return () => {
      clearTimeout(moveTimer);
      clearTimeout(clearTimer);
    };
  }, [forkFx]);

  useEffect(() => {
    if (!comeComodinesFx?.targets?.length) {
      setComeComodinesAnim(null);
      return undefined;
    }

    const timers = [];
    const getRectCenter = (el, fallbackX, fallbackY) => {
      if (!el) return { x: fallbackX, y: fallbackY };
      const rect = el.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };
    const getPlayerCenter = (playerIdx, fallbackX, fallbackY) => {
      const el = playerIdx === HI ? humanBurgerAreaRef.current : playerAreaRefs.current[playerIdx];
      return getRectCenter(el, fallbackX, fallbackY);
    };

    const actor = comeComodinesFx.sourcePoint || getPlayerCenter(
      comeComodinesFx.actingIdx,
      window.innerWidth * 0.72,
      window.innerHeight * 0.52,
    );
    const stops = comeComodinesFx.targets.map((target, i) => ({
      ...target,
      point: getPlayerCenter(
        target.targetIdx,
        window.innerWidth * 0.18,
        window.innerHeight * (0.26 + (i * 0.14)),
      ),
    }));
    if (!stops.length) return undefined;

    setComeComodinesAnim({
      x: actor.x,
      y: actor.y,
      moving: false,
      stoppingAt: null,
      pickedCount: 0,
    });

    const moveDuration = 620;
    const stopDuration = 340;
    let elapsed = 120;
    let pickedCount = 0;
    const route = [...stops, { targetIdx: comeComodinesFx.actingIdx, count: 0, point: actor, isReturn: true }];

    route.forEach((stop, idx) => {
      timers.push(setTimeout(() => {
        setComeComodinesAnim((prev) => (prev ? {
          ...prev,
          x: stop.point.x,
          y: stop.point.y,
          moving: true,
          stoppingAt: prev.stoppingAt,
        } : prev));
      }, elapsed));
      elapsed += moveDuration;

      timers.push(setTimeout(() => {
        if (!stop.isReturn) pickedCount += stop.count || 0;
        setComeComodinesAnim((prev) => (prev ? {
          ...prev,
          x: stop.point.x,
          y: stop.point.y,
          moving: false,
          stoppingAt: stop.isReturn ? null : stop,
          pickedCount,
        } : prev));
      }, elapsed));
      elapsed += stop.isReturn ? 240 : stopDuration;
    });

    timers.push(setTimeout(() => {
      setComeComodinesAnim(null);
      setComeComodinesFx(null);
    }, elapsed + 180));

    return () => {
      timers.forEach(clearTimeout);
      setComeComodinesAnim(null);
    };
  }, [comeComodinesFx, HI]);

  const triggerComeComodinesEvent = useCallback((result, actingIdx, actorName) => {
    if (!result?.affectedTargets?.length) return;
    const event = {
      id: `${Date.now()}-${Math.random()}`,
      actingIdx,
      actorName: actorName || 'Jugador',
      targets: result.affectedTargets,
      sourcePoint: result.sourcePoint || null,
    };
    setLastComeComodinesEvent(event);
    lastComeComodinesSeenRef.current = event.id;
    setComeComodinesFx(event);
  }, []);

  const triggerGlotonEvent = useCallback((actingIdx, targetIdx, targetTable, actorName) => {
    if (!targetTable?.length) return;
    const getRectCenter = (el, fallbackX, fallbackY) => {
      if (!el) return { x: fallbackX, y: fallbackY };
      const rect = el.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };
    const actorEl = actingIdx === HI ? humanBurgerAreaRef.current : playerAreaRefs.current[actingIdx];
    const targetEl = targetIdx === HI ? humanBurgerAreaRef.current : playerAreaRefs.current[targetIdx];
    const event = {
      id: `${Date.now()}-${Math.random()}`,
      actingIdx,
      targetIdx,
      actorName: actorName || 'Jugador',
      ingredients: targetTable.map(ing => ingKey(ing)),
      actorPoint: getRectCenter(actorEl, window.innerWidth * 0.68, window.innerHeight * 0.44),
      targetPoint: getRectCenter(targetEl, window.innerWidth * 0.22, window.innerHeight * 0.34),
    };
    setLastGlotonEvent(event);
    if (!isOnline || targetIdx === HI) {
      lastGlotonSeenRef.current = event.id;
      setGlotonFx(event);
    }
  }, [HI, isOnline]);

  const triggerMilanesaEvent = useCallback((result) => {
    if (!result?.affectedTargets?.length) return;
    const event = {
      id: `${Date.now()}-${Math.random()}`,
      targets: result.affectedTargets,
    };
    setLastMilanesaEvent(event);
    lastMilanesaSeenRef.current = event.id;
    setMilanesaFx(event);
  }, []);

  const triggerEnsaladaEvent = useCallback((result) => {
    if (!result?.affectedTargets?.length) return;
    const event = {
      id: `${Date.now()}-${Math.random()}`,
      targets: result.affectedTargets,
    };
    setLastEnsaladaEvent(event);
    lastEnsaladaSeenRef.current = event.id;
    setEnsaladaFx(event);
  }, []);

  const triggerPizzaEvent = useCallback((result) => {
    if (!result?.affectedTargets?.length) return;
    const event = {
      id: `${Date.now()}-${Math.random()}`,
      targets: result.affectedTargets,
    };
    setLastPizzaEvent(event);
    lastPizzaSeenRef.current = event.id;
    setPizzaFx(event);
  }, []);

  const triggerParrillaEvent = useCallback((result) => {
    if (!result?.affectedTargets?.length) return;
    const event = {
      id: `${Date.now()}-${Math.random()}`,
      targets: result.affectedTargets,
    };
    setLastParrillaEvent(event);
    lastParrillaSeenRef.current = event.id;
    setParrillaFx(event);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (shouldLogoutOnLoad) {
      clearAuth();
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('logout');
      cleanUrl.searchParams.delete('view');
      cleanUrl.searchParams.delete('id');
      window.history.replaceState({}, '', cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);
    }
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

  function acceptRoomInvite() {
    if (!roomInvite) return;
    const code = roomInvite.roomCode;
    setRoomInvite(null);
    setInviteJoinCode(code);
    setPhase('onlineMenu');
  }

  // â”€â”€ Handle voluntary leave from room / local match â”€â”€
  function resetLocalGameState() {
    releaseAITurnLock();
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
    setLastNegationEvent(null);
    setLastForkEvent(null);
    setLastComeComodinesEvent(null);
    setLastGlotonEvent(null);
    setLastMilanesaEvent(null);
    setLastEnsaladaEvent(null);
    setLastPizzaEvent(null);
    setLastParrillaEvent(null);
    setNegationFx(null);
    setForkFx(null);
    setComeComodinesFx(null);
    setGlotonFx(null);
    setMilanesaFx(null);
    setEnsaladaFx(null);
    setPizzaFx(null);
    setParrillaFx(null);
    setForkAnim(null);
    setComeComodinesAnim(null);
    setGlotonAnim(null);
    setMilanesaAnim(null);
    setEnsaladaAnim(null);
    setPizzaAnim(null);
    setParrillaAnim(null);
    pendingNegRef.current = null;
    lastNegationSeenRef.current = null;
    lastForkSeenRef.current = null;
    lastComeComodinesSeenRef.current = null;
    lastGlotonSeenRef.current = null;
    lastMilanesaSeenRef.current = null;
    lastEnsaladaSeenRef.current = null;
    lastPizzaSeenRef.current = null;
    lastParrillaSeenRef.current = null;
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
    setLastNegationEvent(null);
    setLastForkEvent(null);
    setLastComeComodinesEvent(null);
    setLastGlotonEvent(null);
    setLastMilanesaEvent(null);
    setLastEnsaladaEvent(null);
    setLastPizzaEvent(null);
    setLastParrillaEvent(null);
    setNegationFx(null);
    setForkFx(null);
    setComeComodinesFx(null);
    setGlotonFx(null);
    setMilanesaFx(null);
    setEnsaladaFx(null);
    setPizzaFx(null);
    setParrillaFx(null);
    setForkAnim(null);
    setComeComodinesAnim(null);
    setGlotonAnim(null);
    setMilanesaAnim(null);
    setEnsaladaAnim(null);
    setPizzaAnim(null);
    setParrillaAnim(null);
    lastNegationSeenRef.current = null;
    lastForkSeenRef.current = null;
    lastComeComodinesSeenRef.current = null;
    lastGlotonSeenRef.current = null;
    lastMilanesaSeenRef.current = null;
    lastEnsaladaSeenRef.current = null;
    lastPizzaSeenRef.current = null;
    lastParrillaSeenRef.current = null;
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

  function handleMenuLogout() {
    if (isOnline && roomCode) {
      socket.emit('leaveRoom');
      socket.disconnect();
      resetOnlineRoomState();
    }
    if (phase === 'playing' && !isOnline) {
      resetLocalGameState();
    }
    clearAuth();
    setUser(null);
    setProfileUserId(null);
    setInviteJoinCode('');
    setOnlineMenuTab('');
    setShowQuickMenu(false);
    setPhase('auth');
  }

  function openProfile(targetUserId, returnPhase = phase) {
    if (!targetUserId) return;
    const normalizedReturnPhase = returnPhase || (user ? 'setup' : 'auth');
    if (phase === 'profile' && profileUserId && profileUserId !== targetUserId) {
      setProfileBackStack((prev) => [...prev, profileUserId]);
    } else if (normalizedReturnPhase !== 'profile') {
      setProfileBackStack([]);
      setProfileReturnPhase(normalizedReturnPhase);
    }
    setProfileUserId(targetUserId);
    if (normalizedReturnPhase !== 'profile') {
      setProfileReturnPhase(normalizedReturnPhase);
    }
    setShowQuickMenu(false);
    setPhase('profile');
  }

  function handleProfileBack() {
    if (profileBackStack.length > 0) {
      const prevProfileId = profileBackStack[profileBackStack.length - 1];
      setProfileBackStack((prev) => prev.slice(0, -1));
      setProfileUserId(prevProfileId);
      setShowQuickMenu(false);
      setPhase('profile');
      return;
    }
    setShowQuickMenu(false);
    setPhase(profileReturnPhase || (user ? 'setup' : 'auth'));
  }

  function openHistory(filter = 'all', returnPhase = phase) {
    setHistoryInitialFilter(filter || 'all');
    setHistoryReturnPhase(returnPhase || (user ? 'setup' : 'auth'));
    setShowQuickMenu(false);
    setPhase('history');
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
            setLastNegationEvent(gameState.lastNegationEvent || null);
            setLastForkEvent(gameState.lastForkEvent || null);
            setLastComeComodinesEvent(gameState.lastComeComodinesEvent || null);
            setLastGlotonEvent(gameState.lastGlotonEvent || null);
            setLastMilanesaEvent(gameState.lastMilanesaEvent || null);
            setLastEnsaladaEvent(gameState.lastEnsaladaEvent || null);
            setLastPizzaEvent(gameState.lastPizzaEvent || null);
            setLastParrillaEvent(gameState.lastParrillaEvent || null);
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
    socket.on('becameHost', () => setIsHost(true));
    socket.on('chatMessage', (msg) => {
      setChatMessages(prev => [...prev, msg]);
      if (!showChatRef.current) setUnreadChat(prev => prev + 1);
    });
    socket.on('playerVoluntaryLeft', ({ playerName, activeCount, gameStarted, activePlayers }) => {
      if (Array.isArray(activePlayers)) setLobbyPlayers(activePlayers);
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
      socket.off('becameHost');
      socket.off('chatMessage');
      socket.off('playerVoluntaryLeft');
      socket.off('playerRejoined');
      socket.off('playerRemovedFromGame');
    };
  }, [isOnline, isHost, myPlayerIdx]);

  useEffect(() => { showChatRef.current = showChat; }, [showChat]);
  useEffect(() => {
    if (showChat) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, showChat]);

  // â”€â”€ Socket: non-host receives full game state from host â”€â”€
  useEffect(() => {
    if (!isOnline || isHost) return;
    socket.on('stateUpdate', ({ state }) => {
      setPlayers(state.players.map((player, idx) => ({
        ...player,
        isRemote: idx !== myPlayerIdx,
      })));
      setDeck(state.deck);
      setDiscard(state.discard);
      setCp(state.cp);
      setLog(state.log);
      setExtraPlay(state.extraPlay || false);
      setCurrentGameConfig(state.gameConfig || null);
      setModal(currentModal => {
        const privateModals = ['manual_cambiar', 'manual_cambiar_discard', 'manual_agregar', 'wildcard', 'basurero', 'pickHatReplace', 'pickHatExchange', 'pickHatSteal', 'ingredientInfo', 'pickTarget', 'pickIngredient', 'pickIngredientRemote'];
        if (state.modal) return state.modal;
        if (currentModal && privateModals.includes(currentModal.type)) return currentModal;
        return null;
      });
      setPendingNeg(state.pendingNeg || null);
      setLastNegationEvent(state.lastNegationEvent || null);
      setLastForkEvent(state.lastForkEvent || null);
      setLastComeComodinesEvent(state.lastComeComodinesEvent || null);
      setLastGlotonEvent(state.lastGlotonEvent || null);
      setLastMilanesaEvent(state.lastMilanesaEvent || null);
      setLastEnsaladaEvent(state.lastEnsaladaEvent || null);
      setLastPizzaEvent(state.lastPizzaEvent || null);
      setLastParrillaEvent(state.lastParrillaEvent || null);
      if (state.lastNegationEvent?.id && state.lastNegationEvent.id !== lastNegationSeenRef.current && state.lastNegationEvent.actingIdx === myPlayerIdx) {
        lastNegationSeenRef.current = state.lastNegationEvent.id;
        setNegationFx(state.lastNegationEvent);
      }
      if (state.lastForkEvent?.id && state.lastForkEvent.id !== lastForkSeenRef.current && state.lastForkEvent.targetIdx === myPlayerIdx) {
        lastForkSeenRef.current = state.lastForkEvent.id;
        setForkFx(state.lastForkEvent);
      }
      if (state.lastComeComodinesEvent?.id && state.lastComeComodinesEvent.id !== lastComeComodinesSeenRef.current) {
        lastComeComodinesSeenRef.current = state.lastComeComodinesEvent.id;
        setComeComodinesFx(state.lastComeComodinesEvent);
      }
      if (state.lastGlotonEvent?.id && state.lastGlotonEvent.id !== lastGlotonSeenRef.current && state.lastGlotonEvent.targetIdx === myPlayerIdx) {
        lastGlotonSeenRef.current = state.lastGlotonEvent.id;
        setGlotonFx(state.lastGlotonEvent);
      }
      if (state.lastMilanesaEvent?.id && state.lastMilanesaEvent.id !== lastMilanesaSeenRef.current) {
        lastMilanesaSeenRef.current = state.lastMilanesaEvent.id;
        setMilanesaFx(state.lastMilanesaEvent);
      }
      if (state.lastEnsaladaEvent?.id && state.lastEnsaladaEvent.id !== lastEnsaladaSeenRef.current) {
        lastEnsaladaSeenRef.current = state.lastEnsaladaEvent.id;
        setEnsaladaFx(state.lastEnsaladaEvent);
      }
      if (state.lastPizzaEvent?.id && state.lastPizzaEvent.id !== lastPizzaSeenRef.current) {
        lastPizzaSeenRef.current = state.lastPizzaEvent.id;
        setPizzaFx(state.lastPizzaEvent);
      }
      if (state.lastParrillaEvent?.id && state.lastParrillaEvent.id !== lastParrillaSeenRef.current) {
        lastParrillaSeenRef.current = state.lastParrillaEvent.id;
        setParrillaFx(state.lastParrillaEvent);
      }
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
      const privateModals = ['manual_cambiar', 'manual_cambiar_discard', 'manual_agregar', 'wildcard', 'basurero', 'pickHatReplace', 'pickHatExchange', 'pickHatSteal', 'ingredientInfo', 'pickTarget', 'pickIngredient', 'pickIngredientRemote'];
      const syncModal = modal && privateModals.includes(modal.type) ? null : modal;
      socket.emit('syncState', {
        code: roomCode,
        state: { players, deck, discard, cp, log, extraPlay, modal: syncModal, pendingNeg, lastNegationEvent, lastForkEvent, lastComeComodinesEvent, lastGlotonEvent, lastMilanesaEvent, lastEnsaladaEvent, lastPizzaEvent, lastParrillaEvent, winner, gameConfig: currentGameConfig, phase: 'playing' },
      });
    }, 80);
    return () => clearTimeout(syncRef.current);
  }, [players, deck, discard, cp, log, extraPlay, modal, pendingNeg, lastNegationEvent, lastForkEvent, lastComeComodinesEvent, lastGlotonEvent, lastMilanesaEvent, lastEnsaladaEvent, lastPizzaEvent, lastParrillaEvent, winner, currentGameConfig, phase, isOnline, isHost]);

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

  function estimateAINegationThreat(pls, aiIdx, actingIdx, card, affectedIdxs) {
    const ai = pls[aiIdx];
    if (!ai || !card) return 0;
    const action = card.action;
    const actingPlayer = pls[actingIdx];
    const isTargetedAtAI = Array.isArray(affectedIdxs) && affectedIdxs.includes(aiIdx);
    const normalizedTable = (ai.table || []).map(ing => ingKey(ing));
    const aiNeeds = getRemainingNeeds(ai);
    const neededOnTable = normalizedTable.filter(ing => aiNeeds.includes(ing)).length;
    let threat = 0;

    if (action === 'tenedor' && isTargetedAtAI) {
      threat += ai.table.length > 0 ? 35 + neededOnTable * 12 : 0;
    } else if (action === 'gloton' && isTargetedAtAI) {
      threat += ai.table.length * 28 + neededOnTable * 10;
    } else if (action === 'ladron' && isTargetedAtAI) {
      threat += ai.mainHats.length > 0 ? 52 : 12;
    } else if (action === 'intercambio_sombreros' && isTargetedAtAI) {
      threat += ai.mainHats.length > 0 ? 44 : 8;
    } else if (action === 'intercambio_hamburguesa' && isTargetedAtAI) {
      threat += ai.table.length * 22 + neededOnTable * 10;
    } else if (action === 'basurero') {
      threat += actingPlayer?.isAI ? 10 : 30;
    } else if (['milanesa', 'ensalada', 'pizza', 'parrilla', 'comecomodines'].includes(action)) {
      const lossCount = normalizedTable.reduce((sum, ing) => {
        if (action === 'milanesa') return sum + (['pan', 'huevo'].includes(ing) ? 1 : 0);
        if (action === 'ensalada') return sum + (['lechuga', 'tomate', 'cebolla', 'palta'].includes(ing) ? 1 : 0);
        if (action === 'pizza') return sum + (ing === 'queso' ? 1 : 0);
        if (action === 'parrilla') return sum + (['pollo', 'carne'].includes(ing) ? 1 : 0);
        if (action === 'comecomodines') return sum + (String(ing).startsWith('perrito|') ? 1 : 0);
        return sum;
      }, 0);
      threat += lossCount * 24;
    }

    if (!actingPlayer?.isAI) threat += 10;
    return threat;
  }

  function shouldAINegate(pls, aiIdx, actingIdx, card, affectedIdxs, aiConfig) {
    const threat = estimateAINegationThreat(pls, aiIdx, actingIdx, card, affectedIdxs);
    const difficulty = getAIDifficulty();

    if (difficulty === 'easy') return threat >= 42 && Math.random() < aiConfig.negationChance;
    if (difficulty === 'medium') return threat >= 26 && Math.random() < Math.max(aiConfig.negationChance, 0.35);
    if (difficulty === 'hard') return threat >= 14 && Math.random() < Math.max(aiConfig.negationChance, 0.8);
    if (difficulty === 'impossible') return threat > 0;
    return threat >= 24 && Math.random() < aiConfig.negationChance;
  }

  function actionCanBeNegated(card, affectedIdxs) {
    if (!card?.action) return false;
    if (card.action === 'basurero') return false;
    if (Array.isArray(affectedIdxs) && affectedIdxs.length > 0) return true;
    return ['milanesa', 'ensalada', 'pizza', 'parrilla', 'comecomodines'].includes(card.action);
  }

  function isClosetActionBlocked(playerLike, actionId) {
    if (!playerLike?.closetCovered) return false;
    return ['ladron', 'intercambio_sombreros'].includes(actionId);
  }

  function getClosetCoverDiscardIndices(playerLike) {
    if (!playerLike || playerLike.hand.length < 2) return [];
    const needs = getRemainingNeeds(playerLike);
    return playerLike.hand
      .map((card, idx) => ({ idx, score: getCardKeepScore(card, playerLike.mainHats, needs) }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 2)
      .map((item) => item.idx);
  }

  function shouldAIAvoidClosetCover(playerLike) {
    if (!playerLike || playerLike.hand.length < 2) return false;
    if (playerLike.perchero?.length > 0) return true;
    if (playerLike.mainHats?.length > 1) return true;
    return playerLike.hand.some((card) => card.type === 'action' && ['ladron', 'intercambio_sombreros'].includes(card.action));
  }

  function finishClosetCoverAction(basePlayers, baseDeck, baseDiscard, actingIdx, targetIdx, blocked) {
    const nextPlayers = clone(basePlayers);
    if (blocked) {
      nextPlayers[targetIdx].closetCovered = true;
      addLog(actingIdx, `cubrió el perchero de ${nextPlayers[targetIdx].name}`, nextPlayers);
    } else {
      addLog(targetIdx, `evitó el perchero cubierto descartando 2 cartas`, nextPlayers);
    }
    pendingClosetCoverRef.current = null;
    setModal(null);
    endTurn(nextPlayers, baseDeck, baseDiscard, actingIdx);
  }

  function promptClosetCoverResponse(actingIdx, targetIdx, basePlayers, baseDeck, baseDiscard) {
    const target = basePlayers[targetIdx];
    if (!target) {
      endTurn(basePlayers, baseDeck, baseDiscard, actingIdx);
      return;
    }
    if (target.hand.length < 2) {
      finishClosetCoverAction(basePlayers, baseDeck, baseDiscard, actingIdx, targetIdx, true);
      return;
    }
    if (target.isAI) {
      const shouldAvoid = shouldAIAvoidClosetCover(target);
      if (shouldAvoid) {
        const discardIndices = getClosetCoverDiscardIndices(target).sort((a, b) => b - a);
        const nextPlayers = clone(basePlayers);
        const nextDiscard = [...baseDiscard];
        discardIndices.forEach((discardIdx) => {
          const discarded = nextPlayers[targetIdx].hand.splice(discardIdx, 1)[0];
          if (discarded) nextDiscard.push(discarded);
        });
        finishClosetCoverAction(nextPlayers, baseDeck, nextDiscard, actingIdx, targetIdx, false);
        return;
      }
      finishClosetCoverAction(basePlayers, baseDeck, baseDiscard, actingIdx, targetIdx, true);
      return;
    }
    pendingClosetCoverRef.current = { actingIdx, targetIdx, basePlayers: clone(basePlayers), baseDeck: [...baseDeck], baseDiscard: [...baseDiscard] };
    setModal({ type: 'closetCoverResponse', actingIdx, targetIdx, selected: [] });
  }

  function resolveClosetCoverResponse(avoid, selectedIds = []) {
    const pending = pendingClosetCoverRef.current;
    if (!pending) {
      setModal(null);
      return;
    }
    const { actingIdx, targetIdx, basePlayers, baseDeck, baseDiscard } = pending;
    if (!avoid) {
      finishClosetCoverAction(basePlayers, baseDeck, baseDiscard, actingIdx, targetIdx, true);
      return;
    }
    const nextPlayers = clone(basePlayers);
    const nextDiscard = [...baseDiscard];
    const idSet = new Set(selectedIds);
    const chosen = nextPlayers[targetIdx].hand.filter((card) => idSet.has(card.id)).slice(0, 2).map((card) => card.id);
    if (chosen.length < 2) return;
    nextPlayers[targetIdx].hand = nextPlayers[targetIdx].hand.filter((card) => {
      if (!idSet.has(card.id) || chosen.length === 0) return true;
      const shouldDiscard = chosen.includes(card.id);
      if (shouldDiscard) nextDiscard.push(card);
      return !shouldDiscard;
    });
    finishClosetCoverAction(nextPlayers, baseDeck, nextDiscard, actingIdx, targetIdx, false);
  }

  // â”€â”€ NegaciÃ³n: check before applying any action â”€â”€
  // resolveCallback: () => void  â€” called if action is NOT negated
  function startNegCheck(actingIdx, card, resolveCallback, affectedIdxs) {
    if (!actionCanBeNegated(card, affectedIdxs)) {
      resolveCallback();
      return;
    }
    const pls = playersRef.current;
    // Find players who can negate (only affected players with a negaciÃ³n card)
    const eligible = pls.map((_, i) => i).filter(i =>
      i !== actingIdx && pls[i].hand.some(c => c.action === 'negacion') &&
      (!affectedIdxs || affectedIdxs.includes(i))
    );

    if (eligible.length === 0) { resolveCallback(); return; }

    const aiConfig = getAIDifficultyConfig();
    // AI players decide immediately according to difficulty and board impact
    const responses = {};
    for (const i of eligible) {
      if (pls[i].isAI) responses[i] = shouldAINegate(pls, i, actingIdx, card, affectedIdxs, aiConfig);
    }
    const aiNegator = eligible
      .filter(i => pls[i].isAI && responses[i] === true)
      .sort((a, b) => estimateAINegationThreat(pls, b, actingIdx, card, affectedIdxs) - estimateAINegationThreat(pls, a, actingIdx, card, affectedIdxs))[0];
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
    const negEvent = {
      id: `${Date.now()}-${Math.random()}`,
      actingIdx,
      negatorIdx,
      negatorName: newPls[negatorIdx]?.name || 'Oponente',
      actionName: getActionInfo(card.action)?.name || 'Acción',
    };
    addLog(negatorIdx, `usÃ³ ðŸš« NegaciÃ³n contra ${newPls[actingIdx].name}!`, newPls);
    setLastNegationEvent(negEvent);
    if (actingIdx === HI) {
      lastNegationSeenRef.current = negEvent.id;
      setNegationFx(negEvent);
    }
    setPendingNeg(null); pendingNegRef.current = null;
    if (newPls[actingIdx]?.isAI) {
      releaseAITurnLock();
    }
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

  // -- Start game (local / vs AI) --
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
    const normalizedConfig = buildGameConfig(gameConfig);
    const rawDeck = generateDeck(normalizedConfig);
    const deckArr = [...rawDeck];
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
    releaseAITurnLock();
    setPhase('playing');
  }

  // â”€â”€ Start game (online host) â”€â”€
  function startOnlineGame(hatPicks, gameConfig, onlinePls) {
    const normalizedConfig = buildGameConfig(gameConfig);
    const rawDeck = generateDeck(normalizedConfig);
    const deckArr = [...rawDeck];
    const ps = onlinePls.map(p => initPlayer(p.name, deckArr, hatPicks[p.name] || p.hat, normalizedConfig, !!p.isAI));
    // Mark non-host players as remote
    ps.forEach((p, i) => { if (i !== 0 && !p.isAI) p.isRemote = true; });
    setPlayers(ps); setDeck(deckArr); setDiscard([]);
    setCp(0); setLog([]); setSelectedIdx(null); setModal(null);
    setWinner(null); setExtraPlay(false); setCurrentGameConfig(normalizedConfig);
    releaseAITurnLock();
    // Update session to reflect game started
    const session = getRoomSession();
    if (session) saveRoomSession({ ...session, phase: 'playing' });
    setPhase('playing');
  }

  // â”€â”€ Shared targeted action resolution (used by host for both local and remote players) â”€â”€
  function applyTargetedAction(card, actingIdx, ti, action, pls, dk, di) {
    if (card.action === 'gloton') {
      triggerGlotonEvent(actingIdx, ti, [...pls[ti].table], pls[actingIdx]?.name || 'Jugador');
      pls[ti].table.forEach(ing => di.push({ type: 'ingredient', ingredient: ingKey(ing), id: uid() }));
      pls[ti].table = [];
      endTurnFromRemote(pls, dk, di, actingIdx);
    } else if (card.action === 'tenedor' && action.ingIdx !== undefined) {
      const sourceSlotIdx = ti === HI ? getTableSlotIndexForCurrentBurger(pls[ti], action.ingIdx) : null;
      const stolen = pls[ti].table.splice(action.ingIdx, 1)[0];
      pls[actingIdx].table.push(stolen);
      const forkEvent = {
        id: `${Date.now()}-${Math.random()}`,
        actingIdx,
        targetIdx: ti,
        actorName: pls[actingIdx]?.name || 'Oponente',
        ingredient: ingKey(stolen),
        stolenRaw: stolen,
        sourceIngIdx: action.ingIdx,
        sourceSlotIdx,
      };
      setLastForkEvent(forkEvent);
      if (!isOnline || ti === HI || actingIdx === HI) {
        lastForkSeenRef.current = forkEvent.id;
        setForkFx(forkEvent);
      }
      const { player: up, freed, done } = advanceBurger(pls[actingIdx]);
      pls[actingIdx] = up;
      if (done) { freed.forEach(ing => di.push({ type: 'ingredient', ingredient: ingKey(ing), id: uid() })); }
      endTurnFromRemote(pls, dk, di, actingIdx);
    } else if (card.action === 'ladron') {
      if (pls[ti].mainHats.length > 0) {
        const stealHat = action.hatLang && pls[ti].mainHats.includes(action.hatLang)
          ? action.hatLang
          : pls[ti].mainHats[0];
        const stealIdx = pls[ti].mainHats.indexOf(stealHat);
        const stolen = pls[ti].mainHats.splice(stealIdx, 1)[0];
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
    } else if (card.action === 'perchero_cubierto') {
      promptClosetCoverResponse(actingIdx, ti, pls, dk, di);
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
                if (card.action === 'comecomodines') {
                  triggerComeComodinesEvent(r, idx, fp[idx]?.name || 'Jugador');
                } else if (card.action === 'milanesa') {
                  triggerMilanesaEvent(r);
                } else if (card.action === 'ensalada') {
                  triggerEnsaladaEvent(r);
                } else if (card.action === 'pizza') {
                  triggerPizzaEvent(r);
                } else if (card.action === 'parrilla') {
                  triggerParrillaEvent(r);
                }
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

            } else if (type === 'closetCoverResponse') {
              if (!pendingClosetCoverRef.current) return;
              resolveClosetCoverResponse(!!action.avoid, action.discardIds || []);
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
              if (p.closetCovered) return;
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
              if (p.closetCovered) return;
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
    if (newPls[fromIdx]?.closetCovered) {
      if (newPls === pls) newPls = clone(pls);
      newPls[fromIdx].closetCovered = false;
    }
    const w = checkWin(newPls);
      if (w) {
        setPlayers(newPls); setDeck(newDeck); setDiscard(newDiscard);
        // Emit final sync with winner BEFORE changing phase (the useEffect guard
        // blocks sync when phase !== 'playing', so we must emit directly here)
          if (isOnline && isHost) {
            socket.emit('syncState', {
              code: roomCode,
              state: { players: newPls, deck: newDeck, discard: newDiscard, cp, log, extraPlay, modal: null, pendingNeg: null, lastNegationEvent, lastForkEvent, lastComeComodinesEvent, lastGlotonEvent, lastMilanesaEvent, lastEnsaladaEvent, lastPizzaEvent, lastParrillaEvent, winner: w, gameConfig: currentGameConfig, phase: 'playing' },
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
  function getRemainingNeeds(playerLike) {
    if (!playerLike || playerLike.currentBurger >= playerLike.totalBurgers) return [];
    const burger = playerLike.burgers[playerLike.currentBurger] || [];
    const remaining = [...burger];
    const tableCopy = (playerLike.table || []).map(t => t.startsWith('perrito|') ? t.split('|')[1] : t);
    for (let i = remaining.length - 1; i >= 0; i--) {
      const idx = tableCopy.indexOf(remaining[i]);
      if (idx !== -1) {
        remaining.splice(i, 1);
        tableCopy.splice(idx, 1);
      }
    }
    return remaining;
  }

  function getTableSlotIndexForCurrentBurger(playerLike, tableIndex) {
    if (!playerLike || tableIndex == null || tableIndex < 0) return null;
    const targetBurger = playerLike.burgers?.[playerLike.currentBurger] || [];
    const table = playerLike.table || [];
    if (!targetBurger.length || tableIndex >= table.length) return null;

    const used = new Array(targetBurger.length).fill(false);
    for (let i = 0; i <= tableIndex; i += 1) {
      const raw = table[i];
      const base = ingKey(raw);
      const chosen = ingChosen(raw);
      let slotIdx = -1;

      if (chosen) {
        slotIdx = targetBurger.findIndex((ing, idx) => !used[idx] && ing === chosen);
      } else if (raw === 'perrito') {
        slotIdx = targetBurger.findIndex((_, idx) => !used[idx]);
      } else {
        slotIdx = targetBurger.findIndex((ing, idx) => !used[idx] && ing === base);
      }

      if (slotIdx !== -1) {
        used[slotIdx] = true;
        if (i === tableIndex) return slotIdx;
      }
    }
    return null;
  }

  function scoreIngredientForNeeds(card, needs) {
    if (!card || card.type !== 'ingredient') return -999;
    if (card.ingredient === 'perrito') return needs.length > 0 ? 80 + needs.length : 10;
    const copiesNeeded = needs.filter(n => n === card.ingredient).length;
    return copiesNeeded > 0 ? 100 + copiesNeeded * 10 : -50;
  }

  function getBestPlayableIngredientOption(playerLike) {
    const needs = getRemainingNeeds(playerLike);
    let best = null;
    playerLike.hand.forEach((card, handIdx) => {
      if (card.type !== 'ingredient') return;
      if (!canPlayCard(playerLike, card)) return;
      const score = scoreIngredientForNeeds(card, needs);
      if (!best || score > best.score) {
        best = { handIdx, card, score };
      }
    });
    return best;
  }

  function getCardKeepScore(card, nextHats, needs) {
    if (card.type === 'ingredient') {
      const matchesHat = nextHats.includes(card.language);
      const ingredientScore = card.ingredient === 'perrito'
        ? (needs.length > 0 ? 120 : 20)
        : (needs.includes(card.ingredient) ? 160 + needs.filter(n => n === card.ingredient).length * 8 : (matchesHat ? 20 : 0));
      return ingredientScore + (matchesHat ? 30 : -20);
    }
    if (card.action === 'negacion') return 75;
    if (['tenedor', 'gloton', 'intercambio_hamburguesa', 'ladron', 'intercambio_sombreros', 'perchero_cubierto'].includes(card.action)) return 45;
    if (['basurero', 'parrilla', 'pizza', 'ensalada', 'milanesa', 'comecomodines'].includes(card.action)) return 35;
    return 10;
  }

  function chooseDiscardIndicesForChange(playerLike, hatLang, forcedKeepIdx) {
    const cost = Math.ceil(playerLike.hand.length / 2);
    const keepCount = Math.max(0, playerLike.hand.length - cost);
    const nextHats = [hatLang, ...playerLike.mainHats.slice(1)];
    const needs = getRemainingNeeds({ ...playerLike, mainHats: nextHats });
    const ranked = playerLike.hand.map((card, idx) => ({
      idx,
      score: getCardKeepScore(card, nextHats, needs) + (idx === forcedKeepIdx ? 1000 : 0),
    })).sort((a, b) => b.score - a.score);
    const keep = new Set(ranked.slice(0, keepCount).map(item => item.idx));
    if (forcedKeepIdx !== undefined) keep.add(forcedKeepIdx);
    const discards = [];
    playerLike.hand.forEach((_, idx) => {
      if (!keep.has(idx)) discards.push(idx);
    });
    return discards.slice(0, cost);
  }

  function getDeckHatFutureScore(deckArr, hatLang, needs) {
    return deckArr.reduce((sum, card) => {
      if (card.type !== 'ingredient') return sum;
      if (card.language !== hatLang) return sum;
      if (card.ingredient === 'perrito') return sum + (needs.length > 0 ? 3 : 0);
      return sum + (needs.includes(card.ingredient) ? 4 : 0);
    }, 0);
  }

  function getAIDifficulty() {
    return currentGameConfig?.aiDifficulty || 'medium';
  }

  function getAIDifficultyConfig() {
    const difficulty = getAIDifficulty();
    if (difficulty === 'easy') {
      return {
        ingredientMode: 'random',
        changeChance: 0.18,
        addChance: 0.08,
        negationChance: 0.08,
        actionChance: 0.35,
        actionMode: 'random',
        discardMode: 'random',
        targetHumanBias: 0,
      };
    }
    if (difficulty === 'hard') {
      return {
        ingredientMode: 'best',
        changeChance: 0.95,
        addChance: 0.75,
        negationChance: 0.58,
        actionChance: 0.85,
        actionMode: 'smart',
        discardMode: 'smart',
        targetHumanBias: 18,
      };
    }
    if (difficulty === 'impossible') {
      return {
        ingredientMode: 'best',
        changeChance: 1,
        addChance: 1,
        negationChance: 1,
        actionChance: 1,
        actionMode: 'perfect',
        discardMode: 'smart',
        targetHumanBias: 45,
      };
    }
    return {
      ingredientMode: 'mixed',
      changeChance: 0.45,
      addChance: 0.2,
      negationChance: 0.25,
      actionChance: 0.55,
      actionMode: 'basic',
      discardMode: 'mixed',
      targetHumanBias: 8,
    };
  }

  function getPlayableIngredientOptions(playerLike) {
    const needs = getRemainingNeeds(playerLike);
    return playerLike.hand
      .map((card, handIdx) => ({ card, handIdx }))
      .filter(({ card }) => card.type === 'ingredient' && canPlayCard(playerLike, card))
      .map(({ card, handIdx }) => ({
        card,
        handIdx,
        score: scoreIngredientForNeeds(card, needs),
      }))
      .sort((a, b) => b.score - a.score);
  }

  function chooseIngredientOptionForDifficulty(playerLike, aiConfig) {
    const options = getPlayableIngredientOptions(playerLike);
    if (!options.length) return null;
    if (aiConfig.ingredientMode === 'best') return options[0];
    if (aiConfig.ingredientMode === 'random') return options[randInt(0, options.length - 1)];
    return Math.random() < 0.7 ? options[0] : options[randInt(0, options.length - 1)];
  }

  function getAITargetPriority(pls, aiIdx, targetIdx, aiConfig) {
    const target = pls[targetIdx];
    if (!target) return -999;
    let score = target.table.length * 12 + (target.completed || 0) * 25 + target.mainHats.length * 6;
    if (!target.isAI) score += aiConfig.targetHumanBias;
    return score;
  }

  function getBestAIOpponent(pls, aiIdx, aiConfig) {
    const opponents = pls
      .map((_, i) => i)
      .filter(i => i !== aiIdx);
    if (!opponents.length) return null;
    return opponents.reduce((best, current) =>
      getAITargetPriority(pls, aiIdx, current, aiConfig) > getAITargetPriority(pls, aiIdx, best, aiConfig)
        ? current
        : best,
    opponents[0]);
  }

  function chooseDiscardIndexForDifficulty(playerLike, aiConfig) {
    if (!playerLike.hand.length) return 0;
    if (aiConfig.discardMode === 'random') return randInt(0, playerLike.hand.length - 1);
    const needs = getRemainingNeeds(playerLike);
    const ranked = playerLike.hand
      .map((card, handIdx) => ({ handIdx, score: getCardKeepScore(card, playerLike.mainHats, needs) }))
      .sort((a, b) => a.score - b.score);
    if (aiConfig.discardMode === 'mixed' && ranked.length > 1 && Math.random() < 0.35) {
      const pool = ranked.slice(0, Math.min(3, ranked.length));
      return pool[randInt(0, pool.length - 1)].handIdx;
    }
    return ranked[0]?.handIdx ?? 0;
  }

  function getMassActionScore(action, pls, aiIdx, aiConfig) {
    const others = pls.filter((_, i) => i !== aiIdx);
    const humanTargets = others.filter(p => !p.isAI);
    const tableValue = (table, predicate) => table.reduce((sum, ing) => sum + (predicate(ing) ? 1 : 0), 0);
    let score = 0;
    if (action === 'milanesa') score = others.reduce((sum, p) => sum + tableValue(p.table, ing => ['pan', 'huevo'].includes(ingKey(ing))), 0) * 16;
    if (action === 'ensalada') score = others.reduce((sum, p) => sum + tableValue(p.table, ing => ['lechuga', 'tomate', 'cebolla', 'palta'].includes(ingKey(ing))), 0) * 14;
    if (action === 'pizza') score = others.reduce((sum, p) => sum + tableValue(p.table, ing => ingKey(ing) === 'queso'), 0) * 18;
    if (action === 'parrilla') score = others.reduce((sum, p) => sum + tableValue(p.table, ing => ['pollo', 'carne'].includes(ingKey(ing))), 0) * 18;
    if (action === 'comecomodines') score = others.reduce((sum, p) => sum + tableValue(p.table, ing => String(ing).startsWith('perrito|')), 0) * 22;
    if (aiConfig.actionMode === 'perfect') {
      score += humanTargets.reduce((sum, p) => sum + p.table.length * 6, 0);
    }
    return score;
  }

  function getTargetedActionScore(action, pls, aiIdx, targetIdx, aiConfig) {
    const self = pls[aiIdx];
    const target = pls[targetIdx];
    if (!self || !target) return -999;
    const needs = getRemainingNeeds(self);
    const targetTableNorm = target.table.map(ing => ingKey(ing));
    const neededOnTable = targetTableNorm.filter(ing => needs.includes(ing)).length;
    let score = 0;
    if (action === 'gloton') score = target.table.length * 28;
    if (action === 'tenedor') score = target.table.length ? (neededOnTable * 35) + (target.table.length * 8) : -10;
    if (action === 'ladron') {
      const usefulHat = target.mainHats.some(h => self.hand.some(card => card.type === 'ingredient' && card.language === h));
      score = target.mainHats.length ? (usefulHat ? 55 : 25) : -20;
    }
    if (action === 'intercambio_sombreros') {
      const theirHat = target.mainHats[0];
      const helpsMe = theirHat && self.hand.some(card => card.type === 'ingredient' && card.language === theirHat);
      score = helpsMe ? 52 : (target.mainHats.length ? 18 : -20);
    }
    if (action === 'intercambio_hamburguesa') {
      const myProgress = self.table.length;
      const theirProgress = target.table.length;
      score = (theirProgress - myProgress) * 20;
    }
    if (action === 'perchero_cubierto') {
      const usefulCloset = target.perchero?.length > 0 || target.mainHats?.length > 1;
      score = usefulCloset ? 42 : 10;
    }
    if (!target.isAI) score += aiConfig.targetHumanBias;
    return score;
  }

  function chooseAIAction(play, pls, aiIdx, aiConfig) {
    const candidates = play.hand
      .map((card, handIdx) => ({ card, handIdx }))
      .filter(({ card }) => card.type === 'action' && card.action !== 'negacion' && card.action !== 'basurero');
    if (!candidates.length) return null;

    if (aiConfig.actionMode === 'random') {
      return Math.random() <= aiConfig.actionChance
        ? candidates[randInt(0, candidates.length - 1)]
        : null;
    }

    const opponents = pls.map((_, i) => i).filter(i => i !== aiIdx);
    const ranked = candidates.map((entry) => {
      const { card } = entry;
      let targetIdx = null;
      let score = -999;
      if (['milanesa', 'ensalada', 'pizza', 'parrilla', 'comecomodines'].includes(card.action)) {
        score = getMassActionScore(card.action, pls, aiIdx, aiConfig);
      } else {
        opponents.forEach((opponentIdx) => {
          const s = getTargetedActionScore(card.action, pls, aiIdx, opponentIdx, aiConfig);
          if (s > score) {
            score = s;
            targetIdx = opponentIdx;
          }
        });
      }
      return { ...entry, score, targetIdx };
    }).sort((a, b) => b.score - a.score);

    const best = ranked[0];
    if (!best || best.score <= 0) return null;
    if (aiConfig.actionMode === 'basic' && Math.random() > aiConfig.actionChance) return null;
    return best;
  }

  // —— AI Turn ——
  function runAITurn(pls, deckArr, discardArr, idx) {
    if (aiRunning.current) return;
    markAITurnLock(idx);
    const p = pls[idx];
    const aiConfig = getAIDifficultyConfig();

    const playIngredientAndEnd = (basePlayers, baseDiscard, baseDeck, handIdx, logPlayersOverride = null) => {
      const newPls = clone(basePlayers);
      const card = newPls[idx].hand.splice(handIdx, 1)[0];
      addLog(idx, `jugó ${getIngName(card.ingredient, card.language)} ${ING_EMOJI[card.ingredient]}`, logPlayersOverride || basePlayers);
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
      let newDiscard = [...baseDiscard, card];
      if (done) {
        freed.forEach(ing => newDiscard.push({ type: 'ingredient', ingredient: ingKey(ing), id: `f${Date.now()}${Math.random()}` }));
        addLog(idx, '¡completó una hamburguesa! 🎉', newPls);
      }
      setTimeout(() => { releaseAITurnLock(); endTurn(newPls, baseDeck, newDiscard, idx); }, 900);
    };

    const executeAIActionAndEnd = (chosenAction) => {
      if (!chosenAction) return false;
      const actionIdx = chosenAction.handIdx;
      const card = p.hand[actionIdx];
      if (!card) return false;
      const info = getActionInfo(card.action);
      const fallbackTarget = getBestAIOpponent(pls, idx, aiConfig);
      const richest = chosenAction.targetIdx ?? fallbackTarget;
      addLog(idx, `jugó ${info.name} ${info.emoji}`, pls);

      const affected = ['milanesa', 'ensalada', 'pizza', 'parrilla', 'comecomodines'].includes(card.action)
        ? undefined
        : (richest !== null && richest !== undefined ? [richest] : undefined);

      startNegCheck(idx, card, () => {
        let newPls = clone(playersRef.current);
        let newDiscard = [...discardRef.current, card];
        const currentIdx = newPls[idx].hand.findIndex(c => c.id === card.id);
        if (currentIdx !== -1) newPls[idx].hand.splice(currentIdx, 1);

        const mass = ['milanesa', 'ensalada', 'pizza', 'parrilla', 'comecomodines'];
          if (mass.includes(card.action)) {
            const r = applyMass(newPls, newDiscard, card.action, idx);
            if (card.action === 'comecomodines') {
              triggerComeComodinesEvent(r, idx, newPls[idx]?.name || 'IA');
            } else if (card.action === 'milanesa') {
              triggerMilanesaEvent(r);
            } else if (card.action === 'ensalada') {
              triggerEnsaladaEvent(r);
            } else if (card.action === 'pizza') {
              triggerPizzaEvent(r);
            } else if (card.action === 'parrilla') {
            triggerParrillaEvent(r);
          }
          newPls = r.players; newDiscard = r.discard;
        } else if (richest !== null && richest !== undefined) {
            if (card.action === 'gloton') {
              triggerGlotonEvent(idx, richest, [...newPls[richest].table], newPls[idx]?.name || 'IA');
              newPls[richest].table.forEach(ing => newDiscard.push({ type: 'ingredient', ingredient: ingKey(ing), id: `g${Date.now()}${Math.random()}` }));
              newPls[richest].table = [];
              addLog(idx, `vació la mesa de ${pls[richest].name}`, newPls);
          } else if (card.action === 'tenedor') {
            if (newPls[richest].table.length > 0) {
              const wanted = getRemainingNeeds(newPls[idx]);
              let si = newPls[richest].table.findIndex(ing => wanted.includes(ingKey(ing)));
              if (si === -1) si = randInt(0, newPls[richest].table.length - 1);
              const sourceSlotIdx = richest === HI ? getTableSlotIndexForCurrentBurger(newPls[richest], si) : null;
              const stolen = newPls[richest].table.splice(si, 1)[0];
              newPls[idx].table.push(stolen);
              const forkEvent = {
                id: `${Date.now()}-${Math.random()}`,
                actingIdx: idx,
                targetIdx: richest,
                actorName: newPls[idx]?.name || 'IA',
                ingredient: ingKey(stolen),
                stolenRaw: stolen,
                sourceIngIdx: si,
                sourceSlotIdx,
              };
              setLastForkEvent(forkEvent);
              if (!isOnline || richest === HI) {
                lastForkSeenRef.current = forkEvent.id;
                setForkFx(forkEvent);
              }
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
          } else if (card.action === 'perchero_cubierto') {
            promptClosetCoverResponse(idx, richest, newPls, deckArr, newDiscard);
            return;
          }
        }

        setTimeout(() => { releaseAITurnLock(); endTurn(newPls, deckArr, newDiscard, idx); }, 900);
      }, affected);
      return true;
    };

    const openingAction = aiConfig.actionMode === 'perfect' ? chooseAIAction(p, pls, idx, aiConfig) : null;
    if (openingAction && openingAction.score >= 35 && executeAIActionAndEnd(openingAction)) {
      return;
    }

    const bestPlayable = chooseIngredientOptionForDifficulty(p, aiConfig);
    if (bestPlayable) {
      playIngredientAndEnd(pls, discardArr, deckArr, bestPlayable.handIdx, pls);
      return;
    }

    if (!p.closetCovered && p.perchero.length > 0 && p.hand.length > 0 && !extraPlay && Math.random() <= aiConfig.changeChance) {
      let bestChange = null;
      for (const hatLang of p.perchero) {
        const simulated = clone([p])[0];
        simulated.mainHats[0] = hatLang;
        const bestAfterChange = chooseIngredientOptionForDifficulty(simulated, { ...aiConfig, ingredientMode: 'best' });
        if (!bestAfterChange) continue;
        const discardIndices = chooseDiscardIndicesForChange(p, hatLang, bestAfterChange.handIdx);
        if (discardIndices.includes(bestAfterChange.handIdx)) continue;
        const score = bestAfterChange.score + 40 - discardIndices.length * 2;
        if (!bestChange || score > bestChange.score) {
          bestChange = { hatLang, bestAfterChange, discardIndices, score };
        }
      }
      if (bestChange) {
        const newPls = clone(pls);
        const ai = newPls[idx];
        const hi = ai.perchero.indexOf(bestChange.hatLang);
        ai.perchero.splice(hi, 1);
        const oldMain = ai.mainHats[0];
        ai.mainHats[0] = bestChange.hatLang;
        ai.perchero.push(oldMain);
        const sorted = [...bestChange.discardIndices].sort((a, b) => b - a);
        const discarded = sorted.map(i => ai.hand.splice(i, 1)[0]);
        const newDiscard = [...discardArr, ...discarded];
        addLog(idx, `cambió sombrero a ${bestChange.hatLang} para jugar mejor su hamburguesa`, newPls);
        const targetCardId = p.hand[bestChange.bestAfterChange.handIdx]?.id;
        const newHandIdx = ai.hand.findIndex(card => card.id === targetCardId);
        if (newHandIdx !== -1) {
          playIngredientAndEnd(newPls, newDiscard, deckArr, newHandIdx, newPls);
          return;
        }
        setTimeout(() => { releaseAITurnLock(); endTurn(newPls, deckArr, newDiscard, idx); }, 700);
        return;
      }
    }

    if (!p.closetCovered && p.perchero.length > 0 && p.hand.length > 0 && p.maxHand > 1 && p.mainHats.length < 3 && !extraPlay && Math.random() <= aiConfig.addChance) {
      const needs = getRemainingNeeds(p);
      let bestAdd = null;
      for (const hatLang of p.perchero) {
        const futureScore = getDeckHatFutureScore(deckArr, hatLang, needs);
        if (futureScore <= 0) continue;
        const simPlayers = clone(pls);
        const ai = simPlayers[idx];
        const hi = ai.perchero.indexOf(hatLang);
        ai.perchero.splice(hi, 1);
        ai.mainHats.push(hatLang);
        ai.manuallyAddedHats = [...(ai.manuallyAddedHats || []), hatLang];
        let simDiscard = [...discardArr, ...ai.hand];
        ai.hand = [];
        ai.maxHand = Math.max(1, ai.maxHand - 1);
        const { drawn, deck: nextDeck, discard: nextDiscard } = drawN(deckArr, simDiscard, ai.maxHand);
        ai.hand = drawn;
        const bestAfterAdd = chooseIngredientOptionForDifficulty(ai, { ...aiConfig, ingredientMode: 'best' });
        const score = futureScore + (bestAfterAdd ? bestAfterAdd.score + 30 : 0);
        if (!bestAdd || score > bestAdd.score) {
          bestAdd = { hatLang, players: simPlayers, discard: nextDiscard, deck: nextDeck, bestAfterAdd, score };
        }
      }
      if (bestAdd) {
        addLog(idx, `agregó sombrero ${bestAdd.hatLang} para acercarse a su hamburguesa`, bestAdd.players);
        if (bestAdd.bestAfterAdd) {
          playIngredientAndEnd(bestAdd.players, bestAdd.discard, bestAdd.deck, bestAdd.bestAfterAdd.handIdx, bestAdd.players);
          return;
        }
        setTimeout(() => { releaseAITurnLock(); endTurn(bestAdd.players, bestAdd.deck, bestAdd.discard, idx); }, 700);
        return;
      }
    }

    const chosenAction = chooseAIAction(p, pls, idx, aiConfig);
    if (chosenAction && executeAIActionAndEnd(chosenAction)) {
      return;
    }

    const di2 = chooseDiscardIndexForDifficulty(p, aiConfig);
    if (p.hand.length > 0) {
      addLog(idx, `descartó una carta`, pls);
      const newPls = clone(pls);
      const card = newPls[idx].hand.splice(di2, 1)[0];
      const newDiscard2 = [...discardArr, card];
      setTimeout(() => { releaseAITurnLock(); endTurn(newPls, deckArr, newDiscard2, idx); }, 700);
    } else {
      releaseAITurnLock();
      endTurn(pls, deckArr, discardArr, idx);
    }
  }

  // —— AI useEffect ——
  useEffect(() => {
    if (phase !== 'playing') return;
    if (!players.length) return;
    if (players[cp]?.isRemote) return;
    if (!players[cp]?.isAI) return;
    if (modal) return;
    if (pendingNeg) return;

    const lockAge = Date.now() - (aiRunningMeta.current.startedAt || 0);
    if (aiRunning.current && (aiRunningMeta.current.idx !== cp || lockAge > 6500)) {
      console.warn('Releasing stale AI lock', aiRunningMeta.current);
      releaseAITurnLock();
    }

    const timer = setTimeout(() => {
      try {
        runAITurn(players, deck, discard, cp);
      } catch (error) {
        console.error('AI turn crashed, forcing endTurn fallback:', error);
        releaseAITurnLock();
        const pls = playersRef.current;
        const dk = deckRef.current;
        const di = discardRef.current;
        if (pls[cp]?.isAI) {
          endTurn(pls, dk, di, cp);
        }
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [phase, cp, players, deck, discard, modal, pendingNeg, releaseAITurnLock]);
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
    style.textContent = `
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
      @keyframes forkHook{
        0%{transform:translate(-50%,-50%) scale(.55) rotate(-22deg);opacity:0}
        20%{opacity:1}
        55%{transform:translate(-50%,-58%) scale(1.04) rotate(-8deg);opacity:1}
        100%{transform:translate(-50%,-50%) scale(.96) rotate(0deg);opacity:1}
      }
      @keyframes forkDrop{
        0%{transform:translate(-50%,-64%) scale(.72);opacity:0}
        45%{opacity:1}
        70%{transform:translate(-50%,-52%) scale(1.12);opacity:1}
        100%{transform:translate(-50%,-50%) scale(1);opacity:1}
      }
    `;
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
    if (isClosetActionBlocked(players[HI], card.action)) return;
    if (mass.includes(card.action)) {
      socket.emit('playerAction', { code: roomCode, action: { type: 'playMass', cardIdx } });
      setSelectedIdx(null);
    } else if (card.action === 'basurero') {
      const ingCards = discard.filter(c => c.type === 'ingredient');
      if (ingCards.length === 0) { alert('El basurero estÃ¡ vacÃ­o'); return; }
      setModal({ type: 'basurero', cardIdx, cards: ingCards });
    } else if (['tenedor', 'ladron', 'intercambio_sombreros', 'intercambio_hamburguesa', 'gloton', 'perchero_cubierto'].includes(card.action)) {
      setModal({ type: 'pickTarget', cardIdx, action: card.action });
    } else if (card.action === 'negacion') {
      alert('NegaciÃ³n se juega automÃ¡ticamente cuando un oponente juega una acciÃ³n.');
    }
  }

  function humanPlayAction(card, cardIdx) {
    const info = getActionInfo(card.action);
    const mass = ['milanesa', 'ensalada', 'pizza', 'parrilla', 'comecomodines'];
    const targeted = ['tenedor', 'ladron', 'intercambio_sombreros', 'intercambio_hamburguesa', 'gloton', 'perchero_cubierto'];
    const sourceCardEl = handCardRefs.current[cardIdx];
    const sourcePoint = sourceCardEl
      ? (() => {
          const rect = sourceCardEl.getBoundingClientRect();
          return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        })()
      : null;

    if (card.action === 'negacion') {
      alert('NegaciÃ³n se juega automÃ¡ticamente cuando un oponente juega una acciÃ³n.');
      return;
    }
    if (isClosetActionBlocked(players[HI], card.action)) {
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
          const massResult = applyMass(newPls, newDiscard, card.action, HI);
          if (card.action === 'comecomodines') {
            massResult.sourcePoint = sourcePoint;
            triggerComeComodinesEvent(massResult, HI, newPls[HI]?.name || 'Jugador');
          } else if (card.action === 'milanesa') {
            triggerMilanesaEvent(massResult);
          } else if (card.action === 'ensalada') {
            triggerEnsaladaEvent(massResult);
          } else if (card.action === 'pizza') {
            triggerPizzaEvent(massResult);
          } else if (card.action === 'parrilla') {
            triggerParrillaEvent(massResult);
          }
          const { players: ps2, discard: di2 } = massResult;
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
      } else if (action === 'ladron') {
        setModal({ type: 'pickHatSteal', targetIdx, cardIdx, isRemote: true });
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
        triggerGlotonEvent(HI, targetIdx, [...newPls[targetIdx].table], newPls[HI]?.name || 'Jugador');
        newPls[targetIdx].table.forEach(ing => newDiscard.push({ type: 'ingredient', ingredient: ingKey(ing), id: `g${Date.now()}` }));
        newPls[targetIdx].table = [];
        endTurn(newPls, dk, newDiscard, HI);

      } else if (action === 'tenedor') {
        if (newPls[targetIdx].table.length === 0) return;
        setModal({ type: 'pickIngredient', targetIdx, newPls, newDiscard });

      } else if (action === 'ladron') {
        if (newPls[targetIdx].mainHats.length === 0) return;
        setModal({ type: 'pickHatSteal', targetIdx, newPls, newDiscard, dk });

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

      } else if (action === 'perchero_cubierto') {
        promptClosetCoverResponse(HI, targetIdx, newPls, dk, newDiscard);

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
    const sourceSlotIdx = targetIdx === HI ? getTableSlotIndexForCurrentBurger(newPls[targetIdx], ingIdx) : null;
    const stolen = newPls[targetIdx].table.splice(ingIdx, 1)[0];
    newPls[HI].table.push(stolen);
    const forkEvent = {
      id: `${Date.now()}-${Math.random()}`,
      actingIdx: HI,
      targetIdx,
      actorName: newPls[HI]?.name || 'Jugador',
      ingredient: ingKey(stolen),
      stolenRaw: stolen,
      sourceIngIdx: ingIdx,
      sourceSlotIdx,
    };
    setLastForkEvent(forkEvent);
    if (!isOnline || targetIdx === HI) {
      lastForkSeenRef.current = forkEvent.id;
      setForkFx(forkEvent);
    }
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

  function resolveHatSteal(hatLang) {
    const { targetIdx, newPls, newDiscard, dk, cardIdx, isRemote } = modal;
    setModal(null); setSelectedIdx(null);
    if (isOnline && !isHost) {
      socket.emit('playerAction', { code: roomCode, action: { type: 'playActionTarget', cardIdx, targetIdx, action: 'ladron', hatLang } });
      return;
    }
    if (!newPls[targetIdx].mainHats.includes(hatLang)) {
      endTurn(newPls, dk || deck, newDiscard || discard, HI);
      return;
    }
    const stealIdx = newPls[targetIdx].mainHats.indexOf(hatLang);
    const stolen = newPls[targetIdx].mainHats.splice(stealIdx, 1)[0];
    newPls[HI].mainHats.push(stolen);
    if (newPls[targetIdx].mainHats.length > 0) {
      newPls[targetIdx].maxHand = Math.min(6, newPls[targetIdx].maxHand + 1);
    }
    addLog(HI, `robó el sombrero ${stolen}`, newPls);
    if (newPls[targetIdx].mainHats.length === 0 && newPls[targetIdx].perchero.length > 0) {
      if (newPls[targetIdx].isAI) {
        const nh = newPls[targetIdx].perchero.shift();
        newPls[targetIdx].mainHats.push(nh);
        endTurn(newPls, dk || deck, newDiscard || discard, HI);
      } else if (newPls[targetIdx].isRemote) {
        setModal({ type: 'pickHatReplace', newPls, newDiscard, victimIdx: targetIdx, fromIdx: HI });
        setPlayers(newPls); setDiscard(newDiscard);
      } else {
        setModal({ type: 'pickHatReplace', newPls, newDiscard, victimIdx: targetIdx });
      }
      return;
    }
    endTurn(newPls, dk || deck, newDiscard || discard, HI);
  }

  // Manual: swap main hat from perchero (costs half your hand â€” player chooses which cards)
  function resolveManualCambiar(hatLang, cardIndices) {
    if (players[HI]?.closetCovered) return;
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
    if (players[HI]?.closetCovered) return;
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
  const noticeCards = [
    roomInvite && {
      key: `room-${roomInvite.roomCode}`,
      color: '#4ecdc4',
      icon: '??',
      message: `${roomInvite.fromDisplayName} ${T('roomInvite')}`,
      sub: roomInvite.roomName || roomInvite.roomCode || '',
      actionLabel: T('joinRoom'),
      onAction: acceptRoomInvite,
      onClose: () => setRoomInvite(null),
    },
    friendReqNotif && {
      key: `req-${friendReqNotif.fromUserId || friendReqNotif.fromDisplayName}`,
      color: '#FFD700',
      icon: '??',
      message: `${friendReqNotif.fromDisplayName} ${T('friendRequestNotif')}`,
      sub: '',
      actionLabel: T('viewRequest'),
      onAction: () => { setFriendReqNotif(null); setPhase('friends'); },
      onClose: () => setFriendReqNotif(null),
    },
    friendAddedNotif && {
      key: `added-${friendAddedNotif.userId || friendAddedNotif.displayName}`,
      color: '#7ef0a2',
      icon: '??',
      message: `${friendAddedNotif.displayName || 'Jugador'} ${T('friendAccepted')}`,
      sub: '',
      actionLabel: T('friends'),
      onAction: () => { setFriendAddedNotif(null); setPhase('friends'); },
      onClose: () => setFriendAddedNotif(null),
    },
    friendRemovedNotif && {
      key: `removed-${friendRemovedNotif.userId || friendRemovedNotif.displayName}`,
      color: '#ff8a80',
      icon: '??',
      message: `${friendRemovedNotif.displayName || 'Jugador'} ${T('friendRemovedNotif')}`,
      sub: '',
      actionLabel: T('friends'),
      onAction: () => { setFriendRemovedNotif(null); setPhase('friends'); },
      onClose: () => setFriendRemovedNotif(null),
    },
  ].filter(Boolean);

  const inviteToast = null;

  const friendReqToast = null;

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
          onClick={() => { setShowQuickMenu(false); setShowNotificationsPanel(false); }}
          style={{ position: 'fixed', inset: 0, border: 'none', background: 'transparent', cursor: 'default' }}
        />
      )}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => {
            setShowQuickMenu(v => {
              const next = !v;
              if (!next) setShowNotificationsPanel(false);
              return next;
            });
          }}
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
            position: 'relative',
          }}
        >
          {'\u2630'}
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
            {user && (
              <>
                <div style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  gap: 8,
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotificationsPanel(false);
                      goToProfile();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: 14,
                      border: '1px solid rgba(255,215,0,0.22)',
                      background: 'linear-gradient(180deg, rgba(255,215,0,0.12), rgba(255,255,255,0.04))',
                      cursor: 'pointer',
                      textAlign: 'left',
                      boxShadow: '0 12px 24px rgba(0,0,0,.24), inset 0 1px 0 rgba(255,255,255,0.08)',
                    }}
                  >
                    <UserAvatar
                      name={user.displayName}
                      username={user.username}
                      avatarUrl={user.avatarUrl}
                      size={38}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: '#fff3bf', fontSize: 14, fontWeight: 900, lineHeight: 1.05 }}>{user.displayName || user.username}</div>
                      <div style={{ color: '#8a8fa8', fontSize: 11, fontWeight: 700, marginTop: 2 }}>@{user.username}</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNotificationsPanel((v) => !v)}
                    style={{
                      width: isMobile ? 54 : 58,
                      borderRadius: 14,
                      border: showNotificationsPanel ? '2px solid rgba(255,215,0,0.5)' : '1px solid rgba(255,215,0,0.22)',
                      background: showNotificationsPanel ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.05)',
                      cursor: 'pointer',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: showNotificationsPanel ? '0 10px 24px rgba(255,215,0,.12)' : 'none',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={ingredientCardIcon}
                      alt="notificaciones"
                      style={{
                        width: isMobile ? 28 : 30,
                        height: isMobile ? 28 : 30,
                        objectFit: 'contain',
                        opacity: noticeCards.length > 0 ? 1 : 0.4,
                        filter: noticeCards.length > 0 ? 'drop-shadow(0 0 8px rgba(255,215,0,.35)) saturate(1.15)' : 'grayscale(.25)',
                      }}
                    />
                    {noticeCards.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        minWidth: 18,
                        height: 18,
                        padding: '0 4px',
                        borderRadius: 999,
                        background: '#ff5f57',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid rgba(22,33,62,.98)',
                      }}>
                        {noticeCards.length}
                      </div>
                    )}
                  </button>
                </div>
                {showNotificationsPanel && (
                  <div style={{
                    borderRadius: 14,
                    border: '1px solid rgba(255,215,0,0.16)',
                    background: 'rgba(255,255,255,0.035)',
                    padding: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        position: 'relative',
                        width: 40,
                        height: 40,
                        borderRadius: 999,
                        background: noticeCards.length > 0 ? 'rgba(255,215,0,0.14)' : 'rgba(255,255,255,0.06)',
                        border: noticeCards.length > 0 ? '2px solid rgba(255,215,0,0.45)' : '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <img
                          src={ingredientCardIcon}
                          alt="hamburguesa"
                          style={{
                            width: 25,
                            height: 25,
                            objectFit: 'contain',
                            opacity: noticeCards.length > 0 ? 1 : 0.42,
                            filter: noticeCards.length > 0 ? 'drop-shadow(0 0 8px rgba(255,215,0,.35)) saturate(1.15)' : 'grayscale(.2)',
                          }}
                        />
                        {noticeCards.length > 0 && (
                          <div style={{
                            position: 'absolute',
                            top: -3,
                            right: -3,
                            minWidth: 18,
                            height: 18,
                            padding: '0 4px',
                            borderRadius: 999,
                            background: '#ff5f57',
                            color: '#fff',
                            fontSize: 11,
                            fontWeight: 900,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid rgba(22,33,62,.98)',
                          }}>
                            {noticeCards.length}
                          </div>
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: '#fff3bf', fontSize: 13, fontWeight: 900 }}>Notificaciones</div>
                        <div style={{ color: '#8a8fa8', fontSize: 11, fontWeight: 700 }}>
                          {noticeCards.length > 0 ? `${noticeCards.length} pendientes` : 'No tienes notificaciones'}
                        </div>
                      </div>
                    </div>
                    {noticeCards.length === 0 ? (
                      <div style={{
                        color: '#9ea6c7',
                        fontSize: 12,
                        fontWeight: 700,
                        padding: '4px 2px 0',
                      }}>
                        No tienes notificaciones
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {noticeCards.map((notice) => (
                          <div
                            key={notice.key}
                            style={{
                              borderRadius: 12,
                              border: `1px solid ${notice.color}`,
                              background: 'rgba(18,26,48,0.9)',
                              padding: 10,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 8,
                            }}>
                            <div style={{ color: '#f8f4cf', fontSize: 12, fontWeight: 800, lineHeight: 1.25 }}>{notice.message}</div>
                            {notice.sub ? <div style={{ color: '#8a8fa8', fontSize: 11, fontWeight: 700 }}>{notice.sub}</div> : null}
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => { setShowNotificationsPanel(false); notice.onAction(); }} style={{
                                flex: 1,
                                padding: '8px 10px',
                                borderRadius: 10,
                                border: 'none',
                                background: notice.color,
                                color: '#0f1117',
                                fontFamily: "'Fredoka',sans-serif",
                                fontWeight: 800,
                                fontSize: 12,
                                cursor: 'pointer',
                              }}>
                                {notice.actionLabel}
                              </button>
                              <button onClick={notice.onClose} style={{
                                padding: '8px 10px',
                                borderRadius: 10,
                                border: '1px solid rgba(255,255,255,0.12)',
                                background: 'transparent',
                                color: '#9ea6c7',
                                fontFamily: "'Fredoka',sans-serif",
                                fontWeight: 800,
                                fontSize: 12,
                                cursor: 'pointer',
                              }}>
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            <Btn onClick={goToHome} color="#4ecdc4" style={{ color: '#0f1117', width: '100%', justifyContent: 'center' }}>
              {T('homeMenu')}
            </Btn>
            <Btn onClick={goToFriends} color="#7ad8ff" style={{ color: '#102033', width: '100%', justifyContent: 'center' }}>
              {T('friends')}
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
            {user && (
              <Btn onClick={handleMenuLogout} color="#ff8a80" style={{ color: '#2b1111', width: '100%', justifyContent: 'center' }}>
                {T('logout')}
              </Btn>
            )}
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
          historyInitialFilter={historyInitialFilter}
          historyReturnPhase={historyReturnPhase}
          openProfile={openProfile}
          onProfileBack={handleProfileBack}
          openHistory={openHistory}
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
  const quickMenuHeaderOffset = isMobile ? 0 : 72;

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
            onRegisterRef={(playerIdx, el) => {
              if (el) playerAreaRefs.current[playerIdx] = el;
              else delete playerAreaRefs.current[playerIdx];
            }}
            onRegisterIngredientRef={(playerIdx, ingIdx, el) => {
              if (!playerIngredientRefs.current[playerIdx]) playerIngredientRefs.current[playerIdx] = {};
              if (el) playerIngredientRefs.current[playerIdx][ingIdx] = el;
              else if (playerIngredientRefs.current[playerIdx]) delete playerIngredientRefs.current[playerIdx][ingIdx];
            }}
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
        <div style={{ fontSize: 11, color: '#777', display: 'inline-flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <img src={ingredientCardIcon} alt="hamburguesa" style={{ width: 14, height: 14, objectFit: 'contain' }} />
          <span>{human.currentBurger}/{human.totalBurgers} {String(T('burgersLabel')).toLowerCase()}</span>
          {extraPlay && <span style={{ color: '#FFD700', marginLeft: 4 }}>{T('extraPlayLabel')}</span>}
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
        {human.closetCovered && (
          <div style={{
            marginTop: 6,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 999,
            background: 'rgba(255,112,67,0.12)',
            border: '1px solid rgba(255,112,67,0.35)',
            color: '#ffb199',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
          }}>
            <span>🪝</span>
            <span>{T('closetCoveredStatus') || 'Perchero cubierto'}</span>
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
    }} ref={humanBurgerAreaRef}>
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
              onRegisterSlotRef={i === human.currentBurger ? ((slotIdx, el) => {
                if (el) humanBurgerSlotRefs.current[slotIdx] = el;
                else delete humanBurgerSlotRefs.current[slotIdx];
              }) : undefined}
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
          <img src={human.closetCovered ? actionPercheroCubierto : percheroImg} alt="Perchero" style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: human.closetCovered ? 0.92 : 1 }} />
          {!human.closetCovered && human.perchero.map((h, i) => {
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

  const percheroButtons = isHumanTurn && !extraPlay && human.perchero.length > 0 && !human.closetCovered && (
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
          const playable = card.type === 'ingredient'
            ? canPlayCard(human, card)
            : (extraPlay ? false : (isClosetActionBlocked(human, card.action) ? false : null));
          const angle = handN > 1 ? -MAX_ANGLE + i * (2 * MAX_ANGLE / (handN - 1)) : 0;
          const isSelected = selectedIdx === i;
          return (
            <div
              key={card.id}
              ref={(el) => {
                if (el) handCardRefs.current[i] = el;
                else delete handCardRefs.current[i];
              }}
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
                  <Btn onClick={humanPlay} disabled={(extraPlay && card.type !== 'ingredient') || (card.type === 'action' && isClosetActionBlocked(human, card.action))} color="#4CAF50" style={{ fontSize: 11, padding: '6px 12px' }}>
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
      {/* â”€â”€ Header â”€â”€ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 12, padding: isMobile ? '6px 10px' : '8px 16px',
        background: '#16213e', borderBottom: '2px solid #2a2a4a', flexShrink: 0,
      }}>
        <img src={ingredientCardIcon} alt="hamburguesa" style={{ width: 22, height: 22, objectFit: 'contain' }} />
        {!isMobile && <span style={{ fontWeight: 900, fontSize: 16, color: '#FFD700' }}>HUNGRY POLY</span>}
        <div style={{
          marginLeft: 'auto',
          display: 'flex',
          gap: isMobile ? 6 : 12,
          alignItems: 'center',
          paddingRight: quickMenuHeaderOffset,
        }}>
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

      {negationFx && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 9500,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle, rgba(255,80,80,0.12) 0%, rgba(0,0,0,0.55) 70%)',
          animation: 'pulse 0.55s ease-in-out 2',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            transform: 'translateY(-18px)',
          }}>
            <img
              src={bloqueoImg}
              alt="Bloqueo"
              style={{
                width: isMobile ? 180 : 250,
                maxWidth: '70vw',
                objectFit: 'contain',
                filter: 'drop-shadow(0 16px 30px rgba(0,0,0,.45))',
              }}
            />
            <div style={{
              padding: '10px 18px',
              borderRadius: 16,
              background: 'rgba(15,17,23,.88)',
              border: '2px solid rgba(255,80,80,.55)',
              color: '#ffe082',
              textAlign: 'center',
              boxShadow: '0 12px 30px rgba(0,0,0,.35)',
            }}>
              <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 900, lineHeight: 1 }}>
                ¡Negada!
              </div>
              <div style={{ marginTop: 6, fontSize: isMobile ? 12 : 14, color: '#ffd5d5', fontWeight: 700 }}>
                {negationFx.negatorName} bloqueó tu {String(negationFx.actionName).toLowerCase()}
              </div>
            </div>
          </div>
        </div>
      )}

      {forkAnim && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9490,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'fixed',
            left: forkAnim.x,
            top: forkAnim.y,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            transform: `translate(-50%, -50%) ${forkAnim.moving ? 'scale(1)' : 'scale(.92)'}`,
            transition: forkAnim.moving
              ? 'left 0.62s cubic-bezier(.17,.84,.44,1), top 0.62s cubic-bezier(.17,.84,.44,1), transform 0.2s ease'
              : 'transform 0.12s ease',
          }}>
            <div style={{
              width: isMobile ? 58 : 72,
              height: isMobile ? 58 : 72,
              borderRadius: 18,
              background: 'rgba(15,17,23,.92)',
              border: '2px solid rgba(78,205,196,.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 12px 28px rgba(0,0,0,.35)',
            }}>
              {ING_IMG[forkAnim.ingredient]
                ? <img src={ING_IMG[forkAnim.ingredient]} alt={forkAnim.ingredient} style={{ width: isMobile ? 38 : 44, height: isMobile ? 38 : 44, objectFit: 'contain' }} />
                : <span style={{ fontSize: isMobile ? 28 : 34 }}>{ING_EMOJI[forkAnim.ingredient] || '🍴'}</span>}
            </div>
            <img
              src={actionTenedor}
              alt="Tenedor"
              style={{
                width: isMobile ? 72 : 94,
                height: isMobile ? 72 : 94,
                objectFit: 'contain',
                filter: 'drop-shadow(0 10px 18px rgba(0,0,0,.35))',
                transform: forkAnim.moving ? 'rotate(14deg)' : 'rotate(-8deg)',
                transition: 'transform 0.22s ease',
              }}
            />
          </div>
        </div>
      )}

      {comeComodinesAnim && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9488,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'fixed',
            left: comeComodinesAnim.x,
            top: comeComodinesAnim.y,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            transform: `translate(-50%, -50%) ${comeComodinesAnim.moving ? 'scale(1)' : 'scale(.96)'}`,
            transition: comeComodinesAnim.moving
              ? 'left 0.62s cubic-bezier(.17,.84,.44,1), top 0.62s cubic-bezier(.17,.84,.44,1), transform 0.18s ease'
              : 'transform 0.16s ease',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              borderRadius: 999,
              background: 'rgba(15,17,23,.88)',
              border: '2px solid rgba(255,215,0,.35)',
              boxShadow: '0 10px 22px rgba(0,0,0,.32)',
              opacity: comeComodinesAnim.pickedCount > 0 || comeComodinesAnim.stoppingAt ? 1 : 0,
              transform: comeComodinesAnim.stoppingAt ? 'scale(1.08) translateY(-2px)' : 'scale(1)',
              transition: 'all 0.16s ease',
            }}>
              {Array.from({ length: Math.max(1, Math.min(3, comeComodinesAnim.stoppingAt?.count || comeComodinesAnim.pickedCount || 0)) }).map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    width: isMobile ? 22 : 26,
                    height: isMobile ? 22 : 26,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,.08)',
                  }}
                >
                  <img
                    src={ING_IMG.perrito}
                    alt="Comodín"
                    style={{ width: isMobile ? 16 : 20, height: isMobile ? 16 : 20, objectFit: 'contain' }}
                  />
                </div>
              ))}
              {comeComodinesAnim.pickedCount > 1 && (
                <span style={{ color: '#FFD700', fontWeight: 900, fontSize: isMobile ? 12 : 14 }}>
                  x{comeComodinesAnim.pickedCount}
                </span>
              )}
            </div>
            <img
              src={actionComeComodines}
              alt="Come Comodines"
              style={{
                width: isMobile ? 92 : 118,
                height: isMobile ? 92 : 118,
                objectFit: 'contain',
                filter: 'drop-shadow(0 12px 22px rgba(0,0,0,.36))',
                transform: comeComodinesAnim.moving
                  ? 'rotate(-4deg)'
                  : (comeComodinesAnim.stoppingAt ? 'rotate(0deg) scale(1.12) translateY(-4px)' : 'rotate(0deg) scale(1.02)'),
                transition: 'transform 0.18s ease',
              }}
            />
          </div>
        </div>
      )}

      {glotonAnim && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9489,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'fixed',
            left: glotonAnim.x,
            top: glotonAnim.y,
            width: isMobile ? 90 : 118,
            height: isMobile ? 90 : 118,
            transform: `translate(-50%, -50%) ${glotonAnim.showChampion ? 'scale(0.72)' : (glotonAnim.moving ? 'scale(1)' : `scale(${glotonAnim.biteTick % 2 === 0 ? 1.02 : 1.1})`)}`,
            transition: glotonAnim.moving
              ? 'left 0.62s cubic-bezier(.17,.84,.44,1), top 0.62s cubic-bezier(.17,.84,.44,1), transform 0.18s ease'
              : 'transform 0.18s ease',
            filter: 'drop-shadow(0 14px 26px rgba(0,0,0,.36))',
            opacity: glotonAnim.showChampion ? 0 : 1,
          }}>
            <img
              src={actionGloton}
              alt="Glotón"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transform: glotonAnim.moving ? 'rotate(-8deg)' : `rotate(${glotonAnim.biteTick % 2 === 0 ? '-2deg' : '5deg'})`,
                transition: 'transform 0.18s ease',
              }}
            />
            {glotonAnim.biteFlash && (
              <div style={{
                position: 'absolute',
                left: '52%',
                top: '54%',
                width: isMobile ? 34 : 44,
                height: isMobile ? 34 : 44,
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,215,0,.9) 0%, rgba(255,140,0,.58) 45%, rgba(255,90,0,0) 72%)',
                boxShadow: '0 0 18px rgba(255,215,0,.45)',
                animation: 'gloton-bite-flash .13s ease-out',
              }} />
            )}
          </div>

          {!glotonAnim.showChampion && (
            <div style={{
              position: 'fixed',
              left: glotonAnim.stackX,
              top: glotonAnim.stackY,
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0,
            }}>
              <img
                src={burgerPanArriba}
                alt="Pan arriba"
                style={{
                  width: isMobile ? 70 : 70,
                  height: 'auto',
                  objectFit: 'contain',
                  marginBottom: -4,
                  filter: 'drop-shadow(0 10px 18px rgba(0,0,0,.28))',
                }}
              />
              {glotonAnim.ingredients.slice().reverse().map((ing, idx) => (
                <div
                  key={`${ing}-${idx}-${glotonAnim.biteTick}`}
                  style={{
                    width: isMobile ? 64 : 64,
                    height: 'auto',
                    marginTop: -4,
                    marginBottom: -4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: idx === 0 && !glotonAnim.moving
                      ? `scale(${glotonAnim.biteFlash ? 0.72 : (glotonAnim.biteTick % 2 === 0 ? 1 : 0.92)})`
                      : 'scale(1)',
                    opacity: idx === 0 && glotonAnim.biteFlash ? 0.22 : 1,
                    transition: 'transform 0.16s ease, opacity 0.16s ease',
                    filter: idx === 0 && glotonAnim.biteFlash
                      ? 'drop-shadow(0 0 16px rgba(255,215,0,.34))'
                      : 'drop-shadow(0 8px 14px rgba(0,0,0,.24))',
                  }}
                >
                  {BURGER_STACK_IMG[ing]
                    ? <img src={BURGER_STACK_IMG[ing]} alt={ing} style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
                    : ING_IMG[ing]
                    ? <img src={ING_IMG[ing]} alt={ing} style={{ width: isMobile ? 40 : 48, height: isMobile ? 40 : 48, objectFit: 'contain' }} />
                    : <span style={{ fontSize: isMobile ? 24 : 30 }}>{ING_EMOJI[ing] || '🍔'}</span>}
                </div>
              ))}
              <img
                src={burgerPanAbajo}
                alt="Pan abajo"
                style={{
                  width: isMobile ? 70 : 70,
                  height: 'auto',
                  objectFit: 'contain',
                  marginTop: -4,
                  filter: 'drop-shadow(0 10px 18px rgba(0,0,0,.28))',
                }}
              />
            </div>
          )}

          {glotonAnim.showChampion && (
            <div style={{
              position: 'fixed',
              left: glotonAnim.stackX,
              top: glotonAnim.stackY,
              transform: 'translate(-50%, -50%) scale(1)',
              width: isMobile ? 112 : 150,
              height: isMobile ? 112 : 150,
              borderRadius: 24,
              background: 'rgba(15,17,23,.66)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 14px 28px rgba(0,0,0,.34)',
            }}>
              <img
                src={campeonImg}
                alt="Campeón"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 10px 16px rgba(255,215,0,.22))',
                }}
              />
            </div>
          )}
        </div>
      )}

      {milanesaAnim && milanesaAnim.visible && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9487,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'fixed',
            left: milanesaAnim.x,
            top: milanesaAnim.y,
            transform: `translate(-50%, -50%) scale(${milanesaAnim.pop ? 1.18 : (milanesaAnim.cooked ? 1.06 : 0.96)})`,
            transition: milanesaAnim.pop
              ? 'transform 0.12s cubic-bezier(.2,1.35,.45,1), opacity 0.2s ease'
              : 'transform 0.2s ease, opacity 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            filter: 'drop-shadow(0 14px 26px rgba(0,0,0,.36))',
          }}>
            <img
              src={milanesaAnim.cooked ? actionMilanesa : actionMilanesaSinHuevo}
              alt="Milanesa"
              style={{
                width: isMobile ? 88 : 118,
                height: isMobile ? 88 : 118,
                objectFit: 'contain',
                filter: milanesaAnim.pop
                  ? 'drop-shadow(0 0 16px rgba(255,215,0,.38))'
                  : 'none',
              }}
            />
            <div style={{
              padding: '5px 10px',
              borderRadius: 999,
              background: 'rgba(15,17,23,.86)',
              border: '2px solid rgba(255,215,0,.28)',
              color: '#FFD700',
              fontWeight: 900,
              fontSize: isMobile ? 12 : 14,
            }}>
              + huevo x{milanesaAnim.targetCount}
            </div>
          </div>
        </div>
      )}

      {pizzaAnim && pizzaAnim.visible && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9487,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'fixed',
            left: pizzaAnim.x,
            top: pizzaAnim.y,
            transform: `translate(-50%, -50%) scale(${pizzaAnim.pop ? 1.18 : (pizzaAnim.cheesy ? 1.06 : 0.96)})`,
            transition: pizzaAnim.pop
              ? 'transform 0.12s cubic-bezier(.2,1.35,.45,1), opacity 0.2s ease'
              : 'transform 0.2s ease, opacity 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            filter: 'drop-shadow(0 14px 26px rgba(0,0,0,.36))',
          }}>
            <img
              src={pizzaAnim.cheesy ? actionPizzaConQueso : actionPizza}
              alt="Pizza"
              style={{
                width: isMobile ? 88 : 118,
                height: isMobile ? 88 : 118,
                objectFit: 'contain',
                filter: pizzaAnim.pop
                  ? 'drop-shadow(0 0 16px rgba(255,215,0,.38))'
                  : 'none',
              }}
            />
            <div style={{
              padding: '5px 10px',
              borderRadius: 999,
              background: 'rgba(15,17,23,.86)',
              border: '2px solid rgba(255,215,0,.28)',
              color: '#FFD700',
              fontWeight: 900,
              fontSize: isMobile ? 12 : 14,
            }}>
              + queso x{pizzaAnim.targetCount}
            </div>
          </div>
        </div>
      )}

      {parrillaAnim && parrillaAnim.visible && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9487,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}>
          {(() => {
            const grillEffectOffsetX = isMobile ? -12 : -18;
            return (
              <>
          <div style={{
            position: 'fixed',
            left: parrillaAnim.x,
            top: parrillaAnim.y,
            transform: 'translate(-50%, -50%)',
            width: isMobile ? 170 : 220,
            height: isMobile ? 170 : 220,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: 'drop-shadow(0 16px 26px rgba(0,0,0,.34))',
            overflow: 'visible',
          }}>
            <img
              src={parrillaAnim.frameImages?.[parrillaAnim.frameIdx] || actionParrilla1}
              alt="Parrilla"
              style={{
                width: '100%',
                height: '100%',
              objectFit: 'contain',
            }}
          />
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={`smoke-${idx}`}
                style={{
                  position: 'absolute',
                  left: `calc(50% + ${grillEffectOffsetX + (idx - 1) * (isMobile ? 12 : 18)}px)`,
                  top: isMobile ? 48 : 58,
                  width: isMobile ? 24 : 32,
                  height: isMobile ? 24 : 32,
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(245,245,245,.28) 0%, rgba(210,210,210,.18) 44%, rgba(180,180,180,0) 76%)',
                  filter: 'blur(1px)',
                  animation: `parrilla-smoke ${1.95 + idx * 0.22}s ease-in-out infinite`,
                  animationDelay: `${idx * 0.22}s`,
                }}
              />
            ))}
            {parrillaAnim.sizzle && (
              <>
                <div style={{
                  position: 'absolute',
                  left: `calc(50% + ${grillEffectOffsetX}px)`,
                  top: isMobile ? 78 : 98,
                  width: isMobile ? 84 : 108,
                  height: isMobile ? 84 : 108,
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255,196,64,.55) 0%, rgba(255,120,32,.35) 36%, rgba(255,80,0,0) 72%)',
                  animation: 'parrilla-sizzle 0.44s ease-out forwards',
                }} />
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'absolute',
                      left: `calc(50% + ${grillEffectOffsetX + Math.cos((Math.PI * 2 * idx) / 6) * (isMobile ? 16 : 20)}px)`,
                      top: (isMobile ? 80 : 100) + Math.sin((Math.PI * 2 * idx) / 6) * (isMobile ? 8 : 10),
                      width: isMobile ? 8 : 10,
                      height: isMobile ? 8 : 10,
                      transform: 'translate(-50%, -50%)',
                      borderRadius: '50%',
                      background: idx % 2 === 0 ? '#FFD700' : '#FF8C42',
                      boxShadow: '0 0 10px rgba(255,180,50,.7)',
                      animation: `parrilla-spark 0.34s ease-out forwards`,
                      animationDelay: `${idx * 0.018}s`,
                    }}
                  />
                ))}
              </>
            )}
          </div>

          {parrillaAnim.showMeat && (
            <>
              <img
                src={actionTridente}
                alt="Tridente"
                style={{
                  position: 'fixed',
                  left: parrillaAnim.tridentX,
                  top: parrillaAnim.tridentY,
                  transform: 'translate(-50%, -50%)',
                  width: isMobile ? 66 : 88,
                  height: 'auto',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 10px 20px rgba(0,0,0,.32))',
                  transition: 'left 0.42s ease-in-out, top 0.42s ease-in-out',
                }}
              />
              <img
                src={parrillaAnim.meatImg}
                alt="Carne a la parrilla"
                style={{
                  position: 'fixed',
                  left: parrillaAnim.meatX,
                  top: parrillaAnim.meatY,
                  transform: 'translate(-50%, -50%)',
                  width: isMobile ? 34 : 42,
                  height: 'auto',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 8px 14px rgba(0,0,0,.26))',
                  transition: 'left 0.42s ease-in-out, top 0.42s ease-in-out, opacity 0.18s ease',
                }}
              />
            </>
          )}
              </>
            );
          })()}
        </div>
      )}

      {ensaladaAnim && ensaladaAnim.visible && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9486,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'fixed',
            left: ensaladaAnim.x,
            top: ensaladaAnim.y,
            transform: 'translate(-50%, -50%)',
            width: isMobile ? 126 : 162,
            height: isMobile ? 126 : 162,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: 'drop-shadow(0 16px 24px rgba(0,0,0,.26))',
          }}>
            <img
              src={ensaladaAnim.frameIdx % 2 === 0 ? actionEnsalada1 : actionEnsalada2}
              alt="Ensalada"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
            <div style={{
              position: 'absolute',
              inset: '20% 18%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(170,255,130,.16) 0%, rgba(170,255,130,0) 72%)',
              animation: 'ensalada-glow 0.55s ease-out',
            }} />
            {(ensaladaAnim.ingredients || []).slice(0, 6).map((ing, idx) => {
              const angle = ((Math.PI * 2) / Math.max(1, (ensaladaAnim.ingredients || []).length)) * idx;
              const radius = isMobile ? 34 : 44;
              return (
                <div
                  key={`${ing}-${idx}-${ensaladaAnim.tossTick}`}
                  style={{
                    position: 'absolute',
                    left: `calc(50% + ${Math.cos(angle) * radius}px)`,
                    top: `calc(50% + ${Math.sin(angle) * radius}px)`,
                    transform: 'translate(-50%, -50%)',
                    width: isMobile ? 24 : 30,
                    height: isMobile ? 24 : 30,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: `ensalada-toss 0.5s ease-out forwards`,
                    animationDelay: `${idx * 0.03}s`,
                  }}
                >
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'rgba(15,17,23,.74)',
                    border: '1px solid rgba(255,255,255,.14)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <img src={ING_IMG[ing]} alt={ing} style={{ width: isMobile ? 16 : 20, height: isMobile ? 16 : 20, objectFit: 'contain' }} />
                  </div>
                </div>
              );
            })}
            <div style={{
              position: 'absolute',
              right: isMobile ? 10 : 12,
              bottom: isMobile ? 12 : 14,
              padding: '4px 8px',
              borderRadius: 999,
              background: 'rgba(15,17,23,.84)',
              border: '2px solid rgba(170,255,130,.28)',
              color: '#d9ffb4',
              fontWeight: 900,
              fontSize: isMobile ? 11 : 13,
            }}>
              - verduras x{ensaladaAnim.targetCount}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes gloton-bite-flash {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          40% { transform: translate(-50%, -50%) scale(1.08); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.35); opacity: 0; }
        }
        @keyframes parrilla-sizzle {
          0% { transform: translate(-50%, -50%) scale(.65); opacity: 0; }
          40% { opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.25); opacity: 0; }
        }
        @keyframes parrilla-spark {
          0% { transform: translate(-50%, -50%) scale(.3); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translate(-50%, -70%) scale(1.25); opacity: 0; }
        }
        @keyframes parrilla-smoke {
          0% { transform: translate(-50%, -50%) scale(.68); opacity: 0; }
          25% { opacity: .42; }
          100% { transform: translate(-50%, -120%) scale(1.45); opacity: 0; }
        }
        @keyframes ensalada-toss {
          0% { transform: translate(-50%, -30%) scale(.5) rotate(-14deg); opacity: 0; }
          25% { opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes ensalada-glow {
          0% { transform: scale(.65); opacity: 0; }
          45% { opacity: 1; }
          100% { transform: scale(1.2); opacity: 0; }
        }
      `}</style>

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

      {modal?.type === 'closetCoverResponse' && modal.targetIdx === HI && (() => {
        const selected = modal.selected || [];
        const canAvoid = human.hand.length >= 2;
        return (
          <Modal title={`${getActionText('perchero_cubierto')?.emoji || '🪝'} ${getActionText('perchero_cubierto')?.name || 'Perchero Cubierto'}`}>
            <p style={{ color: '#ddd', fontSize: 13, marginBottom: 10 }}>
              {typeof T('closetCoverPrompt') === 'function'
                ? T('closetCoverPrompt')(players[modal.actingIdx]?.name || 'Oponente')
                : T('closetCoverPrompt')}
            </p>
            {canAvoid ? (
              <>
                <p style={{ color: '#8a8fa8', fontSize: 12, marginBottom: 12 }}>
                  {T('closetCoverChooseTwo')}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14, justifyContent: 'center' }}>
                  {human.hand.map((card) => {
                    const isSel = selected.includes(card.id);
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => setModal((prev) => {
                          if (!prev || prev.type !== 'closetCoverResponse') return prev;
                          const prevSelected = prev.selected || [];
                          return {
                            ...prev,
                            selected: isSel
                              ? prevSelected.filter((id) => id !== card.id)
                              : [...prevSelected, card.id].slice(0, 2),
                          };
                        })}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          padding: 0,
                          cursor: 'pointer',
                          outline: isSel ? '3px solid #FFD700' : '3px solid transparent',
                          borderRadius: 8,
                        }}
                      >
                        <GameCard card={card} selected={isSel} playable={false} large={false} small={true} />
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn
                    onClick={() => {
                      if (isOnline && !isHost) {
                        socket.emit('playerAction', { code: roomCode, action: { type: 'closetCoverResponse', avoid: false } });
                        setModal(null);
                        return;
                      }
                      setModal(null);
                      resolveClosetCoverResponse(false);
                    }}
                    color="#333"
                    style={{ color: '#aaa' }}
                  >
                    {T('closetCoverAccept') || 'Aceptar efecto'}
                  </Btn>
                  <Btn
                    onClick={() => {
                      if (isOnline && !isHost) {
                        socket.emit('playerAction', { code: roomCode, action: { type: 'closetCoverResponse', avoid: true, discardIds: selected } });
                        setModal(null);
                        return;
                      }
                      resolveClosetCoverResponse(true, selected);
                    }}
                    disabled={selected.length !== 2}
                    color="#FFD700"
                    style={{ flex: 1, color: '#111' }}
                  >
                    {T('closetCoverDiscardTwo') || 'Descartar 2 y evitar'}
                  </Btn>
                </div>
              </>
            ) : (
              <Btn onClick={() => {
                if (isOnline && !isHost) {
                  socket.emit('playerAction', { code: roomCode, action: { type: 'closetCoverResponse', avoid: false } });
                  setModal(null);
                  return;
                }
                resolveClosetCoverResponse(false);
              }} color="#FF7043" style={{ width: '100%' }}>
                {T('close') || 'Cerrar'}
              </Btn>
            )}
          </Modal>
        );
      })()}

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

      {modal?.type === 'pickHatSteal' && (() => {
        const theirHats = modal.isRemote ? players[modal.targetIdx].mainHats : modal.newPls[modal.targetIdx].mainHats;
        const targetName = players[modal.targetIdx]?.name || 'Oponente';
        return (
          <Modal title="🥷 Robar sombrero">
            <p style={{ color: '#888', fontSize: 12, marginBottom: 12 }}>
              Elige cuál sombrero principal quieres robarle a {targetName}.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {theirHats.map(h => (
                <div
                  key={h}
                  onClick={() => setModal(prev => ({ ...prev, selectedStealHat: h }))}
                  style={{
                    padding: 10, borderRadius: 10, cursor: 'pointer',
                    border: modal.selectedStealHat === h ? `3px solid #FFD700` : `2px solid ${LANG_BORDER[h]}88`,
                    background: modal.selectedStealHat === h ? 'rgba(255,215,0,.12)' : 'rgba(255,255,255,.04)',
                    transition: 'all .15s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  }}
                >
                  <HatSVG lang={h} size={36} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: modal.selectedStealHat === h ? '#FFD700' : LANG_TEXT[h] }}>
                    {T(h)}
                  </span>
                </div>
              ))}
            </div>
            <button
              disabled={!modal.selectedStealHat}
              onClick={() => resolveHatSteal(modal.selectedStealHat)}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 10,
                border: 'none', fontFamily: 'inherit', fontWeight: 800, fontSize: 14,
                cursor: modal.selectedStealHat ? 'pointer' : 'not-allowed',
                background: modal.selectedStealHat ? 'linear-gradient(135deg, #ff8a65, #ff7043)' : 'rgba(255,255,255,.08)',
                color: modal.selectedStealHat ? '#fff' : '#555',
                transition: 'all .2s',
              }}
            >
              Robar
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
        const playable = card.type === 'ingredient'
          ? canPlayCard(human, card)
          : (extraPlay ? false : (isClosetActionBlocked(human, card.action) ? false : null));
        const cleanTitle = (txt) => String(txt).replace('?? ', '').replace('??', '').replace('? ', '').replace('?', '');
        const actionTypeIcon = (() => {
          if (card.type !== 'action') return null;
          if (['tenedor', 'ladron', 'intercambio_sombreros', 'intercambio_hamburguesa', 'gloton', 'perchero_cubierto'].includes(card.action)) return eqRightSingle;
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
                <Btn onClick={() => { humanPlay(); }} disabled={(extraPlay && card.type !== 'ingredient') || (card.type === 'action' && isClosetActionBlocked(human, card.action))} color="#4CAF50" style={{ flex: 1, fontSize: 14, padding: '10px 16px' }}>
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
              <button
                key={h}
                type="button"
                onClick={() => setModal({ type: 'manual_cambiar_discard', hatLang: h, selected: [] })}
                style={{
                  padding: 10, borderRadius: 10, cursor: 'pointer',
                  border: `2px solid ${LANG_BORDER[h]}88`,
                  background: 'rgba(255,255,255,.04)', transition: 'all .15s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,.04)'}
              >
                <HatSVG lang={h} size={36} />
                <span style={{ fontSize: 11, fontWeight: 700, color: LANG_TEXT[h] }}>
                  {T(h)}
                </span>
              </button>
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
                  <button
                    key={card.id}
                    type="button"
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
                      WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
                    }}
                  >
                    <GameCard card={card} selected={false} playable={false} large={false} small={true} />
                  </button>
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
              <button
                key={h}
                type="button"
                onClick={() => resolveManualAgregar(h)}
                style={{
                  padding: 10, borderRadius: 10, cursor: 'pointer',
                  border: `2px solid ${LANG_BORDER[h]}88`,
                  background: 'rgba(255,255,255,.04)', transition: 'all .15s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,.04)'}
              >
                <HatSVG lang={h} size={36} />
                <span style={{ fontSize: 11, fontWeight: 700, color: LANG_TEXT[h] }}>
                  {T(h)}
                </span>
              </button>
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
          perchero_cubierto: eqPercheroCubierto,
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
          perchero_cubierto: eqPercheroCubierto,
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
            actions: ['tenedor', 'ladron', 'intercambio_sombreros', 'intercambio_hamburguesa', 'gloton', 'perchero_cubierto'],
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
          perchero_cubierto: (() => {
            const txt = T('howToPlayEffectPercheroCubierto');
            return txt === 'howToPlayEffectPercheroCubierto'
              ? 'Bloquea el perchero de otro jugador durante su siguiente turno, salvo que descarte 2 cartas al recibirlo.'
              : txt;
          })(),
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












