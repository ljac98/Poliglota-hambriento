import React, { useState, useEffect, useRef, useCallback } from 'react';
import socket from './src/socket.js';
import { clearAuth, getProfile, getSavedUser, saveUserLocally } from './src/api.js';
import {
  LANGUAGES, LANG_BORDER, LANG_BG, LANG_TEXT,
  ING_EMOJI, ING_BG, AI_NAMES, getIngName, getActionInfo,
  ING_NAMES, ACTION_CARDS, languageMatches, normalizeGameLanguage, getRandomGameLanguage,
} from './constants';
import { generateDeck, initPlayer, canPlayCard } from './game';
import { shuffle, randInt, uid } from './game/utils';
import { t, getUILang, setUILang, KEY_TO_LANG, getLocalizedLangName, getLocalizedLangShort } from './src/translations.js';
import { GameCard } from './components/Cards';
import { BurgerTarget, LogEntry } from './components/GameUI';
import { HatBadge } from './components/HatComponents.jsx';
import HatSVG from './components/HatSVG.jsx';
import percheroImg from './imagenes/sombreros/perchero/percherofinal.png';
import ingredientCardIcon from './imagenes/hamburguesas/ham.png';
import bloqueoImg from './imagenes/bloqueo.png';
import eqMilanesa from './imagenes/acciones/esquina/milanga.png';
import eqEnsalada from './imagenes/acciones/esquina/ensalada2.png';
import eqPizza from './imagenes/acciones/esquina/pizza2.png';
import eqParrilla from './imagenes/acciones/esquina/parrilla.png';
import eqTenedor from './imagenes/acciones/esquina/tenedor2.png';
import actionPercheroCubierto from './imagenes/acciones/perchero cubierto.png';
import vsiaImg from './imagenes/vsia.png';
import burgerCarne from './imagenes/hamburguesas/ingredientes/carne.png';
import burgerCebolla from './imagenes/hamburguesas/ingredientes/cebolla.png';
import burgerHuevo from './imagenes/hamburguesas/ingredientes/huevo.png';
import burgerLechuga from './imagenes/hamburguesas/ingredientes/lechuga.png';
import burgerPalta from './imagenes/hamburguesas/ingredientes/palta.png';
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
  hasActionObjectives,
} from './app/utils/gameHelpers.js';
import { GameAnimations } from './app/components/GameAnimations.jsx';

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
const ACTION_STACK_IMG = {
  ...BURGER_STACK_IMG,
  pan: burgerPanAbajo,
};
import { clearRoomSession, getRoomSession, saveRoomSession } from './app/utils/roomSession.js';
import { buildTutorialScenario, getTutorialContent } from './app/utils/tutorialGame.js';
import { getTutorialPermissions, shouldAdvanceTutorialStep } from './app/services/tutorialRules.js';
import { actionCanBeNegated, isClosetActionBlocked } from './app/services/negationRules.js';
import { normalizeGameConfig } from './app/services/gameConfigService.js';
import { createGameServices } from './app/services/gameServiceFactory.js';
import { createRemoteActionDispatcher } from './app/services/remoteActionDispatcher.js';
import { createPlayerActionCommands } from './app/services/playerActionCommands.js';
import { createActionEffectObserver } from './app/services/actionEffectObserver.js';
import { advanceTutorialState, createTutorialState, rewindTutorialState } from './app/services/tutorialStateService.js';

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

const MAX_MAIN_HATS = 6;

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
  const [pendingHatLimitSelection, setPendingHatLimitSelection] = useState(null);
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
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [profileUserId, setProfileUserId] = useState(Number.isFinite(initialProfileId) ? initialProfileId : (savedUserOnLoad?.id || null));
  const [profilePreview, setProfilePreview] = useState(savedUserOnLoad ? {
    id: savedUserOnLoad.id,
    username: savedUserOnLoad.username || null,
    displayName: savedUserOnLoad.displayName || savedUserOnLoad.username || '',
    avatarUrl: savedUserOnLoad.avatarUrl || null,
  } : null);
  const [profileReturnPhase, setProfileReturnPhase] = useState('setup');
  const [profileBackStack, setProfileBackStack] = useState([]);
  const [historyInitialFilter, setHistoryInitialFilter] = useState('all');
  const [historyReturnPhase, setHistoryReturnPhase] = useState('setup');
  const aiRunning = useRef(false);
  const aiRunningMeta = useRef({ idx: null, startedAt: 0 });
  const languageMenuButtonRef = useRef(null);
  const languageMenuTrayRef = useRef(null);
  const [turnTime, setTurnTime] = useState(60);
  const [currentGameConfig, setCurrentGameConfig] = useState(null);
  const turnTimerRef = useRef(null);

  // â”€â”€ Online multiplayer state â”€â”€
  const [isOnline, setIsOnline] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [myPlayerIdx, setMyPlayerIdx] = useState(0);
  const [myRoomPlayerName, setMyRoomPlayerName] = useState(() => getRoomSession()?.playerName || '');
  const [roomCode, setRoomCode] = useState('');
  const [roomIsPublic, setRoomIsPublic] = useState(false);
  const [roomDisplayName, setRoomDisplayName] = useState('');
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [unreadChat, setUnreadChat] = useState(0);
  const [leaveNotice, setLeaveNotice] = useState(null);
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
  const [tutorialPrompt, setTutorialPrompt] = useState(null);
  const [tutorialState, setTutorialState] = useState(null);
  const [tutorialCarryOver, setTutorialCarryOver] = useState(null);
  const [postTutorialGame, setPostTutorialGame] = useState(false);
  const T = useCallback((key) => t(key, uiLang), [uiLang]);
  const uiGameLang = KEY_TO_LANG[uiLang] || LANGUAGES[0];
  const tutorialCopy = getTutorialContent(uiLang);
  const tutorialActive = !!tutorialState?.active;
  const tutorialStep = tutorialState?.step ?? -1;
  const tutorialSteps = tutorialCopy.steps.filter((_, idx) => idx !== 2);
  const tutorialStepData = tutorialActive ? tutorialSteps[tutorialState.step] : null;
  const tutorialFocus = tutorialStepData?.focus || {};
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;
  const tutorialPractice = !!tutorialState?.practiceMode;
  const tutorialPermissions = tutorialPractice
    ? getTutorialPermissions(false, tutorialStep)
    : getTutorialPermissions(tutorialActive, tutorialStep);
  const tutorialAllowsCardSelection = tutorialPermissions.canSelectCards;
  const tutorialAllowsPlayButton = tutorialPermissions.canUsePlayButton;
  const tutorialAllowsDiscard = !tutorialActive || tutorialPractice || tutorialStep === 6;
  const tutorialAllowsChangeHat = tutorialPermissions.canChangeHat;
  const tutorialAllowsAddHat = tutorialPermissions.canAddHat;
  const tutorialAllowsNegation = tutorialPermissions.canNegate;
  const refreshCurrentUserProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      const freshProfile = await getProfile(user.id);
      if (!freshProfile) return;
      setUser((prevUser) => {
        if (!prevUser) return prevUser;
        const nextUser = {
          ...prevUser,
          displayName: freshProfile.displayName || prevUser.displayName,
          username: freshProfile.username || prevUser.username,
          avatarUrl: freshProfile.avatarUrl ?? null,
        };
        const changed =
          nextUser.displayName !== prevUser.displayName ||
          nextUser.username !== prevUser.username ||
          nextUser.avatarUrl !== prevUser.avatarUrl;
        if (!changed) return prevUser;
        saveUserLocally(nextUser);
        return nextUser;
      });
    } catch {
      // Keep local session usable even if the profile refresh fails.
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    refreshCurrentUserProfile();
  }, [user?.id, refreshCurrentUserProfile]);
  const tutorialRecommendedHatLang = (() => {
    if (!tutorialActive || ![3, 4].includes(tutorialStep)) return null;
    const focusedIdx = tutorialFocus.selectedCard;
    if (!Number.isInteger(focusedIdx)) return null;
    const focusedCard = players?.[HI]?.hand?.[focusedIdx];
    return focusedCard?.type === 'ingredient' ? focusedCard.language : null;
  })();
  const tutorialHatHintText = (() => {
    if (!tutorialRecommendedHatLang) return null;
    const langLabel = T(tutorialRecommendedHatLang);
    const copyByUi = {
      es: tutorialStep === 3
        ? `Tutorial: cambia a ${langLabel} para poder jugar la carta seleccionada.`
        : `Tutorial: agrega ${langLabel} para conservar tu sombrero actual y abrir también la carta seleccionada.`,
      en: tutorialStep === 3
        ? `Tutorial: switch to ${langLabel} so you can play the selected card.`
        : `Tutorial: add ${langLabel} so you keep your current hat and also unlock the selected card.`,
      fr: tutorialStep === 3
        ? `Tutoriel : passe a ${langLabel} pour pouvoir jouer la carte selectionnee.`
        : `Tutoriel : ajoute ${langLabel} pour garder ton chapeau actuel et debloquer aussi la carte selectionnee.`,
      it: tutorialStep === 3
        ? `Tutorial: passa a ${langLabel} per poter giocare la carta selezionata.`
        : `Tutorial: aggiungi ${langLabel} per mantenere il cappello attuale e sbloccare anche la carta selezionata.`,
      de: tutorialStep === 3
        ? `Tutorial: wechsle zu ${langLabel}, damit du die ausgewahlte Karte spielen kannst.`
        : `Tutorial: fage ${langLabel} hinzu, damit dein aktueller Hut bleibt und die ausgewahlte Karte auch spielbar wird.`,
      pt: tutorialStep === 3
        ? `Tutorial: troca para ${langLabel} para poderes jogar a carta selecionada.`
        : `Tutorial: adiciona ${langLabel} para manter o teu chapeu atual e desbloquear tambem a carta selecionada.`,
    };
    return copyByUi[uiLang] || copyByUi.en;
  })();
  const getIngredientCantPlayReason = useCallback((playerLike, card) => {
    const asResult = (text, hatLang = null) => ({ text, hatLang });
    if (!playerLike || !card || card.type !== 'ingredient') return asResult(T('cantPlayNow'));
    const cardLanguage = normalizeGameLanguage(card.language) || 'espanol';

    const hasCorrectHat = (playerLike.mainHats || []).some((hatLang) => languageMatches(hatLang, cardLanguage));
    if (card.ingredient === 'perrito') {
      if (!hasCorrectHat) {
        const copyByUi = {
          es: 'Necesitas este sombrero para poder jugarlo',
          en: 'You need this hat to play it',
          fr: 'Tu as besoin de ce chapeau pour la jouer',
          it: 'Ti serve questo cappello per giocarla',
          de: 'Du brauchst diesen Hut, um sie zu spielen',
          pt: 'Precisas deste chapéu para a jogar',
        };
        return asResult(copyByUi[uiLang] || copyByUi.en, cardLanguage);
      }
      return asResult(T('cantPlayNow'));
    }

    if (playerLike.currentBurger >= playerLike.totalBurgers) {
      const copyByUi = {
        es: 'Tu hamburguesa actual ya está completa',
        en: 'Your current burger is already complete',
        fr: 'Ton burger actuel est déjà complet',
        it: 'Il tuo hamburger attuale è già completo',
        de: 'Dein aktueller Burger ist bereits fertig',
        pt: 'O teu hambúrguer atual já está completo',
      };
      return asResult(copyByUi[uiLang] || copyByUi.en);
    }

    const target = playerLike.burgers?.[playerLike.currentBurger] || [];
    const needed = [...target];
    const tableCopy = (playerLike.table || []).map((t) => (t.startsWith('perrito|') ? t.split('|')[1] : t));
    for (let i = needed.length - 1; i >= 0; i -= 1) {
      const idx = tableCopy.indexOf(needed[i]);
      if (idx !== -1) {
        needed.splice(i, 1);
        tableCopy.splice(idx, 1);
      }
    }

    if (!needed.includes(card.ingredient)) {
      const copyByUi = {
        es: 'No es parte del objetivo actual',
        en: 'It is not part of the current objective',
        fr: 'Elle ne fait pas partie de l’objectif actuel',
        it: 'Non fa parte dell’obiettivo attuale',
        de: 'Sie ist kein Teil des aktuellen Ziels',
        pt: 'Não faz parte do objetivo atual',
      };
      return asResult(copyByUi[uiLang] || copyByUi.en);
    }

    if (!hasCorrectHat) {
      const copyByUi = {
        es: 'Necesitas este sombrero para poder jugarlo',
        en: 'You need this hat to play it',
        fr: 'Tu as besoin de ce chapeau pour la jouer',
        it: 'Ti serve questo cappello per giocarla',
        de: 'Du brauchst diesen Hut, um sie zu spielen',
        pt: 'Precisas deste chapéu para a jogar',
      };
      return asResult(copyByUi[uiLang] || copyByUi.en, cardLanguage);
    }

    return asResult(T('cantPlayNow'));
  }, [T, uiLang]);
  const doesHatOpenUsefulIngredient = useCallback((playerLike, hatLang) => {
    if (!playerLike || !hatLang) return false;
    const simulatedPlayer = {
      ...playerLike,
      mainHats: Array.from(new Set([...(playerLike.mainHats || []), hatLang])),
    };
    return (playerLike.hand || []).some((card) => (
      card?.type === 'ingredient'
      && languageMatches(card.language, hatLang)
      && canPlayCard(simulatedPlayer, card)
    ));
  }, []);
  const mapVisibleTutorialStepToScenarioStep = useCallback((step) => {
    if (step <= 0) return 0;
    if (step === 1) return 2;
    return step + 1;
  }, []);
  const tutorialPopupStyle = (() => {
    const base = {
      position: 'fixed',
      zIndex: 9700,
    };
    const focusCloset = !!(tutorialFocus.closet || tutorialFocus.changeButton || tutorialFocus.addButton);
    const focusHand = tutorialFocus.selectedCard !== undefined || tutorialFocus.actionCards || tutorialFocus.ingredientLabel;
    const focusTable = !!tutorialFocus.table;

    if (isMobile) {
      if (focusTable) {
        return {
          ...base,
          left: 10,
          right: 10,
          top: 86,
          width: 'calc(100vw - 20px)',
          maxWidth: 'calc(100vw - 20px)',
        };
      }
      if (focusCloset) {
        return {
          ...base,
          left: 10,
          right: 10,
          bottom: 86,
          width: 'calc(100vw - 20px)',
          maxWidth: 'calc(100vw - 20px)',
        };
      }
      return {
        ...base,
        left: 10,
        right: 10,
        top: 74,
        width: 'calc(100vw - 20px)',
        maxWidth: 'calc(100vw - 20px)',
      };
    }

    if (focusTable) {
      return {
        ...base,
        top: 168,
        right: 24,
        width: 360,
        maxWidth: 360,
      };
    }
    if (focusCloset) {
      return {
        ...base,
        top: 92,
        left: 16,
        width: 360,
        maxWidth: 360,
      };
    }
    if (focusHand) {
      return {
        ...base,
        right: 16,
        bottom: 112,
        width: 360,
        maxWidth: 360,
      };
    }
    return {
      ...base,
      top: 92,
      right: 16,
      width: 360,
      maxWidth: 360,
    };
  })();
  const installCopy = INSTALL_PROMPT_COPY[uiLang] || INSTALL_PROMPT_COPY.en;
  const canOpenInstallPrompt = showIosInstallHint || !!deferredInstallPrompt;
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
  const [lastClosetCoverEvent, setLastClosetCoverEvent] = useState(null);
  const [lastHatStealEvent, setLastHatStealEvent] = useState(null);
  const [negationFx, setNegationFx] = useState(null);
  const [forkFx, setForkFx] = useState(null);
  const [comeComodinesFx, setComeComodinesFx] = useState(null);
  const [glotonFx, setGlotonFx] = useState(null);
  const [milanesaFx, setMilanesaFx] = useState(null);
  const [ensaladaFx, setEnsaladaFx] = useState(null);
  const [pizzaFx, setPizzaFx] = useState(null);
  const [parrillaFx, setParrillaFx] = useState(null);
  const [closetCoverFx, setClosetCoverFx] = useState(null);
  const [hatStealFx, setHatStealFx] = useState(null);
  const [forkAnim, setForkAnim] = useState(null);
  const [comeComodinesAnim, setComeComodinesAnim] = useState(null);
  const [glotonAnim, setGlotonAnim] = useState(null);
  const [milanesaAnim, setMilanesaAnim] = useState(null);
  const [ensaladaAnim, setEnsaladaAnim] = useState(null);
  const [pizzaAnim, setPizzaAnim] = useState(null);
  const [parrillaAnim, setParrillaAnim] = useState(null);
  const [closetCoverAnim, setClosetCoverAnim] = useState(null);
  const [hatStealAnim, setHatStealAnim] = useState(null);
  // Host-only ref that stores the resolve callback (not serializable over socket)
  const pendingNegRef = useRef(null);
  const lastNegationSeenRef = useRef(null);
  const lastForkSeenRef = useRef(null);
  const lastComeComodinesSeenRef = useRef(null);
  const tutorialNegationOutcomeText = (() => {
    if (!tutorialActive || tutorialStep !== 9) return null;
    if (!lastForkEvent || lastForkEvent.targetIdx !== HI) return null;
    const ingName = getIngName(lastForkEvent.ingredient, uiGameLang) || lastForkEvent.ingredient;
    const copyByUi = {
      es: `Como no has negado la accion, te han robado ${ingName}.`,
      en: `Because you did not negate the action, ${ingName} was stolen from you.`,
      fr: `Comme tu n as pas nie l action, on t a vole ${ingName}.`,
      it: `Dato che non hai negato l azione, ti hanno rubato ${ingName}.`,
      de: `Weil du die Aktion nicht negiert hast, wurde dir ${ingName} gestohlen.`,
      pt: `Como nao negaste a acao, roubaram-te ${ingName}.`,
    };
    return copyByUi[uiLang] || copyByUi.es;
  })();
  const lastGlotonSeenRef = useRef(null);
  const lastMilanesaSeenRef = useRef(null);
  const lastEnsaladaSeenRef = useRef(null);
  const lastPizzaSeenRef = useRef(null);
  const lastParrillaSeenRef = useRef(null);
  const lastClosetCoverSeenRef = useRef(null);
  const lastHatStealSeenRef = useRef(null);
  const playerAreaRefs = useRef({});
  const playerIngredientRefs = useRef({});
  const playerMainHatRefs = useRef({});
  const humanBurgerAreaRef = useRef(null);
  const humanBurgerSlotRefs = useRef({});
  const handCardRefs = useRef({});
  const humanMainHatRefs = useRef({});

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
    if (!forkFx) {
      setForkAnim(null);
      return undefined;
    }
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
      setEnsaladaAnim((prev) => (prev ? { ...prev, frameIdx: (prev.frameIdx + 1) % 2 } : prev));
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
      ingredientImg: ACTION_STACK_IMG.queso || burgerQueso,
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
          ingredientImg: ACTION_STACK_IMG.queso || burgerQueso,
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

    setParrillaAnim({
      x: center.x,
      y: center.y,
      frameIdx: 0,
      tridentX: targets[0]?.point.x || center.x,
      tridentY: targets[0]?.point.y || center.y,
      meatX: targets[0]?.point.x || center.x,
      meatY: targets[0]?.point.y || center.y,
      meatImg: ACTION_STACK_IMG[targets[0]?.ingredient] || (targets[0]?.ingredient === 'pollo' ? burgerPollo : burgerCarne),
      meatLabel: targets[0]?.ingredient || 'carne',
      showMeat: Boolean(targets[0]),
      visible: true,
      activePickup: 0,
      totalPickups: targets.length,
      sizzle: false,
    });

    const frameTimer = setInterval(() => {
      setParrillaAnim((prev) => (prev ? { ...prev, frameIdx: (prev.frameIdx + 1) % 3 } : prev));
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
          meatImg: ACTION_STACK_IMG[target.ingredient] || (target.ingredient === 'pollo' ? burgerPollo : burgerCarne),
          meatLabel: target.ingredient,
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
      setForkAnim(null);
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
      id: uid(),
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
      id: uid(),
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
      id: uid(),
      targets: result.affectedTargets,
    };
    setLastMilanesaEvent(event);
    lastMilanesaSeenRef.current = event.id;
    setMilanesaFx(event);
  }, []);

  const triggerEnsaladaEvent = useCallback((result) => {
    if (!result?.affectedTargets?.length) return;
    const event = {
      id: uid(),
      targets: result.affectedTargets,
    };
    setLastEnsaladaEvent(event);
    lastEnsaladaSeenRef.current = event.id;
    setEnsaladaFx(event);
  }, []);

  const triggerPizzaEvent = useCallback((result) => {
    if (!result?.affectedTargets?.length) return;
    const event = {
      id: uid(),
      targets: result.affectedTargets,
    };
    setLastPizzaEvent(event);
    lastPizzaSeenRef.current = event.id;
    setPizzaFx(event);
  }, []);

  const triggerParrillaEvent = useCallback((result) => {
    if (!result?.affectedTargets?.length) return;
    const event = {
      id: uid(),
      targets: result.affectedTargets,
    };
    setLastParrillaEvent(event);
    lastParrillaSeenRef.current = event.id;
    setParrillaFx(event);
  }, []);

  const triggerClosetCoverEvent = useCallback((actingIdx, targetIdx, actorName, targetName) => {
    const event = {
      id: uid(),
      actingIdx,
      targetIdx,
      actorName: actorName || 'Jugador',
      targetName: targetName || 'Jugador',
    };
    setLastClosetCoverEvent(event);
    if (!isOnline || actingIdx === HI || targetIdx === HI) {
      lastClosetCoverSeenRef.current = event.id;
      setClosetCoverFx(event);
    }
  }, [HI, isOnline]);

  const triggerHatStealEvent = useCallback((actingIdx, targetIdx, hatLang, actorName) => {
    if (!hatLang && hatLang !== '') return;
    const event = {
      id: uid(),
      actingIdx,
      targetIdx,
      hatLang,
      actorName: actorName || 'Jugador',
    };
    setLastHatStealEvent(event);
    lastHatStealSeenRef.current = event.id;
    setHatStealFx(event);
  }, []);

  useEffect(() => {
    if (!hatStealFx || typeof window === 'undefined') return undefined;
    const findHatRef = (bucket, hatLang) => {
      if (!bucket) return null;
      const exact = Object.entries(bucket).find(([key]) => key.startsWith(`${hatLang}-`));
      return exact?.[1] || Object.values(bucket)[0] || null;
    };
    const getCenter = (el, fallbackX, fallbackY) => {
      if (!el) return { x: fallbackX, y: fallbackY };
      const rect = el.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };
    const actorHatEl = hatStealFx.actingIdx === HI
      ? findHatRef(humanMainHatRefs.current, hatStealFx.hatLang)
      : findHatRef(playerMainHatRefs.current[hatStealFx.actingIdx], hatStealFx.hatLang);
    const targetHatEl = hatStealFx.targetIdx === HI
      ? findHatRef(humanMainHatRefs.current, hatStealFx.hatLang)
      : findHatRef(playerMainHatRefs.current[hatStealFx.targetIdx], hatStealFx.hatLang);
    const actorFallback = hatStealFx.actingIdx === HI ? { x: window.innerWidth * 0.78, y: window.innerHeight * 0.33 } : getCenter(playerAreaRefs.current[hatStealFx.actingIdx], window.innerWidth * 0.15, window.innerHeight * 0.28);
    const targetFallback = hatStealFx.targetIdx === HI ? { x: window.innerWidth * 0.78, y: window.innerHeight * 0.33 } : getCenter(playerAreaRefs.current[hatStealFx.targetIdx], window.innerWidth * 0.15, window.innerHeight * 0.24);
    const source = getCenter(targetHatEl, targetFallback.x, targetFallback.y);
    const destination = getCenter(actorHatEl, actorFallback.x, actorFallback.y);
    const dx = destination.x - source.x;
    const dy = destination.y - source.y;
    const distance = Math.max(Math.hypot(dx, dy), 1);
    const tugPoint = {
      x: source.x + (dx / distance) * 22,
      y: source.y + (dy / distance) * 16,
    };

    setHatStealAnim({
      x: source.x,
      y: source.y,
      hatX: source.x,
      hatY: source.y,
      destinationX: destination.x,
      destinationY: destination.y,
      hatLang: hatStealFx.hatLang,
      frame: 1,
      moving: false,
      releasing: false,
    });

    const timers = [];
    timers.push(setTimeout(() => {
      setHatStealAnim((prev) => prev ? {
        ...prev,
        frame: 2,
        releasing: false,
      } : prev);
    }, 220));
    timers.push(setTimeout(() => {
      setHatStealAnim((prev) => prev ? {
        ...prev,
        x: tugPoint.x,
        y: tugPoint.y,
        hatX: tugPoint.x,
        hatY: tugPoint.y,
      } : prev);
    }, 340));
    timers.push(setTimeout(() => {
      setHatStealAnim((prev) => prev ? {
        ...prev,
        moving: true,
        x: destination.x,
        y: destination.y,
        hatX: destination.x,
        hatY: destination.y,
      } : prev);
    }, 470));
    timers.push(setTimeout(() => {
      setHatStealAnim((prev) => prev ? {
        ...prev,
        frame: 1,
        moving: false,
        releasing: true,
      } : prev);
    }, 1510));
    timers.push(setTimeout(() => {
      setHatStealAnim(null);
      setHatStealFx(null);
    }, 1890));

    return () => {
      timers.forEach(clearTimeout);
      setHatStealAnim(null);
    };
  }, [hatStealFx, HI]);

  useEffect(() => {
    if (!closetCoverFx || typeof window === 'undefined') return undefined;
    const eventId = closetCoverFx.id || uid();
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight * (isMobile ? 0.42 : 0.4);
    setClosetCoverAnim({
      id: eventId,
      visible: true,
      x: centerX,
      y: centerY,
      frameIdx: 0,
      finished: false,
    });
    const timers = [];
    timers.push(setTimeout(() => {
      setClosetCoverAnim((prev) => (prev?.id === eventId ? { ...prev, frameIdx: 1 } : prev));
    }, 220));
    timers.push(setTimeout(() => {
      setClosetCoverAnim((prev) => (prev?.id === eventId ? { ...prev, frameIdx: 2 } : prev));
    }, 460));
    timers.push(setTimeout(() => {
      setClosetCoverAnim((prev) => (prev?.id === eventId ? { ...prev, frameIdx: 3 } : prev));
    }, 720));
    timers.push(setTimeout(() => {
      setClosetCoverAnim((prev) => (prev?.id === eventId ? { ...prev, finished: true } : prev));
    }, 980));
    timers.push(setTimeout(() => {
      setClosetCoverAnim((prev) => (prev?.id === eventId ? null : prev));
      setClosetCoverFx((prev) => (prev?.id === eventId ? null : prev));
    }, 1800));

    return () => {
      timers.forEach(clearTimeout);
      setClosetCoverAnim(null);
    };
  }, [closetCoverFx, isMobile]);

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

  useEffect(() => {
    if (!tutorialActive) return;
    if (tutorialState?.practiceMode) return;
    applyTutorialScenario(mapVisibleTutorialStepToScenarioStep(tutorialState.step));
  }, [tutorialActive, tutorialState?.step, user?.displayName, user?.id, user?.username, user?.avatarUrl, mapVisibleTutorialStepToScenarioStep]);

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
    setTutorialState(null);
    setPendingNeg(null);
    setLastNegationEvent(null);
    setLastForkEvent(null);
    setLastComeComodinesEvent(null);
    setLastGlotonEvent(null);
    setLastMilanesaEvent(null);
    setLastEnsaladaEvent(null);
    setLastPizzaEvent(null);
    setLastParrillaEvent(null);
    setLastClosetCoverEvent(null);
    setLastHatStealEvent(null);
    setLastHatStealEvent(null);
    setNegationFx(null);
    setForkFx(null);
    setComeComodinesFx(null);
    setGlotonFx(null);
    setMilanesaFx(null);
    setEnsaladaFx(null);
    setPizzaFx(null);
    setParrillaFx(null);
    setClosetCoverFx(null);
    setHatStealFx(null);
    setHatStealFx(null);
    setForkAnim(null);
    setComeComodinesAnim(null);
    setGlotonAnim(null);
    setMilanesaAnim(null);
    setEnsaladaAnim(null);
    setPizzaAnim(null);
    setParrillaAnim(null);
    setClosetCoverAnim(null);
    setHatStealAnim(null);
    setHatStealAnim(null);
    pendingNegRef.current = null;
    lastNegationSeenRef.current = null;
    lastForkSeenRef.current = null;
    lastComeComodinesSeenRef.current = null;
    lastGlotonSeenRef.current = null;
    lastMilanesaSeenRef.current = null;
    lastEnsaladaSeenRef.current = null;
    lastPizzaSeenRef.current = null;
    lastParrillaSeenRef.current = null;
    lastClosetCoverSeenRef.current = null;
    lastHatStealSeenRef.current = null;
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
    setMyRoomPlayerName('');
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
    setLastClosetCoverEvent(null);
    setNegationFx(null);
    setForkFx(null);
    setComeComodinesFx(null);
    setGlotonFx(null);
    setMilanesaFx(null);
    setEnsaladaFx(null);
    setPizzaFx(null);
    setParrillaFx(null);
    setClosetCoverFx(null);
    setForkAnim(null);
    setComeComodinesAnim(null);
    setGlotonAnim(null);
    setMilanesaAnim(null);
    setEnsaladaAnim(null);
    setPizzaAnim(null);
    setParrillaAnim(null);
    setClosetCoverAnim(null);
    lastNegationSeenRef.current = null;
    lastForkSeenRef.current = null;
    lastComeComodinesSeenRef.current = null;
    lastGlotonSeenRef.current = null;
    lastMilanesaSeenRef.current = null;
    lastEnsaladaSeenRef.current = null;
    lastPizzaSeenRef.current = null;
    lastParrillaSeenRef.current = null;
    lastClosetCoverSeenRef.current = null;
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

  function getTutorialPromptKey(userId) {
    return userId ? `hp_tutorial_prompt_seen_${userId}` : null;
  }

  function markTutorialPromptSeen(userId) {
    const key = getTutorialPromptKey(userId);
    if (key && typeof localStorage !== 'undefined') localStorage.setItem(key, '1');
  }

  function hasSeenTutorialPrompt(userId) {
    const key = getTutorialPromptKey(userId);
    return key ? localStorage.getItem(key) === '1' : false;
  }

  function handleAuthSuccess(nextUser, meta = {}) {
    setUser(nextUser);
    setPhase('setup');
    if (meta?.isNewUser && !hasSeenTutorialPrompt(nextUser?.id)) {
      setTutorialPrompt('familiarity');
    } else {
      setTutorialPrompt(null);
    }
  }

  function resolveTutorialPendingAction(resolution) {
    if (!resolution) return;
    if (resolution.type === 'fork') {
      const nextPlayers = clone(playersRef.current);
      const nextDiscard = [...discardRef.current];
      const actingIdx = resolution.actingIdx;
      const targetIdx = resolution.targetIdx;
      const stolenPreview = nextPlayers[targetIdx]?.table?.[resolution.ingIdx] || null;
      const cardIdx = nextPlayers[actingIdx]?.hand?.findIndex((c) => c.action === 'tenedor') ?? -1;
      const card = cardIdx !== -1
        ? nextPlayers[actingIdx].hand.splice(cardIdx, 1)[0]
        : { type: 'action', action: 'tenedor', id: uid() };
      nextDiscard.push(card);
      const result = targetedActionService.apply({
        card,
        actingIdx,
        targetIdx,
        action: { ingIdx: resolution.ingIdx },
        players: nextPlayers,
        discard: nextDiscard,
        humanIdx: HI,
      });
      if (!result) return;
      if (stolenPreview) {
        addLog(
          actingIdx,
          `robó ${ING_EMOJI[ingKey(stolenPreview)]} de ${playersRef.current[targetIdx]?.name || 'Jugador'}`,
          result.players,
        );
      }
      setPlayers(result.players);
      setDiscard(result.discard);
    }
  }

  function applyTutorialScenario(step) {
    const scenario = buildTutorialScenario(step, {
      playerName: user?.displayName || 'Jugador',
      user,
    });
    // Apply carryOver from previous tutorial steps (hat changes, add hat, basurero card)
    if (tutorialCarryOver && step >= 4) {
      const p = scenario.players[0];
      if (tutorialCarryOver.mainHats) p.mainHats = [...tutorialCarryOver.mainHats];
      if (tutorialCarryOver.perchero) p.perchero = [...tutorialCarryOver.perchero];
      if (tutorialCarryOver.maxHand != null) p.maxHand = tutorialCarryOver.maxHand;
      if (tutorialCarryOver.table) p.table = [...tutorialCarryOver.table];
      if (tutorialCarryOver.hand) p.hand = tutorialCarryOver.hand.map((card) => ({ ...card }));
      if (step === 4 && tutorialCarryOver.table?.includes('queso')) {
        const nextIngredientIdx = p.hand.findIndex((card) => card?.type === 'ingredient');
        scenario.selectedIdx = nextIngredientIdx >= 0 ? nextIngredientIdx : null;
      }
    }
    if (tutorialCarryOver?.basureroCard && step >= 9) {
      scenario.players[0].hand.push(tutorialCarryOver.basureroCard);
    }
    setPlayers(scenario.players);
    setDeck(scenario.deck || []);
    setDiscard(scenario.discard || []);
    setCp(scenario.cp || 0);
    setLog([]);
    setSelectedIdx(scenario.selectedIdx ?? null);
    setModal(null);
    setPendingNeg(scenario.pendingNeg || null);
    setLastForkEvent(null);
    setForkFx(null);
    pendingNegRef.current = scenario.pendingNeg
      ? {
          ...scenario.pendingNeg,
          resolveCallback: scenario.tutorialPendingResolution
            ? () => resolveTutorialPendingAction(scenario.tutorialPendingResolution)
            : () => {},
        }
      : null;
    setWinner(null);
    setExtraPlay(!!scenario.extraPlay);
    setCurrentGameConfig(scenario.gameConfig || null);
    setTurnTime(60);
    releaseAITurnLock();
    setPhase('playing');
  }

  function startTutorialGame() {
    setTutorialPrompt(null);
    setTutorialCarryOver(null);
    setTutorialState(createTutorialState(0));
  }

  function advanceTutorialAfter(actionType) {
    if (!shouldAdvanceTutorialStep(tutorialActive, tutorialStep, actionType)) return false;
    setTimeout(() => nextTutorialStep(), 500);
    return true;
  }

  function finishTutorialGame() {
    setTutorialState(null);
    setTutorialCarryOver(null);
    setPostTutorialGame(false);
    resetLocalGameState();
    setPhase('setup');
  }

  function nextTutorialStep() {
    if (!tutorialActive) return;
    const transition = advanceTutorialState(tutorialState, tutorialSteps.length);
    if (transition.type === 'practice') {
      startTutorialPracticeGame();
      return;
    }
    if (transition.type === 'step') {
      setTutorialState(transition.state);
    }
  }

  function startTutorialPracticeGame() {
    setTutorialState(null);
    setTutorialCarryOver(null);
    setPostTutorialGame(true);
    const name = user?.displayName || 'Jugador';
    const hat = 'espanol';
    const gameConfig = {
      mode: 'clon',
      burgerCount: 1,
      ingredientCount: 3,
      ingredientPool: ['lechuga', 'tomate', 'queso', 'carne', 'pollo'],
      cloneWildcardsEnabled: true,
    };
    startGame(name, hat, gameConfig, 1);
  }

  function prevTutorialStep() {
    if (!tutorialActive) return;
    setTutorialState((prev) => {
      if (!prev?.active) return prev;
      return rewindTutorialState({ ...prev, step: (prev.step ?? 0) - 1 });
    });
  }

  function openProfile(targetUser, returnPhase = phase) {
    const targetUserId = typeof targetUser === 'object' && targetUser !== null ? targetUser.id : targetUser;
    if (!targetUserId) return;
    const normalizedReturnPhase = returnPhase || (user ? 'setup' : 'auth');
    if (typeof targetUser === 'object' && targetUser !== null) {
      setProfilePreview({
        id: targetUserId,
        username: targetUser.username || null,
        displayName: targetUser.displayName || targetUser.name || targetUser.username || '',
        avatarUrl: targetUser.avatarUrl || null,
      });
    } else {
      setProfilePreview(null);
    }
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
      setProfilePreview(null);
      setProfileUserId(prevProfileId);
      setShowQuickMenu(false);
      setPhase('profile');
      return;
    }
    setProfilePreview(null);
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
      setMyRoomPlayerName(session.playerName || '');
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
            setPendingHatLimitSelection(gameState.pendingHatLimitSelection || null);
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
            setLastClosetCoverEvent(gameState.lastClosetCoverEvent || null);
            setLastHatStealEvent(gameState.lastHatStealEvent || null);
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
    socket.on('lobbyHatsReset', ({ players: pls }) => {
      if (Array.isArray(pls)) setLobbyPlayers(pls);
      else setLobbyPlayers(prev => prev.map(player => ({ ...player, hat: null })));
      setChatMessages(prev => [...prev, { playerName: 'Sistema', text: 'El host cambió. Se reiniciaron los sombreros del lobby.', timestamp: Date.now() }]);
    });
    socket.on('lobbyHatPick', ({ playerName, hat }) => {
      setLobbyPlayers((prev) => prev.map((player) => (
        player.name === playerName ? { ...player, hat } : player
      )));
    });
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
    socket.on('playerRemovedFromGame', ({ playerIdx, playerName, activeCount, winner: leaveWinner }) => {
      setChatMessages(prev => [...prev, { playerName: 'Sistema', text: `${playerName} ha abandonado la partida`, timestamp: Date.now() }]);
      setLeaveNotice({ playerName, id: uid() });
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
      if (leaveWinner) {
        setWinner(leaveWinner);
        clearRoomSession();
        setPhase('gameover');
      } else {
        setGamePaused(false);
        setPausedMessage('');
      }
    });
    return () => {
      socket.off('lobbyUpdate');
      socket.off('lobbyHatsReset');
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

  useEffect(() => {
    if (!leaveNotice) return;
    const timer = setTimeout(() => setLeaveNotice(null), 4200);
    return () => clearTimeout(timer);
  }, [leaveNotice]);

  useEffect(() => {
    if (!isOnline || !Array.isArray(lobbyPlayers) || lobbyPlayers.length === 0) return;
    let nextIdx = -1;
    if (socket.id) {
      nextIdx = lobbyPlayers.findIndex((player) => player.socketId === socket.id);
    }
    if (nextIdx < 0 && myRoomPlayerName) {
      nextIdx = lobbyPlayers.findIndex((player) => player.name === myRoomPlayerName);
    }
    if (nextIdx >= 0 && nextIdx !== myPlayerIdx) {
      setMyPlayerIdx(nextIdx);
      const session = getRoomSession();
      const resolvedPlayerName = lobbyPlayers[nextIdx]?.name || myRoomPlayerName;
      if (resolvedPlayerName && resolvedPlayerName !== myRoomPlayerName) {
        setMyRoomPlayerName(resolvedPlayerName);
      }
      if (session) saveRoomSession({ ...session, myPlayerIdx: nextIdx, playerName: resolvedPlayerName || myRoomPlayerName });
    }
  }, [isOnline, lobbyPlayers, myPlayerIdx, myRoomPlayerName]);

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
      setPendingHatLimitSelection(state.pendingHatLimitSelection || null);
      setModal(currentModal => {
        const privateModals = ['manual_cambiar', 'manual_cambiar_target', 'manual_cambiar_discard', 'manual_agregar', 'wildcard', 'basurero', 'pickHatReplace', 'pickHatExchange', 'pickHatSteal', 'ingredientInfo', 'pickTarget', 'pickIngredient', 'pickIngredientRemote'];
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
      setLastClosetCoverEvent(state.lastClosetCoverEvent || null);
      setLastHatStealEvent(state.lastHatStealEvent || null);
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
      if (
        state.lastClosetCoverEvent?.id &&
        state.lastClosetCoverEvent.id !== lastClosetCoverSeenRef.current &&
        (state.lastClosetCoverEvent.targetIdx === myPlayerIdx || state.lastClosetCoverEvent.actingIdx === myPlayerIdx)
      ) {
        lastClosetCoverSeenRef.current = state.lastClosetCoverEvent.id;
        setClosetCoverFx(state.lastClosetCoverEvent);
      }
      if (state.lastHatStealEvent?.id && state.lastHatStealEvent.id !== lastHatStealSeenRef.current) {
        lastHatStealSeenRef.current = state.lastHatStealEvent.id;
        setHatStealFx(state.lastHatStealEvent);
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
      const privateModals = ['manual_cambiar', 'manual_cambiar_target', 'manual_cambiar_discard', 'manual_agregar', 'wildcard', 'basurero', 'pickHatReplace', 'pickHatExchange', 'pickHatSteal', 'ingredientInfo', 'pickTarget', 'pickIngredient', 'pickIngredientRemote'];
      const syncModal = modal && privateModals.includes(modal.type) ? null : modal;
      socket.emit('syncState', {
        code: roomCode,
        state: { players, deck, discard, cp, log, extraPlay, modal: syncModal, pendingHatLimitSelection, pendingNeg, lastNegationEvent, lastForkEvent, lastComeComodinesEvent, lastGlotonEvent, lastMilanesaEvent, lastEnsaladaEvent, lastPizzaEvent, lastParrillaEvent, lastClosetCoverEvent, lastHatStealEvent, winner, gameConfig: currentGameConfig, phase: 'playing' },
      });
    }, 80);
    return () => clearTimeout(syncRef.current);
  }, [players, deck, discard, cp, log, extraPlay, modal, pendingHatLimitSelection, pendingNeg, lastNegationEvent, lastForkEvent, lastComeComodinesEvent, lastGlotonEvent, lastMilanesaEvent, lastEnsaladaEvent, lastPizzaEvent, lastParrillaEvent, lastClosetCoverEvent, lastHatStealEvent, winner, currentGameConfig, phase, isOnline, isHost]);

  // â”€â”€ Socket: host processes remote player actions â”€â”€
  // We store the latest state in refs so the socket handler always has fresh values
  const playersRef = useRef(players);
  const deckRef = useRef(deck);
  const discardRef = useRef(discard);
  const modalRef = useRef(modal);
  const pendingHatLimitSelectionRef = useRef(pendingHatLimitSelection);
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { deckRef.current = deck; }, [deck]);
  useEffect(() => { discardRef.current = discard; }, [discard]);
  useEffect(() => { modalRef.current = modal; }, [modal]);
  useEffect(() => { pendingHatLimitSelectionRef.current = pendingHatLimitSelection; }, [pendingHatLimitSelection]);
  useEffect(() => {
    if (!showLanguageMenu) return undefined;
    const handleOutsideLanguageMenu = (event) => {
      const target = event.target;
      if (languageMenuButtonRef.current?.contains(target)) return;
      if (languageMenuTrayRef.current?.contains(target)) return;
      setShowLanguageMenu(false);
    };
    document.addEventListener('pointerdown', handleOutsideLanguageMenu, true);
    return () => document.removeEventListener('pointerdown', handleOutsideLanguageMenu, true);
  }, [showLanguageMenu]);

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

  const forkEventObserver = useCallback((event) => {
    if (!event) return;
    setLastForkEvent(event);
    if (!isOnline || event.targetIdx === HI || event.actingIdx === HI) {
      lastForkSeenRef.current = event.id;
      setForkFx(event);
    }
  }, [HI, isOnline]);

  const actionEffectObserver = createActionEffectObserver({
    onComeComodines: triggerComeComodinesEvent,
    onMilanesa: triggerMilanesaEvent,
    onEnsalada: triggerEnsaladaEvent,
    onPizza: triggerPizzaEvent,
    onParrilla: triggerParrillaEvent,
    onClosetCover: triggerClosetCoverEvent,
    onGloton: triggerGlotonEvent,
    onHatSteal: triggerHatStealEvent,
    onFork: forkEventObserver,
  });

  const {
    closetCoverPolicy,
    turnEngine,
    remoteActionService,
    targetedActionService,
  } = createGameServices({
    getRemainingNeeds,
    getCardKeepScore,
    effectObserver: actionEffectObserver,
    drawN,
    clonePlayers: clone,
    checkWin,
    canPlayCard,
    advanceBurger,
    getIngName,
    ingEmoji: ING_EMOJI,
    ingKey,
    uid,
    getRandomGameLanguage,
    getTableSlotIndexForCurrentBurger,
    filterTable,
  });

  const remoteActionDispatcher = createRemoteActionDispatcher({
    remoteActionService,
    endTurnFromRemote,
    setPlayers,
    setDeck,
    setDiscard,
    setExtraPlay,
    setPendingHatLimitSelection,
    maxMainHats: MAX_MAIN_HATS,
  });
  const playerActionCommands = createPlayerActionCommands({
    isOnline,
    isHost,
    roomCode,
    socket,
    clonePlayers: clone,
    canPlayCard,
    advanceBurger,
    getIngName,
    getActionInfo,
    ingEmoji: ING_EMOJI,
    ingKey,
    uid,
    getRandomGameLanguage,
    addLog,
    endTurn,
    advanceTutorialAfter,
    setTutorialCarryOver,
  });

  function finishClosetCoverAction(basePlayers, baseDeck, baseDiscard, actingIdx, targetIdx, blocked) {
    const nextPlayers = clone(basePlayers);
    if (blocked) {
      nextPlayers[targetIdx].closetCovered = true;
      actionEffectObserver.publishClosetCoverEvent({
        id: uid(),
        actingIdx,
        targetIdx,
        actorName: nextPlayers[actingIdx]?.name || 'Jugador',
        targetName: nextPlayers[targetIdx]?.name || 'Jugador',
      });
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
      const shouldAvoid = closetCoverPolicy.shouldAvoid(target);
      if (shouldAvoid) {
        const discardIndices = closetCoverPolicy.getDiscardIndices(target).sort((a, b) => b - a);
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
      id: uid(),
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
    if (!tutorialAllowsNegation && tutorialActive) return;

    // Non-host sends response via socket; host handles it in processRemoteAction
    if (isOnline && !isHost) {
      socket.emit('playerAction', { code: roomCode, action: { type: 'negationResponse', negar } });
      // Optimistically mark as responded in local display
      setPendingNeg(prev => prev ? { ...prev, responses: { ...prev.responses, [HI]: negar } } : null);
      return;
    }

    if (negar) {
      cancelWithNegation(pendingNeg.actingIdx, HI, pendingNeg.card ?? pendingNegRef.current?.card);
      advanceTutorialAfter('negation');
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

  function syncPlayerHatState(player) {
    if (!player) return player;
    const hats = Array.isArray(player.mainHats) ? player.mainHats.filter(Boolean) : [];
    player.mainHats = hats;
    player.manuallyAddedHats = hats.slice(1);
    player.maxHand = Math.min(6, Math.max(1, 7 - hats.length));
    return player;
  }

  function finishPendingStealIfReady(nextPlayers, nextDiscard, actingIdx, nextDeck = deckRef.current) {
    const stillWaitingForOverflow = pendingHatLimitSelectionRef.current?.source === 'steal';
    const stillWaitingForReplacement = modalRef.current?.type === 'pickHatReplace';
    if (stillWaitingForOverflow || stillWaitingForReplacement) return;
    endTurn(nextPlayers, nextDeck, nextDiscard, actingIdx);
  }

  // -- Start game (local / vs AI) --
  function startGame(name, hat, gameConfig, aiCount) {
    const normalizedConfig = normalizeGameConfig(gameConfig);
    const rawDeck = generateDeck(normalizedConfig);
    const deckArr = [...rawDeck];
    const ps = [];
    ps.push(initPlayer(name, deckArr, hat, normalizedConfig, false, {
      username: user?.username || null,
      userId: user?.id || null,
      avatarUrl: user?.avatarUrl || null,
    }));
    const usedHats = [hat];
    const aiNames = shuffle([...AI_NAMES, 'Maestro Cocinero', 'Hambre Total', 'Chef PolÃ­glota']);
    for (let i = 0; i < aiCount; i++) {
      const avail = LANGUAGES.filter(l => !usedHats.includes(l));
      const aiHat = avail.length ? shuffle(avail)[0] : shuffle(LANGUAGES)[0];
      usedHats.push(aiHat);
      ps.push(initPlayer(aiNames[i % aiNames.length], deckArr, aiHat, normalizedConfig, true, {
        avatarUrl: vsiaImg,
      }));
    }
    setPlayers(ps); setDeck(deckArr); setDiscard([]);
    setCp(0); setLog([]); setSelectedIdx(null); setModal(null); setPendingHatLimitSelection(null);
    setWinner(null); setExtraPlay(false); setCurrentGameConfig(normalizedConfig);
    releaseAITurnLock();
    setPhase('playing');
  }

  // â”€â”€ Start game (online host) â”€â”€
  function startOnlineGame(hatPicks, gameConfig, onlinePls) {
    const normalizedConfig = normalizeGameConfig(gameConfig);
    const rawDeck = generateDeck(normalizedConfig);
    const deckArr = [...rawDeck];
    const ps = onlinePls.map(p => initPlayer(p.name, deckArr, hatPicks[p.name] || p.hat, normalizedConfig, !!p.isAI, {
      username: p.username || null,
      userId: p.userId || null,
      avatarUrl: p.isAI ? vsiaImg : (p.avatarUrl || null),
    }));
    // Mark non-host players as remote
    ps.forEach((p, i) => { if (i !== 0 && !p.isAI) p.isRemote = true; });
    setPlayers(ps); setDeck(deckArr); setDiscard([]);
    setCp(0); setLog([]); setSelectedIdx(null); setModal(null); setPendingHatLimitSelection(null);
    setWinner(null); setExtraPlay(false); setCurrentGameConfig(normalizedConfig);
    releaseAITurnLock();
    // Update session to reflect game started
    const session = getRoomSession();
    if (session) saveRoomSession({ ...session, phase: 'playing' });
    setPhase('playing');
  }

  // â”€â”€ Shared targeted action resolution (used by host for both local and remote players) â”€â”€
  function applyTargetedAction(card, actingIdx, ti, action, pls, dk, di) {
    const result = targetedActionService.apply({
      card,
      actingIdx,
      targetIdx: ti,
      action,
      players: pls,
      discard: di,
      humanIdx: HI,
    });

    if (!result) return;

    syncPlayerHatState(result.players[actingIdx]);
    syncPlayerHatState(result.players[ti]);

    const actingOverflow = (result.players[actingIdx]?.mainHats?.length || 0) > MAX_MAIN_HATS;

    if (result.kind === 'needs_hat_replace') {
      setPlayers(result.players); setDiscard(result.discard);
      if (actingOverflow) {
        setPendingHatLimitSelection({ playerIdx: actingIdx, source: 'steal', actingIdx, discard: result.discard });
      }
      setModal({ type: 'pickHatReplace', newPls: result.players, newDiscard: result.discard, victimIdx: result.victimIdx, fromIdx: result.fromIdx });
      return;
    }

    if (result.kind === 'closet_cover') {
      promptClosetCoverResponse(actingIdx, ti, result.players, dk, result.discard);
      return;
    }

    if (actingOverflow) {
      setPlayers(result.players);
      setDiscard(result.discard);
      setPendingHatLimitSelection({ playerIdx: actingIdx, source: 'steal', actingIdx, discard: result.discard });
      return;
    }

    endTurnFromRemote(result.players, dk, result.discard, actingIdx);
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

            const handledByStrategy = remoteActionDispatcher.dispatch(type, {
              idx,
              action,
              players: pls,
              deck: dk,
              discard: di,
              addLog,
            });
            if (handledByStrategy) return;

            if (type === 'playMass') {
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
                actionEffectObserver.publishMassAction(card.action, { result: r, actingIdx: idx, actorName: fp[idx]?.name || 'Jugador' });
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

            } else if (type === 'pickHatReplace') {
              // Victim (remote) picks replacement hat after ladron
              if (prevModal?.type === 'pickHatReplace') {
                const { newPls, newDiscard, victimIdx, fromIdx } = prevModal;
                const hi = newPls[victimIdx].perchero.indexOf(action.hatLang);
                if (hi !== -1) {
                  newPls[victimIdx].perchero.splice(hi, 1);
                  newPls[victimIdx].mainHats.push(action.hatLang);
                  syncPlayerHatState(newPls[victimIdx]);
                }
                setModal(null);
                setTimeout(() => finishPendingStealIfReady(newPls, newDiscard, fromIdx ?? idx, dk), 0);
              }

            } else if (type === 'returnOverflowHat') {
              const pending = pendingHatLimitSelectionRef.current;
              if (!pending || pending.playerIdx !== idx) return;
              const nextPlayers = clone(playersRef.current);
              const player = nextPlayers[idx];
              const hatIdx = player?.mainHats?.indexOf(action.hatLang);
              if (hatIdx === -1) return;
              const [returnedHat] = player.mainHats.splice(hatIdx, 1);
              player.perchero.push(returnedHat);
              syncPlayerHatState(player);
              setPlayers(nextPlayers);
              setPendingHatLimitSelection(null);
              if (pending.source === 'manualAgregar') {
                setExtraPlay(true);
              } else if (pending.source === 'steal') {
                setTimeout(() => finishPendingStealIfReady(nextPlayers, pending.discard || discardRef.current, pending.actingIdx ?? idx, deckRef.current), 0);
              }
              return;

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
    const result = turnEngine.resolveTurnEnd({
      players: pls,
      deck: deckArr,
      discard: discardArr,
      fromIdx,
    });
    const newPls = result.players;
    const newDeck = result.deck;
    const newDiscard = result.discard;
    const w = result.winner;
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
    const nextIdx = result.nextIdx;
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
      const matchesHat = nextHats.some((hatLang) => languageMatches(hatLang, card.language));
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
      const usefulHat = target.mainHats.some(h => self.hand.some(card => card.type === 'ingredient' && languageMatches(card.language, h)));
      score = target.mainHats.length ? (usefulHat ? 55 : 25) : -20;
    }
    if (action === 'intercambio_sombreros') {
      const theirHat = target.mainHats[0];
      const helpsMe = theirHat && self.hand.some(card => card.type === 'ingredient' && languageMatches(card.language, theirHat));
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
        freed.forEach(ing => newDiscard.push({ type: 'ingredient', ingredient: ingKey(ing), language: getRandomGameLanguage(), id: uid() }));
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
            actionEffectObserver.publishMassAction(card.action, { result: r, actingIdx: idx, actorName: newPls[idx]?.name || 'IA' });
          newPls = r.players; newDiscard = r.discard;
        } else if (richest !== null && richest !== undefined) {
            if (card.action === 'gloton') {
              actionEffectObserver.publishGlotonEvent({
                actingIdx: idx,
                targetIdx: richest,
                targetTable: [...newPls[richest].table],
                actorName: newPls[idx]?.name || 'IA',
              });
              newPls[richest].table.forEach(ing => newDiscard.push({ type: 'ingredient', ingredient: ingKey(ing), language: getRandomGameLanguage(), id: uid() }));
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
                id: uid(),
                actingIdx: idx,
                targetIdx: richest,
                actorName: newPls[idx]?.name || 'IA',
                ingredient: ingKey(stolen),
                stolenRaw: stolen,
                sourceIngIdx: si,
                sourceSlotIdx,
              };
              actionEffectObserver.publishForkEvent(forkEvent);
              const { player: up2, freed: fr2, done: dn2 } = advanceBurger(newPls[idx]);
              newPls[idx] = up2;
              if (dn2) { fr2.forEach(ing => newDiscard.push({ type: 'ingredient', ingredient: ingKey(ing), language: getRandomGameLanguage(), id: uid() })); }
              addLog(idx, `robó ${ING_EMOJI[ingKey(stolen)]} de ${pls[richest].name}`, newPls);
            }
          } else if (card.action === 'ladron') {
            if (newPls[richest].mainHats.length > 0) {
              const stolen = newPls[richest].mainHats.splice(0, 1)[0];
              newPls[idx].mainHats.push(stolen);
              actionEffectObserver.publishHatStealEvent({
                actingIdx: idx,
                targetIdx: richest,
                hatLang: stolen,
                actorName: pls[idx]?.name || 'Jugador',
              });
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

    if (!p.closetCovered && p.perchero.length > 0 && p.hand.length > 0 && p.maxHand > 1 && p.mainHats.length < MAX_MAIN_HATS && !extraPlay && Math.random() <= aiConfig.addChance) {
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
    if (tutorialActive && !tutorialPractice) return;
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
  }, [phase, cp, players, deck, discard, modal, pendingNeg, releaseAITurnLock, tutorialActive, tutorialPractice]);
  // â”€â”€ Turn timer (60s) â”€â”€
  useEffect(() => {
    clearInterval(turnTimerRef.current);
    const isTimedPlayer = players[cp] && !players[cp].isAI;
    if (phase !== 'playing' || !isTimedPlayer || tutorialActive) { setTurnTime(60); return; }
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
  }, [phase, cp, players.length, tutorialActive]);

  useEffect(() => {
    if (turnTime !== 0) return;
    if (phase !== 'playing') return;
    if (tutorialActive) return;
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
  }, [turnTime, tutorialActive]);

  // â”€â”€ Human: Play selected card â”€â”€
  function humanPlay() {
    if (selectedIdx === null) return;
    if (!tutorialAllowsPlayButton) return;
    const human = players[HI];
    const card = human.hand[selectedIdx];

    if (card.type === 'ingredient') {
      playerActionCommands.playIngredient({
        human,
        card,
        selectedIdx,
        players,
        discard,
        deck,
        hi: HI,
        setModal,
        setSelectedIdx,
        setPlayers,
        setDiscard,
        setExtraPlay,
      });
    } else if (card.type === 'action') {
      if (isOnline && !isHost) {
        humanPlayActionRemote(card, selectedIdx);
        return;
      }
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
          if (card.action === 'comecomodines') massResult.sourcePoint = sourcePoint;
          actionEffectObserver.publishMassAction(card.action, { result: massResult, actingIdx: HI, actorName: newPls[HI]?.name || 'Jugador' });
          const { players: ps2, discard: di2 } = massResult;
          if (advanceTutorialAfter('actionCard')) {
            setPlayers(ps2);
            setDiscard(di2);
            return;
          }
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
    if (tutorialActive && !tutorialPractice && tutorialStep !== 6) return;
    if (selectedIdx === null) return;
    playerActionCommands.discardSelected({
      selectedIdx,
      players,
      discard,
      deck,
      hi: HI,
      setSelectedIdx,
      setPlayers,
      setDiscard,
    });
  }

  function confirmWildcard(chosenIng) {
    if (tutorialActive && !tutorialPractice && tutorialStep !== 7) return;
    playerActionCommands.confirmWildcard({
      modal,
      chosenIng,
      players,
      discard,
      deck,
      hi: HI,
      setModal,
      setSelectedIdx,
      setPlayers,
      setDiscard,
      setExtraPlay,
    });
  }

  // â”€â”€ Modal resolvers â”€â”€
  function resolvePickTarget(targetIdx) {
    if (tutorialActive && !tutorialPractice && tutorialStep !== 8) return;
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
        actionEffectObserver.publishGlotonEvent({
          actingIdx: HI,
          targetIdx,
          targetTable: [...newPls[targetIdx].table],
          actorName: newPls[HI]?.name || 'Jugador',
        });
        newPls[targetIdx].table.forEach(ing => newDiscard.push({ type: 'ingredient', ingredient: ingKey(ing), language: getRandomGameLanguage(), id: uid() }));
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
    if (tutorialActive && !tutorialPractice && tutorialStep !== 8) return;
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
      id: uid(),
      actingIdx: HI,
      targetIdx,
      actorName: newPls[HI]?.name || 'Jugador',
      ingredient: ingKey(stolen),
      stolenRaw: stolen,
      sourceIngIdx: ingIdx,
      sourceSlotIdx,
    };
    actionEffectObserver.publishForkEvent(forkEvent);
    const { player: up, freed, done } = advanceBurger(newPls[HI]);
    newPls[HI] = up;
    let fd = newDiscard;
    if (done) { freed.forEach(ing => fd = [...fd, { type: 'ingredient', ingredient: ingKey(ing), language: getRandomGameLanguage(), id: uid() }]); addLog(HI, 'Â¡completÃ³ una hamburguesa! ðŸŽ‰', newPls); }
    if (advanceTutorialAfter('actionCard')) {
      setPlayers(newPls);
      setDiscard(fd);
      return;
    }
    endTurn(newPls, deck, fd, HI);
  }

  function resolveHatReplace(hatLang) {
    if (tutorialActive) return;
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
    syncPlayerHatState(newPls[victimIdx]);
    setTimeout(() => finishPendingStealIfReady(newPls, newDiscard, fromIdx ?? HI, deck), 0);
  }

  function resolveHatExchange(myHat, theirHat) {
    if (tutorialActive) return;
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
    syncPlayerHatState(newPls[HI]);
    syncPlayerHatState(newPls[targetIdx]);
    endTurn(newPls, dk || deck, newDiscard || discard, HI);
  }

  function resolveHatSteal(hatLang) {
    if (tutorialActive) return;
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
    syncPlayerHatState(newPls[HI]);
    syncPlayerHatState(newPls[targetIdx]);
    actionEffectObserver.publishHatStealEvent({
      actingIdx: HI,
      targetIdx,
      hatLang: stolen,
      actorName: players[HI]?.name || 'Jugador',
    });
    addLog(HI, `robó el sombrero ${stolen}`, newPls);
    if ((newPls[HI].mainHats?.length || 0) > MAX_MAIN_HATS) {
      setPlayers(newPls);
      setDiscard(newDiscard || discard);
      setPendingHatLimitSelection({ playerIdx: HI, source: 'steal', actingIdx: HI, discard: newDiscard || discard });
    }
    if (newPls[targetIdx].mainHats.length === 0 && newPls[targetIdx].perchero.length > 0) {
      if (newPls[targetIdx].isAI) {
        const nh = newPls[targetIdx].perchero.shift();
        newPls[targetIdx].mainHats.push(nh);
        syncPlayerHatState(newPls[targetIdx]);
        if ((newPls[HI].mainHats?.length || 0) > MAX_MAIN_HATS) return;
        finishPendingStealIfReady(newPls, newDiscard || discard, HI, dk || deck);
      } else if (newPls[targetIdx].isRemote) {
        setModal({ type: 'pickHatReplace', newPls, newDiscard, victimIdx: targetIdx, fromIdx: HI });
        setPlayers(newPls); setDiscard(newDiscard);
      } else {
        setModal({ type: 'pickHatReplace', newPls, newDiscard, victimIdx: targetIdx });
      }
      return;
    }
    if ((newPls[HI].mainHats?.length || 0) > MAX_MAIN_HATS) return;
    endTurn(newPls, dk || deck, newDiscard || discard, HI);
  }

  // Manual: swap main hat from perchero (costs half your hand â€” player chooses which cards)
  function resolveManualCambiar(hatLang, cardIndices, replaceIdx = 0) {
    if (!tutorialAllowsChangeHat) return;
    if (players[HI]?.closetCovered) return;
    setModal(null); setSelectedIdx(null);
    if (isOnline && !isHost) {
      socket.emit('playerAction', { code: roomCode, action: { type: 'manualCambiar', hatLang, cardIndices, replaceIdx } });
      return;
    }
    const newPls = clone(players);
    const p = newPls[HI];
    const hi = p.perchero.indexOf(hatLang);
    p.perchero.splice(hi, 1);
    const safeReplaceIdx = Number.isInteger(replaceIdx) && replaceIdx >= 0 && replaceIdx < p.mainHats.length ? replaceIdx : 0;
    const oldMain = p.mainHats[safeReplaceIdx];
    p.mainHats[safeReplaceIdx] = hatLang;
    p.perchero.push(oldMain);
    syncPlayerHatState(p);
    const sorted = [...cardIndices].sort((a, b) => b - a);
    const discarded = sorted.map(i => p.hand.splice(i, 1)[0]);
    let newDiscard = [...discard, ...discarded];
    const cost = discarded.length;
    addLog(HI, `cambiÃ³ sombrero a ${hatLang} (descartÃ³ ${cost} carta${cost !== 1 ? 's' : ''}) â€” puede jugar un ingrediente`, newPls);
    setPlayers(newPls); setDiscard(newDiscard); setExtraPlay(true);
    if (tutorialActive) {
      setTutorialCarryOver(prev => ({
        ...prev,
        mainHats: [...p.mainHats],
        perchero: [...p.perchero],
        hand: p.hand.map((nextCard) => ({ ...nextCard })),
      }));
    }
    if (advanceTutorialAfter('changeHat')) return;
    setPhase('transition');
  }

  // Manual: add an extra hat from perchero (costs discarding entire hand, reduces maxHand)
  function resolveManualAgregar(hatLang) {
    if (!tutorialAllowsAddHat) return;
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
    syncPlayerHatState(p);
    let newDiscard = [...discard, ...p.hand];
    p.hand = [];
    const { drawn, deck: newDeck, discard: di2 } = drawN(deck, newDiscard, p.maxHand);
    p.hand = drawn;
    addLog(HI, `agregÃ³ sombrero ${hatLang} â€” mano mÃ¡x reducida a ${p.maxHand}`, newPls);
    setPlayers(newPls); setDeck(newDeck); setDiscard(di2);
    if (p.mainHats.length > MAX_MAIN_HATS) setPendingHatLimitSelection({ playerIdx: HI, source: 'manualAgregar' });
    else setExtraPlay(true);
    if (tutorialActive) {
      setTutorialCarryOver(prev => ({
        ...prev,
        mainHats: [...p.mainHats],
        perchero: [...p.perchero],
        maxHand: p.maxHand,
        hand: p.hand.map((nextCard) => ({ ...nextCard })),
      }));
    }
    if (advanceTutorialAfter('addHat')) return;
    if (p.mainHats.length <= MAX_MAIN_HATS) setPhase('transition');
  }

  function resolveOverflowHatReturn(hatLang) {
    const pending = pendingHatLimitSelectionRef.current;
    if (!pending) return;
    if (isOnline && !isHost) {
      socket.emit('playerAction', { code: roomCode, action: { type: 'returnOverflowHat', hatLang } });
      setPendingHatLimitSelection(null);
      return;
    }
    const nextPlayers = clone(players);
    const player = nextPlayers[pending.playerIdx];
    const hatIdx = player?.mainHats?.indexOf(hatLang);
    if (hatIdx === -1) return;
    const [returnedHat] = player.mainHats.splice(hatIdx, 1);
    player.perchero.push(returnedHat);
    syncPlayerHatState(player);
    setPlayers(nextPlayers);
    setPendingHatLimitSelection(null);
    if (pending.source === 'manualAgregar') {
      setExtraPlay(true);
      if (pending.playerIdx === HI) setPhase('transition');
      return;
    }
    setTimeout(() => finishPendingStealIfReady(nextPlayers, pending.discard || discard, pending.actingIdx ?? HI, deck), 0);
  }

  function resolveBasurero(cardId) {
    if (tutorialActive && !tutorialPractice && tutorialStep !== 8) return;
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
      if (tutorialActive) {
        setTutorialCarryOver(prev => ({
          ...prev,
          basureroCard: found,
        }));
      }
    }
    if (advanceTutorialAfter('actionCard')) {
      setPlayers(newPls);
      setDiscard(newDiscard);
      return;
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
            const latestUser = getSavedUser();
            if (latestUser) setUser(latestUser);
            refreshCurrentUserProfile();
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
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              padding: 12,
              borderRadius: 16,
              border: '1px solid rgba(255,215,0,0.18)',
              background: 'rgba(255,255,255,0.04)',
            }}>
              <div style={{ color: '#f8f4cf', fontSize: 13, fontWeight: 900, letterSpacing: 0.3 }}>
                {T('gameLanguageMenu')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
                {(() => {
                  const selectedGameLang = KEY_TO_LANG[uiLang] || LANGUAGES[0];
                  return (
                    <button
                      type="button"
                      ref={languageMenuButtonRef}
                      onClick={() => setShowLanguageMenu(prev => !prev)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 14,
                        border: '2px solid #FFD700',
                        background: 'rgba(255,215,0,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        cursor: 'pointer',
                        width: '100%',
                      }}
                    >
                      <div style={{
                        width: 42,
                        height: 42,
                        borderRadius: 14,
                        border: '2px solid #FFD700',
                        background: LANG_BG[selectedGameLang],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 16px rgba(255,215,0,0.18)',
                        flexShrink: 0,
                      }}>
                        <HatSVG lang={selectedGameLang} size={28} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3, minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#f8f4cf', lineHeight: 1.05 }}>
                          {getLocalizedLangName(selectedGameLang, uiLang)}
                        </span>
                      </div>
                      <span style={{ color: '#FFD700', fontSize: 18, fontWeight: 900, lineHeight: 1 }}>
                        {showLanguageMenu ? '−' : '+'}
                      </span>
                    </button>
                  );
                })()}
                <div style={{
                  position: 'absolute',
                  left: isMobile ? 'calc(-190px - 10px)' : 0,
                  right: 'auto',
                  top: isMobile ? 0 : 'calc(100% + 8px)',
                  zIndex: 40,
                  opacity: showLanguageMenu ? 1 : 0,
                  transform: showLanguageMenu
                    ? 'translate(0, 0)'
                    : (isMobile ? 'translateX(8px)' : 'translateY(-6px)'),
                  visibility: showLanguageMenu ? 'visible' : 'hidden',
                  overflow: isMobile ? 'hidden' : 'visible',
                  transition: 'opacity 0.18s ease, transform 0.2s ease, visibility 0.18s ease',
                  pointerEvents: showLanguageMenu ? 'auto' : 'none',
                }}>
                <div
                    ref={languageMenuTrayRef}
                    style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    overflowX: 'visible',
                    overflowY: isMobile ? 'visible' : 'auto',
                    maxHeight: isMobile ? 'none' : 'min(320px, calc(100vh - 180px))',
                    overscrollBehavior: isMobile ? 'auto' : 'contain',
                    padding: 10,
                    width: 190,
                    borderRadius: 14,
                    border: '1px solid rgba(255,215,0,0.22)',
                    background: 'rgba(18, 26, 48, 0.96)',
                    boxShadow: '0 18px 34px rgba(0,0,0,0.35)',
                  }}>
                    {Object.entries(KEY_TO_LANG).map(([langKey, gameLang]) => {
                      const active = uiLang === langKey;
                      return (
                        <button
                          key={langKey}
                          type="button"
                          onClick={() => {
                            handleSetLang(langKey);
                            setShowLanguageMenu(false);
                          }}
                          style={{
                            padding: '9px 8px 8px',
                            borderRadius: 12,
                            border: active ? '2px solid #ffd700' : `1px solid ${LANG_BORDER[gameLang]}55`,
                            background: active ? 'rgba(255,215,0,0.12)' : 'rgba(12,18,32,0.72)',
                            cursor: 'pointer',
                            transition: 'all 0.18s ease',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            gap: 10,
                            minWidth: '100%',
                            flexShrink: 0,
                            textAlign: 'left',
                          }}
                        >
                          <div style={{
                            width: 34,
                            height: 34,
                            borderRadius: 13,
                            border: active ? '2px solid #FFD700' : `1px solid ${LANG_BORDER[gameLang]}66`,
                            background: active ? 'rgba(255,215,0,0.12)' : LANG_BG[gameLang],
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: active ? '0 0 18px rgba(255,215,0,0.18)' : 'none',
                          }}>
                            <HatSVG lang={gameLang} size={21} />
                          </div>
                          <span style={{
                            fontSize: 12,
                            fontWeight: 800,
                            color: active ? '#f8f4cf' : '#d7def8',
                            lineHeight: 1.05,
                          }}>
                            {getLocalizedLangName(gameLang, uiLang)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
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
          profilePreview={profilePreview}
          profileReturnPhase={profileReturnPhase}
          historyInitialFilter={historyInitialFilter}
          historyReturnPhase={historyReturnPhase}
          openProfile={openProfile}
          onProfileBack={handleProfileBack}
          openHistory={openHistory}
          inviteToast={inviteToast}
          friendReqToast={friendReqToast}
          setUser={setUser}
          handleAuthSuccess={handleAuthSuccess}
          setPhase={setPhase}
          startGame={startGame}
          startTutorialGame={startTutorialGame}
          socket={socket}
          setInviteJoinCode={setInviteJoinCode}
          inviteJoinCode={inviteJoinCode}
          onlineMenuTab={onlineMenuTab}
          initialSalaCode={initialSalaCode}
          setIsOnline={setIsOnline}
          setIsHost={setIsHost}
          setMyPlayerIdx={setMyPlayerIdx}
          setMyRoomPlayerName={setMyRoomPlayerName}
          setRoomCode={setRoomCode}
          setRoomIsPublic={setRoomIsPublic}
          setRoomDisplayName={setRoomDisplayName}
          setLobbyPlayers={setLobbyPlayers}
          saveRoomSession={saveRoomSession}
          lobbyPlayers={lobbyPlayers}
          myPlayerIdx={myPlayerIdx}
          myRoomPlayerName={myRoomPlayerName}
          isHost={isHost}
          roomIsPublic={roomIsPublic}
          roomDisplayName={roomDisplayName}
          startOnlineGame={startOnlineGame}
          clearRoomSession={clearRoomSession}
          players={players}
          HI={HI}
          cp={cp}
          extraPlay={extraPlay}
          winner={winner}
          isOnline={isOnline}
          onLeftRoomReturn={handleLeftRoomReturn}
          onLeftRoomLeave={handleLeftRoomLeave}
          isTutorial={tutorialPractice || postTutorialGame}
          tutorialWinText={tutorialCopy.tutorialWin}
          onTutorialFinish={finishTutorialGame}
        />
        {phase === 'setup' && tutorialPrompt === 'familiarity' && (
          <Modal title={tutorialCopy.promptTitle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ color: '#ddd', fontSize: 14, lineHeight: 1.45 }}>
                {tutorialCopy.promptDesc}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Btn
                  onClick={() => {
                    markTutorialPromptSeen(user?.id);
                    setTutorialPrompt(null);
                  }}
                  color="#4CAF50"
                  style={{ color: '#08140a' }}
                >
                  {tutorialCopy.promptYes}
                </Btn>
                <Btn
                  onClick={() => setTutorialPrompt('offer')}
                  color="#FFD700"
                  style={{ color: '#111' }}
                >
                  {tutorialCopy.promptNo}
                </Btn>
              </div>
            </div>
          </Modal>
        )}
        {phase === 'setup' && tutorialPrompt === 'offer' && (
          <Modal title={tutorialCopy.offerTitle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ color: '#ddd', fontSize: 14, lineHeight: 1.45 }}>
                {tutorialCopy.offerDesc}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Btn
                  onClick={() => {
                    markTutorialPromptSeen(user?.id);
                    startTutorialGame();
                  }}
                  color="#FFD700"
                  style={{ color: '#111' }}
                >
                  {tutorialCopy.offerYes}
                </Btn>
                <Btn
                  onClick={() => {
                    markTutorialPromptSeen(user?.id);
                    setTutorialPrompt(null);
                  }}
                  color="#2a2a4a"
                  style={{ color: '#fff' }}
                >
                  {tutorialCopy.offerNo}
                </Btn>
              </div>
            </div>
          </Modal>
        )}
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
            onRegisterMainHatRef={(playerIdx, hatLang, hatIdx, el) => {
              if (!playerMainHatRefs.current[playerIdx]) playerMainHatRefs.current[playerIdx] = {};
              const key = `${hatLang}-${hatIdx}`;
              if (el) playerMainHatRefs.current[playerIdx][key] = el;
              else if (playerMainHatRefs.current[playerIdx]) delete playerMainHatRefs.current[playerIdx][key];
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
      boxShadow: 'none',
    }}>
      <UserAvatar
        name={human.name}
        username={human.username}
        avatarUrl={human.avatarUrl}
        size={42}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 900, fontSize: 16, color: humanColor }}>{human.name}</div>
        {extraPlay && (
          <div style={{ fontSize: 11, color: '#FFD700', marginTop: 2 }}>
            {T('extraPlayLabel')}
          </div>
        )}
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

  const highlightedBurgerIngredients = (() => {
    const selectedCard = human?.hand?.[selectedIdx];
    const targetBurger = human?.burgers?.[human?.currentBurger] || [];
    if (!selectedCard || selectedCard.type !== 'ingredient' || !targetBurger.length) return [];

    if (selectedCard.ingredient === 'perrito') {
      const needed = [...targetBurger];
      (human.table || []).forEach((item) => {
        const ingredient = item === 'perrito' ? needed[0] : (ingChosen(item) || ingKey(item));
        const idx = needed.indexOf(ingredient);
        if (idx !== -1) needed.splice(idx, 1);
      });
      return needed;
    }

    return [selectedCard.ingredient];
  })();

  const burgersSection = (
    <div style={{
      background: 'rgba(255,255,255,.03)', borderRadius: 10, padding: '8px 10px',
      border: tutorialActive && tutorialFocus.table ? '2px solid #FFD700' : '2px solid #1e2a45',
      boxShadow: tutorialActive && tutorialFocus.table ? '0 0 0 3px rgba(255,215,0,0.14)' : 'none',
      backdropFilter: 'none',
      filter: 'none',
      flexShrink: 0,
    }} ref={humanBurgerAreaRef}>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#555', letterSpacing: 1, marginBottom: 6 }}>{T('table')}</div>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
        padding: '6px 10px',
        borderRadius: 999,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: '#ddd',
        fontSize: 12,
        fontWeight: 700,
      }}>
        <span style={{ color: '#FFD700' }}>✔</span>
        <span>Hamburguesas completadas: {human.currentBurger}/{human.totalBurgers}</span>
      </div>
      {human.currentBurger < human.totalBurgers && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#FFD700', width: 14, fontWeight: 700 }}>
            {'\u25B6'}
          </span>
          <BurgerTarget
            ingredients={human.burgers[human.currentBurger]}
            table={human.table}
            isCurrent
            highlightIngredients={highlightedBurgerIngredients}
            onRegisterSlotRef={(slotIdx, el) => {
              if (el) humanBurgerSlotRefs.current[slotIdx] = el;
              else delete humanBurgerSlotRefs.current[slotIdx];
            }}
            onIngredientClick={(ing) => setModal({ type: 'ingredientInfo', ingredient: ing })}
          />
        </div>
      )}
      {human.currentBurger >= human.totalBurgers && (
        <div style={{ fontSize: 12, color: '#7be495', fontWeight: 700 }}>
          Todas las hamburguesas completadas
        </div>
      )}
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
      <div style={{
        borderRadius: 12,
        padding: tutorialActive && tutorialFocus.closet ? 6 : 0,
        border: tutorialActive && tutorialFocus.closet ? '2px solid #FFD700' : '2px solid transparent',
        boxShadow: tutorialActive && tutorialFocus.closet ? '0 0 0 3px rgba(255,215,0,0.14)' : 'none',
        background: tutorialActive && tutorialFocus.closet ? 'rgba(255,215,0,0.05)' : 'transparent',
      }}>
        <div style={{ fontSize: 9, color: '#555', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>{T('closet')}</div>
        <div style={{ position: 'relative', width: 165, height: 210 }}>
          <img
            src={percheroImg}
            alt="Perchero"
            style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: human.closetCovered ? 0.32 : 1 }}
          />
          {human.closetCovered && (
            <img
              src={actionPercheroCubierto}
              alt={T('closetCoveredStatus') || 'Perchero cubierto'}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'center 54%',
                opacity: 0.98,
                pointerEvents: 'none',
              }}
            />
          )}
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
                  fontSize: h === 'ingles' ? 8 : 7,
                  fontWeight: 900,
                  color: h === 'ingles' ? '#FFD700' : LANG_TEXT[h],
                  letterSpacing: 0.5,
                  marginTop: -2,
                  textShadow: h === 'ingles' ? '0 1px 2px rgba(0,0,0,0.6)' : 'none',
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

  const shouldShowTutorialClosetButtons = tutorialActive && (tutorialFocus.changeButton || tutorialFocus.addButton);
  const percheroButtons = isHumanTurn && !extraPlay && human.perchero.length > 0 && !human.closetCovered && (!tutorialActive || shouldShowTutorialClosetButtons) && (
    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
      <button
        onClick={() => {
          if (!tutorialAllowsChangeHat) return;
          setShowPercheroModal(false); setModal({ type: 'manual_cambiar' });
        }}
        title={T('changeHatTooltip')}
        style={{
          padding: '7px 12px', borderRadius: 8, border: tutorialActive && tutorialFocus.changeButton ? '2px solid #FFD700' : '1px solid rgba(156,39,176,0.3)',
          background: 'rgba(156,39,176,0.12)', color: '#BA68C8', fontSize: 13,
          fontWeight: 700, cursor: tutorialAllowsChangeHat ? 'pointer' : 'default', fontFamily: 'inherit',
          opacity: tutorialAllowsChangeHat ? 1 : 0.92,
          boxShadow: tutorialActive && tutorialFocus.changeButton ? '0 0 0 3px rgba(255,215,0,0.14)' : 'none',
        }}
      >
        {T('changeHat')}
      </button>
      {human.hand.length > 0 && (
        <button
          onClick={() => {
            if (!tutorialAllowsAddHat) return;
            setShowPercheroModal(false); setModal({ type: 'manual_agregar' });
          }}
          title={T('addHatTooltip')}
          style={{
            padding: '7px 12px', borderRadius: 8, border: tutorialActive && tutorialFocus.addButton ? '2px solid #FFD700' : '1px solid rgba(156,39,176,0.3)',
            background: 'rgba(156,39,176,0.12)', color: '#BA68C8', fontSize: 13,
            fontWeight: 700, cursor: tutorialAllowsAddHat ? 'pointer' : 'default', fontFamily: 'inherit',
            opacity: tutorialAllowsAddHat ? 1 : 0.92,
            boxShadow: tutorialActive && tutorialFocus.addButton ? '0 0 0 3px rgba(255,215,0,0.14)' : 'none',
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
      border: '2px solid #1e2a45',
      boxShadow: 'none',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        {/* Sombrero(s) principal(es) */}
        <div>
          <div style={{ fontSize: 9, color: '#555', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>
            {T('mainHat')} ({human.mainHats.length}/{MAX_MAIN_HATS})
          </div>
          <div style={isMobile
            ? { display: 'flex', gap: 4, flexWrap: 'wrap' }
            : { display: 'grid', gridTemplateRows: 'repeat(2, auto)', gridAutoFlow: 'column', gap: 4 }
          }>
            {human.mainHats.map((h, hatIdx) => (
              <div
                key={`${h}-${hatIdx}`}
                ref={(el) => {
                  const key = `${h}-${hatIdx}`;
                  if (el) humanMainHatRefs.current[key] = el;
                  else delete humanMainHatRefs.current[key];
                }}
                style={{
                  display: 'inline-flex',
                  borderRadius: 12,
                  padding: tutorialActive && tutorialFocus.mainHat ? 2 : 0,
                  border: tutorialActive && tutorialFocus.mainHat ? '2px solid #FFD700' : '2px solid transparent',
                  boxShadow: tutorialActive && tutorialFocus.mainHat ? '0 0 0 3px rgba(255,215,0,0.14)' : 'none',
                  background: tutorialActive && tutorialFocus.mainHat ? 'rgba(255,215,0,0.06)' : 'transparent',
                }}
              >
                <HatBadge lang={h} isMain size="lg" />
              </div>
            ))}
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
          const actionHasObjectives = card.type === 'action'
            ? hasActionObjectives(card.action, players, HI, discard)
            : true;
          const playable = card.type === 'ingredient'
            ? canPlayCard(human, card)
            : (extraPlay ? false : (isClosetActionBlocked(human, card.action) ? false : (actionHasObjectives ? null : false)));
          const noObjectives = card.type === 'action' && !extraPlay && !isClosetActionBlocked(human, card.action) && !actionHasObjectives;
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
                if (!isHumanTurn || !tutorialAllowsCardSelection) return;
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
                      : (() => {
                          const reason = getIngredientCantPlayReason(human, card);
                          return (
                            <span style={{ color: '#FF7043', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                              {reason.hatLang && <HatSVG lang={reason.hatLang} size={18} />}
                              <span>{reason.text}</span>
                            </span>
                          );
                        })()}
                  </>) : (<>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#FFD700' }}>{getActionText(card.action)?.name}</span>
                    <span style={{ fontSize: 12, color: noObjectives ? '#FF7043' : '#ccc' }}>{noObjectives ? T('actionNoObjectives') : getActionText(card.action)?.desc}</span>
                  </>)}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Btn onClick={humanPlay} disabled={!tutorialAllowsPlayButton || (extraPlay && card.type !== 'ingredient') || (card.type === 'action' && isClosetActionBlocked(human, card.action)) || noObjectives} color="#4CAF50" style={{ fontSize: 11, padding: '6px 12px' }}>
                    {T('play')}
                  </Btn>
                  <Btn onClick={humanDiscard} disabled={(!tutorialAllowsDiscard && tutorialActive) || extraPlay} color="#FF7043" style={{ fontSize: 11, padding: '6px 12px' }}>
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
              noObjectives={isHumanTurn && noObjectives}
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
      {tutorialActive && tutorialFocus.ingredientLabel && human.hand[selectedIdx]?.type === 'ingredient' && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 8px',
          borderRadius: 999,
          background: 'rgba(255,215,0,0.12)',
          border: '1px solid rgba(255,215,0,0.3)',
          color: '#FFD700',
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          marginBottom: 6,
        }}>
          <span>{tutorialCopy.ingredientTag || T('ingredientTag')}</span>
        </div>
      )}
      {human.hand[selectedIdx]?.type === 'ingredient' ? (
        canPlayCard(human, human.hand[selectedIdx])
          ? <span style={{ color: '#4CAF50' }}>{T('canPlayThis')}</span>
          : (() => {
              const reason = getIngredientCantPlayReason(human, human.hand[selectedIdx]);
              return (
                <span style={{ color: '#FF7043', display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {reason.hatLang && <HatSVG lang={reason.hatLang} size={18} />}
                  <span>{reason.text}</span>
                </span>
              );
            })()
      ) : (
        human.hand[selectedIdx]?.type === 'action' && !hasActionObjectives(human.hand[selectedIdx]?.action, players, HI, discard)
          ? <span style={{ color: '#FF7043' }}>{T('actionNoObjectives')}</span>
          : <span style={{ color: '#FFD700' }}>{'\u26A1'} {getActionText(human.hand[selectedIdx]?.action)?.desc}</span>
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
        playerActionCommands.passTurn({
          players,
          deck,
          discard,
          hi: HI,
          setExtraPlay,
        });
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

      {tutorialActive && tutorialStepData && (
        <div style={tutorialPopupStyle}>
          <div style={{
            borderRadius: 18,
            padding: isMobile ? '14px 14px 12px' : '16px 16px 14px',
            background: 'linear-gradient(180deg, rgba(22,33,62,0.98), rgba(15,17,23,0.98))',
            border: '2px solid rgba(255,215,0,0.28)',
            boxShadow: '0 16px 38px rgba(0,0,0,0.42)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 10px',
                borderRadius: 999,
                background: 'rgba(255,215,0,0.12)',
                color: '#FFD700',
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 0.4,
                textTransform: 'uppercase',
              }}>
                <span>🎓</span>
                <span>{tutorialCopy.badge}</span>
              </div>
              {!tutorialPractice && (
                <div style={{ color: '#9ea4be', fontSize: 11, fontWeight: 700 }}>
                  {tutorialCopy.stepLabel} {tutorialState.step + 1}/{tutorialSteps.length}
                </div>
              )}
            </div>
            <div style={{ color: '#fff1b3', fontSize: 18, fontWeight: 900, lineHeight: 1.1, marginBottom: 8 }}>
              {tutorialStepData.title}
            </div>
            <div style={{ color: '#d6d8e5', fontSize: 13, lineHeight: 1.45, marginBottom: 10 }}>
              {tutorialStepData.body}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              {(tutorialStepData.bullets || []).map((bullet, idx) => (
                <div key={`tutorial-bullet-${idx}`} style={{ color: '#9ea4be', fontSize: 12, lineHeight: 1.4 }}>
                  • {bullet}
                </div>
              ))}
              {tutorialHatHintText ? (
                <div style={{
                  marginTop: 2,
                  padding: '8px 10px',
                  borderRadius: 12,
                  border: tutorialRecommendedHatLang ? `1px solid ${LANG_BORDER[tutorialRecommendedHatLang]}88` : '1px solid rgba(255,215,0,0.25)',
                  background: 'rgba(255,215,0,0.08)',
                  color: '#fff3bf',
                  fontSize: 12,
                  fontWeight: 800,
                  lineHeight: 1.4,
                }}>
                  {tutorialHatHintText}
                </div>
              ) : null}
              {tutorialNegationOutcomeText ? (
                <div style={{
                  marginTop: 2,
                  padding: '8px 10px',
                  borderRadius: 12,
                  border: '1px solid rgba(255,120,120,0.4)',
                  background: 'rgba(255,80,80,0.08)',
                  color: '#ffd1d1',
                  fontSize: 12,
                  fontWeight: 800,
                  lineHeight: 1.4,
                }}>
                  {tutorialNegationOutcomeText}
                </div>
              ) : null}
            </div>
            {tutorialPractice ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Btn onClick={finishTutorialGame} color="#2a2a4a" style={{ color: '#fff' }}>
                  {tutorialCopy.skip}
                </Btn>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Btn onClick={finishTutorialGame} color="#2a2a4a" style={{ color: '#fff' }}>
                  {tutorialCopy.skip}
                </Btn>
                {tutorialState.step > 0 && (
                  <Btn onClick={prevTutorialStep} color="#4ecdc4" style={{ color: '#0f1117' }}>
                    {tutorialCopy.prev}
                  </Btn>
                )}
                <Btn
                  onClick={tutorialState.step === tutorialSteps.length - 1 ? nextTutorialStep : nextTutorialStep}
                  color="#FFD700"
                  style={{ color: '#111' }}
                >
                  {tutorialCopy.next}
                </Btn>
              </div>
            )}
          </div>
        </div>
      )}

      {leaveNotice && phase === 'playing' && (
        <div style={{
          position: 'fixed',
          top: isMobile ? 72 : 88,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9800,
          pointerEvents: 'none',
        }}>
          <div style={{
            minWidth: isMobile ? 260 : 340,
            maxWidth: '80vw',
            padding: isMobile ? '12px 16px' : '14px 18px',
            borderRadius: 16,
            border: '2px solid rgba(255,106,106,.45)',
            background: 'linear-gradient(180deg, rgba(80,18,18,.96), rgba(28,10,10,.96))',
            boxShadow: '0 18px 40px rgba(0,0,0,.38), 0 0 26px rgba(255,94,94,.16)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            animation: 'pulse 0.4s ease-out 1',
          }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: 'rgba(255,255,255,.08)',
              display: 'grid',
              placeItems: 'center',
              fontSize: 22,
              flexShrink: 0,
            }}>🚪</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: '#FFD700', fontSize: isMobile ? 15 : 16, fontWeight: 900, lineHeight: 1.05 }}>
                {leaveNotice.playerName} abandonó la partida
              </div>
              <div style={{ color: '#ffd8d8', fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                Se actualizó la mesa online.
              </div>
            </div>
          </div>
        </div>
      )}

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

      <GameAnimations
        forkAnim={forkAnim}
        comeComodinesAnim={comeComodinesAnim}
        glotonAnim={glotonAnim}
        milanesaAnim={milanesaAnim}
        pizzaAnim={pizzaAnim}
        parrillaAnim={parrillaAnim}
        closetCoverAnim={closetCoverAnim}
        hatStealAnim={hatStealAnim}
        ensaladaAnim={ensaladaAnim}
        isMobile={isMobile}
      />

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

      {pendingHatLimitSelection?.playerIdx === HI && (
        <Modal title="🎩 Máximo de sombreros alcanzado">
          <p style={{ color: '#ddd', fontSize: 13, marginBottom: 8 }}>
            Has alcanzado el máximo de sombreros ({human.mainHats.length}/{MAX_MAIN_HATS}).
          </p>
          <p style={{ color: '#8a8fa8', fontSize: 12, marginBottom: 12 }}>
            Tienes que escoger uno de tus sombreros y devolverlo al perchero.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {human.mainHats.map((h, idx) => (
              <button
                key={`${h}-${idx}`}
                type="button"
                onClick={() => resolveOverflowHatReturn(h)}
                style={{
                  padding: 10,
                  borderRadius: 10,
                  cursor: 'pointer',
                  border: `2px solid ${LANG_BORDER[h]}88`,
                  background: 'rgba(255,255,255,.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  fontFamily: 'inherit',
                }}
              >
                <HatSVG lang={h} size={36} />
                <span style={{ fontSize: 11, fontWeight: 700, color: LANG_TEXT[h] }}>
                  {T(h)}
                </span>
              </button>
            ))}
          </div>
        </Modal>
      )}

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
          const currentTargetBurger = human?.burgers?.[human?.currentBurger] || [];
          const actionHasObjectivesMobile = card.type === 'action'
            ? hasActionObjectives(card.action, players, HI, discard)
            : true;
          const playable = card.type === 'ingredient'
            ? canPlayCard(human, card)
          : (extraPlay ? false : (isClosetActionBlocked(human, card.action) ? false : (actionHasObjectivesMobile ? null : false)));
        const noObjectivesMobile = card.type === 'action' && !extraPlay && !isClosetActionBlocked(human, card.action) && !actionHasObjectivesMobile;
          const cleanTitle = (txt) => String(txt).replace('?? ', '').replace('??', '').replace('? ', '').replace('?', '');
          const actionAffectedIngredients = card.type === 'action'
            ? Object.keys(ING_AFFECTED_BY).filter(ing => ING_AFFECTED_BY[ing].includes(card.action))
            : [];
          const actionPlayableIngredients = actionAffectedIngredients.filter(ing =>
            players.some((p, idx) => idx !== HI && (p.table || []).some(tableIng => ingKey(tableIng) === ing || ingChosen(tableIng) === ing))
          );
          const actionIngredientSectionTitle = ({
            es: 'Ingredientes afectados',
            en: 'Affected ingredients',
            fr: 'Ingrédients affectés',
            it: 'Ingredienti colpiti',
            de: 'Betroffene Zutaten',
            pt: 'Ingredientes afetados',
          })[uiLang] || 'Affected ingredients';
          const targetSlotStateMobile = (() => {
            const normal = {};
            const wildcardChosen = {};
            let wildcardBare = 0;
            (human?.table || []).forEach((t) => {
              if (t === 'perrito') {
                wildcardBare += 1;
              } else if (typeof t === 'string' && t.startsWith('perrito|')) {
                const chosen = t.split('|')[1];
                wildcardChosen[chosen] = (wildcardChosen[chosen] || 0) + 1;
              } else {
                const key = ingKey(t);
                normal[key] = (normal[key] || 0) + 1;
              }
            });
            return currentTargetBurger.map((ing) => {
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
          })();
          const selectedIngredientKey = card.type === 'ingredient'
            ? (card.ingredient === 'perrito' ? null : (ingChosen(card.ingredient) || card.ingredient))
            : null;
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
                <GameCard card={card} selected playable={playable} large noObjectives={noObjectivesMobile} />
                {card.type === 'ingredient' && currentTargetBurger.length > 0 && (
                  <div style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <div style={{
                      fontSize: 11,
                      fontWeight: 900,
                      letterSpacing: 0.4,
                      color: '#FFD700',
                      marginBottom: 8,
                      textTransform: 'uppercase',
                      textAlign: 'center',
                    }}>
                      {T('sharedGoals')}
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 6,
                      flexWrap: 'wrap',
                    }}>
                      {currentTargetBurger.map((ing, idx) => {
                        const slot = targetSlotStateMobile[idx] || { filled: false, viaWildcard: false };
                        const shouldHighlight = !slot.filled && (
                          card.ingredient === 'perrito'
                            ? true
                            : selectedIngredientKey === ing
                        );
                        return (
                          <div
                            key={`mobile-target-${idx}-${ing}`}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 8,
                              background: slot.filled ? `${ING_BG[ing]}22` : 'rgba(255,255,255,0.06)',
                              border: shouldHighlight
                                ? '2px solid #FFD700'
                                : slot.filled
                                  ? `1px solid ${ING_BG[ing]}66`
                                  : `2px dashed ${ING_BG[ing]}44`,
                              opacity: slot.filled ? 1 : 0.55,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative',
                              boxShadow: shouldHighlight ? '0 0 0 3px rgba(255,215,0,0.14), 0 0 14px rgba(255,215,0,0.28)' : 'none',
                              transform: shouldHighlight ? 'translateY(-1px) scale(1.04)' : 'none',
                              transition: 'all 0.2s',
                            }}
                          >
                            {ING_IMG[ing]
                              ? <img src={ING_IMG[ing]} alt={ing} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                              : <span style={{ fontSize: 22 }}>{ING_EMOJI[ing]}</span>}
                            {slot.viaWildcard && (
                              <div style={{
                                position: 'absolute',
                                left: -3,
                                bottom: -4,
                                background: 'rgba(10,16,30,0.9)',
                                color: '#fff',
                                border: '1px solid rgba(255,255,255,0.35)',
                                borderRadius: 8,
                                padding: '0 3px',
                                lineHeight: '12px',
                                fontSize: 9,
                              }}>
                                {ING_EMOJI.perrito}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {card.type === 'action' && !noObjectivesMobile && actionPlayableIngredients.length > 0 && (
                  <div style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <div style={{
                      fontSize: 11,
                      fontWeight: 900,
                      letterSpacing: 0.4,
                      color: '#FFD700',
                      marginBottom: 8,
                      textTransform: 'uppercase',
                      textAlign: 'center',
                    }}>
                      {actionIngredientSectionTitle}
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}>
                      {actionPlayableIngredients.map(ing => (
                        <div
                          key={`${card.id}-${ing}`}
                          style={{
                            minWidth: 56,
                            padding: '6px 8px',
                            borderRadius: 10,
                            background: `${ING_BG[ing]}22`,
                            border: `1px solid ${ING_BG[ing]}66`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          {ING_IMG[ing]
                            ? <img src={ING_IMG[ing]} alt={ing} style={{ width: 28, height: 28, objectFit: 'contain' }} />
                            : <span style={{ fontSize: 24 }}>{ING_EMOJI[ing]}</span>}
                          <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>
                            {getIngName(ing, uiGameLang)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {card.type === 'ingredient' && !canPlayCard(human, card) && (
                  <div style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: 'rgba(0,0,0,0.45)',
                    color: '#FF7043',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    flexWrap: 'wrap',
                    fontSize: 13,
                    textAlign: 'center',
                  }}>
                    {(() => {
                      const reason = getIngredientCantPlayReason(human, card);
                      return (
                        <>
                          {reason.hatLang && <HatSVG lang={reason.hatLang} size={20} />}
                          <span>{reason.text}</span>
                        </>
                      );
                    })()}
                  </div>
                )}
                {card.type === 'ingredient' && card.ingredient === 'perrito' && (
                  <div style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: 'rgba(0,0,0,0.45)',
                    color: '#ddd',
                    fontSize: 13,
                    textAlign: 'center',
                  }}>
                    {T('wildcardChoose')}
                  </div>
                )}
                {card.type === 'action' && noObjectivesMobile && (
                  <div style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: 'rgba(0,0,0,0.45)',
                    color: '#FF7043',
                    fontSize: 13,
                    textAlign: 'center',
                  }}>
                    {T('actionNoObjectives')}
                  </div>
                )}
              <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                <Btn onClick={() => { humanPlay(); }} disabled={!tutorialAllowsPlayButton || (extraPlay && card.type !== 'ingredient') || (card.type === 'action' && isClosetActionBlocked(human, card.action)) || noObjectivesMobile} color="#4CAF50" style={{ flex: 1, fontSize: 14, padding: '10px 16px' }}>
                  {T('play')}
                </Btn>
                <Btn onClick={() => { humanDiscard(); }} disabled={(!tutorialAllowsDiscard && tutorialActive) || extraPlay} color="#FF7043" style={{ flex: 1, fontSize: 14, padding: '10px 16px' }}>
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
           {tutorialActive && tutorialStep === 3 && tutorialHatHintText ? (
             <div style={{
               marginBottom: 12,
               padding: '10px 12px',
              borderRadius: 12,
              border: tutorialRecommendedHatLang ? `1px solid ${LANG_BORDER[tutorialRecommendedHatLang]}88` : '1px solid rgba(255,215,0,0.25)',
              background: 'rgba(255,215,0,0.08)',
              color: '#fff3bf',
              fontSize: 12,
              fontWeight: 800,
              lineHeight: 1.35,
            }}>
              {tutorialHatHintText}
            </div>
          ) : null}
          {modal?.warningHatLang ? (
            <div style={{
              marginBottom: 12,
              padding: '10px 12px',
              borderRadius: 12,
              border: `1px solid ${LANG_BORDER[modal.warningHatLang]}88`,
              background: 'rgba(255,107,107,0.12)',
              color: '#ffd8d8',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, lineHeight: 1.35 }}>
                <HatSVG lang={modal.warningHatLang} size={28} />
                <span>No tiene cartas que le sirva para este sombrero</span>
              </div>
              <div>
                <Btn
                  onClick={() => {
                    if ((human.mainHats?.length || 0) > 1) {
                      setModal({ type: 'manual_cambiar_target', hatLang: modal.warningHatLang });
                    } else {
                      setModal({ type: 'manual_cambiar_discard', hatLang: modal.warningHatLang, replaceIdx: 0, selected: [] });
                    }
                  }}
                  color="#FF7043"
                  style={{ fontSize: 12, padding: '8px 12px' }}
                >
                  Cambiar de todas formas
                </Btn>
              </div>
            </div>
          ) : null}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {human.perchero.map(h => (
              <button
                key={h}
                type="button"
                onClick={() => {
                  if (!doesHatOpenUsefulIngredient(human, h)) {
                    setModal({ type: 'manual_cambiar', warningHatLang: h });
                    return;
                  }
                  if ((human.mainHats?.length || 0) > 1) {
                    setModal({ type: 'manual_cambiar_target', hatLang: h });
                  } else {
                    setModal({ type: 'manual_cambiar_discard', hatLang: h, replaceIdx: 0, selected: [] });
                  }
                }}
                style={{
                  padding: 10, borderRadius: 10, cursor: 'pointer',
                  border: `2px solid ${(modal?.warningHatLang === h ? LANG_BORDER[h] : `${LANG_BORDER[h]}88`)}`,
                  background: modal?.warningHatLang === h ? 'rgba(255,107,107,.12)' : 'rgba(255,255,255,.04)', transition: 'all .15s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
                }}
                onMouseOver={e => e.currentTarget.style.background = modal?.warningHatLang === h ? 'rgba(255,107,107,.18)' : 'rgba(255,255,255,.1)'}
                onMouseOut={e => e.currentTarget.style.background = modal?.warningHatLang === h ? 'rgba(255,107,107,.12)' : 'rgba(255,255,255,.04)'}
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

      {modal?.type === 'manual_cambiar_target' && (
        <Modal title={`🎩 ${T('changeHat') || 'Cambiar sombrero'} — paso 2: elegir principal`}>
          <p style={{ color: '#888', fontSize: 12, marginBottom: 12 }}>
            {`Elige qué sombrero principal quieres reemplazar por ${T(modal.hatLang)}.`}
          </p>
           {tutorialActive && tutorialStep === 4 && tutorialHatHintText ? (
              <div style={{
                marginBottom: 12,
                padding: '10px 12px',
              borderRadius: 12,
              border: tutorialRecommendedHatLang ? `1px solid ${LANG_BORDER[tutorialRecommendedHatLang]}88` : '1px solid rgba(255,215,0,0.25)',
              background: 'rgba(255,215,0,0.08)',
              color: '#fff3bf',
              fontSize: 12,
              fontWeight: 800,
              lineHeight: 1.35,
            }}>
              {tutorialHatHintText}
            </div>
          ) : null}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: 12,
            borderRadius: 14,
            border: `1px solid ${LANG_BORDER[modal.hatLang]}66`,
            background: 'rgba(255,255,255,.04)',
            marginBottom: 12,
          }}>
            <div style={{
              width: 62,
              height: 62,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,.05)',
              border: `2px solid ${LANG_BORDER[modal.hatLang]}88`,
              flexShrink: 0,
            }}>
              <HatSVG lang={modal.hatLang} size={40} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: '#fff3bf', fontWeight: 900, fontSize: 14, lineHeight: 1.05 }}>
                {T(modal.hatLang)}
              </div>
              <div style={{ color: '#8a8fa8', fontSize: 11, fontWeight: 700, marginTop: 4 }}>
                {T('chooseHat')}
              </div>
              <div style={{ color: '#cfd8ff', fontSize: 11, marginTop: 4 }}>
                Este es el sombrero nuevo que vas a poner en tu principal.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {human.mainHats.map((hat, idx) => (
              <button
                key={`${hat}-${idx}`}
                type="button"
                onClick={() => setModal({ type: 'manual_cambiar_discard', hatLang: modal.hatLang, replaceIdx: idx, selected: [] })}
                style={{
                  padding: 10,
                  borderRadius: 10,
                  cursor: 'pointer',
                  border: `2px solid ${LANG_BORDER[hat]}88`,
                  background: 'rgba(255,255,255,.04)',
                  transition: 'all .15s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  minWidth: 88,
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,.04)'}
              >
                <HatSVG lang={hat} size={38} />
                <span style={{ fontSize: 11, fontWeight: 800, color: LANG_TEXT[hat], lineHeight: 1 }}>
                  {T(hat)}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#8a8fa8' }}>
                  {T('mainHat')} {idx + 1}
                </span>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={() => setModal({ type: 'manual_cambiar' })} color="#333" style={{ color: '#aaa' }}>{T('goBack')}</Btn>
            <Btn onClick={() => setModal(null)} color="#333" style={{ color: '#aaa', flex: 1 }}>{T('cancel')}</Btn>
          </div>
        </Modal>
      )}

      {/* Manual: Cambiar sombrero â€” paso 2: elegir cartas a descartar */}
      {modal?.type === 'manual_cambiar_discard' && (() => {
        const cost = Math.ceil(human.hand.length / 2);
        const sel = modal.selected;
        const remaining = cost - sel.length;
        return (
          <Modal title={`🎩 ${T('changeHat') || 'Cambiar sombrero'} a ${T(modal.hatLang)} — paso 3: elegir cartas`}>
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
              <Btn
                onClick={() => setModal((human.mainHats?.length || 0) > 1
                  ? { type: 'manual_cambiar_target', hatLang: modal.hatLang }
                  : { type: 'manual_cambiar' })}
                color="#333"
                style={{ color: '#aaa' }}
              >
                {T('goBack')}
              </Btn>
              <Btn
                onClick={() => resolveManualCambiar(modal.hatLang, modal.selected, modal.replaceIdx ?? 0)}
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
           {tutorialActive && tutorialStep === 4 && tutorialHatHintText ? (
              <div style={{
                marginBottom: 12,
                padding: '10px 12px',
              borderRadius: 12,
              border: tutorialRecommendedHatLang ? `1px solid ${LANG_BORDER[tutorialRecommendedHatLang]}88` : '1px solid rgba(255,215,0,0.25)',
              background: 'rgba(255,215,0,0.08)',
              color: '#fff3bf',
              fontSize: 12,
              fontWeight: 800,
              lineHeight: 1.35,
            }}>
              {tutorialHatHintText}
            </div>
          ) : null}
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












