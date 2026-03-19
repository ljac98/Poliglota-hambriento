import React from 'react';
import { clearAuth } from '../../src/api.js';
import { AuthScreen } from './AuthScreen.jsx';
import { FriendsScreen } from './FriendsScreen.jsx';
import { GameOverScreen } from './GameOverScreen.jsx';
import { HistoryScreen } from './HistoryScreen.jsx';
import { LeftRoomScreen } from './LeftRoomScreen.jsx';
import { OnlineLobby } from './OnlineLobby.jsx';
import { OnlineMenu } from './OnlineMenu.jsx';
import { ReconnectingScreen } from './ReconnectingScreen.jsx';
import { SetupScreen } from './SetupScreen.jsx';
import { TransitionScreen } from './TransitionScreen.jsx';

export function AppPhaseRouter({
  phase,
  T,
  roomCode,
  user,
  uiLang,
  handleSetLang,
  inviteToast,
  friendReqToast,
  setUser,
  setPhase,
  startGame,
  socket,
  setInviteJoinCode,
  inviteJoinCode,
  initialSalaCode,
  setIsOnline,
  setIsHost,
  setMyPlayerIdx,
  setRoomCode,
  setRoomIsPublic,
  setRoomDisplayName,
  setLobbyPlayers,
  saveRoomSession,
  lobbyPlayers,
  myPlayerIdx,
  isHost,
  roomIsPublic,
  roomDisplayName,
  startOnlineGame,
  clearRoomSession,
  players,
  HI,
  extraPlay,
  winner,
  isOnline,
  onLeftRoomReturn,
  onLeftRoomLeave,
}) {
  if (phase === 'reconnecting') {
    return <ReconnectingScreen T={T} />;
  }

  if (phase === 'leftRoom') {
    return <LeftRoomScreen T={T} roomCode={roomCode} onReturn={onLeftRoomReturn} onLeave={onLeftRoomLeave} />;
  }

  if (phase === 'auth') {
    return (
      <AuthScreen
        onAuth={(nextUser) => { setUser(nextUser); setPhase('setup'); }}
        onGuest={() => setPhase('setup')}
        T={T}
        uiLang={uiLang}
        onLangChange={handleSetLang}
      />
    );
  }

  if (phase === 'history' && user) {
    return <>{inviteToast}{friendReqToast}<HistoryScreen user={user} onBack={() => setPhase('setup')} T={T} /></>;
  }

  if (phase === 'friends' && user) {
    return <>{inviteToast}{friendReqToast}<FriendsScreen user={user} onBack={() => setPhase('setup')} T={T} /></>;
  }

  if (phase === 'setup') {
    return (
      <>{inviteToast}{friendReqToast}
        <SetupScreen
          onStart={startGame}
          onOnline={() => setPhase('onlineMenu')}
          user={user}
          onLogout={() => { clearAuth(); setUser(null); setPhase('auth'); }}
          onHistory={() => setPhase('history')}
          onFriends={() => { socket.connect(); setPhase('friends'); }}
          T={T}
        />
      </>
    );
  }

  if (phase === 'onlineMenu') {
    return (
      <>{friendReqToast}
        <OnlineMenu
          user={user}
          initialCode={inviteJoinCode || initialSalaCode}
          onBack={() => { setInviteJoinCode(''); setPhase('setup'); }}
          T={T}
          onCreated={(name, code, pub, rn) => {
            setIsOnline(true);
            setIsHost(true);
            setMyPlayerIdx(0);
            setRoomCode(code);
            setRoomIsPublic(!!pub);
            setRoomDisplayName(rn || '');
            setLobbyPlayers([{ name, idx: 0 }]);
            saveRoomSession({ roomCode: code, playerName: name, myPlayerIdx: 0, isHost: true, phase: 'onlineLobby' });
            setPhase('onlineLobby');
          }}
          onJoined={(name, code, myIdx, pub, rn) => {
            setIsOnline(true);
            setIsHost(false);
            setMyPlayerIdx(myIdx);
            setRoomCode(code);
            setRoomIsPublic(!!pub);
            setRoomDisplayName(rn || '');
            setLobbyPlayers([]);
            saveRoomSession({ roomCode: code, playerName: name, myPlayerIdx: myIdx, isHost: false, phase: 'onlineLobby' });
            socket.once('lobbyUpdate', ({ players: pls }) => setLobbyPlayers(pls));
            socket.once('gameStarted', () => {
              saveRoomSession({ roomCode: code, playerName: name, myPlayerIdx: myIdx, isHost: false, phase: 'playing' });
              setPhase('playing');
            });
            setPhase('onlineLobby');
          }}
        />
      </>
    );
  }

  if (phase === 'onlineLobby') {
    return (
      <>{friendReqToast}
        <OnlineLobby
          roomCode={roomCode}
          myName={lobbyPlayers[myPlayerIdx]?.name || ''}
          isHost={isHost}
          players={lobbyPlayers}
          isPublic={roomIsPublic}
          roomDisplayName={roomDisplayName}
          T={T}
          user={user}
          onStart={(hatPicks, gameConfig) => {
            if (isHost) startOnlineGame(hatPicks, gameConfig, lobbyPlayers);
          }}
          onBack={() => {
            socket.emit('leaveRoom');
            socket.disconnect();
            setIsOnline(false);
            setIsHost(false);
            setMyPlayerIdx(0);
            setRoomCode('');
            setRoomIsPublic(false);
            setRoomDisplayName('');
            setLobbyPlayers([]);
            clearRoomSession();
            setPhase('setup');
          }}
        />
      </>
    );
  }

  if (phase === 'transition') {
    return <TransitionScreen player={players[HI]} onContinue={() => setPhase('playing')} isExtraPlay={extraPlay} T={T} />;
  }

  if (phase === 'gameover') {
    return (
      <GameOverScreen
        winner={winner}
        players={players}
        user={user}
        T={T}
        onRestart={() => {
          if (isOnline) {
            socket.emit('leaveRoom');
            socket.disconnect();
            setIsOnline(false);
            setIsHost(false);
            setMyPlayerIdx(0);
            setRoomCode('');
            setRoomIsPublic(false);
            setRoomDisplayName('');
            setLobbyPlayers([]);
          }
          clearRoomSession();
          setPhase('setup');
        }}
        onHistory={() => setPhase('history')}
      />
    );
  }

  return null;
}
