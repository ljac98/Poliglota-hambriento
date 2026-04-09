import React from 'react';
import { clearAuth } from '../../src/api.js';
import { AuthScreen } from './AuthScreen.jsx';
import { FriendsScreen } from './FriendsScreen.jsx';
import { GameOverScreen } from './GameOverScreen.jsx';
import { HistoryScreen } from './HistoryScreen.jsx';
import { LeftRoomScreen } from './LeftRoomScreen.jsx';
import { DownloadAppScreen } from './DownloadAppScreen.jsx';
import { OnlineLobby } from './OnlineLobby.jsx';
import { OnlineMenu } from './OnlineMenu.jsx';
import { ProfileScreen } from './ProfileScreen.jsx';
import { ReconnectingScreen } from './ReconnectingScreen.jsx';
import { SetupScreen } from './SetupScreen.jsx';
import { TransitionScreen } from './TransitionScreen.jsx';
import { UnlockedWordsScreen } from './UnlockedWordsScreen.jsx';

export function AppPhaseRouter({
  phase,
  T,
  roomCode,
  user,
  uiLang,
  handleSetLang,
  installEntryVisible,
  installEntryTitle,
  installEntryDesc,
  installEntryButton,
  openInstallPrompt,
  downloadUrl,
  downloadReturnPhase,
  setDownloadReturnPhase,
  profileUserId,
  profilePreview,
  profileReturnPhase,
  historyInitialFilter,
  historyReturnPhase,
  wordsReturnPhase,
  openProfile,
  onProfileBack,
  openHistory,
  openWords,
  inviteToast,
  friendReqToast,
  setUser,
  handleAuthSuccess,
  setPhase,
  startGame,
  startTutorialGame,
  socket,
  setInviteJoinCode,
  inviteJoinCode,
  onlineMenuTab,
  initialSalaCode,
  setIsOnline,
  setIsHost,
  setMyPlayerIdx,
  setMyRoomPlayerName,
  setRoomCode,
  setRoomIsPublic,
  setRoomDisplayName,
  setLobbyPlayers,
  saveRoomSession,
  lobbyPlayers,
  myPlayerIdx,
  myRoomPlayerName,
  isHost,
  roomIsPublic,
  roomDisplayName,
  startOnlineGame,
  clearRoomSession,
  players,
  HI,
  cp,
  extraPlay,
  winner,
  isOnline,
  onLeftRoomReturn,
  onLeftRoomLeave,
  isTutorial,
  tutorialWinText,
  onTutorialFinish,
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
        onAuth={(nextUser, meta) => {
          if (handleAuthSuccess) handleAuthSuccess(nextUser, meta);
          else { setUser(nextUser); setPhase('setup'); }
        }}
        onGuest={() => setPhase('setup')}
        onDownload={() => { setDownloadReturnPhase('auth'); setPhase('download'); }}
        T={T}
        uiLang={uiLang}
        onLangChange={handleSetLang}
        installEntryVisible={installEntryVisible}
        installEntryTitle={installEntryTitle}
        installEntryDesc={installEntryDesc}
        installEntryButton={installEntryButton}
        onOpenInstallPrompt={openInstallPrompt}
      />
    );
  }

  if (phase === 'download') {
    return (
      <DownloadAppScreen
        uiLang={uiLang}
        downloadUrl={downloadUrl}
        installEntryVisible={installEntryVisible}
        installEntryButton={installEntryButton}
        onOpenInstallPrompt={openInstallPrompt}
        onBack={() => setPhase(downloadReturnPhase || (user ? 'setup' : 'auth'))}
      />
    );
  }

  if (phase === 'history' && user) {
    return <>{inviteToast}{friendReqToast}<HistoryScreen user={user} initialFilter={historyInitialFilter} onBack={() => setPhase(historyReturnPhase || 'setup')} T={T} /></>;
  }

  if (phase === 'words') {
    return <>{inviteToast}{friendReqToast}<UnlockedWordsScreen user={user} onBack={() => setPhase(wordsReturnPhase || (user ? 'setup' : 'auth'))} T={T} /></>;
  }

  if (phase === 'friends' && user) {
    return <>{inviteToast}{friendReqToast}<FriendsScreen user={user} onBack={() => setPhase('setup')} T={T} onOpenProfile={(id) => openProfile(id, 'friends')} /></>;
  }

  if (phase === 'profile' && profileUserId) {
    return (
      <>
        {inviteToast}
        {friendReqToast}
        <ProfileScreen
          profileUserId={profileUserId}
          initialProfilePreview={profilePreview}
          user={user}
          T={T}
          onUserUpdate={setUser}
          onOpenProfile={(id) => openProfile(id, 'profile')}
          onOpenHistory={(filter) => openHistory(filter, 'profile')}
          onOpenWords={() => openWords('profile')}
          onBack={onProfileBack}
          onOpenFriends={() => setPhase(user ? 'friends' : 'auth')}
        />
      </>
    );
  }

  if (phase === 'setup') {
    return (
      <>{inviteToast}{friendReqToast}
        <SetupScreen
          onStart={startGame}
          onStartTutorial={startTutorialGame}
          onOnline={() => setPhase('onlineMenu')}
          onDownload={() => { setDownloadReturnPhase('setup'); setPhase('download'); }}
          user={user}
          onLogout={() => { clearAuth(); setUser(null); setPhase('auth'); }}
          onHistory={() => openHistory('all', 'setup')}
          onWords={() => openWords('setup')}
          onFriends={() => { socket.connect(); setPhase('friends'); }}
          T={T}
          installEntryVisible={installEntryVisible}
          installEntryTitle={installEntryTitle}
          installEntryDesc={installEntryDesc}
          installEntryButton={installEntryButton}
          onOpenInstallPrompt={openInstallPrompt}
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
          initialTab={onlineMenuTab}
          onBack={() => { setInviteJoinCode(''); setPhase('setup'); }}
          onDownload={() => { setDownloadReturnPhase('onlineMenu'); setPhase('download'); }}
          T={T}
          installEntryVisible={installEntryVisible}
          installEntryTitle={installEntryTitle}
          installEntryDesc={installEntryDesc}
          installEntryButton={installEntryButton}
          onOpenInstallPrompt={openInstallPrompt}
          onCreated={(name, code, pub, rn) => {
            setIsOnline(true);
            setIsHost(true);
            setMyPlayerIdx(0);
            setMyRoomPlayerName(name);
            setRoomCode(code);
            setRoomIsPublic(!!pub);
            setRoomDisplayName(rn || '');
            setLobbyPlayers([{ name, idx: 0, userId: user?.id || null, username: user?.username || null, avatarUrl: user?.avatarUrl || null }]);
            saveRoomSession({ roomCode: code, playerName: name, myPlayerIdx: 0, isHost: true, phase: 'onlineLobby' });
            setPhase('onlineLobby');
          }}
          onJoined={(name, code, myIdx, pub, rn) => {
            setIsOnline(true);
            setIsHost(false);
            setMyPlayerIdx(myIdx);
            setMyRoomPlayerName(name);
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
          myName={myRoomPlayerName || lobbyPlayers[myPlayerIdx]?.name || ''}
          isHost={isHost}
          players={lobbyPlayers}
          isPublic={roomIsPublic}
          roomDisplayName={roomDisplayName}
          T={T}
          user={user}
          onOpenProfile={(id) => openProfile(id, 'onlineLobby')}
          onLocalHatPick={(playerName, hat) => {
            setLobbyPlayers((prev) => prev.map((player) => (
              player.name === playerName ? { ...player, hat } : player
            )));
          }}
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
    return (
      <TransitionScreen
        player={players[cp] || players[HI]}
        onContinue={() => setPhase('playing')}
        isExtraPlay={extraPlay}
        isCurrentUserTurn={cp === HI}
        T={T}
      />
    );
  }

  if (phase === 'gameover') {
    return (
      <GameOverScreen
        winner={winner}
        players={players}
        user={user}
        T={T}
        isTutorial={isTutorial}
        tutorialWinText={tutorialWinText}
        onRestart={() => {
          if (isTutorial && onTutorialFinish) {
            onTutorialFinish();
            return;
          }
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
        onHistory={() => openHistory('all', 'setup')}
      />
    );
  }

  return null;
}
