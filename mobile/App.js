import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { WebView } from 'react-native-webview';
import { HomeScreen } from './src/screens/HomeScreen';
import { NativeGameScreen } from './src/screens/NativeGameScreen';
import { NativeOnlineScreen } from './src/screens/NativeOnlineScreen';
import { NativeSetupScreen } from './src/screens/NativeSetupScreen';
import {
  advanceBurger,
  applyMass,
  buildGameConfig as buildNativeGameConfig,
  canPlayCard,
  clone,
  createHostGameState,
  drawN,
  filterTable,
  getActionInfo,
  ingKey,
  normalizeActionPayload,
} from './src/lib/nativeGameEngine';
import {
  normalizeHatPicksToGame,
  normalizeHatPicksToUi,
  toGameHat,
  toUiHat,
} from './src/lib/gameMapping';
import { createMobileSocket } from './src/lib/socket';

const FALLBACK_URL = 'https://hungry-poly.up.railway.app';
const DEFAULT_SETUP = {
  playerName: 'Mobile Player',
  roomName: 'Hungry Mobile',
  isPublic: true,
  hat: 'espanol',
  gameMode: 'clon',
  burgerCount: 2,
  ingredientCount: 5,
  ingredientPool: ['lettuce', 'tomato', 'beef', 'cheese', 'chicken', 'egg', 'onion', 'avocado'],
  chaosLevel: 2,
  aiCount: 2,
};
const DEFAULT_ONLINE = {
  tab: 'create',
  rooms: [],
  players: [],
  roomCode: '',
  roomName: '',
  isPublic: false,
  isHost: false,
  myIdx: 0,
  hatPicks: {},
  error: '',
  status: '',
  loading: false,
  started: false,
};
const DEFAULT_GAME_SESSION = {
  roomCode: '',
  roomName: '',
  players: [],
  hatPicks: {},
  gameConfig: null,
  startedAt: 0,
  liveState: null,
};

function buildGameConfig(setup) {
  return buildNativeGameConfig(setup);
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [loadingGame, setLoadingGame] = useState(true);
  const [setupState, setSetupState] = useState(DEFAULT_SETUP);
  const [onlineState, setOnlineState] = useState(DEFAULT_ONLINE);
  const [gameSession, setGameSession] = useState(DEFAULT_GAME_SESSION);
  const [chatMessages, setChatMessages] = useState([]);
  const gameUrl = useMemo(() => Constants.expoConfig?.extra?.gameUrl || FALLBACK_URL, []);
  const socketRef = useRef(null);
  const setupRef = useRef(DEFAULT_SETUP);
  const onlineRef = useRef(DEFAULT_ONLINE);
  const gameSessionRef = useRef(DEFAULT_GAME_SESSION);
  const hostStateRef = useRef(null);
  const pendingNegMetaRef = useRef(null);

  if (!socketRef.current) {
    socketRef.current = createMobileSocket(gameUrl);
  }
  const socket = socketRef.current;

  useEffect(() => {
    setupRef.current = setupState;
  }, [setupState]);

  useEffect(() => {
    onlineRef.current = onlineState;
  }, [onlineState]);

  useEffect(() => {
    gameSessionRef.current = gameSession;
  }, [gameSession]);

  function addHostLog(state, playerIdx, text) {
    state.log = [...(state.log || []), { playerIdx, text, at: Date.now() }].slice(-80);
  }

  function setLiveState(nextLiveState, sessionPatch = {}) {
    hostStateRef.current = nextLiveState;
    setGameSession((prev) => {
      const next = { ...prev, ...sessionPatch, liveState: nextLiveState };
      gameSessionRef.current = next;
      return next;
    });
  }

  function emitHostSync(nextState) {
    const currentOnline = onlineRef.current;
    if (!currentOnline.isHost || !currentOnline.roomCode || !nextState) return;
    socket.emit('syncState', {
      code: currentOnline.roomCode,
      state: nextState,
    });
  }

  function commitHostState(nextState, sessionPatch = {}) {
    setLiveState(nextState, sessionPatch);
    emitHostSync(nextState);
    if (nextState?.winner) {
      setOnlineState((prev) => ({
        ...prev,
        status: `Ganador: ${nextState.winner?.name || 'Jugador'}.`,
      }));
    }
  }

  function finishHostTurn(baseState, fromIdx) {
    const nextState = clone(baseState);
    const player = nextState.players[fromIdx];
    const needed = Math.max(0, (player.maxHand || 6) - player.hand.length);
    if (needed > 0) {
      const { drawn, deck, discard } = drawN(nextState.deck, nextState.discard, needed);
      nextState.deck = deck;
      nextState.discard = discard;
      nextState.players[fromIdx].hand.push(...drawn);
    }
    const winner = nextState.players.find((item) => item.currentBurger >= item.totalBurgers) || null;
    nextState.pendingNeg = null;
    nextState.modal = null;
    nextState.extraPlay = false;
    pendingNegMetaRef.current = null;
    if (winner) {
      nextState.winner = { name: winner.name, idx: winner.idx };
      nextState.phase = 'gameover';
      commitHostState(nextState);
      return nextState;
    }
    nextState.cp = (fromIdx + 1) % nextState.players.length;
    commitHostState(nextState);
    return nextState;
  }

  function cancelWithNegation(negatorIdx) {
    const state = hostStateRef.current;
    const meta = pendingNegMetaRef.current;
    if (!state || !meta) return;
    const nextState = clone(state);
    const actingPlayer = nextState.players[meta.actingIdx];
    const actionCardIdx = actingPlayer.hand.findIndex((card) => card.id === meta.card.id);
    if (actionCardIdx !== -1) {
      const [actionCard] = actingPlayer.hand.splice(actionCardIdx, 1);
      nextState.discard.push(actionCard);
    }
    const negator = nextState.players[negatorIdx];
    const negationIdx = negator.hand.findIndex((card) => card.action === 'negacion');
    if (negationIdx !== -1) {
      const [negationCard] = negator.hand.splice(negationIdx, 1);
      nextState.discard.push(negationCard);
    }
    addHostLog(nextState, negatorIdx, `Uso negacion contra ${actingPlayer.name}.`);
    finishHostTurn(nextState, meta.actingIdx);
  }

  function applyTargetedAction(nextState, actingIdx, targetIdx, action, card) {
    const targetPlayer = nextState.players[targetIdx];
    const actingPlayer = nextState.players[actingIdx];
    if (!targetPlayer || !actingPlayer) return false;
    if (card.action === 'gloton') {
      targetPlayer.table.forEach((ingredient) => {
        nextState.discard.push({ type: 'ingredient', ingredient: ingKey(ingredient), id: `m${Date.now()}${Math.random()}` });
      });
      targetPlayer.table = [];
      finishHostTurn(nextState, actingIdx);
      return true;
    }
    if (card.action === 'tenedor' && action.ingIdx != null) {
      const stolen = targetPlayer.table.splice(action.ingIdx, 1)[0];
      if (!stolen) return false;
      actingPlayer.table.push(stolen);
      const result = advanceBurger(actingPlayer);
      nextState.players[actingIdx] = result.player;
      if (result.done) {
        result.freed.forEach((ingredient) => {
          nextState.discard.push({ type: 'ingredient', ingredient: ingKey(ingredient), id: `m${Date.now()}${Math.random()}` });
        });
      }
      finishHostTurn(nextState, actingIdx);
      return true;
    }
    if (card.action === 'ladron') {
      if ((targetPlayer.mainHats || []).length > 0) {
        const [stolenHat] = targetPlayer.mainHats.splice(0, 1);
        actingPlayer.mainHats.push(stolenHat);
        if (targetPlayer.mainHats.length > 0) {
          targetPlayer.maxHand = Math.min(6, (targetPlayer.maxHand || 6) + 1);
        }
        if (targetPlayer.mainHats.length === 0 && (targetPlayer.perchero || []).length > 0) {
          nextState.modal = { type: 'pickHatReplace', victimIdx: targetIdx, fromIdx: actingIdx };
          nextState.pendingNeg = null;
          pendingNegMetaRef.current = null;
          commitHostState(nextState);
          return true;
        }
      }
      finishHostTurn(nextState, actingIdx);
      return true;
    }
    if (card.action === 'intercambio_sombreros') {
      const myHatIdx = actingPlayer.mainHats.indexOf(action.myHat);
      const theirHatIdx = targetPlayer.mainHats.indexOf(action.theirHat);
      if (myHatIdx === -1 || theirHatIdx === -1) return false;
      const [myHat] = actingPlayer.mainHats.splice(myHatIdx, 1);
      const [theirHat] = targetPlayer.mainHats.splice(theirHatIdx, 1);
      actingPlayer.mainHats.push(theirHat);
      targetPlayer.mainHats.push(myHat);
      finishHostTurn(nextState, actingIdx);
      return true;
    }
    if (card.action === 'intercambio_hamburguesa') {
      const tmp = actingPlayer.table;
      actingPlayer.table = targetPlayer.table;
      targetPlayer.table = tmp;
      filterTable(actingPlayer, nextState.discard);
      filterTable(targetPlayer, nextState.discard);
      finishHostTurn(nextState, actingIdx);
      return true;
    }
    return false;
  }

  function resolvePendingNegation() {
    const state = hostStateRef.current;
    const meta = pendingNegMetaRef.current;
    if (!state || !meta) return;
    const nextState = clone(state);
    const actingPlayer = nextState.players[meta.actingIdx];
    const actionCardIdx = actingPlayer.hand.findIndex((card) => card.id === meta.card.id);
    if (actionCardIdx === -1) {
      nextState.pendingNeg = null;
      pendingNegMetaRef.current = null;
      commitHostState(nextState);
      return;
    }
    const [actionCard] = actingPlayer.hand.splice(actionCardIdx, 1);
    nextState.discard.push(actionCard);
    nextState.pendingNeg = null;
    pendingNegMetaRef.current = null;
    if (meta.action.type === 'playMass') {
      const result = applyMass(nextState.players, nextState.discard, actionCard.action, meta.actingIdx);
      nextState.players = result.players;
      nextState.discard = result.discard;
      finishHostTurn(nextState, meta.actingIdx);
      return;
    }
    if (meta.action.type === 'playActionTarget') {
      applyTargetedAction(nextState, meta.actingIdx, meta.action.targetIdx, meta.action, actionCard);
    }
  }

  function openNegationWindow(baseState, actingIdx, card, action, affectedIdxs) {
    const eligibleIdxs = baseState.players
      .map((_, index) => index)
      .filter((index) => (
        index !== actingIdx
        && baseState.players[index].hand.some((handCard) => handCard.action === 'negacion')
        && (!affectedIdxs || affectedIdxs.includes(index))
      ));
    if (eligibleIdxs.length === 0) {
      pendingNegMetaRef.current = { actingIdx, card, action };
      resolvePendingNegation();
      return;
    }
    const nextState = clone(baseState);
    nextState.pendingNeg = {
      actingIdx,
      cardInfo: getActionInfo(card.action),
      eligibleIdxs,
      responses: {},
    };
    pendingNegMetaRef.current = { actingIdx, card, action };
    commitHostState(nextState);
  }

  function processHostAction(playerIdx, rawAction) {
    const action = normalizeActionPayload(rawAction);
    const state = hostStateRef.current;
    if (!state || !action?.type) return;
    const nextState = clone(state);
    const player = nextState.players[playerIdx];
    if (!player) return;
    const isTurnAction = !['negationResponse', 'pickHatReplace'].includes(action.type);
    if (nextState.pendingNeg && action.type !== 'negationResponse') return;
    if (nextState.modal?.type === 'pickHatReplace' && action.type !== 'pickHatReplace') return;
    if (isTurnAction && playerIdx !== nextState.cp) return;
    if (nextState.winner) return;

    if (action.type === 'negationResponse') {
      if (!state.pendingNeg?.eligibleIdxs?.includes(playerIdx)) return;
      if (state.pendingNeg.responses && playerIdx in state.pendingNeg.responses) return;
      if (action.negar) {
        cancelWithNegation(playerIdx);
        return;
      }
      nextState.pendingNeg.responses = { ...(nextState.pendingNeg.responses || {}), [playerIdx]: false };
      commitHostState(nextState);
      const remaining = nextState.pendingNeg.eligibleIdxs.filter((index) => !(index in nextState.pendingNeg.responses));
      if (remaining.length === 0) {
        resolvePendingNegation();
      }
      return;
    }

    if (action.type === 'pickHatReplace') {
      if (state.modal?.type !== 'pickHatReplace' || state.modal.victimIdx !== playerIdx) return;
      const hatIdx = player.perchero.indexOf(action.hatLang);
      if (hatIdx === -1) return;
      player.perchero.splice(hatIdx, 1);
      player.mainHats.push(action.hatLang);
      nextState.modal = null;
      finishHostTurn(nextState, state.modal.fromIdx ?? playerIdx);
      return;
    }

    if (nextState.extraPlay && !['playIngredient', 'playWildcard', 'discard', 'passTurn'].includes(action.type)) return;

    if (action.type === 'playIngredient') {
      const card = player.hand[action.cardIdx];
      if (!card || card.type !== 'ingredient' || card.ingredient === 'perrito' || !canPlayCard(player, card)) return;
      player.hand.splice(action.cardIdx, 1);
      player.table.push(card.ingredient);
      nextState.discard.push(card);
      const result = advanceBurger(player);
      nextState.players[playerIdx] = result.player;
      if (result.done) {
        result.freed.forEach((ingredient) => {
          nextState.discard.push({ type: 'ingredient', ingredient: ingKey(ingredient), id: `m${Date.now()}${Math.random()}` });
        });
      }
      finishHostTurn(nextState, playerIdx);
      return;
    }

    if (action.type === 'playWildcard') {
      const card = player.hand[action.cardIdx];
      if (!card || card.type !== 'ingredient' || card.ingredient !== 'perrito' || !action.ingredient) return;
      player.hand.splice(action.cardIdx, 1);
      player.table.push(`perrito|${action.ingredient}`);
      nextState.discard.push(card);
      const result = advanceBurger(player);
      nextState.players[playerIdx] = result.player;
      if (result.done) {
        result.freed.forEach((ingredient) => {
          nextState.discard.push({ type: 'ingredient', ingredient: ingKey(ingredient), id: `m${Date.now()}${Math.random()}` });
        });
      }
      finishHostTurn(nextState, playerIdx);
      return;
    }

    if (action.type === 'discard') {
      const card = player.hand[action.cardIdx];
      if (!card) return;
      player.hand.splice(action.cardIdx, 1);
      nextState.discard.push(card);
      finishHostTurn(nextState, playerIdx);
      return;
    }

    if (action.type === 'playMass') {
      const card = player.hand[action.cardIdx];
      if (!card || card.type !== 'action') return;
      openNegationWindow(nextState, playerIdx, card, action);
      return;
    }

    if (action.type === 'playActionTarget') {
      const card = player.hand[action.cardIdx];
      if (!card || card.type !== 'action' || action.targetIdx == null) return;
      openNegationWindow(nextState, playerIdx, card, action, [action.targetIdx]);
      return;
    }

    if (action.type === 'playBasurero') {
      const card = player.hand[action.cardIdx];
      if (!card || card.type !== 'action') return;
      player.hand.splice(action.cardIdx, 1);
      nextState.discard.push(card);
      const foundIdx = nextState.discard.findIndex((discardCard) => discardCard.id === action.pickedCardId && discardCard.type === 'ingredient');
      if (foundIdx !== -1) {
        const [rescued] = nextState.discard.splice(foundIdx, 1);
        player.hand.push(rescued);
      }
      finishHostTurn(nextState, playerIdx);
      return;
    }

    if (action.type === 'manualCambiar') {
      const hatIdx = player.perchero.indexOf(action.hatLang);
      if (hatIdx === -1) return;
      const required = Math.ceil(player.hand.length / 2);
      const cardIndices = Array.isArray(action.cardIndices) ? [...action.cardIndices] : [];
      if (cardIndices.length !== required) return;
      const uniqueSorted = [...new Set(cardIndices)].sort((a, b) => b - a);
      if (uniqueSorted.length !== required) return;
      const discarded = uniqueSorted.map((index) => player.hand.splice(index, 1)[0]).filter(Boolean);
      if (discarded.length !== required) return;
      const [newHat] = player.perchero.splice(hatIdx, 1);
      const oldHat = player.mainHats[0];
      player.mainHats[0] = newHat;
      if (oldHat) player.perchero.push(oldHat);
      nextState.discard.push(...discarded);
      nextState.extraPlay = true;
      commitHostState(nextState);
      return;
    }

    if (action.type === 'manualAgregar') {
      const hatIdx = player.perchero.indexOf(action.hatLang);
      if (hatIdx === -1) return;
      const [hatLang] = player.perchero.splice(hatIdx, 1);
      player.mainHats.push(hatLang);
      player.manuallyAddedHats = [...(player.manuallyAddedHats || []), hatLang];
      nextState.discard.push(...player.hand);
      player.hand = [];
      player.maxHand = Math.max(1, (player.maxHand || 6) - 1);
      const { drawn, deck, discard } = drawN(nextState.deck, nextState.discard, player.maxHand);
      player.hand = drawn;
      nextState.deck = deck;
      nextState.discard = discard;
      nextState.extraPlay = true;
      commitHostState(nextState);
      return;
    }

    if (action.type === 'passTurn') {
      finishHostTurn(nextState, playerIdx);
    }
  }

  useEffect(() => {
    const handleConnect = () => {
      setOnlineState((prev) => ({ ...prev, status: 'Conectado al servidor.', error: '' }));
    };
    const handleDisconnect = () => {
      setOnlineState((prev) => ({ ...prev, status: 'Desconectado del servidor.' }));
    };
    const handleRoomCreated = ({ code, isPublic, roomName }) => {
      const currentSetup = setupRef.current;
      setChatMessages([]);
      setGameSession(DEFAULT_GAME_SESSION);
      setOnlineState((prev) => ({
        ...prev,
        roomCode: code,
        roomName: roomName || currentSetup.roomName,
        isPublic: !!isPublic,
        isHost: true,
        myIdx: 0,
        players: [{ name: currentSetup.playerName, idx: 0, host: true }],
        hatPicks: { ...prev.hatPicks, [currentSetup.playerName]: currentSetup.hat },
        loading: false,
        error: '',
        status: `Sala ${code} creada.`,
        started: false,
      }));
    };
    const handleRoomJoined = ({ code, myIdx, isPublic, roomName }) => {
      setChatMessages([]);
      setGameSession(DEFAULT_GAME_SESSION);
      setOnlineState((prev) => ({
        ...prev,
        roomCode: code,
        roomName: roomName || '',
        isPublic: !!isPublic,
        isHost: false,
        myIdx,
        loading: false,
        error: '',
        status: `Unido a la sala ${code}.`,
        started: false,
      }));
    };
    const handleLobbyUpdate = ({ players }) => {
      setOnlineState((prev) => ({
        ...prev,
        players: (players || []).map((player) => ({
          ...player,
          host: player.idx === 0,
        })),
      }));
    };
    const handleHatPick = ({ playerName, hat }) => {
      setOnlineState((prev) => ({ ...prev, hatPicks: { ...prev.hatPicks, [playerName]: toUiHat(hat) } }));
    };
    const handleJoinError = (message) => {
      setOnlineState((prev) => ({ ...prev, loading: false, error: message || 'No se pudo entrar a la sala.' }));
    };
    const handleLobbyListUpdate = (rooms) => {
      setOnlineState((prev) => ({ ...prev, rooms: rooms || [] }));
    };
    const handleGameStarted = ({ hatPicks, gameConfig, players }) => {
      const currentSetup = setupRef.current;
      const currentOnline = onlineRef.current;
      const nextHatPicks = normalizeHatPicksToUi(hatPicks || currentOnline.hatPicks || {});
      const nextPlayers = (players || currentOnline.players || []).map((player) => ({
        ...player,
        host: player.idx === 0,
      }));

      setOnlineState((prev) => ({
        ...prev,
        loading: false,
        started: true,
        players: nextPlayers,
        status: `Partida iniciada: ${gameConfig?.mode || 'clon'}.`,
        hatPicks: nextHatPicks,
      }));
      const baseSession = {
        roomCode: currentOnline.roomCode,
        roomName: currentOnline.roomName,
        players: nextPlayers,
        hatPicks: nextHatPicks,
        gameConfig: gameConfig || buildGameConfig(currentSetup),
        startedAt: Date.now(),
        liveState: null,
      };
      setGameSession(baseSession);
      gameSessionRef.current = baseSession;
      if (currentOnline.isHost) {
        const hostLiveState = createHostGameState({
          players: nextPlayers,
          hatPicks: normalizeHatPicksToGame(hatPicks || currentOnline.hatPicks || { [currentSetup.playerName]: currentSetup.hat }),
          gameConfig: gameConfig || buildGameConfig(currentSetup),
        });
        commitHostState(hostLiveState, baseSession);
      } else {
        hostStateRef.current = null;
      }
      setCurrentScreen('nativeGame');
    };
    const handleStateUpdate = ({ state }) => {
      if (!state) return;
      if (onlineRef.current.isHost) {
        hostStateRef.current = state;
      }
      setGameSession((prev) => ({
        ...prev,
        liveState: state,
      }));
      if (state.winner) {
        setOnlineState((prev) => ({
          ...prev,
          status: `Ganador: ${state.winner?.name || 'Jugador'}.`,
        }));
      }
    };
    const handleChatMessage = (msg) => {
      if (!msg) return;
      setChatMessages((prev) => [...prev, msg].slice(-80));
    };
    const handleBecameHost = () => {
      setOnlineState((prev) => ({ ...prev, isHost: true, status: 'Ahora eres host de la sala.' }));
      if (gameSessionRef.current?.liveState) {
        hostStateRef.current = clone(gameSessionRef.current.liveState);
      }
    };
    const handleRemoteAction = ({ playerIdx, action }) => {
      if (!onlineRef.current.isHost) return;
      processHostAction(playerIdx, action);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('roomCreated', handleRoomCreated);
    socket.on('roomJoined', handleRoomJoined);
    socket.on('lobbyUpdate', handleLobbyUpdate);
    socket.on('lobbyHatPick', handleHatPick);
    socket.on('joinError', handleJoinError);
    socket.on('lobbyListUpdate', handleLobbyListUpdate);
    socket.on('gameStarted', handleGameStarted);
    socket.on('stateUpdate', handleStateUpdate);
    socket.on('chatMessage', handleChatMessage);
    socket.on('becameHost', handleBecameHost);
    socket.on('remoteAction', handleRemoteAction);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('roomCreated', handleRoomCreated);
      socket.off('roomJoined', handleRoomJoined);
      socket.off('lobbyUpdate', handleLobbyUpdate);
      socket.off('lobbyHatPick', handleHatPick);
      socket.off('joinError', handleJoinError);
      socket.off('lobbyListUpdate', handleLobbyListUpdate);
      socket.off('gameStarted', handleGameStarted);
      socket.off('stateUpdate', handleStateUpdate);
      socket.off('chatMessage', handleChatMessage);
      socket.off('becameHost', handleBecameHost);
      socket.off('remoteAction', handleRemoteAction);
      socket.disconnect();
    };
  }, [socket]);

  useEffect(() => {
    if (currentScreen !== 'nativeOnline' || onlineState.roomCode || onlineState.tab !== 'lobby') return undefined;
    socket.connect();
    socket.emit('joinLobbyBrowser');
    socket.emit('listRooms', (rooms) => {
      setOnlineState((prev) => ({ ...prev, rooms: rooms || [] }));
    });
    const timer = setInterval(() => {
      socket.emit('listRooms', (rooms) => {
        setOnlineState((prev) => ({ ...prev, rooms: rooms || [] }));
      });
    }, 4000);
    return () => {
      clearInterval(timer);
      socket.emit('leaveLobbyBrowser');
    };
  }, [currentScreen, onlineState.roomCode, onlineState.tab, socket]);

  useEffect(() => {
    if (!onlineState.roomCode || !setupState.playerName || !setupState.hat) return;
    setOnlineState((prev) => {
      if (prev.hatPicks[setupState.playerName] === setupState.hat) return prev;
      return { ...prev, hatPicks: { ...prev.hatPicks, [setupState.playerName]: setupState.hat } };
    });
    socket.emit('lobbyHatPick', { code: onlineState.roomCode, playerName: setupState.playerName, hat: toGameHat(setupState.hat) });
  }, [onlineState.roomCode, setupState.playerName, setupState.hat, socket]);

  const setupSummary = `${setupState.playerName} - ${setupState.gameMode} - ${setupState.burgerCount} burgers`;

  function ensureConnected() {
    if (!socket.connected) socket.connect();
  }

  function createRoom() {
    if (!setupState.playerName.trim()) {
      Alert.alert('Falta nombre', 'Pon tu nombre antes de crear la sala.');
      return;
    }
    ensureConnected();
    setOnlineState((prev) => ({ ...prev, loading: true, error: '', status: 'Creando sala...' }));
    socket.emit('createRoom', {
      playerName: setupState.playerName.trim(),
      isPublic: setupState.isPublic,
      roomName: setupState.roomName.trim(),
    });
  }

  function joinByCode(code) {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!setupState.playerName.trim() || !cleanCode) {
      Alert.alert('Datos incompletos', 'Necesitas nombre y codigo de sala.');
      return;
    }
    ensureConnected();
    setOnlineState((prev) => ({ ...prev, loading: true, error: '', status: `Uniendose a ${cleanCode}...` }));
    socket.emit('joinRoom', { code: cleanCode, playerName: setupState.playerName.trim() });
  }

  function joinPublicRoom(code) {
    joinByCode(code);
  }

  function refreshRooms() {
    ensureConnected();
    socket.emit('listRooms', (rooms) => {
      setOnlineState((prev) => ({ ...prev, rooms: rooms || [], status: 'Lobby actualizado.' }));
    });
  }

  function leaveRoom() {
    socket.emit('leaveRoom');
    socket.disconnect();
    setChatMessages([]);
    setGameSession(DEFAULT_GAME_SESSION);
    gameSessionRef.current = DEFAULT_GAME_SESSION;
    setOnlineState(DEFAULT_ONLINE);
    setCurrentScreen('nativeOnline');
    hostStateRef.current = null;
    pendingNegMetaRef.current = null;
  }

  function pickHat(hat) {
    setSetupState((prev) => ({ ...prev, hat }));
    if (!onlineState.roomCode) return;
    setOnlineState((prev) => ({ ...prev, hatPicks: { ...prev.hatPicks, [setupState.playerName]: hat } }));
    socket.emit('lobbyHatPick', { code: onlineState.roomCode, playerName: setupState.playerName, hat: toGameHat(hat) });
  }

  function startRoom() {
    if (!onlineState.isHost || !onlineState.roomCode) return;
    const hatPicks = { ...onlineState.hatPicks, [setupState.playerName]: setupState.hat };
    const missingHat = onlineState.players.find((player) => !hatPicks[player.name]);
    if (missingHat) {
      Alert.alert('Falta un sombrero', `${missingHat.name} todavia no eligio sombrero.`);
      return;
    }
    const gameConfig = buildGameConfig(setupState);
    setOnlineState((prev) => ({ ...prev, loading: true, error: '', status: 'Enviando startGame real...' }));
    socket.emit('startGame', { code: onlineState.roomCode, hatPicks: normalizeHatPicksToGame(hatPicks), gameConfig });
  }

  function goToWebGame() {
    setLoadingGame(true);
    setCurrentScreen('web');
  }

  function sendNativeChat(text) {
    const clean = (text || '').trim();
    if (!clean || !onlineState.roomCode) return;
    const playerName = setupState.playerName || 'Jugador';
    socket.emit('chatMessage', { code: onlineState.roomCode, playerName, text: clean });
  }

  function sendNativeAction(action) {
    if (!onlineState.roomCode || !action?.type) return;
    if (onlineState.isHost) {
      processHostAction(onlineState.myIdx, action);
      return;
    }
    socket.emit('playerAction', { code: onlineState.roomCode, action });
  }

  if (currentScreen === 'web') {
    return (
      <SafeAreaView style={styles.webviewScreen}>
        <StatusBar barStyle="light-content" />
        <View style={styles.webviewHeader}>
          <Pressable onPress={() => setCurrentScreen('home')} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Volver</Text>
          </Pressable>
          <Text style={styles.webviewTitle}>Hungry Poly Mobile</Text>
          <Pressable onPress={() => Linking.openURL(gameUrl)} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Abrir web</Text>
          </Pressable>
        </View>
        <View style={styles.webviewWrap}>
          {loadingGame && (
            <View style={styles.loaderOverlay}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loaderText}>Cargando partida...</Text>
            </View>
          )}
          <WebView
            source={{ uri: gameUrl }}
            style={styles.webview}
            startInLoadingState
            javaScriptEnabled
            domStorageEnabled
            setSupportMultipleWindows={false}
            onLoadEnd={() => setLoadingGame(false)}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (currentScreen === 'nativeSetup') {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="light-content" />
        <View style={styles.headerBar}>
          <Pressable onPress={() => setCurrentScreen('home')} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Volver</Text></Pressable>
          <Text style={styles.webviewTitle}>Setup nativo</Text>
          <Pressable onPress={() => setCurrentScreen('nativeOnline')} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Online</Text></Pressable>
        </View>
        <NativeSetupScreen
          setup={setupState}
          onChangeSetup={(patch) => setSetupState((prev) => ({ ...prev, ...patch }))}
          onContinueOnline={() => setCurrentScreen('nativeOnline')}
          onOpenWebGame={goToWebGame}
        />
      </SafeAreaView>
    );
  }

  if (currentScreen === 'nativeOnline') {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="light-content" />
        <View style={styles.headerBar}>
          <Pressable onPress={() => setCurrentScreen('home')} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Volver</Text></Pressable>
          <Text style={styles.webviewTitle}>Online nativo</Text>
          <Pressable onPress={() => setCurrentScreen('nativeSetup')} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Setup</Text></Pressable>
        </View>
        <NativeOnlineScreen
          setup={setupState}
          online={onlineState}
          onChangeOnline={(patch) => setOnlineState((prev) => ({ ...prev, ...patch }))}
          onCreateRoom={createRoom}
          onJoinByCode={joinByCode}
          onJoinPublicRoom={joinPublicRoom}
          onRefreshRooms={refreshRooms}
          onLeaveRoom={leaveRoom}
          onPickHat={pickHat}
          onStartRoom={startRoom}
          onOpenWebGame={goToWebGame}
        />
      </SafeAreaView>
    );
  }

  if (currentScreen === 'nativeGame') {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="light-content" />
        <View style={styles.headerBar}>
          <Pressable onPress={() => setCurrentScreen('nativeOnline')} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Lobby</Text></Pressable>
          <Text style={styles.webviewTitle}>Partida nativa</Text>
          <Pressable onPress={goToWebGame} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Juego web</Text></Pressable>
        </View>
        <NativeGameScreen
          setup={setupState}
          online={onlineState}
          gameSession={gameSession}
          chatMessages={chatMessages}
          onSendChat={sendNativeChat}
          onSendAction={sendNativeAction}
          onBackToLobby={() => setCurrentScreen('nativeOnline')}
          onOpenWebGame={goToWebGame}
          onLeaveRoom={leaveRoom}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <HomeScreen
        setupSummary={setupSummary}
        onOpenNativeSetup={() => setCurrentScreen('nativeSetup')}
        onOpenNativeOnline={() => setCurrentScreen('nativeOnline')}
        onOpenWebGame={goToWebGame}
        onOpenWebsite={() => Linking.openURL(gameUrl)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f1117' },
  webviewScreen: { flex: 1, backgroundColor: '#0f1117' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,215,0,0.15)',
  },
  webviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,215,0,0.15)',
  },
  webviewTitle: { color: '#FFD700', fontSize: 18, fontWeight: '800' },
  webviewWrap: { flex: 1, position: 'relative' },
  webview: { flex: 1, backgroundColor: '#0f1117' },
  loaderOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f1117', gap: 12 },
  loaderText: { color: '#d8ddf3', fontSize: 16, fontWeight: '600' },
  secondaryButton: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  secondaryButtonText: { color: '#d8ddf3', fontWeight: '700', fontSize: 13 },
});
