import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { WebView } from 'react-native-webview';
import { HomeScreen } from './src/screens/HomeScreen';
import { NativeGameScreen } from './src/screens/NativeGameScreen';
import { NativeOnlineScreen } from './src/screens/NativeOnlineScreen';
import { NativeSetupScreen } from './src/screens/NativeSetupScreen';
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
  return {
    mode: setup.gameMode,
    burgerCount: setup.burgerCount,
    ingredientCount: setup.ingredientCount,
    chaosLevel: setup.chaosLevel,
    ingredientPool: setup.ingredientPool,
  };
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [loadingGame, setLoadingGame] = useState(true);
  const [setupState, setSetupState] = useState(DEFAULT_SETUP);
  const [onlineState, setOnlineState] = useState(DEFAULT_ONLINE);
  const [gameSession, setGameSession] = useState(DEFAULT_GAME_SESSION);
  const gameUrl = useMemo(() => Constants.expoConfig?.extra?.gameUrl || FALLBACK_URL, []);
  const socketRef = useRef(null);
  const setupRef = useRef(DEFAULT_SETUP);
  const onlineRef = useRef(DEFAULT_ONLINE);

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
    const handleConnect = () => {
      setOnlineState((prev) => ({ ...prev, status: 'Conectado al servidor.', error: '' }));
    };
    const handleDisconnect = () => {
      setOnlineState((prev) => ({ ...prev, status: 'Desconectado del servidor.' }));
    };
    const handleRoomCreated = ({ code, isPublic, roomName }) => {
      const currentSetup = setupRef.current;
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
      setOnlineState((prev) => ({ ...prev, hatPicks: { ...prev.hatPicks, [playerName]: hat } }));
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
      const nextHatPicks = hatPicks || currentOnline.hatPicks || {};
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
      setGameSession({
        roomCode: currentOnline.roomCode,
        roomName: currentOnline.roomName,
        players: nextPlayers,
        hatPicks: nextHatPicks,
        gameConfig: gameConfig || buildGameConfig(currentSetup),
        startedAt: Date.now(),
        liveState: null,
      });
      setCurrentScreen('nativeGame');
    };
    const handleStateUpdate = ({ state }) => {
      if (!state) return;
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
    const handleBecameHost = () => {
      setOnlineState((prev) => ({ ...prev, isHost: true, status: 'Ahora eres host de la sala.' }));
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
    socket.on('becameHost', handleBecameHost);

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
      socket.off('becameHost', handleBecameHost);
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
    socket.emit('lobbyHatPick', { code: onlineState.roomCode, playerName: setupState.playerName, hat: setupState.hat });
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
    setGameSession(DEFAULT_GAME_SESSION);
    setOnlineState(DEFAULT_ONLINE);
    setCurrentScreen('nativeOnline');
  }

  function pickHat(hat) {
    setSetupState((prev) => ({ ...prev, hat }));
    if (!onlineState.roomCode) return;
    setOnlineState((prev) => ({ ...prev, hatPicks: { ...prev.hatPicks, [setupState.playerName]: hat } }));
    socket.emit('lobbyHatPick', { code: onlineState.roomCode, playerName: setupState.playerName, hat });
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
    socket.emit('startGame', { code: onlineState.roomCode, hatPicks, gameConfig });
  }

  function goToWebGame() {
    setLoadingGame(true);
    setCurrentScreen('web');
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
